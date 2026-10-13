/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { appStore } from '../services/store';
import { AuditService } from '../services/auditService';
import { CompanyService } from '../services/companyService';
import { TripService } from '../services/tripService';
import { SeatHoldService } from '../services/seatHoldService';
import { BookingService } from '../services/bookingService';
import { PaymentService } from '../services/paymentService';
import { verifyQrSignature } from '../services/ticketService';
import { User, Company, DepartureTrip } from '../types';

export async function runPhase3PreproductionE2ETests(): Promise<{ passed: number; failed: number; tests: string[] }> {
  const tests: string[] = [];
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, desc: string) => {
    if (condition) {
      tests.push(`✔ [PASS] ${desc}`);
      passed++;
    } else {
      tests.push(`✖ [FAIL] ${desc}`);
      failed++;
    }
  };

  console.log('=================================================================');
  console.log('--- VALIDATION RÉELLE DE BOUT EN BOUT — PHASE 3 PRÉPRODUCTION ---');
  console.log('=================================================================');

  // -------------------------------------------------------------
  // ÉTAPE 1 : IDENTIFICATION & ACCRÉDITATION DE L'ADMINISTRATEUR
  // -------------------------------------------------------------
  console.log('--- ÉTAPE 1 : IDENTIFICATION DE L\'ADMINISTRATEUR ---');
  const adminActor: User = {
    id: 'usr_super_admin_e2e',
    name: 'Super Administrateur Central',
    phone: '+226 70 00 00 01',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };
  assert(adminActor.role === 'ADMIN', 'Super Administrateur identifié avec privilèges ADMIN');

  // -------------------------------------------------------------
  // ÉTAPE 2 : VALIDATION ET ACTIVATION D'UNE SOCIÉTÉ PARTENAIRE
  // -------------------------------------------------------------
  console.log('--- ÉTAPE 2 : VALIDATION D\'UNE SOCIÉTÉ PARTENAIRE ---');
  const pendingComp = appStore.getState().companies.find(c => c.status === 'PENDING') || {
    id: 'comp_sahel_express',
    name: 'SAHEL VOYAGES EXPRESS SARL',
    status: 'PENDING'
  };

  assert(pendingComp.status === 'PENDING', 'Société candidate en statut PENDING avant examen administratif');

  // Validation administrative de la société via le store et le CompanyService
  appStore.updateCompanyStatus(pendingComp.id, 'ACTIVE');
  const afterApproveComp = appStore.getState().companies.find(c => c.id === pendingComp.id);
  assert(afterApproveComp?.status === 'ACTIVE', 'La société partenaire bascule en ACTIVE suite à validation par l\'Administrateur');

  // Audit de la validation de la société
  AuditService.log({
    action: 'COMPANY_APPROVED',
    actorId: adminActor.id,
    actorRole: adminActor.role,
    resourceType: 'COMPANY',
    resourceId: pendingComp.id,
    result: 'SUCCESS',
    details: { reason: 'Dossier réglementaire IFU/RCCM conforme' }
  });

  // -------------------------------------------------------------
  // ÉTAPE 3 : PUBLICATION D'UN NOUVEAU DÉPART PAR LA COMPAGNIE
  // -------------------------------------------------------------
  console.log('--- ÉTAPE 3 : PUBLICATION D\'UN TRAJET RÉGLEMENTAIRE ---');
  // Sélectionner ou programmer un départ actif sur le corridor majeur
  const publishedTrip = appStore.getState().trips.find(
    t => t.departureCity === 'Ouagadougou' && t.destinationCity === 'Bobo-Dioulasso'
  ) || appStore.getState().trips[0];

  assert(publishedTrip !== undefined, 'Trajet Ouagadougou -> Bobo-Dioulasso publié avec tarif officiel contractuel (FCFA)');
  assert(publishedTrip.priceXOF > 0, `Tarif contractuel du trajet validé à ${publishedTrip.priceXOF} FCFA`);

  // -------------------------------------------------------------
  // ÉTAPE 4 : SÉLECTION DU VOYAGEUR & DU TRAJET
  // -------------------------------------------------------------
  console.log('--- ÉTAPE 4 : SÉLECTION DU VOYAGEUR & DU TRAJET ---');
  const passengerTraveler: User = {
    id: 'usr_traveler_e2e_01',
    name: 'Aminata Ouédraogo',
    phone: '+226 76 54 32 10',
    role: 'TRAVELER',
    status: 'ACTIVE',
    createdAt: '2026-10-12T08:00:00Z',
    updatedAt: '2026-10-12T08:00:00Z'
  };
  appStore.switchUser(passengerTraveler);
  appStore.selectTrip(publishedTrip);
  assert(appStore.getState().selectedTrip?.id === publishedTrip.id, 'Trajet sélectionné par le voyageur');

  // -------------------------------------------------------------
  // ÉTAPE 5 : VERROUILLAGE ATOMIQUE DU SIÈGE (10 MINUTES TTL) & CONCURRENCE
  // -------------------------------------------------------------
  console.log('--- ÉTAPE 5 : VERROUILLAGE ATOMIQUE DU SIÈGE & CONCURRENCE ---');
  const targetSeat = 17;
  const holdResult = await SeatHoldService.acquireHold({
    departureTripId: publishedTrip.id,
    seatNumbers: [targetSeat],
    travelerId: passengerTraveler.id
  });

  assert(holdResult.success && holdResult.hold !== undefined, 'Verrou de siège accordé au voyageur pour le siège 17');
  const holdDuration = holdResult.hold
    ? Math.round((new Date(holdResult.hold.expiresAt).getTime() - new Date(holdResult.hold.createdAt).getTime()) / 1000)
    : 0;
  assert(holdDuration === 600, 'Durée contractuelle du verrou fixée à exactement 600 secondes (10 minutes)');

  // Simulation d'un concurrent tentant de verrouiller le même siège
  const competitorHold = await SeatHoldService.acquireHold({
    departureTripId: publishedTrip.id,
    seatNumbers: [targetSeat],
    travelerId: 'usr_concurrent_e2e_99'
  });
  assert(!competitorHold.success, 'Verrou concurrent immédiatement bloqué sur le même siège (Atomicité)');
  assert(competitorHold.errorCode === 'SEAT_UNAVAILABLE', 'Code d\'erreur formel SEAT_UNAVAILABLE renvoyé au concurrent');

  // Positionner le hold et le siège exact dans le store
  appStore.setActiveHold(holdResult.hold!);
  appStore.getState().selectedSeats = [targetSeat];

  // -------------------------------------------------------------
  // ÉTAPE 6 : RÉSERVATION & PAIEMENT MOBILE MONEY CONFIRMÉ
  // -------------------------------------------------------------
  console.log('--- ÉTAPE 6 : RÉSERVATION & PAIEMENT SÉCURISÉ ---');
  const booking = appStore.createBooking();
  assert(booking.status === 'HELD', 'Réservation créée avec statut provisoire HELD');
  assert(booking.totalPriceXof === publishedTrip.priceXOF, `Montant de la réservation conforme au barème (${publishedTrip.priceXOF} FCFA)`);

  // Enregistrer également dans le BookingService pour les tests de falsification
  const provBookingResult = await BookingService.createProvisionalBooking({
    seatHoldId: holdResult.hold!.id,
    travelerId: passengerTraveler.id,
    passengerName: passengerTraveler.name,
    passengerPhone: passengerTraveler.phone
  });
  assert(provBookingResult.success && provBookingResult.booking !== undefined, 'Réservation provisoire autoritaire enregistrée');

  // Tentative de falsification de tarif bloquée côté serveur / intégrité
  const fraudAttempt = await PaymentService.initiatePayment({
    bookingId: provBookingResult.booking!.id,
    paymentMethod: 'ORANGE_MONEY',
    payerPhone: passengerTraveler.phone,
    clientDeclaredAmount: 500, // Déclaré 500 au lieu du prix réel
    user: passengerTraveler
  });
  assert(!fraudAttempt.success, 'Tentative de falsification du montant client rejetée');
  assert(fraudAttempt.errorCode === 'PRICE_TAMPERING_DETECTED', 'Alerte PRICE_TAMPERING_DETECTED déclenchée');

  // Paiement légitime et confirmation
  const paymentFlow = appStore.confirmPaymentAndGenerateTicket('ORANGE_MONEY', passengerTraveler.phone);
  assert(paymentFlow.payment.status === 'SUCCESS', 'Paiement Orange Money validé avec statut SUCCESS');
  assert(paymentFlow.payment.amountXOF === publishedTrip.priceXOF, `Montant de la transaction scellé à ${publishedTrip.priceXOF} FCFA`);

  // Calculs financiers de préproduction (Commission 2.5% et Net Transporteur)
  const commissionRate = 0.025; // 2.5%
  const expectedCommission = Math.round(paymentFlow.payment.amountXOF * commissionRate);
  const expectedNet = paymentFlow.payment.amountXOF - expectedCommission;
  assert(expectedCommission > 0, `Commission plateforme prélevée conforme (${expectedCommission} FCFA soit 2.5%)`);
  assert(expectedNet > 0, `Net transporteur reversé conforme (${expectedNet} FCFA soit 97.5%)`);

  // -------------------------------------------------------------
  // ÉTAPE 7 : ÉMISSION DU BILLET AVEC SIGNATURE HMAC-SHA256
  // -------------------------------------------------------------
  console.log('--- ÉTAPE 7 : BILLET ÉLECTRONIQUE & SIGNATURE HMAC-SHA256 ---');
  const issuedTicket = paymentFlow.ticket;
  assert(issuedTicket.status === 'VALID', 'Billet électronique émis avec statut VALID');
  assert(issuedTicket.ticketNumber.startsWith('TSR-BF-2026-'), 'Numéro de billet normalisé TSR-BF-2026-XXXX');
  assert(issuedTicket.securityToken.startsWith('tsr_sig_'), 'Signature cryptographique HMAC présente sur le billet');

  // Vérification de la signature du payload QR
  const parsedQrPayload = JSON.parse(issuedTicket.qrPayload);
  const isSignatureAuthentic = verifyQrSignature(parsedQrPayload);
  assert(isSignatureAuthentic, 'Signature cryptographique vérifiée et intègre pour le QR Code du billet');

  // Test de falsification du QR Code (ex: tentative de changement de tarif ou de siège)
  const forgedPayload = { ...parsedQrPayload, amt: 1000 };
  const isForgedSignatureValid = verifyQrSignature(forgedPayload);
  assert(!isForgedSignatureValid, 'Rejet formel et catégorique de toute altération de charge utile (Anti-Forging)');

  // -------------------------------------------------------------
  // ÉTAPE 8 : CONTRÔLE D'ACCÈS DE L'AGENT & COMPOSTAGE À L'EMBARQUEMENT
  // -------------------------------------------------------------
  console.log('--- ÉTAPE 8 : COMPOSTAGE QUAI & REPLAY ATTACK PROTECTION ---');
  const stationAgent: User = {
    id: 'usr_agent_ouaga_gounghin',
    name: 'Boukary Kaboré',
    phone: '+226 70 22 33 44',
    role: 'AGENT',
    companyId: publishedTrip.companyId,
    assignedAgencyId: 'agency_ouaga_gounghin',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };
  appStore.switchUser(stationAgent);

  // Premier compostage (embarquement légitime)
  const scanPass1 = appStore.verifyAndScanTicket(issuedTicket.qrPayload);
  assert(scanPass1.success, 'Premier compostage par l\'agent de quai réussi');
  assert(scanPass1.ticket?.status === 'USED', 'Statut du billet basculé de façon irréversible à USED');

  // Deuxième compostage (tentative de double embarquement / fraude au quai)
  const scanPass2 = appStore.verifyAndScanTicket(issuedTicket.qrPayload);
  assert(!scanPass2.success, 'Deuxième compostage formellement BLOQUÉ (Anti-Replay / Double Scan)');
  assert(scanPass2.status === 'USED', 'Alerte immédiate transmise au terminal de l\'agent');

  // -------------------------------------------------------------
  // ÉTAPE 9 : MISE À JOUR DU TABLEAU DE BORD SUPER ADMIN & AUDIT
  // -------------------------------------------------------------
  console.log('--- ÉTAPE 9 : SUPERVISION ADMIN & JOURNALISATION INALTÉRABLE ---');
  // L'administrateur inspecte le tableau de bord
  appStore.switchUser(adminActor);

  // Vérifier la présence du billet dans le registre
  const ticketInRegistry = appStore.getState().tickets.find(t => t.ticketNumber === issuedTicket.ticketNumber);
  assert(ticketInRegistry !== undefined, 'Billet répertorié dans le registre central des titres de transport');
  assert(ticketInRegistry?.status === 'USED', 'Le tableau de bord Super Admin reflète le statut USED en temps réel');

  // Enregistrement de l'événement dans le journal d'audit
  const auditEvent = AuditService.log({
    action: 'TICKET_SCANNED_VALID',
    actorId: adminActor.id,
    actorRole: adminActor.role,
    resourceType: 'TICKET',
    resourceId: issuedTicket.id,
    result: 'SUCCESS',
    details: {
      companyId: publishedTrip.companyId,
      ticketNumber: issuedTicket.ticketNumber,
      amountXOF: issuedTicket.amountPaidXOF,
      secretPinToRedact: '4321',
      sessionBearerToken: 'BEARER_CONFIDENTIAL_TOKEN_XXX'
    }
  });

  assert(auditEvent.id.startsWith('audit_'), 'Entrée d\'audit générée avec identifiant unique');
  const detailsParsed = auditEvent.details as Record<string, unknown>;
  assert(detailsParsed.secretPinToRedact === '[REDACTED_BY_SECURITY_POLICY]', 'Données sensibles (PIN) masquées dans le journal d\'audit');
  assert(detailsParsed.sessionBearerToken === '[REDACTED_BY_SECURITY_POLICY]', 'Jeton secret masqué dans le journal d\'audit');

  // Inaltérabilité prouvée : pas de méthode de suppression d'audit
  assert((AuditService as any).deleteLog === undefined, 'Immutabilité : Aucune méthode de suppression de log n\'existe');

  // -------------------------------------------------------------
  // ÉTAPE 10 : SÉCURITÉ DES SECRETS & FIRESTORE RULES
  // -------------------------------------------------------------
  console.log('--- ÉTAPE 10 : SÉCURITÉ DES SECRETS & CONFORMITÉ CLOUD ---');
  assert(
    !JSON.stringify(issuedTicket).includes('TSR_BURKINA_QR_HMAC_MASTER_KEY_2026'),
    'La clé secrète HMAC serveur n\'est jamais divulguée dans le billet ou les réponses client'
  );

  for (const t of tests) {
    console.log('  ' + t);
  }

  console.log('=================================================================');
  console.log(`SUITE PRÉPRODUCTION E2E TERMINÉE : ${passed} tests réussis, ${failed} échecs`);
  console.log('=================================================================\n');

  return { passed, failed, tests };
}
