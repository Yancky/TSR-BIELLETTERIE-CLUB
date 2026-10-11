/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bus, BusCategory, BusStatus, User } from '../types';
import { INITIAL_BUSES } from './mockData';
import { PermissionService } from './permissionService';

export class FleetService {
  private static buses: Map<string, Bus> = new Map();

  static {
    for (const b of INITIAL_BUSES) {
      this.buses.set(b.id, { ...b });
    }
  }

  /**
   * Ajout d'un nouveau véhicule à la flotte
   */
  public static addBus(
    actor: User,
    input: {
      companyId: string;
      agencyId?: string;
      registrationNumber: string;
      fleetNumber: string;
      brand: string;
      model: string;
      manufactureYear?: number;
      seatCapacity: number;
      seatLayout: '2x2' | '2x1' | 'VIP';
      category: BusCategory;
      amenities?: string[];
      status?: BusStatus;
    }
  ): Bus {
    // 1. Contrôle RBAC et isolation multi-compagnies
    PermissionService.assertAccess(actor, 'BUS_MANAGE_OWN', { targetCompanyId: input.companyId });

    // 2. Contrôle de validité de la capacité
    if (!input.seatCapacity || input.seatCapacity <= 0 || !Number.isInteger(input.seatCapacity)) {
      throw new Error('La capacité de sièges doit être un nombre entier strictement positif.');
    }

    // 3. Validation de la plaque et de l'immatriculation
    if (!input.registrationNumber || input.registrationNumber.trim().length < 4) {
      throw new Error('Numéro d\'immatriculation burkinabè requis.');
    }

    const cleanReg = input.registrationNumber.trim().toUpperCase();
    const duplicate = Array.from(this.buses.values()).find(
      b => b.registrationNumber.toUpperCase() === cleanReg
    );
    if (duplicate) {
      throw new Error(`Le véhicule immatriculé '${cleanReg}' est déjà enregistré dans le système.`);
    }

    const id = `bus_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const nowIso = new Date().toISOString();

    const newBus: Bus = {
      id,
      companyId: input.companyId,
      agencyId: input.agencyId,
      registrationNumber: cleanReg,
      registrationPlate: cleanReg,
      fleetNumber: input.fleetNumber.trim() || `BUS-${Date.now().toString().slice(-3)}`,
      brand: input.brand.trim() || 'Scania',
      model: input.model.trim() || 'Confort HD',
      manufactureYear: input.manufactureYear,
      seatCapacity: input.seatCapacity,
      totalSeats: input.seatCapacity,
      seatLayout: input.seatLayout || '2x2',
      category: input.category || 'STANDARD',
      amenities: input.amenities || ['Climatisation'],
      status: input.status || 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.buses.set(id, newBus);
    return { ...newBus };
  }

  /**
   * Modification d'un véhicule
   */
  public static updateBus(
    actor: User,
    busId: string,
    updates: Partial<Omit<Bus, 'id' | 'companyId' | 'createdAt'>>
  ): Bus {
    const bus = this.buses.get(busId);
    if (!bus) throw new Error('Véhicule introuvable.');

    PermissionService.assertAccess(actor, 'BUS_MANAGE_OWN', { targetCompanyId: bus.companyId });

    if (updates.seatCapacity !== undefined) {
      if (updates.seatCapacity <= 0 || !Number.isInteger(updates.seatCapacity)) {
        throw new Error('La capacité de sièges doit être un entier strictement positif.');
      }
      bus.seatCapacity = updates.seatCapacity;
      bus.totalSeats = updates.seatCapacity;
    }

    Object.assign(bus, updates, { updatedAt: new Date().toISOString() });
    return { ...bus };
  }

  /**
   * Changement de statut (ACTIVE, MAINTENANCE, INACTIVE)
   */
  public static setBusStatus(actor: User, busId: string, status: BusStatus): Bus {
    const bus = this.buses.get(busId);
    if (!bus) throw new Error('Véhicule introuvable.');

    PermissionService.assertAccess(actor, 'BUS_MANAGE_OWN', { targetCompanyId: bus.companyId });
    bus.status = status;
    bus.updatedAt = new Date().toISOString();
    return { ...bus };
  }

  /**
   * Récupère les bus d'une compagnie avec vérification de périmètre
   */
  public static getBusesByCompany(companyId: string, actor?: User): Bus[] {
    if (actor && actor.role === 'COMPANY_MANAGER') {
      PermissionService.assertAccess(actor, 'BUS_MANAGE_OWN', { targetCompanyId: companyId });
    }
    return Array.from(this.buses.values()).filter(b => b.companyId === companyId);
  }

  public static getBusById(busId: string): Bus | null {
    const b = this.buses.get(busId);
    return b ? { ...b } : null;
  }

  public static resetForTesting(): void {
    this.buses.clear();
    for (const b of INITIAL_BUSES) {
      this.buses.set(b.id, { ...b });
    }
  }
}
