/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import { SeatHoldService } from '../services/seatHoldService';
import { BookingService } from '../services/bookingService';
import { TripService } from '../services/tripService';
import { User } from '../types';

export async function runSeatHoldTests(): Promise<{ passed: number; failed: number; tests: string[] }> {
  const testResults: string[] = [];
  let passed = 0;
  let failed = 0;

  SeatHoldService.resetForTesting();
  BookingService.resetForTesting();
  TripService.resetForTesting();

  const travelerA: User = {
    id: 'usr_traveler_alpha',
    name: 'Aminata Ouédraogo',
    phone: '+226 70 11 22 33',
    role: 'TRAVELER',
    status: 'ACTIVE',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01'
  };

  const travelerB: User = {
    id: 'usr_traveler_beta',
    name: 'Ibrahim Traoré',
    phone: '+226 76 44 55 66',
    role: 'TRAVELER',
    status: 'ACTIVE',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01'
  };

  // Test 1: Siège inexistant ou hors limites rejeté
  try {
    const res = await SeatHoldService.acquireHold({
      departureTripId: 'trip_01',
      seatNumbers: [999], // N'existe pas (car de 50 places)
      travelerId: travelerA.id
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorCode, 'INVALID_SEATS');
    passed++;
    testResults.push('✔ Test 1: Rejet immédiat des numéros de sièges inexistants ou hors limites');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 1: ${err.message}`);
  }

  // Test 2: Sièges dupliqués dans la requête rejetés
  try {
    const res = await SeatHoldService.acquireHold({
      departureTripId: 'trip_01',
      seatNumbers: [15, 15],
      travelerId: travelerA.id
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorCode, 'INVALID_SEATS');
    passed++;
    testResults.push('✔ Test 2: Détection et rejet des doublons de sièges dans une même requête');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 2: ${err.message}`);
  }

  // Test 3: Création valide d'un verrou avec expiration exacte à 10 minutes (600s)
  let holdAlphaId = '';
  try {
    const beforeMs = Date.now();
    const res = await SeatHoldService.acquireHold({
      departureTripId: 'trip_01',
      seatNumbers: [25, 26],
      travelerId: travelerA.id,
      holdDurationSeconds: 600
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.hold);
    holdAlphaId = res.hold!.id;

    assert.strictEqual(res.hold!.status, 'ACTIVE');
    assert.deepStrictEqual(res.hold!.seatIds, [25, 26]);

    const createdTime = new Date(res.hold!.createdAt).getTime();
    const expiresTime = new Date(res.hold!.expiresAt).getTime();
    const diffSeconds = Math.round((expiresTime - createdTime) / 1000);

    assert.strictEqual(diffSeconds, 600, 'La durée du verrou temporaire doit être d\'exactement 600 secondes (10 minutes)');
    passed++;
    testResults.push('✔ Test 3: Création réussie d\'un verrou temporaire conforme avec expiration à 10 minutes');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 3: ${err.message}`);
  }

  // Test 4: Calcul et intégrité du tarif côté serveur
  try {
    const bookingRes = await BookingService.createProvisionalBooking({
      seatHoldId: holdAlphaId,
      travelerId: travelerA.id,
      passengerName: travelerA.name,
      passengerPhone: travelerA.phone
    });

    assert.strictEqual(bookingRes.success, true);
    assert.ok(bookingRes.booking);

    const booking = bookingRes.booking!;
    const trip = TripService.getTripById('trip_01')!;

    assert.strictEqual(booking.unitPriceXof, trip.priceXOF, 'Tarif unitaire égal au prix du trajet');
    assert.strictEqual(booking.passengerCount, 2, '2 passagers');
    assert.strictEqual(
      booking.totalPriceXof,
      trip.priceXOF * 2,
      'Tarif total = tarif unitaire × nombre de passagers calculé côté serveur'
    );
    assert.strictEqual(booking.currency, 'XOF');
    assert.strictEqual(booking.status, 'HELD');
    passed++;
    testResults.push('✔ Test 4: Calcul strictement serveur du montant total en FCFA (XOF) sans dépendance client');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 4: ${err.message}`);
  }

  // Test 5: Libération volontaire du verrou par son propriétaire
  try {
    const holdBeta = await SeatHoldService.acquireHold({
      departureTripId: 'trip_01',
      seatNumbers: [45],
      travelerId: travelerB.id
    });
    assert.strictEqual(holdBeta.success, true);

    const releaseRes = await SeatHoldService.releaseHold(holdBeta.hold!.id, travelerB.id);
    assert.strictEqual(releaseRes.success, true);

    const checkedHold = SeatHoldService.getHoldById(holdBeta.hold!.id);
    assert.strictEqual(checkedHold?.status, 'RELEASED');
    passed++;
    testResults.push('✔ Test 5: Libération volontaire réussie du verrou par le voyageur titulaire');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 5: ${err.message}`);
  }

  // Test 6: Rejet d'un utilisateur tiers tentant de libérer le verrou d'un autre voyageur
  try {
    const holdA = await SeatHoldService.acquireHold({
      departureTripId: 'trip_01',
      seatNumbers: [48],
      travelerId: travelerA.id
    });
    assert.strictEqual(holdA.success, true);

    // Traveler B tente de libérer le hold de Traveler A -> REFUSÉ
    const illegalRelease = await SeatHoldService.releaseHold(holdA.hold!.id, travelerB.id);
    assert.strictEqual(illegalRelease.success, false);
    assert.ok(illegalRelease.error?.includes('autre utilisateur'));
    passed++;
    testResults.push('✔ Test 6: Protection d\'intégrité : interdiction de libérer le verrou d\'un tiers');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 6: ${err.message}`);
  }

  // Test 7: Expiration logique du verrou après écoulement du délai
  try {
    // Créer un hold avec une durée de 1 seconde pour simuler l'expiration
    const shortHold = await SeatHoldService.acquireHold({
      departureTripId: 'trip_02',
      seatNumbers: [3],
      travelerId: travelerA.id,
      holdDurationSeconds: 1
    });
    assert.strictEqual(shortHold.success, true);

    // Attendre 1,1 seconde
    await new Promise(r => setTimeout(r, 1100));

    const holdAfter = SeatHoldService.getHoldById(shortHold.hold!.id);
    assert.strictEqual(holdAfter?.status, 'EXPIRED', 'Le statut doit être logiquement EXPIRED');

    // Le siège 3 doit maintenant pouvoir être repris par Traveler B sans blocage !
    const reacquire = await SeatHoldService.acquireHold({
      departureTripId: 'trip_02',
      seatNumbers: [3],
      travelerId: travelerB.id
    });
    assert.strictEqual(reacquire.success, true, 'Le siège expiré doit être immédiatement réattribuable');
    passed++;
    testResults.push('✔ Test 7: Expiration automatique et libération du siège sans intervention manuelle');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 7: ${err.message}`);
  }

  // Test 8: Rejet de création d'une réservation à partir d'un verrou expiré
  try {
    const expiredHold = await SeatHoldService.acquireHold({
      departureTripId: 'trip_03',
      seatNumbers: [14],
      travelerId: travelerA.id,
      holdDurationSeconds: 1
    });

    await new Promise(r => setTimeout(r, 1100));

    const res = await BookingService.createProvisionalBooking({
      seatHoldId: expiredHold.hold!.id,
      travelerId: travelerA.id,
      passengerName: 'Passager Test',
      passengerPhone: '+226 70 00 00 00'
    });

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorCode, 'HOLD_EXPIRED');
    passed++;
    testResults.push('✔ Test 8: Rejet formel de création de réservation provisoire sur verrou expiré');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 8: ${err.message}`);
  }

  // Test 9: Idempotence d'une requête répétée (même clé, mêmes paramètres)
  try {
    const idemKey = 'idem_key_unique_123';
    const res1 = await SeatHoldService.acquireHold({
      departureTripId: 'trip_04',
      seatNumbers: [18],
      travelerId: travelerA.id,
      idempotencyKey: idemKey
    });

    assert.strictEqual(res1.success, true);

    // Répétition de la requête avec la même clé
    const res2 = await SeatHoldService.acquireHold({
      departureTripId: 'trip_04',
      seatNumbers: [18],
      travelerId: travelerA.id,
      idempotencyKey: idemKey
    });

    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.hold?.id, res1.hold?.id, 'Même identifiant de verrou retourné');
    passed++;
    testResults.push('✔ Test 9: Idempotence stricte : renvoi du même résultat sans double-verrouillage');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 9: ${err.message}`);
  }

  // Test 10: Conflit d'idempotence avec paramètres divergents
  try {
    const idemKey = 'idem_key_conflict_456';
    await SeatHoldService.acquireHold({
      departureTripId: 'trip_04',
      seatNumbers: [30],
      travelerId: travelerA.id,
      idempotencyKey: idemKey
    });

    // Même clé mais sièges différents -> Doit échouer
    const conflictRes = await SeatHoldService.acquireHold({
      departureTripId: 'trip_04',
      seatNumbers: [31],
      travelerId: travelerA.id,
      idempotencyKey: idemKey
    });

    assert.strictEqual(conflictRes.success, false);
    assert.strictEqual(conflictRes.errorCode, 'IDEMPOTENCY_CONFLICT');
    passed++;
    testResults.push('✔ Test 10: Détection et rejet des conflits de paramètres sur une même clé d\'idempotence');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 10: ${err.message}`);
  }

  // Test 11: Confidentialité et isolation des réservations entre voyageurs
  try {
    const holdA = await SeatHoldService.acquireHold({
      departureTripId: 'trip_05',
      seatNumbers: [5],
      travelerId: travelerA.id
    });

    const bookingA = await BookingService.createProvisionalBooking({
      seatHoldId: holdA.hold!.id,
      travelerId: travelerA.id,
      passengerName: travelerA.name,
      passengerPhone: travelerA.phone
    });

    // Traveler B tente d'accéder à la réservation de Traveler A -> Doit lever PRIVACY_VIOLATION
    assert.throws(() => {
      BookingService.getBookingById(bookingA.booking!.id, travelerB);
    }, /PRIVACY_VIOLATION/i);
    passed++;
    testResults.push('✔ Test 11: Isolation étanche des réservations : accès refusé aux tiers (PRIVACY_VIOLATION)');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 11: ${err.message}`);
  }

  return { passed, failed, tests: testResults };
}
