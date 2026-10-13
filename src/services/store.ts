import { Agency, AppNotification, BookingOrder, Company, DepartureTrip, ElectronicTicket, PaymentTransaction, ScreenId, SeatHold, UserProfile } from '../types';
import { DEMO_USERS, INITIAL_AGENCIES, INITIAL_COMPANIES, INITIAL_NOTIFICATIONS, INITIAL_TRIPS } from './mockData';
import { FirebaseSyncService } from './firebaseSyncService';
import { signQrPayload, verifyQrSignature } from './ticketService';
import { AuditService } from './auditService';

// Local storage keys
const STORAGE_PREFIX = 'tsr_transit_v1_';

export interface AppState {
  currentScreen: ScreenId;
  screenHistory: ScreenId[];
  isMobileFrame: boolean;
  isOffline: boolean;
  
  // Auth
  currentUser: UserProfile | null;
  allUsers: UserProfile[];

  // Companies & Agencies
  companies: Company[];
  agencies: Agency[];

  // Trips & Search
  trips: DepartureTrip[];
  searchDepartureCity: string;
  searchDestinationCity: string;
  searchDate: string;
  searchPassengersCount: number;
  selectedTrip: DepartureTrip | null;

  // Seat selection
  selectedSeats: number[];
  occupiedSeatsByTrip: Record<string, number[]>;
  activeHold: SeatHold | null;

  // Bookings & Payments
  currentBooking: BookingOrder | null;
  bookings: BookingOrder[];
  payments: PaymentTransaction[];

  // Tickets
  tickets: ElectronicTicket[];
  currentTicket: ElectronicTicket | null;

  // Notifications
  notifications: AppNotification[];

  // Scan result for agent
  lastScanResult: {
    success: boolean;
    ticket?: ElectronicTicket;
    message: string;
    status: 'VALID' | 'USED' | 'CANCELLED' | 'UNKNOWN' | 'ERROR';
    scannedAt: string;
  } | null;
}

class Store {
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): AppState {
    const savedTickets = this.getItem<ElectronicTicket[]>('tickets', [
      {
        id: 'tck_demo_8819',
        ticketNumber: 'TSR-BF-2026-8819',
        bookingId: 'bk_demo_01',
        tripId: 'trip_01',
        companyName: 'TSR TRANSIT BURKINA',
        passengerName: 'Aminata Ouédraogo',
        seatNumbers: [14],
        departureCity: 'Ouagadougou',
        destinationCity: 'Bobo-Dioulasso',
        departureAgency: 'Gare Centrale TSR Gounghin',
        travelDate: '2026-10-11',
        departureTime: '06:30',
        amountPaidXOF: 9000,
        status: 'VALID',
        qrPayload: JSON.stringify({
          ticketNumber: 'TSR-BF-2026-8819',
          passenger: 'Aminata Ouédraogo',
          trip: 'Ouagadougou -> Bobo-Dioulasso',
          seats: [14],
          date: '2026-10-11',
          time: '06:30',
          securityHash: 'SEC-TSR-998811-OK'
        }),
        securityToken: 'SEC-TSR-998811-OK',
        createdAt: '2026-10-10 14:30'
      }
    ]);

    const occupiedMap: Record<string, number[]> = {
      trip_01: [3, 4, 7, 8, 12, 18, 22, 23, 27, 30, 35, 41],
      trip_02: [1, 2, 5, 6, 9, 10, 15, 16, 21, 22, 25, 26, 31, 32, 40, 44, 48, 50],
      trip_03: [11, 12, 19, 20, 29],
      trip_04: [4, 5, 8, 9, 14, 15, 20, 21],
      trip_05: [2, 3, 6, 7, 10, 11, 14, 15, 18, 19, 22, 23],
      trip_06: [5, 6, 9, 10, 15, 16, 20, 21, 25, 26]
    };

    return {
      currentScreen: '01_SPLASH',
      screenHistory: [],
      isMobileFrame: true, // Default to mobile mockup frame to faithfully display the Android UI
      isOffline: false,
      currentUser: DEMO_USERS[0], // Default logged as traveler
      allUsers: DEMO_USERS,
      companies: INITIAL_COMPANIES,
      agencies: INITIAL_AGENCIES,
      trips: INITIAL_TRIPS,
      searchDepartureCity: 'Ouagadougou',
      searchDestinationCity: 'Bobo-Dioulasso',
      searchDate: '2026-10-11',
      searchPassengersCount: 1,
      selectedTrip: INITIAL_TRIPS[0],
      selectedSeats: [14],
      occupiedSeatsByTrip: occupiedMap,
      activeHold: null,
      currentBooking: null,
      bookings: [],
      payments: [],
      tickets: savedTickets,
      currentTicket: savedTickets[0] || null,
      notifications: INITIAL_NOTIFICATIONS,
      lastScanResult: null
    };
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private saveItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage unavailable or disabled
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public getState(): AppState {
    return this.state;
  }

  // --- Navigation ---
  public navigateTo(screenId: ScreenId): void {
    if (this.state.currentScreen !== screenId) {
      this.state.screenHistory.push(this.state.currentScreen);
      this.state.currentScreen = screenId;
      this.notify();
    }
  }

  public goBack(): void {
    if (this.state.screenHistory.length > 0) {
      const prev = this.state.screenHistory.pop()!;
      this.state.currentScreen = prev;
      this.notify();
    } else {
      this.state.currentScreen = '02_PUBLIC_HOME';
      this.notify();
    }
  }

  public toggleMobileFrame(): void {
    this.state.isMobileFrame = !this.state.isMobileFrame;
    this.notify();
  }

  public toggleOfflineMode(): void {
    this.state.isOffline = !this.state.isOffline;
    this.notify();
  }

  // --- Auth & Roles ---
  public switchUser(user: UserProfile | null): void {
    this.state.currentUser = user;
    this.notify();
  }

  public loginAsRole(role: UserProfile['role']): void {
    const user = this.state.allUsers.find(u => u.role === role) || null;
    this.state.currentUser = user;
    this.notify();
  }

  public registerUser(name: string, phone: string, email?: string): UserProfile {
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name,
      phone,
      email,
      role: 'TRAVELER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    this.state.allUsers.push(newUser);
    this.state.currentUser = newUser;
    this.notify();
    return newUser;
  }

  // --- Search & Trip Selection ---
  public setSearchParams(params: {
    departureCity?: string;
    destinationCity?: string;
    date?: string;
    passengers?: number;
  }): void {
    if (params.departureCity) this.state.searchDepartureCity = params.departureCity;
    if (params.destinationCity) this.state.searchDestinationCity = params.destinationCity;
    if (params.date) this.state.searchDate = params.date;
    if (params.passengers !== undefined) this.state.searchPassengersCount = params.passengers;
    this.notify();
  }

  public swapCities(): void {
    const temp = this.state.searchDepartureCity;
    this.state.searchDepartureCity = this.state.searchDestinationCity;
    this.state.searchDestinationCity = temp;
    this.notify();
  }

  public selectTrip(trip: DepartureTrip): void {
    this.state.selectedTrip = trip;
    // reset selected seats to first available seat
    const occupied = this.state.occupiedSeatsByTrip[trip.id] || [];
    let firstAvail = 1;
    while (occupied.includes(firstAvail) && firstAvail <= trip.totalSeats) {
      firstAvail++;
    }
    this.state.selectedSeats = [firstAvail];
    this.notify();
  }

  // --- Seat Selection ---
  public toggleSeat(seatNumber: number): void {
    if (!this.state.selectedTrip) return;
    const occupied = this.state.occupiedSeatsByTrip[this.state.selectedTrip.id] || [];
    if (occupied.includes(seatNumber)) return; // Can't select occupied

    const exists = this.state.selectedSeats.includes(seatNumber);
    if (exists) {
      if (this.state.selectedSeats.length > 1) {
        this.state.selectedSeats = this.state.selectedSeats.filter(s => s !== seatNumber);
      }
    } else {
      // Limit to search passengers count or allow up to 4
      const maxSeats = Math.max(this.state.searchPassengersCount, 4);
      if (this.state.selectedSeats.length < maxSeats) {
        this.state.selectedSeats = [...this.state.selectedSeats, seatNumber].sort((a, b) => a - b);
      } else {
        // replace last
        this.state.selectedSeats = [...this.state.selectedSeats.slice(1), seatNumber].sort((a, b) => a - b);
      }
    }
    this.notify();
  }

  public setActiveHold(hold: SeatHold | null): void {
    this.state.activeHold = hold;
    this.notify();
  }

  // --- Booking & Payment ---
  public createBooking(): BookingOrder {
    if (!this.state.selectedTrip) throw new Error('Aucun trajet sélectionné');
    const user = this.state.currentUser;
    const bookingRef = `TSR-BK-${Date.now().toString().slice(-6)}`;
    const passengerCount = this.state.selectedSeats.length;
    const unitPrice = this.state.selectedTrip.priceXOF;
    const totalAmount = passengerCount * unitPrice;

    const booking: BookingOrder = {
      id: `bk_${Date.now()}`,
      reference: bookingRef,
      bookingRef,
      departureTripId: this.state.selectedTrip.id,
      tripId: this.state.selectedTrip.id,
      companyId: this.state.selectedTrip.companyId,
      travelerId: user?.id || 'guest',
      userId: user?.id || 'guest',
      passengerName: user?.name || 'Voyageur TSR',
      passengerPhone: user?.phone || '+226 70 00 00 00',
      seatIds: [...this.state.selectedSeats],
      selectedSeats: [...this.state.selectedSeats],
      passengerCount,
      unitPriceXof: unitPrice,
      unitPriceXOF: unitPrice,
      totalPriceXof: totalAmount,
      totalAmountXOF: totalAmount,
      currency: 'XOF',
      status: 'HELD',
      seatHoldId: this.state.activeHold?.id,
      lockExpiresAt: this.state.activeHold?.expiresAt,
      expiresAt: this.state.activeHold?.expiresAt,
      createdAt: new Date().toISOString()
    };

    this.state.currentBooking = booking;
    this.state.bookings.push(booking);
    this.notify();
    return booking;
  }

  public confirmPaymentAndGenerateTicket(
    method: 'ORANGE_MONEY' | 'MOOV_MONEY' | 'WAVE',
    phone: string
  ): { payment: PaymentTransaction; ticket: ElectronicTicket } {
    if (!this.state.currentBooking || !this.state.selectedTrip) {
      throw new Error('Réservation introuvable pour le paiement');
    }

    // 1. Strict Seat Hold Expiration Verification
    if (this.state.activeHold) {
      const isHoldExpired = Date.now() > new Date(this.state.activeHold.expiresAt).getTime() || this.state.activeHold.status === 'EXPIRED';
      if (isHoldExpired) {
        throw new Error('HOLD_EXPIRED: Le verrou de 10 minutes sur vos sièges a expiré. Veuillez sélectionner vos places à nouveau.');
      }
    }

    const booking = this.state.currentBooking;
    const trip = this.state.selectedTrip;
    const company = this.state.companies.find(c => c.id === trip.companyId);

    // Lock seats atomically
    const seats = booking.seatIds || booking.selectedSeats || [];
    const totalAmount = booking.totalPriceXof || booking.totalAmountXOF || 0;
    const currentOccupied = this.state.occupiedSeatsByTrip[trip.id] || [];
    this.state.occupiedSeatsByTrip[trip.id] = [...new Set([...currentOccupied, ...seats])];

    // Decrement available count
    trip.availableSeatsCount = Math.max(0, trip.totalSeats - this.state.occupiedSeatsByTrip[trip.id].length);

    // Create payment transaction
    const externalRef = `${method === 'ORANGE_MONEY' ? 'OM' : method === 'MOOV_MONEY' ? 'MOOV' : 'WV'}-BF-${Date.now().toString().slice(-7)}`;
    const payment: PaymentTransaction = {
      id: `pay_${Date.now()}`,
      bookingId: booking.id,
      externalRef,
      amountXOF: totalAmount,
      currency: 'XOF',
      paymentMethod: method,
      payerPhone: phone,
      status: 'SUCCESS',
      initiatedAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString()
    };

    booking.status = 'TICKET_GENERATED';
    booking.paymentRef = externalRef;
    this.state.payments.push(payment);

    // Generate Electronic Ticket with HMAC-SHA256 Signature
    const ticketNum = `TSR-BF-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const minimalPayload: Record<string, any> = {
      tn: ticketNum,
      br: booking.bookingRef || booking.reference || `BR-${ticketNum}`,
      tid: trip.id,
      pn: booking.passengerName,
      st: seats,
      dt: trip.date,
      tm: trip.departureTime,
      amt: totalAmount,
      iat: Math.floor(Date.now() / 1000)
    };

    const securityToken = signQrPayload(minimalPayload);
    minimalPayload.sig = securityToken;
    const qrPayload = JSON.stringify(minimalPayload);

    const ticket: ElectronicTicket = {
      id: `tck_${Date.now()}`,
      ticketNumber: ticketNum,
      bookingId: booking.id,
      tripId: trip.id,
      companyName: company?.name || 'TSR TRANSIT BURKINA',
      passengerName: booking.passengerName,
      seatNumbers: seats,
      departureCity: trip.departureCity,
      destinationCity: trip.destinationCity,
      departureAgency: trip.departureAgency,
      travelDate: trip.date,
      departureTime: trip.departureTime,
      amountPaidXOF: totalAmount,
      status: 'VALID',
      qrPayload,
      securityToken,
      createdAt: new Date().toLocaleString('fr-FR')
    };

    this.state.tickets.unshift(ticket);
    this.state.currentTicket = ticket;
    this.saveItem('tickets', this.state.tickets);

    // Sync ticket with Firestore
    FirebaseSyncService.persistTicket(ticket, phone).catch(err => console.warn('Background sync failed:', err));

    // Add notification
    this.state.notifications.unshift({
      id: `notif_${Date.now()}`,
      title: 'Paiement confirmé & Billet prêt',
      message: `Votre billet N° ${ticketNum} pour ${trip.destinationCity} est disponible avec son QR Code.`,
      type: 'BOOKING',
      timestamp: 'À l\'instant',
      read: false
    });

    this.notify();
    return { payment, ticket };
  }

  // --- QR Scanner Verification (Agent) ---
  public verifyAndScanTicket(payloadOrNum: string): {
    success: boolean;
    ticket?: ElectronicTicket;
    message: string;
    status: 'VALID' | 'USED' | 'CANCELLED' | 'UNKNOWN' | 'ERROR';
    scannedAt: string;
  } {
    const agent = this.state.currentUser;
    const nowStr = new Date().toLocaleTimeString('fr-FR');

    let parsedPayload: Record<string, any> | null = null;
    let searchKey = payloadOrNum.trim();
    try {
      if (searchKey.startsWith('{')) {
        parsedPayload = JSON.parse(searchKey);
        searchKey = parsedPayload?.tn || parsedPayload?.ticketNumber || searchKey;
      }
    } catch {
      // payload is raw string
    }

    // Cryptographic HMAC Signature Verification
    if (parsedPayload && parsedPayload.sig) {
      const isSigValid = verifyQrSignature(parsedPayload);
      if (!isSigValid) {
        const res = {
          success: false,
          message: 'ALERTE SÉCURITÉ : Signature cryptographique HMAC invalide. Billet falsifié ou altéré.',
          status: 'ERROR' as const,
          scannedAt: nowStr
        };
        this.state.lastScanResult = res;
        this.notify();
        return res;
      }
    }

    const ticket = this.state.tickets.find(
      t => t.ticketNumber.toUpperCase() === searchKey.toUpperCase() || t.id === searchKey
    );

    if (!ticket) {
      const res = {
        success: false,
        message: 'Billet introuvable dans le registre TSR. Vérifiez le QR Code.',
        status: 'UNKNOWN' as const,
        scannedAt: nowStr
      };
      this.state.lastScanResult = res;
      this.notify();
      return res;
    }

    if (ticket.status === 'USED') {
      const res = {
        success: false,
        ticket,
        message: `Billet déjà validé et composté à ${ticket.validatedAt || 'une heure antérieure'}. ALERTE DOUBLE SCAN.`,
        status: 'USED' as const,
        scannedAt: nowStr
      };
      this.state.lastScanResult = res;
      this.notify();
      return res;
    }

    if (ticket.status === 'CANCELLED') {
      const res = {
        success: false,
        ticket,
        message: 'Ce billet a été annulé par la compagnie ou le voyageur.',
        status: 'CANCELLED' as const,
        scannedAt: nowStr
      };
      this.state.lastScanResult = res;
      this.notify();
      return res;
    }

    // Atomic validate
    ticket.status = 'USED';
    ticket.validatedAt = new Date().toLocaleString('fr-FR');
    ticket.validatedByAgentId = agent?.id || 'agent_terminal_01';
    this.saveItem('tickets', this.state.tickets);

    const res = {
      success: true,
      ticket,
      message: `Embarquement autorisé pour ${ticket.passengerName}. Siège(s) : ${ticket.seatNumbers.join(', ')}.`,
      status: 'VALID' as const,
      scannedAt: nowStr
    };
    this.state.lastScanResult = res;
    this.notify();
    return res;
  }

  // --- Company Management ---
  public registerCompany(companyData: Omit<Company, 'id' | 'status' | 'createdAt' | 'fleetCount' | 'rating'>): Company {
    const newCompany: Company = {
      ...companyData,
      id: `comp_${Date.now()}`,
      status: 'PENDING',
      fleetCount: 0,
      rating: 5.0,
      createdAt: new Date().toISOString().split('T')[0]
    };
    this.state.companies.push(newCompany);

    this.state.notifications.unshift({
      id: `notif_${Date.now()}`,
      title: 'Nouvelle demande de société de transport',
      message: `La compagnie ${newCompany.name} a soumis un dossier d'agrément (Statut : En attente).`,
      type: 'ALERT',
      timestamp: 'À l\'instant',
      read: false
    });

    this.notify();
    return newCompany;
  }

  public updateCompanyStatus(companyId: string, status: Company['status'], reason?: string): void {
    const comp = this.state.companies.find(c => c.id === companyId);
    if (comp) {
      comp.status = status;
      if (reason) comp.rejectionReason = reason;
      this.notify();
    }
  }

  // --- Trips Management ---
  public addTrip(tripData: Omit<DepartureTrip, 'id' | 'availableSeatsCount' | 'status' | 'createdAt' | 'updatedAt'>): DepartureTrip {
    const now = new Date().toISOString();
    const newTrip: DepartureTrip = {
      ...tripData,
      id: `trip_${Date.now()}`,
      availableSeatsCount: tripData.totalSeats,
      status: 'PUBLISHED',
      createdAt: now,
      updatedAt: now
    };
    this.state.trips.unshift(newTrip);
    this.notify();
    return newTrip;
  }

  public updateTripStatus(tripId: string, status: DepartureTrip['status']): void {
    const trip = this.state.trips.find(t => t.id === tripId);
    if (trip) {
      trip.status = status;
      this.notify();
    }
  }

  public updateUserStatus(userId: string, status: UserProfile['status']): void {
    const user = this.state.allUsers.find(u => u.id === userId);
    if (user) {
      user.status = status;
      user.updatedAt = new Date().toISOString().split('T')[0];
      this.notify();
    }
  }

  public updateUserRole(userId: string, role: UserProfile['role']): void {
    const user = this.state.allUsers.find(u => u.id === userId);
    if (user) {
      user.role = role;
      user.updatedAt = new Date().toISOString().split('T')[0];
      this.notify();
    }
  }

  public updateTicketStatus(ticketId: string, status: ElectronicTicket['status']): void {
    const ticket = this.state.tickets.find(t => t.id === ticketId || t.ticketNumber === ticketId);
    if (ticket) {
      ticket.status = status;
      this.saveItem('tickets', this.state.tickets);
      this.notify();
    }
  }

  public updateBookingStatus(bookingId: string, status: BookingOrder['status']): void {
    const booking = this.state.bookings.find(b => b.id === bookingId || b.bookingRef === bookingId);
    if (booking) {
      booking.status = status;
      this.notify();
    }
  }

  // --- Notifications ---
  public markNotificationAsRead(id: string): void {
    const n = this.state.notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      this.notify();
    }
  }

  public markAllNotificationsAsRead(): void {
    for (const n of this.state.notifications) {
      n.read = true;
    }
    this.notify();
  }
}

export const appStore = new Store();
