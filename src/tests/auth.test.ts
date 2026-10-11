/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import { TSRAuthService } from '../services/authService';
import { SessionService } from '../services/sessionService';
import { AuditService } from '../services/auditService';
import { AuthSession, User } from '../types';

export async function runAuthTests(): Promise<{ passed: number; failed: number; tests: string[] }> {
  const testResults: string[] = [];
  let passed = 0;
  let failed = 0;

  const auth = new TSRAuthService();
  AuditService.clearLogsForTesting();

  // Test 1: Validation du modèle User (aucun mot de passe exposé)
  try {
    const user: User = {
      id: 'usr_test_01',
      name: 'Salif Sanogo',
      phone: '+226 70 88 99 00',
      role: 'TRAVELER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    assert.strictEqual('password' in user, false, 'Le modèle User ne doit jamais comporter de champ password');
    passed++;
    testResults.push('✔ Test 1: Typage du modèle User - Absence de mot de passe dans l\'objet utilisateur');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 1: ${err.message}`);
  }

  // Test 2: Inscription d'un voyageur avec rôle forcé à TRAVELER
  try {
    const res = await auth.registerTraveler({
      name: 'Ousmane Traoré',
      phone: '+226 71 22 33 44',
      email: 'ousmane.test@transit.bf',
      password: 'passwordSecret123'
    });

    assert.strictEqual(res.success, true, 'L\'inscription doit réussir avec des paramètres valides');
    assert.ok(res.user, 'L\'utilisateur créé doit être présent');
    assert.strictEqual(res.user?.role, 'TRAVELER', 'Le rôle doit obligatoirement être TRAVELER');
    assert.strictEqual(res.user?.status, 'ACTIVE', 'Le statut doit être ACTIVE');
    assert.ok(res.session?.token, 'Une session doit être émise à l\'inscription');
    passed++;
    testResults.push('✔ Test 2: Inscription d\'un voyageur avec attribution automatique du rôle TRAVELER');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 2: ${err.message}`);
  }

  // Test 3: Refus d'inscription si numéro de téléphone invalide
  try {
    const res = await auth.registerTraveler({
      name: 'Bad Phone User',
      phone: '1234', // Invalide
      password: 'passwordSecret123'
    });

    assert.strictEqual(res.success, false, 'L\'inscription doit échouer pour un mauvais format de téléphone');
    assert.ok(res.error?.includes('invalide'), 'Un message d\'erreur explicite doit être retourné');
    passed++;
    testResults.push('✔ Test 3: Rejet des numéros de téléphone non conformes au format burkinabè');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 3: ${err.message}`);
  }

  // Test 4: Refus d'auto-attribution du rôle ADMIN
  try {
    // Tentative d'injection d'un rôle ADMIN via l'interface publique
    const payload: any = {
      name: 'Attacker Attempting Admin',
      phone: '+226 72 99 88 77',
      password: 'securePass123',
      role: 'ADMIN' // Tentative frauduleuse
    };

    const res = await auth.registerTraveler(payload);
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.user?.role, 'TRAVELER', 'L\'API doit ignorer toute tentative d\'usurpation du rôle ADMIN');
    passed++;
    testResults.push('✔ Test 4: Protection contre l\'auto-attribution frauduleuse du rôle ADMIN');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 4: ${err.message}`);
  }

  // Test 5: Connexion avec identifiants corrects
  try {
    const res = await auth.login({
      identifier: '+226 70 12 34 56',
      password: 'pass1234'
    });

    assert.strictEqual(res.success, true, 'La connexion doit réussir avec des identifiants valides');
    assert.strictEqual(res.user?.name, 'Aminata Ouédraogo');
    assert.ok(res.session?.token.startsWith('tsr_sess_'), 'Le token de session doit être correctement formaté');
    passed++;
    testResults.push('✔ Test 5: Connexion valide et génération d\'un token de session cryptographique');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 5: ${err.message}`);
  }

  // Test 6: Refus de connexion avec mot de passe incorrect et trace d'audit
  try {
    const res = await auth.login({
      identifier: '+226 70 12 34 56',
      password: 'mauvais_mot_de_passe'
    });

    assert.strictEqual(res.success, false, 'La connexion doit être rejetée en cas de mauvais mot de passe');
    const logs = AuditService.getAllLogs();
    const failedLog = logs.find(l => l.action === 'AUTH_LOGIN_FAILED');
    assert.ok(failedLog, 'L\'échec de connexion doit être consigné dans le journal d\'audit');
    passed++;
    testResults.push('✔ Test 6: Rejet des mauvais identifiants et enregistrement dans le journal d\'audit');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 6: ${err.message}`);
  }

  // Test 7: Expiration des sessions après durée TTL
  try {
    const expiredSession: AuthSession = {
      token: 'tsr_sess_expired_test',
      userId: 'user_traveler_01',
      role: 'TRAVELER',
      issuedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 1 * 1000).toISOString(), // Expirée il y a 1 seconde
      isSimulatedDemo: true
    };

    const check = SessionService.validateSession(expiredSession);
    assert.strictEqual(check.isValid, false, 'La session doit être invalidée si expiresAt est dépassé');
    assert.strictEqual(check.reason, 'EXPIRED', 'Le motif d\'invalidation doit être EXPIRED');
    passed++;
    testResults.push('✔ Test 7: Détection stricte et invalidation automatique des sessions expirées');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 7: ${err.message}`);
  }

  // Test 8: Déconnexion et révocation de session
  try {
    SessionService.createSession('usr_test_logout', 'TRAVELER', undefined, true);
    assert.ok(SessionService.getSession(), 'Une session active doit exister avant déconnexion');

    await auth.logout();
    assert.strictEqual(SessionService.getSession(), null, 'La session doit être totalement purgée après déconnexion');
    passed++;
    testResults.push('✔ Test 8: Déconnexion et révocation sécurisée de session');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 8: ${err.message}`);
  }

  return { passed, failed, tests: testResults };
}
