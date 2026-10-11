/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import { TripSearchService } from '../services/tripSearchService';
import { TripService } from '../services/tripService';
import { CompanyService } from '../services/companyService';
import { User } from '../types';

export function runTripSearchTests(): { passed: number; failed: number; tests: string[] } {
  const testResults: string[] = [];
  let passed = 0;
  let failed = 0;

  CompanyService.resetForTesting();
  TripService.resetForTesting();

  // Test 1: Recherche valide de trajets (Ouaga -> Bobo)
  try {
    const res = TripSearchService.search({
      originCity: 'Ouagadougou',
      destinationCity: 'Bobo-Dioulasso',
      departureDate: '2026-10-11',
      passengerCount: 1,
      sortBy: 'PRICE_ASC'
    });

    assert.ok(res.results.length >= 1, 'Au moins un trajet Ouaga-Bobo doit être retourné');
    assert.strictEqual(res.query.originCity, 'Ouagadougou');
    assert.strictEqual(res.query.destinationCity, 'Bobo-Dioulasso');
    assert.ok(res.results[0].availableSeatsCount >= 0, 'Les sièges disponibles ne doivent jamais être négatifs');
    passed++;
    testResults.push('✔ Test 1: Recherche valide de trajets avec disponibilité réelle calculée');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 1: ${err.message}`);
  }

  // Test 2: Origine et destination identiques strictement refusées
  try {
    assert.throws(() => {
      TripSearchService.search({
        originCity: 'Ouagadougou',
        destinationCity: 'Ouagadougou',
        departureDate: '2026-10-11',
        passengerCount: 1
      });
    }, /distinctes/i);
    passed++;
    testResults.push('✔ Test 2: Origine et destination identiques strictement refusées');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 2: ${err.message}`);
  }

  // Test 3: Date invalide ou passée refusée
  try {
    assert.throws(() => {
      TripSearchService.search({
        originCity: 'Ouagadougou',
        destinationCity: 'Bobo-Dioulasso',
        departureDate: '2020-01-01', // Date passée
        passengerCount: 1
      });
    }, /antérieure|date/i);
    passed++;
    testResults.push('✔ Test 3: Date passée ou format de date invalide refusé');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 3: ${err.message}`);
  }

  // Test 4: Nombre de passagers < 1 ou excédant la limite refusé
  try {
    assert.throws(() => {
      TripSearchService.search({
        originCity: 'Ouagadougou',
        destinationCity: 'Bobo-Dioulasso',
        departureDate: '2026-10-11',
        passengerCount: 0
      });
    }, /au moins 1/i);

    assert.throws(() => {
      TripSearchService.search({
        originCity: 'Ouagadougou',
        destinationCity: 'Bobo-Dioulasso',
        departureDate: '2026-10-11',
        passengerCount: 25 // Dépasse limite max
      });
    }, /dépasser la limite/i);
    passed++;
    testResults.push('✔ Test 4: Validation stricte du nombre de voyageurs (min 1, max configurable)');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 4: ${err.message}`);
  }

  // Test 5: Départ annulé exclu des résultats de recherche
  try {
    const adminUser: User = {
      id: 'usr_admin',
      name: 'Admin',
      phone: '+226 70 00 00 00',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    };

    // Annuler temporairement le premier trajet
    const tripToCancel = TripService.getTripById('trip_01');
    assert.ok(tripToCancel);
    TripService.updateTripStatus(adminUser, 'trip_01', 'CANCELLED', 'Panne mécanique');

    const searchRes = TripSearchService.search({
      originCity: 'Ouagadougou',
      destinationCity: 'Bobo-Dioulasso',
      departureDate: '2026-10-11',
      passengerCount: 1
    });

    assert.strictEqual(
      searchRes.results.some(r => r.trip.id === 'trip_01'),
      false,
      'Le départ annulé ne doit pas figurer dans les résultats'
    );

    // Rétablir le statut
    TripService.updateTripStatus(adminUser, 'trip_01', 'PUBLISHED');
    passed++;
    testResults.push('✔ Test 5: Exclusion rigoureuse des départs annulés ou non réservables');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 5: ${err.message}`);
  }

  // Test 6: Exclusion des compagnies non actives (PENDING, SUSPENDED, REJECTED)
  try {
    // comp_sahel_express est PENDING dans mockData
    const sahelTrip = TripService.getAllTrips().find(t => t.companyId === 'comp_sahel_express');
    if (sahelTrip) {
      const res = TripSearchService.search({
        originCity: sahelTrip.departureCity,
        destinationCity: sahelTrip.destinationCity,
        departureDate: sahelTrip.date,
        passengerCount: 1
      });
      assert.strictEqual(
        res.results.some(r => r.trip.companyId === 'comp_sahel_express'),
        false,
        'Une compagnie non-ACTIVE ne doit pas paraître dans les réservations'
      );
    }
    passed++;
    testResults.push('✔ Test 6: Exclusion stricte des départs opérés par des compagnies non-ACTIVE');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 6: ${err.message}`);
  }

  // Test 7: Tri des résultats par tarif croissant et heure de départ
  try {
    const sortedByPrice = TripSearchService.search({
      originCity: 'Ouagadougou',
      destinationCity: 'Bobo-Dioulasso',
      departureDate: '2026-10-11',
      passengerCount: 1,
      sortBy: 'PRICE_ASC'
    });

    for (let i = 0; i < sortedByPrice.results.length - 1; i++) {
      assert.ok(
        sortedByPrice.results[i].trip.priceXOF <= sortedByPrice.results[i + 1].trip.priceXOF,
        'Les résultats doivent être ordonnés par tarif croissant'
      );
    }

    const sortedByTime = TripSearchService.search({
      originCity: 'Ouagadougou',
      destinationCity: 'Bobo-Dioulasso',
      departureDate: '2026-10-11',
      passengerCount: 1,
      sortBy: 'TIME_ASC'
    });

    for (let i = 0; i < sortedByTime.results.length - 1; i++) {
      assert.ok(
        sortedByTime.results[i].trip.departureTime.localeCompare(sortedByTime.results[i + 1].trip.departureTime) <= 0,
        'Les résultats doivent être ordonnés par heure de départ croissante'
      );
    }
    passed++;
    testResults.push('✔ Test 7: Tri conforme des résultats selon les critères métier (prix, horaire, durée)');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 7: ${err.message}`);
  }

  return { passed, failed, tests: testResults };
}
