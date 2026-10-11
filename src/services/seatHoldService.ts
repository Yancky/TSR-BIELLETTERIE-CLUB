/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SeatHold, SeatHoldStatus } from '../types';
import { TripService } from './tripService';
import { CompanyService } from './companyService';
import { BookingService } from './bookingService';
import { AuditService } from './auditService';
import { SeatAvailabilityService } from './seatAvailabilityService';

export interface AcquireHoldParams {
  departureTripId: string;
  seatNumbers: number[];
  travelerId: string;
  idempotencyKey?: string;
  holdDurationSeconds?: number;
}

export interface HoldResult {
  success: boolean;
  hold?: SeatHold;
  error?: string;
  errorCode?: 'SEAT_UNAVAILABLE' | 'TRIP_NOT_BOOKABLE' | 'INVALID_SEATS' | 'IDEMPOTENCY_CONFLICT' | 'UNAUTHORIZED';
  conflictSeatNumbers?: number[];
}

interface IdempotencyRecord {
  holdId: string;
  paramsHash: string;
  result: HoldResult;
  createdAt: number;
}

export class SeatHoldService {
  // Durée par défaut de verrouillage : 600 secondes = 10 minutes
  public static readonly DEFAULT_HOLD_DURATION_SECONDS = 600;

  // Persistance mémoire serveur des verrous
  private static holds: Map<string, SeatHold> = new Map();

  // Registre d'idempotence
  private static idempotencyRecords: Map<string, IdempotencyRecord> = new Map();

  // Verrous d'exclusion mutuelle (Mutex transactionnel par départ pour garantir la sérialisation stricte)
  private static mutexQueues: Map<string, Promise<void>> = new Map();

  /**
   * Acquisition atomique d'un verrou temporaire de 10 minutes sur des sièges
   */
  public static async acquireHold(params: AcquireHoldParams): Promise<HoldResult> {
    const tripId = params.departureTripId;

    // 1. Contrôle préalable d'idempotence
    if (params.idempotencyKey) {
      const existing = this.idempotencyRecords.get(params.idempotencyKey);
      if (existing) {
        const currentHash = this.computeParamsHash(params);
        if (existing.paramsHash === currentHash) {
          // Requête répétée identique -> renvoi du résultat sans duplication
          return existing.result;
        } else {
          return {
            success: false,
            error: 'IDEMPOTENCY_CONFLICT: Cette clé d\'idempotence a déjà été utilisée avec des paramètres différents.',
            errorCode: 'IDEMPOTENCY_CONFLICT'
          };
        }
      }
    }

    // 2. Acquisition du verrou transactionnel pour ce trajet
    return this.withTripTransaction(tripId, async () => {
      return this.executeAcquireHoldTransaction(params);
    });
  }

  /**
   * Exécution de l'algorithme obligatoire à l'intérieur de la transaction
   */
  private static executeAcquireHoldTransaction(params: AcquireHoldParams): HoldResult {
    const { departureTripId, seatNumbers, travelerId } = params;
    const duration = params.holdDurationSeconds || this.DEFAULT_HOLD_DURATION_SECONDS;

    // A. Validation des entrées
    if (!travelerId || travelerId.trim() === '') {
      return {
        success: false,
        error: 'Voyageur non authentifié. L\'identifiant du voyageur est obligatoire.',
        errorCode: 'UNAUTHORIZED'
      };
    }

    if (!seatNumbers || seatNumbers.length === 0) {
      return {
        success: false,
        error: 'Veuillez sélectionner au moins un siège pour verrouiller la réservation.',
        errorCode: 'INVALID_SEATS'
      };
    }

    // Dédoublonner les numéros demandés
    const uniqueSeatNumbers = Array.from(new Set(seatNumbers));
    if (uniqueSeatNumbers.length !== seatNumbers.length) {
      return {
        success: false,
        error: 'La sélection comporte des numéros de sièges dupliqués.',
        errorCode: 'INVALID_SEATS'
      };
    }

    // B. Vérifier que le départ existe
    const trip = TripService.getTripById(departureTripId);
    if (!trip) {
      return {
        success: false,
        error: `Départ introuvable pour l'identifiant ${departureTripId}.`,
        errorCode: 'TRIP_NOT_BOOKABLE'
      };
    }

    // C. Vérifier que le départ est ouvert à la réservation
    if (trip.status !== 'PUBLISHED' && trip.status !== 'SCHEDULED') {
      return {
        success: false,
        error: `Ce trajet n'est plus ouvert à la réservation (Statut : ${trip.status}).`,
        errorCode: 'TRIP_NOT_BOOKABLE'
      };
    }

    // D. Vérifier le statut de la compagnie
    const company = CompanyService.getCompanyById(trip.companyId);
    if (!company || company.status !== 'ACTIVE') {
      return {
        success: false,
        error: 'La société de transport opérant ce trajet n\'est pas en statut actif.',
        errorCode: 'TRIP_NOT_BOOKABLE'
      };
    }

    // E. Vérifier que tous les sièges demandés appartiennent au véhicule
    const validationBus = SeatAvailabilityService.validateSeatsBelongToTrip(
      departureTripId,
      uniqueSeatNumbers
    );
    if (!validationBus.valid) {
      return {
        success: false,
        error: `Sièges invalides ou hors limites du véhicule : [${validationBus.invalidSeatNumbers.join(', ')}].`,
        errorCode: 'INVALID_SEATS',
        conflictSeatNumbers: validationBus.invalidSeatNumbers
      };
    }

    // F. Expiration logique des verrous échus
    this.cleanExpiredHoldsInternal();

    // G. Vérifier qu'aucun siège n'est déjà vendu / confirmé
    const confirmedSeats = new Set(BookingService.getConfirmedSeatNumbersForTrip(departureTripId));
    const alreadySold = uniqueSeatNumbers.filter(s => confirmedSeats.has(s));
    if (alreadySold.length > 0) {
      this.logSeatConflict(travelerId, departureTripId, alreadySold, 'SEAT_ALREADY_BOOKED');
      return {
        success: false,
        error: `Ce siège vient d'être réservé par un autre voyageur : [${alreadySold.join(', ')}].`,
        errorCode: 'SEAT_UNAVAILABLE',
        conflictSeatNumbers: alreadySold
      };
    }

    // H. Vérifier qu'aucun verrou valide appartenant à un autre voyageur ne bloque les sièges
    const activeHolds = this.getActiveHoldsForTrip(departureTripId);
    const conflictsWithHolds: number[] = [];

    for (const hold of activeHolds) {
      if (hold.travelerId !== travelerId) {
        for (const s of uniqueSeatNumbers) {
          if (hold.seatIds.includes(s)) {
            conflictsWithHolds.push(s);
          }
        }
      }
    }

    if (conflictsWithHolds.length > 0) {
      const distinctConflicts = Array.from(new Set(conflictsWithHolds));
      this.logSeatConflict(travelerId, departureTripId, distinctConflicts, 'SEAT_LOCKED_BY_OTHER');
      return {
        success: false,
        error: `Les sièges suivants sont temporairement verrouillés par un autre voyageur : [${distinctConflicts.join(', ')}].`,
        errorCode: 'SEAT_UNAVAILABLE',
        conflictSeatNumbers: distinctConflicts
      };
    }

    // I. Libérer les anciens holds actifs de ce voyageur sur ce même trajet (remplacement propre)
    for (const hold of activeHolds) {
      if (hold.travelerId === travelerId) {
        hold.status = 'RELEASED';
      }
    }

    // J. Acquérir le verrou atomique (600s = 10 minutes)
    const nowMs = Date.now();
    const createdAt = new Date(nowMs).toISOString();
    const expiresAt = new Date(nowMs + duration * 1000).toISOString();
    const holdId = `hold_${nowMs}_${Math.random().toString(36).substring(2, 8)}`;

    const newHold: SeatHold = {
      id: holdId,
      departureTripId,
      seatIds: uniqueSeatNumbers,
      travelerId,
      status: 'ACTIVE',
      createdAt,
      expiresAt,
      idempotencyKey: params.idempotencyKey || `auto_${holdId}`
    };

    this.holds.set(holdId, newHold);

    const result: HoldResult = {
      success: true,
      hold: { ...newHold }
    };

    // Enregistrer la clé d'idempotence
    if (params.idempotencyKey) {
      this.idempotencyRecords.set(params.idempotencyKey, {
        holdId,
        paramsHash: this.computeParamsHash(params),
        result,
        createdAt: nowMs
      });
    }

    // Audit de succès
    AuditService.log({
      actorId: travelerId,
      actorRole: 'TRAVELER',
      action: 'SEAT_HOLD_ACQUIRED',
      resourceType: 'BOOKING',
      resourceId: holdId,
      result: 'SUCCESS',
      details: {
        departureTripId,
        seatNumbers: uniqueSeatNumbers,
        expiresAt,
        durationSeconds: duration
      }
    });

    return result;
  }

  /**
   * Libération volontaire des sièges par le voyageur
   */
  public static async releaseHold(holdId: string, travelerId: string): Promise<{ success: boolean; error?: string }> {
    const hold = this.holds.get(holdId);
    if (!hold) {
      return { success: false, error: 'Verrou introuvable.' };
    }

    if (hold.travelerId !== travelerId) {
      AuditService.log({
        actorId: travelerId,
        actorRole: 'TRAVELER',
        action: 'PERMISSION_DENIED',
        resourceType: 'BOOKING',
        resourceId: holdId,
        result: 'FAILURE',
        reason: 'Tentative de libération d\'un verrou appartenant à un autre voyageur.'
      });
      return { success: false, error: 'Vous ne pouvez pas libérer le verrou d\'un autre utilisateur.' };
    }

    hold.status = 'RELEASED';

    AuditService.log({
      actorId: travelerId,
      actorRole: 'TRAVELER',
      action: 'SEAT_HOLD_RELEASED',
      resourceType: 'BOOKING',
      resourceId: holdId,
      result: 'SUCCESS',
      details: { seatNumbers: hold.seatIds }
    });

    return { success: true };
  }

  /**
   * Consomme le verrou lors de la confirmation d'une réservation / paiement
   */
  public static consumeHold(holdId: string, travelerId: string): boolean {
    const hold = this.holds.get(holdId);
    if (!hold || hold.status !== 'ACTIVE') return false;
    if (hold.travelerId !== travelerId) return false;

    hold.status = 'CONSUMED';
    return true;
  }

  /**
   * Retourne un verrou par identifiant
   */
  public static getHoldById(holdId: string): SeatHold | null {
    const hold = this.holds.get(holdId);
    if (!hold) return null;

    // Vérifier l'expiration logique à la lecture
    if (hold.status === 'ACTIVE' && new Date(hold.expiresAt).getTime() <= Date.now()) {
      hold.status = 'EXPIRED';
    }

    return { ...hold };
  }

  /**
   * Force l'expiration d'un verrou pour les tests
   */
  public static expireHoldForTesting(holdId: string): void {
    const hold = this.holds.get(holdId);
    if (hold) {
      hold.status = 'EXPIRED';
      hold.expiresAt = new Date(Date.now() - 60000).toISOString();
    }
  }

  /**
   * Retourne les verrous actifs d'un départ
   */
  public static getActiveHoldsForTrip(tripId: string): SeatHold[] {
    const now = Date.now();
    const result: SeatHold[] = [];

    for (const hold of this.holds.values()) {
      if (hold.departureTripId === tripId) {
        if (hold.status === 'ACTIVE') {
          if (new Date(hold.expiresAt).getTime() > now) {
            result.push({ ...hold });
          } else {
            hold.status = 'EXPIRED';
          }
        }
      }
    }

    return result;
  }

  /**
   * Nettoie logiquement les verrous expirés
   */
  public static cleanExpiredHolds(): number {
    return this.cleanExpiredHoldsInternal();
  }

  private static cleanExpiredHoldsInternal(): number {
    const now = Date.now();
    let expiredCount = 0;

    for (const hold of this.holds.values()) {
      if (hold.status === 'ACTIVE' && new Date(hold.expiresAt).getTime() <= now) {
        hold.status = 'EXPIRED';
        expiredCount++;
      }
    }

    return expiredCount;
  }

  /**
   * Mécanisme transactionnel sérialisé par départ (Mutex Promise chain)
   */
  private static async withTripTransaction<T>(tripId: string, fn: () => Promise<T> | T): Promise<T> {
    const prevQueue = this.mutexQueues.get(tripId) || Promise.resolve();

    let releaseLock: () => void;
    const currentLock = new Promise<void>(resolve => {
      releaseLock = resolve;
    });

    this.mutexQueues.set(tripId, prevQueue.then(() => currentLock));

    try {
      await prevQueue;
      return await fn();
    } finally {
      releaseLock!();
    }
  }

  private static computeParamsHash(params: AcquireHoldParams): string {
    const sortedSeats = [...params.seatNumbers].sort((a, b) => a - b);
    return `${params.departureTripId}:${sortedSeats.join(',')}:${params.travelerId}`;
  }

  private static logSeatConflict(
    travelerId: string,
    tripId: string,
    conflictSeats: number[],
    reason: string
  ): void {
    AuditService.log({
      actorId: travelerId,
      actorRole: 'TRAVELER',
      action: 'SEAT_CONFLICT_DETECTED',
      resourceType: 'BOOKING',
      result: 'FAILURE',
      reason,
      details: { departureTripId: tripId, conflictSeats }
    });
  }

  public static resetForTesting(): void {
    this.holds.clear();
    this.idempotencyRecords.clear();
    this.mutexQueues.clear();
  }
}
