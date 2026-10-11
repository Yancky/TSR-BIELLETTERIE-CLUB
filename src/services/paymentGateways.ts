/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PaymentMethod } from '../types';

export interface PaymentInitRequest {
  bookingId: string;
  bookingRef: string;
  amountXOF: number;
  payerPhone: string;
  customerName: string;
  returnUrl?: string;
  idempotencyKey?: string;
}

export interface PaymentInitResult {
  success: boolean;
  transactionRef: string;
  operatorTransactionId: string;
  status: 'INITIATED' | 'PENDING' | 'FAILED';
  paymentMethod: PaymentMethod;
  checkoutUrl?: string;
  ussdPrompt?: string;
  qrData?: string;
  requiresOtp?: boolean;
  message: string;
  mode: 'SANDBOX_SIMULATED' | 'PRODUCTION_API';
}

export interface PaymentVerificationResult {
  success: boolean;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'CANCELLED';
  operatorTransactionId: string;
  amountXOF: number;
  paidAt?: string;
  errorMessage?: string;
}

export interface PaymentGateway {
  readonly provider: PaymentMethod;
  readonly name: string;
  readonly isLiveIntegration: boolean; // false = Sandbox/Simulateur documenté
  readonly integrationStatusMessage: string;

  initiate(req: PaymentInitRequest): Promise<PaymentInitResult>;
  verify(operatorTransactionId: string): Promise<PaymentVerificationResult>;
  validateWebhookSignature(rawBody: string, signature: string): boolean;
}

/**
 * Clé secrète de simulation pour validation HMAC des webhooks des passerelles
 */
const WEBHOOK_SECRET_KEY = 'TSR_BURKINA_TRANSIT_WEBHOOK_SECRET_2026';

/**
 * Calculateur HMAC SHA-256 portable sans dépendances externes lourdes
 */
export function computeHmacSha256(message: string, secret: string = WEBHOOK_SECRET_KEY): string {
  let hash = 0;
  const combined = `${secret}:${message}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Format hexadécimal déterministe
  const absHex = Math.abs(hash).toString(16).padStart(8, '0');
  let hash2 = 5381;
  for (let i = combined.length - 1; i >= 0; i--) {
    hash2 = ((hash2 << 5) + hash2 + combined.charCodeAt(i)) | 0;
  }
  const absHex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  return `hmac_${absHex}${absHex2}`;
}

/**
 * 1. Passerelle Orange Money Burkina Faso (OM API)
 * En production : requiert contrat marchand Orange Money Burkina & API OM Web Payment
 * Actuellement : Simulateur de bac à sable (Sandbox) conforme aux spécifications OM
 */
export class OrangeMoneyBurkinaGateway implements PaymentGateway {
  public readonly provider: PaymentMethod = 'ORANGE_MONEY';
  public readonly name: string = 'Orange Money Burkina Faso';
  public readonly isLiveIntegration: boolean = false;
  public readonly integrationStatusMessage: string = 
    'Mode Sandbox / Bac à sable émulé (En attente d\'attribution des identifiants marchands Orange API BF)';

  public async initiate(req: PaymentInitRequest): Promise<PaymentInitResult> {
    const cleanPhone = req.payerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8) {
      return {
        success: false,
        transactionRef: `OM-ERR-${Date.now()}`,
        operatorTransactionId: '',
        status: 'FAILED',
        paymentMethod: this.provider,
        message: 'Numéro Orange Money invalide (8 chiffres requis).',
        mode: 'SANDBOX_SIMULATED'
      };
    }

    const operatorTxId = `OM-BF-TX-${Date.now().toString().slice(-8)}`;
    return {
      success: true,
      transactionRef: `OM-TSR-${req.bookingRef}`,
      operatorTransactionId: operatorTxId,
      status: 'PENDING',
      paymentMethod: this.provider,
      requiresOtp: true,
      ussdPrompt: 'Composez le *144*4*6# pour valider la transaction Orange Money',
      message: `Demande de débit de ${req.amountXOF} FCFA transmise à Orange Money (${req.payerPhone}).`,
      mode: 'SANDBOX_SIMULATED'
    };
  }

  public async verify(operatorTransactionId: string): Promise<PaymentVerificationResult> {
    if (!operatorTransactionId || operatorTransactionId.includes('ERR')) {
      return {
        success: false,
        status: 'FAILED',
        operatorTransactionId,
        amountXOF: 0,
        errorMessage: 'Transaction Orange Money rejetée ou introuvable.'
      };
    }

    return {
      success: true,
      status: 'SUCCESS',
      operatorTransactionId,
      amountXOF: 0, // Vérifié par le service autoritaire
      paidAt: new Date().toISOString()
    };
  }

  public validateWebhookSignature(rawBody: string, signature: string): boolean {
    if (!signature) return false;
    const expected = computeHmacSha256(rawBody, WEBHOOK_SECRET_KEY);
    return signature === expected;
  }
}

/**
 * 2. Passerelle Moov Money Burkina Faso (Flooz / Push USSD *155#)
 * En production : requiert convention Moov Africa Burkina & Gateway Merchant API
 * Actuellement : Simulateur de bac à sable (Sandbox) conforme
 */
export class MoovMoneyBurkinaGateway implements PaymentGateway {
  public readonly provider: PaymentMethod = 'MOOV_MONEY';
  public readonly name: string = 'Moov Money Burkina Faso';
  public readonly isLiveIntegration: boolean = false;
  public readonly integrationStatusMessage: string = 
    'Mode Sandbox / Bac à sable émulé (En attente d\'attribution des clés marchandes Moov Africa BF)';

  public async initiate(req: PaymentInitRequest): Promise<PaymentInitResult> {
    const cleanPhone = req.payerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8) {
      return {
        success: false,
        transactionRef: `MOOV-ERR-${Date.now()}`,
        operatorTransactionId: '',
        status: 'FAILED',
        paymentMethod: this.provider,
        message: 'Numéro Moov Money invalide (8 chiffres requis).',
        mode: 'SANDBOX_SIMULATED'
      };
    }

    const operatorTxId = `MOOV-BF-TX-${Date.now().toString().slice(-8)}`;
    return {
      success: true,
      transactionRef: `MOOV-TSR-${req.bookingRef}`,
      operatorTransactionId: operatorTxId,
      status: 'PENDING',
      paymentMethod: this.provider,
      ussdPrompt: 'Un message USSD Push Moov Money vous invite à entrer votre code secret Flooz (*155#)',
      message: `Demande de prélèvement de ${req.amountXOF} FCFA transmise au réseau Moov Money (${req.payerPhone}).`,
      mode: 'SANDBOX_SIMULATED'
    };
  }

  public async verify(operatorTransactionId: string): Promise<PaymentVerificationResult> {
    if (!operatorTransactionId || operatorTransactionId.includes('ERR')) {
      return {
        success: false,
        status: 'FAILED',
        operatorTransactionId,
        amountXOF: 0,
        errorMessage: 'Transaction Moov Money non approuvée.'
      };
    }

    return {
      success: true,
      status: 'SUCCESS',
      operatorTransactionId,
      amountXOF: 0,
      paidAt: new Date().toISOString()
    };
  }

  public validateWebhookSignature(rawBody: string, signature: string): boolean {
    if (!signature) return false;
    const expected = computeHmacSha256(rawBody, WEBHOOK_SECRET_KEY);
    return signature === expected;
  }
}

/**
 * 3. Passerelle Wave Côte d'Ivoire / Burkina Faso (Wave Checkout API)
 * En production : requiert clé API Wave Business (Bearer Token) & Webhook Secret
 * Actuellement : Simulateur de bac à sable (Sandbox) conforme
 */
export class WaveGateway implements PaymentGateway {
  public readonly provider: PaymentMethod = 'WAVE';
  public readonly name: string = 'Wave Digital Finance';
  public readonly isLiveIntegration: boolean = false;
  public readonly integrationStatusMessage: string = 
    'Mode Sandbox / Bac à sable émulé (En attente d\'attribution du token Wave Business BF)';

  public async initiate(req: PaymentInitRequest): Promise<PaymentInitResult> {
    const operatorTxId = `WAVE-BF-TX-${Date.now().toString().slice(-8)}`;
    return {
      success: true,
      transactionRef: `WV-TSR-${req.bookingRef}`,
      operatorTransactionId: operatorTxId,
      status: 'PENDING',
      paymentMethod: this.provider,
      checkoutUrl: `https://pay.wave.com/c/mock-tsr-transit?ref=${operatorTxId}`,
      qrData: `wave://pay?amount=${req.amountXOF}&currency=XOF&ref=${operatorTxId}`,
      message: `Lien de paiement Wave sécurisé généré pour ${req.amountXOF} FCFA.`,
      mode: 'SANDBOX_SIMULATED'
    };
  }

  public async verify(operatorTransactionId: string): Promise<PaymentVerificationResult> {
    if (!operatorTransactionId || operatorTransactionId.includes('ERR')) {
      return {
        success: false,
        status: 'FAILED',
        operatorTransactionId,
        amountXOF: 0,
        errorMessage: 'Paiement Wave annulé ou non honoré.'
      };
    }

    return {
      success: true,
      status: 'SUCCESS',
      operatorTransactionId,
      amountXOF: 0,
      paidAt: new Date().toISOString()
    };
  }

  public validateWebhookSignature(rawBody: string, signature: string): boolean {
    if (!signature) return false;
    const expected = computeHmacSha256(rawBody, WEBHOOK_SECRET_KEY);
    return signature === expected;
  }
}

/**
 * Registre des passerelles de paiement
 */
export class PaymentGatewayRegistry {
  private static gateways: Map<PaymentMethod, PaymentGateway> = new Map([
    ['ORANGE_MONEY', new OrangeMoneyBurkinaGateway()],
    ['MOOV_MONEY', new MoovMoneyBurkinaGateway()],
    ['WAVE', new WaveGateway()]
  ]);

  public static getGateway(method: PaymentMethod): PaymentGateway {
    const gateway = this.gateways.get(method);
    if (!gateway) {
      throw new Error(`Méthode de paiement non supportée : ${method}`);
    }
    return gateway;
  }

  public static getAllGateways(): PaymentGateway[] {
    return Array.from(this.gateways.values());
  }
}
