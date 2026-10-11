/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookingOrder, DepartureTrip, SeatHold, TripSearchQuery } from '../types';
import { TripSearchResponse, TripSearchService } from './tripSearchService';
import { TripService } from './tripService';
import { SeatAvailabilityService } from './seatAvailabilityService';
import { HoldResult, SeatHoldService } from './seatHoldService';
import { BookingResult, BookingService } from './bookingService';
import { appStore } from './store';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Client API autoritaire pour les opérations de recherche, sièges, verrous et réservations
 * Connecte les interfaces frontend aux services transactionnels sécurisés
 */
export class ApiClient {
  /**
   * GET /api/trips/search
   */
  public static async searchTrips(query: TripSearchQuery): Promise<ApiResponse<TripSearchResponse>> {
    try {
      if (appStore.getState().isOffline) {
        return {
          success: false,
          error: 'Mode Hors Connexion actif. La recherche de nouveaux trajets requiert une connexion réseau.',
          statusCode: 503
        };
      }

      const results = TripSearchService.search(query);
      return {
        success: true,
        data: results,
        statusCode: 200
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Erreur lors de la recherche.',
        statusCode: 400
      };
    }
  }

  /**
   * GET /api/trips/:tripId
   */
  public static async getTrip(tripId: string): Promise<ApiResponse<DepartureTrip>> {
    const trip = TripService.getTripById(tripId);
    if (!trip) {
      return {
        success: false,
        error: 'Trajet introuvable.',
        statusCode: 404
      };
    }

    return {
      success: true,
      data: trip,
      statusCode: 200
    };
  }

  /**
   * GET /api/trips/:tripId/seats
   */
  public static async getTripSeats(tripId: string): Promise<ApiResponse<ReturnType<typeof SeatAvailabilityService.getTripSeatMap>>> {
    try {
      const currentUser = appStore.getState().currentUser;
      const seatMap = SeatAvailabilityService.getTripSeatMap(tripId, currentUser?.id);
      return {
        success: true,
        data: seatMap,
        statusCode: 200
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Impossible de charger le plan des sièges.',
        statusCode: 400
      };
    }
  }

  /**
   * POST /api/trips/:tripId/holds
   */
  public static async createSeatHold(
    tripId: string,
    seatNumbers: number[],
    idempotencyKey?: string
  ): Promise<ApiResponse<HoldResult>> {
    const state = appStore.getState();
    if (state.isOffline) {
      return {
        success: false,
        error: 'Mode Hors Connexion : Impossible de verrouiller des sièges sans validation serveur.',
        statusCode: 503
      };
    }

    const currentUser = state.currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: 'Authentification requise pour verrouiller des sièges.',
        statusCode: 401
      };
    }

    const result = await SeatHoldService.acquireHold({
      departureTripId: tripId,
      seatNumbers,
      travelerId: currentUser.id,
      idempotencyKey
    });

    if (!result.success) {
      return {
        success: false,
        data: result,
        error: result.error,
        statusCode: result.errorCode === 'SEAT_UNAVAILABLE' ? 409 : 400
      };
    }

    return {
      success: true,
      data: result,
      statusCode: 201
    };
  }

  /**
   * GET /api/holds/:holdId
   */
  public static async getSeatHold(holdId: string): Promise<ApiResponse<SeatHold>> {
    const hold = SeatHoldService.getHoldById(holdId);
    if (!hold) {
      return {
        success: false,
        error: 'Verrou introuvable ou expiré.',
        statusCode: 404
      };
    }
    return {
      success: true,
      data: hold,
      statusCode: 200
    };
  }

  /**
   * DELETE /api/holds/:holdId
   */
  public static async deleteSeatHold(holdId: string): Promise<ApiResponse<{ released: boolean }>> {
    const currentUser = appStore.getState().currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: 'Authentification requise.',
        statusCode: 401
      };
    }

    const res = await SeatHoldService.releaseHold(holdId, currentUser.id);
    if (!res.success) {
      return {
        success: false,
        error: res.error,
        statusCode: 400
      };
    }

    return {
      success: true,
      data: { released: true },
      statusCode: 200
    };
  }

  /**
   * POST /api/bookings
   */
  public static async createProvisionalBooking(
    seatHoldId: string,
    passengerName: string,
    passengerPhone: string,
    idempotencyKey?: string
  ): Promise<ApiResponse<BookingResult>> {
    const currentUser = appStore.getState().currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: 'Authentification requise pour réserver.',
        statusCode: 401
      };
    }

    const result = await BookingService.createProvisionalBooking({
      seatHoldId,
      travelerId: currentUser.id,
      passengerName,
      passengerPhone,
      idempotencyKey
    });

    if (!result.success) {
      return {
        success: false,
        data: result,
        error: result.error,
        statusCode: result.errorCode === 'HOLD_EXPIRED' ? 410 : 400
      };
    }

    return {
      success: true,
      data: result,
      statusCode: 201
    };
  }

  /**
   * GET /api/bookings/:bookingId
   */
  public static async getBooking(bookingId: string): Promise<ApiResponse<BookingOrder>> {
    try {
      const currentUser = appStore.getState().currentUser;
      const booking = BookingService.getBookingById(bookingId, currentUser);
      if (!booking) {
        return {
          success: false,
          error: 'Réservation introuvable.',
          statusCode: 404
        };
      }
      return {
        success: true,
        data: booking,
        statusCode: 200
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Erreur lors de la récupération.',
        statusCode: 403
      };
    }
  }

  /**
   * GET /api/me/bookings
   */
  public static async getMyBookings(): Promise<ApiResponse<BookingOrder[]>> {
    const currentUser = appStore.getState().currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: 'Non authentifié.',
        statusCode: 401
      };
    }

    const bookings = BookingService.getTravelerBookings(currentUser.id);
    return {
      success: true,
      data: bookings,
      statusCode: 200
    };
  }

  /**
   * POST /api/payments/initiate
   */
  public static async initiatePayment(
    bookingId: string,
    paymentMethod: 'ORANGE_MONEY' | 'MOOV_MONEY' | 'WAVE',
    payerPhone: string,
    idempotencyKey?: string,
    clientDeclaredAmount?: number
  ): Promise<ApiResponse<any>> {
    const currentUser = appStore.getState().currentUser;
    if (!currentUser) {
      return { success: false, error: 'Authentification requise.', statusCode: 401 };
    }

    const { PaymentService } = await import('./paymentService');
    const result = await PaymentService.initiatePayment({
      bookingId,
      paymentMethod,
      payerPhone,
      idempotencyKey,
      clientDeclaredAmount,
      user: currentUser
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        statusCode: result.errorCode === 'PRICE_TAMPERING_DETECTED' ? 403 : 400
      };
    }

    return {
      success: true,
      data: result,
      statusCode: 201
    };
  }

  /**
   * POST /api/payments/:transactionId/confirm
   */
  public static async confirmPayment(transactionId: string, operatorRef?: string): Promise<ApiResponse<any>> {
    const currentUser = appStore.getState().currentUser;
    const { PaymentService } = await import('./paymentService');
    const { TicketService } = await import('./ticketService');

    const result = await PaymentService.confirmPayment(transactionId, operatorRef, currentUser || undefined);
    if (!result.success) {
      return {
        success: false,
        error: result.error,
        statusCode: 400
      };
    }

    // Émission automatique du billet électronique après confirmation
    try {
      const ticket = TicketService.issueTicket(result.transaction.bookingId, result.transaction.id, currentUser || undefined);
      return {
        success: true,
        data: { transaction: result.transaction, ticket },
        statusCode: 200
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Erreur lors de l\'émission du billet.',
        statusCode: 500
      };
    }
  }

  /**
   * POST /api/tickets/validate-boarding
   */
  public static async validateTicketBoarding(qrData: string): Promise<ApiResponse<any>> {
    const currentUser = appStore.getState().currentUser;
    if (!currentUser) {
      return { success: false, error: 'Agent non authentifié.', statusCode: 401 };
    }

    const { TicketService } = await import('./ticketService');
    const res = TicketService.validateTicketForBoarding(qrData, currentUser);

    return {
      success: res.success,
      data: res,
      error: !res.success ? res.message : undefined,
      statusCode: res.success ? 200 : res.errorCode === 'ALREADY_USED' ? 409 : 400
    };
  }
}

