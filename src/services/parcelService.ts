/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ParcelCategory, ParcelShipment, ParcelStatus } from '../types';
import { AuditService } from './auditService';

export const INITIAL_PARCELS: ParcelShipment[] = [
  {
    id: 'pcl_01',
    trackingNumber: 'TSR-COL-2026-8812',
    companyId: 'comp_tsr_01',
    companyName: 'TSR TRANSIT BURKINA',
    originAgencyId: 'ag_tsr_ouaga_gounghin',
    originAgencyName: 'Gare Centrale TSR Gounghin (Ouaga)',
    destinationAgencyId: 'ag_tsr_bobo_accart',
    destinationAgencyName: 'Gare Principale TSR Accart-Ville (Bobo)',
    senderName: 'Ibrahim Sawadogo',
    senderPhone: '+226 70 22 33 44',
    recipientName: 'Mariam Traoré',
    recipientPhone: '+226 76 11 22 33',
    category: 'CARTON_MOYEN',
    weightKg: 8.5,
    declaredValueXOF: 50000,
    shippingFeeXOF: 4500,
    status: 'IN_TRANSIT',
    pickupOtpCode: '7412',
    createdAt: '2026-10-11 07:15',
    updatedAt: '2026-10-11 08:30',
    history: [
      {
        status: 'REGISTERED',
        timestamp: '2026-10-11 07:15',
        location: 'Gare Centrale TSR Gounghin',
        note: 'Colis pesé, étiqueté et encaissé au guichet'
      },
      {
        status: 'LOADED',
        timestamp: '2026-10-11 08:00',
        location: 'Gare Centrale TSR Gounghin',
        note: 'Chargé dans le coffre du car départ 08h30'
      },
      {
        status: 'IN_TRANSIT',
        timestamp: '2026-10-11 08:30',
        location: 'En route sur la RN1 (Ouaga -> Bobo)',
        note: 'Acheminement en cours'
      }
    ]
  },
  {
    id: 'pcl_02',
    trackingNumber: 'TSR-COL-2026-6401',
    companyId: 'comp_tsr_01',
    companyName: 'TSR TRANSIT BURKINA',
    originAgencyId: 'ag_tsr_bobo_accart',
    originAgencyName: 'Gare Principale TSR Accart-Ville (Bobo)',
    destinationAgencyId: 'ag_tsr_ouaga_gounghin',
    destinationAgencyName: 'Gare Centrale TSR Gounghin (Ouaga)',
    senderName: 'Fatimata Sanogo',
    senderPhone: '+226 78 44 55 66',
    recipientName: 'Abdoulaye Kaboré',
    recipientPhone: '+226 70 99 88 77',
    category: 'PAQUET_PETIT',
    weightKg: 2.0,
    declaredValueXOF: 25000,
    shippingFeeXOF: 2500,
    status: 'ARRIVED_AT_AGENCY',
    pickupOtpCode: '3190',
    createdAt: '2026-10-10 14:00',
    updatedAt: '2026-10-11 06:45',
    history: [
      {
        status: 'REGISTERED',
        timestamp: '2026-10-10 14:00',
        location: 'Gare Principale TSR Accart-Ville'
      },
      {
        status: 'LOADED',
        timestamp: '2026-10-10 16:30',
        location: 'Gare Principale TSR Accart-Ville'
      },
      {
        status: 'ARRIVED_AT_AGENCY',
        timestamp: '2026-10-11 06:45',
        location: 'Gare Centrale TSR Gounghin',
        note: 'Déchargé et prêt pour retrait. SMS envoyé au destinataire.'
      }
    ]
  }
];

export class ParcelService {
  private static parcels: Map<string, ParcelShipment> = new Map(
    INITIAL_PARCELS.map(p => [p.trackingNumber, { ...p }])
  );

  /**
   * Calcul autoritaire du tarif d'expédition en Francs CFA
   */
  public static calculateShippingFee(params: {
    category: ParcelCategory;
    weightKg: number;
    declaredValueXOF: number;
  }): number {
    let basePrice = 1500;
    if (params.category === 'ENVELOPPE') basePrice = 1000;
    else if (params.category === 'PAQUET_PETIT') basePrice = 2000;
    else if (params.category === 'CARTON_MOYEN') basePrice = 3500;
    else if (params.category === 'COLIS_LOURD') basePrice = 6000;
    else if (params.category === 'FRET_SPECIAL') basePrice = 10000;

    // Frais au kilo au-delà de 2kg
    const extraKg = Math.max(0, params.weightKg - 2);
    const weightFee = Math.round(extraKg * 300);

    // Assurance ad valorem (1% de la valeur déclarée au-delà de 20 000 FCFA)
    const insuranceFee = params.declaredValueXOF > 20000
      ? Math.round((params.declaredValueXOF - 20000) * 0.01)
      : 0;

    return basePrice + weightFee + insuranceFee;
  }

  /**
   * Enregistrement sécurisé d'un colis
   */
  public static registerParcel(data: {
    companyId: string;
    companyName: string;
    originAgencyId: string;
    originAgencyName: string;
    destinationAgencyId: string;
    destinationAgencyName: string;
    senderName: string;
    senderPhone: string;
    recipientName: string;
    recipientPhone: string;
    category: ParcelCategory;
    weightKg: number;
    declaredValueXOF: number;
  }): ParcelShipment {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const trackingNumber = `TSR-COL-${new Date().getFullYear()}-${randomSuffix}`;
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const fee = this.calculateShippingFee({
      category: data.category,
      weightKg: data.weightKg,
      declaredValueXOF: data.declaredValueXOF
    });

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const parcel: ParcelShipment = {
      id: `pcl_${Date.now()}`,
      trackingNumber,
      companyId: data.companyId,
      companyName: data.companyName,
      originAgencyId: data.originAgencyId,
      originAgencyName: data.originAgencyName,
      destinationAgencyId: data.destinationAgencyId,
      destinationAgencyName: data.destinationAgencyName,
      senderName: data.senderName,
      senderPhone: data.senderPhone,
      recipientName: data.recipientName,
      recipientPhone: data.recipientPhone,
      category: data.category,
      weightKg: data.weightKg,
      declaredValueXOF: data.declaredValueXOF,
      shippingFeeXOF: fee,
      status: 'REGISTERED',
      pickupOtpCode: otpCode,
      otpExpiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      failedOtpAttempts: 0,
      isLocked: false,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          status: 'REGISTERED',
          timestamp: now,
          location: data.originAgencyName,
          note: 'Colis enregistré et étiqueté au guichet fret'
        }
      ]
    };

    this.parcels.set(trackingNumber, parcel);
    return { ...parcel };
  }

  /**
   * Consultation du colis par numéro de suivi
   */
  public static getParcelByTracking(trackingNumber: string): ParcelShipment | null {
    const p = this.parcels.get(trackingNumber.trim().toUpperCase());
    return p ? { ...p } : null;
  }

  /**
   * Liste de tous les colis
   */
  public static getAllParcels(): ParcelShipment[] {
    return Array.from(this.parcels.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Mise à jour de statut par un agent de gare avec contrôles de sécurité OTP stricts
   */
  public static updateParcelStatus(params: {
    trackingNumber: string;
    newStatus: ParcelStatus;
    location: string;
    note?: string;
    otpCode?: string; // Requis pour 'DELIVERED'
  }): { success: boolean; message: string; parcel?: ParcelShipment } {
    const parcel = this.parcels.get(params.trackingNumber.trim().toUpperCase());
    if (!parcel) {
      return { success: false, message: 'Colis introuvable avec ce numéro de suivi.' };
    }

    // 1. Contrôle anti-bruteforce : colis verrouillé
    if (parcel.isLocked) {
      return {
        success: false,
        message: 'COLIS_VERROUILLE: Colis verrouillé suite à 3 tentatives OTP infructueuses. Présentation en agence requise.'
      };
    }

    // 2. Contrôle de date d'expiration de l'OTP
    if (parcel.otpExpiresAt && Date.now() > new Date(parcel.otpExpiresAt).getTime()) {
      return {
        success: false,
        message: 'OTP_EXPIRE: Le code secret de retrait a expiré. Veuillez contacter le guichet fret pour régularisation.'
      };
    }

    // 3. Validation sécurisée du code OTP pour la livraison
    if (params.newStatus === 'DELIVERED') {
      if (!params.otpCode || params.otpCode.trim() !== parcel.pickupOtpCode) {
        const attempts = (parcel.failedOtpAttempts || 0) + 1;
        parcel.failedOtpAttempts = attempts;

        if (attempts >= 3) {
          parcel.isLocked = true;
          AuditService.log({
            actorId: 'agent_quai',
            actorRole: 'AGENT',
            action: 'SECURITY_QR_FORGERY_DETECTED',
            resourceType: 'SYSTEM',
            targetId: parcel.trackingNumber,
            result: 'FAILURE',
            details: `Alerte Brute-Force OTP : 3 tentatives échouées sur le colis ${parcel.trackingNumber}. Verrouillage de sécurité activé.`
          });
          return {
            success: false,
            message: 'ALERTE_SECURITE: 3 tentatives erronées. Le colis est désormais verrouillé contre les essais successifs.'
          };
        }

        return {
          success: false,
          message: `Code secret de retrait (OTP) erroné. Tentative ${attempts}/3 avant verrouillage de sécurité.`
        };
      }

      // Code correct : réinitialisation du compteur d'erreurs
      parcel.failedOtpAttempts = 0;
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    parcel.status = params.newStatus;
    parcel.updatedAt = now;
    parcel.history.push({
      status: params.newStatus,
      timestamp: now,
      location: params.location,
      note: params.note || `Passage au statut ${params.newStatus}`
    });

    this.parcels.set(parcel.trackingNumber, parcel);
    return { success: true, message: `Statut du colis mis à jour : ${params.newStatus}`, parcel: { ...parcel } };
  }
}
