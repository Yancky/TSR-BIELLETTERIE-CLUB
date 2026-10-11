/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Permission, User, UserRole } from '../types';
import { AuditService } from './auditService';

/**
 * Matrice centralisée des autorisations par rôle (RBAC)
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  TRAVELER: [
    'TRIP_SEARCH',
    'TRIP_VIEW_DETAILS',
    'BOOKING_CREATE',
    'BOOKING_VIEW_OWN',
    'BOOKING_CANCEL_OWN',
    'PAYMENT_INITIATE',
    'TICKET_VIEW_OWN',
    'TICKET_DOWNLOAD_OWN',
    'PROFILE_MANAGE_OWN'
  ],

  AGENT: [
    'TRIP_SEARCH',
    'TRIP_VIEW_DETAILS',
    'AGENT_VIEW_ASSIGNED_TRIPS',
    'TICKET_SCAN_AND_VALIDATE',
    'BOARDING_REGISTER'
  ],

  COMPANY_MANAGER: [
    'TRIP_SEARCH',
    'TRIP_VIEW_DETAILS',
    'COMPANY_VIEW_OWN',
    'COMPANY_UPDATE_OWN',
    'AGENCY_MANAGE_OWN',
    'BUS_MANAGE_OWN',
    'TRIP_CREATE_OWN',
    'TRIP_UPDATE_OWN',
    'TRIP_CANCEL_OWN',
    'BOOKING_VIEW_COMPANY',
    'REVENUE_VIEW_COMPANY',
    'AGENT_MANAGE_COMPANY'
  ],

  ADMIN: [
    'TRIP_SEARCH',
    'TRIP_VIEW_DETAILS',
    'ADMIN_SUPERVISION_ALL',
    'COMPANY_APPROVE',
    'COMPANY_REJECT',
    'COMPANY_SUSPEND',
    'COMPANY_REACTIVATE',
    'ALL_USERS_MANAGE',
    'ALL_TRANSACTIONS_VIEW',
    'AUDIT_LOGS_VIEW'
  ]
};

export interface AccessContext {
  targetCompanyId?: string;
  targetOwnerUserId?: string;
  resourceId?: string;
  correlationId?: string;
}

export interface AccessCheckResult {
  granted: boolean;
  reason?: string;
}

export class PermissionService {
  /**
   * Vérifie si un rôle possède une permission de base
   */
  public static hasRolePermission(role: UserRole, permission: Permission): boolean {
    const list = ROLE_PERMISSIONS[role] || [];
    return list.includes(permission);
  }

  /**
   * Vérifie l'accès en appliquant les règles RBAC et l'isolation des données multi-compagnies
   */
  public static checkAccess(
    user: User | null,
    permission: Permission,
    context?: AccessContext
  ): AccessCheckResult {
    // 1. Session requise pour toute permission autre que la recherche publique
    if (!user) {
      if (permission === 'TRIP_SEARCH' || permission === 'TRIP_VIEW_DETAILS') {
        return { granted: true };
      }
      return {
        granted: false,
        reason: 'AUTHENTICATION_REQUIRED: Session utilisateur requise.'
      };
    }

    // 2. Contrôle du statut du compte
    if (user.status === 'SUSPENDED') {
      AuditService.log({
        actorId: user.id,
        actorRole: user.role,
        action: 'PERMISSION_DENIED',
        resourceType: 'USER',
        resourceId: user.id,
        result: 'FAILURE',
        reason: 'ACCOUNT_SUSPENDED: Le compte est suspendu par l\'administration.',
        correlationId: context?.correlationId
      });
      return {
        granted: false,
        reason: 'ACCOUNT_SUSPENDED: Votre compte est temporairement suspendu.'
      };
    }

    // 3. Contrôle de la matrice RBAC de base
    const hasBasePermission = this.hasRolePermission(user.role, permission);
    if (!hasBasePermission) {
      AuditService.log({
        actorId: user.id,
        actorRole: user.role,
        action: 'PERMISSION_DENIED',
        resourceType: 'SYSTEM',
        result: 'FAILURE',
        reason: `ROLE_FORBIDDEN: Le rôle ${user.role} ne possède pas la permission ${permission}.`,
        correlationId: context?.correlationId
      });
      return {
        granted: false,
        reason: `PERMISSION_DENIED: Action non autorisée pour le rôle ${user.role}.`
      };
    }

    // 4. Isolation multi-compagnies pour COMPANY_MANAGER et AGENT
    if (user.role === 'COMPANY_MANAGER' || user.role === 'AGENT') {
      if (!user.companyId) {
        return {
          granted: false,
          reason: 'ORPHAN_PROFILE: Utilisateur non affilié à une compagnie valide.'
        };
      }

      if (context?.targetCompanyId && context.targetCompanyId !== user.companyId) {
        AuditService.log({
          actorId: user.id,
          actorRole: user.role,
          action: 'PERMISSION_DENIED',
          resourceType: 'COMPANY',
          resourceId: context.targetCompanyId,
          companyId: user.companyId,
          result: 'FAILURE',
          reason: `CROSS_COMPANY_VIOLATION: Tentative d'accès à la compagnie ${context.targetCompanyId} depuis ${user.companyId}.`,
          correlationId: context?.correlationId
        });
        return {
          granted: false,
          reason: `ISOLATION_VIOLATION: Vous ne pouvez pas accéder aux données d'une autre compagnie.`
        };
      }
    }

    // 5. Isolation des données personnelles pour TRAVELER
    if (user.role === 'TRAVELER') {
      if (context?.targetOwnerUserId && context.targetOwnerUserId !== user.id) {
        AuditService.log({
          actorId: user.id,
          actorRole: user.role,
          action: 'PERMISSION_DENIED',
          resourceType: 'USER',
          resourceId: context.targetOwnerUserId,
          result: 'FAILURE',
          reason: `CROSS_USER_VIOLATION: Tentative d'accès aux données du voyageur ${context.targetOwnerUserId}.`,
          correlationId: context?.correlationId
        });
        return {
          granted: false,
          reason: `PRIVACY_VIOLATION: Vous ne pouvez consulter que vos propres réservations et billets.`
        };
      }
    }

    // 6. Succès
    return { granted: true };
  }

  /**
   * Lève une exception si l'accès n'est pas accordé
   */
  public static assertAccess(
    user: User | null,
    permission: Permission,
    context?: AccessContext
  ): void {
    const check = this.checkAccess(user, permission, context);
    if (!check.granted) {
      throw new Error(check.reason || 'Accès refusé par la politique de sécurité TSR TRANSIT.');
    }
  }
}
