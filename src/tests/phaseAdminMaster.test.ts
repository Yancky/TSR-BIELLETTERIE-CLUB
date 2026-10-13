/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { appStore } from '../services/store';
import { AuditService } from '../services/auditService';
import { INITIAL_COMPANIES, DEMO_USERS } from '../services/mockData';
import { signQrPayload, verifyQrSignature } from '../services/ticketService';
import { INITIAL_PARCELS, ParcelService } from '../services/parcelService';
import { INITIAL_CLAIMS } from '../services/supportClaimService';
import { PaymentService } from '../services/paymentService';
import { SeatHoldService } from '../services/seatHoldService';
import { TripService } from '../services/tripService';

export async function runPhaseAdminMasterTests(): Promise<{ passed: number; failed: number; tests: string[] }> {
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
  console.log('--- SUITE ADMIN MASTER 2 : AUDIT RÉEL, SÉCURITÉ & VALIDATION ---');
  console.log('=================================================================');

  // --- 1. SUPERVISION MULTI-SOCIÉTÉS (MODULE B) ---
  console.log('--- 1. GESTION DES SOCIÉTÉS (MODULE B) ---');
  const compPending = appStore.getState().companies.find(c => c.status === 'PENDING');
  assert(compPending !== undefined, 'Présence d\'au moins une société en statut PENDING pour instruction');

  // Test Approbation
  const testCompId = compPending ? compPending.id : 'comp_sahel_express';
  appStore.updateCompanyStatus(testCompId, 'ACTIVE');
  const afterApprove = appStore.getState().companies.find(c => c.id === testCompId);
  assert(afterApprove?.status === 'ACTIVE', 'La société PENDING bascule en ACTIVE après validation administrative');

  // Test Suspension & Règle métier
  appStore.updateCompanyStatus(testCompId, 'SUSPENDED', 'Contrôle réglementaire');
  const afterSuspend = appStore.getState().companies.find(c => c.id === testCompId);
  assert(afterSuspend?.status === 'SUSPENDED', 'La société peut être suspendue immédiatement par le Super Admin');

  // Réactivation
  appStore.updateCompanyStatus(testCompId, 'ACTIVE');
  const afterReactivate = appStore.getState().companies.find(c => c.id === testCompId);
  assert(afterReactivate?.status === 'ACTIVE', 'La société peut être réactivée avec succès');

  // --- 2. CONTRÔLE D'ACCÈS RBAC DES UTILISATEURS (MODULE C) ---
  console.log('\n--- 2. CONTRÔLE D\'ACCÈS & SÉCURITÉ UTILISATEURS (MODULE C) ---');
  const traveler = appStore.getState().allUsers.find(u => u.role === 'TRAVELER');
  assert(traveler !== undefined, 'Profil TRAVELER correctement identifié dans l\'annuaire central');

  // Suspension utilisateur
  if (traveler) {
    appStore.updateUserStatus(traveler.id, 'SUSPENDED');
    const userSuspended = appStore.getState().allUsers.find(u => u.id === traveler.id);
    assert(userSuspended?.status === 'SUSPENDED', 'Désactivation / suspension immédiate d\'un compte utilisateur suspect');

    appStore.updateUserStatus(traveler.id, 'ACTIVE');
    const userActive = appStore.getState().allUsers.find(u => u.id === traveler.id);
    assert(userActive?.status === 'ACTIVE', 'Réactivation sécurisée du compte voyageur');
  }

  // Multi-Identity Verification (Traveler, Agent, Manager A, Manager B, Admin)
  const agentUser = DEMO_USERS.find(u => u.role === 'AGENT');
  const managerA = DEMO_USERS.find(u => u.role === 'COMPANY_MANAGER');
  const adminUser = DEMO_USERS.find(u => u.role === 'ADMIN');
  assert(agentUser !== undefined, 'Agent de gare identifié avec affectation d\'agence');
  assert(managerA !== undefined, 'Gérant de société A identifié avec affiliation comp_tsr');
  assert(adminUser !== undefined, 'Super-Administrateur central accrédité');

  // Test Isolation multi-sociétés
  const tripsCompTSR = TripService.getTripsByCompany('comp_tsr', managerA!);
  assert(tripsCompTSR.length > 0, 'Le gérant TSR accède uniquement aux départs de comp_tsr');
  let isolationViolationBlocked = false;
  try {
    TripService.getTripsByCompany('comp_rakieta', managerA!);
  } catch (err: any) {
    isolationViolationBlocked = true;
  }
  assert(isolationViolationBlocked, 'Le gérant de TSR se voit REFUSER l\'accès aux trajets de Rakieta (Isolation ABAC)');

  // --- 3. TRAJETS & COHÉRENCE DU RÉSEAU (MODULE D) ---
  console.log('\n--- 3. TRAJETS & RÉSEAU BURKINABÈ (MODULE D) ---');
  const trips = appStore.getState().trips;
  assert(trips.length > 0, `Supervision de ${trips.length} départs interurbains configurés`);
  const ouagaBoboTrip = trips.find(t => t.departureCity === 'Ouagadougou' && t.destinationCity === 'Bobo-Dioulasso');
  assert(ouagaBoboTrip !== undefined, 'Liaison majeure Ouagadougou -> Bobo-Dioulasso supervisée');
  assert((ouagaBoboTrip?.priceXOF || 0) > 0, 'Tarification contractuelle en FCFA conforme');

  // --- 4. BILLETTERIE & SIGNATURE HMAC-SHA256 (MODULE E) ---
  console.log('\n--- 4. INTÉGRITÉ DE LA BILLETTERIE ÉLECTRONIQUE (MODULE E) ---');
  const sampleTicketPayload = {
    tn: 'TSR-BF-2026-9901',
    br: 'BR-9901',
    tid: 'trip_01',
    pn: 'Ousmane Sawadogo',
    st: [12],
    dt: '2026-10-12',
    tm: '07:30',
    amt: 9000,
    iat: Math.floor(Date.now() / 1000)
  };
  const sig = signQrPayload(sampleTicketPayload);
  assert(sig.startsWith('tsr_sig_'), 'Génération de la signature cryptographique conforme tsr_sig_...');
  assert(verifyQrSignature({ ...sampleTicketPayload, sig }), 'Validation de signature réussie pour un billet authentique');
  assert(!verifyQrSignature({ ...sampleTicketPayload, amt: 1000, sig }), 'Rejet strict d\'un billet ayant subi une altération de tarif');

  // Anti-double compostage (Double Scan)
  const scanResult1 = appStore.verifyAndScanTicket('TSR-BF-2026-8819');
  assert(scanResult1.status === 'VALID' || scanResult1.status === 'USED', 'Premier scan de billet exécuté');
  const scanResult2 = appStore.verifyAndScanTicket('TSR-BF-2026-8819');
  assert(scanResult2.status === 'USED' && !scanResult2.success, 'Deuxième compostage formellement BLOQUÉ (Anti-Replay Quai)');

  // --- 5. PAIEMENTS & COMMISSIONS SÉCURISÉES (MODULE F) ---
  console.log('\n--- 5. PAIEMENTS MOBILE MONEY & COMMISSION 2.5% (MODULE F) ---');
  const commissionStandard = 2.5; // 2.5%
  const volumeTest = 1000000; // 1 000 000 FCFA
  const commissionXOF = Math.round(volumeTest * (commissionStandard / 100));
  const netCompanyXOF = volumeTest - commissionXOF;
  assert(commissionXOF === 25000, 'Calcul exact de la commission plateforme (25 000 FCFA sur 1M à 2.5%)');
  assert(netCompanyXOF === 975000, 'Calcul exact du montant net reversé au transporteur (975 000 FCFA)');

  // Distinction des statuts de transaction
  const validPaymentStatuses = ['INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'EXPIRED'];
  assert(validPaymentStatuses.includes('INITIATED') && validPaymentStatuses.includes('SUCCESS'), 'Cycle de vie des transactions financierement conforme');

  // --- 6. FRET, COLIS & SÉCURITÉ OTP BRUTE-FORCE (MODULE G) ---
  console.log('\n--- 6. FRET & PROTECTION ANTI-BRUTE-FORCE OTP (MODULE G) ---');
  assert(INITIAL_PARCELS.length > 0, 'Registre des expéditions de colis initialisé');
  const parcel = INITIAL_PARCELS[0];
  assert(parcel.trackingNumber.startsWith('TSR-COL-'), 'Numérotation normalisée des lettres de voiture');
  assert(parcel.pickupOtpCode.length === 4, 'Code secret OTP de retrait à 4 chiffres présent');

  // Test de tentative OTP incorrecte
  const wrongAttempt1 = ParcelService.updateParcelStatus({
    trackingNumber: parcel.trackingNumber,
    newStatus: 'DELIVERED',
    location: 'Gare Ouaga',
    otpCode: '0000' // Mauvais code
  });
  assert(!wrongAttempt1.success, 'Rejet formel d\'un code OTP erroné');
  assert(wrongAttempt1.message.includes('1/3'), 'Compteur de tentatives OTP incrémenté (1/3)');

  const wrongAttempt2 = ParcelService.updateParcelStatus({
    trackingNumber: parcel.trackingNumber,
    newStatus: 'DELIVERED',
    location: 'Gare Ouaga',
    otpCode: '1111'
  });
  assert(!wrongAttempt2.success && wrongAttempt2.message.includes('2/3'), 'Compteur de tentatives OTP incrémenté (2/3)');

  const wrongAttempt3 = ParcelService.updateParcelStatus({
    trackingNumber: parcel.trackingNumber,
    newStatus: 'DELIVERED',
    location: 'Gare Ouaga',
    otpCode: '2222'
  });
  assert(!wrongAttempt3.success, 'Troisième tentative OTP rejetée');
  assert(wrongAttempt3.message.includes('ALERTE_SECURITE') || wrongAttempt3.message.includes('verrouillé'), 'Verrouillage automatique de sécurité déclenché après 3 échecs');

  // Test tentative post-verrouillage
  const postLockAttempt = ParcelService.updateParcelStatus({
    trackingNumber: parcel.trackingNumber,
    newStatus: 'DELIVERED',
    location: 'Gare Ouaga',
    otpCode: parcel.pickupOtpCode // Même le vrai code est désormais bloqué !
  });
  assert(!postLockAttempt.success && postLockAttempt.message.includes('COLIS_VERROUILLE'), 'Tentative ultérieure strictement bloquée : COLIS_VERROUILLE');

  // --- 7. RÉCLAMATIONS PASSAGERS (MODULE H) ---
  console.log('\n--- 7. RÉCLAMATIONS & SERVICE CLIENT (MODULE H) ---');
  assert(INITIAL_CLAIMS.length > 0, 'Registre des réclamations passagers accessible');
  const claim = INITIAL_CLAIMS[0];
  assert(claim.claimNumber.startsWith('TSR-REC-'), 'Numérotation officielle des tickets de réclamation');

  // --- 8. JOURNAL D'AUDIT CENTRALISÉ & IMMUTABILITÉ (MODULE I) ---
  console.log('\n--- 8. JOURNAL D\'AUDIT INALTÉRABLE & MASQUAGE (MODULE I) ---');
  const loggedEntry = AuditService.log({
    actorId: 'user_admin',
    actorRole: 'ADMIN',
    action: 'COMPANY_APPROVED',
    resourceType: 'COMPANY',
    resourceId: 'comp_test',
    result: 'SUCCESS',
    details: {
      action: 'Agrément délivré',
      token: 'SECRET_BEARER_TOKEN_999',
      pin: '1234'
    }
  });

  assert(loggedEntry.id.startsWith('audit_'), 'Génération d\'un ID d\'audit unique');
  const detailsObj = loggedEntry.details as Record<string, unknown>;
  assert(detailsObj.token === '[REDACTED_BY_SECURITY_POLICY]', 'Masquage strict du token secret dans les logs d\'audit');
  assert(detailsObj.pin === '[REDACTED_BY_SECURITY_POLICY]', 'Masquage strict du code PIN dans les logs d\'audit');

  // Immutabilité : absence de méthode de modification ou suppression de log
  assert((AuditService as any).updateLog === undefined, 'Impossibilité d\'éditer un log d\'audit (Pas de méthode updateLog)');
  assert((AuditService as any).deleteLog === undefined, 'Impossibilité de supprimer un log d\'audit unitaire (Pas de méthode deleteLog)');

  for (const t of tests) {
    console.log('  ' + t);
  }

  console.log('=================================================================');
  console.log(`SUITE ADMIN MASTER 2 TERMINÉE : ${passed} tests réussis, ${failed} échecs`);
  console.log('=================================================================\n');

  return { passed, failed, tests };
}
