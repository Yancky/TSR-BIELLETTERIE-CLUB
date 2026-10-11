/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BookingOrder, PaymentMethod, PaymentStatus, PaymentTransaction, User } from '../types';
import { BookingService } from './bookingService';
import { SeatHoldService } from './seatHoldService';
import { PaymentGatewayRegistry, computeHmacSha256 } from './paymentGateways';
import { AuditService } from './auditService';
import { TripService } from './tripService';

export interface InitiatePaymentParams {
  bookingId: string;
  paymentMethod: PaymentMethod;
  payerPhone: string;
  idempotencyKey?: string;
  clientDeclaredAmount?: number; // Détecte et rejette les falsifications côté client
  user: User;
}

export interface PaymentInitiationResult {
  success: boolean;
  transaction: PaymentTransaction;
  checkoutDetails?: {
    ussdPrompt?: string;
    checkoutUrl?: string;
    qrData?: string;
    requiresOtp?: boolean;
    mode: 'SANDBOX_SIMULATED' | 'PRODUCTION_API';
  };
  error?: string;
  errorCode?: string;
}

/**
 * Service autoritaire de gestion des paiements Mobile Money
 * Garantit le calcul exclusif côté serveur, la protection anti-doubles débits,
 * la vérification des verrous de sièges et l'idempotence financière.
 */
export class PaymentService {
  private static transactions: Map<string, PaymentTransaction> = new Map();
  private static idempotencyRegistry: Map<string, { transactionId: string; hash: string }> = new Map();
  private static processedWebhookEvents: Set<string> = new Set();
  private static seq: number = 0;

  public static resetForTesting(): void {
    this.transactions.clear();
    this.idempotencyRegistry.clear();
    this.processedWebhookEvents.clear();
    this.seq = 0;
  }

  /**
   * Initialise une demande de paiement de manière sécurisée et autoritaire
   */
  public static async initiatePayment(params: InitiatePaymentParams): Promise<PaymentInitiationResult> {
    const { bookingId, paymentMethod, payerPhone, idempotencyKey, clientDeclaredAmount, user } = params;

    // 1. Récupération autoritaire de la commande
    let booking: BookingOrder | null = null;
    try {
      booking = BookingService.getBookingById(bookingId, user);
    } catch (err: any) {
      if (err.message && err.message.includes('PRIVACY_VIOLATION')) {
        return {
          success: false,
          transaction: {} as any,
          error: err.message,
          errorCode: 'PRIVACY_VIOLATION'
        };
      }
      return {
        success: false,
        transaction: {} as any,
        error: err.message || 'Erreur d\'accès à la réservation.',
        errorCode: 'UNAUTHORIZED'
      };
    }

    if (!booking) {
      return {
        success: false,
        transaction: {} as any,
        error: 'Réservation introuvable ou accès refusé.',
        errorCode: 'BOOKING_NOT_FOUND'
      };
    }

    // 2. Contrôle d'accès : seul le voyageur titulaire ou un agent peut initier le paiement
    if (user.role === 'TRAVELER' && booking.travelerId !== user.id) {
      AuditService.log({
        action: 'PRIVACY_VIOLATION_ATTEMPT',
        actorId: user.id,
        actorRole: user.role,
        targetId: booking.id,
        details: 'Tentative de paiement d\'une réservation appartenant à un tiers.',
        status: 'FAILURE'
      });
      return {
        success: false,
        transaction: {} as any,
        error: 'Accès non autorisé : Vous ne pouvez pas payer la réservation d\'un tiers.',
        errorCode: 'PRIVACY_VIOLATION'
      };
    }

    // 3. Vérification de l'état du verrou de siège (SeatHold)
    if (booking.seatHoldId) {
      const hold = SeatHoldService.getHoldById(booking.seatHoldId);
      if (!hold) {
        return {
          success: false,
          transaction: {} as any,
          error: 'Le verrou de siège est introuvable.',
          errorCode: 'HOLD_NOT_FOUND'
        };
      }

      const isExpired = Date.now() > new Date(hold.expiresAt).getTime() || hold.status === 'EXPIRED';
      if (isExpired) {
        return {
          success: false,
          transaction: {} as any,
          error: 'Le verrou de 10 minutes sur vos sièges a expiré. Veuillez sélectionner vos places à nouveau.',
          errorCode: 'HOLD_EXPIRED'
        };
      }
    }

    // 4. Recalcul strictement serveur du montant en XOF (Règle d'or : le client ne décide jamais)
    const authoritativeAmount = booking.totalPriceXof || booking.totalAmountXOF;
    if (authoritativeAmount <= 0) {
      return {
        success: false,
        transaction: {} as any,
        error: 'Montant de commande invalide.',
        errorCode: 'INVALID_AMOUNT'
      };
    }

    // Détection de tentative de falsification de prix côté client
    if (clientDeclaredAmount !== undefined && clientDeclaredAmount !== authoritativeAmount) {
      AuditService.log({
        action: 'SECURITY_PRICE_TAMPERING_ATTEMPT',
        actorId: user.id,
        actorRole: user.role,
        targetId: booking.id,
        details: `Tentative de falsification de tarif : déclaré ${clientDeclaredAmount} XOF vs réel ${authoritativeAmount} XOF.`,
        status: 'FAILURE'
      });
      return {
        success: false,
        transaction: {} as any,
        error: 'Anomalie de sécurité : Le montant déclaré ne correspond pas au tarif officiel du trajet.',
        errorCode: 'PRICE_TAMPERING_DETECTED'
      };
    }

    // 5. Gestion de l'idempotence financière
    if (idempotencyKey) {
      const existingIdemp = this.idempotencyRegistry.get(idempotencyKey);
      if (existingIdemp) {
        const payloadHash = `${bookingId}:${paymentMethod}:${authoritativeAmount}:${payerPhone}`;
        if (existingIdemp.hash !== payloadHash) {
          return {
            success: false,
            transaction: {} as any,
            error: 'Conflit de paramètres sur la clé d\'idempotence fournie.',
            errorCode: 'IDEMPOTENCY_CONFLICT'
          };
        }
        const existingTx = this.transactions.get(existingIdemp.transactionId);
        if (existingTx) {
          return {
            success: true,
            transaction: existingTx,
            checkoutDetails: {
              mode: 'SANDBOX_SIMULATED',
              ussdPrompt: 'Transaction déjà initiée'
            }
          };
        }
      }
    }

    // 6. Appel de la passerelle correspondante
    const gateway = PaymentGatewayRegistry.getGateway(paymentMethod);
    const initResult = await gateway.initiate({
      bookingId: booking.id,
      bookingRef: booking.reference || booking.bookingRef,
      amountXOF: authoritativeAmount,
      payerPhone,
      customerName: booking.passengerName,
      idempotencyKey
    });

    if (!initResult.success) {
      return {
        success: false,
        transaction: {} as any,
        error: initResult.message,
        errorCode: 'GATEWAY_ERROR'
      };
    }

    // 7. Enregistrement de la transaction
    this.seq++;
    const txId = `pay_${Date.now()}_${this.seq}`;
    const transaction: PaymentTransaction = {
      id: txId,
      bookingId: booking.id,
      companyId: booking.companyId,
      externalRef: initResult.operatorTransactionId,
      amountXOF: authoritativeAmount,
      currency: 'XOF',
      paymentMethod,
      payerPhone,
      status: 'PENDING',
      initiatedAt: new Date().toISOString()
    };

    this.transactions.set(txId, transaction);

    if (idempotencyKey) {
      this.idempotencyRegistry.set(idempotencyKey, {
        transactionId: txId,
        hash: `${bookingId}:${paymentMethod}:${authoritativeAmount}:${payerPhone}`
      });
    }

    AuditService.log({
      action: 'PAYMENT_INITIATED',
      actorId: user.id,
      actorRole: user.role,
      targetId: txId,
      details: `Paiement ${authoritativeAmount} XOF initié via ${gateway.name} (Réf : ${transaction.externalRef}).`,
      status: 'SUCCESS'
    });

    return {
      success: true,
      transaction,
      checkoutDetails: {
        ussdPrompt: initResult.ussdPrompt,
        checkoutUrl: initResult.checkoutUrl,
        qrData: initResult.qrData,
        requiresOtp: initResult.requiresOtp,
        mode: initResult.mode
      }
    };
  }

  /**
   * Confirmation sécurisée du paiement après retour de l'opérateur ou du client
   */
  public static async confirmPayment(
    transactionId: string,
    operatorRef?: string,
    user?: User
  ): Promise<{ success: boolean; transaction: PaymentTransaction; error?: string }> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      return { success: false, transaction: {} as any, error: 'Transaction introuvable.' };
    }

    if (transaction.status === 'SUCCESS') {
      return { success: true, transaction }; // Déjà confirmée
    }

    if (transaction.status === 'FAILED' || transaction.status === 'CANCELLED') {
      return { success: false, transaction, error: `Transaction dans l'état non validable : ${transaction.status}` };
    }

    // Vérification de la passerelle
    const gateway = PaymentGatewayRegistry.getGateway(transaction.paymentMethod);
    const verification = await gateway.verify(operatorRef || transaction.externalRef);

    if (!verification.success || verification.status !== 'SUCCESS') {
      transaction.status = 'FAILED';
      transaction.failureReason = verification.errorMessage || 'Paiement non confirmé par l\'opérateur.';
      return { success: false, transaction, error: transaction.failureReason };
    }

    // Récupération de la réservation
    const booking = BookingService.getBookingByIdInternal(transaction.bookingId);
    if (booking) {
      // Vérification que le verrou de siège n'était pas expiré au moment de la confirmation
      if (booking.seatHoldId) {
        const hold = SeatHoldService.getHoldById(booking.seatHoldId);
        if (hold && (hold.status === 'EXPIRED' || Date.now() > new Date(hold.expiresAt).getTime())) {
          transaction.status = 'EXPIRED';
          transaction.failureReason = 'Paiement reçu après expiration du verrou de siège (Remboursement requis).';
          AuditService.log({
            action: 'PAYMENT_EXPIRED_HOLD_REJECTED',
            actorId: user?.id || 'system',
            actorRole: user?.role || 'SYSTEM',
            targetId: transaction.id,
            details: 'Paiement opérateur reçu mais verrou de 10 min expiré. Mise en file de remboursement.',
            status: 'WARNING'
          });
          return {
            success: false,
            transaction,
            error: 'Le verrou de siège a expiré pendant votre paiement. La transaction est marquée pour remboursement.'
          };
        }
      }

      booking.status = 'CONFIRMED';
      booking.paymentRef = transaction.externalRef;
      booking.updatedAt = new Date().toISOString();
    }

    transaction.status = 'SUCCESS';
    transaction.confirmedAt = new Date().toISOString();

    AuditService.log({
      action: 'PAYMENT_CONFIRMED',
      actorId: user?.id || 'system',
      actorRole: user?.role || 'SYSTEM',
      targetId: transaction.id,
      details: `Paiement ${transaction.amountXOF} XOF confirmé avec succès (${transaction.paymentMethod}).`,
      status: 'SUCCESS'
    });

    return { success: true, transaction };
  }

  /**
   * Traitement d'une notification Webhook reçue avec signature HMAC
   */
  public static async handleWebhook(params: {
    method: PaymentMethod;
    eventId: string;
    rawBody: string;
    signature: string;
    payload: {
      operatorTransactionId: string;
      status: 'SUCCESS' | 'FAILED' | 'CANCELLED';
      amountXOF: number;
    };
  }): Promise<{ accepted: boolean; duplicate: boolean; message: string }> {
    const { method, eventId, rawBody, signature, payload } = params;

    // 1. Validation de la signature cryptographique
    const gateway = PaymentGatewayRegistry.getGateway(method);
    const isValidSignature = gateway.validateWebhookSignature(rawBody, signature);
    if (!isValidSignature) {
      AuditService.log({
        action: 'WEBHOOK_SIGNATURE_INVALID',
        actorId: 'system',
        actorRole: 'SYSTEM',
        targetId: eventId,
        details: `Signature webhook non valide pour ${method}. Rejet immédiat.`,
        status: 'FAILURE'
      });
      return { accepted: false, duplicate: false, message: 'Signature de webhook invalide.' };
    }

    // 2. Protection contre le rejeu de notification (Replay attacks)
    if (this.processedWebhookEvents.has(eventId)) {
      return { accepted: true, duplicate: true, message: 'Événement webhook déjà traité (Accusé de réception idempotent).' };
    }

    this.processedWebhookEvents.add(eventId);

    // 3. Recherche de la transaction correspondante
    const tx = Array.from(this.transactions.values()).find(
      t => t.externalRef === payload.operatorTransactionId
    );

    if (tx) {
      if (payload.status === 'SUCCESS') {
        await this.confirmPayment(tx.id, payload.operatorTransactionId);
      } else {
        tx.status = payload.status;
        tx.failureReason = 'Statut webhook opérateur négatif.';
      }
    }

    return { accepted: true, duplicate: false, message: 'Webhook traité avec succès.' };
  }

  public static getTransactionById(id: string): PaymentTransaction | undefined {
    return this.transactions.get(id);
  }

  /**
   * Récupère les transactions filtrées selon le rôle RBAC et la compagnie (isolation stricte)
   */
  public static getTransactionsForActor(actor: User): PaymentTransaction[] {
    const all = Array.from(this.transactions.values());

    if (actor.role === 'ADMIN') {
      return all;
    }

    if (actor.role === 'COMPANY_MANAGER' || actor.role === 'AGENT') {
      if (!actor.companyId) return [];
      return all.filter(t => t.companyId === actor.companyId);
    }

    // Voyageur : uniquement ses réservations
    return all.filter(t => {
      const b = BookingService.getBookingByIdInternal(t.bookingId);
      return b && b.travelerId === actor.id;
    });
  }
}
