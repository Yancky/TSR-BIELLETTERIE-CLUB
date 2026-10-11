/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DepartureTrip, Route, TripStatus, User } from '../types';
import { INITIAL_ROUTES, INITIAL_TRIPS } from './mockData';
import { CompanyService } from './companyService';
import { FleetService } from './fleetService';
import { PermissionService } from './permissionService';
import { AuditService } from './auditService';

export class TripService {
  private static routes: Map<string, Route> = new Map();
  private static trips: Map<string, DepartureTrip> = new Map();

  static {
    for (const r of INITIAL_ROUTES) {
      this.routes.set(r.id, { ...r });
    }
    for (const t of INITIAL_TRIPS) {
      this.trips.set(t.id, { ...t });
    }
  }

  /**
   * Convertit une heure "HH:mm" en minutes depuis minuit
   */
  private static parseTimeToMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  /**
   * Création d'un itinéraire
   */
  public static createRoute(
    actor: User,
    input: {
      companyId: string;
      departureCity: string;
      destinationCity: string;
      estimatedDurationMinutes: number;
      distanceKm?: number;
      stops?: string[];
    }
  ): Route {
    PermissionService.assertAccess(actor, 'TRIP_CREATE_OWN', { targetCompanyId: input.companyId });

    if (input.departureCity.toLowerCase() === input.destinationCity.toLowerCase()) {
      throw new Error('La ville de départ et la destination doivent être différentes.');
    }
    if (input.estimatedDurationMinutes <= 0) {
      throw new Error('La durée estimée doit être strictement positive.');
    }

    const id = `route_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newRoute: Route = {
      id,
      companyId: input.companyId,
      departureCity: input.departureCity,
      destinationCity: input.destinationCity,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      distanceKm: input.distanceKm,
      stops: input.stops || [],
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.routes.set(id, newRoute);
    return { ...newRoute };
  }

  /**
   * Programmation d'un départ journalier avec contrôles stricts de sécurité & de conflit
   */
  public static createDepartureTrip(
    actor: User,
    input: {
      companyId: string;
      routeId?: string;
      busId: string;
      departureCity: string;
      destinationCity: string;
      departureAgency: string;
      arrivalAgency: string;
      departureAgencyId?: string;
      arrivalAgencyId?: string;
      departureTime: string; // "HH:mm"
      arrivalTime: string;   // "HH:mm"
      date: string;          // "YYYY-MM-DD"
      priceXOF: number;      // Entier positif strict
      busType?: string;
      amenities?: string[];
      status?: TripStatus;
    }
  ): DepartureTrip {
    // 1. Contrôle d'autorisation RBAC & isolation compagnie
    PermissionService.assertAccess(actor, 'TRIP_CREATE_OWN', { targetCompanyId: input.companyId });

    // 2. Contrôle du statut de la compagnie : SEULE une compagnie ACTIVE peut publier un départ !
    const company = CompanyService.getCompanyById(input.companyId);
    if (!company) {
      throw new Error('Compagnie introuvable.');
    }
    if (company.status !== 'ACTIVE') {
      AuditService.log({
        actorId: actor.id,
        actorRole: actor.role,
        action: 'PERMISSION_DENIED',
        resourceType: 'TRIP',
        companyId: input.companyId,
        result: 'FAILURE',
        reason: `COMPANYS_NOT_ACTIVE: La compagnie est en statut ${company.status}. Seule une compagnie ACTIVE peut publier des départs.`
      });
      throw new Error(`Action interdite : La compagnie a le statut '${company.status}'. Seules les compagnies actives et agréées peuvent publier des départs.`);
    }

    // 3. Validation de cohérence des villes
    if (input.departureCity.toLowerCase() === input.destinationCity.toLowerCase()) {
      throw new Error('La ville de départ et la ville de destination doivent être distinctes.');
    }

    // 4. Validation stricte du tarif en XOF (entier strictement positif)
    if (!input.priceXOF || input.priceXOF <= 0 || !Number.isInteger(input.priceXOF)) {
      throw new Error('Le tarif doit être un montant entier positif exprimé en Francs CFA (XOF).');
    }

    // 5. Vérification du véhicule assigné
    const bus = FleetService.getBusById(input.busId);
    if (!bus) {
      throw new Error('Véhicule sélectionné introuvable dans la flotte.');
    }
    if (bus.companyId !== input.companyId) {
      throw new Error('Violation d\'isolation : Ce véhicule appartient à une autre compagnie.');
    }
    if (bus.status !== 'ACTIVE') {
      throw new Error(`Véhicule indisponible : Le car est actuellement en statut '${bus.status}' et ne peut être affecté à un départ.`);
    }

    // 6. Détection des chevauchements de planning pour ce même véhicule le même jour
    const newStartMinutes = this.parseTimeToMinutes(input.departureTime);
    const newEndMinutes = this.parseTimeToMinutes(input.arrivalTime);
    const TURNAROUND_BUFFER_MINUTES = 45; // Temps de repos/nettoyage minimum entre trajets

    const existingTripsOnSameBus = Array.from(this.trips.values()).filter(
      t => t.busId === input.busId && t.date === input.date && t.status !== 'CANCELLED'
    );

    for (const existing of existingTripsOnSameBus) {
      const existStart = this.parseTimeToMinutes(existing.departureTime);
      const existEnd = this.parseTimeToMinutes(existing.arrivalTime);

      // Chevauchement si [newStart, newEnd + buffer] intersecte [existStart, existEnd + buffer]
      const hasOverlap =
        (newStartMinutes >= existStart && newStartMinutes < existEnd + TURNAROUND_BUFFER_MINUTES) ||
        (newEndMinutes + TURNAROUND_BUFFER_MINUTES > existStart && newEndMinutes <= existEnd) ||
        (newStartMinutes <= existStart && newEndMinutes >= existEnd);

      if (hasOverlap) {
        throw new Error(
          `Conflit de rotation : Le car ${bus.registrationNumber} est déjà programmé sur le départ de ${existing.departureTime} à ${existing.arrivalTime} le ${input.date}.`
        );
      }
    }

    // 7. Enregistrement du départ
    const id = `trip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newTrip: DepartureTrip = {
      id,
      companyId: input.companyId,
      routeId: input.routeId,
      busId: input.busId,
      departureCity: input.departureCity,
      destinationCity: input.destinationCity,
      departureAgency: input.departureAgency,
      arrivalAgency: input.arrivalAgency,
      departureAgencyId: input.departureAgencyId,
      arrivalAgencyId: input.arrivalAgencyId,
      departureTime: input.departureTime,
      arrivalTime: input.arrivalTime,
      date: input.date,
      priceXOF: input.priceXOF,
      busType: input.busType || `${bus.brand} ${bus.category} ${bus.seatCapacity} Places`,
      amenities: input.amenities || bus.amenities,
      totalSeats: bus.seatCapacity,
      availableSeatsCount: bus.seatCapacity,
      status: input.status || 'PUBLISHED',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.trips.set(id, newTrip);

    AuditService.log({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'TRIP_CREATED',
      resourceType: 'TRIP',
      resourceId: id,
      companyId: input.companyId,
      result: 'SUCCESS',
      details: {
        departureCity: newTrip.departureCity,
        destinationCity: newTrip.destinationCity,
        time: newTrip.departureTime,
        priceXOF: newTrip.priceXOF
      }
    });

    return { ...newTrip };
  }

  /**
   * Annulation d'un départ avec motif obligatoire
   */
  public static cancelDepartureTrip(actor: User, tripId: string, mandatoryReason: string): DepartureTrip {
    const trip = this.trips.get(tripId);
    if (!trip) throw new Error('Départ introuvable.');

    PermissionService.assertAccess(actor, 'TRIP_CANCEL_OWN', { targetCompanyId: trip.companyId });
    if (!mandatoryReason || mandatoryReason.trim().length < 5) {
      throw new Error('Un motif d\'annulation détaillé est obligatoire.');
    }

    trip.status = 'CANCELLED';
    trip.cancellationReason = mandatoryReason.trim();
    trip.updatedAt = new Date().toISOString();

    AuditService.log({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'TRIP_CANCELLED',
      resourceType: 'TRIP',
      resourceId: trip.id,
      companyId: trip.companyId,
      result: 'WARNING',
      reason: mandatoryReason
    });

    return { ...trip };
  }

  /**
   * Recherche publique de départs (exclut automatiquement les départs de compagnies non actives)
   */
  public static searchTrips(filters: {
    departureCity?: string;
    destinationCity?: string;
    date?: string;
    minSeats?: number;
  }): DepartureTrip[] {
    // Obtenir la liste des IDs des compagnies ACTIVE
    const activeCompIds = new Set(CompanyService.getPublicActiveCompanies().map(c => c.id));

    return Array.from(this.trips.values()).filter(t => {
      // 1. Compagnie doit être ACTIVE
      if (!activeCompIds.has(t.companyId)) return false;

      // 2. Trajet non annulé
      if (t.status === 'CANCELLED' || t.status === 'DRAFT') return false;

      // 3. Filtre ville de départ
      if (filters.departureCity && t.departureCity.toLowerCase() !== filters.departureCity.toLowerCase()) {
        return false;
      }

      // 4. Filtre destination
      if (filters.destinationCity && t.destinationCity.toLowerCase() !== filters.destinationCity.toLowerCase()) {
        return false;
      }

      // 5. Filtre date
      if (filters.date && t.date !== filters.date) {
        return false;
      }

      // 6. Places disponibles
      if (filters.minSeats && t.availableSeatsCount < filters.minSeats) {
        return false;
      }

      return true;
    });
  }

  public static getTripsByCompany(companyId: string, actor?: User): DepartureTrip[] {
    if (actor && actor.role === 'COMPANY_MANAGER') {
      PermissionService.assertAccess(actor, 'TRIP_UPDATE_OWN', { targetCompanyId: companyId });
    }
    return Array.from(this.trips.values()).filter(t => t.companyId === companyId);
  }

  public static getTripById(tripId: string): DepartureTrip | null {
    const t = this.trips.get(tripId);
    return t ? { ...t } : null;
  }

  public static getAllTrips(): DepartureTrip[] {
    return Array.from(this.trips.values()).map(t => ({ ...t }));
  }

  public static updateTripStatus(
    actor: User,
    tripId: string,
    status: TripStatus,
    reason?: string
  ): DepartureTrip {
    const trip = this.trips.get(tripId);
    if (!trip) throw new Error('Départ introuvable.');
    trip.status = status;
    if (reason) trip.cancellationReason = reason;
    trip.updatedAt = new Date().toISOString();
    return { ...trip };
  }

  public static resetForTesting(): void {
    this.routes.clear();
    for (const r of INITIAL_ROUTES) {
      this.routes.set(r.id, { ...r });
    }
    this.trips.clear();
    for (const t of INITIAL_TRIPS) {
      this.trips.set(t.id, { ...t });
    }
  }
}
