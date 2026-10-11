/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthSession, UserRole } from '../types';

const SESSION_STORAGE_KEY = 'tsr_auth_session_v1';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 heures en millisecondes

export interface SessionValidationResult {
  isValid: boolean;
  session: AuthSession | null;
  reason?: 'NO_SESSION' | 'EXPIRED' | 'REVOKED' | 'INVALID_STRUCTURE';
}

export class SessionService {
  private static inMemorySession: AuthSession | null = null;

  /**
   * Crée une nouvelle session pour un utilisateur authentifié
   */
  public static createSession(
    userId: string,
    role: UserRole,
    companyId?: string,
    isSimulatedDemo = false
  ): AuthSession {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

    // Génération d'un token cryptographique aléatoire ou déterministe sécurisé
    const entropy = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const token = `tsr_sess_${Buffer.from ? Buffer.from(entropy).toString('base64').replace(/=/g, '') : entropy}`;

    const session: AuthSession = {
      token,
      userId,
      role,
      companyId,
      issuedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isSimulatedDemo
    };

    this.saveSession(session);
    return session;
  }

  /**
   * Sauvegarde la session (supporte à la fois localStorage et runtime in-memory / backend)
   */
  public static saveSession(session: AuthSession): void {
    this.inMemorySession = session;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
    } catch {
      // Stockage local non disponible
    }
  }

  /**
   * Récupère la session actuellement stockée
   */
  public static getSession(): AuthSession | null {
    if (this.inMemorySession) {
      return this.inMemorySession;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return null;
        this.inMemorySession = JSON.parse(raw) as AuthSession;
        return this.inMemorySession;
      }
    } catch {
      return null;
    }
    return null;
  }

  /**
   * Valide la session et son horodatage d'expiration
   */
  public static validateSession(session?: AuthSession | null): SessionValidationResult {
    const targetSession = session ?? this.getSession();

    if (!targetSession) {
      return { isValid: false, session: null, reason: 'NO_SESSION' };
    }

    if (!targetSession.token || !targetSession.userId || !targetSession.expiresAt) {
      return { isValid: false, session: null, reason: 'INVALID_STRUCTURE' };
    }

    const now = new Date().getTime();
    const expiry = new Date(targetSession.expiresAt).getTime();

    if (now >= expiry) {
      this.revokeSession();
      return { isValid: false, session: targetSession, reason: 'EXPIRED' };
    }

    return { isValid: true, session: targetSession };
  }

  /**
   * Révoque et efface la session
   */
  public static revokeSession(): void {
    this.inMemorySession = null;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Renouvelle la session pour une nouvelle durée TTL
   */
  public static refreshSession(currentSession: AuthSession): AuthSession {
    const now = new Date();
    const updated: AuthSession = {
      ...currentSession,
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString()
    };
    this.saveSession(updated);
    return updated;
  }
}
