/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { appStore } from '../services/store';
import { AuditService } from '../services/auditService';
import { INITIAL_PARCELS } from '../services/parcelService';
import { INITIAL_CLAIMS } from '../services/supportClaimService';
import { BURKINA_CITIES } from '../services/mockData';
import { 
  Company, UserProfile, DepartureTrip, ElectronicTicket, 
  PaymentTransaction, ParcelShipment, SupportClaim, 
  Agency, Route, Bus, TripStatus, CompanyStatus, AgencyStatus, RouteStatus, BusStatus,
  Station, Trip, ScheduledDeparture, ScheduledDepartureStatus, StationStatus, TripRouteStatus
} from '../types';
import { DataRelationsService } from '../services/dataRelationsService';

type AdminTab = 
  | 'overview'
  | 'companies'
  | 'stations'
  | 'routes'
  | 'trips'
  | 'vehicles'
  | 'users'
  | 'tickets'
  | 'payments'
  | 'parcels'
  | 'claims'
  | 'audit'
  | 'settings';

const LAB: Record<string, [string, string]> = {
  ACTIVE: ['Active', 'g'],
  PENDING: ['En attente', 'y'],
  SUSPENDED: ['Suspendue', 'r'],
  REJECTED: ['Rejetée', 'r'],
  INACTIVE: ['Inactive', 'm'],
  MAINTENANCE: ['En maintenance', 'y'],
  SCHEDULED: ['Programmé', 'b'],
  BOARDING: ['Embarquement', 'y'],
  DEPARTED: ['Parti', 'g'],
  COMPLETED: ['Terminé', 'm'],
  CANCELLED: ['Annulé', 'r'],
  VALID: ['Valide', 'g'],
  USED: ['Utilisé', 'm'],
  SUCCESS: ['Réussi', 'g'],
  FAILED: ['Échoué', 'r'],
  REGISTERED: ['Enregistré', 'b'],
  TRANSIT: ['En transit', 'y'],
  DELIVERED: ['Livré', 'g'],
  OPEN: ['Ouverte', 'y'],
  RESOLVED: ['Résolue', 'g'],
  WARNING: ['Alerte', 'y'],
  FAILURE: ['Échec', 'r']
};

const NAV_ITEMS: [AdminTab, string][] = [
  ['overview', 'Vue générale'],
  ['companies', 'Sociétés'],
  ['stations', 'Gares & Agences'],
  ['routes', 'Lignes & Trajets'],
  ['trips', 'Horaires & Départs'],
  ['vehicles', 'Flotte & Bus'],
  ['users', 'Utilisateurs'],
  ['tickets', 'Billets'],
  ['payments', 'Paiements'],
  ['parcels', 'Colis'],
  ['claims', 'Réclamations'],
  ['audit', 'Sécurité et audit'],
  ['settings', 'Paramètres']
];

export const Screen17AdminDashboard: React.FC = () => {
  const [storeState, setStoreState] = useState(appStore.getState());
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  // Settings state
  const [commission, setCommission] = useState<number>(2.5);
  const [seatLockDuration, setSeatLockDuration] = useState<number>(10);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  // Local state for interactive parcels & claims
  const [parcels, setParcels] = useState<ParcelShipment[]>(INITIAL_PARCELS);
  const [claims, setClaims] = useState<SupportClaim[]>(INITIAL_CLAIMS);

  // Modals state
  const [companyModal, setCompanyModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data: Partial<Company> }>({
    open: false,
    mode: 'create',
    data: {}
  });

  const [companyDetailModal, setCompanyDetailModal] = useState<{ open: boolean; company: Company | null }>({
    open: false,
    company: null
  });

  const [stationModal, setStationModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data: Partial<Station> }>({
    open: false,
    mode: 'create',
    data: {}
  });

  const [stationDetailModal, setStationDetailModal] = useState<{ open: boolean; station: Station | null }>({
    open: false,
    station: null
  });

  const [routeModal, setRouteModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data: Partial<Trip> }>({
    open: false,
    mode: 'create',
    data: {}
  });

  const [tripModal, setTripModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data: Partial<ScheduledDeparture> }>({
    open: false,
    mode: 'create',
    data: {}
  });

  const [busModal, setBusModal] = useState<{ open: boolean; mode: 'create' | 'edit'; data: Partial<Bus> }>({
    open: false,
    mode: 'create',
    data: {}
  });

  // Reset pagination when active tab, search, or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, filterValue]);

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      setStoreState({ ...appStore.getState() });
    });
    return () => unsubscribe();
  }, []);

  const toast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2800);
  };

  const logAudit = (act: string, s: 'SUCCESS' | 'WARNING' | 'FAILURE' = 'SUCCESS', actionType: any = 'COMPANY_APPROVED') => {
    AuditService.log({
      actorId: storeState.currentUser?.id || 'admin_central',
      actorRole: 'ADMIN',
      action: actionType,
      result: s,
      details: act
    });
  };

  const fmt = (n: number) => (n || 0).toLocaleString('fr-FR');

  const pendingCompaniesCount = useMemo(() => {
    return storeState.companies.filter(c => c.status === 'PENDING').length;
  }, [storeState.companies]);

  const openClaimsCount = useMemo(() => {
    return claims.filter(c => c.status === 'SUBMITTED' || c.status === 'IN_REVIEW' || (c as any).status === 'OPEN').length;
  }, [claims]);

  const activeStationsCount = useMemo(() => {
    return storeState.agencies.filter(a => a.status === 'ACTIVE').length;
  }, [storeState.agencies]);

  const activeRoutesCount = useMemo(() => {
    return storeState.routes?.filter(r => r.status === 'ACTIVE').length || 0;
  }, [storeState.routes]);

  const scheduledTripsCount = useMemo(() => {
    return storeState.trips.filter(t => t.status === 'SCHEDULED' || t.status === 'PUBLISHED').length;
  }, [storeState.trips]);

  // Tab count badges
  const getTabBadge = (tab: AdminTab) => {
    if (tab === 'companies') return pendingCompaniesCount;
    if (tab === 'claims') return openClaimsCount;
    if (tab === 'stations') return activeStationsCount;
    if (tab === 'trips') return scheduledTripsCount;
    return 0;
  };

  const handleTabChange = (t: AdminTab) => {
    setActiveTab(t);
    setSearchQuery('');
    setFilterValue('');
  };

  // ==========================================
  // A. ACTIONS SOCIÉTÉS
  // ==========================================
  const handleApproveCompany = (compId: string, compName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Valider et Agréer la Société',
      message: `Confirmez-vous l'agrément et l'activation de la société "${compName}" ? Cette action autorisera officiellement le transporteur à publier des trajets et départs en ligne pour les voyageurs burkinabè.`,
      confirmLabel: 'Agréer & Activer',
      isDangerous: false,
      onConfirm: () => {
        appStore.updateCompanyStatus(compId, 'ACTIVE');
        logAudit(`Société approuvée : ${compName}`, 'SUCCESS', 'COMPANY_APPROVED');
        toast(`La société ${compName} a été validée et activée.`);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleRejectCompany = (compId: string, compName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Rejeter la Demande d’Agrément',
      message: `Confirmez-vous le rejet du dossier d'agrément de la société "${compName}" ? Cette société ne sera pas admise sur le réseau national.`,
      confirmLabel: 'Rejeter la demande',
      isDangerous: true,
      onConfirm: () => {
        appStore.updateCompanyStatus(compId, 'REJECTED');
        logAudit(`Société rejetée : ${compName}`, 'WARNING', 'COMPANY_REJECTED');
        toast(`Dossier de ${compName} rejeté.`);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleSuspendCompany = (compId: string, compName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Suspendre la Société de Transport',
      message: `Attention : La suspension administrative de "${compName}" désactivera immédiatement la vente de nouveaux billets et bloquera la publication de départs. Confirmez-vous la suspension ?`,
      confirmLabel: 'Suspendre la société',
      isDangerous: true,
      onConfirm: () => {
        appStore.updateCompanyStatus(compId, 'SUSPENDED');
        logAudit(`Société suspendue : ${compName}`, 'WARNING', 'COMPANY_SUSPENDED');
        toast(`La société ${compName} a été suspendue.`);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleReactivateCompany = (compId: string, compName: string) => {
    setConfirmDialog({
      open: true,
      title: 'Réactiver la Société',
      message: `Confirmez-vous la levée de suspension et la réactivation de "${compName}" ?`,
      confirmLabel: 'Réactiver',
      isDangerous: false,
      onConfirm: () => {
        appStore.updateCompanyStatus(compId, 'ACTIVE');
        logAudit(`Société réactivée : ${compName}`, 'SUCCESS', 'COMPANY_REACTIVATED');
        toast(`La société ${compName} est de nouveau active.`);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleSaveCompanyForm = (e: React.FormEvent) => {
    e.preventDefault();
    const data = companyModal.data;
    
    const candidate: Partial<Company> = {
      id: data.id || `comp_${Date.now()}`,
      name: data.name?.trim(),
      tradeName: data.tradeName?.trim(),
      city: data.city || 'Ouagadougou',
      headquarters: data.headquarters?.trim() || data.city || 'Ouagadougou',
      phone: data.phone?.trim() || '+226 25 00 00 00',
      whatsapp: data.whatsapp?.trim() || '+226 70 00 00 00',
      managerName: data.managerName?.trim() || 'Directeur Général',
      managerEmail: data.managerEmail?.trim() || `${data.tradeName?.toLowerCase().replace(/[^a-z]/g, '') || 'contact'}@transit.bf`,
      managerAccountId: data.managerAccountId,
      status: (data.status as CompanyStatus) || 'ACTIVE'
    };

    const val = DataRelationsService.validateCompany(candidate);
    if (!val.isValid) {
      toast(`Erreur : ${val.errors[0]}`);
      return;
    }

    if (companyModal.mode === 'create') {
      const created = appStore.addCompany({
        name: data.name!.trim(),
        tradeName: data.tradeName!.trim(),
        headquarters: data.headquarters?.trim() || 'Ouagadougou',
        city: data.city || 'Ouagadougou',
        region: data.region || 'Centre',
        country: 'Burkina Faso',
        phone: data.phone?.trim() || '+226 25 00 00 00',
        whatsapp: data.whatsapp?.trim() || '+226 70 00 00 00',
        managerName: data.managerName!.trim(),
        managerEmail: candidate.managerEmail!,
        managerAccountId: data.managerAccountId,
        ifuNumber: data.ifuNumber?.trim() || '00012345X',
        rccmNumber: data.rccmNumber?.trim() || 'BF-OUA-2026-B-0000',
        companyType: data.companyType || 'SARL',
        status: (data.status as CompanyStatus) || 'ACTIVE',
        fleetCount: Number(data.fleetCount) || 1,
        rating: 5.0
      });
      logAudit(`Création société centrale : ${created.tradeName}`, 'SUCCESS', 'COMPANY_APPROVED');
      toast(`Société ${created.tradeName} créée avec succès.`);
    } else if (data.id) {
      appStore.updateCompany(data.id, data);
      logAudit(`Mise à jour société : ${data.tradeName}`, 'SUCCESS', 'COMPANY_UPDATED');
      toast(`Informations de ${data.tradeName} mises à jour.`);
    }

    setCompanyModal({ open: false, mode: 'create', data: {} });
  };

  // ==========================================
  // B. ACTIONS GARES & AGENCES
  // ==========================================
  const handleToggleAgencyStatus = (ag: Station) => {
    const nextStatus: StationStatus = ag.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setConfirmDialog({
      open: true,
      title: `${nextStatus === 'ACTIVE' ? 'Ouvrir' : 'Fermer'} la Gare`,
      message: `Confirmez-vous le basculement de la gare "${ag.name}" en statut ${nextStatus === 'ACTIVE' ? 'ACTIF (ouverte)' : 'INACTIF (fermée)'} ?`,
      confirmLabel: nextStatus === 'ACTIVE' ? 'Activer' : 'Désactiver',
      isDangerous: nextStatus !== 'ACTIVE',
      onConfirm: () => {
        appStore.updateStationStatus(ag.id, nextStatus);
        logAudit(`Gare ${ag.name} basculée en statut ${nextStatus}`, 'SUCCESS', 'STATION_STATUS_CHANGED');
        toast(`Statut de la gare ${ag.name} : ${nextStatus === 'ACTIVE' ? 'Activée' : 'Désactivée'}.`);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleSetAgencyMaintenance = (ag: Station) => {
    setConfirmDialog({
      open: true,
      title: 'Déclarer la Gare en Travaux / Maintenance',
      message: `Voulez-vous déclarer la gare "${ag.name}" en maintenance technique ?`,
      confirmLabel: 'Mettre en maintenance',
      isDangerous: false,
      onConfirm: () => {
        appStore.updateStationStatus(ag.id, 'MAINTENANCE');
        logAudit(`Gare ${ag.name} déclarée en maintenance`, 'WARNING', 'STATION_STATUS_CHANGED');
        toast(`Gare ${ag.name} déclarée en maintenance.`);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleSaveStationForm = (e: React.FormEvent) => {
    e.preventDefault();
    const data = stationModal.data;
    const compId = data.companyId || storeState.companies[0]?.id || 'comp_tsr';
    const supportedList = typeof data.supportedDestinations === 'string'
      ? (data.supportedDestinations as string).split(',').map(s => s.trim()).filter(Boolean)
      : data.supportedDestinations || ['Bobo-Dioulasso', 'Ouagadougou'];

    const candidate: Partial<Station> = {
      id: data.id || `st_${Date.now()}`,
      companyId: compId,
      name: data.name?.trim(),
      city: data.city?.trim() || 'Ouagadougou',
      address: data.address?.trim(),
      phone: data.phone?.trim() || '+226 25 00 00 00',
      latitude: data.latitude !== undefined ? Number(data.latitude) : 12.3686,
      longitude: data.longitude !== undefined ? Number(data.longitude) : -1.5542,
      status: (data.status as StationStatus) || 'ACTIVE'
    };

    const val = DataRelationsService.validateStation(candidate, storeState.companies);
    if (!val.isValid) {
      toast(`Erreur : ${val.errors[0]}`);
      return;
    }

    if (stationModal.mode === 'create') {
      const created = appStore.addStation({
        companyId: compId,
        name: data.name!.trim(),
        city: data.city!.trim(),
        neighborhood: data.neighborhood || data.city!.trim(),
        address: data.address!.trim(),
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        phone: candidate.phone!,
        code: data.code?.trim() || `GARE-${Math.floor(Math.random() * 900 + 100)}`,
        openingHours: data.openingHours || '05h30 - 22h00',
        supportedDestinations: supportedList,
        status: candidate.status!
      });
      logAudit(`Gare créée : ${created.name} (${created.city})`, 'SUCCESS', 'STATION_CREATED');
      toast(`Gare ${created.name} enregistrée avec succès.`);
    } else if (data.id) {
      appStore.updateStation(data.id, {
        ...data,
        companyId: compId,
        supportedDestinations: supportedList,
        latitude: candidate.latitude,
        longitude: candidate.longitude
      });
      logAudit(`Gare mise à jour : ${data.name}`, 'SUCCESS', 'STATION_UPDATED');
      toast(`Gare ${data.name} mise à jour.`);
    }

    setStationModal({ open: false, mode: 'create', data: {} });
  };

  // ==========================================
  // C. ACTIONS LIGNES & TRAJETS
  // ==========================================
  const handleToggleRouteStatus = (r: Trip) => {
    const nextStatus: TripRouteStatus = r.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setConfirmDialog({
      open: true,
      title: `${nextStatus === 'ACTIVE' ? 'Réactiver' : 'Interrompre'} la Ligne`,
      message: `Voulez-vous basculer la liaison ${r.departureCity} → ${r.destinationCity} vers le statut ${nextStatus} ?`,
      confirmLabel: nextStatus === 'ACTIVE' ? 'Réactiver' : 'Interrompre',
      isDangerous: nextStatus !== 'ACTIVE',
      onConfirm: () => {
        appStore.updateRouteStatus(r.id, nextStatus);
        logAudit(`Ligne ${r.departureCity} - ${r.destinationCity} : ${nextStatus}`, 'SUCCESS', 'ROUTE_STATUS_CHANGED');
        toast(`Ligne ${r.departureCity} → ${r.destinationCity} : ${nextStatus === 'ACTIVE' ? 'Active' : 'Suspendue'}.`);
        setConfirmDialog(prev => ({ ...prev, open: false }));
      }
    });
  };

  const handleSaveRouteForm = (e: React.FormEvent) => {
    e.preventDefault();
    const data = routeModal.data;
    const compId = data.companyId || storeState.companies[0]?.id || 'comp_tsr';
    const stopsList = typeof data.stops === 'string'
      ? (data.stops as string).split(',').map(s => s.trim()).filter(Boolean)
      : data.stops || [];

    const candidate: Partial<Trip> = {
      id: data.id || `trip_route_${Date.now()}`,
      companyId: compId,
      departureStationId: data.departureStationId || data.departureAgencyId,
      arrivalStationId: data.arrivalStationId || data.arrivalAgencyId,
      departureCity: data.departureCity?.trim(),
      destinationCity: data.destinationCity?.trim(),
      estimatedDurationMinutes: Number(data.estimatedDurationMinutes) || 300,
      status: (data.status as TripRouteStatus) || 'ACTIVE'
    };

    const val = DataRelationsService.validateTrip(candidate, storeState.agencies, storeState.companies);
    if (!val.isValid) {
      toast(`Erreur : ${val.errors[0]}`);
      return;
    }

    if (routeModal.mode === 'create') {
      const created = appStore.addTripRoute({
        companyId: compId,
        departureStationId: candidate.departureStationId,
        arrivalStationId: candidate.arrivalStationId,
        departureCity: candidate.departureCity!,
        destinationCity: candidate.destinationCity!,
        departureAgencyName: data.departureAgencyName || `Gare ${candidate.departureCity}`,
        arrivalAgencyName: data.arrivalAgencyName || `Gare ${candidate.destinationCity}`,
        distanceKm: Number(data.distanceKm) || 360,
        estimatedDurationMinutes: candidate.estimatedDurationMinutes,
        basePriceXOF: Number(data.basePriceXOF) || 9000,
        stops: stopsList,
        routeDescription: data.routeDescription || '',
        status: candidate.status!
      });
      logAudit(`Ligne créée : ${created.departureCity} -> ${created.destinationCity}`, 'SUCCESS', 'ROUTE_CREATED');
      toast(`Ligne ${created.departureCity} → ${created.destinationCity} créée.`);
    } else if (data.id) {
      appStore.updateRoute(data.id, {
        ...data,
        companyId: compId,
        stops: stopsList,
        distanceKm: Number(data.distanceKm),
        estimatedDurationMinutes: Number(data.estimatedDurationMinutes),
        basePriceXOF: Number(data.basePriceXOF)
      });
      logAudit(`Ligne mise à jour : ${data.departureCity} -> ${data.destinationCity}`, 'SUCCESS', 'ROUTE_UPDATED');
      toast(`Ligne ${data.departureCity} → ${data.destinationCity} mise à jour.`);
    }

    setRouteModal({ open: false, mode: 'create', data: {} });
  };

  // ==========================================
  // D. ACTIONS DÉPARTS & HORAIRES
  // ==========================================
  const handleUpdateTripStatus = (tripId: string, st: ScheduledDepartureStatus, label: string) => {
    if (st === 'CANCELLED') {
      setConfirmDialog({
        open: true,
        title: 'Annuler le Départ Programmé',
        message: 'Êtes-vous certain de vouloir annuler ce départ ? Aucun nouveau billet ne pourra être vendu pour cette occurrence calendaire.',
        confirmLabel: 'Confirmer l’annulation',
        isDangerous: true,
        onConfirm: () => {
          appStore.updateTripStatus(tripId, st);
          logAudit(`Départ ${tripId} annulé`, 'WARNING', 'DEPARTURE_CANCELLED');
          toast(`Départ ${tripId} annulé.`);
          setConfirmDialog(prev => ({ ...prev, open: false }));
        }
      });
      return;
    }

    appStore.updateTripStatus(tripId, st);
    logAudit(`Départ ${tripId} : statut ${st}`, 'SUCCESS', 'TRIP_STATUS_CHANGED');
    toast(`Départ mis à jour : ${label}.`);
  };

  const handleSaveTripForm = (e: React.FormEvent) => {
    e.preventDefault();
    const data = tripModal.data;
    const compId = data.companyId || storeState.companies[0]?.id || 'comp_tsr';
    const totalSeats = Number(data.totalSeats) || 50;
    const priceXOF = Number(data.priceXOF) || 9000;
    const dateStr = data.date || data.departureDate || new Date().toISOString().split('T')[0];

    const targetCompany = storeState.companies.find(c => c.id === compId);
    if ((data.status === 'PUBLISHED' || !data.status) && targetCompany && targetCompany.status !== 'ACTIVE') {
      toast(`Publication interdite : La société ${targetCompany.tradeName} a le statut '${targetCompany.status}'. Seule une société active et agréée peut publier des départs.`);
      return;
    }

    // Check confirmed bookings count if editing
    if (data.id) {
      const confirmedBookings = storeState.bookings.filter(b => (b.tripId === data.id || b.departureTripId === data.id) && b.status === 'CONFIRMED');
      const totalBookedSeats = confirmedBookings.reduce((sum, b) => sum + (b.passengerCount || b.seatIds?.length || 1), 0);
      if (totalSeats < totalBookedSeats) {
        toast(`Erreur capacité : Ce départ compte déjà ${totalBookedSeats} place(s) réservée(s) et confirmée(s). Impossible de réduire la capacité en-dessous.`);
        return;
      }
    }

    const candidate: Partial<ScheduledDeparture> = {
      id: data.id || `dep_${Date.now()}`,
      companyId: compId,
      tripId: data.tripId || data.routeId,
      date: dateStr,
      departureDate: dateStr,
      departureTime: data.departureTime?.trim(),
      arrivalTime: data.arrivalTime?.trim() || '15:00',
      estimatedArrivalTime: data.arrivalTime?.trim() || '15:00',
      vehicleId: data.vehicleId || data.busId,
      busId: data.vehicleId || data.busId,
      seatCapacity: totalSeats,
      totalSeats,
      price: priceXOF,
      priceXOF,
      currency: 'XOF',
      status: (data.status as ScheduledDepartureStatus) || 'PUBLISHED',
      bookingOpeningTime: data.bookingOpeningTime,
      bookingClosingTime: data.bookingClosingTime
    };

    const val = DataRelationsService.validateScheduledDeparture(
      candidate,
      storeState.routes || [],
      storeState.companies,
      storeState.buses || []
    );

    if (!val.isValid) {
      toast(`Erreur : ${val.errors[0]}`);
      return;
    }

    if (tripModal.mode === 'create') {
      const created = appStore.addScheduledDeparture({
        companyId: compId,
        tripId: candidate.tripId,
        routeId: candidate.tripId,
        departureCity: data.departureCity!.trim(),
        destinationCity: data.destinationCity!.trim(),
        departureAgency: data.departureAgency || `Gare Principale ${data.departureCity}`,
        arrivalAgency: data.arrivalAgency || `Gare Centrale ${data.destinationCity}`,
        departureTime: candidate.departureTime!,
        arrivalTime: candidate.arrivalTime!,
        estimatedArrivalTime: candidate.estimatedArrivalTime,
        date: dateStr,
        departureDate: dateStr,
        priceXOF,
        price: priceXOF,
        currency: 'XOF',
        busType: data.busType || 'Car Grand Confort VIP 50 Places',
        vehicleId: candidate.vehicleId,
        busId: candidate.vehicleId,
        amenities: ['Climatisation', 'Wi-Fi 4G', 'Prises USB', 'Eau Fraîche'],
        totalSeats,
        seatCapacity: totalSeats,
        status: candidate.status!,
        bookingOpeningTime: data.bookingOpeningTime,
        bookingClosingTime: data.bookingClosingTime
      });
      logAudit(`Départ planifié : ${created.departureCity} -> ${created.destinationCity} à ${created.departureTime}`, 'SUCCESS', 'DEPARTURE_SCHEDULED');
      toast(`Départ ${created.departureCity} → ${created.destinationCity} planifié avec succès.`);
    } else if (data.id) {
      const oldTrip = storeState.trips.find(t => t.id === data.id);
      if (oldTrip && oldTrip.priceXOF !== priceXOF) {
        DataRelationsService.logPriceChange(
          storeState.currentUser || { id: 'admin', role: 'ADMIN', name: 'Admin', phone: '', status: 'ACTIVE', createdAt: '', updatedAt: '' },
          data.id,
          compId,
          oldTrip.priceXOF,
          priceXOF
        );
      }

      appStore.updateTrip(data.id, {
        ...data,
        priceXOF,
        price: priceXOF,
        totalSeats,
        seatCapacity: totalSeats
      });
      logAudit(`Départ mis à jour : ${data.id}`, 'SUCCESS', 'TRIP_STATUS_CHANGED');
      toast('Départ mis à jour avec maintien des réservations passées.');
    }

    setTripModal({ open: false, mode: 'create', data: {} });
  };
      appStore.updateTrip(data.id, {
        ...data,
        priceXOF: Number(data.priceXOF),
        totalSeats
      });
      logAudit(`Départ mis à jour : ${data.id}`, 'SUCCESS', 'TRIP_STATUS_CHANGED');
      toast('Départ mis à jour.');
    }

    setTripModal({ open: false, mode: 'create', data: {} });
  };

  // ==========================================
  // E. ACTIONS VÉHICULES / FLOTTE
  // ==========================================
  const handleToggleBusStatus = (b: Bus) => {
    const nextStatus = b.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE';
    appStore.updateBusStatus(b.id, nextStatus);
    logAudit(`Véhicule ${b.registrationNumber} statut : ${nextStatus}`, 'SUCCESS', 'BUS_STATUS_CHANGED');
    toast(`Statut du véhicule ${b.registrationNumber} : ${nextStatus}.`);
  };

  const handleSaveBusForm = (e: React.FormEvent) => {
    e.preventDefault();
    const data = busModal.data;
    if (!data.registrationNumber?.trim()) {
      toast('Veuillez renseigner le numéro d’immatriculation.');
      return;
    }

    const compId = data.companyId || storeState.companies[0]?.id || 'comp_tsr';
    const capacity = Number(data.seatCapacity) || 50;

    if (busModal.mode === 'create') {
      const created = appStore.addBus({
        companyId: compId,
        registrationNumber: data.registrationNumber.trim(),
        fleetNumber: data.fleetNumber || `CAR-${Math.floor(Math.random() * 90 + 10)}`,
        brand: data.brand || 'Marcopolo',
        model: data.model || 'Paradiso G8',
        manufactureYear: Number(data.manufactureYear) || 2024,
        seatCapacity: capacity,
        seatLayout: (data.seatLayout as any) || '2x2',
        category: (data.category as any) || 'VIP',
        amenities: ['Climatisation', 'Wi-Fi 4G', 'Prises USB'],
        status: (data.status as BusStatus) || 'ACTIVE'
      });
      logAudit(`Véhicule enregistré : ${created.registrationNumber}`, 'SUCCESS', 'BUS_REGISTERED');
      toast(`Véhicule ${created.registrationNumber} ajouté à la flotte.`);
    } else if (data.id) {
      appStore.updateBus(data.id, {
        ...data,
        seatCapacity: capacity
      });
      logAudit(`Véhicule mis à jour : ${data.registrationNumber}`, 'SUCCESS', 'BUS_STATUS_CHANGED');
      toast(`Véhicule ${data.registrationNumber} mis à jour.`);
    }

    setBusModal({ open: false, mode: 'create', data: {} });
  };

  // ==========================================
  // F. AUTRES ACTIONS (Users, Claims, Export, Settings)
  // ==========================================
  const handleToggleUser = (user: UserProfile) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    appStore.updateUserStatus(user.id, nextStatus as any);
    logAudit(`Statut de ${user.name} basculé à ${nextStatus}`, 'SUCCESS', 'COMPANY_SUSPENDED');
    toast(`Statut de ${user.name} mis à jour (${nextStatus}).`);
  };

  const handleResolveClaim = (claimId: string, claimNum: string) => {
    setClaims(prev => prev.map(c => (c.id === claimId || c.claimNumber === claimNum ? { ...c, status: 'RESOLVED' } : c)));
    logAudit(`Réclamation ${claimNum} résolue`, 'SUCCESS', 'TICKET_BOARDED_SUCCESS');
    toast(`Réclamation ${claimNum} résolue.`);
  };

  const handleSaveSettings = () => {
    logAudit('Paramètres de commission et maintenance modifiés', 'SUCCESS', 'SETTINGS_UPDATED');
    toast('Paramètres enregistrés.');
  };

  const handleExportData = () => {
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      commission,
      seatLockDuration,
      maintenanceMode,
      companies: storeState.companies,
      agencies: storeState.agencies,
      routes: storeState.routes,
      buses: storeState.buses,
      trips: storeState.trips,
      users: storeState.allUsers,
      tickets: storeState.tickets,
      payments: storeState.payments,
      parcels,
      claims,
      audit: AuditService.getAllLogs()
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tsr-transit-export.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Export JSON téléchargé avec succès.');
  };

  // RBAC Access Control Enforcement
  if (storeState.currentUser?.role !== 'ADMIN') {
    return (
      <div className="admin-web-dashboard p-6 flex flex-col items-center justify-center min-h-[600px]">
        <div className="panel max-w-md w-full text-center space-y-4" style={{ padding: '28px' }}>
          <div className="flag mx-auto" style={{ width: '36px', height: '24px' }}></div>
          <div>
            <h1 style={{ fontSize: '20px', marginBottom: '6px' }}>Accès Administrateur Restreint</h1>
            <p style={{ color: 'var(--mut)', fontSize: '13px', margin: 0 }}>
              Cette interface de supervision centrale (Écran 17) requiert le rôle <strong>ADMIN</strong>.
            </p>
          </div>
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)', textAlign: 'left', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: 'var(--mut)' }}>Utilisateur :</span>
              <b>{storeState.currentUser?.name || 'Visiteur'}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--mut)' }}>Rôle actif :</span>
              <span className="chip r">{storeState.currentUser?.role || 'AUCUN'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
            <button
              onClick={() => {
                appStore.loginAsRole('ADMIN');
                toast('Session basculée en Administrateur Central autorisé.');
              }}
              className="btn pri"
              style={{ width: '100%' }}
            >
              S'authentifier comme Administrateur
            </button>
            <button
              onClick={() => appStore.navigateTo('02_PUBLIC_HOME')}
              className="btn"
              style={{ width: '100%' }}
            >
              Retour à l'accueil public
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CALCULS FINANCIERS & STATISTIQUES
  // ==========================================
  const totalEncaisse = storeState.payments.length > 0
    ? storeState.payments.reduce((acc, p) => p.status === 'SUCCESS' ? acc + (p.amountXOF || 0) : acc, 0)
    : 168000;

  const ticketsCount = storeState.tickets.length > 0 ? storeState.tickets.length : 18;

  const byCompany = storeState.payments.reduce((acc, p) => {
    const compName = storeState.companies.find(c => c.id === p.companyId)?.tradeName 
      || (p.companyId === 'comp_tsr' ? 'TSR' : p.companyId === 'comp_rakieta' ? 'Rakieta' : 'TCV');
    acc[compName] = (acc[compName] || 0) + p.amountXOF;
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(byCompany).length === 0) {
    byCompany['TSR Transit'] = 98000;
    byCompany['Rakieta'] = 45000;
    byCompany['TCV Burkina'] = 25000;
  }

  const maxCompanyAmt = Math.max(...Object.values(byCompany), 1);

  const byOperator = storeState.payments.reduce((acc, p) => {
    const op = p.paymentMethod === 'ORANGE_MONEY' ? 'Orange Money' : p.paymentMethod === 'MOOV_MONEY' ? 'Moov Money' : 'Wave';
    acc[op] = (acc[op] || 0) + p.amountXOF;
    return acc;
  }, {} as Record<string, number>);

  if (Object.keys(byOperator).length === 0) {
    byOperator['Orange Money'] = 92000;
    byOperator['Moov Money'] = 46000;
    byOperator['Wave'] = 30000;
  }

  const opColors: Record<string, string> = {
    'Orange Money': '#ff7900',
    'Moov Money': '#005ca9',
    'Wave': '#1dc3f0'
  };

  const auditRows = AuditService.getAllLogs().map(l => ({
    id: l.id,
    at: new Date(l.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    who: l.actorRole === 'ADMIN' ? 'Super Admin' : l.actorRole,
    act: typeof l.details === 'string' ? l.details : l.action,
    s: l.result || 'SUCCESS'
  }));

  const paymentsList = storeState.payments.length > 0
    ? storeState.payments.map(p => ({
        id: p.id,
        ref: p.externalRef || p.id,
        op: p.paymentMethod === 'ORANGE_MONEY' ? 'Orange Money' : p.paymentMethod === 'MOOV_MONEY' ? 'Moov Money' : 'Wave',
        co: storeState.companies.find(c => c.id === p.companyId)?.tradeName || 'TSR',
        amt: p.amountXOF,
        s: p.status
      }))
    : [
        { id: '1', ref: 'OM-2026-9901', op: 'Orange Money', co: 'TSR', amt: 9000, s: 'SUCCESS' },
        { id: '2', ref: 'MM-2026-4402', op: 'Moov Money', co: 'Rakieta', amt: 8500, s: 'SUCCESS' },
        { id: '3', ref: 'WV-2026-1188', op: 'Wave', co: 'TCV', amt: 7000, s: 'SUCCESS' }
      ];

  const renderChip = (s: string) => {
    const entry = LAB[s] || [s, 'm'];
    return <span className={`chip ${entry[1]}`}>{entry[0]}</span>;
  };

  // Helper: company trade name lookup
  const getCompanyTradeName = (companyId: string) => {
    return storeState.companies.find(c => c.id === companyId)?.tradeName || companyId;
  };

  // ==========================================
  // CONFIGURATION DES TABLES PAR ONGLET
  // ==========================================
  const tabConfigs: Record<
    string,
    {
      title: string;
      filterKey: string;
      options: [string, string][];
      columns: [string, string][];
      rows: Record<string, any>[];
      createBtnText?: string;
      onCreate?: () => void;
    }
  > = {
    // 1. SOCIÉTÉS DE TRANSPORT
    companies: {
      title: 'Sociétés de transport interurbain',
      filterKey: 's',
      options: [
        ['ACTIVE', 'Actives'],
        ['PENDING', 'En attente'],
        ['SUSPENDED', 'Suspendues'],
        ['REJECTED', 'Rejetées']
      ],
      columns: [
        ['trade', 'Enseigne'],
        ['name', 'Raison sociale'],
        ['city', 'Siège / Ville'],
        ['mgr', 'Responsable'],
        ['contact', 'Téléphone / WhatsApp'],
        ['fleet', 'Flotte'],
        ['s', 'Statut']
      ],
      rows: storeState.companies.map(c => ({
        id: c.id,
        raw: c,
        trade: c.tradeName,
        name: c.name,
        city: `${c.city || 'Ouagadougou'} (${c.region || 'Centre'})`,
        mgr: `${c.managerName} (${c.managerEmail || 'contact'})`,
        contact: `${c.phone} / ${c.whatsapp}`,
        fleet: `${c.fleetCount || 0} car(s)`,
        s: c.status
      })),
      createBtnText: '+ Nouvelle Société',
      onCreate: () => {
        setCompanyModal({
          open: true,
          mode: 'create',
          data: {
            name: '',
            tradeName: '',
            city: 'Ouagadougou',
            headquarters: 'Gare Routière, Ouagadougou',
            phone: '+226 25 ',
            whatsapp: '+226 70 ',
            managerName: '',
            managerEmail: '',
            managerRole: 'Directeur Général',
            ifuNumber: '000',
            rccmNumber: 'BF-OUA-2026-B-',
            fleetCount: 1,
            status: 'ACTIVE'
          }
        });
      }
    },

    // 2. GARES ET AGENCES
    stations: {
      title: 'Gares routières et agences régionales',
      filterKey: 's',
      options: [
        ['ACTIVE', 'Actives'],
        ['INACTIVE', 'Inactives']
      ],
      columns: [
        ['name', 'Gare / Agence'],
        ['company', 'Société'],
        ['location', 'Ville & Quartier'],
        ['phone', 'Guichet Téléphone'],
        ['gps', 'Coordonnées GPS'],
        ['destinations', 'Destinations desservies'],
        ['s', 'Statut']
      ],
      rows: storeState.agencies.map(a => ({
        id: a.id,
        raw: a,
        name: a.name,
        company: getCompanyTradeName(a.companyId),
        location: `${a.city} · ${a.neighborhood || a.address.slice(0, 20)}`,
        phone: a.phone,
        gps: `${(a.latitude ?? a.lat ?? 12.36).toFixed(4)}°, ${(a.longitude ?? a.lng ?? -1.55).toFixed(4)}°`,
        destinations: a.supportedDestinations?.length 
          ? a.supportedDestinations.slice(0, 3).join(', ') + (a.supportedDestinations.length > 3 ? '...' : '')
          : 'National',
        s: a.status
      })),
      createBtnText: '+ Nouvelle Gare',
      onCreate: () => {
        setStationModal({
          open: true,
          mode: 'create',
          data: {
            companyId: storeState.companies[0]?.id || 'comp_tsr',
            name: '',
            city: 'Ouagadougou',
            neighborhood: '',
            address: '',
            phone: '+226 25 ',
            latitude: 12.3686,
            longitude: -1.5542,
            openingHours: '05h00 - 22h00',
            supportedDestinations: ['Bobo-Dioulasso', 'Ouagadougou'],
            status: 'ACTIVE'
          }
        });
      }
    },

    // 3. LIGNES & TRAJETS INTERURBAINS
    routes: {
      title: 'Lignes et trajets interurbains',
      filterKey: 's',
      options: [
        ['ACTIVE', 'Actives'],
        ['SUSPENDED', 'Suspendues']
      ],
      columns: [
        ['route', 'Liaison'],
        ['company', 'Société opératrice'],
        ['terminals', 'Gares Départ → Arrivée'],
        ['stats', 'Distance & Durée'],
        ['amt', 'Tarif de référence'],
        ['stops', 'Escales intermédiaires'],
        ['s', 'Statut']
      ],
      rows: (storeState.routes || []).map(r => ({
        id: r.id,
        raw: r,
        route: `${r.departureCity} → ${r.destinationCity}`,
        company: getCompanyTradeName(r.companyId),
        terminals: `${r.departureAgencyName || r.departureCity} → ${r.arrivalAgencyName || r.destinationCity}`,
        stats: `${r.distanceKm || 360} km (~${Math.floor((r.estimatedDurationMinutes || 300) / 60)}h${(r.estimatedDurationMinutes || 300) % 60 ? (r.estimatedDurationMinutes || 300) % 60 + 'm' : ''})`,
        amt: r.basePriceXOF || 9000,
        stops: r.stops?.length ? r.stops.join(', ') : 'Direct sans escale',
        s: r.status
      })),
      createBtnText: '+ Nouvelle Ligne',
      onCreate: () => {
        setRouteModal({
          open: true,
          mode: 'create',
          data: {
            companyId: storeState.companies[0]?.id || 'comp_tsr',
            departureCity: 'Ouagadougou',
            destinationCity: 'Bobo-Dioulasso',
            departureAgencyName: 'Gare Centrale Gounghin',
            arrivalAgencyName: 'Gare Principale Farakan',
            distanceKm: 365,
            estimatedDurationMinutes: 315,
            basePriceXOF: 9000,
            stops: ['Sabou', 'Boromo', 'Houndé'],
            status: 'ACTIVE'
          }
        });
      }
    },

    // 4. HORAIRES & DÉPARTS
    trips: {
      title: 'Horaires et départs programmés',
      filterKey: 's',
      options: [
        ['SCHEDULED', 'Programmés'],
        ['PUBLISHED', 'Publiés'],
        ['BOARDING', 'Embarquement'],
        ['DEPARTED', 'Partis'],
        ['CANCELLED', 'Annulés']
      ],
      columns: [
        ['co', 'Société'],
        ['route', 'Trajet'],
        ['time', 'Date & Horaires'],
        ['bus', 'Véhicule assigné'],
        ['seats', 'Places dispo'],
        ['amt', 'Tarif (FCFA)'],
        ['s', 'Statut']
      ],
      rows: storeState.trips.map(t => ({
        id: t.id,
        raw: t,
        co: getCompanyTradeName(t.companyId),
        route: `${t.departureCity} → ${t.destinationCity}`,
        time: `${t.date || 'Aujourd’hui'} à ${t.departureTime} (Arrivée ~${t.arrivalTime})`,
        bus: t.busType,
        seats: `${t.availableSeatsCount ?? t.totalSeats} / ${t.totalSeats}`,
        amt: t.priceXOF,
        s: t.status
      })),
      createBtnText: '+ Planifier Départ',
      onCreate: () => {
        setTripModal({
          open: true,
          mode: 'create',
          data: {
            companyId: storeState.companies[0]?.id || 'comp_tsr',
            departureCity: 'Ouagadougou',
            destinationCity: 'Bobo-Dioulasso',
            departureAgency: 'Gare Centrale TSR Gounghin',
            arrivalAgency: 'Gare Principale TSR Farakan',
            departureTime: '07:00',
            arrivalTime: '12:15',
            date: new Date().toISOString().split('T')[0],
            priceXOF: 9000,
            busType: 'Car Marcopolo Paradiso VIP (50 places)',
            totalSeats: 50
          }
        });
      }
    },

    // 5. FLOTTE DE VÉHICULES
    vehicles: {
      title: 'Flotte de véhicules interurbains',
      filterKey: 's',
      options: [
        ['ACTIVE', 'En service'],
        ['MAINTENANCE', 'En maintenance'],
        ['INACTIVE', 'À l’arrêt']
      ],
      columns: [
        ['plate', 'Immatriculation'],
        ['fleet', 'N° Parc'],
        ['company', 'Société'],
        ['model', 'Marque & Modèle'],
        ['seats', 'Capacité'],
        ['cat', 'Catégorie'],
        ['s', 'Statut']
      ],
      rows: (storeState.buses || []).map(b => ({
        id: b.id,
        raw: b,
        plate: b.registrationNumber,
        fleet: b.fleetNumber,
        company: getCompanyTradeName(b.companyId),
        model: `${b.brand} ${b.model} (${b.manufactureYear || 2024})`,
        seats: `${b.seatCapacity} sièges (${b.seatLayout})`,
        cat: b.category,
        s: b.status
      })),
      createBtnText: '+ Nouveau Véhicule',
      onCreate: () => {
        setBusModal({
          open: true,
          mode: 'create',
          data: {
            companyId: storeState.companies[0]?.id || 'comp_tsr',
            registrationNumber: '11-JJ-',
            fleetNumber: 'CAR-',
            brand: 'Marcopolo',
            model: 'Paradiso G8 1200 HD',
            manufactureYear: 2024,
            seatCapacity: 50,
            seatLayout: '2x2',
            category: 'VIP',
            status: 'ACTIVE'
          }
        });
      }
    },

    // 6. UTILISATEURS
    users: {
      title: 'Comptes et annuaire utilisateurs',
      filterKey: 's',
      options: [
        ['ACTIVE', 'Actifs'],
        ['SUSPENDED', 'Suspendus']
      ],
      columns: [
        ['name', 'Nom complet'],
        ['role', 'Rôle'],
        ['tel', 'Téléphone'],
        ['mail', 'Email'],
        ['s', 'Statut']
      ],
      rows: storeState.allUsers.map(u => ({
        id: u.id,
        rawUser: u,
        name: u.name,
        role: u.role,
        tel: u.phone,
        mail: u.email || '—',
        s: u.status
      }))
    },

    // 7. BILLETS ÉMIS
    tickets: {
      title: 'Billets électroniques et QR codes',
      filterKey: 's',
      options: [
        ['VALID', 'Valides'],
        ['USED', 'Utilisés'],
        ['CANCELLED', 'Annulés']
      ],
      columns: [
        ['code', 'Code Billet'],
        ['pax', 'Passager'],
        ['route', 'Liaison'],
        ['seat', 'Siège(s)'],
        ['s', 'Statut']
      ],
      rows: storeState.tickets.map(t => ({
        id: t.id,
        code: t.ticketNumber,
        pax: t.passengerName,
        route: `${t.departureCity.slice(0, 7)} → ${t.destinationCity.slice(0, 7)}`,
        seat: t.seatNumbers ? t.seatNumbers.join(', ') : '14',
        s: t.status
      }))
    },

    // 8. PAIEMENTS
    payments: {
      title: 'Transactions Mobile Money',
      filterKey: 'op',
      options: [
        ['Orange Money', 'Orange Money'],
        ['Moov Money', 'Moov Money'],
        ['Wave', 'Wave']
      ],
      columns: [
        ['ref', 'Référence'],
        ['op', 'Opérateur'],
        ['co', 'Société'],
        ['amt', 'Montant (FCFA)'],
        ['s', 'Statut']
      ],
      rows: paymentsList
    },

    // 9. COLIS & FRET
    parcels: {
      title: 'Colis et fret interurbain',
      filterKey: 's',
      options: [
        ['REGISTERED', 'Enregistrés'],
        ['TRANSIT', 'En transit'],
        ['DELIVERED', 'Livrés']
      ],
      columns: [
        ['code', 'Lettre de voiture'],
        ['route', 'Trajet'],
        ['kg', 'Poids (kg)'],
        ['s', 'Statut']
      ],
      rows: parcels.map(p => ({
        id: p.id,
        code: p.trackingNumber,
        route: `${(p.originAgencyName || 'Ouaga').replace('Agence ', '').slice(0, 7)} → ${(p.destinationAgencyName || 'Bobo').replace('Agence ', '').slice(0, 7)}`,
        kg: p.weightKg,
        s: p.status === 'LOADED' || p.status === 'IN_TRANSIT' ? 'TRANSIT' : p.status
      }))
    },

    // 10. RÉCLAMATIONS
    claims: {
      title: 'Réclamations passagers et support',
      filterKey: 's',
      options: [
        ['OPEN', 'Ouvertes'],
        ['RESOLVED', 'Résolues']
      ],
      columns: [
        ['id', 'N° Dossier'],
        ['who', 'Voyageur'],
        ['subj', 'Objet'],
        ['s', 'Statut']
      ],
      rows: claims.map(c => ({
        id: c.claimNumber || c.id,
        rawClaim: c,
        who: c.travelerName,
        subj: c.subject,
        s: c.status === 'SUBMITTED' || c.status === 'IN_REVIEW' ? 'OPEN' : 'RESOLVED'
      }))
    },

    // 11. SÉCURITÉ ET AUDIT
    audit: {
      title: 'Journal d’audit inaltérable',
      filterKey: 's',
      options: [
        ['SUCCESS', 'Succès'],
        ['WARNING', 'Alertes'],
        ['FAILURE', 'Échecs']
      ],
      columns: [
        ['at', 'Horodatage UTC'],
        ['who', 'Acteur'],
        ['act', 'Opération tracée'],
        ['s', 'Résultat']
      ],
      rows: auditRows
    }
  };

  const currentTabConfig = tabConfigs[activeTab];

  // Filtered rows for active table view
  const filteredTableRows = useMemo(() => {
    if (!currentTabConfig) return [];
    const q = searchQuery.toLowerCase().trim();
    return currentTabConfig.rows.filter(r => {
      const matchFilter = !filterValue || r[currentTabConfig.filterKey] === filterValue;
      const matchQuery = !q || Object.values(r).join(' ').toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });
  }, [currentTabConfig, searchQuery, filterValue]);

  return (
    <div className="admin-web-dashboard">
      <div className="app">
        {/* Navigation Sidebar */}
        <aside>
          <div className="brand">
            <span className="flag"></span>
            <div>
              TSR Transit
              <small>Administration centrale</small>
            </div>
          </div>
          <nav aria-label="Sections">
            {NAV_ITEMS.map(([k, l]) => {
              const n = getTabBadge(k);
              const isCurrent = activeTab === k;
              return (
                <button
                  key={k}
                  data-tab={k}
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => handleTabChange(k)}
                >
                  <span>{l}</span>
                  {n > 0 && <span className="n">{n}</span>}
                </button>
              );
            })}
          </nav>

          {/* Raccourcis vers les autres écrans de l'application */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#9fb0cf', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '8px' }}>
              Réseau &amp; Écrans Liés
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                className="btn"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '11px', textAlign: 'left', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                onClick={() => appStore.navigateTo('18_REGISTER_COMPANY')}
                title="Accéder au formulaire de candidature société"
              >
                🏢 Écran 18 : Formulaire Société
              </button>
              <button
                className="btn"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '11px', textAlign: 'left', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                onClick={() => appStore.navigateTo('26_AGENCIES_MAP')}
                title="Consulter la carte des agences et gares"
              >
                📍 Écran 26 : Carte des Gares
              </button>
              <button
                className="btn"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '11px', textAlign: 'left', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                onClick={() => appStore.navigateTo('25_SCHEDULES_CALENDAR')}
                title="Consulter le calendrier voyageur des départs"
              >
                🕒 Écran 25 : Calendrier Départs
              </button>
              <button
                className="btn"
                style={{ background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', fontSize: '11px', textAlign: 'left', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer' }}
                onClick={() => appStore.navigateTo('33_OPERATIONAL_REPORTS')}
                title="Rapports d'activité consolidés"
              >
                📊 Écran 33 : Rapports &amp; Stats
              </button>
            </div>
          </div>

          {/* Admin User Session Footer */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#2563c4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                SA
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {storeState.currentUser?.name || 'Super Admin'}
                </div>
                <div style={{ color: '#38bdf8', fontSize: '10px' }}>
                  Rôle ADMIN (Actif)
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => appStore.toggleMobileFrame()}
                style={{ flex: 1, padding: '5px', fontSize: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                title="Basculer entre la vue Mobile et Web"
              >
                {storeState.isMobileFrame ? 'Vue Plein Écran' : 'Vue Mobile'}
              </button>
              <button
                onClick={() => appStore.loginAsRole('TRAVELER')}
                style={{ flex: 1, padding: '5px', fontSize: '10px', background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', cursor: 'pointer' }}
                title="Revenir au profil voyageur"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main>
          {/* Maintenance Mode Banner */}
          {maintenanceMode && (
            <div className="banner">
              Mode maintenance actif : les réservations et paiements publics sont suspendus.
            </div>
          )}

          {/* Header with Title and Search/Filter Tools */}
          <header>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--mut)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                TSR Transit • Supervision Centrale
              </div>
              <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>
                  {activeTab === 'overview'
                    ? 'Vue générale'
                    : activeTab === 'settings'
                    ? 'Paramètres système'
                    : currentTabConfig?.title || 'Administration'}
                </span>
                {currentTabConfig && (
                  <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--mut)', background: '#e2e8f0', padding: '2px 8px', borderRadius: '12px' }}>
                    {filteredTableRows.length} enreg.
                  </span>
                )}
              </h1>
              <p style={{ margin: '4px 0 0', color: 'var(--mut)', fontSize: '12px' }}>
                Plateforme officielle d'interconnexion des transporteurs interurbains du Burkina Faso
              </p>
            </div>

            <div className="tools">
              {currentTabConfig && (
                <>
                  <input
                    type="search"
                    placeholder="Rechercher..."
                    aria-label="Rechercher"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  <select
                    aria-label="Filtrer"
                    value={filterValue}
                    onChange={e => setFilterValue(e.target.value)}
                  >
                    <option value="">Tous les statuts</option>
                    {currentTabConfig.options.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>

                  {/* Create Button per tab if available */}
                  {currentTabConfig.createBtnText && currentTabConfig.onCreate && (
                    <button
                      className="btn pri"
                      onClick={currentTabConfig.onCreate}
                      title={currentTabConfig.createBtnText}
                    >
                      {currentTabConfig.createBtnText}
                    </button>
                  )}
                </>
              )}

              <button
                className="btn"
                onClick={() => appStore.toggleMobileFrame()}
                title="Basculer entre la vue Mobile et Web Large"
              >
                {storeState.isMobileFrame ? 'Plein Écran Web' : 'Vue Mobile'}
              </button>

              <button
                className="btn"
                onClick={() => appStore.navigateTo('02_PUBLIC_HOME')}
                title="Retour vers l'application publique"
              >
                Accueil public
              </button>
            </div>
          </header>

          {/* Tab Views */}
          <section id="view">
            {/* 1. VUE GÉNÉRALE */}
            {activeTab === 'overview' && (
              <>
                <div className="panel kpis">
                  <div className="kpi">
                    <b>{fmt(totalEncaisse)}</b>
                    <span>FCFA encaissés</span>
                  </div>
                  <div className="kpi">
                    <b>{ticketsCount}</b>
                    <span>Billets émis</span>
                  </div>
                  <div className="kpi">
                    <b>
                      {storeState.companies.filter(c => c.status === 'ACTIVE').length} /{' '}
                      {storeState.companies.length}
                    </b>
                    <span>Sociétés actives</span>
                  </div>
                  <div className="kpi">
                    <b>{openClaimsCount}</b>
                    <span>Réclamations ouvertes</span>
                  </div>
                </div>

                <div className="cols">
                  {/* Left Column: Bars & Operator Stacks */}
                  <div className="panel">
                    <h2>Encaissements par société</h2>
                    {Object.entries(byCompany)
                      .sort((a, b) => b[1] - a[1])
                      .map(([co, amt]) => (
                        <div key={co} className="bar">
                          <span>{co}</span>
                          <div className="track">
                            <div
                              className="fill"
                              style={{ width: `${(amt / maxCompanyAmt) * 100}%` }}
                            ></div>
                          </div>
                          <b>{fmt(amt)}</b>
                        </div>
                      ))}

                    <h2 style={{ marginTop: '20px' }}>Répartition par opérateur</h2>
                    <div className="stack">
                      {Object.entries(byOperator).map(([op, amt]) => (
                        <div
                          key={op}
                          style={{
                            width: `${totalEncaisse > 0 ? (amt / totalEncaisse) * 100 : 33.3}%`,
                            background: opColors[op] || '#0f2c59'
                          }}
                          title={`${op}: ${fmt(amt)} FCFA`}
                        ></div>
                      ))}
                    </div>
                    <div className="leg">
                      {Object.entries(byOperator).map(([op, amt]) => (
                        <span key={op}>
                          <i style={{ background: opColors[op] || '#0f2c59' }}></i>
                          {op} {totalEncaisse > 0 ? Math.round((amt / totalEncaisse) * 100) : 0} %
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Latest Audit Activity & Network overview */}
                  <div className="panel">
                    <h2>Dernière activité d'audit</h2>
                    {auditRows.slice(0, 6).map(a => (
                      <div key={a.id} className="row">
                        <div>
                          <b>{a.act}</b>
                          <p>
                            {a.at} · {a.who}
                          </p>
                        </div>
                        {renderChip(a.s)}
                      </div>
                    ))}

                    <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--line)' }}>
                      <h2>Réseau en direct</h2>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                          <span style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>Gares ouvertes</span>
                          <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>{activeStationsCount}</strong>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                          <span style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>Lignes interurbaines</span>
                          <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>{activeRoutesCount}</strong>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                          <span style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>Départs programmés</span>
                          <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>{scheduledTripsCount}</strong>
                        </div>
                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                          <span style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>Véhicules actifs</span>
                          <strong style={{ fontSize: '16px', color: 'var(--navy)' }}>
                            {storeState.buses?.filter(b => b.status === 'ACTIVE').length || 0}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* 2. PARAMÈTRES */}
            {activeTab === 'settings' && (
              <div className="panel">
                <div className="row">
                  <div>
                    <b>Commission de la plateforme</b>
                    <p>Pourcentage officiel prélevé sur chaque billet vendu via la plateforme.</p>
                  </div>
                  <span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={commission}
                      onChange={e => setCommission(parseFloat(e.target.value) || 0)}
                      style={{ width: '80px' }}
                    />{' '}
                    %
                  </span>
                </div>

                <div className="row">
                  <div>
                    <b>Durée de verrouillage d’un siège</b>
                    <p>Délai légal accordé au voyageur pour payer via Mobile Money avant libération du siège.</p>
                  </div>
                  <span>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={seatLockDuration}
                      onChange={e => setSeatLockDuration(parseInt(e.target.value, 10) || 10)}
                      style={{ width: '80px' }}
                    />{' '}
                    min
                  </span>
                </div>

                <div className="row">
                  <div>
                    <b>Mode maintenance</b>
                    <p>Suspend temporairement les réservations publiques en préservant l'accès administrateur.</p>
                  </div>
                  <input
                    type="checkbox"
                    className="sw"
                    aria-label="Mode maintenance"
                    checked={maintenanceMode}
                    onChange={e => setMaintenanceMode(e.target.checked)}
                  />
                </div>

                <div className="row">
                  <div>
                    <b>Exporter les données complètes</b>
                    <p>Télécharge l'intégralité du registre central (sociétés, gares, lignes, départs, billets, audit) au format JSON.</p>
                  </div>
                  <button className="btn" onClick={handleExportData}>
                    Exporter JSON
                  </button>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <button className="btn pri" onClick={handleSaveSettings}>
                    Enregistrer les paramètres
                  </button>
                </div>
              </div>
            )}

            {/* 3. TABLES DYNAMIQUES (Sociétés, Gares, Lignes, Départs, Flotte, Users, etc.) */}
            {currentTabConfig && (
              <>
                {/* Contextual notification / shortcut banner */}
                {activeTab === 'companies' && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#1e40af' }}>
                    <div>
                      <strong>Transporteurs &amp; Candidatures :</strong> Gestion des compagnies agréées du Burkina Faso. Les gérants peuvent également postuler via le portail public.
                    </div>
                    <button
                      className="btn"
                      onClick={() => appStore.navigateTo('18_REGISTER_COMPANY')}
                      style={{ whiteSpace: 'nowrap', fontWeight: 600, background: '#fff', borderColor: '#93c5fd', color: '#1d4ed8' }}
                    >
                      Ouvrir Écran 18 &rarr;
                    </button>
                  </div>
                )}

                {activeTab === 'stations' && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#166534' }}>
                    <div>
                      <strong>Gares &amp; Agences Régionales :</strong> Réseau physique de guichets et coordonnées GPS. Retrouvez la carte interactive complète sur l'Écran 26.
                    </div>
                    <button
                      className="btn"
                      onClick={() => appStore.navigateTo('26_AGENCIES_MAP')}
                      style={{ whiteSpace: 'nowrap', fontWeight: 600, background: '#fff', borderColor: '#86efac', color: '#15803d' }}
                    >
                      Ouvrir Écran 26 (Carte) &rarr;
                    </button>
                  </div>
                )}

                {activeTab === 'trips' && (
                  <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#854d0e' }}>
                    <div>
                      <strong>Départs &amp; Horaires :</strong> Gestion des départs quotidiens et des places disponibles. Retrouvez l'affichage public passager sur l'Écran 25.
                    </div>
                    <button
                      className="btn"
                      onClick={() => appStore.navigateTo('25_SCHEDULES_CALENDAR')}
                      style={{ whiteSpace: 'nowrap', fontWeight: 600, background: '#fff', borderColor: '#fde047', color: '#a16207' }}
                    >
                      Ouvrir Écran 25 (Calendrier) &rarr;
                    </button>
                  </div>
                )}

                {activeTab === 'routes' && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '12px', color: '#334155' }}>
                    <strong>Lignes &amp; Liaisons Interurbaines :</strong> Tarifs réglementés scellés en FCFA. Tout changement tarifaire est tracé dans le journal d'audit inaltérable.
                  </div>
                )}

                <div className="panel tw">
                  {filteredTableRows.length > 0 ? (
                    <table>
                    <thead>
                      <tr>
                        {currentTabConfig.columns.map(([_, title]) => (
                          <th key={title}>{title}</th>
                        ))}
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTableRows.map((row, idx) => (
                        <tr key={row.id || idx}>
                          {currentTabConfig.columns.map(([colKey]) => {
                            if (colKey === 's') {
                              return <td key={colKey}>{renderChip(row.s)}</td>;
                            }
                            if (colKey === 'amt') {
                              return <td key={colKey}>{fmt(row[colKey])} FCFA</td>;
                            }
                            return <td key={colKey}>{row[colKey]}</td>;
                          })}

                          {/* Actions spécifiques par onglet */}
                          <td>
                            {/* SOCIÉTÉS */}
                            {activeTab === 'companies' && (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                <button
                                  className="btn"
                                  onClick={() => setCompanyDetailModal({ open: true, company: row.raw })}
                                  title="Consulter le profil détaillé et le réseau de la société"
                                >
                                  Détails
                                </button>
                                <button
                                  className="btn"
                                  onClick={() => setCompanyModal({ open: true, mode: 'edit', data: row.raw })}
                                  title="Modifier les informations de la société"
                                >
                                  Modifier
                                </button>
                                {row.s === 'PENDING' && (
                                  <>
                                    <button
                                      className="btn ok"
                                      onClick={() => handleApproveCompany(row.id, row.trade || row.name)}
                                    >
                                      Approuver
                                    </button>
                                    <button
                                      className="btn no"
                                      onClick={() => handleRejectCompany(row.id, row.trade || row.name)}
                                    >
                                      Rejeter
                                    </button>
                                  </>
                                )}
                                {row.s === 'ACTIVE' && (
                                  <button
                                    className="btn no"
                                    onClick={() => handleSuspendCompany(row.id, row.trade || row.name)}
                                  >
                                    Suspendre
                                  </button>
                                )}
                                {row.s === 'SUSPENDED' && (
                                  <button
                                    className="btn ok"
                                    onClick={() => handleReactivateCompany(row.id, row.trade || row.name)}
                                  >
                                    Réactiver
                                  </button>
                                )}
                              </div>
                            )}

                            {/* GARES & AGENCES */}
                            {activeTab === 'stations' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn"
                                  onClick={() => setStationDetailModal({ open: true, station: row.raw })}
                                  title="Voir localisation GPS et carte"
                                >
                                  Carte &amp; Info
                                </button>
                                <button
                                  className="btn"
                                  onClick={() => setStationModal({ open: true, mode: 'edit', data: row.raw })}
                                >
                                  Modifier
                                </button>
                                <button
                                  className={`btn ${row.s === 'ACTIVE' ? 'no' : 'ok'}`}
                                  onClick={() => handleToggleAgencyStatus(row.raw)}
                                >
                                  {row.s === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                                </button>
                              </div>
                            )}

                            {/* LIGNES & TRAJETS */}
                            {activeTab === 'routes' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn"
                                  onClick={() => setRouteModal({ open: true, mode: 'edit', data: row.raw })}
                                >
                                  Modifier
                                </button>
                                <button
                                  className={`btn ${row.s === 'ACTIVE' ? 'no' : 'ok'}`}
                                  onClick={() => handleToggleRouteStatus(row.raw)}
                                >
                                  {row.s === 'ACTIVE' ? 'Suspendre' : 'Activer'}
                                </button>
                              </div>
                            )}

                            {/* HORAIRES & DÉPARTS */}
                            {activeTab === 'trips' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn"
                                  onClick={() => setTripModal({ open: true, mode: 'edit', data: row.raw })}
                                >
                                  Modifier
                                </button>
                                {row.s === 'SCHEDULED' && (
                                  <button
                                    className="btn ok"
                                    onClick={() => handleUpdateTripStatus(row.id, 'BOARDING', 'Embarquement en cours')}
                                  >
                                    Embarquement
                                  </button>
                                )}
                                {row.s === 'BOARDING' && (
                                  <button
                                    className="btn ok"
                                    onClick={() => handleUpdateTripStatus(row.id, 'DEPARTED', 'Départ validé')}
                                  >
                                    Départ
                                  </button>
                                )}
                                {row.s !== 'CANCELLED' && row.s !== 'DEPARTED' && row.s !== 'COMPLETED' && (
                                  <button
                                    className="btn no"
                                    onClick={() => handleUpdateTripStatus(row.id, 'CANCELLED', 'Départ annulé')}
                                  >
                                    Annuler
                                  </button>
                                )}
                              </div>
                            )}

                            {/* VÉHICULES / FLOTTE */}
                            {activeTab === 'vehicles' && (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  className="btn"
                                  onClick={() => setBusModal({ open: true, mode: 'edit', data: row.raw })}
                                >
                                  Modifier
                                </button>
                                <button
                                  className={`btn ${row.s === 'ACTIVE' ? 'no' : 'ok'}`}
                                  onClick={() => handleToggleBusStatus(row.raw)}
                                >
                                  {row.s === 'ACTIVE' ? 'Mettre en maintenance' : 'Remettre en service'}
                                </button>
                              </div>
                            )}

                            {/* UTILISATEURS */}
                            {activeTab === 'users' && (
                              <button
                                className={`btn ${row.s === 'ACTIVE' ? 'no' : 'ok'}`}
                                onClick={() => handleToggleUser(row.rawUser)}
                              >
                                {row.s === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
                              </button>
                            )}

                            {/* RÉCLAMATIONS */}
                            {activeTab === 'claims' && (
                              <>
                                {row.s === 'OPEN' ? (
                                  <button
                                    className="btn ok"
                                    onClick={() => handleResolveClaim(row.rawClaim?.id, row.id)}
                                  >
                                    Marquer résolue
                                  </button>
                                ) : (
                                  <span style={{ color: 'var(--mut)', fontSize: '12px' }}>Traitée</span>
                                )}
                              </>
                            )}

                            {/* BILLETS, PAIEMENTS, PARCELS, AUDIT */}
                            {['tickets', 'payments', 'parcels', 'audit'].includes(activeTab) && (
                              <span style={{ color: 'var(--mut)', fontSize: '12px' }}>Consultation seule</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty">
                    Aucun enregistrement ne correspond aux critères de recherche ou au filtre.
                  </div>
                )}
              </div>
            </>
          )}
        </section>
        </main>
      </div>

      {/* =========================================================================
          MODALS DE GESTION
          ========================================================================= */}

      {/* 1. MODAL AJOUT / MODIFICATION SOCIÉTÉ */}
      {companyModal.open && (
        <div className="modal-backdrop" onClick={() => setCompanyModal(prev => ({ ...prev, open: false }))}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {companyModal.mode === 'create'
                  ? 'Ajouter une société de transport'
                  : `Modifier la société : ${companyModal.data.tradeName || companyModal.data.name}`}
              </h3>
              <button
                className="btn"
                onClick={() => setCompanyModal(prev => ({ ...prev, open: false }))}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveCompanyForm}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nom officiel / Raison sociale *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: TSR TRANSIT BURKINA SARL"
                      value={companyModal.data.name || ''}
                      onChange={e => setCompanyModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Enseigne commerciale *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: TSR Transit"
                      value={companyModal.data.tradeName || ''}
                      onChange={e => setCompanyModal(prev => ({ ...prev, data: { ...prev.data, tradeName: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ville du siège *</label>
                    <select
                      value={companyModal.data.city || 'Ouagadougou'}
                      onChange={e => setCompanyModal(prev => ({ ...prev, data: { ...prev.data, city: e.target.value } }))}
                    >
                      {BURKINA_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Adresse physique du siège</label>
                    <input
                      type="text"
                      placeholder="Ex: Gare Routière Internationale, Secteur 28"
                      value={companyModal.data.headquarters || ''}
                      onChange={e => setCompanyModal(prev => ({ ...prev, data: { ...prev.data, headquarters: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Téléphone officiel *</label>
                    <input
                      type="text"
                      placeholder="+226 25 36 20 20"
                      value={companyModal.data.phone || ''}
                      onChange={e => setCompanyModal(prev => ({ ...prev, data: { ...prev.data, phone: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp assistance</label>
                    <input
                      type="text"
                      placeholder="+226 70 20 20 20"
                      value={companyModal.data.whatsapp || ''}
                      onChange={e => setCompanyModal(prev => ({ ...prev, data: { ...prev.data, whatsapp: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nom du responsable légal *</label>
                    <input
                      type="text"
                      placeholder="Ex: Jean-Pierre Yaméogo"
                      value={companyModal.data.managerName || ''}
                      onChange={e => setCompanyModal(prev => ({ ...prev, data: { ...prev.data, managerName: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email du responsable</label>
                    <input
                      type="email"
                      placeholder="direction@compagnie.bf"
                      value={companyModal.data.managerEmail || ''}
                      onChange={e => setCompanyModal(prev => ({ ...prev, data: { ...prev.data, managerEmail: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Numéro IFU fiscal</label>
                    <input
                      type="text"
                      placeholder="Ex: 00045612X"
                      value={companyModal.data.ifuNumber || ''}
                      onChange={e => setCompanyModal(prev => ({ ...prev, data: { ...prev.data, ifuNumber: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Numéro RCCM</label>
                    <input
                      type="text"
                      placeholder="Ex: BF-OUA-2021-B-1120"
                      value={companyModal.data.rccmNumber || ''}
                      onChange={e => setCompanyModal(prev => ({ ...prev, data: { ...prev.data, rccmNumber: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Taille de la flotte (véhicules)</label>
                    <input
                      type="number"
                      min="1"
                      value={companyModal.data.fleetCount ?? 1}
                      onChange={e => setCompanyModal(prev => ({ ...prev, data: { ...prev.data, fleetCount: Number(e.target.value) } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Statut d'agrément</label>
                    <select
                      value={companyModal.data.status || 'ACTIVE'}
                      onChange={e => setCompanyModal(prev => ({ ...prev, data: { ...prev.data, status: e.target.value as CompanyStatus } }))}
                    >
                      <option value="ACTIVE">ACTIVE (Agréée et en service)</option>
                      <option value="PENDING">PENDING (En cours d'instruction)</option>
                      <option value="SUSPENDED">SUSPENDED (Suspendue)</option>
                      <option value="REJECTED">REJECTED (Rejetée)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setCompanyModal(prev => ({ ...prev, open: false }))}
                >
                  Annuler
                </button>
                <button type="submit" className="btn pri">
                  {companyModal.mode === 'create' ? 'Créer la société' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL DÉTAILS SOCIÉTÉ (CONSULTER LE RÉSEAU ASSOCIÉ) */}
      {companyDetailModal.open && companyDetailModal.company && (
        <div className="modal-backdrop" onClick={() => setCompanyDetailModal({ open: false, company: null })}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Fiche Détaillée : {companyDetailModal.company.tradeName}</h3>
              <button
                className="btn"
                onClick={() => setCompanyDetailModal({ open: false, company: null })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px' }}>{companyDetailModal.company.name}</h4>
                  <p style={{ margin: '3px 0 0', color: 'var(--mut)', fontSize: '12px' }}>
                    ID: <code>{companyDetailModal.company.id}</code> • IFU: {companyDetailModal.company.ifuNumber || 'Non renseigné'} • RCCM: {companyDetailModal.company.rccmNumber || 'Non renseigné'}
                  </p>
                </div>
                {renderChip(companyDetailModal.company.status)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>Siège & Ville</span>
                  <b>{companyDetailModal.company.headquarters || companyDetailModal.company.city}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>Contact Direction</span>
                  <b>{companyDetailModal.company.phone} / {companyDetailModal.company.whatsapp}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>Responsable agréé</span>
                  <b>{companyDetailModal.company.managerName} ({companyDetailModal.company.managerEmail})</b>
                </div>
                <div>
                  <span style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>Flotte déclarée</span>
                  <b>{companyDetailModal.company.fleetCount} autocar(s)</b>
                </div>
              </div>

              {/* Gares rattachées */}
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ fontSize: '13px', borderBottom: '1px solid var(--line)', paddingBottom: '4px', margin: '0 0 8px' }}>
                  Gares et agences rattachées ({storeState.agencies.filter(a => a.companyId === companyDetailModal.company?.id).length})
                </h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {storeState.agencies
                    .filter(a => a.companyId === companyDetailModal.company?.id)
                    .map(a => (
                      <span key={a.id} className="badge-count" style={{ padding: '4px 10px' }}>
                        📍 {a.name} ({a.city})
                      </span>
                    ))}
                  {storeState.agencies.filter(a => a.companyId === companyDetailModal.company?.id).length === 0 && (
                    <span style={{ color: 'var(--mut)', fontSize: '12px' }}>Aucune gare encore enregistrée pour cette société.</span>
                  )}
                </div>
              </div>

              {/* Lignes & Départs opérés */}
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ fontSize: '13px', borderBottom: '1px solid var(--line)', paddingBottom: '4px', margin: '0 0 8px' }}>
                  Liaisons et départs actifs ({storeState.trips.filter(t => t.companyId === companyDetailModal.company?.id).length})
                </h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {storeState.trips
                    .filter(t => t.companyId === companyDetailModal.company?.id)
                    .map(t => (
                      <span key={t.id} className="badge-count" style={{ padding: '4px 10px' }}>
                        🚌 {t.departureCity} → {t.destinationCity} ({t.departureTime})
                      </span>
                    ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn"
                onClick={() => {
                  const comp = companyDetailModal.company;
                  setCompanyDetailModal({ open: false, company: null });
                  if (comp) setCompanyModal({ open: true, mode: 'edit', data: comp });
                }}
              >
                Modifier cette société
              </button>
              <button
                className="btn pri"
                onClick={() => setCompanyDetailModal({ open: false, company: null })}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL AJOUT / MODIFICATION GARE & AGENCE */}
      {stationModal.open && (
        <div className="modal-backdrop" onClick={() => setStationModal(prev => ({ ...prev, open: false }))}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {stationModal.mode === 'create'
                  ? 'Ajouter une gare ou agence'
                  : `Modifier la gare : ${stationModal.data.name}`}
              </h3>
              <button
                className="btn"
                onClick={() => setStationModal(prev => ({ ...prev, open: false }))}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveStationForm}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label>Société de transport opératrice *</label>
                    <select
                      value={stationModal.data.companyId || storeState.companies[0]?.id}
                      onChange={e => setStationModal(prev => ({ ...prev, data: { ...prev.data, companyId: e.target.value } }))}
                    >
                      {storeState.companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.tradeName} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nom officiel de la gare *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Gare Centrale TSR Gounghin"
                      value={stationModal.data.name || ''}
                      onChange={e => setStationModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ville *</label>
                    <select
                      value={stationModal.data.city || 'Ouagadougou'}
                      onChange={e => setStationModal(prev => ({ ...prev, data: { ...prev.data, city: e.target.value } }))}
                    >
                      {BURKINA_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quartier / Secteur</label>
                    <input
                      type="text"
                      placeholder="Ex: Gounghin Nord, Secteur 09"
                      value={stationModal.data.neighborhood || ''}
                      onChange={e => setStationModal(prev => ({ ...prev, data: { ...prev.data, neighborhood: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Adresse physique détaillée *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Boulevard de la Révolution, Face Stade"
                      value={stationModal.data.address || ''}
                      onChange={e => setStationModal(prev => ({ ...prev, data: { ...prev.data, address: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Téléphone du guichet *</label>
                    <input
                      type="text"
                      placeholder="+226 25 36 20 21"
                      value={stationModal.data.phone || ''}
                      onChange={e => setStationModal(prev => ({ ...prev, data: { ...prev.data, phone: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Heures d'ouverture</label>
                    <input
                      type="text"
                      placeholder="Ex: 05h00 - 22h00 (7j/7)"
                      value={stationModal.data.openingHours || '05h00 - 22h00'}
                      onChange={e => setStationModal(prev => ({ ...prev, data: { ...prev.data, openingHours: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Latitude GPS réelle *</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={stationModal.data.latitude ?? 12.3686}
                      onChange={e => setStationModal(prev => ({ ...prev, data: { ...prev.data, latitude: parseFloat(e.target.value) } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Longitude GPS réelle *</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={stationModal.data.longitude ?? -1.5542}
                      onChange={e => setStationModal(prev => ({ ...prev, data: { ...prev.data, longitude: parseFloat(e.target.value) } }))}
                    />
                  </div>
                  <div className="form-group form-full">
                    <label>Destinations desservies (séparées par des virgules)</label>
                    <input
                      type="text"
                      placeholder="Bobo-Dioulasso, Koudougou, Banfora, Ouahigouya"
                      value={
                        Array.isArray(stationModal.data.supportedDestinations)
                          ? stationModal.data.supportedDestinations.join(', ')
                          : stationModal.data.supportedDestinations || ''
                      }
                      onChange={e => setStationModal(prev => ({ ...prev, data: { ...prev.data, supportedDestinations: e.target.value as any } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Statut opérationnel</label>
                    <select
                      value={stationModal.data.status || 'ACTIVE'}
                      onChange={e => setStationModal(prev => ({ ...prev, data: { ...prev.data, status: e.target.value as AgencyStatus } }))}
                    >
                      <option value="ACTIVE">ACTIVE (Ouverte au public)</option>
                      <option value="INACTIVE">INACTIVE (Fermée temporairement)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setStationModal(prev => ({ ...prev, open: false }))}
                >
                  Annuler
                </button>
                <button type="submit" className="btn pri">
                  {stationModal.mode === 'create' ? 'Enregistrer la gare' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL DÉTAILS GARE & LOCALISATION GPS */}
      {stationDetailModal.open && stationDetailModal.station && (
        <div className="modal-backdrop" onClick={() => setStationDetailModal({ open: false, station: null })}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Fiche Gare : {stationDetailModal.station.name}</h3>
              <button
                className="btn"
                onClick={() => setStationDetailModal({ open: false, station: null })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px' }}>{stationDetailModal.station.name}</h4>
                  <p style={{ margin: '3px 0 0', color: 'var(--mut)', fontSize: '12px' }}>
                    Compagnie : <strong>{getCompanyTradeName(stationDetailModal.station.companyId)}</strong> • Code : <code>{stationDetailModal.station.code}</code>
                  </p>
                </div>
                {renderChip(stationDetailModal.station.status)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>Ville & Quartier</span>
                  <b>{stationDetailModal.station.city} ({stationDetailModal.station.neighborhood || 'Centre'})</b>
                </div>
                <div>
                  <span style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>Adresse physique</span>
                  <b>{stationDetailModal.station.address}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>Numéro guichet</span>
                  <b>{stationDetailModal.station.phone}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--mut)', fontSize: '11px', display: 'block' }}>Horaires de guichet</span>
                  <b>{stationDetailModal.station.openingHours || '05h00 - 22h00'}</b>
                </div>
              </div>

              {/* Coordonnées GPS & Visualisation Google Maps */}
              <div style={{ background: '#f0fdf4', padding: '14px', borderRadius: '8px', border: '1px solid #bbf7d0', marginTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Position GPS Réelle</span>
                    <p style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 600, color: '#14532d' }}>
                      Latitude : {stationDetailModal.station.latitude ?? stationDetailModal.station.lat}° | Longitude : {stationDetailModal.station.longitude ?? stationDetailModal.station.lng}°
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${stationDetailModal.station.latitude ?? stationDetailModal.station.lat},${stationDetailModal.station.longitude ?? stationDetailModal.station.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn ok"
                    style={{ textDecoration: 'none' }}
                  >
                    Ouvrir sur Google Maps ↗
                  </a>
                </div>
              </div>

              {/* Destinations */}
              <div>
                <h4 style={{ fontSize: '13px', margin: '8px 0 6px' }}>Destinations reliées depuis ce terminal</h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {(stationDetailModal.station.supportedDestinations || ['Bobo-Dioulasso', 'Ouagadougou']).map(d => (
                    <span key={d} className="chip b">
                      → {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn"
                onClick={() => {
                  const st = stationDetailModal.station;
                  setStationDetailModal({ open: false, station: null });
                  if (st) setStationModal({ open: true, mode: 'edit', data: st });
                }}
              >
                Modifier cette gare
              </button>
              <button
                className="btn pri"
                onClick={() => setStationDetailModal({ open: false, station: null })}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL AJOUT / MODIFICATION LIGNE & TRAJET */}
      {routeModal.open && (
        <div className="modal-backdrop" onClick={() => setRouteModal(prev => ({ ...prev, open: false }))}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {routeModal.mode === 'create'
                  ? 'Définir une nouvelle ligne interurbaine'
                  : 'Modifier la ligne interurbaine'}
              </h3>
              <button
                className="btn"
                onClick={() => setRouteModal(prev => ({ ...prev, open: false }))}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveRouteForm}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label>Société opératrice *</label>
                    <select
                      value={routeModal.data.companyId || storeState.companies[0]?.id}
                      onChange={e => setRouteModal(prev => ({ ...prev, data: { ...prev.data, companyId: e.target.value } }))}
                    >
                      {storeState.companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.tradeName} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ville de départ *</label>
                    <select
                      value={routeModal.data.departureCity || 'Ouagadougou'}
                      onChange={e => setRouteModal(prev => ({ ...prev, data: { ...prev.data, departureCity: e.target.value } }))}
                    >
                      {BURKINA_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ville d'arrivée *</label>
                    <select
                      value={routeModal.data.destinationCity || 'Bobo-Dioulasso'}
                      onChange={e => setRouteModal(prev => ({ ...prev, data: { ...prev.data, destinationCity: e.target.value } }))}
                    >
                      {BURKINA_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Gare de départ</label>
                    <input
                      type="text"
                      placeholder="Ex: Gare Centrale TSR Gounghin"
                      value={routeModal.data.departureAgencyName || ''}
                      onChange={e => setRouteModal(prev => ({ ...prev, data: { ...prev.data, departureAgencyName: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gare d'arrivée</label>
                    <input
                      type="text"
                      placeholder="Ex: Gare Principale TSR Farakan"
                      value={routeModal.data.arrivalAgencyName || ''}
                      onChange={e => setRouteModal(prev => ({ ...prev, data: { ...prev.data, arrivalAgencyName: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Distance estimée (km)</label>
                    <input
                      type="number"
                      min="10"
                      value={routeModal.data.distanceKm ?? 365}
                      onChange={e => setRouteModal(prev => ({ ...prev, data: { ...prev.data, distanceKm: Number(e.target.value) } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Durée estimée (minutes)</label>
                    <input
                      type="number"
                      min="15"
                      step="15"
                      value={routeModal.data.estimatedDurationMinutes ?? 315}
                      onChange={e => setRouteModal(prev => ({ ...prev, data: { ...prev.data, estimatedDurationMinutes: Number(e.target.value) } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Prix de référence en Francs CFA (XOF) *</label>
                    <input
                      type="number"
                      min="500"
                      step="500"
                      required
                      value={routeModal.data.basePriceXOF ?? 9000}
                      onChange={e => setRouteModal(prev => ({ ...prev, data: { ...prev.data, basePriceXOF: Number(e.target.value) } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Statut</label>
                    <select
                      value={routeModal.data.status || 'ACTIVE'}
                      onChange={e => setRouteModal(prev => ({ ...prev, data: { ...prev.data, status: e.target.value as RouteStatus } }))}
                    >
                      <option value="ACTIVE">ACTIVE (Liaison exploitée)</option>
                      <option value="SUSPENDED">SUSPENDED (Interrompue)</option>
                    </select>
                  </div>
                  <div className="form-group form-full">
                    <label>Escales / Arrêts intermédiaires (séparés par des virgules)</label>
                    <input
                      type="text"
                      placeholder="Sabou, Boromo, Houndé"
                      value={Array.isArray(routeModal.data.stops) ? routeModal.data.stops.join(', ') : routeModal.data.stops || ''}
                      onChange={e => setRouteModal(prev => ({ ...prev, data: { ...prev.data, stops: e.target.value as any } }))}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setRouteModal(prev => ({ ...prev, open: false }))}
                >
                  Annuler
                </button>
                <button type="submit" className="btn pri">
                  {routeModal.mode === 'create' ? 'Créer la ligne' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL PLANIFIER / ÉDITER UN DÉPART (HORAIRES) */}
      {tripModal.open && (
        <div className="modal-backdrop" onClick={() => setTripModal(prev => ({ ...prev, open: false }))}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {tripModal.mode === 'create' ? 'Planifier un départ de car' : 'Modifier le départ'}
              </h3>
              <button
                className="btn"
                onClick={() => setTripModal(prev => ({ ...prev, open: false }))}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveTripForm}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label>Société opératrice *</label>
                    <select
                      value={tripModal.data.companyId || storeState.companies[0]?.id}
                      onChange={e => setTripModal(prev => ({ ...prev, data: { ...prev.data, companyId: e.target.value } }))}
                    >
                      {storeState.companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.tradeName} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ville de départ *</label>
                    <select
                      value={tripModal.data.departureCity || 'Ouagadougou'}
                      onChange={e => setTripModal(prev => ({ ...prev, data: { ...prev.data, departureCity: e.target.value } }))}
                    >
                      {BURKINA_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ville de destination *</label>
                    <select
                      value={tripModal.data.destinationCity || 'Bobo-Dioulasso'}
                      onChange={e => setTripModal(prev => ({ ...prev, data: { ...prev.data, destinationCity: e.target.value } }))}
                    >
                      {BURKINA_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date de circulation *</label>
                    <input
                      type="date"
                      required
                      value={tripModal.data.date || new Date().toISOString().split('T')[0]}
                      onChange={e => setTripModal(prev => ({ ...prev, data: { ...prev.data, date: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Heure de départ (HH:mm) *</label>
                    <input
                      type="time"
                      required
                      value={tripModal.data.departureTime || '07:00'}
                      onChange={e => setTripModal(prev => ({ ...prev, data: { ...prev.data, departureTime: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Heure d'arrivée estimée (HH:mm)</label>
                    <input
                      type="time"
                      value={tripModal.data.arrivalTime || '12:15'}
                      onChange={e => setTripModal(prev => ({ ...prev, data: { ...prev.data, arrivalTime: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Prix du billet (XOF) *</label>
                    <input
                      type="number"
                      required
                      step="500"
                      min="500"
                      value={tripModal.data.priceXOF ?? 9000}
                      onChange={e => setTripModal(prev => ({ ...prev, data: { ...prev.data, priceXOF: Number(e.target.value) } }))}
                    />
                  </div>
                  <div className="form-group form-full">
                    <label>Véhicule &amp; Catégorie de car</label>
                    <input
                      type="text"
                      placeholder="Ex: Car Marcopolo Paradiso VIP 50 Places"
                      value={tripModal.data.busType || ''}
                      onChange={e => setTripModal(prev => ({ ...prev, data: { ...prev.data, busType: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nombre total de places assises</label>
                    <input
                      type="number"
                      min="10"
                      max="70"
                      value={tripModal.data.totalSeats ?? 50}
                      onChange={e => setTripModal(prev => ({ ...prev, data: { ...prev.data, totalSeats: Number(e.target.value) } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Statut du départ</label>
                    <select
                      value={tripModal.data.status || 'SCHEDULED'}
                      onChange={e => setTripModal(prev => ({ ...prev, data: { ...prev.data, status: e.target.value as TripStatus } }))}
                    >
                      <option value="SCHEDULED">SCHEDULED (Programmé)</option>
                      <option value="PUBLISHED">PUBLISHED (Publié en ligne)</option>
                      <option value="BOARDING">BOARDING (Embarquement en cours)</option>
                      <option value="DEPARTED">DEPARTED (Parti)</option>
                      <option value="CANCELLED">CANCELLED (Annulé)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setTripModal(prev => ({ ...prev, open: false }))}
                >
                  Annuler
                </button>
                <button type="submit" className="btn pri">
                  {tripModal.mode === 'create' ? 'Planifier le départ' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL AJOUT / MODIFICATION VÉHICULE (FLOTTE) */}
      {busModal.open && (
        <div className="modal-backdrop" onClick={() => setBusModal(prev => ({ ...prev, open: false }))}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {busModal.mode === 'create' ? 'Ajouter un véhicule à la flotte' : 'Modifier le véhicule'}
              </h3>
              <button
                className="btn"
                onClick={() => setBusModal(prev => ({ ...prev, open: false }))}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveBusForm}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-full">
                    <label>Société de transport opératrice *</label>
                    <select
                      value={busModal.data.companyId || storeState.companies[0]?.id}
                      onChange={e => setBusModal(prev => ({ ...prev, data: { ...prev.data, companyId: e.target.value } }))}
                    >
                      {storeState.companies.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.tradeName} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Numéro d'immatriculation *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 11-JJ-4567 BF"
                      value={busModal.data.registrationNumber || ''}
                      onChange={e => setBusModal(prev => ({ ...prev, data: { ...prev.data, registrationNumber: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Numéro de parc interne</label>
                    <input
                      type="text"
                      placeholder="Ex: CAR-VIP-08"
                      value={busModal.data.fleetNumber || ''}
                      onChange={e => setBusModal(prev => ({ ...prev, data: { ...prev.data, fleetNumber: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Marque</label>
                    <input
                      type="text"
                      placeholder="Marcopolo, Scania, Mercedes..."
                      value={busModal.data.brand || ''}
                      onChange={e => setBusModal(prev => ({ ...prev, data: { ...prev.data, brand: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Modèle</label>
                    <input
                      type="text"
                      placeholder="Paradiso G8, Touring HD..."
                      value={busModal.data.model || ''}
                      onChange={e => setBusModal(prev => ({ ...prev, data: { ...prev.data, model: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Capacité assise (places)</label>
                    <input
                      type="number"
                      min="10"
                      max="70"
                      value={busModal.data.seatCapacity ?? 50}
                      onChange={e => setBusModal(prev => ({ ...prev, data: { ...prev.data, seatCapacity: Number(e.target.value) } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Catégorie de confort</label>
                    <select
                      value={busModal.data.category || 'VIP'}
                      onChange={e => setBusModal(prev => ({ ...prev, data: { ...prev.data, category: e.target.value as any } }))}
                    >
                      <option value="VIP">VIP (Climatisé, Wi-Fi, Prises USB)</option>
                      <option value="CONFORT">CONFORT (Climatisé)</option>
                      <option value="STANDARD">STANDARD</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Statut opérationnel</label>
                    <select
                      value={busModal.data.status || 'ACTIVE'}
                      onChange={e => setBusModal(prev => ({ ...prev, data: { ...prev.data, status: e.target.value as BusStatus } }))}
                    >
                      <option value="ACTIVE">ACTIVE (En service régulier)</option>
                      <option value="MAINTENANCE">MAINTENANCE (En révision)</option>
                      <option value="INACTIVE">INACTIVE (À l'arrêt)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setBusModal(prev => ({ ...prev, open: false }))}
                >
                  Annuler
                </button>
                <button type="submit" className="btn pri">
                  {busModal.mode === 'create' ? 'Ajouter à la flotte' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Polite Floating Toast */}
      <div
        className={`toast ${toastMessage ? 'on' : ''}`}
        role="status"
        aria-live="polite"
      >
        {toastMessage}
      </div>
    </div>
  );
};
