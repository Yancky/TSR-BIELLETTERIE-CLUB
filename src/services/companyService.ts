/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Company, CompanyRegistrationInput, CompanyStatus, User } from '../types';
import { INITIAL_COMPANIES } from './mockData';
import { AuditService } from './auditService';
import { PermissionService } from './permissionService';

export interface PublicCompanyView {
  id: string;
  name: string;
  tradeName: string;
  logoUrl?: string;
  headquarters: string;
  city?: string;
  phone: string;
  whatsapp: string;
  description?: string;
  servedCities?: string[];
  fleetCount: number;
  rating: number;
}

export class CompanyService {
  private static companies: Map<string, Company> = new Map();
  private static companySeq: number = 0;

  static {
    for (const c of INITIAL_COMPANIES) {
      this.companies.set(c.id, { ...c });
    }
  }

  /**
   * Retourne uniquement les compagnies ACTIVE pour l'affichage public
   * Sanitarise les données : exclut données bancaires, documents et identifiants privés
   */
  public static getPublicActiveCompanies(): PublicCompanyView[] {
    return Array.from(this.companies.values())
      .filter(c => c.status === 'ACTIVE')
      .map(c => ({
        id: c.id,
        name: c.name,
        tradeName: c.tradeName,
        logoUrl: c.logoUrl,
        headquarters: c.headquarters,
        city: c.city,
        phone: c.phone,
        whatsapp: c.whatsapp,
        description: c.description,
        servedCities: c.servedCities,
        fleetCount: c.fleetCount,
        rating: c.rating
      }));
  }

  /**
   * Retourne toutes les compagnies (réservé ADMIN)
   */
  public static getAllCompanies(adminActor: User): Company[] {
    PermissionService.assertAccess(adminActor, 'ADMIN_SUPERVISION_ALL');
    return Array.from(this.companies.values());
  }

  /**
   * Récupère une compagnie par son ID
   */
  public static getCompanyById(companyId: string): Company | null {
    const comp = this.companies.get(companyId);
    return comp ? { ...comp } : null;
  }

  /**
   * Enregistrement officiel d'une nouvelle société de transport
   * Attribue impérativement le statut PENDING
   */
  public static submitRegistration(input: CompanyRegistrationInput): {
    success: boolean;
    company?: Company;
    applicationRef?: string;
    error?: string;
  } {
    // 1. Validation de complétude
    if (!input.name || input.name.trim().length < 3) {
      return { success: false, error: 'La raison sociale doit comporter au moins 3 caractères.' };
    }
    if (!input.ifuNumber || input.ifuNumber.trim().length < 5) {
      return { success: false, error: 'Le numéro IFU professionnel est obligatoire.' };
    }
    if (!input.rccmNumber || input.rccmNumber.trim().length < 5) {
      return { success: false, error: 'Le numéro RCCM du Burkina Faso est obligatoire.' };
    }
    if (!input.managerName || !input.phone || !input.email) {
      return { success: false, error: 'Les informations du responsable légal sont incomplètes.' };
    }
    if (!input.password || input.password.length < 6) {
      return { success: false, error: 'Le mot de passe de gestion doit comporter au moins 6 caractères.' };
    }
    if (input.password !== input.confirmPassword) {
      return { success: false, error: 'Les mots de passe saisis ne correspondent pas.' };
    }
    if (!input.termsAccepted) {
      return { success: false, error: 'L\'acceptation des conditions d\'agrément TSR TRANSIT est requise.' };
    }

    // 2. Détection de doublons IFU / RCCM
    const existing = Array.from(this.companies.values()).find(
      c => c.ifuNumber === input.ifuNumber || c.rccmNumber === input.rccmNumber
    );
    if (existing) {
      return { success: false, error: 'Une société avec ce numéro IFU ou RCCM est déjà répertoriée.' };
    }

    // 3. Création avec statut initial PENDING obligatoire
    CompanyService.companySeq++;
    const id = `comp_${Date.now()}_${CompanyService.companySeq}`;
    const applicationRef = `AGR-BF-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const newCompany: Company = {
      id,
      name: input.name.trim(),
      tradeName: input.tradeName?.trim() || input.name.trim(),
      companyType: input.companyType,
      ifuNumber: input.ifuNumber.trim(),
      rccmNumber: input.rccmNumber.trim(),
      description: input.description,
      logoUrl: input.logoUrl || '/src/assets/images/tsr_transit_badge_1791641501297.jpg',
      headquarters: `${input.headquartersAddress}, ${input.city}`,
      city: input.city,
      region: input.region,
      country: 'Burkina Faso',
      phone: input.phone.trim(),
      whatsapp: input.whatsapp.trim(),
      managerName: input.managerName.trim(),
      managerEmail: input.email.trim(),
      managerRole: input.managerRole,
      merchantCode: input.merchantCode,
      servedCities: input.servedCities,
      status: 'PENDING', // Jamais activée automatiquement
      fleetCount: input.estimatedVehicles || 0,
      rating: 5.0,
      supportingDocuments: {
        rccmDoc: input.rccmDocName || 'rccm_cert.pdf',
        transportLicenseDoc: input.transportLicenseDocName || 'licence_transport.pdf',
        identityDoc: input.identityDocName || 'cnib_responsable.pdf'
      },
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.companies.set(id, newCompany);

    // Journal d'audit
    AuditService.log({
      actorId: 'anonymous_candidate',
      actorRole: 'COMPANY_MANAGER',
      action: 'COMPANY_REGISTER_SUBMITTED',
      resourceType: 'COMPANY',
      resourceId: id,
      companyId: id,
      result: 'SUCCESS',
      correlationId: applicationRef,
      details: {
        companyName: newCompany.name,
        ifu: newCompany.ifuNumber,
        city: newCompany.city
      }
    });

    return {
      success: true,
      company: newCompany,
      applicationRef
    };
  }

  /**
   * Approbation administrative (PENDING -> ACTIVE)
   */
  public static approveCompany(adminActor: User, companyId: string): Company {
    PermissionService.assertAccess(adminActor, 'COMPANY_APPROVE');
    const comp = this.companies.get(companyId);
    if (!comp) throw new Error('Compagnie introuvable.');

    if (comp.status !== 'PENDING') {
      throw new Error(`Transition invalide : Impossible d'approuver une compagnie en statut ${comp.status}.`);
    }

    comp.status = 'ACTIVE';
    comp.updatedAt = new Date().toISOString();

    AuditService.log({
      actorId: adminActor.id,
      actorRole: adminActor.role,
      action: 'COMPANY_APPROVED',
      resourceType: 'COMPANY',
      resourceId: comp.id,
      companyId: comp.id,
      result: 'SUCCESS',
      details: { approvedBy: adminActor.name }
    });

    return { ...comp };
  }

  /**
   * Rejet administratif motivé (PENDING -> REJECTED)
   */
  public static rejectCompany(adminActor: User, companyId: string, mandatoryReason: string): Company {
    PermissionService.assertAccess(adminActor, 'COMPANY_REJECT');
    if (!mandatoryReason || mandatoryReason.trim().length < 5) {
      throw new Error('Un motif détaillé est strictement obligatoire pour rejeter une demande d\'agrément.');
    }

    const comp = this.companies.get(companyId);
    if (!comp) throw new Error('Compagnie introuvable.');

    if (comp.status !== 'PENDING') {
      throw new Error(`Transition invalide : Seule une compagnie PENDING peut être rejetée.`);
    }

    comp.status = 'REJECTED';
    comp.rejectionReason = mandatoryReason.trim();
    comp.updatedAt = new Date().toISOString();

    AuditService.log({
      actorId: adminActor.id,
      actorRole: adminActor.role,
      action: 'COMPANY_REJECTED',
      resourceType: 'COMPANY',
      resourceId: comp.id,
      companyId: comp.id,
      result: 'SUCCESS',
      reason: mandatoryReason
    });

    return { ...comp };
  }

  /**
   * Suspension administrative motivée (ACTIVE -> SUSPENDED)
   */
  public static suspendCompany(adminActor: User, companyId: string, mandatoryReason: string): Company {
    PermissionService.assertAccess(adminActor, 'COMPANY_SUSPEND');
    if (!mandatoryReason || mandatoryReason.trim().length < 5) {
      throw new Error('Un motif motivé est obligatoire pour suspendre une compagnie.');
    }

    const comp = this.companies.get(companyId);
    if (!comp) throw new Error('Compagnie introuvable.');

    if (comp.status !== 'ACTIVE') {
      throw new Error(`Transition invalide : Seule une compagnie ACTIVE peut être suspendue.`);
    }

    comp.status = 'SUSPENDED';
    comp.suspensionReason = mandatoryReason.trim();
    comp.updatedAt = new Date().toISOString();

    AuditService.log({
      actorId: adminActor.id,
      actorRole: adminActor.role,
      action: 'COMPANY_SUSPENDED',
      resourceType: 'COMPANY',
      resourceId: comp.id,
      companyId: comp.id,
      result: 'WARNING',
      reason: mandatoryReason
    });

    return { ...comp };
  }

  /**
   * Réactivation administrative (SUSPENDED -> ACTIVE)
   */
  public static reactivateCompany(adminActor: User, companyId: string): Company {
    PermissionService.assertAccess(adminActor, 'COMPANY_REACTIVATE');
    const comp = this.companies.get(companyId);
    if (!comp) throw new Error('Compagnie introuvable.');

    if (comp.status !== 'SUSPENDED') {
      throw new Error(`Transition invalide : Seule une compagnie SUSPENDED peut être réactivée.`);
    }

    comp.status = 'ACTIVE';
    comp.suspensionReason = undefined;
    comp.updatedAt = new Date().toISOString();

    AuditService.log({
      actorId: adminActor.id,
      actorRole: adminActor.role,
      action: 'COMPANY_REACTIVATED',
      resourceType: 'COMPANY',
      resourceId: comp.id,
      companyId: comp.id,
      result: 'SUCCESS'
    });

    return { ...comp };
  }

  /**
   * Modification des informations de sa propre compagnie (isolation stricte)
   */
  public static updateOwnCompany(
    managerActor: User,
    companyId: string,
    updates: Partial<Pick<Company, 'phone' | 'whatsapp' | 'description' | 'headquarters'>>
  ): Company {
    PermissionService.assertAccess(managerActor, 'COMPANY_UPDATE_OWN', { targetCompanyId: companyId });
    const comp = this.companies.get(companyId);
    if (!comp) throw new Error('Compagnie introuvable.');

    Object.assign(comp, updates, { updatedAt: new Date().toISOString() });
    return { ...comp };
  }

  public static resetForTesting(): void {
    this.companies.clear();
    for (const c of INITIAL_COMPANIES) {
      this.companies.set(c.id, { ...c });
    }
  }
}
