/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuditActionType, AuditLog, AuditResourceType, AuditResult, UserRole } from '../types';

const AUDIT_STORAGE_KEY = 'tsr_audit_logs_v1';
const MAX_LOCAL_LOGS = 300;

export interface LogParams {
  actorId: string;
  actorRole: UserRole | 'SYSTEM';
  action: AuditActionType;
  resourceType?: AuditResourceType;
  resourceId?: string;
  targetId?: string;
  companyId?: string;
  result?: AuditResult;
  status?: AuditResult;
  reason?: string;
  correlationId?: string;
  details?: Record<string, unknown> | string;
}

export class AuditService {
  private static inMemoryLogs: AuditLog[] = [];

  static {
    // Initialise avec logs persistés si disponibles
    this.loadLogs();
  }

  private static loadLogs(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
        if (raw) {
          this.inMemoryLogs = JSON.parse(raw);
        }
      }
    } catch {
      this.inMemoryLogs = [];
    }
  }

  private static persistLogs(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          AUDIT_STORAGE_KEY,
          JSON.stringify(this.inMemoryLogs.slice(0, MAX_LOCAL_LOGS))
        );
      }
    } catch {
      // Ignoré si stockage plein ou indisponible
    }
  }

  /**
   * Nettoie les données sensibles pour empêcher toute fuite dans les journaux d'audit
   */
  private static sanitizeDetails(details?: Record<string, unknown> | string): Record<string, unknown> | string | undefined {
    if (!details) return undefined;
    if (typeof details === 'string') return details;
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'secret', 'pin', 'cvv', 'authsession', 'authorization'];

    for (const [key, value] of Object.entries(details)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED_BY_SECURITY_POLICY]';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Enregistre un événement d'audit inaltérable
   */
  public static log(params: LogParams): AuditLog {
    const id = `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timestamp = new Date().toISOString(); // UTC ISO 8601

    const entry: AuditLog = {
      id,
      timestamp,
      actorId: params.actorId,
      actorRole: params.actorRole,
      action: params.action,
      resourceType: params.resourceType || 'SYSTEM',
      resourceId: params.resourceId || params.targetId,
      targetId: params.targetId,
      companyId: params.companyId,
      result: params.result || params.status || 'SUCCESS',
      status: params.status || params.result || 'SUCCESS',
      reason: params.reason,
      correlationId: params.correlationId || `req_${Date.now()}`,
      details: this.sanitizeDetails(params.details)
    };

    this.inMemoryLogs.unshift(entry);
    if (this.inMemoryLogs.length > MAX_LOCAL_LOGS) {
      this.inMemoryLogs = this.inMemoryLogs.slice(0, MAX_LOCAL_LOGS);
    }
    this.persistLogs();

    return entry;
  }

  /**
   * Récupère tous les journaux d'audit (réservé aux administrateurs)
   */
  public static getAllLogs(): AuditLog[] {
    return [...this.inMemoryLogs];
  }

  /**
   * Récupère les journaux d'une compagnie spécifique (isolation des données)
   */
  public static getLogsByCompany(companyId: string): AuditLog[] {
    return this.inMemoryLogs.filter(log => log.companyId === companyId);
  }

  /**
   * Récupère les journaux d'un acteur spécifique
   */
  public static getLogsByActor(actorId: string): AuditLog[] {
    return this.inMemoryLogs.filter(log => log.actorId === actorId);
  }

  /**
   * Récupère les alertes de sécurité (échecs ou avertissements)
   */
  public static getSecurityAlerts(): AuditLog[] {
    return this.inMemoryLogs.filter(
      log => log.result === 'FAILURE' || log.result === 'WARNING' || log.action === 'PERMISSION_DENIED'
    );
  }

  /**
   * Réinitialise pour les tests automatisés
   */
  public static clearLogsForTesting(): void {
    this.inMemoryLogs = [];
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(AUDIT_STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  }
}
