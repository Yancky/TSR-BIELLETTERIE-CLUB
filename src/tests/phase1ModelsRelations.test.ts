/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { appStore } from '../services/store';
import { DataRelationsService } from '../services/dataRelationsService';
import { AuditService } from '../services/auditService';
import { BookingOrder, Bus, Company, ScheduledDeparture, Station, Trip, User } from '../types';

export async function runPhase1ModelsRelationsTests() {
  const tests: string[] = [];
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, description: string) => {
    if (condition) {
      passed++;
      tests.push(`✔ [PASS] ${description}`);
    } else {
      failed++;
      tests.push(`❌ [FAIL] ${description}`);
    }
  };

  console.log('\n=================================================================');
  console.log('--- PHASE 1 : SUITE DE VALIDATION DES MODÈLES & RELATIONS MÉTIER ---');
  console.log('   Company, Station, Trip, ScheduledDeparture & Instantanés Financiers');
  console.log('=================================================================');

  const adminActor: User = {
    id: 'usr_admin_phase1',
    name: 'Superviseur Central ANTT',
    phone: '+226 25 30 00 01',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  // --- 1. MODÈLE COMPANY & VALIDATION LÉGALE ---
  console.log('\n--- 1. MODÈLE COMPANY & VÉRIFICATION LÉGALE ---');
  const validCompany: Company = {
    id: 'comp_air_transport_bf',
    name: 'AIR TRANSPORT BURKINA SA',
    tradeName: 'Air Transport Faso',
    headquarters: 'Avenue de la Nation, Secteur 3, Bobo-Dioulasso',
    city: 'Bobo-Dioulasso',
    region: 'Hauts-Bassins',
    country: 'Burkina Faso',
    phone: '+226 20 98 77 66',
    whatsapp: '+226 76 98 77 66',
    managerName: 'Ibrahim Traoré',
    managerEmail: 'direction@airtransport.bf',
    managerRole: 'Directeur Général',
    managerAccountId: 'usr_manager_ibrahim',
    ifuNumber: '00055443L',
    rccmNumber: 'BF-BBD-2023-B-4412',
    status: 'ACTIVE',
    fleetCount: 12,
    rating: 4.8,
    createdAt: new Date().toISOString()
  };

  const compValidation = DataRelationsService.validateCompany(validCompany);
  assert(compValidation.isValid, 'Validation réussie pour une société conforme avec tous ses champs réglementaires');

  // Rejet de société invalide (email manquant, raison sociale tronquée)
  const invalidCompany: Partial<Company> = {
    id: 'comp_bad',
    name: 'X',
    tradeName: 'Y',
    phone: '12',
    status: 'ACTIVE'
  };
  const badCompValidation = DataRelationsService.validateCompany(invalidCompany);
  assert(!badCompValidation.isValid, 'Rejet formel d’une société avec informations incomplètes ou non conformes');
  assert(badCompValidation.errors.length >= 3, 'Signalement précis de multiples erreurs de validation sur la société');

  // Enregistrement dans le store central
  appStore.addCompany(validCompany);
  const storedCompany = appStore.getState().companies.find(c => c.id === validCompany.id);
  assert(!!storedCompany && storedCompany.tradeName === 'Air Transport Faso', 'Persistance de la société dans le registre central');
  assert(storedCompany?.managerAccountId === 'usr_manager_ibrahim', 'Référencement du compte responsable dans le modèle Company');

  // --- 2. MODÈLE STATION (GARE) & LIAISON SOCIÉTÉ ---
  console.log('\n--- 2. MODÈLE STATION (GARE) & ASSOCIATION À LA SOCIÉTÉ ---');
  const stationOuaga: Station = {
    id: 'st_air_ouaga',
    companyId: validCompany.id,
    name: 'Gare VIP Air Transport Larlé',
    city: 'Ouagadougou',
    neighborhood: 'Larlé',
    address: 'Boulevard Charles de Gaulle, face pharmacie',
    latitude: 12.3812,
    longitude: -1.5341,
    phone: '+226 25 31 10 20',
    code: 'AT-OUA-01',
    supportedDestinations: ['Bobo-Dioulasso', 'Banfora'],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const stationBobo: Station = {
    id: 'st_air_bobo',
    companyId: validCompany.id,
    name: 'Gare Principale Air Transport Farakan',
    city: 'Bobo-Dioulasso',
    neighborhood: 'Farakan',
    address: 'Avenue de l’Union Européenne',
    latitude: 11.1784,
    longitude: -4.2981,
    phone: '+226 20 97 11 22',
    code: 'AT-BBD-01',
    supportedDestinations: ['Ouagadougou'],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const stationValidation = DataRelationsService.validateStation(stationOuaga, [validCompany]);
  assert(stationValidation.isValid, 'Validation conforme de la gare avec coordonnées GPS et destinations desservies');

  // Rejet si société introuvable
  const orphanStation: Station = {
    ...stationOuaga,
    id: 'st_orphan',
    companyId: 'comp_inexistante_999'
  };
  const orphanValidation = DataRelationsService.validateStation(orphanStation, [validCompany]);
  assert(!orphanValidation.isValid, 'Rejet d’une gare référençant une société inexistante (Règle : une société possède ses propres gares)');

  // Enregistrement des gares
  appStore.addStation(stationOuaga);
  appStore.addStation(stationBobo);
  const companyStations = appStore.getStationsByCompany(validCompany.id);
  assert(companyStations.length === 2, 'Récupération exacte des gares associées à la société via getStationsByCompany');

  // --- 3. MODÈLE TRIP (TRAJET / LIGNE COMMERCIALE PÉRENNE) ---
  console.log('\n--- 3. MODÈLE TRIP (TRAJET / LIAISON COMMERCIALE) ---');
  const validTrip: Trip = {
    id: 'trip_air_ouaga_bobo',
    companyId: validCompany.id,
    departureStationId: stationOuaga.id,
    arrivalStationId: stationBobo.id,
    departureCity: 'Ouagadougou',
    destinationCity: 'Bobo-Dioulasso',
    departureStationName: stationOuaga.name,
    arrivalStationName: stationBobo.name,
    estimatedDurationMinutes: 300,
    distanceKm: 365,
    basePriceXOF: 9500,
    routeDescription: 'Liaison directe autoroutière RN1 grand confort',
    stops: ['Boromo (Pause 15m)'],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const tripValidation = DataRelationsService.validateTrip(
    validTrip,
    [stationOuaga, stationBobo],
    [validCompany]
  );
  assert(tripValidation.isValid, 'Trajet commercial pérenne validé reliant deux gares distinctes du réseau de la société');

  // Rejet si même gare de départ et arrivée
  const loopingTrip: Trip = {
    ...validTrip,
    id: 'trip_loop',
    arrivalStationId: stationOuaga.id,
    destinationCity: 'Ouagadougou'
  };
  const loopValidation = DataRelationsService.validateTrip(
    loopingTrip,
    [stationOuaga, stationBobo],
    [validCompany]
  );
  assert(!loopValidation.isValid, 'Rejet formel d’un trajet où la gare de départ est identique à la gare d’arrivée');

  // Enregistrement du trajet dans le store
  appStore.addTripRoute(validTrip);
  const fetchedTrips = appStore.getTripsByCompany(validCompany.id);
  assert(fetchedTrips.some(t => t.id === validTrip.id), 'Persistance du trajet commercial dans le catalogue réseau');

  // --- 4. SÉPARATION STRICTE : TRIP (TRAJET) VS SCHEDULED DEPARTURE (DÉPART) ---
  console.log('\n--- 4. SÉPARATION ENTRE TRAJET COMMERCIAL ET DÉPARTS PROGRAMMÉS ---');

  // Autocar de la flotte pour ce départ
  const assignedBus: Bus = {
    id: 'bus_air_01',
    companyId: validCompany.id,
    registrationNumber: '11-PP-8821 BF',
    fleetNumber: 'CAR-AIR-01',
    brand: 'Marcopolo',
    model: 'Paradiso 1350 G8',
    seatCapacity: 50,
    category: 'VIP',
    amenities: ['Climatisation', 'Wi-Fi 4G', 'Prises USB', 'Toilettes à bord'],
    status: 'ACTIVE',
    seatLayout: '2x2',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  appStore.addBus(assignedBus);

  // Départ 1 : 20 octobre à 06h30, tarif 9 500 FCFA
  const departure1: ScheduledDeparture = {
    id: 'dep_air_20261020_0630',
    companyId: validCompany.id,
    tripId: validTrip.id,
    departureDate: '2026-10-20',
    date: '2026-10-20',
    departureTime: '06:30',
    estimatedArrivalTime: '11:30',
    arrivalTime: '11:30',
    vehicleId: assignedBus.id,
    busId: assignedBus.id,
    seatCapacity: 50,
    totalSeats: 50,
    availableSeatsCount: 50,
    price: 9500,
    priceXOF: 9500,
    currency: 'XOF',
    departureCity: 'Ouagadougou',
    destinationCity: 'Bobo-Dioulasso',
    departureAgency: stationOuaga.name,
    arrivalAgency: stationBobo.name,
    departureStationId: stationOuaga.id,
    arrivalStationId: stationBobo.id,
    busType: 'Car Grand Tourisme VIP 50 Places',
    amenities: assignedBus.amenities,
    bookingOpeningTime: '2026-10-01T00:00:00Z',
    bookingClosingTime: '2026-10-20T06:00:00Z',
    status: 'PUBLISHED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Départ 2 : 20 octobre à 14h00, tarif promotionnel 8 500 FCFA sur le MÊME trajet
  const departure2: ScheduledDeparture = {
    ...departure1,
    id: 'dep_air_20261020_1400',
    departureTime: '14:00',
    estimatedArrivalTime: '19:00',
    arrivalTime: '19:00',
    price: 8500,
    priceXOF: 8500,
    bookingClosingTime: '2026-10-20T13:30:00Z'
  };

  const dep1Validation = DataRelationsService.validateScheduledDeparture(
    departure1,
    [validTrip],
    [validCompany],
    [assignedBus]
  );
  assert(dep1Validation.isValid, 'Validation du départ matinal programmé (06h30, 9 500 FCFA)');

  const dep2Validation = DataRelationsService.validateScheduledDeparture(
    departure2,
    [validTrip],
    [validCompany],
    [assignedBus]
  );
  assert(dep2Validation.isValid, 'Validation du second départ d’après-midi sur le même trajet (14h00, 8 500 FCFA)');

  // Enregistrement des deux départs
  appStore.addScheduledDeparture(departure1);
  appStore.addScheduledDeparture(departure2);

  const departuresOnTrip = appStore.getScheduledDeparturesByTrip(validTrip.id);
  assert(departuresOnTrip.length === 2, 'Un même trajet regroupe plusieurs départs distincts avec leurs propres horaires et tarifs');
  assert(
    departuresOnTrip[0].priceXOF !== departuresOnTrip[1].priceXOF,
    'Chaque départ programmé possède son tarif propre et indépendant'
  );

  // --- 5. RÈGLE MÉTIER : SEULES LES SOCIÉTÉS ACTIVES PEUVENT PUBLIER DES DÉPARTS ---
  console.log('\n--- 5. RESTRICTION DU STATUT DE SOCIÉTÉ SUR LA PUBLICATION ---');
  const suspendedCompany: Company = {
    ...validCompany,
    id: 'comp_suspended_transport',
    name: 'TRANS-SAHEL SUSPENDU SARL',
    status: 'SUSPENDED'
  };
  const tripSuspended: Trip = {
    ...validTrip,
    id: 'trip_suspended',
    companyId: suspendedCompany.id
  };
  const departureFromSuspended: ScheduledDeparture = {
    ...departure1,
    id: 'dep_suspended',
    companyId: suspendedCompany.id,
    tripId: tripSuspended.id
  };

  const blockedValidation = DataRelationsService.validateScheduledDeparture(
    departureFromSuspended,
    [tripSuspended],
    [suspendedCompany],
    [assignedBus]
  );
  assert(!blockedValidation.isValid, 'Rejet catégorique d’un départ publié par une société SUSPENDUE');
  assert(
    blockedValidation.errors.some(e => e.includes('Seules les sociétés actives et agréées peuvent publier des départs')),
    'Message explicatif confirmant le rejet pour statut non actif'
  );

  // --- 6. ISOLATION DE FLOTTE ENTRE SOCIÉTÉS ---
  console.log('\n--- 6. CONTRÔLE D’ISOLATION DU VÉHICULE AFFECTÉ ---');
  const competitorBus: Bus = {
    ...assignedBus,
    id: 'bus_other_company',
    companyId: 'comp_concurrent_tsr'
  };
  const foreignBusDeparture: ScheduledDeparture = {
    ...departure1,
    id: 'dep_bad_bus',
    vehicleId: competitorBus.id
  };
  const foreignBusValidation = DataRelationsService.validateScheduledDeparture(
    foreignBusDeparture,
    [validTrip],
    [validCompany],
    [competitorBus]
  );
  assert(!foreignBusValidation.isValid, 'Rejet d’un départ programmé affectant un véhicule d’une autre société');

  // --- 7. TARIFS & INSTANTANÉ FINANCIER IMMUABLE (SNAPSHOT) ---
  console.log('\n--- 7. GESTION DES TARIFS & INSTANTANÉ FINANCIER IMMUABLE ---');
  // Création d'une réservation confirmée sur le départ 1 à 9 500 FCFA
  const bookingOrder1: BookingOrder = {
    id: 'bk_audit_snap_01',
    reference: 'TSR-BK-998811',
    bookingRef: 'TSR-BK-998811',
    departureTripId: departure1.id,
    tripId: departure1.id,
    companyId: validCompany.id,
    travelerId: 'usr_traveler_moussa',
    userId: 'usr_traveler_moussa',
    passengerName: 'Moussa Kaboré',
    passengerPhone: '+226 70 12 34 56',
    seatIds: [12],
    selectedSeats: [12],
    passengerCount: 1,
    unitPriceXof: 9500,
    unitPriceXOF: 9500,
    totalPriceXof: 9500,
    totalAmountXOF: 9500,
    currency: 'XOF',
    status: 'CONFIRMED',
    createdAt: '2026-10-10T10:00:00Z'
  };

  // L'administrateur ou la société modifie le tarif du départ 1 : il passe à 11 000 FCFA
  DataRelationsService.logPriceChange(adminActor, departure1.id, validCompany.id, 9500, 11000);
  appStore.updateTrip(departure1.id, { price: 11000, priceXOF: 11000 });

  const updatedDeparture = appStore.getState().trips.find(t => t.id === departure1.id);
  assert(updatedDeparture?.priceXOF === 11000, 'Le tarif du départ programmé a été actualisé à 11 000 FCFA pour les futures ventes');

  // Vérification de l'instantané financier de la réservation passée
  const snapshotCheck = DataRelationsService.verifyBookingFinancialSnapshot(bookingOrder1, updatedDeparture!);
  assert(snapshotCheck.recordedUnitPrice === 9500, 'La réservation passée conserve rigoureusement son tarif historique scellé (9 500 FCFA)');
  assert(snapshotCheck.hasPriceDrift, 'Détection et conservation du différentiel historique sans altérer la facture');

  // Vérification de l'audit log
  const allLogs = AuditService.getAllLogs();
  const priceChangeLog = allLogs.find(l => l.action === 'DEPARTURE_PRICE_UPDATED');
  assert(!!priceChangeLog, 'Génération du log d’audit inaltérable traçant la modification tarifaire');
  assert(priceChangeLog?.resourceType === 'DEPARTURE', 'Type de ressource DEPARTURE identifié dans l’audit');

  console.log('=================================================================');
  console.log(`PHASE 1 MODÈLES & RELATIONS TERMINÉE : ${passed} tests réussis, ${failed} échecs`);
  console.log('=================================================================\n');

  return { passed, failed, tests };
}
