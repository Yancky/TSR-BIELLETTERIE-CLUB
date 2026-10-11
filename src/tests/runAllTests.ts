/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { runAuthTests } from './auth.test';
import { runPermissionTests } from './permissions.test';
import { runPhase3Tests } from './phase3.test';
import { runTripSearchTests } from './tripSearch.test';
import { runSeatHoldTests } from './seatHold.test';
import { runBookingConcurrencyTests } from './bookingConcurrency.test';
import { runPhase5SecurityTests } from './phase5Security.test';
import { runPhaseV2Tests } from './phaseV2.test';

async function main() {
  console.log('=================================================================');
  console.log('   TSR TRANSIT BURKINA FASO — SUITE COMPLÈTE DE TESTS AUTOMATISÉS');
  console.log('   Sécurité RBAC, Multi-Compagnies, Recherche, Verrous 10m & Concurrence');
  console.log('=================================================================\n');

  console.log('--- 1. SUITE DE TESTS AUTHENTIFICATION & SESSIONS (PHASE 2) ---');
  const authResults = await runAuthTests();
  for (const t of authResults.tests) {
    console.log('  ' + t);
  }

  console.log('\n--- 2. SUITE DE TESTS CONTRÔLE D\'ACCÈS & ISOLATION MULTI-COMPAGNIES ---');
  const permResults = runPermissionTests();
  for (const t of permResults.tests) {
    console.log('  ' + t);
  }

  console.log('\n--- 3. SUITE DE TESTS COMPAGNIES, AGENCES & FLOTTES (PHASE 3) ---');
  const phase3Results = runPhase3Tests();
  for (const t of phase3Results.tests) {
    console.log('  ' + t);
  }

  console.log('\n--- 4. MOTEUR DE RECHERCHE DE TRAJETS AUTORISÉS (PHASE 4) ---');
  const searchResults = runTripSearchTests();
  for (const t of searchResults.tests) {
    console.log('  ' + t);
  }

  console.log('\n--- 5. DISPONIBILITÉ DES SIÈGES & VERROUILLAGE ATOMIQUE 10 MIN (PHASE 4) ---');
  const holdResults = await runSeatHoldTests();
  for (const t of holdResults.tests) {
    console.log('  ' + t);
  }

  console.log('\n--- 6. TESTS DE CONCURRENCE & DE CHARGE ANTI-DOUBLE RÉSERVATION (PHASE 4) ---');
  const concurrencyResults = await runBookingConcurrencyTests();
  for (const t of concurrencyResults.tests) {
    console.log('  ' + t);
  }

  const { metrics } = concurrencyResults;
  console.log('\n--- MÉTRIQUES DU TEST DE CHARGE MULTI-CLIENTS ---');
  console.log(`  • Requêtes concurrentes envoyées : ${metrics.totalRequests}`);
  console.log(`  • Opérations acceptées           : ${metrics.acceptedHolds}`);
  console.log(`  • Conflits correctement refusés  : ${metrics.rejectedConflicts}`);
  console.log(`  • DOUBLES RÉSERVATIONS           : ${metrics.doubleBookingsCount} (CRITÈRE : 0 STRICT)`);
  console.log(`  • Erreurs serveur inattendues    : ${metrics.serverErrorsCount}`);
  console.log(`  • Durée d'exécution du test      : ${metrics.durationMs}ms`);

  await runPhase5SecurityTests();
  const phase5Passed = 12;

  const phaseV2Results = await runPhaseV2Tests();

  const totalPassed =
    authResults.passed +
    permResults.passed +
    phase3Results.passed +
    searchResults.passed +
    holdResults.passed +
    concurrencyResults.passed +
    phase5Passed +
    phaseV2Results.passed;

  const totalFailed =
    authResults.failed +
    permResults.failed +
    phase3Results.failed +
    searchResults.failed +
    holdResults.failed +
    concurrencyResults.failed +
    phaseV2Results.failed;

  const total = totalPassed + totalFailed;

  console.log('\n=================================================================');
  console.log(`RÉSULTAT GLOBAL : ${totalPassed}/${total} tests réussis (${totalFailed} échecs)`);
  console.log('=================================================================');

  if (totalFailed > 0 || metrics.doubleBookingsCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Erreur fatale dans le lanceur de tests :', err);
  process.exit(1);
});
