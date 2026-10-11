/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BusSeatLayout, Seat, SeatLayoutType, SeatStatus, SeatType } from '../types';
import { TripService } from './tripService';
import { FleetService } from './fleetService';
import { BookingService } from './bookingService';
import { SeatHoldService } from './seatHoldService';

export class SeatAvailabilityService {
  /**
   * Génère dynamiquement la disposition physique des sièges d'un autocar
   * Supporte les configurations : 2+2, 2+3, 2+1 VIP, etc.
   */
  public static generateLayout(busId: string, busType: string, totalSeats: number): BusSeatLayout {
    let layoutType: SeatLayoutType = '2+2';
    let seatsPerRow = 4;

    const lowerType = busType.toLowerCase();
    if (lowerType.includes('vip') || lowerType.includes('confort grand') || totalSeats <= 32) {
      layoutType = '2+1_VIP';
      seatsPerRow = 3;
    } else if (lowerType.includes('70') || lowerType.includes('grande capacité') || totalSeats > 55) {
      layoutType = '2+3';
      seatsPerRow = 5;
    } else {
      layoutType = '2+2';
      seatsPerRow = 4;
    }

    const rowCount = Math.ceil(totalSeats / seatsPerRow);
    const seats: Seat[] = [];

    let currentSeatNumber = 1;
    for (let r = 1; r <= rowCount; r++) {
      for (let c = 0; c < seatsPerRow; c++) {
        if (currentSeatNumber > totalSeats) break;

        let colIndex = c;
        let seatType: SeatType = 'STANDARD';

        if (layoutType === '2+2') {
          // Colonnes 0, 1 (gauche), Allée = 2, Colonnes 3, 4 (droite)
          colIndex = c < 2 ? c : c + 1;
          if (colIndex === 0 || colIndex === 4) seatType = 'WINDOW';
          else seatType = 'AISLE';
        } else if (layoutType === '2+1_VIP') {
          // Colonnes 0, 1 (gauche), Allée = 2, Colonne 3 (droite)
          colIndex = c < 2 ? c : c + 1;
          seatType = 'VIP';
        } else if (layoutType === '2+3') {
          // Colonnes 0, 1 (gauche), Allée = 2, Colonnes 3, 4, 5 (droite)
          colIndex = c < 2 ? c : c + 1;
          if (colIndex === 0 || colIndex === 5) seatType = 'WINDOW';
          else if (colIndex === 1 || colIndex === 3) seatType = 'AISLE';
          else seatType = 'STANDARD';
        }

        seats.push({
          id: `seat_${busId}_${currentSeatNumber}`,
          busId,
          seatNumber: currentSeatNumber,
          row: r,
          column: colIndex,
          seatType,
          isBookable: true
        });

        currentSeatNumber++;
      }
    }

    return {
      busId,
      busType,
      layoutType,
      totalSeats,
      seatsPerRow,
      rowCount,
      seats
    };
  }

  /**
   * Retourne le plan de sièges officiel avec statuts faisant autorité
   */
  public static getTripSeatMap(
    tripId: string,
    currentTravelerId?: string
  ): {
    layout: BusSeatLayout;
    seats: (Seat & { status: SeatStatus })[];
    summary: {
      total: number;
      available: number;
      locked: number;
      occupied: number;
    };
  } {
    const trip = TripService.getTripById(tripId);
    if (!trip) {
      throw new Error(`Trajet introuvable pour l'identifiant ${tripId}.`);
    }

    // Récupérer le véhicule assigné ou générer selon le type et le nombre de places
    const bus = trip.busId ? FleetService.getBusById(trip.busId) : null;
    const busType = bus?.model || trip.busType || 'Car Grand Confort 50 Places';
    const totalSeats = bus?.totalSeats || bus?.seatCapacity || trip.totalSeats || 50;
    const busId = bus?.id || trip.busId || `bus_virtual_${trip.id}`;

    const layout = this.generateLayout(busId, busType, totalSeats);

    // 1. Sièges occupés / confirmés
    const confirmedSeatNumbers = new Set(BookingService.getConfirmedSeatNumbersForTrip(tripId));

    // 2. Sièges verrouillés par un hold actif (non expiré)
    const activeHolds = SeatHoldService.getActiveHoldsForTrip(tripId);
    const lockedByOthers = new Set<number>();
    const selectedByCurrentTraveler = new Set<number>();

    for (const hold of activeHolds) {
      if (currentTravelerId && hold.travelerId === currentTravelerId) {
        for (const s of hold.seatIds) {
          selectedByCurrentTraveler.add(s);
        }
      } else {
        for (const s of hold.seatIds) {
          lockedByOthers.add(s);
        }
      }
    }

    let availableCount = 0;
    let lockedCount = 0;
    let occupiedCount = 0;

    const projectedSeats = layout.seats.map(seat => {
      let status: SeatStatus = 'AVAILABLE';

      if (confirmedSeatNumbers.has(seat.seatNumber)) {
        status = 'OCCUPIED';
        occupiedCount++;
      } else if (lockedByOthers.has(seat.seatNumber)) {
        status = 'LOCKED';
        lockedCount++;
      } else if (selectedByCurrentTraveler.has(seat.seatNumber)) {
        status = 'SELECTED';
      } else {
        status = 'AVAILABLE';
        availableCount++;
      }

      return {
        ...seat,
        status
      };
    });

    return {
      layout,
      seats: projectedSeats,
      summary: {
        total: totalSeats,
        available: availableCount,
        locked: lockedCount,
        occupied: occupiedCount
      }
    };
  }

  /**
   * Retourne le nombre réel de sièges disponibles pour un départ (jamais négatif)
   */
  public static getAvailableSeatsCount(tripId: string): number {
    try {
      const map = this.getTripSeatMap(tripId);
      return Math.max(0, map.summary.available);
    } catch {
      return 0;
    }
  }

  /**
   * Vérifie qu'un ensemble de sièges appartient bien au véhicule du départ
   */
  public static validateSeatsBelongToTrip(
    tripId: string,
    seatNumbers: number[]
  ): { valid: boolean; invalidSeatNumbers: number[] } {
    const trip = TripService.getTripById(tripId);
    if (!trip) {
      return { valid: false, invalidSeatNumbers: seatNumbers };
    }

    const totalSeats = trip.totalSeats || 50;
    const invalidSeatNumbers = seatNumbers.filter(
      num => num < 1 || num > totalSeats || !Number.isInteger(num)
    );

    return {
      valid: invalidSeatNumbers.length === 0,
      invalidSeatNumbers
    };
  }
}
