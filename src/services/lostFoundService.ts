/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LostItemReport, LostItemStatus } from '../types';

export const INITIAL_LOST_ITEMS: LostItemReport[] = [
  {
    id: 'lost_01',
    reference: 'TSR-OBJ-4402',
    travelerName: 'Moussa Sanou',
    travelerPhone: '+226 70 12 34 56',
    ticketNumber: 'TSR-BF-2026-8819',
    tripInfo: 'Ouagadougou -> Bobo-Dioulasso (Car 06h30)',
    itemCategory: 'SAC_VALISE',
    description: 'Sac à dos noir de marque Samsonite contenant des documents professionnels et un chargeur d’ordinateur portable.',
    color: 'Noir / Gris foncé',
    reportedDate: '2026-10-10 16:40',
    status: 'FOUND_IN_AGENCY',
    foundLocation: 'Consigne des objets trouvés, Gare Centrale TSR Gounghin',
    agentNotes: 'Retrouvé sous le siège 14 lors du nettoyage du car. Mis en sécurité sous le scellé N°88.'
  },
  {
    id: 'lost_02',
    reference: 'TSR-OBJ-4403',
    travelerName: 'Alimata Kinda',
    travelerPhone: '+226 78 55 66 77',
    tripInfo: 'Bobo-Dioulasso -> Ouagadougou',
    itemCategory: 'APPAREIL_ELECTRONIQUE',
    description: 'Téléphone Samsung Galaxy A52 avec coque transparente et photo au dos.',
    color: 'Bleu ciel',
    reportedDate: '2026-10-11 09:15',
    status: 'SEARCHING',
    agentNotes: 'Signalé au chef de gare. Chauffeur contacté pour vérification des filets de siège.'
  }
];

export class LostFoundService {
  private static items: Map<string, LostItemReport> = new Map(
    INITIAL_LOST_ITEMS.map(item => [item.reference, { ...item }])
  );

  public static reportLostItem(data: {
    travelerName: string;
    travelerPhone: string;
    ticketNumber?: string;
    tripInfo: string;
    itemCategory: LostItemReport['itemCategory'];
    description: string;
    color: string;
  }): LostItemReport {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reference = `TSR-OBJ-${randomSuffix}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const report: LostItemReport = {
      id: `lost_${Date.now()}`,
      reference,
      travelerName: data.travelerName,
      travelerPhone: data.travelerPhone,
      ticketNumber: data.ticketNumber,
      tripInfo: data.tripInfo,
      itemCategory: data.itemCategory,
      description: data.description,
      color: data.color,
      reportedDate: now,
      status: 'REPORTED',
      agentNotes: 'Déclaration transmise au centre d’exploitation et aux agents de gare du trajet.'
    };

    this.items.set(reference, report);
    return { ...report };
  }

  public static getReportByReference(ref: string): LostItemReport | null {
    const item = this.items.get(ref.trim().toUpperCase());
    return item ? { ...item } : null;
  }

  public static getAllReports(): LostItemReport[] {
    return Array.from(this.items.values()).sort((a, b) => b.reportedDate.localeCompare(a.reportedDate));
  }

  public static updateStatus(
    reference: string,
    status: LostItemStatus,
    location?: string,
    notes?: string
  ): boolean {
    const item = this.items.get(reference.trim().toUpperCase());
    if (!item) return false;
    item.status = status;
    if (location) item.foundLocation = location;
    if (notes) item.agentNotes = notes;
    if (status === 'RESTORED') {
      item.restoredDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
    }
    this.items.set(item.reference, item);
    return true;
  }
}
