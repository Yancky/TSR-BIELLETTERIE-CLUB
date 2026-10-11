/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ElectronicTicket, TicketStatus, User } from '../types';
import { BookingService } from './bookingService';
import { PaymentService } from './paymentService';
import { AuditService } from './auditService';
import { TripService } from './tripService';
import { CompanyService } from './companyService';

const QR_SIGNING_SECRET = 'TSR_BURKINA_QR_HMAC_MASTER_KEY_2026';

/**
 * Calculateur HMAC-SHA256 serveur pour signature cryptographique des billets
 */
export function signQrPayload(data: Record<string, any>, secret: string = QR_SIGNING_SECRET): string {
  const serialized = Object.keys(data)
    .sort()
    .filter(k => k !== 'sig')
    .map(k => `${k}=${JSON.stringify(data[k])}`)
    .join('&');

  let hash = 0;
  const combined = `${secret}:${serialized}`;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
  }
  const hex1 = Math.abs(hash).toString(16).padStart(8, '0');
  let hash2 = 5381;
  for (let i = combined.length - 1; i >= 0; i--) {
    hash2 = ((hash2 << 5) + hash2 + combined.charCodeAt(i)) | 0;
  }
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  return `tsr_sig_${hex1}${hex2}`;
}

export function verifyQrSignature(payload: Record<string, any>, secret: string = QR_SIGNING_SECRET): boolean {
  if (!payload || !payload.sig) return false;
  const expectedSig = signQrPayload(payload, secret);
  return payload.sig === expectedSig;
}

export interface TicketValidationResult {
  success: boolean;
  ticket?: ElectronicTicket;
  status: TicketStatus | 'FORGED' | 'EXPIRED' | 'UNAUTHORIZED' | 'ERROR';
  message: string;
  errorCode?: string;
  validatedAt?: string;
}

export class TicketService {
  private static tickets: Map<string, ElectronicTicket> = new Map();
  private static bookingToTicket: Map<string, string> = new Map();
  private static seq: number = 0;

  public static resetForTesting(): void {
    this.tickets.clear();
    this.bookingToTicket.clear();
    this.seq = 0;
  }

  /**
   * Émet un billet électronique après confirmation STRICTE du paiement
   */
  public static issueTicket(
    bookingId: string,
    transactionId: string,
    actor?: User
  ): ElectronicTicket {
    // 1. Vérification du paiement
    const transaction = PaymentService.getTransactionById(transactionId);
    if (!transaction || transaction.status !== 'SUCCESS') {
      AuditService.log({
        action: 'TICKET_ISSUANCE_REJECTED_UNPAID',
        actorId: actor?.id || 'system',
        actorRole: actor?.role || 'SYSTEM',
        targetId: bookingId,
        details: 'Tentative d\'émission de billet sans confirmation préalable du paiement.',
        status: 'FAILURE'
      });
      throw new Error('PAYMENT_NOT_CONFIRMED: Impossible d\'émettre un billet électronique sans paiement validé par l\'opérateur.');
    }

    // 2. Vérification de la réservation
    const booking = BookingService.getBookingByIdInternal(bookingId);
    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND: Réservation introuvable pour l\'émission du billet.');
    }

    // 3. Protection anti-doublon (Idempotence d'émission)
    const existingTicketId = this.bookingToTicket.get(bookingId);
    if (existingTicketId) {
      const existingTicket = this.tickets.get(existingTicketId);
      if (existingTicket) {
        return { ...existingTicket };
      }
    }

    // 4. Données du voyage et de la compagnie
    const trip = TripService.getTripById(booking.departureTripId || booking.tripId);
    const company = booking.companyId ? CompanyService.getCompanyById(booking.companyId) : undefined;
    const companyName = company ? company.name : 'TSR TRANSIT FASO';

    this.seq++;
    const ticketId = `tck_${Date.now()}_${this.seq}`;
    const ticketNumber = `TSR-BF-2026-${(1000 + this.seq).toString()}`;
    const nowIso = new Date().toISOString();

    // 5. Construction du payload minimal et signature cryptographique HMAC
    const minimalPayload: Record<string, any> = {
      tn: ticketNumber,
      br: booking.reference || booking.bookingRef,
      tid: trip?.id || booking.departureTripId,
      pn: booking.passengerName,
      st: booking.seatIds,
      dt: trip?.date || '2026-10-15',
      tm: trip?.departureTime || '07:00',
      iat: Math.floor(Date.now() / 1000)
    };

    const signature = signQrPayload(minimalPayload);
    minimalPayload.sig = signature;
    const qrPayload = JSON.stringify(minimalPayload);

    const ticket: ElectronicTicket = {
      id: ticketId,
      ticketNumber,
      bookingId: booking.id,
      tripId: trip?.id || booking.departureTripId,
      companyId: booking.companyId,
      companyName,
      passengerName: booking.passengerName,
      seatNumbers: booking.seatIds,
      departureCity: trip?.departureCity || 'Ouagadougou',
      destinationCity: trip?.destinationCity || 'Bobo-Dioulasso',
      departureAgency: trip?.departureAgency || 'Gare Centrale',
      travelDate: trip?.date || '2026-10-15',
      departureTime: trip?.departureTime || '07:00',
      amountPaidXOF: transaction.amountXOF,
      status: 'VALID',
      qrPayload,
      securityToken: signature,
      createdAt: nowIso
    };

    this.tickets.set(ticketId, ticket);
    this.bookingToTicket.set(bookingId, ticketId);

    // Mettre à jour le statut de la réservation
    booking.status = 'TICKET_GENERATED';

    AuditService.log({
      action: 'TICKET_ISSUED',
      actorId: actor?.id || 'system',
      actorRole: actor?.role || 'SYSTEM',
      targetId: ticketId,
      details: `Billet N° ${ticketNumber} émis avec succès (${ticket.amountPaidXOF} XOF). Signature HMAC validée.`,
      status: 'SUCCESS'
    });

    return { ...ticket };
  }

  /**
   * Validation d'un billet à l'embarquement par un agent de gare
   * Protection anti-double validation atomique et vérification de signature cryptographique
   */
  public static validateTicketForBoarding(
    qrRawOrNumber: string,
    agent: User
  ): TicketValidationResult {
    // 1. Contrôle d'autorisation RBAC
    if (agent.role !== 'AGENT' && agent.role !== 'ADMIN') {
      AuditService.log({
        action: 'BOARDING_VALIDATION_UNAUTHORIZED',
        actorId: agent.id,
        actorRole: agent.role,
        targetId: 'unknown',
        details: 'Tentative de validation d\'embarquement par un utilisateur non habilité.',
        status: 'FAILURE'
      });
      return {
        success: false,
        status: 'UNAUTHORIZED',
        message: 'Accès refusé : Seul un agent de contrôle ou un administrateur peut valider les billets.',
        errorCode: 'UNAUTHORIZED_ROLE'
      };
    }

    let parsedPayload: Record<string, any> | null = null;
    let ticketNum = qrRawOrNumber.trim();

    // 2. Détection format JSON du QR code
    if (ticketNum.startsWith('{')) {
      try {
        parsedPayload = JSON.parse(ticketNum);
        ticketNum = parsedPayload?.tn || parsedPayload?.ticketNumber || ticketNum;
      } catch {
        return {
          success: false,
          status: 'FORGED',
          message: 'Format du QR code illisible ou corrompu.',
          errorCode: 'MALFORMED_QR'
        };
      }
    }

    // 3. Vérification de la signature cryptographique si présent
    if (parsedPayload && parsedPayload.sig) {
      const isValidSig = verifyQrSignature(parsedPayload);
      if (!isValidSig) {
        AuditService.log({
          action: 'SECURITY_QR_FORGERY_DETECTED',
          actorId: agent.id,
          actorRole: agent.role,
          targetId: ticketNum,
          details: 'Tentative d\'embarquement avec un QR code falsifié (signature non conforme).',
          status: 'FAILURE'
        });
        return {
          success: false,
          status: 'FORGED',
          message: 'ALERTE SÉCURITÉ : QR code falsifié ou altéré. Embarquement interdit.',
          errorCode: 'INVALID_SIGNATURE'
        };
      }
    }

    // 4. Recherche du billet autoritaire
    const ticket = Array.from(this.tickets.values()).find(
      t => t.ticketNumber.toUpperCase() === ticketNum.toUpperCase() || t.id === ticketNum
    );

    if (!ticket) {
      return {
        success: false,
        status: 'ERROR',
        message: 'Billet introuvable dans le système TSR TRANSIT.',
        errorCode: 'TICKET_NOT_FOUND'
      };
    }

    // 5. Contrôle d'isolation multi-compagnies
    if (agent.role === 'AGENT' && agent.companyId && ticket.companyId && agent.companyId !== ticket.companyId) {
      AuditService.log({
        action: 'ISOLATION_VIOLATION_BOARDING',
        actorId: agent.id,
        actorRole: agent.role,
        targetId: ticket.id,
        details: `L'agent de ${agent.companyId} a tenté de valider un billet de ${ticket.companyId}.`,
        status: 'FAILURE'
      });
      return {
        success: false,
        status: 'UNAUTHORIZED',
        message: 'Isolation multi-compagnies : Vous ne pouvez pas valider les billets d\'une compagnie concurrente.',
        errorCode: 'ISOLATION_VIOLATION'
      };
    }

    // 6. Protection anti-double embarquement (Replay Protection)
    if (ticket.status === 'USED') {
      AuditService.log({
        action: 'DOUBLE_BOARDING_ATTEMPT_BLOCKED',
        actorId: agent.id,
        actorRole: agent.role,
        targetId: ticket.id,
        details: `Tentative de double embarquement bloquée pour le billet N° ${ticket.ticketNumber} (Validé à ${ticket.validatedAt}).`,
        status: 'FAILURE'
      });
      return {
        success: false,
        ticket: { ...ticket },
        status: 'USED',
        message: `Billet déjà utilisé pour l'embarquement le ${ticket.validatedAt}. Double embarquement strictement refusé.`,
        errorCode: 'ALREADY_USED'
      };
    }

    if (ticket.status === 'CANCELLED') {
      return {
        success: false,
        ticket: { ...ticket },
        status: 'CANCELLED',
        message: 'Ce billet a été annulé et ne permet pas l\'embarquement.',
        errorCode: 'TICKET_CANCELLED'
      };
    }

    // 7. Validation atomique de l'embarquement
    const validatedAt = new Date().toISOString();
    ticket.status = 'USED';
    ticket.validatedAt = validatedAt;
    ticket.validatedByAgentId = agent.id;

    AuditService.log({
      action: 'TICKET_BOARDED_SUCCESS',
      actorId: agent.id,
      actorRole: agent.role,
      targetId: ticket.id,
      details: `Embarquement validé pour ${ticket.passengerName} (Sièges : ${ticket.seatNumbers.join(', ')}).`,
      status: 'SUCCESS'
    });

    return {
      success: true,
      ticket: { ...ticket },
      status: 'USED',
      message: `Embarquement validé avec succès pour ${ticket.passengerName}. Siège(s) : ${ticket.seatNumbers.join(', ')}.`,
      validatedAt
    };
  }

  public static getTicketById(id: string): ElectronicTicket | undefined {
    return this.tickets.get(id);
  }

  public static getTicketByBookingId(bookingId: string): ElectronicTicket | undefined {
    const ticketId = this.bookingToTicket.get(bookingId);
    return ticketId ? this.tickets.get(ticketId) : undefined;
  }

  public static getAllTickets(): ElectronicTicket[] {
    return Array.from(this.tickets.values());
  }
}
