/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, doc, setDoc, query, where, onSnapshot 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import { ElectronicTicket, ParcelShipment, SupportClaim } from '../types/index.ts';
import { appStore } from './store.ts';

export class FirebaseSyncService {
  private static isInitialized = false;

  /**
   * Initialize real-time synchronization with Firestore
   */
  public static init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Listen to Firebase auth state changes
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.syncUserTickets(user.uid);
      }
    });
  }

  /**
   * Listen to user's tickets in Firestore and sync with local store
   */
  public static syncUserTickets(userId: string) {
    const path = 'bookings';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      onSnapshot(q, (snapshot) => {
        const firestoreTickets: ElectronicTicket[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          firestoreTickets.push({
            id: data.id,
            ticketNumber: data.ticketNumber || data.id,
            bookingId: data.bookingId || data.id,
            tripId: data.tripId || '',
            companyName: data.companyName || 'TSR TRANSIT',
            passengerName: data.passengerName || '',
            seatNumbers: data.seatNumbers || [data.seatNumber || 1],
            departureCity: data.departureCity || '',
            destinationCity: data.arrivalCity || data.destinationCity || '',
            departureAgency: data.departureAgency || 'Gare Centrale',
            travelDate: data.travelDate || '',
            departureTime: data.departureTime || '',
            amountPaidXOF: data.amountPaid || data.amountPaidXOF || 0,
            status: data.status || 'VALID',
            qrPayload: data.qrCodeData || data.qrPayload || '',
            securityToken: data.securityToken || '',
            createdAt: data.createdAt || new Date().toISOString()
          });
        });

        if (firestoreTickets.length > 0) {
          const currentTickets = appStore.getState().tickets;
          const mergedMap = new Map<string, ElectronicTicket>();
          currentTickets.forEach((t) => mergedMap.set(t.id, t));
          firestoreTickets.forEach((t) => mergedMap.set(t.id, t));
          
          appStore.getState().tickets = Array.from(mergedMap.values());
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      });
    } catch (error) {
      console.warn('Firestore syncUserTickets offline/unavailable:', error);
    }
  }

  /**
   * Save an electronic ticket to Firestore
   */
  public static async persistTicket(ticket: ElectronicTicket, phone?: string): Promise<void> {
    const path = 'bookings';
    try {
      await setDoc(doc(db, path, ticket.id), {
        id: ticket.id,
        userId: auth.currentUser?.uid || 'guest-traveler',
        ticketNumber: ticket.ticketNumber,
        bookingId: ticket.bookingId,
        tripId: ticket.tripId,
        companyName: ticket.companyName,
        passengerName: ticket.passengerName,
        passengerPhone: phone || '+226 70 00 00 00',
        seatNumbers: ticket.seatNumbers,
        seatNumber: ticket.seatNumbers[0] || 1,
        departureCity: ticket.departureCity,
        arrivalCity: ticket.destinationCity,
        departureAgency: ticket.departureAgency,
        travelDate: ticket.travelDate,
        departureTime: ticket.departureTime,
        amountPaid: ticket.amountPaidXOF,
        amountPaidXOF: ticket.amountPaidXOF,
        paymentStatus: 'CONFIRMED',
        status: ticket.status,
        qrCodeData: ticket.qrPayload,
        securityToken: ticket.securityToken,
        createdAt: new Date().toISOString()
      });
      console.log(`[Firebase] Ticket ${ticket.ticketNumber} synced to Firestore.`);
    } catch (error) {
      console.warn('[Firebase] Persist ticket fallback to local:', error);
    }
  }

  /**
   * Save a parcel shipment to Firestore
   */
  public static async persistParcel(parcel: ParcelShipment): Promise<void> {
    const path = 'parcels';
    try {
      await setDoc(doc(db, path, parcel.id), {
        id: parcel.id,
        trackingCode: parcel.trackingNumber,
        trackingNumber: parcel.trackingNumber,
        senderName: parcel.senderName,
        senderPhone: parcel.senderPhone,
        recipientName: parcel.recipientName,
        recipientPhone: parcel.recipientPhone,
        originCity: parcel.originAgencyName,
        destinationCity: parcel.destinationAgencyName,
        weightKg: parcel.weightKg,
        feeFcfa: parcel.shippingFeeXOF,
        status: parcel.status,
        createdAt: parcel.createdAt || new Date().toISOString()
      });
      console.log(`[Firebase] Parcel ${parcel.trackingNumber} synced to Firestore.`);
    } catch (error) {
      console.warn('[Firebase] Persist parcel fallback to local:', error);
    }
  }

  /**
   * Save a customer support claim to Firestore
   */
  public static async persistClaim(claim: SupportClaim): Promise<void> {
    const path = 'claims';
    try {
      await setDoc(doc(db, path, claim.id), {
        id: claim.id,
        userId: auth.currentUser?.uid || 'guest-user',
        claimNumber: claim.claimNumber,
        travelerName: claim.travelerName,
        contactPhone: claim.travelerPhone,
        claimType: claim.category,
        subject: claim.subject,
        description: claim.message,
        priority: claim.priority,
        status: claim.status,
        createdAt: claim.submittedAt || new Date().toISOString()
      });
      console.log(`[Firebase] Support claim ${claim.claimNumber} synced to Firestore.`);
    } catch (error) {
      console.warn('[Firebase] Persist claim fallback to local:', error);
    }
  }
}
