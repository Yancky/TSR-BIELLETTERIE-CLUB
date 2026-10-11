/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClaimCategory, ClaimStatus, SupportClaim } from '../types';

export interface FAQItem {
  id: string;
  category: 'RESERVATION' | 'PAIEMENT' | 'BILLET' | 'BAGAGES' | 'REMBOURSEMENT';
  question: string;
  answer: string;
}

export const FAQ_LIST: FAQItem[] = [
  {
    id: 'faq_01',
    category: 'RESERVATION',
    question: 'Combien de temps mes sièges restent-ils bloqués avant paiement ?',
    answer: 'Vos sièges sont verrouillés de façon atomique et exclusive pendant exactement 10 minutes. Un compte à rebours s’affiche à l’écran. Si le paiement n’est pas finalisé avant l’échéance, les sièges sont automatiquement libérés pour les autres voyageurs.'
  },
  {
    id: 'faq_02',
    category: 'PAIEMENT',
    question: 'Quels sont les modes de paiement Mobile Money acceptés ?',
    answer: 'TSR TRANSIT prend en charge Orange Money Burkina Faso (*144#), Moov Money Burkina Faso (*555#) et Wave. Toutes les transactions sont effectuées en Francs CFA (XOF) sans surcoût caché.'
  },
  {
    id: 'faq_03',
    category: 'BILLET',
    question: 'Dois-je obligatoirement imprimer mon billet électronique ?',
    answer: 'Non, vous n’avez pas besoin d’imprimer votre billet. Le QR Code sécurisé affiché sur l’écran de votre téléphone est directement composté et validé par les agents à la porte du car grâce à leurs terminaux de scan.'
  },
  {
    id: 'faq_04',
    category: 'BAGAGES',
    question: 'Quel est le poids de bagage autorisé par passager ?',
    answer: 'Chaque passager a droit gratuitement à un bagage à main en cabine et à un bagage de soute pesant jusqu’à 20 kg. Pour tout bagage supplémentaire ou marchandise volumineuse, un enregistrement au guichet fret / colis est requis à tarif préférentiel.'
  },
  {
    id: 'faq_05',
    category: 'REMBOURSEMENT',
    question: 'Puis-je annuler ou reporter mon voyage après paiement ?',
    answer: 'Toute demande d’annulation ou de report doit être effectuée au moins 2 heures avant l’heure de départ prévue, directement depuis votre espace historique ou au guichet de votre gare de départ. Des frais de gestion de 10% peuvent s’appliquer selon la politique de la compagnie.'
  }
];

export const INITIAL_CLAIMS: SupportClaim[] = [
  {
    id: 'clm_01',
    claimNumber: 'TSR-REC-5510',
    travelerName: 'Aminata Ouédraogo',
    travelerPhone: '+226 70 20 15 15',
    travelerEmail: 'aminata.o@example.com',
    ticketNumber: 'TSR-BF-2026-8819',
    category: 'RETARD_DEPART',
    subject: 'Demande d’information sur retard de 25 min au départ',
    message: 'Le car de 06h30 est parti avec 25 minutes de retard en raison d’une vérification des pneumatiques à la gare de Gounghin. Je souhaiterais confirmation de l’heure estimée d’arrivée à Bobo.',
    priority: 'NORMALE',
    status: 'RESOLVED',
    resolutionNote: 'Réponse transmise par SMS : arrivée effective constatée à 12h18. Un bon de réduction fidélité de 1000 FCFA a été crédité sur votre compte.',
    submittedAt: '2026-10-10 07:10',
    updatedAt: '2026-10-10 13:00'
  }
];

export class SupportClaimService {
  private static claims: Map<string, SupportClaim> = new Map(
    INITIAL_CLAIMS.map(c => [c.claimNumber, { ...c }])
  );

  public static getFAQ(): FAQItem[] {
    return [...FAQ_LIST];
  }

  public static submitClaim(data: {
    travelerName: string;
    travelerPhone: string;
    travelerEmail?: string;
    ticketNumber?: string;
    category: ClaimCategory;
    subject: string;
    message: string;
    priority?: 'NORMALE' | 'HAUTE' | 'URGENTE';
  }): SupportClaim {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const claimNumber = `TSR-REC-${randomSuffix}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const claim: SupportClaim = {
      id: `clm_${Date.now()}`,
      claimNumber,
      travelerName: data.travelerName,
      travelerPhone: data.travelerPhone,
      travelerEmail: data.travelerEmail,
      ticketNumber: data.ticketNumber,
      category: data.category,
      subject: data.subject,
      message: data.message,
      priority: data.priority || 'NORMALE',
      status: 'SUBMITTED',
      submittedAt: now,
      updatedAt: now
    };

    this.claims.set(claimNumber, claim);
    return { ...claim };
  }

  public static getClaimByNumber(claimNumber: string): SupportClaim | null {
    const c = this.claims.get(claimNumber.trim().toUpperCase());
    return c ? { ...c } : null;
  }

  public static getAllClaims(): SupportClaim[] {
    return Array.from(this.claims.values()).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }

  public static updateClaimStatus(claimNumber: string, status: ClaimStatus, resolutionNote?: string): boolean {
    const c = this.claims.get(claimNumber.trim().toUpperCase());
    if (!c) return false;
    c.status = status;
    if (resolutionNote) c.resolutionNote = resolutionNote;
    c.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
    this.claims.set(claimNumber, c);
    return true;
  }
}
