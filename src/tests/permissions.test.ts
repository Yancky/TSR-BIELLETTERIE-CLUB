/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import { PermissionService } from '../services/permissionService';
import { AuditService } from '../services/auditService';
import { User } from '../types';

export function runPermissionTests(): { passed: number; failed: number; tests: string[] } {
  const testResults: string[] = [];
  let passed = 0;
  let failed = 0;

  AuditService.clearLogsForTesting();

  const travelerUser: User = {
    id: 'usr_traveler_1',
    name: 'Aminata Ouédraogo',
    phone: '+226 70 12 34 56',
    role: 'TRAVELER',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  const agentUser: User = {
    id: 'usr_agent_1',
    name: 'Ibrahim Kaboré',
    phone: '+226 76 54 32 10',
    role: 'AGENT',
    status: 'ACTIVE',
    companyId: 'comp_tsr',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  const managerCompanyA: User = {
    id: 'usr_mgr_tsr',
    name: 'Jean-Pierre Yaméogo',
    phone: '+226 78 90 12 34',
    role: 'COMPANY_MANAGER',
    status: 'ACTIVE',
    companyId: 'comp_tsr',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  const adminUser: User = {
    id: 'usr_admin_1',
    name: 'Admin Central',
    phone: '+226 70 00 11 22',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  // Test 1: Refus d'accès sans session valide
  try {
    const checkPublic = PermissionService.checkAccess(null, 'TRIP_SEARCH');
    assert.strictEqual(checkPublic.granted, true, 'La recherche publique doit être autorisée sans session');

    const checkPrivate = PermissionService.checkAccess(null, 'BOOKING_CREATE');
    assert.strictEqual(checkPrivate.granted, false, 'La réservation requiert une session');
    assert.ok(checkPrivate.reason?.includes('Session'), 'Doit indiquer que la session est requise');
    passed++;
    testResults.push('✔ Test 1: Refus strict des actions privées sans session active');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 1: ${err.message}`);
  }

  // Test 2: Refus d'accès d'un voyageur aux fonctions d'administration
  try {
    const checkAdminSupervision = PermissionService.checkAccess(travelerUser, 'ADMIN_SUPERVISION_ALL');
    assert.strictEqual(checkAdminSupervision.granted, false, 'Un voyageur ne doit pas accéder à la supervision admin');

    const checkApproveCompany = PermissionService.checkAccess(travelerUser, 'COMPANY_APPROVE');
    assert.strictEqual(checkApproveCompany.granted, false, 'Un voyageur ne peut pas approuver une compagnie');
    passed++;
    testResults.push('✔ Test 2: Blocage d\'un voyageur tentant d\'exécuter des actions administratives');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 2: ${err.message}`);
  }

  // Test 3: Refus d'accès d'un agent aux fonctions réservées au responsable
  try {
    const checkCreateTrip = PermissionService.checkAccess(agentUser, 'TRIP_CREATE_OWN');
    assert.strictEqual(checkCreateTrip.granted, false, 'Un agent de quai ne peut pas créer de nouveaux voyages');

    const checkRevenue = PermissionService.checkAccess(agentUser, 'REVENUE_VIEW_COMPANY');
    assert.strictEqual(checkRevenue.granted, false, 'Un agent de quai ne doit pas voir les recettes de l\'entreprise');

    const checkScan = PermissionService.checkAccess(agentUser, 'TICKET_SCAN_AND_VALIDATE');
    assert.strictEqual(checkScan.granted, true, 'Un agent doit pouvoir scanner et valider les billets');
    passed++;
    testResults.push('✔ Test 3: Ségrégation des privilèges entre agent de gare et responsable de compagnie');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 3: ${err.message}`);
  }

  // Test 4: Isolation multi-compagnies stricte
  try {
    // Le manager TSR tente d'accéder aux réservations de TSR -> Autorisé
    const checkOwnCompany = PermissionService.checkAccess(managerCompanyA, 'BOOKING_VIEW_COMPANY', {
      targetCompanyId: 'comp_tsr'
    });
    assert.strictEqual(checkOwnCompany.granted, true, 'Le responsable doit pouvoir gérer sa propre compagnie');

    // Le manager TSR tente d'accéder aux données privées de Rakieta (comp_rakieta) -> STRICTEMENT REFUSÉ
    const checkForeignCompany = PermissionService.checkAccess(managerCompanyA, 'BOOKING_VIEW_COMPANY', {
      targetCompanyId: 'comp_rakieta'
    });
    assert.strictEqual(checkForeignCompany.granted, false, 'L\'accès aux données d\'une compagnie concurrente doit être bloqué');
    assert.ok(checkForeignCompany.reason?.includes('ISOLATION_VIOLATION'), 'Doit lever une violation d\'isolation');
    passed++;
    testResults.push('✔ Test 4: Isolation multi-compagnies étanche (impossibilité d\'accéder aux données d\'un concurrent)');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 4: ${err.message}`);
  }

  // Test 5: Isolation des données personnelles voyageur
  try {
    // Voyageur consulte son propre billet
    const checkOwnTicket = PermissionService.checkAccess(travelerUser, 'TICKET_VIEW_OWN', {
      targetOwnerUserId: 'usr_traveler_1'
    });
    assert.strictEqual(checkOwnTicket.granted, true);

    // Voyageur tente de consulter le billet d'un autre voyageur (usr_traveler_2) -> REFUSÉ
    const checkOtherTicket = PermissionService.checkAccess(travelerUser, 'TICKET_VIEW_OWN', {
      targetOwnerUserId: 'usr_traveler_2'
    });
    assert.strictEqual(checkOtherTicket.granted, false);
    assert.ok(checkOtherTicket.reason?.includes('PRIVACY_VIOLATION'));
    passed++;
    testResults.push('✔ Test 5: Isolation des réservations et billets entre voyageurs');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 5: ${err.message}`);
  }

  // Test 6: Audit automatique des tentatives non autorisées
  try {
    const logs = AuditService.getAllLogs();
    const deniedLogs = logs.filter(l => l.action === 'PERMISSION_DENIED');
    assert.ok(deniedLogs.length >= 2, 'Toute tentative illégitime doit produire une entrée PERMISSION_DENIED dans l\'audit');
    passed++;
    testResults.push('✔ Test 6: Traçabilité inaltérable des refus d\'accès dans le journal d\'audit');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 6: ${err.message}`);
  }

  // Test 7: Privilèges administrateur
  try {
    const checkAdmin = PermissionService.checkAccess(adminUser, 'COMPANY_APPROVE');
    assert.strictEqual(checkAdmin.granted, true, 'L\'administrateur central doit pouvoir approuver des compagnies');

    const checkAudit = PermissionService.checkAccess(adminUser, 'AUDIT_LOGS_VIEW');
    assert.strictEqual(checkAudit.granted, true, 'L\'administrateur central doit pouvoir consulter les journaux d\'audit');
    passed++;
    testResults.push('✔ Test 7: Fonctions d\'administration réservées exclusivement au profil ADMIN');
  } catch (err: any) {
    failed++;
    testResults.push(`✖ Test 7: ${err.message}`);
  }

  return { passed, failed, tests: testResults };
}
