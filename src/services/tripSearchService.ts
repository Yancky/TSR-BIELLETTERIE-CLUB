/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DepartureTrip, TripSearchQuery, TripSortOption } from '../types';
import { CompanyService } from './companyService';
import { TripService } from './tripService';
import { SeatAvailabilityService } from './seatAvailabilityService';
import { AuditService } from './auditService';
import { BURKINA_CITIES } from './mockData';

export const MAX_PASSENGERS_PER_BOOKING = 10;

export interface TripSearchResultItem {
  trip: DepartureTrip;
  companyName: string;
  companyLogoUrl?: string;
  availableSeatsCount: number;
  isBookable: boolean;
  durationMinutes: number;
  formattedDuration: string;
}

export interface TripSearchResponse {
  query: TripSearchQuery;
  totalFound: number;
  results: TripSearchResultItem[];
  availableCities: string[];
}

export class TripSearchService {
  /**
   * Valide les critères de recherche de trajet
   */
  public static validateQuery(query: TripSearchQuery): { valid: boolean; error?: string } {
    if (!query.originCity || query.originCity.trim() === '') {
      return { valid: false, error: 'La ville de départ est obligatoire.' };
    }
    if (!query.destinationCity || query.destinationCity.trim() === '') {
      return { valid: false, error: 'La ville d\'arrivée est obligatoire.' };
    }

    const normOrigin = query.originCity.trim().toLowerCase();
    const normDest = query.destinationCity.trim().toLowerCase();

    if (normOrigin === normDest) {
      return { valid: false, error: 'La ville de départ et la ville de destination doivent être distinctes.' };
    }

    if (!query.departureDate || !/^\d{4}-\d{2}-\d{2}$/.test(query.departureDate)) {
      return { valid: false, error: 'Format de date invalide. Format attendu : YYYY-MM-DD.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (query.departureDate < todayStr) {
      return { valid: false, error: 'La date de départ ne peut pas être antérieure à la date du jour.' };
    }

    if (!query.passengerCount || query.passengerCount < 1) {
      return { valid: false, error: 'Le nombre de voyageurs doit être d\'au moins 1 personne.' };
    }

    if (query.passengerCount > MAX_PASSENGERS_PER_BOOKING) {
      return {
        valid: false,
        error: `Le nombre de voyageurs ne peut pas dépasser la limite de ${MAX_PASSENGERS_PER_BOOKING} places par réservation.`
      };
    }

    if (query.maxPriceXof !== undefined && query.maxPriceXof <= 0) {
      return { valid: false, error: 'Le tarif maximal doit être un montant positif en Francs CFA.' };
    }

    return { valid: true };
  }

  /**
   * Calcule la durée estimée entre deux heures au format "HH:mm"
   */
  public static calculateDurationMinutes(depTime: string, arrTime: string): number {
    const [dh, dm] = depTime.split(':').map(Number);
    const [ah, am] = arrTime.split(':').map(Number);
    let totalMinutes = (ah * 60 + am) - (dh * 60 + dm);
    if (totalMinutes <= 0) {
      // Arrivée le lendemain
      totalMinutes += 24 * 60;
    }
    return totalMinutes;
  }

  public static formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return `${h}h`;
    return `${h}h${m.toString().padStart(2, '0')}`;
  }

  /**
   * Moteur de recherche de trajets
   */
  public static search(query: TripSearchQuery): TripSearchResponse {
    const validation = this.validateQuery(query);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const normOrigin = query.originCity.trim().toLowerCase();
    const normDest = query.destinationCity.trim().toLowerCase();

    // 1. Récupérer tous les départs depuis le service TripService
    const allTrips = TripService.getAllTrips();

    // 2. Filtrer selon les règles de gestion et d'autorité
    const matchingTrips = allTrips.filter(trip => {
      // Correspondance des villes
      if (trip.departureCity.toLowerCase() !== normOrigin) return false;
      if (trip.destinationCity.toLowerCase() !== normDest) return false;

      // Correspondance de la date
      if (trip.date !== query.departureDate) return false;

      // Statut du trajet : seuls PUBLISHED et SCHEDULED sont réservables
      if (trip.status !== 'PUBLISHED' && trip.status !== 'SCHEDULED') {
        return false;
      }

      // Statut de la compagnie : SEULES les compagnies ACTIVE sont admises
      const company = CompanyService.getCompanyById(trip.companyId);
      if (!company || company.status !== 'ACTIVE') {
        return false;
      }

      // Filtre optionnel : Tarif max
      if (query.maxPriceXof && trip.priceXOF > query.maxPriceXof) {
        return false;
      }

      // Filtre optionnel : Plage horaire de départ
      if (query.departureTimeRange) {
        const [depH] = trip.departureTime.split(':').map(Number);
        if (depH < query.departureTimeRange.startHour || depH > query.departureTimeRange.endHour) {
          return false;
        }
      }

      // Filtre optionnel : Commodités
      if (query.amenities && query.amenities.length > 0) {
        const hasAllAmenities = query.amenities.every(reqAmenity =>
          trip.amenities.some(a => a.toLowerCase().includes(reqAmenity.toLowerCase()))
        );
        if (!hasAllAmenities) return false;
      }

      return true;
    });

    // 3. Calculer la disponibilité réelle et faire l'enrichissement
    const results: TripSearchResultItem[] = matchingTrips.map(trip => {
      const company = CompanyService.getCompanyById(trip.companyId);
      const availableSeatsCount = SeatAvailabilityService.getAvailableSeatsCount(trip.id);
      const durationMinutes = this.calculateDurationMinutes(trip.departureTime, trip.arrivalTime);

      return {
        trip,
        companyName: company?.tradeName || company?.name || 'Compagnie Agréée',
        companyLogoUrl: company?.logoUrl,
        availableSeatsCount,
        isBookable: availableSeatsCount >= query.passengerCount,
        durationMinutes,
        formattedDuration: this.formatDuration(durationMinutes)
      };
    });

    // 4. Tri des résultats
    const sortBy = query.sortBy || 'PRICE_ASC';
    results.sort((a, b) => {
      switch (sortBy) {
        case 'PRICE_ASC':
          return a.trip.priceXOF - b.trip.priceXOF;
        case 'PRICE_DESC':
          return b.trip.priceXOF - a.trip.priceXOF;
        case 'TIME_ASC':
          return a.trip.departureTime.localeCompare(b.trip.departureTime);
        case 'DURATION_ASC':
          return a.durationMinutes - b.durationMinutes;
        default:
          return a.trip.priceXOF - b.trip.priceXOF;
      }
    });

    // 5. Journalisation d'audit de la recherche
    AuditService.log({
      actorId: 'anonymous_search',
      actorRole: 'TRAVELER',
      action: 'TRIP_SEARCH',
      resourceType: 'TRIP',
      result: 'SUCCESS',
      details: {
        origin: query.originCity,
        destination: query.destinationCity,
        date: query.departureDate,
        passengers: query.passengerCount,
        foundCount: results.length
      }
    });

    return {
      query,
      totalFound: results.length,
      results,
      availableCities: [...BURKINA_CITIES]
    };
  }
}
