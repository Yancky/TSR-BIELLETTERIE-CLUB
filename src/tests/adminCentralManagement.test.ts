/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { appStore } from '../services/store';
import { AuditService } from '../services/auditService';

export async function runAdminCentralManagementTests() {
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
  console.log('--- SUITE EXTENSION ADMIN : SOCIÉTÉS, GARES, LIGNES & HORAIRES ---');
  console.log('=================================================================');

  // Set admin context
  appStore.loginAsRole('ADMIN');

  // --- 1. GESTION DES SOCIÉTÉS ---
  console.log('--- 1. GESTION DES SOCIÉTÉS DE TRANSPORT ---');
  const compId = `comp_test_${Date.now()}`;
  const newComp = appStore.addCompany({
    id: compId,
    name: 'SOTRACO EXPRESS BURKINA SA',
    tradeName: 'Sotraco Interurbain',
    headquarters: 'Avenue Bassawarga, Ouagadougou',
    city: 'Ouagadougou',
    region: 'Centre',
    phone: '+226 25 30 11 22',
    whatsapp: '+226 70 30 11 22',
    managerName: 'Adama Sawadogo',
    managerEmail: 'adama@sotraco.bf',
    ifuNumber: '00088992K',
    rccmNumber: 'BF-OUA-2026-B-9988',
    status: 'ACTIVE',
    fleetCount: 15
  });

  assert(!!newComp && newComp.id === compId, 'Création d’une société de transport avec tous les champs légaux obligatoires');
  assert(newComp.tradeName === 'Sotraco Interurbain', 'Enseigne commerciale de la société correctement enregistrée');
  assert(newComp.city === 'Ouagadougou' && newComp.phone === '+226 25 30 11 22', 'Coordonnées du siège et contact de direction validés');

  // Mise à jour société
  const updatedComp = appStore.updateCompany(compId, { fleetCount: 18, managerRole: 'Président Directeur Général' });
  assert(updatedComp?.fleetCount === 18 && updatedComp?.managerRole === 'Président Directeur Général', 'Mise à jour des informations de la société (flotte et responsable)');

  // Cycle de statut
  appStore.updateCompanyStatus(compId, 'SUSPENDED', 'Contrôle technique requis');
  let fetchedComp = appStore.getState().companies.find(c => c.id === compId);
  assert(fetchedComp?.status === 'SUSPENDED', 'Suspension administrative immédiate de la société avec motif archivé');

  appStore.updateCompanyStatus(compId, 'ACTIVE');
  fetchedComp = appStore.getState().companies.find(c => c.id === compId);
  assert(fetchedComp?.status === 'ACTIVE', 'Réactivation de la société suite à conformité');

  // --- 2. GESTION DES GARES & AGENCES ---
  console.log('--- 2. GESTION DES GARES & DESTINATIONS DESSERVIES ---');
  const stationId = `ag_test_${Date.now()}`;
  const newStation = appStore.addAgency({
    id: stationId,
    companyId: compId,
    name: 'Gare Centrale Sotraco Tampouy',
    city: 'Ouagadougou',
    neighborhood: 'Tampouy Nord',
    address: 'Avenue Yatenga, face Station Shell',
    latitude: 12.3925,
    longitude: -1.5498,
    phone: '+226 25 35 88 00',
    openingHours: '05h00 - 22h00',
    supportedDestinations: ['Ouahigouya', 'Kaya', 'Bobo-Dioulasso'],
    status: 'ACTIVE'
  });

  assert(!!newStation && newStation.companyId === compId, 'Association obligatoire de la gare à sa société opératrice parente');
  assert(newStation.latitude === 12.3925 && newStation.longitude === -1.5498, 'Précision des coordonnées GPS réelles de la gare');
  assert(newStation.supportedDestinations?.length === 3, 'Enregistrement des destinations desservies par la gare');

  // Désactivation gare
  appStore.updateAgencyStatus(stationId, 'INACTIVE');
  let fetchedStation = appStore.getState().agencies.find(a => a.id === stationId);
  assert(fetchedStation?.status === 'INACTIVE', 'Désactivation opérationnelle de la gare en cas de travaux ou fermeture');

  appStore.updateAgencyStatus(stationId, 'ACTIVE');
  fetchedStation = appStore.getState().agencies.find(a => a.id === stationId);
  assert(fetchedStation?.status === 'ACTIVE', 'Réouverture et remise en service de la gare');

  // --- 3. GESTION DES LIGNES & TRAJETS ---
  console.log('--- 3. GESTION DES LIGNES ET PRIX DE RÉFÉRENCE ---');
  const routeId = `route_test_${Date.now()}`;
  const newRoute = appStore.addRoute({
    id: routeId,
    companyId: compId,
    departureCity: 'Ouagadougou',
    destinationCity: 'Ouahigouya',
    departureAgencyName: 'Gare Tampouy Nord',
    arrivalAgencyName: 'Gare Routière Ouahigouya',
    distanceKm: 185,
    estimatedDurationMinutes: 210,
    basePriceXOF: 4500,
    stops: ['Boussé', 'Yako'],
    status: 'ACTIVE'
  });

  assert(!!newRoute && newRoute.departureCity === 'Ouagadougou' && newRoute.destinationCity === 'Ouahigouya', 'Définition d’une ligne interurbaine avec villes de départ et d’arrivée');
  assert(newRoute.distanceKm === 185 && newRoute.basePriceXOF === 4500, 'Distance réglementaire et tarif de référence en FCFA scellés');
  assert(Boolean(newRoute.stops?.includes('Yako')), 'Arrêts intermédiaires et escales pris en compte');

  // Suspension ligne
  appStore.updateRouteStatus(routeId, 'SUSPENDED');
  let fetchedRoute = appStore.getState().routes.find(r => r.id === routeId);
  assert(fetchedRoute?.status === 'SUSPENDED', 'Suspension de la ligne interurbaine');

  appStore.updateRouteStatus(routeId, 'ACTIVE');
  fetchedRoute = appStore.getState().routes.find(r => r.id === routeId);
  assert(fetchedRoute?.status === 'ACTIVE', 'Réactivation de la ligne interurbaine');

  // --- 4. GESTION DES HORAIRES ET DÉPARTS ---
  console.log('--- 4. PLANIFICATION DES DÉPARTS & GESTION DES PLACES ---');
  const tripId = `trip_test_${Date.now()}`;
  const newTrip = appStore.addTrip({
    companyId: compId,
    departureCity: 'Ouagadougou',
    destinationCity: 'Ouahigouya',
    departureAgency: 'Gare Centrale Sotraco Tampouy',
    arrivalAgency: 'Gare Centrale Ouahigouya',
    departureTime: '08:00',
    arrivalTime: '11:30',
    date: '2026-10-20',
    priceXOF: 4500,
    busType: 'Car Grand Tourisme VIP 50 Places',
    amenities: ['Climatisation', 'Wi-Fi 4G', 'Prises USB'],
    totalSeats: 50
  });

  assert(!!newTrip && newTrip.totalSeats === 50, 'Création d’un départ planifié avec capacité de 50 sièges');
  assert(newTrip.availableSeatsCount === 50, 'Disponibilité initiale intégrale des sièges (50/50)');
  assert(newTrip.status === 'PUBLISHED', 'Statut initial du départ publié pour les réservations');

  // Mise à jour de statut du départ
  appStore.updateTripStatus(newTrip.id, 'BOARDING');
  let fetchedTrip = appStore.getState().trips.find(t => t.id === newTrip.id);
  assert(fetchedTrip?.status === 'BOARDING', 'Bascule du départ en phase d’embarquement quai');

  appStore.updateTripStatus(newTrip.id, 'DEPARTED');
  fetchedTrip = appStore.getState().trips.find(t => t.id === newTrip.id);
  assert(fetchedTrip?.status === 'DEPARTED', 'Bascule du départ en statut parti');

  // --- 5. GESTION DE LA FLOTTE & BUS ---
  console.log('--- 5. FLOTTE DE VÉHICULES ---');
  const busId = `bus_test_${Date.now()}`;
  const newBus = appStore.addBus({
    id: busId,
    companyId: compId,
    registrationNumber: '11-LL-9901 BF',
    fleetNumber: 'CAR-VIP-12',
    brand: 'Marcopolo',
    model: 'Paradiso G8',
    seatCapacity: 50,
    category: 'VIP',
    status: 'ACTIVE'
  });

  assert(!!newBus && newBus.registrationNumber === '11-LL-9901 BF', 'Enregistrement d’un autocar dans la flotte avec immatriculation burkinabè');
  assert(newBus.seatCapacity === 50 && newBus.category === 'VIP', 'Capacité et catégorie de confort conformes');

  // Bascule en maintenance
  appStore.updateBusStatus(busId, 'MAINTENANCE');
  let fetchedBus = appStore.getState().buses.find(b => b.id === busId);
  assert(fetchedBus?.status === 'MAINTENANCE', 'Mise en maintenance d’un autocar de la flotte');

  // --- 6. AUDIT & TRAÇABILITÉ ---
  console.log('--- 6. TRAÇABILITÉ & SÉCURITÉ DES LOGS ---');
  const allLogs = AuditService.getAllLogs();
  assert(allLogs.length > 0, 'Présence des journaux d’audit attestant la traçabilité des opérations');
  const recentLog = allLogs[0];
  assert(!!recentLog.id && !!recentLog.timestamp, 'Intégrité structurelle des entrées d’audit (id unique, timestamp)');

  console.log(`=================================================================`);
  console.log(`SUITE EXTENSION ADMIN TERMINÉE : ${passed} tests réussis, ${failed} échecs`);
  console.log(`=================================================================\n`);

  return { passed, failed, tests };
}
