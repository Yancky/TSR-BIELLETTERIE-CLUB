/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BookingOrder,
  Bus,
  Company,
  ScheduledDeparture,
  Station,
  Trip,
  User
} from '../types';
import { AuditService } from './auditService';
import { PermissionService } from './permissionService';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Service de modélisation et de validation des relations de données
 * Garantit l'intégrité référentielle et les règles métier pour :
 * - Company (Sociétés de transport)
 * - Station (Gares et agences)
 * - Trip (Trajets / Liaisons commerciales pérennes)
 * - ScheduledDeparture (Départs programmés / Occurrences calendaires)
 */
export class DataRelationsService {
  /**
   * Valide les coordonnées GPS d'une gare (latitude [-90, 90], longitude [-180, 180])
   */
  public static isValidCoordinates(lat?: number, lng?: number): boolean {
    if (lat === undefined || lng === undefined) return true; // Coordonnées GPS facultatives
    if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) return false;
    if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) return false;
    return true;
  }

  /**
   * 1. VALIDATION DE L'ENTITÉ COMPANY
   */
  public static validateCompany(company: Partial<Company>): ValidationResult {
    const errors: string[] = [];

    if (!company.id || company.id.trim().length === 0) {
      errors.push("L'identifiant unique de la société est obligatoire.");
    }
    if (!company.name || company.name.trim().length < 3) {
      errors.push("La raison sociale officielle doit comporter au moins 3 caractères.");
    }
    if (!company.tradeName || company.tradeName.trim().length < 2) {
      errors.push("L'enseigne commerciale de la société est obligatoire.");
    }
    if (!company.managerName || company.managerName.trim().length < 2) {
      errors.push("Le nom du responsable légal est obligatoire.");
    }
    if (!company.managerEmail || !company.managerEmail.includes('@')) {
      errors.push("L'adresse email du responsable est invalide ou manquante.");
    }
    if (!company.phone || company.phone.trim().length < 6) {
      errors.push("Le numéro de téléphone professionnel est obligatoire.");
    }
    if (!company.headquarters || company.headquarters.trim().length < 3) {
      errors.push("L'adresse du siège social de la société est obligatoire.");
    }
    if (!company.status || !['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'].includes(company.status)) {
      errors.push("Le statut de validation de la société est invalide.");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 2. VALIDATION DE L'ENTITÉ STATION (GARE)
   * Règle : Une société possède ses propres gares.
   */
  public static validateStation(
    station: Partial<Station>,
    existingCompanies: Company[]
  ): ValidationResult {
    const errors: string[] = [];

    if (!station.id || station.id.trim().length === 0) {
      errors.push("L'identifiant de la gare est obligatoire.");
    }
    if (!station.companyId || station.companyId.trim().length === 0) {
      errors.push("L'association de la gare à une société (companyId) est obligatoire.");
    } else {
      const parentCompany = existingCompanies.find(c => c.id === station.companyId);
      if (!parentCompany) {
        errors.push(`La société référencée '${station.companyId}' n'existe pas.`);
      }
    }

    if (!station.name || station.name.trim().length < 3) {
      errors.push("Le nom de la gare doit comporter au moins 3 caractères.");
    }
    if (!station.city || station.city.trim().length < 2) {
      errors.push("La ville d'implantation de la gare est obligatoire.");
    }
    if (!station.address || station.address.trim().length < 3) {
      errors.push("L'adresse physique de la gare est obligatoire.");
    }

    if (!this.isValidCoordinates(station.latitude, station.longitude)) {
      errors.push("Les coordonnées GPS de la gare sont invalides (lat [-90,90], lng [-180,180]).");
    }

    if (!station.status || !['ACTIVE', 'INACTIVE', 'MAINTENANCE'].includes(station.status)) {
      errors.push("Le statut opérationnel de la gare est invalide.");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 3. VALIDATION DE L'ENTITÉ TRIP (TRAJET / LIGNE COMMERCIALE PÉRENNE)
   * Règles :
   * - Un trajet référence une gare de départ et une gare d'arrivée valides.
   * - La gare de départ et la gare d'arrivée doivent être différentes.
   * - Les gares doivent appartenir au réseau de la société ou être partenaires.
   */
  public static validateTrip(
    trip: Partial<Trip>,
    existingStations: Station[],
    existingCompanies: Company[]
  ): ValidationResult {
    const errors: string[] = [];

    if (!trip.id || trip.id.trim().length === 0) {
      errors.push("L'identifiant du trajet est obligatoire.");
    }
    if (!trip.companyId || trip.companyId.trim().length === 0) {
      errors.push("La société opératrice du trajet est obligatoire.");
    } else {
      const company = existingCompanies.find(c => c.id === trip.companyId);
      if (!company) {
        errors.push(`La société référencée '${trip.companyId}' est introuvable.`);
      }
    }

    const depStationId = trip.departureStationId || trip.departureAgencyId;
    const arrStationId = trip.arrivalStationId || trip.arrivalAgencyId;

    if (!depStationId) {
      errors.push("La gare de départ (departureStationId) est obligatoire.");
    }
    if (!arrStationId) {
      errors.push("La gare d'arrivée (arrivalStationId) est obligatoire.");
    }

    if (depStationId && arrStationId) {
      if (depStationId === arrStationId) {
        errors.push("La gare de départ et la gare d'arrivée doivent être distinctes.");
      }

      const depStation = existingStations.find(s => s.id === depStationId);
      if (!depStation) {
        errors.push(`La gare de départ '${depStationId}' est introuvable dans le réseau.`);
      } else if (trip.companyId && depStation.companyId !== trip.companyId) {
        errors.push(`Violation d'intégrité réseau : La gare de départ '${depStation.name}' appartient à une autre société (${depStation.companyId}).`);
      }

      const arrStation = existingStations.find(s => s.id === arrStationId);
      if (!arrStation) {
        errors.push(`La gare d'arrivée '${arrStationId}' est introuvable dans le réseau.`);
      }
    }

    if (trip.departureCity && trip.destinationCity) {
      if (trip.departureCity.trim().toLowerCase() === trip.destinationCity.trim().toLowerCase()) {
        errors.push("La ville de départ et la destination doivent être différentes.");
      }
    }

    if (trip.estimatedDurationMinutes !== undefined && trip.estimatedDurationMinutes <= 0) {
      errors.push("La durée estimée du trajet doit être strictement positive.");
    }

    if (!trip.status || !['ACTIVE', 'SUSPENDED', 'INACTIVE'].includes(trip.status)) {
      errors.push("Le statut du trajet est invalide.");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 4. VALIDATION DE L'ENTITÉ SCHEDULED DEPARTURE (DÉPART PROGRAMMÉ / OCCURRENCE)
   * Règles :
   * - Séparation stricte entre Trajet et Départ programmé.
   * - Plusieurs départs peuvent appartenir au même trajet.
   * - Seules les sociétés autorisées et actives (ACTIVE) peuvent publier des départs.
   * - Le véhicule assigné doit appartenir à la société et être actif.
   * - Le tarif en XOF doit être un entier strictement positif.
   * - Capacité strictement positive.
   */
  public static validateScheduledDeparture(
    departure: Partial<ScheduledDeparture>,
    existingTrips: Trip[],
    existingCompanies: Company[],
    existingBuses: Bus[]
  ): ValidationResult {
    const errors: string[] = [];

    if (!departure.id || departure.id.trim().length === 0) {
      errors.push("L'identifiant du départ programmé est obligatoire.");
    }

    // 1. Liaison obligatoire avec la société
    if (!departure.companyId || departure.companyId.trim().length === 0) {
      errors.push("La société opératrice (companyId) est obligatoire.");
    } else {
      const company = existingCompanies.find(c => c.id === departure.companyId);
      if (!company) {
        errors.push(`La société référencée '${departure.companyId}' est introuvable.`);
      } else if (company.status !== 'ACTIVE') {
        errors.push(`Action interdite : La société a le statut '${company.status}'. Seules les sociétés actives et agréées peuvent publier des départs.`);
      }
    }

    // 2. Liaison obligatoire avec le trajet parent (Trip)
    const tripId = departure.tripId || departure.routeId;
    if (!tripId) {
      errors.push("La référence au trajet parent (tripId) est obligatoire.");
    } else {
      const parentTrip = existingTrips.find(t => t.id === tripId);
      if (!parentTrip) {
        errors.push(`Le trajet parent référencé '${tripId}' est introuvable.`);
      } else if (departure.companyId && parentTrip.companyId !== departure.companyId) {
        errors.push(`Violation d'intégrité : Le départ appartient à '${departure.companyId}' mais son trajet parent est rattaché à '${parentTrip.companyId}'.`);
      } else if (parentTrip.status !== 'ACTIVE') {
        errors.push(`Le trajet parent est en statut '${parentTrip.status}' et ne peut accueillir de nouveaux départs.`);
      }
    }

    // 3. Format Date et Heure
    const dateStr = departure.departureDate || departure.date;
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      errors.push("La date de départ doit respecter le format ISO 'YYYY-MM-DD'.");
    }

    if (!departure.departureTime || !/^\d{2}:\d{2}$/.test(departure.departureTime)) {
      errors.push("L'heure de départ doit respecter le format 'HH:mm'.");
    }

    const arrTime = departure.estimatedArrivalTime || departure.arrivalTime;
    if (arrTime && !/^\d{2}:\d{2}$/.test(arrTime)) {
      errors.push("L'heure d'arrivée estimée doit respecter le format 'HH:mm'.");
    }

    // 4. Validation du véhicule assigné (si présent)
    const vehicleId = departure.vehicleId || departure.busId;
    if (vehicleId) {
      const bus = existingBuses.find(b => b.id === vehicleId);
      if (!bus) {
        errors.push(`Le véhicule référencé '${vehicleId}' est introuvable dans la flotte.`);
      } else {
        if (departure.companyId && bus.companyId !== departure.companyId) {
          errors.push(`Violation d'isolation de flotte : Le car ${bus.registrationNumber} appartient à une autre société.`);
        }
        if (bus.status !== 'ACTIVE') {
          errors.push(`Véhicule indisponible : Le car ${bus.registrationNumber} est en statut '${bus.status}'.`);
        }
      }
    }

    // 5. Capacité de sièges
    const capacity = departure.seatCapacity || departure.totalSeats;
    if (capacity === undefined || capacity <= 0 || !Number.isInteger(capacity)) {
      errors.push("La capacité de places doit être un nombre entier strictement positif.");
    }

    // 6. Validation du tarif en XOF (FCFA)
    const fare = departure.price !== undefined ? departure.price : departure.priceXOF;
    if (fare === undefined || fare <= 0 || !Number.isInteger(fare)) {
      errors.push("Le tarif doit être un montant entier strictement positif en Francs CFA (XOF).");
    }

    if (departure.currency && departure.currency !== 'XOF') {
      errors.push("La devise obligatoire est le Franc CFA (XOF).");
    }

    // 7. Statut du départ
    if (
      !departure.status ||
      !['DRAFT', 'SCHEDULED', 'PUBLISHED', 'BOARDING', 'FULL', 'DEPARTED', 'COMPLETED', 'CANCELLED'].includes(
        departure.status
      )
    ) {
      errors.push("Le statut du départ programmé est invalide.");
    }

    // 8. Période de réservation
    if (departure.bookingOpeningTime && departure.bookingClosingTime) {
      const openTime = new Date(departure.bookingOpeningTime).getTime();
      const closeTime = new Date(departure.bookingClosingTime).getTime();
      if (isNaN(openTime) || isNaN(closeTime)) {
        errors.push("Les périodes de réservation doivent être des dates ISO 8601 valides.");
      } else if (openTime > closeTime) {
        errors.push("L'heure d'ouverture des réservations doit être antérieure à l'heure de clôture.");
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 5. GESTION DES TARIFS ET INSTANTANÉ FINANCIER IMMUABLE
   * Règle obligatoire :
   * - Le prix appliqué à une réservation correspond au tarif confirmé du départ au moment de la commande.
   * - Une modification ultérieure du tarif d'un départ ne change JAMAIS le montant des réservations déjà confirmées.
   * - Les réservations existantes conservent leur historique financier scellé.
   */
  public static verifyBookingFinancialSnapshot(
    booking: BookingOrder,
    originalDeparture: ScheduledDeparture
  ): {
    isPristine: boolean;
    recordedUnitPrice: number;
    currentDeparturePrice: number;
    hasPriceDrift: boolean;
  } {
    const departurePrice = originalDeparture.price !== undefined ? originalDeparture.price : originalDeparture.priceXOF;
    const recordedPrice = booking.unitPriceXOF || booking.unitPriceXof;
    const hasPriceDrift = departurePrice !== recordedPrice;

    return {
      isPristine: true, // La réservation conserve son snapshot quoi qu'il arrive
      recordedUnitPrice: recordedPrice,
      currentDeparturePrice: departurePrice,
      hasPriceDrift
    };
  }

  /**
   * Journalise une modification de tarif de départ avec traçabilité complète
   */
  public static logPriceChange(
    actor: User,
    departureId: string,
    companyId: string,
    oldPrice: number,
    newPrice: number
  ): void {
    if (actor.role === 'ADMIN') {
      PermissionService.assertAccess(actor, 'ADMIN_SUPERVISION_ALL');
    } else {
      PermissionService.assertAccess(actor, 'TRIP_UPDATE_OWN', { targetCompanyId: companyId });
    }

    if (newPrice <= 0 || !Number.isInteger(newPrice)) {
      throw new Error("Le nouveau tarif doit être un entier strictement positif en Francs CFA (XOF).");
    }

    AuditService.log({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'DEPARTURE_PRICE_UPDATED',
      resourceType: 'DEPARTURE',
      resourceId: departureId,
      companyId,
      result: 'SUCCESS',
      details: {
        oldPriceXOF: oldPrice,
        newPriceXOF: newPrice,
        currency: 'XOF',
        notice: 'Les réservations confirmées antérieures conservent leur tarif historique scellé.'
      }
    });
  }
}
