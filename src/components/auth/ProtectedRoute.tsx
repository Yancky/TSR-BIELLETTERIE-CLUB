/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { appStore } from '../../services/store';
import { SessionService } from '../../services/sessionService';
import { UnauthorizedPage } from '../../pages/UnauthorizedPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const state = appStore.getState();
  const sessionCheck = SessionService.validateSession();

  // Si pas d'utilisateur connecté ou session expirée
  if (!state.currentUser || !sessionCheck.isValid) {
    if (fallback) return <>{fallback}</>;
    return (
      <UnauthorizedPage
        requiredRole="Utilisateur Authentifié"
        reason="Une session active et non expirée est requise pour accéder à cette interface."
      />
    );
  }

  return <>{children}</>;
};
