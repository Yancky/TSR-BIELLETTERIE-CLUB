/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { DestinationService } from '../services/destinationService';
import { ScheduleCalendarService } from '../services/scheduleCalendarService';
import { AgencyDirectoryService } from '../services/agencyDirectoryService';
import { PartnerCompanyService } from '../services/partnerCompanyService';
import { ParcelService } from '../services/parcelService';
import { LostFoundService } from '../services/lostFoundService';
import { SupportClaimService } from '../services/supportClaimService';
import { LoyaltyService } from '../services/loyaltyService';
import { OperationalReportService } from '../services/operationalReportService';

export async function runPhaseV2Tests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- 8. SUITE DE TESTS SERVICES MÉTIER PHASE V2 (PAGES 24 À 33) ---');
  let passed = 0;
  let failed = 0;

  // Test 1: DestinationService
  try {
    const all = DestinationService.getAllDestinations();
    assert.ok(all.length >= 6, 'Devrait avoir au moins 6 destinations burkinabè');
    const ouaga = DestinationService.getDestinationById('dest_ouaga');
    assert.strictEqual(ouaga?.cityName, 'Ouagadougou');
    const searchRes = DestinationService.searchDestinations('Bobo');
    assert.strictEqual(searchRes[0].cityName, 'Bobo-Dioulasso');
    console.log('  ✔ Test 1: Annuaire des destinations burkinabè et recherche contextuelle');
    passed++;
  } catch (err: unknown) {
    console.error('  ✘ Test 1 échec:', (err as Error).message);
    failed++;
  }

  // Test 2: ScheduleCalendarService
  try {
    const allSchedules = ScheduleCalendarService.getAllSchedules();
    assert.ok(allSchedules.length >= 10, 'Devrait avoir au moins 10 horaires de départs réguliers');
    const filtered = ScheduleCalendarService.filterSchedules({
      origin: 'Ouagadougou',
      destination: 'Bobo-Dioulasso'
    });
    assert.ok(filtered.length >= 4, 'Devrait avoir plusieurs départs quotidiens sur Ouaga-Bobo');
    console.log('  ✔ Test 2: Grille officielle des horaires et filtres multi-axes/compagnies');
    passed++;
  } catch (err: unknown) {
    console.error('  ✘ Test 2 échec:', (err as Error).message);
    failed++;
  }

  // Test 3: AgencyDirectoryService
  try {
    const agencies = AgencyDirectoryService.getAllAgencies();
    assert.ok(agencies.length >= 6, 'Devrait avoir au moins 6 gares et agences répertoriées');
    const parcelAgencies = AgencyDirectoryService.filterAgencies('Ouagadougou', true);
    assert.ok(parcelAgencies.every(a => a.servicesOffered.parcelDesk), 'Toutes doivent avoir un guichet colis');
    console.log('  ✔ Test 3: Répertoire géolocalisé des gares avec services guichet & fret');
    passed++;
  } catch (err: unknown) {
    console.error('  ✘ Test 3 échec:', (err as Error).message);
    failed++;
  }

  // Test 4: PartnerCompanyService
  try {
    const partners = PartnerCompanyService.getAllPartners();
    assert.ok(partners.length >= 4, 'Au moins 4 compagnies partenaires agréées');
    const tsr = PartnerCompanyService.getPartnerById('comp_tsr_01');
    assert.strictEqual(tsr?.tradeName, 'TSR Transit');
    assert.ok(tsr.rating >= 4.5, 'TSR doit avoir une note supérieure à 4.5');
    console.log('  ✔ Test 4: Fiches des transporteurs agréés, équipements et certifications');
    passed++;
  } catch (err: unknown) {
    console.error('  ✘ Test 4 échec:', (err as Error).message);
    failed++;
  }

  // Test 5: ParcelService — Calcul autoritaire des tarifs
  try {
    const feeLight = ParcelService.calculateShippingFee({
      category: 'ENVELOPPE',
      weightKg: 0.5,
      declaredValueXOF: 5000
    });
    assert.strictEqual(feeLight, 1000, 'Tarif enveloppe de base');

    const feeHeavy = ParcelService.calculateShippingFee({
      category: 'CARTON_MOYEN',
      weightKg: 10,
      declaredValueXOF: 50000
    });
    // 3500 base + 8*300 (2400) + (50000-20000)*0.01 (300) = 6200
    assert.strictEqual(feeHeavy, 6200, 'Tarif carton lourd avec supplément au kg et assurance');
    console.log('  ✔ Test 5: Calculateur autoritaire de fret/colis en FCFA avec barème au kg et assurance');
    passed++;
  } catch (err: unknown) {
    console.error('  ✘ Test 5 échec:', (err as Error).message);
    failed++;
  }

  // Test 6: ParcelService — Enregistrement et cycle de vie complet
  try {
    const parcel = ParcelService.registerParcel({
      companyId: 'comp_tsr_01',
      companyName: 'TSR TRANSIT BURKINA',
      originAgencyId: 'ag_tsr_ouaga_gounghin',
      originAgencyName: 'Gare Centrale TSR Gounghin',
      destinationAgencyId: 'ag_tsr_bobo_accart',
      destinationAgencyName: 'Gare Principale TSR Accart-Ville',
      senderName: 'Test Expéditeur',
      senderPhone: '+226 70 00 00 01',
      recipientName: 'Test Destinataire',
      recipientPhone: '+226 70 00 00 02',
      category: 'CARTON_MOYEN',
      weightKg: 4,
      declaredValueXOF: 15000
    });

    assert.ok(parcel.trackingNumber.startsWith('TSR-COL-'), 'Format du numéro de suivi');
    assert.strictEqual(parcel.status, 'REGISTERED');
    assert.strictEqual(parcel.pickupOtpCode.length, 4, 'Code OTP à 4 chiffres');

    // Passage au statut LOADED puis ARRIVED
    ParcelService.updateParcelStatus({
      trackingNumber: parcel.trackingNumber,
      newStatus: 'LOADED',
      location: 'Gare Ouaga'
    });
    ParcelService.updateParcelStatus({
      trackingNumber: parcel.trackingNumber,
      newStatus: 'ARRIVED_AT_AGENCY',
      location: 'Gare Bobo'
    });

    // Tentative de retrait avec mauvais OTP
    const badDelivery = ParcelService.updateParcelStatus({
      trackingNumber: parcel.trackingNumber,
      newStatus: 'DELIVERED',
      location: 'Gare Bobo',
      otpCode: '0000'
    });
    assert.strictEqual(badDelivery.success, false, 'Doit rejeter avec mauvais OTP');

    // Retrait avec le bon OTP
    const goodDelivery = ParcelService.updateParcelStatus({
      trackingNumber: parcel.trackingNumber,
      newStatus: 'DELIVERED',
      location: 'Gare Bobo',
      otpCode: parcel.pickupOtpCode
    });
    assert.strictEqual(goodDelivery.success, true, 'Doit accepter avec le bon OTP');
    assert.strictEqual(goodDelivery.parcel?.status, 'DELIVERED');
    console.log('  ✔ Test 6: Cycle de vie du colis, traçabilité et validation de remise par OTP sécurisé');
    passed++;
  } catch (err: unknown) {
    console.error('  ✘ Test 6 échec:', (err as Error).message);
    failed++;
  }

  // Test 7: LostFoundService
  try {
    const report = LostFoundService.reportLostItem({
      travelerName: 'Salif Traoré',
      travelerPhone: '+226 75 00 11 22',
      tripInfo: 'Ouaga -> Koudougou',
      itemCategory: 'DOCUMENTS',
      description: 'Pochette cuir marron avec CNIB et permis',
      color: 'Marron'
    });
    assert.ok(report.reference.startsWith('TSR-OBJ-'), 'Format de référence objet');
    assert.strictEqual(report.status, 'REPORTED');

    LostFoundService.updateStatus(report.reference, 'FOUND_IN_AGENCY', 'Gare Koudougou', 'Trouvé au guichet');
    const updated = LostFoundService.getReportByReference(report.reference);
    assert.strictEqual(updated?.status, 'FOUND_IN_AGENCY');
    console.log('  ✔ Test 7: Signalement d\'objets perdus, dossier d\'enquête et restitution en gare');
    passed++;
  } catch (err: unknown) {
    console.error('  ✘ Test 7 échec:', (err as Error).message);
    failed++;
  }

  // Test 8: SupportClaimService
  try {
    const faq = SupportClaimService.getFAQ();
    assert.ok(faq.length >= 5, 'FAQ doit comporter au moins 5 questions complètes');

    const claim = SupportClaimService.submitClaim({
      travelerName: 'Mariam Compaoré',
      travelerPhone: '+226 71 22 33 44',
      category: 'RETARD_DEPART',
      subject: 'Retard de 30 minutes',
      message: 'Départ retardé pour contrôle technique'
    });
    assert.ok(claim.claimNumber.startsWith('TSR-REC-'), 'Format référence réclamation');
    assert.strictEqual(claim.status, 'SUBMITTED');

    SupportClaimService.updateClaimStatus(claim.claimNumber, 'RESOLVED', 'Bon de 1000 FCFA crédité');
    const resolved = SupportClaimService.getClaimByNumber(claim.claimNumber);
    assert.strictEqual(resolved?.status, 'RESOLVED');
    console.log('  ✔ Test 8: Système de réclamations passagers et base de connaissances FAQ');
    passed++;
  } catch (err: unknown) {
    console.error('  ✘ Test 8 échec:', (err as Error).message);
    failed++;
  }

  // Test 9: LoyaltyService
  try {
    const testUser = 'user_test_fidelity_99';
    const acc = LoyaltyService.getAccount(testUser);
    assert.strictEqual(acc.pointsBalance, 100, 'Bonus de bienvenue de 100 points');
    assert.strictEqual(acc.tier, 'STANDARD');

    // Dépense de 100 000 FCFA -> +1000 points
    const credited = LoyaltyService.creditPoints(testUser, 100000);
    assert.strictEqual(credited.pointsBalance, 1100);
    assert.strictEqual(credited.tier, 'ARGENT', 'Passage au palier ARGENT');

    // Échange de points
    const redeemRes = LoyaltyService.redeemPoints(testUser, 200);
    assert.strictEqual(redeemRes.success, true);
    assert.strictEqual(redeemRes.discountXOF, 1000); // 200 * 5 = 1000 FCFA
    const updatedAcc = LoyaltyService.getAccount(testUser);
    assert.strictEqual(updatedAcc.pointsBalance, 900);
    console.log('  ✔ Test 9: Programme de fidélité, paliers de statut et conversion de points en réduction');
    passed++;
  } catch (err: unknown) {
    console.error('  ✘ Test 9 échec:', (err as Error).message);
    failed++;
  }

  // Test 10: OperationalReportService
  try {
    const kpis = OperationalReportService.getMonthlyKPIs();
    assert.ok(kpis.totalRevenueXOF > 0, 'CA total positif');
    assert.ok(kpis.averageFillRatePct > 70, 'Taux de remplissage cohérent');
    assert.ok(kpis.topRoutes.length >= 4, 'Au moins 4 grands axes analysés');
    console.log('  ✔ Test 10: Indicateurs d\'exploitation consolidés, taux de remplissage et KPI financiers');
    passed++;
  } catch (err: unknown) {
    console.error('  ✘ Test 10 échec:', (err as Error).message);
    failed++;
  }

  return { passed, failed };
}
