/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Permission, UserRole } from '../../types';
import { PermissionService } from '../../services/permissionService';
import { appStore } from '../../services/store';
import { UnauthorizedPage } from '../../pages/UnauthorizedPage';

interface RoleGuardProps {
  allowedRoles?: UserRole[];
  requiredPermission?: Permission;
  targetCompanyId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  requiredPermission,
  targetCompanyId,
  fallback,
  children
}) => {
  const state = appStore.getState();
  const currentUser = state.currentUser;

  // 1. Contrôle par liste de rôles si spécifié
  if (allowedRoles && allowedRoles.length > 0) {
    if (!currentUser || !allowedRoles.includes(currentUser.role)) {
      if (fallback) return <>{fallback}</>;
      return (
        <UnauthorizedPage
          requiredRole={allowedRoles.join(' ou ')}
          reason={`Cette section est strictement réservée aux profils : ${allowedRoles.join(', ')}.`}
        />
      );
    }
  }

  // 2. Contrôle par permission RBAC et isolation multi-compagnies
  if (requiredPermission) {
    const check = PermissionService.checkAccess(currentUser, requiredPermission, {
      targetCompanyId
    });

    if (!check.granted) {
      if (fallback) return <>{fallback}</>;
      return (
        <UnauthorizedPage
          requiredRole={allowedRoles?.join(' ou ') || 'Autorisé'}
          reason={check.reason}
        />
      );
    }
  }

  return <>{children}</>;
};
