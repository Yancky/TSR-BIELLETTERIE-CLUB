/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Agency, AgencyStatus, User } from '../types';
import { INITIAL_AGENCIES } from './mockData';
import { PermissionService } from './permissionService';
import { AuditService } from './auditService';

export class AgencyService {
  private static agencies: Map<string, Agency> = new Map();

  static {
    for (const a of INITIAL_AGENCIES) {
      this.agencies.set(a.id, { ...a });
    }
  }

  /**
   * Valide les coordonnées géographiques (lat: [-90, 90], lng: [-180, 180])
   */
  public static isValidCoordinates(lat: number, lng: number): boolean {
    if (typeof lat !== 'number' || isNaN(lat) || lat < -90 || lat > 90) return false;
    if (typeof lng !== 'number' || isNaN(lng) || lng < -180 || lng > 180) return false;
    return true;
  }

  /**
   * Création d'une agence avec contrôle RBAC et validation stricte
   */
  public static createAgency(
    actor: User,
    input: {
      companyId: string;
      name: string;
      code: string;
      address: string;
      city: string;
      region: string;
      latitude: number;
      longitude: number;
      phone: string;
      openingHours: string;
    }
  ): Agency {
    // 1. Contrôle RBAC et isolation multi-compagnies
    PermissionService.assertAccess(actor, 'AGENCY_MANAGE_OWN', { targetCompanyId: input.companyId });

    // 2. Validation des champs obligatoires
    if (!input.name || input.name.trim().length < 3) {
      throw new Error('Le nom de l\'agence doit comporter au moins 3 caractères.');
    }
    if (!input.code || input.code.trim().length < 2) {
      throw new Error('Le code de l\'agence est obligatoire.');
    }
    if (!input.city || !input.address || !input.phone) {
      throw new Error('La ville, l\'adresse et le numéro de téléphone sont requis.');
    }

    // 3. Validation des coordonnées GPS
    if (!this.isValidCoordinates(input.latitude, input.longitude)) {
      throw new Error('Coordonnées géographiques GPS invalides.');
    }

    // 4. Unicité du code d'agence dans le périmètre de la compagnie
    const cleanCode = input.code.trim().toUpperCase();
    const duplicate = Array.from(this.agencies.values()).find(
      a => a.companyId === input.companyId && a.code.toUpperCase() === cleanCode
    );
    if (duplicate) {
      throw new Error(`Le code d'agence '${cleanCode}' est déjà utilisé au sein de votre compagnie.`);
    }

    const id = `ag_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newAgency: Agency = {
      id,
      companyId: input.companyId,
      name: input.name.trim(),
      code: cleanCode,
      address: input.address.trim(),
      city: input.city.trim(),
      region: input.region.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      lat: input.latitude,
      lng: input.longitude,
      phone: input.phone.trim(),
      openingHours: input.openingHours.trim() || '06h00 - 20h00',
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.agencies.set(id, newAgency);

    AuditService.log({
      actorId: actor.id,
      actorRole: actor.role,
      action: 'TRIP_CREATED', // Ressource compagnie
      resourceType: 'COMPANY',
      resourceId: id,
      companyId: input.companyId,
      result: 'SUCCESS',
      details: { agencyName: newAgency.name, code: newAgency.code }
    });

    return { ...newAgency };
  }

  /**
   * Modification d'une agence
   */
  public static updateAgency(
    actor: User,
    agencyId: string,
    updates: Partial<Omit<Agency, 'id' | 'companyId' | 'createdAt'>>
  ): Agency {
    const agency = this.agencies.get(agencyId);
    if (!agency) throw new Error('Agence introuvable.');

    PermissionService.assertAccess(actor, 'AGENCY_MANAGE_OWN', { targetCompanyId: agency.companyId });

    if (updates.latitude !== undefined && updates.longitude !== undefined) {
      if (!this.isValidCoordinates(updates.latitude, updates.longitude)) {
        throw new Error('Coordonnées géographiques GPS invalides.');
      }
    }

    if (updates.code) {
      const cleanCode = updates.code.trim().toUpperCase();
      const duplicate = Array.from(this.agencies.values()).find(
        a => a.id !== agencyId && a.companyId === agency.companyId && a.code.toUpperCase() === cleanCode
      );
      if (duplicate) {
        throw new Error(`Le code d'agence '${cleanCode}' est déjà utilisé.`);
      }
      agency.code = cleanCode;
    }

    Object.assign(agency, updates, { updatedAt: new Date().toISOString() });
    if (agency.latitude) agency.lat = agency.latitude;
    if (agency.longitude) agency.lng = agency.longitude;

    return { ...agency };
  }

  /**
   * Activation / Désactivation d'une agence
   */
  public static setAgencyStatus(actor: User, agencyId: string, status: AgencyStatus): Agency {
    const agency = this.agencies.get(agencyId);
    if (!agency) throw new Error('Agence introuvable.');

    PermissionService.assertAccess(actor, 'AGENCY_MANAGE_OWN', { targetCompanyId: agency.companyId });
    agency.status = status;
    agency.updatedAt = new Date().toISOString();
    return { ...agency };
  }

  /**
   * Récupère toutes les agences d'une compagnie (avec vérification de périmètre si manager)
   */
  public static getAgenciesByCompany(companyId: string, actor?: User): Agency[] {
    if (actor && actor.role === 'COMPANY_MANAGER') {
      PermissionService.assertAccess(actor, 'AGENCY_MANAGE_OWN', { targetCompanyId: companyId });
    }
    return Array.from(this.agencies.values()).filter(a => a.companyId === companyId);
  }

  /**
   * Récupère les agences publiques actives par ville
   */
  public static getPublicAgencies(city?: string): Agency[] {
    return Array.from(this.agencies.values()).filter(
      a => a.status === 'ACTIVE' && (!city || a.city.toLowerCase() === city.toLowerCase())
    );
  }

  public static resetForTesting(): void {
    this.agencies.clear();
    for (const a of INITIAL_AGENCIES) {
      this.agencies.set(a.id, { ...a });
    }
  }
}
