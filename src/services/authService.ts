/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthSession, User, UserRole, UserStatus } from '../types';
import { SessionService } from './sessionService';
import { AuditService } from './auditService';
import { validateBurkinaPhone } from './ticketSecurity';

export interface RegisterTravelerInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
  // Délibérément, aucun champ 'role' n'est accepté ici pour empêcher l'auto-attribution de privilèges
}

export interface LoginCredentials {
  identifier: string; // Téléphone ou Email
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  session?: AuthSession;
  error?: string;
}

export interface IAuthService {
  registerTraveler(data: RegisterTravelerInput): Promise<AuthResult>;
  login(credentials: LoginCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  getCurrentSession(): AuthSession | null;
  getCurrentUser(): Promise<User | null>;
  validateCurrentSession(): Promise<boolean>;
}

/**
 * Fonction de hachage SHA-256 standard pour les mots de passe
 */
async function hashPassword(plainText: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText + '_salt_tsr_transit_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple si SubtleCrypto est indisponible dans certains runtimes
  let hash = 0;
  for (let i = 0; i < plainText.length; i++) {
    hash = (hash << 5) - hash + plainText.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash)}`;
}

interface StoredUserRecord {
  user: User;
  passwordHash: string;
}

const USERS_STORAGE_KEY = 'tsr_registered_users_v1';

export class TSRAuthService implements IAuthService {
  private users: Map<string, StoredUserRecord> = new Map();

  constructor() {
    this.seedDefaultUsers();
    this.loadUsersFromStorage();
  }

  private async seedDefaultUsers(): Promise<void> {
    const defaultHash = await hashPassword('pass1234');

    const seeds: StoredUserRecord[] = [
      {
        user: {
          id: 'user_traveler_01',
          name: 'Aminata Ouédraogo',
          phone: '+226 70 12 34 56',
          email: 'aminata.ouedraogo@fasonet.bf',
          role: 'TRAVELER',
          status: 'ACTIVE',
          createdAt: '2026-01-10T08:00:00Z',
          updatedAt: '2026-01-10T08:00:00Z'
        },
        passwordHash: defaultHash
      },
      {
        user: {
          id: 'user_manager_tsr',
          name: 'Jean-Pierre Yaméogo (Directeur)',
          phone: '+226 78 90 12 34',
          email: 'directeur@tsr-transit.bf',
          role: 'COMPANY_MANAGER',
          status: 'ACTIVE',
          companyId: 'comp_tsr',
          createdAt: '2025-06-01T08:00:00Z',
          updatedAt: '2025-06-01T08:00:00Z'
        },
        passwordHash: defaultHash
      },
      {
        user: {
          id: 'user_agent_ouaga_01',
          name: 'Ibrahim Kaboré (Agent Quai 1)',
          phone: '+226 76 54 32 10',
          email: 'controleur.ouaga@tsr-transit.bf',
          role: 'AGENT',
          status: 'ACTIVE',
          companyId: 'comp_tsr',
          assignedAgencyId: 'ag_ouaga_centre',
          createdAt: '2025-08-15T08:00:00Z',
          updatedAt: '2025-08-15T08:00:00Z'
        },
        passwordHash: defaultHash
      },
      {
        user: {
          id: 'user_admin_central',
          name: 'Administrateur Central Plateforme',
          phone: '+226 70 00 11 22',
          email: 'admin@tsr-transit.bf',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: '2025-01-01T08:00:00Z',
          updatedAt: '2025-01-01T08:00:00Z'
        },
        passwordHash: defaultHash
      }
    ];

    for (const record of seeds) {
      this.users.set(record.user.id, record);
    }
  }

  private loadUsersFromStorage(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(USERS_STORAGE_KEY);
        if (raw) {
          const list: StoredUserRecord[] = JSON.parse(raw);
          for (const item of list) {
            this.users.set(item.user.id, item);
          }
        }
      }
    } catch {
      // Ignore
    }
  }

  private persistUsers(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const list = Array.from(this.users.values());
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(list));
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Inscription d'un nouveau voyageur avec attribution stricte et immuable du rôle TRAVELER
   */
  public async registerTraveler(data: RegisterTravelerInput): Promise<AuthResult> {
    const correlationId = `reg_${Date.now()}`;

    // 1. Validation du nom
    if (!data.name || data.name.trim().length < 2) {
      return { success: false, error: 'Le nom complet doit comporter au moins 2 caractères.' };
    }

    // 2. Validation du numéro de téléphone burkinabè
    if (!validateBurkinaPhone(data.phone)) {
      return { success: false, error: 'Numéro de téléphone burkinabè invalide (8 chiffres requis).' };
    }

    // 3. Validation de la complexité du mot de passe
    if (!data.password || data.password.length < 6) {
      return { success: false, error: 'Le mot de passe doit comporter au moins 6 caractères.' };
    }

    // 4. Vérification d'unicité du téléphone ou de l'email
    const existing = Array.from(this.users.values()).find(
      r => r.user.phone === data.phone || (data.email && r.user.email === data.email)
    );
    if (existing) {
      AuditService.log({
        actorId: 'anonymous',
        actorRole: 'TRAVELER',
        action: 'AUTH_REGISTER',
        resourceType: 'USER',
        result: 'FAILURE',
        reason: 'DUPLICATE_IDENTIFIER: Ce numéro de téléphone ou cet e-mail est déjà enregistré.',
        correlationId
      });
      return { success: false, error: 'Un compte existe déjà avec ce numéro ou cet e-mail.' };
    }

    // 5. Création sécurisée avec rôle TRAVELER verrouillé
    const passwordHash = await hashPassword(data.password);
    const nowIso = new Date().toISOString();
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || undefined,
      role: 'TRAVELER', // Toujours forcé à TRAVELER
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    const record: StoredUserRecord = {
      user: newUser,
      passwordHash
    };
    this.users.set(newUser.id, record);
    this.persistUsers();

    // 6. Journalisation d'audit
    AuditService.log({
      actorId: newUser.id,
      actorRole: 'TRAVELER',
      action: 'AUTH_REGISTER',
      resourceType: 'USER',
      resourceId: newUser.id,
      result: 'SUCCESS',
      correlationId
    });

    // 7. Émission automatique de session
    const session = SessionService.createSession(newUser.id, newUser.role, undefined, true);

    return {
      success: true,
      user: newUser,
      session
    };
  }

  /**
   * Connexion par téléphone/e-mail et mot de passe
   */
  public async login(credentials: LoginCredentials): Promise<AuthResult> {
    const correlationId = `login_${Date.now()}`;
    const cleanId = credentials.identifier.trim();
    const inputHash = await hashPassword(credentials.password);

    // Recherche de l'utilisateur par téléphone ou email
    const record = Array.from(this.users.values()).find(
      r => r.user.phone === cleanId || r.user.email?.toLowerCase() === cleanId.toLowerCase()
    );

    if (!record || record.passwordHash !== inputHash) {
      AuditService.log({
        actorId: cleanId,
        actorRole: 'TRAVELER',
        action: 'AUTH_LOGIN_FAILED',
        resourceType: 'USER',
        result: 'FAILURE',
        reason: 'BAD_CREDENTIALS: Identifiant ou mot de passe incorrect.',
        correlationId
      });
      return {
        success: false,
        error: 'Identifiants incorrects. Veuillez vérifier votre numéro et mot de passe.'
      };
    }

    // Vérification du statut du compte
    if (record.user.status === 'SUSPENDED') {
      AuditService.log({
        actorId: record.user.id,
        actorRole: record.user.role,
        action: 'AUTH_LOGIN_FAILED',
        resourceType: 'USER',
        resourceId: record.user.id,
        result: 'FAILURE',
        reason: 'ACCOUNT_SUSPENDED: Tentative de connexion sur un compte suspendu.',
        correlationId
      });
      return {
        success: false,
        error: 'Ce compte est suspendu par l\'administration TSR TRANSIT. Contactez le support.'
      };
    }

    // Émission de la session
    const session = SessionService.createSession(
      record.user.id,
      record.user.role,
      record.user.companyId,
      true
    );

    AuditService.log({
      actorId: record.user.id,
      actorRole: record.user.role,
      action: 'AUTH_LOGIN',
      resourceType: 'USER',
      resourceId: record.user.id,
      companyId: record.user.companyId,
      result: 'SUCCESS',
      correlationId
    });

    return {
      success: true,
      user: record.user,
      session
    };
  }

  /**
   * Déconnexion sécurisée
   */
  public async logout(): Promise<void> {
    const currentSession = SessionService.getSession();
    if (currentSession) {
      AuditService.log({
        actorId: currentSession.userId,
        actorRole: currentSession.role,
        action: 'AUTH_LOGOUT',
        resourceType: 'SESSION',
        result: 'SUCCESS'
      });
    }
    SessionService.revokeSession();
  }

  public getCurrentSession(): AuthSession | null {
    const check = SessionService.validateSession();
    return check.isValid ? check.session : null;
  }

  public async getCurrentUser(): Promise<User | null> {
    const session = this.getCurrentSession();
    if (!session) return null;
    const record = this.users.get(session.userId);
    return record ? record.user : null;
  }

  public async validateCurrentSession(): Promise<boolean> {
    const check = SessionService.validateSession();
    return check.isValid;
  }

  /**
   * Helper pour tests : injecte ou modifie un utilisateur
   */
  public debugGetUser(id: string): User | undefined {
    return this.users.get(id)?.user;
  }
}

export const authService = new TSRAuthService();
