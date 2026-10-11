/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookingOrder, BookingStatus, User } from '../types';
import { TripService } from './tripService';
import { SeatHoldService } from './seatHoldService';
import { AuditService } from './auditService';
import { validateBurkinaPhone } from './ticketSecurity';

export interface CreateBookingParams {
  seatHoldId: string;
  travelerId: string;
  passengerName: string;
  passengerPhone: string;
  idempotencyKey?: string;
}

export interface BookingResult {
  success: boolean;
  booking?: BookingOrder;
  error?: string;
  errorCode?: 'HOLD_EXPIRED' | 'HOLD_NOT_FOUND' | 'INVALID_INPUT' | 'UNAUTHORIZED' | 'IDEMPOTENCY_CONFLICT';
}

export class BookingService {
  private static bookings: Map<string, BookingOrder> = new Map();
  private static idempotencyRecords: Map<string, { bookingId: string; paramsHash: string; result: BookingResult }> = new Map();

  /**
   * Création d'une réservation provisoire à partir d'un verrou valide
   * Le tarif est EXCLUSIVEMENT calculé par le serveur
   */
  public static async createProvisionalBooking(params: CreateBookingParams): Promise<BookingResult> {
    const { seatHoldId, travelerId, passengerName, passengerPhone, idempotencyKey } = params;

    // 1. Contrôle d'idempotence
    if (idempotencyKey) {
      const existing = this.idempotencyRecords.get(idempotencyKey);
      if (existing) {
        const hash = `${seatHoldId}:${travelerId}:${passengerPhone}`;
        if (existing.paramsHash === hash) {
          return existing.result;
        } else {
          return {
            success: false,
            error: 'IDEMPOTENCY_CONFLICT: Clé déjà utilisée avec d\'autres paramètres.',
            errorCode: 'IDEMPOTENCY_CONFLICT'
          };
        }
      }
    }

    // 2. Validation des entrées
    if (!passengerName || passengerName.trim().length < 2) {
      return {
        success: false,
        error: 'Le nom complet du voyageur est obligatoire (au moins 2 caractères).',
        errorCode: 'INVALID_INPUT'
      };
    }

    if (!validateBurkinaPhone(passengerPhone)) {
      return {
        success: false,
        error: 'Le numéro de téléphone du passager doit être un numéro burkinabè valide (+226 ou 8 chiffres).',
        errorCode: 'INVALID_INPUT'
      };
    }

    // 3. Récupération et vérification du verrou
    const hold = SeatHoldService.getHoldById(seatHoldId);
    if (!hold) {
      return {
        success: false,
        error: 'Verrou de sièges introuvable. Veuillez sélectionner à nouveau vos sièges.',
        errorCode: 'HOLD_NOT_FOUND'
      };
    }

    if (hold.travelerId !== travelerId) {
      AuditService.log({
        actorId: travelerId,
        actorRole: 'TRAVELER',
        action: 'PERMISSION_DENIED',
        resourceType: 'BOOKING',
        resourceId: seatHoldId,
        result: 'FAILURE',
        reason: 'Tentative de réservation avec le verrou d\'un autre utilisateur.'
      });
      return {
        success: false,
        error: 'Ce verrou de sièges ne correspond pas à votre session.',
        errorCode: 'UNAUTHORIZED'
      };
    }

    if (hold.status !== 'ACTIVE' || new Date(hold.expiresAt).getTime() <= Date.now()) {
      return {
        success: false,
        error: 'Votre sélection a expiré (délai de 10 minutes écoulé). Veuillez sélectionner vos sièges à nouveau.',
        errorCode: 'HOLD_EXPIRED'
      };
    }

    // 4. Récupération du départ et calcul serveur strict du montant
    const trip = TripService.getTripById(hold.departureTripId);
    if (!trip) {
      return {
        success: false,
        error: 'Trajet introuvable pour ce départ.',
        errorCode: 'INVALID_INPUT'
      };
    }

    const passengerCount = hold.seatIds.length;
    const unitPriceXof = trip.priceXOF;
    // RÈGLE ABSOLUE : totalPriceXof = unitPriceXof × passengerCount calculé côté serveur
    const totalPriceXof = unitPriceXof * passengerCount;

    // 5. Génération des identifiants et références
    const nowIso = new Date().toISOString();
    const bookingId = `bk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const reference = `TSR-BK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const newBooking: BookingOrder = {
      id: bookingId,
      reference,
      bookingRef: reference,
      departureTripId: trip.id,
      tripId: trip.id,
      companyId: trip.companyId,
      travelerId,
      userId: travelerId,
      passengerName: passengerName.trim(),
      passengerPhone: passengerPhone.trim(),
      seatIds: [...hold.seatIds],
      selectedSeats: [...hold.seatIds],
      passengerCount,
      unitPriceXof,
      unitPriceXOF: unitPriceXof,
      totalPriceXof,
      totalAmountXOF: totalPriceXof,
      currency: 'XOF',
      status: 'HELD', // Réservation provisoire en attente de paiement
      seatHoldId: hold.id,
      lockExpiresAt: hold.expiresAt,
      expiresAt: hold.expiresAt,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.bookings.set(bookingId, newBooking);

    const result: BookingResult = {
      success: true,
      booking: { ...newBooking }
    };

    if (idempotencyKey) {
      this.idempotencyRecords.set(idempotencyKey, {
        bookingId,
        paramsHash: `${seatHoldId}:${travelerId}:${passengerPhone}`,
        result
      });
    }

    // Audit de création de réservation provisoire
    AuditService.log({
      actorId: travelerId,
      actorRole: 'TRAVELER',
      action: 'BOOKING_PROVISIONAL_CREATED',
      resourceType: 'BOOKING',
      resourceId: bookingId,
      companyId: trip.companyId,
      result: 'SUCCESS',
      details: {
        reference,
        departureTripId: trip.id,
        seatIds: hold.seatIds,
        totalPriceXof,
        expiresAt: hold.expiresAt
      }
    });

    return result;
  }

  /**
   * Récupération interne pour les services autoritaires (paiement, billetterie)
   */
  public static getBookingByIdInternal(bookingId: string): BookingOrder | undefined {
    return this.bookings.get(bookingId);
  }

  /**
   * Consultation sécurisée d'une réservation avec contrôle d'autorisation
   */
  public static getBookingById(bookingId: string, requestingUser?: User | null): BookingOrder | null {
    const booking = this.bookings.get(bookingId);
    if (!booking) return null;

    if (requestingUser) {
      // Voyageur : uniquement ses propres réservations
      if (requestingUser.role === 'TRAVELER' && booking.travelerId !== requestingUser.id) {
        AuditService.log({
          actorId: requestingUser.id,
          actorRole: requestingUser.role,
          action: 'PERMISSION_DENIED',
          resourceType: 'BOOKING',
          resourceId: bookingId,
          result: 'FAILURE',
          reason: 'PRIVACY_VIOLATION: Tentative de consultation d\'une réservation tierce.'
        });
        throw new Error('PRIVACY_VIOLATION: Vous ne pouvez pas accéder aux réservations d\'un autre voyageur.');
      }

      // Compagnie : uniquement les réservations de sa propre entreprise
      if (
        requestingUser.role === 'COMPANY_MANAGER' &&
        requestingUser.companyId &&
        booking.companyId !== requestingUser.companyId
      ) {
        throw new Error('ISOLATION_VIOLATION: Vous ne pouvez pas accéder aux réservations d\'une autre compagnie.');
      }
    }

    // Mettre à jour le statut si le verrou associé est expiré
    if (booking.status === 'HELD' && booking.lockExpiresAt) {
      if (new Date(booking.lockExpiresAt).getTime() <= Date.now()) {
        booking.status = 'EXPIRED';
        booking.updatedAt = new Date().toISOString();
      }
    }

    return { ...booking };
  }

  /**
   * Retourne les réservations d'un voyageur
   */
  public static getTravelerBookings(travelerId: string): BookingOrder[] {
    const results: BookingOrder[] = [];
    const now = Date.now();

    for (const b of this.bookings.values()) {
      if (b.travelerId === travelerId) {
        if (b.status === 'HELD' && b.lockExpiresAt && new Date(b.lockExpiresAt).getTime() <= now) {
          b.status = 'EXPIRED';
        }
        results.push({ ...b });
      }
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Annulation d'une réservation
   */
  public static cancelBooking(bookingId: string, travelerId: string): boolean {
    const booking = this.bookings.get(bookingId);
    if (!booking || booking.travelerId !== travelerId) return false;

    if (booking.status === 'CONFIRMED' || booking.status === 'TICKET_GENERATED') {
      // Annulation d'un billet confirmé
      booking.status = 'CANCELLED';
    } else {
      booking.status = 'CANCELLED';
    }

    booking.updatedAt = new Date().toISOString();

    if (booking.seatHoldId) {
      SeatHoldService.releaseHold(booking.seatHoldId, travelerId);
    }

    AuditService.log({
      actorId: travelerId,
      actorRole: 'TRAVELER',
      action: 'BOOKING_CANCELLED',
      resourceType: 'BOOKING',
      resourceId: bookingId,
      result: 'SUCCESS'
    });

    return true;
  }

  /**
   * Confirmation du paiement pour une réservation provisoire
   */
  public static confirmBookingPayment(bookingId: string, paymentRef: string): BookingOrder {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error('Réservation introuvable.');
    }

    if (booking.status === 'EXPIRED' || booking.status === 'CANCELLED') {
      throw new Error(`Impossible de confirmer une réservation avec le statut ${booking.status}.`);
    }

    // Consommer le verrou associé
    if (booking.seatHoldId) {
      SeatHoldService.consumeHold(booking.seatHoldId, booking.travelerId);
    }

    booking.status = 'CONFIRMED';
    booking.paymentRef = paymentRef;
    booking.updatedAt = new Date().toISOString();

    AuditService.log({
      actorId: booking.travelerId,
      actorRole: 'TRAVELER',
      action: 'BOOKING_CONFIRMED',
      resourceType: 'BOOKING',
      resourceId: bookingId,
      result: 'SUCCESS',
      details: { paymentRef, totalAmountXof: booking.totalPriceXof }
    });

    return { ...booking };
  }

  /**
   * Retourne la liste des numéros de sièges confirmés pour un trajet
   */
  public static getConfirmedSeatNumbersForTrip(tripId: string): number[] {
    const confirmed: number[] = [];
    for (const b of this.bookings.values()) {
      if (b.departureTripId === tripId || b.tripId === tripId) {
        if (
          b.status === 'CONFIRMED' ||
          b.status === 'TICKET_GENERATED' ||
          b.status === 'COMPLETED'
        ) {
          confirmed.push(...b.seatIds);
        }
      }
    }
    return confirmed;
  }

  public static resetForTesting(): void {
    this.bookings.clear();
    this.idempotencyRecords.clear();
  }
}
