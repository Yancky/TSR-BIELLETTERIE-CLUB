/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import { CompanyService } from '../services/companyService';
import { AgencyService } from '../services/agencyService';
import { FleetService } from '../services/fleetService';
import { TripService } from '../services/tripService';
import { AuditService } from '../services/auditService';
import { CompanyRegistrationInput, User } from '../types';

export function runPhase3Tests(): { passed: number; failed: number; tests: string[] } {
  const testResults: string[] = [];
  let passed = 0;
  let failed = 0;

  // Reset des services pour tests isolés
  CompanyService.resetForTesting();
  AgencyService.resetForTesting();
  FleetService.resetForTesting();
  TripService.resetForTesting();
  AuditService.clearLogsForTesting();

  const adminActor: User = {
    id: 'usr_admin_test',
    name: 'Superviseur National',
    phone: '+226 70 00 11 22',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  const managerTSR: User = {
    id: 'usr_mgr_tsr',
    name: 'Jean-Pierre Yaméogo',
    phone: '+226 78 90 12 34',
    role: 'COMPANY_MANAGER',
    companyId: 'comp_tsr',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  const managerRakieta: User = {
    id: 'usr_mgr_rakieta',
    name: 'Ousmane Traoré',
    phone: '+226 76 12 14 14',
    role: 'COMPANY_MANAGER',
    companyId: 'comp_rakieta',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  const validRegistrationPayload: CompanyRegistrationInput = {
    name: 'TRANS-KOUDOUGOU CONFORT SARL',
    tradeName: 'TK Confort',
    companyType: 'SARL',
    ifuNumber: '00088912Z',
    rccmNumber: 'BF-KDG-2023-B-0045',
    establishedYear: '2023',
    description: 'Dessertes régulières Koudougou - Ouagadougou en minibus et grands cars.',
    headquartersAddress: 'Quartier Cité des Cavaliers',
    city: 'Koudougou',
    region: 'Centre-Ouest',
    country: 'Burkina Faso',
    managerName: 'Issa Yaméogo',
    managerRole: 'Directeur Général',
    phone: '+226 25 44 10 10',
    email: 'contact@tk-confort.bf',
    professionalAddress: 'Gare TK Koudougou',
    desiredUsername: 'tk_direction',
    password: 'passwordSecret123',
    confirmPassword: 'passwordSecret123',
    termsAccepted: true,
    dataConsentAccepted: true,
    whatsapp: '+226 70 44 10 10',
    acceptedPaymentMethods: ['ORANGE_MONEY', 'MOOV_MONEY'],
    estimatedVehicles: 8,
    estimatedSeats: 320,
    agenciesCount: 2,
    servedCities: ['Koudougou', 'Ouagadougou'],
    mainRoutes: ['Koudougou - Ouagadougou'],
    serviceCategories: ['STANDARD', 'CONFORT']
  };

  // Test 1: Soumission valide d'une demande de compagnie
  try {
    const res = CompanyService.submitRegistration(validRegistrationPayload);
    assert.strictEqual(res.success, true, 'La soumission valide doit réussir');
    assert.ok(res.applicationRef?.startsWith('AGR-BF-'), 'Une référence d\'agrément doit être générée');
    passed++;
    testResults.push('✔ Test 1: Soumission valide d\'une demande d\'agrément de compagnie');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 1: ${err.message}`);
  }

  // Test 2: Refus d'un formulaire incomplet (IFU ou nom manquant)
  try {
    const invalidPayload = { ...validRegistrationPayload, ifuNumber: '' };
    const res = CompanyService.submitRegistration(invalidPayload);
    assert.strictEqual(res.success, false, 'Le formulaire sans IFU doit être rejeté');
    assert.ok(res.error?.includes('IFU'), 'Le message doit mentionner l\'IFU');
    passed++;
    testResults.push('✔ Test 2: Rejet strict des demandes avec formulaire incomplet ou pièces manquantes');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 2: ${err.message}`);
  }

  // Test 3: Création au statut PENDING obligatoire
  try {
    const res = CompanyService.submitRegistration({
      ...validRegistrationPayload,
      name: 'SAHEL VOYAGEURS 2',
      ifuNumber: '00099999K',
      rccmNumber: 'BF-OHG-2024-B-9999'
    });
    assert.strictEqual(res.company?.status, 'PENDING', 'Le statut initial doit obligatoirement être PENDING');
    passed++;
    testResults.push('✔ Test 3: Attribution systématique du statut PENDING à la création');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 3: ${err.message}`);
  }

  // Test 4: Approbation par admin autorisé (PENDING -> ACTIVE)
  let candidateCompId = '';
  try {
    const res = CompanyService.submitRegistration({
      ...validRegistrationPayload,
      name: 'BURKINA TRANSIT PILOTE',
      ifuNumber: '00077777P',
      rccmNumber: 'BF-OUA-2024-B-7777'
    });
    candidateCompId = res.company!.id;

    const approved = CompanyService.approveCompany(adminActor, candidateCompId);
    assert.strictEqual(approved.status, 'ACTIVE', 'La compagnie doit passer à ACTIVE');
    passed++;
    testResults.push('✔ Test 4: Approbation administrative réussie par l\'administrateur');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 4: ${err.message}`);
  }

  // Test 5: Rejet avec motif obligatoire (PENDING -> REJECTED)
  try {
    const res = CompanyService.submitRegistration({
      ...validRegistrationPayload,
      name: 'DOSSIER INCOMPLET TRANSPORT',
      ifuNumber: '00066666D',
      rccmNumber: 'BF-OUA-2024-B-6666'
    });
    const rejCompId = res.company!.id;

    // Tentative sans motif -> Doit échouer
    assert.throws(() => {
      CompanyService.rejectCompany(adminActor, rejCompId, '');
    }, /motif/i);

    // Avec motif détaillé -> Succès
    const rejected = CompanyService.rejectCompany(adminActor, rejCompId, 'Dossier de licence de transport expiré');
    assert.strictEqual(rejected.status, 'REJECTED');
    assert.strictEqual(rejected.rejectionReason, 'Dossier de licence de transport expiré');
    passed++;
    testResults.push('✔ Test 5: Rejet administratif avec obligation formelle d\'un motif détaillé');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 5: ${err.message}`);
  }

  // Test 6: Suspension d'une compagnie active avec motif (ACTIVE -> SUSPENDED)
  try {
    const suspended = CompanyService.suspendCompany(
      adminActor,
      candidateCompId,
      'Contrôle technique inopiné des véhicules'
    );
    assert.strictEqual(suspended.status, 'SUSPENDED');
    assert.strictEqual(suspended.suspensionReason, 'Contrôle technique inopiné des véhicules');
    passed++;
    testResults.push('✔ Test 6: Suspension administrative motivée d\'une compagnie active');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 6: ${err.message}`);
  }

  // Test 7: Réactivation autorisée (SUSPENDED -> ACTIVE)
  try {
    const reactivated = CompanyService.reactivateCompany(adminActor, candidateCompId);
    assert.strictEqual(reactivated.status, 'ACTIVE');
    assert.strictEqual(reactivated.suspensionReason, undefined);
    passed++;
    testResults.push('✔ Test 7: Réactivation administrative conforme d\'une compagnie suspendue');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 7: ${err.message}`);
  }

  // Test 8: Impossibilité pour une compagnie non-ACTIVE de publier un départ
  try {
    const pendingCompany = CompanyService.getCompanyById('comp_sahel_express'); // PENDING
    assert.ok(pendingCompany && pendingCompany.status === 'PENDING');

    const managerSahel: User = {
      id: 'usr_mgr_sahel',
      name: 'Amadou Diallo',
      phone: '+226 71 55 10 09',
      role: 'COMPANY_MANAGER',
      companyId: 'comp_sahel_express',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    };

    // Tentative de publication de départ pour une compagnie PENDING
    assert.throws(() => {
      TripService.createDepartureTrip(managerSahel, {
        companyId: 'comp_sahel_express',
        busId: 'bus_tsr_01',
        departureCity: 'Ouahigouya',
        destinationCity: 'Ouagadougou',
        departureAgency: 'Gare Ouahigouya',
        arrivalAgency: 'Gare Ouaga',
        departureTime: '06:00',
        arrivalTime: '09:30',
        date: '2026-10-15',
        priceXOF: 4000
      });
    }, /ACTIVE/i);
    passed++;
    testResults.push('✔ Test 8: Interdiction stricte de publication de départs pour les compagnies non-ACTIVE');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 8: ${err.message}`);
  }

  // Test 9: Impossibilité pour un responsable de modifier une autre compagnie (isolation)
  try {
    assert.throws(() => {
      // Le manager TSR tente de modifier Rakieta
      CompanyService.updateOwnCompany(managerTSR, 'comp_rakieta', { phone: '+226 70 00 00 00' });
    }, /ISOLATION_VIOLATION|autorisée/i);
    passed++;
    testResults.push('✔ Test 9: Isolation multi-compagnies étanche (impossibilité de modifier un concurrent)');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 9: ${err.message}`);
  }

  // Test 10: Validation des coordonnées géographiques d'une agence
  try {
    assert.strictEqual(AgencyService.isValidCoordinates(12.3686, -1.5542), true, 'Coordonnées Ouaga valides');
    assert.strictEqual(AgencyService.isValidCoordinates(150, 0), false, 'Latitude > 90 invalide');
    assert.strictEqual(AgencyService.isValidCoordinates(12, 200), false, 'Longitude > 180 invalide');
    passed++;
    testResults.push('✔ Test 10: Validation stricte des coordonnées géographiques GPS');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 10: ${err.message}`);
  }

  // Test 11: Création et modification d'une agence avec unicité du code
  try {
    const agence = AgencyService.createAgency(managerTSR, {
      companyId: 'comp_tsr',
      name: 'Agence TSR Ouaga Inter',
      code: 'TSR-OUA-INT',
      address: 'Avenue Bassawarga',
      city: 'Ouagadougou',
      region: 'Centre',
      latitude: 12.355,
      longitude: -1.52,
      phone: '+226 25 30 00 00',
      openingHours: '06h00 - 21h00'
    });
    assert.strictEqual(agence.code, 'TSR-OUA-INT');

    // Tentative de doublon de code -> Doit échouer
    assert.throws(() => {
      AgencyService.createAgency(managerTSR, {
        companyId: 'comp_tsr',
        name: 'Agence Bis',
        code: 'TSR-OUA-INT',
        address: 'Rue 12',
        city: 'Ouagadougou',
        region: 'Centre',
        latitude: 12.355,
        longitude: -1.52,
        phone: '+226 25 30 00 00',
        openingHours: '06h00 - 21h00'
      });
    }, /déjà utilisé/i);
    passed++;
    testResults.push('✔ Test 11: Création d\'agence avec vérification d\'unicité du code dans la compagnie');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 11: ${err.message}`);
  }

  // Test 12: Vérification de la capacité du véhicule (> 0)
  try {
    assert.throws(() => {
      FleetService.addBus(managerTSR, {
        companyId: 'comp_tsr',
        registrationNumber: '11-ZZ-0001 BF',
        fleetNumber: 'BUS-INVALID',
        brand: 'Scania',
        model: 'Touring',
        seatCapacity: -5, // Invalide
        seatLayout: '2x2',
        category: 'STANDARD'
      });
    }, /strictement positif/i);
    passed++;
    testResults.push('✔ Test 12: Contrôle d\'intégrité de la capacité de sièges du véhicule');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 12: ${err.message}`);
  }

  // Test 13: Refus d'affecter un véhicule inactif ou en maintenance
  try {
    const maintBus = FleetService.getBusById('bus_tsr_maint');
    assert.ok(maintBus && maintBus.status === 'MAINTENANCE');

    assert.throws(() => {
      TripService.createDepartureTrip(managerTSR, {
        companyId: 'comp_tsr',
        busId: 'bus_tsr_maint',
        departureCity: 'Ouagadougou',
        destinationCity: 'Bobo-Dioulasso',
        departureAgency: 'Gare Ouaga',
        arrivalAgency: 'Gare Bobo',
        departureTime: '15:00',
        arrivalTime: '20:15',
        date: '2026-10-20',
        priceXOF: 9000
      });
    }, /MAINTENANCE|indisponible/i);
    passed++;
    testResults.push('✔ Test 13: Refus d\'affectation d\'un véhicule en maintenance ou inactif');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 13: ${err.message}`);
  }

  // Test 14: Refus des chevauchements de départs pour un même véhicule
  try {
    // Le bus_tsr_01 est déjà programmé le 2026-10-11 de 06:30 à 11:45
    assert.throws(() => {
      TripService.createDepartureTrip(managerTSR, {
        companyId: 'comp_tsr',
        busId: 'bus_tsr_01',
        departureCity: 'Ouagadougou',
        destinationCity: 'Koudougou',
        departureAgency: 'Gare Ouaga',
        arrivalAgency: 'Gare Koudougou',
        departureTime: '08:00', // Conflit direct avec 06:30-11:45
        arrivalTime: '09:45',
        date: '2026-10-11',
        priceXOF: 2500
      });
    }, /Conflit de rotation|programmé/i);
    passed++;
    testResults.push('✔ Test 14: Détection et rejet automatique des chevauchements horaires pour un véhicule');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 14: ${err.message}`);
  }

  // Test 15: Validation des tarifs en XOF (entier strictement positif)
  try {
    assert.throws(() => {
      TripService.createDepartureTrip(managerTSR, {
        companyId: 'comp_tsr',
        busId: 'bus_tsr_02',
        departureCity: 'Ouagadougou',
        destinationCity: 'Bobo-Dioulasso',
        departureAgency: 'Gare Ouaga',
        arrivalAgency: 'Gare Bobo',
        departureTime: '16:00',
        arrivalTime: '21:15',
        date: '2026-10-25',
        priceXOF: -500 // Invalide
      });
    }, /Francs CFA/i);
    passed++;
    testResults.push('✔ Test 15: Validation stricte des tarifs en Francs CFA (XOF)');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 15: ${err.message}`);
  }

  // Test 16: Filtrage des départs par ville et date
  try {
    const results = TripService.searchTrips({
      departureCity: 'Ouagadougou',
      destinationCity: 'Bobo-Dioulasso',
      date: '2026-10-11'
    });
    assert.ok(results.length >= 2, 'Doit retourner les départs programmés Ouaga-Bobo du jour');
    assert.ok(results.every(t => t.departureCity === 'Ouagadougou' && t.destinationCity === 'Bobo-Dioulasso'));
    passed++;
    testResults.push('✔ Test 16: Recherche et filtrage précis des départs par ville et date');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 16: ${err.message}`);
  }

  // Test 17: Journalisation des décisions administratives dans AuditService
  try {
    const logs = AuditService.getAllLogs();
    const approvedLog = logs.find(l => l.action === 'COMPANY_APPROVED');
    const rejectedLog = logs.find(l => l.action === 'COMPANY_REJECTED');
    const suspendedLog = logs.find(l => l.action === 'COMPANY_SUSPENDED');

    assert.ok(approvedLog, 'L\'approbation doit être auditée');
    assert.ok(rejectedLog, 'Le rejet doit être audité');
    assert.ok(suspendedLog, 'La suspension doit être auditée');
    passed++;
    testResults.push('✔ Test 17: Enregistrement immuable des décisions administratives dans le journal d\'audit');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 17: ${err.message}`);
  }

  // Test 18: Absence de données confidentielles dans les vues publiques des compagnies
  try {
    const publicCompanies = CompanyService.getPublicActiveCompanies();
    assert.ok(publicCompanies.length >= 1, 'Au moins une compagnie active');
    for (const pc of publicCompanies) {
      assert.strictEqual('merchantCode' in pc, false, 'Le code marchand ne doit pas être exposé publiquement');
      assert.strictEqual('supportingDocuments' in pc, false, 'Les justificatifs privés ne doivent pas être exposés');
      assert.strictEqual('managerEmail' in pc, false, 'L\'email privé du gérant ne doit pas figurer dans la vue publique');
    }
    passed++;
    testResults.push('✔ Test 18: Anonymisation et protection des données confidentielles dans les vues publiques');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 18: ${err.message}`);
  }

  return { passed, failed, tests: testResults };
}
