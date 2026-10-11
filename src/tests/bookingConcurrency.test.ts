/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import { SeatHoldService } from '../services/seatHoldService';
import { BookingService } from '../services/bookingService';
import { TripService } from '../services/tripService';
import { User } from '../types';

export interface ConcurrencyTestMetrics {
  totalRequests: number;
  acceptedHolds: number;
  rejectedConflicts: number;
  doubleBookingsCount: number;
  serverErrorsCount: number;
  durationMs: number;
}

export async function runBookingConcurrencyTests(): Promise<{
  passed: number;
  failed: number;
  tests: string[];
  metrics: ConcurrencyTestMetrics;
}> {
  const testResults: string[] = [];
  let passed = 0;
  let failed = 0;

  SeatHoldService.resetForTesting();
  BookingService.resetForTesting();
  TripService.resetForTesting();

  // Test 1: Deux voyageurs demandent simultanément le même siège
  try {
    const p1 = SeatHoldService.acquireHold({
      departureTripId: 'trip_01',
      seatNumbers: [14],
      travelerId: 'traveler_sim_1'
    });

    const p2 = SeatHoldService.acquireHold({
      departureTripId: 'trip_01',
      seatNumbers: [14],
      travelerId: 'traveler_sim_2'
    });

    const [res1, res2] = await Promise.all([p1, p2]);

    const successCount = (res1.success ? 1 : 0) + (res2.success ? 1 : 0);
    const failureCount = (!res1.success ? 1 : 0) + (!res2.success ? 1 : 0);

    assert.strictEqual(successCount, 1, 'Exactement UN SEUL verrou doit réussir pour le siège 14');
    assert.strictEqual(failureCount, 1, 'L\'autre demande doit être rejetée pour conflit');

    passed++;
    testResults.push('✔ Test 1: Concurrence à 2 voyageurs sur le même siège : 1 seul accepté, 0 double-attribution');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 1: ${err.message}`);
  }

  // Test 2: Plusieurs requêtes concurrentes massives (8 requêtes) ciblant le même siège
  try {
    const promises = Array.from({ length: 8 }, (_, i) =>
      SeatHoldService.acquireHold({
        departureTripId: 'trip_01',
        seatNumbers: [22],
        travelerId: `traveler_batch_${i}`
      })
    );

    const results = await Promise.all(promises);
    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    assert.strictEqual(successes.length, 1, 'Exactement 1 demande doit réussir parmi les 8 concurrentes');
    assert.strictEqual(failures.length, 7, 'Les 7 autres requêtes doivent être rejetées pour conflit');
    assert.ok(failures.every(f => f.errorCode === 'SEAT_UNAVAILABLE'));

    passed++;
    testResults.push('✔ Test 2: Concurrence massive (8 requêtes) sur un même siège : intégrité stricte et 0 doublon');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 2: ${err.message}`);
  }

  // Test 3: Deux voyageurs réservent des sièges distincts simultanément
  try {
    const [resA, resB] = await Promise.all([
      SeatHoldService.acquireHold({
        departureTripId: 'trip_01',
        seatNumbers: [31],
        travelerId: 'traveler_A'
      }),
      SeatHoldService.acquireHold({
        departureTripId: 'trip_01',
        seatNumbers: [32],
        travelerId: 'traveler_B'
      })
    ]);

    assert.strictEqual(resA.success, true, 'Siège 31 doit réussir');
    assert.strictEqual(resB.success, true, 'Siège 32 doit réussir');
    passed++;
    testResults.push('✔ Test 3: Deux demandes concurrentes sur des sièges distincts réussissent simultanément');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 3: ${err.message}`);
  }

  // Test 4: Demande multi-sièges avec conflit partiel (Tout ou Rien atomique)
  try {
    // Siège 35 est préalablement verrouillé par traveler_X
    await SeatHoldService.acquireHold({
      departureTripId: 'trip_01',
      seatNumbers: [35],
      travelerId: 'traveler_X'
    });

    // traveler_Y tente de réserver les sièges 34, 35 et 36
    const multiRes = await SeatHoldService.acquireHold({
      departureTripId: 'trip_01',
      seatNumbers: [34, 35, 36],
      travelerId: 'traveler_Y'
    });

    assert.strictEqual(multiRes.success, false, 'La demande multi-sièges doit être rejetée car le siège 35 est pris');
    assert.strictEqual(multiRes.errorCode, 'SEAT_UNAVAILABLE');

    // Vérifier l'atomicité : Les sièges 34 et 36 NE DOIVENT PAS avoir été verrouillés (zéro verrou partiel)
    const hold34 = await SeatHoldService.acquireHold({
      departureTripId: 'trip_01',
      seatNumbers: [34],
      travelerId: 'traveler_Z'
    });
    assert.strictEqual(hold34.success, true, 'Le siège 34 doit être resté totalement libre');

    const hold36 = await SeatHoldService.acquireHold({
      departureTripId: 'trip_01',
      seatNumbers: [36],
      travelerId: 'traveler_W'
    });
    assert.strictEqual(hold36.success, true, 'Le siège 36 doit être resté totalement libre');

    passed++;
    testResults.push('✔ Test 4: Atomicité totale (Tout ou Rien) : échec intégral sans aucun verrouillage partiel');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 4: ${err.message}`);
  }

  // Test 5: Rejeu réseau simulé avec clé d'idempotence
  try {
    const key = 'network_retry_key_8899';
    const req1 = await SeatHoldService.acquireHold({
      departureTripId: 'trip_02',
      seatNumbers: [8],
      travelerId: 'traveler_retry',
      idempotencyKey: key
    });
    assert.strictEqual(req1.success, true);

    // Simulation d'une perte de paquet et réémission de la requête identique
    const req2 = await SeatHoldService.acquireHold({
      departureTripId: 'trip_02',
      seatNumbers: [8],
      travelerId: 'traveler_retry',
      idempotencyKey: key
    });
    assert.strictEqual(req2.success, true);
    assert.strictEqual(req2.hold?.id, req1.hold?.id, 'Le verrou initial est réutilisé');

    // Vérification qu'il n'y a pas deux verrous distincts pour le même siège
    const activeHolds = SeatHoldService.getActiveHoldsForTrip('trip_02');
    const holdsForSeat8 = activeHolds.filter(h => h.seatIds.includes(8));
    assert.strictEqual(holdsForSeat8.length, 1, 'Un seul verrou doit exister en mémoire');

    passed++;
    testResults.push('✔ Test 5: Résilience aux réémissions réseau (idempotence) sans génération de doublons');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 5: ${err.message}`);
  }

  // Test 6: Départ annulé ne recevant plus aucun verrou
  try {
    const adminActor: User = {
      id: 'admin_usr',
      name: 'Admin National',
      phone: '+226 70 00 00 00',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    };

    TripService.updateTripStatus(adminActor, 'trip_06', 'CANCELLED', 'Arrêt de sécurité');

    const resCancelled = await SeatHoldService.acquireHold({
      departureTripId: 'trip_06',
      seatNumbers: [1],
      travelerId: 'traveler_late'
    });

    assert.strictEqual(resCancelled.success, false);
    assert.strictEqual(resCancelled.errorCode, 'TRIP_NOT_BOOKABLE');
    passed++;
    testResults.push('✔ Test 6: Interdiction d\'acquisition de nouveaux verrous sur un départ annulé');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 6: ${err.message}`);
  }

  // Test 7: TEST DE CHARGE SOUS FORTE CONCURRENCE (50 requêtes concurrentes)
  const startTime = Date.now();
  let totalRequests = 50;
  let acceptedHolds = 0;
  let rejectedConflicts = 0;
  let serverErrorsCount = 0;

  // Car de test avec 50 places
  const testTripId = 'trip_03';
  const targetSeats = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 10 sièges ciblés par 50 requêtes concurrentes

  const stressPromises = Array.from({ length: totalRequests }, (_, idx) => {
    // Chaque voyageur demande 1 ou 2 sièges parmi les 10 cibles
    const seatChoice = [targetSeats[idx % targetSeats.length]];
    return SeatHoldService.acquireHold({
      departureTripId: testTripId,
      seatNumbers: seatChoice,
      travelerId: `stress_traveler_${idx}`
    });
  });

  const stressResults = await Promise.all(stressPromises);

  for (const r of stressResults) {
    if (r.success) acceptedHolds++;
    else if (r.errorCode === 'SEAT_UNAVAILABLE') rejectedConflicts++;
    else serverErrorsCount++;
  }

  const durationMs = Date.now() - startTime;

  // Vérifier qu'aucun siège n'a été attribué à plus d'un verrou actif
  const activeHoldsTrip3 = SeatHoldService.getActiveHoldsForTrip(testTripId);
  const seatHoldCounts = new Map<number, number>();
  let doubleBookingsCount = 0;

  for (const hold of activeHoldsTrip3) {
    for (const seatNum of hold.seatIds) {
      const count = (seatHoldCounts.get(seatNum) || 0) + 1;
      seatHoldCounts.set(seatNum, count);
      if (count > 1) {
        doubleBookingsCount++;
      }
    }
  }

  try {
    assert.strictEqual(
      doubleBookingsCount,
      0,
      `CRITÈRE ABSOLU VIOLÉ : ${doubleBookingsCount} double(s) attribution(s) constatée(s) !`
    );
    assert.strictEqual(serverErrorsCount, 0, 'Zéro erreur serveur inattendue');
    assert.strictEqual(
      acceptedHolds + rejectedConflicts,
      totalRequests,
      'Toutes les requêtes doivent avoir reçu un résultat explicite et cohérent'
    );
    passed++;
    testResults.push(
      `✔ Test 7: Test de charge sous concurrence (50 requêtes) : ${acceptedHolds} acceptées, ${rejectedConflicts} conflits refusés, ZERO double attribution constatée (${durationMs}ms)`
    );
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 7: ${err.message}`);
  }

  return {
    passed,
    failed,
    tests: testResults,
    metrics: {
      totalRequests,
      acceptedHolds,
      rejectedConflicts,
      doubleBookingsCount,
      serverErrorsCount,
      durationMs
    }
  };
}
