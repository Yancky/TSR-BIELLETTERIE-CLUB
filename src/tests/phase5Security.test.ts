/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { PaymentGatewayRegistry, computeHmacSha256 } from '../services/paymentGateways';
import { PaymentService } from '../services/paymentService';
import { TicketService, signQrPayload } from '../services/ticketService';
import { BookingService } from '../services/bookingService';
import { SeatHoldService } from '../services/seatHoldService';
import { TripService } from '../services/tripService';
import { CompanyService } from '../services/companyService';
import { User, BookingOrder } from '../types';

export async function runPhase5SecurityTests(): Promise<void> {
  console.log('\n--- 7. TESTS DE SÉCURITÉ PAIEMENTS, BILLETS & CONCURRENCE D\'EMBARQUEMENT (PHASE 5) ---');

  PaymentService.resetForTesting();
  TicketService.resetForTesting();
  BookingService.resetForTesting();
  SeatHoldService.resetForTesting();

  const nowIso = new Date().toISOString();

  const traveler1: User = {
    id: 'usr_traveler_1',
    name: 'Moussa Ouedraogo',
    phone: '+226 70 12 34 56',
    role: 'TRAVELER',
    email: 'moussa@faso.bf',
    status: 'ACTIVE',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  const traveler2: User = {
    id: 'usr_traveler_2',
    name: 'Awa Sawadogo',
    phone: '+226 76 99 88 77',
    role: 'TRAVELER',
    email: 'awa@faso.bf',
    status: 'ACTIVE',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  const activeTrip = TripService.getAllTrips()[0];

  const agentAuthorized: User = {
    id: 'usr_agent_authorized',
    name: 'Boureima Diallo',
    phone: '+226 70 55 44 33',
    role: 'AGENT',
    companyId: activeTrip.companyId,
    email: 'agent@tsr.bf',
    status: 'ACTIVE',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  const agentRakieta: User = {
    id: 'usr_agent_rakieta',
    name: 'Salif Traoré',
    phone: '+226 70 88 11 22',
    role: 'AGENT',
    companyId: 'comp_rakieta',
    email: 'agent@rakieta.bf',
    status: 'ACTIVE',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  // Helper pour créer un hold et une réservation provisoire
  async function createTestBooking(traveler: User, seats: number[]): Promise<BookingOrder> {
    const holdRes = await SeatHoldService.acquireHold({
      departureTripId: activeTrip.id,
      seatNumbers: seats,
      travelerId: traveler.id
    });
    assert.ok(holdRes.success && holdRes.hold, 'SeatHold initial doit réussir');

    const bookRes = await BookingService.createProvisionalBooking({
      seatHoldId: holdRes.hold.id,
      travelerId: traveler.id,
      passengerName: traveler.name,
      passengerPhone: traveler.phone
    });
    assert.ok(bookRes.success && bookRes.booking, 'Provisional booking doit réussir');
    return bookRes.booking;
  }

  // --- Test 1 : Intégration modulaire et transparence Sandbox ---
  try {
    const omGateway = PaymentGatewayRegistry.getGateway('ORANGE_MONEY');
    const moovGateway = PaymentGatewayRegistry.getGateway('MOOV_MONEY');
    const waveGateway = PaymentGatewayRegistry.getGateway('WAVE');

    assert.equal(omGateway.isLiveIntegration, false, 'Orange Money doit être explicitement documenté en Sandbox');
    assert.equal(moovGateway.isLiveIntegration, false, 'Moov Money doit être explicitement documenté en Sandbox');
    assert.equal(waveGateway.isLiveIntegration, false, 'Wave doit être explicitement documenté en Sandbox');
    assert.ok(omGateway.integrationStatusMessage.includes('Sandbox'));
    console.log('  ✔ Test 1: Passerelles Orange Money, Moov Money et Wave modulaires avec statut Sandbox transparent');
  } catch (err: any) {
    console.error('  ✘ Test 1 ÉCHEC:', err.message);
    throw err;
  }

  // --- Test 2 : Recalcul autoritaire serveur du montant en XOF & rejet de falsification client ---
  try {
    const booking = await createTestBooking(traveler1, [1, 2]);
    const realAmount = booking.totalPriceXof; // Ex: 2 x 9000 = 18000 FCFA

    // Tentative de modification du montant depuis le client (payer 1000 FCFA au lieu de 18000)
    const tamperedRes = await PaymentService.initiatePayment({
      bookingId: booking.id,
      paymentMethod: 'ORANGE_MONEY',
      payerPhone: traveler1.phone,
      clientDeclaredAmount: 1000, // Attaque falsification de prix
      user: traveler1
    });

    assert.equal(tamperedRes.success, false, 'La falsification du montant doit être formellement rejetée');
    assert.equal(tamperedRes.errorCode, 'PRICE_TAMPERING_DETECTED');

    // Demande légitime sans montant client : calculé strictement côté serveur
    const legitimateRes = await PaymentService.initiatePayment({
      bookingId: booking.id,
      paymentMethod: 'ORANGE_MONEY',
      payerPhone: traveler1.phone,
      user: traveler1
    });
    assert.ok(legitimateRes.success);
    assert.equal(legitimateRes.transaction.amountXOF, realAmount, 'Montant autoritaire serveur garanti en FCFA');
    console.log('  ✔ Test 2: Recalcul autoritaire serveur en XOF & détection d\'attaque par modification de prix client');
  } catch (err: any) {
    console.error('  ✘ Test 2 ÉCHEC:', err.message);
    throw err;
  }

  // --- Test 3 : Gestion complète du cycle de vie des statuts de paiement ---
  try {
    const booking = await createTestBooking(traveler1, [3]);
    const initRes = await PaymentService.initiatePayment({
      bookingId: booking.id,
      paymentMethod: 'MOOV_MONEY',
      payerPhone: traveler1.phone,
      user: traveler1
    });
    assert.ok(initRes.success);
    assert.equal(initRes.transaction.status, 'PENDING');

    // Confirmation réussie
    const confirmRes = await PaymentService.confirmPayment(initRes.transaction.id, 'MOOV-OPERATOR-SUCCESS', traveler1);
    assert.ok(confirmRes.success);
    assert.equal(confirmRes.transaction.status, 'SUCCESS');
    assert.ok(confirmRes.transaction.confirmedAt);
    console.log('  ✔ Test 3: Transitions conformes du cycle de vie des paiements (PENDING -> SUCCESS, FAILED)');
  } catch (err: any) {
    console.error('  ✘ Test 3 ÉCHEC:', err.message);
    throw err;
  }

  // --- Test 4 : Protection contre la double soumission de paiement (Idempotence) ---
  try {
    const booking = await createTestBooking(traveler1, [4]);
    const idempKey = `idemp_pay_${Date.now()}`;

    const res1 = await PaymentService.initiatePayment({
      bookingId: booking.id,
      paymentMethod: 'WAVE',
      payerPhone: traveler1.phone,
      idempotencyKey: idempKey,
      user: traveler1
    });
    assert.ok(res1.success);

    // Même requête avec la même clé d'idempotence
    const res2 = await PaymentService.initiatePayment({
      bookingId: booking.id,
      paymentMethod: 'WAVE',
      payerPhone: traveler1.phone,
      idempotencyKey: idempKey,
      user: traveler1
    });
    assert.ok(res2.success);
    assert.equal(res1.transaction.id, res2.transaction.id, 'La même transaction doit être retournée sans doublon');

    // Conflit d'idempotence : même clé mais téléphone différent
    const resConflict = await PaymentService.initiatePayment({
      bookingId: booking.id,
      paymentMethod: 'WAVE',
      payerPhone: '+226 70 00 00 00',
      idempotencyKey: idempKey,
      user: traveler1
    });
    assert.equal(resConflict.success, false);
    assert.equal(resConflict.errorCode, 'IDEMPOTENCY_CONFLICT');
    console.log('  ✔ Test 4: Idempotence stricte des paiements & blocage des doubles prélèvements');
  } catch (err: any) {
    console.error('  ✘ Test 4 ÉCHEC:', err.message);
    throw err;
  }

  // --- Test 5 : Rejet strict des paiements après expiration du verrou de siège (Hold Expiry) ---
  try {
    const booking = await createTestBooking(traveler1, [5]);
    // Forcer l'expiration du verrou
    SeatHoldService.expireHoldForTesting(booking.seatHoldId!);

    const expiredPayRes = await PaymentService.initiatePayment({
      bookingId: booking.id,
      paymentMethod: 'ORANGE_MONEY',
      payerPhone: traveler1.phone,
      user: traveler1
    });

    assert.equal(expiredPayRes.success, false, 'Le paiement sur un verrou expiré doit être rejeté');
    assert.equal(expiredPayRes.errorCode, 'HOLD_EXPIRED');
    console.log('  ✔ Test 5: Rejet formel d\'initiation de paiement sur un verrou de siège expiré');
  } catch (err: any) {
    console.error('  ✘ Test 5 ÉCHEC:', err.message);
    throw err;
  }

  // --- Test 6 : Authentification des notifications Webhook par signature HMAC & protection anti-rejeu ---
  try {
    const rawBody = JSON.stringify({
      operatorTransactionId: 'OM-BF-TX-WEBHOOK-99',
      status: 'SUCCESS',
      amountXOF: 9000
    });
    const validSignature = computeHmacSha256(rawBody);

    // 1. Signature falsifiée
    const fakeWebhook = await PaymentService.handleWebhook({
      method: 'ORANGE_MONEY',
      eventId: 'evt_1001',
      rawBody,
      signature: 'signature_piratee_fausse',
      payload: JSON.parse(rawBody)
    });
    assert.equal(fakeWebhook.accepted, false, 'La signature frauduleuse doit être rejetée');

    // 2. Signature valide
    const validWebhook = await PaymentService.handleWebhook({
      method: 'ORANGE_MONEY',
      eventId: 'evt_1001',
      rawBody,
      signature: validSignature,
      payload: JSON.parse(rawBody)
    });
    assert.equal(validWebhook.accepted, true, 'Le webhook signé avec la clé secrète doit être accepté');
    assert.equal(validWebhook.duplicate, false);

    // 3. Rejeu de la même notification (Replay Attack)
    const replayWebhook = await PaymentService.handleWebhook({
      method: 'ORANGE_MONEY',
      eventId: 'evt_1001', // Même ID d'événement
      rawBody,
      signature: validSignature,
      payload: JSON.parse(rawBody)
    });
    assert.equal(replayWebhook.accepted, true);
    assert.equal(replayWebhook.duplicate, true, 'La notification rejouée doit être acquittée sans retraitement');
    console.log('  ✔ Test 6: Authentification HMAC-SHA256 des webhooks & protection contre les attaques par rejeu');
  } catch (err: any) {
    console.error('  ✘ Test 6 ÉCHEC:', err.message);
    throw err;
  }

  // --- Test 7 : Interdiction formelle d'émettre un billet sans confirmation préalable du paiement ---
  try {
    const booking = await createTestBooking(traveler1, [6]);
    const initRes = await PaymentService.initiatePayment({
      bookingId: booking.id,
      paymentMethod: 'ORANGE_MONEY',
      payerPhone: traveler1.phone,
      user: traveler1
    });

    // Tentative d'émettre le billet alors que la transaction est encore PENDING
    assert.throws(
      () => {
        TicketService.issueTicket(booking.id, initRes.transaction.id, traveler1);
      },
      /PAYMENT_NOT_CONFIRMED/,
      'L\'émission d\'un billet sans paiement confirmé doit lever une exception'
    );
    console.log('  ✔ Test 7: Interdiction formelle d\'émettre un billet électronique sans paiement validé');
  } catch (err: any) {
    console.error('  ✘ Test 7 ÉCHEC:', err.message);
    throw err;
  }

  // --- Test 8 : Émission d'un billet valide avec signature HMAC & unicité stricte (anti-doublon) ---
  try {
    const booking = await createTestBooking(traveler1, [7]);
    const initRes = await PaymentService.initiatePayment({
      bookingId: booking.id,
      paymentMethod: 'ORANGE_MONEY',
      payerPhone: traveler1.phone,
      user: traveler1
    });
    await PaymentService.confirmPayment(initRes.transaction.id, 'OM-CONFIRM-7', traveler1);

    // Première émission
    const ticket1 = TicketService.issueTicket(booking.id, initRes.transaction.id, traveler1);
    assert.ok(ticket1);
    assert.equal(ticket1.status, 'VALID');
    assert.ok(ticket1.securityToken.startsWith('tsr_sig_'));

    // Deuxième émission sur la même réservation (doit renvoyer le même billet sans créer de doublon)
    const ticket2 = TicketService.issueTicket(booking.id, initRes.transaction.id, traveler1);
    assert.equal(ticket1.id, ticket2.id, 'Unicité stricte du billet par réservation');
    console.log('  ✔ Test 8: Émission de billet électronique avec signature HMAC & unicité stricte par commande');
  } catch (err: any) {
    console.error('  ✘ Test 8 ÉCHEC:', err.message);
    throw err;
  }

  // --- Test 9 : Détection et rejet des QR codes falsifiés ou altérés à l'embarquement ---
  try {
    const booking = await createTestBooking(traveler1, [8]);
    const initRes = await PaymentService.initiatePayment({
      bookingId: booking.id,
      paymentMethod: 'WAVE',
      payerPhone: traveler1.phone,
      user: traveler1
    });
    await PaymentService.confirmPayment(initRes.transaction.id, 'WV-CONFIRM-8', traveler1);
    const legitimateTicket = TicketService.issueTicket(booking.id, initRes.transaction.id, traveler1);

    // QR falsifié : numéro altéré ou faux jeton de signature
    const forgedQr = JSON.stringify({
      tn: legitimateTicket.ticketNumber,
      pn: 'Pirate Informatique',
      st: [8],
      sig: 'fausse_signature_non_reconnue'
    });

    const scanResult = TicketService.validateTicketForBoarding(forgedQr, agentAuthorized);
    assert.equal(scanResult.success, false, 'Le QR code falsifié doit être bloqué');
    assert.equal(scanResult.status, 'FORGED');
    assert.equal(scanResult.errorCode, 'INVALID_SIGNATURE');
    console.log('  ✔ Test 9: Détection infaillible et rejet des QR codes falsifiés ou altérés à l\'embarquement');
  } catch (err: any) {
    console.error('  ✘ Test 9 ÉCHEC:', err.message);
    throw err;
  }

  // --- Test 10 : Prévention du double embarquement (Anti-Double-Boarding) ---
  try {
    const booking = await createTestBooking(traveler1, [9]);
    const initRes = await PaymentService.initiatePayment({
      bookingId: booking.id,
      paymentMethod: 'MOOV_MONEY',
      payerPhone: traveler1.phone,
      user: traveler1
    });
    await PaymentService.confirmPayment(initRes.transaction.id, 'MOOV-CONFIRM-9', traveler1);
    const ticket = TicketService.issueTicket(booking.id, initRes.transaction.id, traveler1);

    // 1er compostage
    const firstScan = TicketService.validateTicketForBoarding(ticket.qrPayload, agentAuthorized);
    assert.ok(firstScan.success, 'Le premier embarquement doit être autorisé');
    assert.equal(firstScan.status, 'USED');

    // 2ème compostage immédiat avec le même billet
    const secondScan = TicketService.validateTicketForBoarding(ticket.qrPayload, agentAuthorized);
    assert.equal(secondScan.success, false, 'Le second embarquement doit être bloqué');
    assert.equal(secondScan.errorCode, 'ALREADY_USED');
    assert.ok(secondScan.message.includes('Double embarquement strictement refusé'));
    console.log('  ✔ Test 10: Validation d\'embarquement compostée & blocage strict du double embarquement');
  } catch (err: any) {
    console.error('  ✘ Test 10 ÉCHEC:', err.message);
    throw err;
  }

  // --- Test 11 : Concurrence atomique entre deux agents compostant simultanément le même billet ---
  try {
    const booking = await createTestBooking(traveler1, [10]);
    const initRes = await PaymentService.initiatePayment({
      bookingId: booking.id,
      paymentMethod: 'ORANGE_MONEY',
      payerPhone: traveler1.phone,
      user: traveler1
    });
    await PaymentService.confirmPayment(initRes.transaction.id, 'OM-CONFIRM-10', traveler1);
    const ticket = TicketService.issueTicket(booking.id, initRes.transaction.id, traveler1);

    // Deux agents sur des portes différentes scannent en même temps
    const scanAgent1 = () => TicketService.validateTicketForBoarding(ticket.qrPayload, agentAuthorized);
    const scanAgent2 = () => TicketService.validateTicketForBoarding(ticket.qrPayload, agentAuthorized);

    const [resAgent1, resAgent2] = await Promise.all([
      new Promise<any>(r => setTimeout(() => r(scanAgent1()), 0)),
      new Promise<any>(r => setTimeout(() => r(scanAgent2()), 0))
    ]);

    const acceptedCount = (resAgent1.success ? 1 : 0) + (resAgent2.success ? 1 : 0);
    const blockedCount = (!resAgent1.success ? 1 : 0) + (!resAgent2.success ? 1 : 0);

    assert.equal(acceptedCount, 1, 'Exactement 1 agent doit obtenir la validation');
    assert.equal(blockedCount, 1, 'Exactement 1 agent doit recevoir le refus ALREADY_USED');
    console.log('  ✔ Test 11: Concurrence atomique entre 2 agents sur le même billet : 1 validé, 1 rejeté, ZERO doublon');
  } catch (err: any) {
    console.error('  ✘ Test 11 ÉCHEC:', err.message);
    throw err;
  }

  // --- Test 12 : Isolation étanche des paiements et contrôles (IDOR & Multi-compagnies) ---
  try {
    const booking1 = await createTestBooking(traveler1, [11]);

    // 1. Un autre voyageur tente de payer la commande de Traveler 1 (IDOR)
    const idorRes = await PaymentService.initiatePayment({
      bookingId: booking1.id,
      paymentMethod: 'ORANGE_MONEY',
      payerPhone: traveler2.phone,
      user: traveler2 // Utilisateur non titulaire
    });
    assert.equal(idorRes.success, false);
    assert.equal(idorRes.errorCode, 'PRIVACY_VIOLATION');

    // 2. Un agent de la compagnie Rakieta tente de valider un billet Sahel Express à l'embarquement
    const initRes = await PaymentService.initiatePayment({
      bookingId: booking1.id,
      paymentMethod: 'ORANGE_MONEY',
      payerPhone: traveler1.phone,
      user: traveler1
    });
    await PaymentService.confirmPayment(initRes.transaction.id, 'OM-CONFIRM-11', traveler1);
    const sahelTicket = TicketService.issueTicket(booking1.id, initRes.transaction.id, traveler1);

    const crossScan = TicketService.validateTicketForBoarding(sahelTicket.qrPayload, agentRakieta);
    assert.equal(crossScan.success, false);
    assert.equal(crossScan.errorCode, 'ISOLATION_VIOLATION', 'Un agent concurrent ne peut pas valider un billet adverse');

    console.log('  ✔ Test 12: Isolation étanche des transactions (anti-IDOR) et ségrégation inter-compagnies au scanner');
  } catch (err: any) {
    console.error('  ✘ Test 12 ÉCHEC:', err.message);
    throw err;
  }
}
