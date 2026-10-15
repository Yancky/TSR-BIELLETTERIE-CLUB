/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// 1. UTILISATEURS & AUTHENTIFICATION
// ==========================================

export type UserRole = 'TRAVELER' | 'AGENT' | 'COMPANY_MANAGER' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

/**
 * Modèle Utilisateur sécurisé (aucun mot de passe ni jeton secret n'y figure)
 */
export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  companyId?: string; // Obligatoire pour AGENT et COMPANY_MANAGER
  assignedAgencyId?: string; // Optionnel pour AGENT de gare
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Rétrocompatibilité avec UserProfile
export type UserProfile = User;

/**
 * Session d'authentification sécurisée
 */
export interface AuthSession {
  token: string;
  userId: string;
  role: UserRole;
  companyId?: string;
  issuedAt: string;     // ISO 8601 UTC
  expiresAt: string;    // ISO 8601 UTC
  ipAddress?: string;
  userAgent?: string;
  isSimulatedDemo: boolean;
}

// ==========================================
// 2. PERMISSIONS & RBAC
// ==========================================

export type Permission =
  // Voyageur
  | 'TRIP_SEARCH'
  | 'TRIP_VIEW_DETAILS'
  | 'BOOKING_CREATE'
  | 'BOOKING_VIEW_OWN'
  | 'BOOKING_CANCEL_OWN'
  | 'PAYMENT_INITIATE'
  | 'TICKET_VIEW_OWN'
  | 'TICKET_DOWNLOAD_OWN'
  | 'PROFILE_MANAGE_OWN'
  // Agent de gare
  | 'AGENT_VIEW_ASSIGNED_TRIPS'
  | 'TICKET_SCAN_AND_VALIDATE'
  | 'BOARDING_REGISTER'
  // Responsable Compagnie
  | 'COMPANY_VIEW_OWN'
  | 'COMPANY_UPDATE_OWN'
  | 'AGENCY_MANAGE_OWN'
  | 'BUS_MANAGE_OWN'
  | 'TRIP_CREATE_OWN'
  | 'TRIP_UPDATE_OWN'
  | 'TRIP_CANCEL_OWN'
  | 'BOOKING_VIEW_COMPANY'
  | 'REVENUE_VIEW_COMPANY'
  | 'AGENT_MANAGE_COMPANY'
  // Administrateur central
  | 'ADMIN_SUPERVISION_ALL'
  | 'COMPANY_APPROVE'
  | 'COMPANY_REJECT'
  | 'COMPANY_SUSPEND'
  | 'COMPANY_REACTIVATE'
  | 'ALL_USERS_MANAGE'
  | 'ALL_TRANSACTIONS_VIEW'
  | 'AUDIT_LOGS_VIEW';

// ==========================================
// ==========================================
// 3. COMPAGNIES & GARES (STATIONS / AGENCES)
// ==========================================

export type CompanyStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

/**
 * Entité Company — Société de transport burkinabè agréée ou candidate
 */
export interface Company {
  id: string;
  name: string;
  tradeName: string;
  logoUrl?: string;
  headquarters: string;
  city?: string;
  region?: string;
  country?: string; // Toujours 'Burkina Faso' par défaut
  phone: string;
  whatsapp: string;
  managerName: string;
  managerEmail: string;
  managerRole?: string;
  ifuNumber?: string;
  rccmNumber?: string;
  companyType?: string;
  description?: string;
  merchantCode?: string;
  servedCities?: string[];
  status: CompanyStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  fleetCount: number;
  rating: number;
  supportingDocuments?: {
    rccmDoc?: string;
    transportLicenseDoc?: string;
    identityDoc?: string;
  };
  managerAccountId?: string;
  createdAt: string;
  updatedAt?: string;
}

export type StationStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

/**
 * Entité Station — Gare ou agence physique de transport rattachée à une société
 */
export interface Station {
  id: string;
  companyId: string; // Association stricte à sa société propriétaire
  name: string;
  city: string;
  region?: string;
  neighborhood?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  // Alias de compatibilité
  lat?: number;
  lng?: number;
  phone: string;
  code?: string;
  openingHours?: string;
  supportedDestinations?: string[];
  status: StationStatus;
  createdAt: string;
  updatedAt: string;
}

// Rétrocompatibilité bidirectionnelle stricte avec Agency
export type Agency = Station;
export type AgencyStatus = StationStatus;

// ==========================================
// 4. TRAJETS (TRIPS / LIGNES), BUS & DÉPARTS PROGRAMMÉS
// ==========================================

export type TripRouteStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

/**
 * Entité Trip — Trajet commercial pérenne (Liaison / Ligne)
 * Représente la liaison commerciale offerte par une société entre deux gares.
 * Exemple: Société TSR, Gare de Ouagadougou -> Gare de Bobo-Dioulasso
 */
export interface Trip {
  id: string;
  companyId: string;
  departureStationId?: string; // Gare de départ
  arrivalStationId?: string;   // Gare d'arrivée
  departureCity: string;
  destinationCity: string;
  departureAgencyId?: string;  // Alias rétrocompatible
  arrivalAgencyId?: string;    // Alias rétrocompatible
  departureAgencyName?: string;
  arrivalAgencyName?: string;
  departureStationName?: string;
  arrivalStationName?: string;
  estimatedDurationMinutes: number;
  distanceKm?: number;
  basePriceXOF?: number;
  routeDescription?: string;
  description?: string;
  stops?: string[];
  status: TripRouteStatus;
  createdAt: string;
  updatedAt: string;
}

// Rétrocompatibilité avec Route
export type Route = Trip;
export type RouteStatus = TripRouteStatus;

export type BusCategory = 'STANDARD' | 'CONFORT' | 'VIP';
export type BusStatus = 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';

export interface Bus {
  id: string;
  companyId: string;
  agencyId?: string;
  stationId?: string;
  registrationNumber: string; // Ex: 11-JJ-4567 BF
  // Alias de compatibilité
  registrationPlate?: string;
  fleetNumber: string;        // Ex: BUS-01
  brand: string;              // Ex: Scania, Mercedes, Yutong, Marcopolo
  model: string;              // Ex: Touring HD 2024
  manufactureYear?: number;
  seatCapacity: number;       // Entier positif strict
  totalSeats?: number;        // Alias
  seatLayout: '2x2' | '2x1' | 'VIP';
  category: BusCategory;
  amenities: string[];
  status: BusStatus;
  createdAt: string;
  updatedAt: string;
}

export type ScheduledDepartureStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'BOARDING'
  | 'FULL'
  | 'DEPARTED'
  | 'COMPLETED'
  | 'CANCELLED';

/**
 * Entité ScheduledDeparture — Occurrence calendaire d'un départ
 * Un départ représente une occurrence précise du trajet à une date et une heure données.
 * Exemple: Trajet Ouaga-Bobo, le 20 octobre à 06h30, Car 11-JJ-4567 BF, 50 places, tarif 9 000 FCFA
 */
export interface ScheduledDeparture {
  id: string;
  companyId: string;
  tripId?: string;                // Réf au Trajet pérenne (Trip / Route)
  routeId?: string;               // Alias de compatibilité
  departureDate?: string;         // Date au format YYYY-MM-DD
  date: string;                   // Alias de compatibilité format YYYY-MM-DD
  departureTime: string;          // Format "HH:mm"
  estimatedArrivalTime?: string;  // Format "HH:mm"
  arrivalTime: string;            // Format "HH:mm"
  vehicleId?: string;             // Identifiant du véhicule / car affecté
  busId?: string;                 // Alias de compatibilité
  seatCapacity?: number;          // Capacité de places
  totalSeats: number;             // Alias de compatibilité
  availableSeatsCount: number;    // Sièges disponibles
  price?: number;                 // Tarif en XOF
  priceXOF: number;               // Alias de compatibilité en XOF
  currency?: 'XOF';               // Devise stricte XOF
  status: ScheduledDepartureStatus;
  bookingOpeningTime?: string;    // Date/Heure d'ouverture des réservations
  bookingClosingTime?: string;    // Date/Heure de clôture des réservations
  // Champs dénormalisés pour recherche et affichage sans jointure complexe
  departureCity: string;
  destinationCity: string;
  departureAgency: string;
  arrivalAgency: string;
  departureAgencyId?: string;
  arrivalAgencyId?: string;
  departureStationId?: string;
  arrivalStationId?: string;
  busType: string;
  amenities: string[];
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// Rétrocompatibilité avec DepartureTrip
export type DepartureTrip = ScheduledDeparture;
export type TripStatus = ScheduledDepartureStatus;

export interface CompanyRegistrationInput {
  // A. Identité
  name: string;
  tradeName: string;
  companyType: string;
  ifuNumber: string;
  rccmNumber: string;
  establishedYear?: string;
  description: string;
  logoUrl?: string;
  headquartersAddress: string;
  city: string;
  region: string;
  country: string; // 'Burkina Faso'

  // B. Responsable
  managerName: string;
  managerRole: string;
  phone: string;
  email: string;
  professionalAddress: string;
  desiredUsername: string;

  // C. Connexion
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  dataConsentAccepted: boolean;

  // D. Coordonnées & Services
  whatsapp: string;
  secondaryPhone?: string;
  acceptedPaymentMethods: ('ORANGE_MONEY' | 'MOOV_MONEY' | 'WAVE')[];
  merchantCode?: string;
  websiteUrl?: string;

  // E. Opérationnel
  estimatedVehicles: number;
  estimatedSeats: number;
  agenciesCount: number;
  servedCities: string[];
  mainRoutes: string[];
  serviceCategories: BusCategory[];

  // F. Justificatifs
  rccmDocName?: string;
  transportLicenseDocName?: string;
  identityDocName?: string;
}

export type SeatStatus = 'AVAILABLE' | 'SELECTED' | 'LOCKED' | 'OCCUPIED';

export type SeatType = 'STANDARD' | 'VIP' | 'WINDOW' | 'AISLE';

export interface Seat {
  id: string;
  busId: string;
  seatNumber: number;
  row: number;
  column: number;
  seatType: SeatType;
  isBookable: boolean;
  status?: SeatStatus; // Calculé dynamiquement côté serveur
}

export interface BusSeat {
  seatNumber: number;
  status: SeatStatus;
  row: number;
  col: number; // 0: fenêtre gauche, 1: couloir gauche, 2: allée centrale, 3: couloir droit, 4: fenêtre droite
  priceXOF: number;
}

export type SeatLayoutType = '2+2' | '2+3' | '2+1_VIP' | 'CUSTOM';

export interface BusSeatLayout {
  busId: string;
  busType: string;
  layoutType: SeatLayoutType;
  totalSeats: number;
  seatsPerRow: number;
  rowCount: number;
  seats: Seat[];
}

export type SeatHoldStatus = 'ACTIVE' | 'CONSUMED' | 'RELEASED' | 'EXPIRED';

export interface SeatHold {
  id: string;
  departureTripId: string;
  seatIds: number[];
  travelerId: string;
  status: SeatHoldStatus;
  createdAt: string;       // ISO 8601 UTC
  expiresAt: string;       // ISO 8601 UTC (createdAt + 600s = 10 minutes)
  idempotencyKey: string;
}

export type TripSortOption = 'PRICE_ASC' | 'PRICE_DESC' | 'TIME_ASC' | 'DURATION_ASC';

export interface TripSearchQuery {
  originCityId?: string;
  originCity: string;
  destinationCityId?: string;
  destinationCity: string;
  departureDate: string; // YYYY-MM-DD
  passengerCount: number;
  category?: BusCategory;
  maxPriceXof?: number;
  departureTimeRange?: {
    startHour: number;
    endHour: number;
  };
  amenities?: string[];
  sortBy?: TripSortOption;
}

// ==========================================
// 5. RÉSERVATIONS & PAIEMENTS
// ==========================================

export type BookingStatus =
  | 'PENDING'
  | 'HELD'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'TICKET_GENERATED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED';

export interface BookingOrder {
  id: string;
  reference: string;          // Ex: TSR-BK-882190
  bookingRef: string;         // Alias de compatibilité
  departureTripId: string;
  tripId: string;             // Alias de compatibilité
  companyId: string;
  travelerId: string;
  userId: string;             // Alias de compatibilité
  passengerName: string;
  passengerPhone: string;
  seatIds: number[];
  selectedSeats: number[];    // Alias de compatibilité
  passengerCount: number;
  unitPriceXof: number;
  unitPriceXOF: number;       // Alias de compatibilité
  totalPriceXof: number;
  totalAmountXOF: number;     // Alias de compatibilité
  currency: 'XOF';
  status: BookingStatus;
  seatHoldId?: string;
  lockExpiresAt?: string;
  paymentRef?: string;
  createdAt: string;
  expiresAt?: string;
  updatedAt?: string;
}

export type PaymentMethod = 'ORANGE_MONEY' | 'MOOV_MONEY' | 'WAVE';

export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'EXPIRED';

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  companyId?: string;
  externalRef: string;
  amountXOF: number;
  currency: 'XOF';
  paymentMethod: PaymentMethod;
  payerPhone: string;
  status: PaymentStatus;
  initiatedAt: string;
  confirmedAt?: string;
  failureReason?: string;
  commissionRatePercent?: number; // Ex: 2.5%
  commissionAmountXOF?: number;   // Ex: 225 XOF
  netCompanyAmountXOF?: number;   // Ex: 8775 XOF
}

// ==========================================
// 6. BILLETS ÉLECTRONIQUES & QR CODES
// ==========================================

export type TicketStatus = 'VALID' | 'USED' | 'CANCELLED' | 'EXPIRED';

export interface ElectronicTicket {
  id: string;
  ticketNumber: string; // Ex: TSR-BF-2026-8819
  bookingId: string;
  tripId: string;
  companyId?: string;
  companyName: string;
  passengerName: string;
  seatNumbers: number[];
  departureCity: string;
  destinationCity: string;
  departureAgency: string;
  travelDate: string;
  departureTime: string;
  amountPaidXOF: number;
  status: TicketStatus;
  qrPayload: string;
  securityToken: string;
  validatedAt?: string;
  validatedByAgentId?: string;
  createdAt: string;
}

// ==========================================
// 7. JOURNAL D'AUDIT & SÉCURITÉ
// ==========================================

export type AuditActionType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'AUTH_REGISTER'
  | 'AUTH_SESSION_EXPIRED'
  | 'PERMISSION_DENIED'
  | 'COMPANY_REGISTER_SUBMITTED'
  | 'COMPANY_APPROVED'
  | 'COMPANY_REJECTED'
  | 'COMPANY_SUSPENDED'
  | 'COMPANY_REACTIVATED'
  | 'COMPANY_UPDATED'
  | 'AGENCY_CREATED'
  | 'AGENCY_UPDATED'
  | 'AGENCY_STATUS_CHANGED'
  | 'STATION_CREATED'
  | 'STATION_UPDATED'
  | 'STATION_STATUS_CHANGED'
  | 'ROUTE_CREATED'
  | 'ROUTE_UPDATED'
  | 'ROUTE_STATUS_CHANGED'
  | 'TRIP_SCHEDULED'
  | 'TRIP_STATUS_CHANGED'
  | 'DEPARTURE_SCHEDULED'
  | 'DEPARTURE_CANCELLED'
  | 'DEPARTURE_PRICE_UPDATED'
  | 'BUS_REGISTERED'
  | 'BUS_STATUS_CHANGED'
  | 'SETTINGS_UPDATED'
  | 'TRIP_CREATED'
  | 'TRIP_CANCELLED'
  | 'TRIP_SEARCH'
  | 'SEAT_LOCK_ACQUIRED'
  | 'SEAT_LOCK_RELEASED'
  | 'SEAT_HOLD_ACQUIRED'
  | 'SEAT_HOLD_RELEASED'
  | 'SEAT_CONFLICT_DETECTED'
  | 'BOOKING_CREATED'
  | 'BOOKING_PROVISIONAL_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_EXPIRED_HOLD_REJECTED'
  | 'WEBHOOK_SIGNATURE_INVALID'
  | 'TICKET_GENERATED'
  | 'TICKET_ISSUED'
  | 'TICKET_ISSUANCE_REJECTED_UNPAID'
  | 'TICKET_SCANNED_VALID'
  | 'TICKET_SCANNED_DUPLICATE_ALERT'
  | 'TICKET_SCANNED_INVALID'
  | 'BOARDING_VALIDATION_UNAUTHORIZED'
  | 'SECURITY_QR_FORGERY_DETECTED'
  | 'SECURITY_PRICE_TAMPERING_ATTEMPT'
  | 'ISOLATION_VIOLATION_BOARDING'
  | 'DOUBLE_BOARDING_ATTEMPT_BLOCKED'
  | 'TICKET_BOARDED_SUCCESS'
  | 'PRIVACY_VIOLATION_ATTEMPT';

export type AuditResourceType =
  | 'USER'
  | 'COMPANY'
  | 'AGENCY'
  | 'STATION'
  | 'ROUTE'
  | 'TRIP'
  | 'DEPARTURE'
  | 'BUS'
  | 'SETTINGS'
  | 'SEAT'
  | 'BOOKING'
  | 'PAYMENT'
  | 'TICKET'
  | 'SESSION'
  | 'SYSTEM';

export type AuditResult = 'SUCCESS' | 'FAILURE' | 'WARNING';

export interface AuditLog {
  id: string;
  timestamp: string; // UTC ISO 8601
  actorId: string;
  actorRole: UserRole | 'SYSTEM';
  action: AuditActionType;
  resourceType: AuditResourceType;
  resourceId?: string;
  targetId?: string;
  companyId?: string;
  result?: AuditResult;
  status?: AuditResult;
  reason?: string;
  correlationId?: string;
  ipAddress?: string;
  details?: Record<string, unknown> | string;
}

// ==========================================
// 8. NOTIFICATIONS & API RESPONSES
// ==========================================

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'BOOKING' | 'PAYMENT' | 'ALERT' | 'TRIP' | 'SYSTEM';
  timestamp: string;
  read: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  correlationId: string;
  timestamp: string;
}

// ==========================================
// 9. ÉCRANS APPLICATIFS
// ==========================================

export type ScreenId =
  | '01_SPLASH'
  | '02_PUBLIC_HOME'
  | '03_LOGIN'
  | '04_REGISTER'
  | '05_SEARCH_TRIP'
  | '06_SEARCH_RESULTS'
  | '07_TRIP_DETAILS'
  | '08_SEAT_SELECTION'
  | '09_PAYMENT'
  | '10_PAYMENT_CONFIRMATION'
  | '11_ELECTRONIC_TICKET'
  | '12_TRAVEL_HISTORY'
  | '13_TRAVELER_PROFILE'
  | '14_COMPANY_DASHBOARD'
  | '15_MANAGE_TRIPS'
  | '16_QR_SCANNER'
  | '17_ADMIN_DASHBOARD'
  | '18_REGISTER_COMPANY'
  | '19_INTERACTIVE_MAP'
  | '20_NOTIFICATIONS'
  | '21_SETTINGS'
  | '22_OFFLINE_MODE'
  | '23_PROMO_END'
  // Phase V2 - Nouvelles Pages
  | '24_DESTINATION_DETAILS'
  | '25_SCHEDULES_CALENDAR'
  | '26_AGENCIES_MAP'
  | '27_PARTNER_COMPANIES'
  | '28_PARCEL_TRACKING'
  | '29_LUGGAGE_LOST_FOUND'
  | '30_SUPPORT_CLAIMS'
  | '31_LOYALTY_PROGRAM'
  | '32_AGENCY_PARCEL_DESK'
  | '33_OPERATIONAL_REPORTS';

export interface ScreenMetadata {
  id: ScreenId;
  number: string;
  group: string;
  title: string;
  description: string;
}

// ==========================================
// 10. PHASE V2 — NOUVEAUX MODÈLES MÉTIER
// ==========================================

export interface DestinationInfo {
  id: string;
  cityName: string;
  region: string;
  tagline: string;
  description: string;
  imageUrl: string;
  popularSpots: string[];
  travelTips: string[];
  climate: string;
  averageFareXOF: number;
  averageDurationHours: number;
  dailyDeparturesCount: number;
  servedFrom: string[];
}

export interface TimetableDeparture {
  id: string;
  companyName: string;
  companyLogo?: string;
  departureCity: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  priceXOF: number;
  busType: string;
  amenities: string[];
  daysOfWeek: number[]; // 1=Lundi ... 7=Dimanche
  agencyName: string;
  availableSeats: number;
  status: 'A_L_HEURE' | 'RETARD_15M' | 'EMBARQUEMENT' | 'COMPLET';
}

export interface DetailedAgency {
  id: string;
  companyId: string;
  companyName: string;
  agencyName: string;
  city: string;
  neighborhood: string;
  address: string;
  phone: string;
  secondaryPhone?: string;
  openingHours: string;
  gpsCoordinates: { lat: number; lng: number };
  servicesOffered: {
    ticketCounter: boolean;
    parcelDesk: boolean;
    waitingLounge: boolean;
    parking: boolean;
    luggageStorage: boolean;
    mobileMoneyCash: boolean;
  };
}

export interface PartnerCompanyProfile {
  id: string;
  name: string;
  tradeName: string;
  slogan: string;
  logoUrl?: string;
  headquarters: string;
  foundedYear: number;
  fleetSize: number;
  destinationsCount: number;
  rating: number; // sur 5
  reviewCount: number;
  amenities: string[];
  safetyCertifications: string[];
  description: string;
  contactPhone: string;
  contactEmail: string;
  featuredRoutes: { from: string; to: string; priceXOF: number }[];
}

export type ParcelStatus =
  | 'REGISTERED'        // Enregistré en agence départ
  | 'LOADED'            // Chargé dans le car
  | 'IN_TRANSIT'        // En route
  | 'ARRIVED_AT_AGENCY' // Arrivé agence d'arrivée, prêt au retrait
  | 'DELIVERED'         // Retiré par le destinataire
  | 'RETURNED';         // Retourné

export type ParcelCategory = 'ENVELOPPE' | 'PAQUET_PETIT' | 'CARTON_MOYEN' | 'COLIS_LOURD' | 'FRET_SPECIAL';

export interface ParcelShipment {
  id: string;
  trackingNumber: string; // Ex: TSR-COL-8921-BF
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
  shippingFeeXOF: number;
  status: ParcelStatus;
  pickupOtpCode: string; // Code secret à 4 chiffres fourni au destinataire
  otpExpiresAt?: string; // Date d'expiration de l'OTP (par défaut J+7)
  failedOtpAttempts?: number; // Nombre de tentatives OTP erronées (max 3)
  isLocked?: boolean; // Verrouillage de sécurité en cas de brute-force
  assignedTripId?: string;
  createdAt: string;
  updatedAt: string;
  history: {
    status: ParcelStatus;
    timestamp: string;
    location: string;
    note?: string;
  }[];
}

export type LostItemStatus = 'REPORTED' | 'SEARCHING' | 'FOUND_IN_AGENCY' | 'RESTORED' | 'CLOSED';

export interface LostItemReport {
  id: string;
  reference: string; // Ex: TSR-OBJ-4402
  travelerName: string;
  travelerPhone: string;
  ticketNumber?: string;
  tripInfo: string;
  itemCategory: 'SAC_VALISE' | 'APPAREIL_ELECTRONIQUE' | 'DOCUMENTS' | 'VETEMENTS' | 'AUTRE';
  description: string;
  color: string;
  reportedDate: string;
  status: LostItemStatus;
  foundLocation?: string;
  restoredDate?: string;
  agentNotes?: string;
}

export type ClaimCategory =
  | 'RETARD_DEPART'
  | 'BAGAGE_ENDOMMAGE'
  | 'PROBLEME_RESERVATION'
  | 'COMPORTEMENT_EQUIPAGE'
  | 'REMBOURSEMENT'
  | 'AUTRE';

export type ClaimStatus = 'SUBMITTED' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface SupportClaim {
  id: string;
  claimNumber: string; // Ex: TSR-REC-5510
  travelerName: string;
  travelerPhone: string;
  travelerEmail?: string;
  ticketNumber?: string;
  category: ClaimCategory;
  subject: string;
  message: string;
  priority: 'NORMALE' | 'HAUTE' | 'URGENTE';
  status: ClaimStatus;
  resolutionNote?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface LoyaltyAccount {
  userId: string;
  cardNumber: string; // Ex: TSR-FID-992014
  pointsBalance: number;
  tier: 'STANDARD' | 'ARGENT' | 'OR' | 'PLATINE';
  lifetimePoints: number;
  totalTripsCompleted: number;
  totalSpentXOF: number;
  benefits: string[];
}

export interface OperationalKPIData {
  period: string;
  totalRevenueXOF: number;
  totalBookings: number;
  totalPassengers: number;
  averageFillRatePct: number;
  onTimeDepartureRatePct: number;
  parcelsHandled: number;
  parcelRevenueXOF: number;
  topRoutes: {
    route: string;
    passengerCount: number;
    revenueXOF: number;
    fillRatePct: number;
  }[];
}

