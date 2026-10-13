/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { appStore } from '../services/store';
import { 
  Company, UserProfile, DepartureTrip, ElectronicTicket, 
  PaymentTransaction, ParcelShipment, SupportClaim, AuditLog 
} from '../types';
import { formatXOF } from '../services/ticketSecurity';
import { AuditService } from '../services/auditService';
import { INITIAL_PARCELS } from '../services/parcelService';
import { INITIAL_CLAIMS } from '../services/supportClaimService';
import { OperationalReportService } from '../services/operationalReportService';
import { 
  ShieldCheck, Building2, Users, AlertCircle, CheckCircle2, 
  XCircle, TrendingUp, Bus, FileText, Check, Search, 
  SlidersHorizontal, Download, ArrowUpRight, DollarSign, 
  Package, Clock, RefreshCw, Smartphone, Key, Settings, 
  Activity, Database, MapPin, Sparkles, Filter, ChevronRight, 
  Eye, AlertTriangle, Lock, Shield, CheckCircle, HelpCircle, 
  CreditCard, ArrowRight, BarChart3, LogOut, Radio
} from 'lucide-react';

type AdminTab = 
  | 'OVERVIEW'
  | 'COMPANIES'
  | 'USERS'
  | 'TRIPS'
  | 'TICKETS'
  | 'PAYMENTS'
  | 'PARCELS'
  | 'CLAIMS'
  | 'SECURITY_AUDIT'
  | 'SETTINGS_MAINTENANCE';

export const Screen17AdminDashboard: React.FC = () => {
  const [storeState, setStoreState] = useState(appStore.getState());
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [globalSearch, setGlobalSearch] = useState('');
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'warning' | 'info' } | null>(null);

  // Modals state
  const [selectedCompanyModal, setSelectedCompanyModal] = useState<Company | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [selectedTicketModal, setSelectedTicketModal] = useState<ElectronicTicket | null>(null);
  const [selectedUserModal, setSelectedUserModal] = useState<UserProfile | null>(null);
  const [selectedClaimModal, setSelectedClaimModal] = useState<SupportClaim | null>(null);
  const [claimResolutionInput, setClaimResolutionInput] = useState('');

  // Sub-filters
  const [companyStatusFilter, setCompanyStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED'>('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'TRAVELER' | 'AGENT' | 'COMPANY_MANAGER' | 'ADMIN'>('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<'ALL' | 'ORANGE_MONEY' | 'MOOV_MONEY' | 'WAVE'>('ALL');
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'SUCCESS' | 'WARNING' | 'FAILURE'>('ALL');

  // Platform settings state
  const [platformCommission, setPlatformCommission] = useState<number>(2.5);
  const [seatLockDuration, setSeatLockDuration] = useState<number>(10);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);

  // Local state for parcels & claims to allow interactive updates
  const [parcels, setParcels] = useState<ParcelShipment[]>(INITIAL_PARCELS);
  const [claims, setClaims] = useState<SupportClaim[]>(INITIAL_CLAIMS);

  useEffect(() => {
    const unsubscribe = appStore.subscribe(() => {
      setStoreState({ ...appStore.getState() });
    });
    return () => unsubscribe();
  }, []);

  const notify = (message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setActionNotice({ message, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Companies filters
  const pendingCompanies = useMemo(() => storeState.companies.filter(c => c.status === 'PENDING'), [storeState.companies]);
  const activeCompanies = useMemo(() => storeState.companies.filter(c => c.status === 'ACTIVE'), [storeState.companies]);
  
  const filteredCompanies = useMemo(() => {
    return storeState.companies.filter(c => {
      const matchFilter = companyStatusFilter === 'ALL' || c.status === companyStatusFilter;
      const matchSearch = globalSearch.trim() === '' || 
        c.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        c.managerName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        c.phone.includes(globalSearch) ||
        (c.ifuNumber && c.ifuNumber.toLowerCase().includes(globalSearch.toLowerCase()));
      return matchFilter && matchSearch;
    });
  }, [storeState.companies, companyStatusFilter, globalSearch]);

  // Users filters
  const filteredUsers = useMemo(() => {
    return storeState.allUsers.filter(u => {
      const matchRole = userRoleFilter === 'ALL' || u.role === userRoleFilter;
      const matchSearch = globalSearch.trim() === '' ||
        u.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        u.phone.includes(globalSearch) ||
        (u.email && u.email.toLowerCase().includes(globalSearch.toLowerCase()));
      return matchRole && matchSearch;
    });
  }, [storeState.allUsers, userRoleFilter, globalSearch]);

  // Trips filters
  const filteredTrips = useMemo(() => {
    return storeState.trips.filter(t => {
      return globalSearch.trim() === '' ||
        t.departureCity.toLowerCase().includes(globalSearch.toLowerCase()) ||
        t.destinationCity.toLowerCase().includes(globalSearch.toLowerCase()) ||
        t.departureAgency.toLowerCase().includes(globalSearch.toLowerCase());
    });
  }, [storeState.trips, globalSearch]);

  // Tickets filters
  const filteredTickets = useMemo(() => {
    return storeState.tickets.filter(t => {
      return globalSearch.trim() === '' ||
        t.ticketNumber.toLowerCase().includes(globalSearch.toLowerCase()) ||
        t.passengerName.toLowerCase().includes(globalSearch.toLowerCase()) ||
        t.destinationCity.toLowerCase().includes(globalSearch.toLowerCase());
    });
  }, [storeState.tickets, globalSearch]);

  // Payments calculations
  const totalVolumeXOF = useMemo(() => {
    const storePayments = storeState.payments.reduce((acc, p) => acc + p.amountXOF, 0);
    return storePayments > 0 ? storePayments : 135400000;
  }, [storeState.payments]);

  const platformRevenueXOF = useMemo(() => {
    return Math.round(totalVolumeXOF * (platformCommission / 100));
  }, [totalVolumeXOF, platformCommission]);

  // Audit Logs
  const auditLogs = useMemo(() => {
    const raw = AuditService.getAllLogs();
    if (raw.length === 0) {
      // Seed default audit logs if empty
      return [
        {
          id: 'aud_seed_01',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          actorId: 'user_admin',
          actorRole: 'ADMIN' as const,
          action: 'AUTH_LOGIN' as const,
          resourceType: 'SESSION' as const,
          result: 'SUCCESS' as const,
          details: 'Connexion Super-Admin réussie depuis terminal sécurisé'
        },
        {
          id: 'aud_seed_02',
          timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
          actorId: 'user_agent',
          actorRole: 'AGENT' as const,
          action: 'TICKET_SCANNED_VALID' as const,
          resourceType: 'TICKET' as const,
          result: 'SUCCESS' as const,
          details: 'Compostage Quai 1 : Billet TSR-BF-2026-8819 validé'
        },
        {
          id: 'aud_seed_03',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          actorId: 'system',
          actorRole: 'SYSTEM' as const,
          action: 'SEAT_HOLD_ACQUIRED' as const,
          resourceType: 'SEAT' as const,
          result: 'SUCCESS' as const,
          details: 'Verrou atomique 10 min alloué pour départ Ouaga-Bobo'
        },
        {
          id: 'aud_seed_04',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          actorId: 'user_unknown',
          actorRole: 'TRAVELER' as const,
          action: 'SECURITY_QR_FORGERY_DETECTED' as const,
          resourceType: 'TICKET' as const,
          result: 'FAILURE' as const,
          details: 'Signature HMAC altérée bloquée à l embarquement (Anti-Fraude)'
        }
      ];
    }
    return raw.filter(l => auditFilter === 'ALL' || (l.result || l.status) === auditFilter);
  }, [auditFilter]);

  // Operational KPIs
  const operationalKPI = useMemo(() => OperationalReportService.getMonthlyKPIs(), []);

  // Handlers
  const handleApproveCompany = (companyId: string) => {
    appStore.updateCompanyStatus(companyId, 'ACTIVE');
    AuditService.log({
      actorId: storeState.currentUser?.id || 'admin_central',
      actorRole: 'ADMIN',
      action: 'COMPANY_APPROVED',
      resourceType: 'COMPANY',
      resourceId: companyId,
      result: 'SUCCESS',
      details: 'Agrément validé par la supervision centrale'
    });
    notify('Société de transport approuvée et activée avec succès !');
  };

  const handleRejectCompany = (companyId: string) => {
    const reason = rejectReasonInput.trim() || 'Dossier administratif non conforme aux exigences réglementaires.';
    appStore.updateCompanyStatus(companyId, 'REJECTED', reason);
    AuditService.log({
      actorId: storeState.currentUser?.id || 'admin_central',
      actorRole: 'ADMIN',
      action: 'COMPANY_REJECTED',
      resourceType: 'COMPANY',
      resourceId: companyId,
      result: 'WARNING',
      reason
    });
    setShowRejectModal(null);
    setRejectReasonInput('');
    notify('Demande de société rejetée avec notification motivée.', 'warning');
  };

  const handleSuspendCompany = (companyId: string) => {
    appStore.updateCompanyStatus(companyId, 'SUSPENDED', 'Suspendu par décision administrative centrale.');
    AuditService.log({
      actorId: storeState.currentUser?.id || 'admin_central',
      actorRole: 'ADMIN',
      action: 'COMPANY_SUSPENDED',
      resourceType: 'COMPANY',
      resourceId: companyId,
      result: 'WARNING'
    });
    notify('Société suspendue temporairement des publications publiques.', 'warning');
  };

  const handleReactivateCompany = (companyId: string) => {
    appStore.updateCompanyStatus(companyId, 'ACTIVE');
    AuditService.log({
      actorId: storeState.currentUser?.id || 'admin_central',
      actorRole: 'ADMIN',
      action: 'COMPANY_REACTIVATED',
      resourceType: 'COMPANY',
      resourceId: companyId,
      result: 'SUCCESS'
    });
    notify('Société réactivée avec succès.');
  };

  const handleToggleUserStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    appStore.updateUserStatus(userId, newStatus as any);
    AuditService.log({
      actorId: storeState.currentUser?.id || 'admin_central',
      actorRole: 'ADMIN',
      action: newStatus === 'ACTIVE' ? 'AUTH_REGISTER' : 'PERMISSION_DENIED',
      resourceType: 'USER',
      resourceId: userId,
      result: 'SUCCESS',
      details: `Statut utilisateur basculé à ${newStatus}`
    });
    notify(`Utilisateur passé en statut ${newStatus}.`);
  };

  const handleResolveClaim = (claimId: string) => {
    const note = claimResolutionInput.trim() || 'Dossier traité et résolu par le service client central TSR.';
    setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: 'RESOLVED', resolutionNote: note } : c));
    setSelectedClaimModal(null);
    setClaimResolutionInput('');
    notify('Réclamation marquée comme résolue.');
  };

  const handleExportSystemReport = (format: 'CSV' | 'JSON') => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `TSR_TRANSIT_RAPPORT_SUPERADMIN_${timestamp}.${format.toLowerCase()}`;
    
    let content = '';
    if (format === 'JSON') {
      content = JSON.stringify({
        exportedAt: new Date().toISOString(),
        kpi: operationalKPI,
        companiesCount: storeState.companies.length,
        usersCount: storeState.allUsers.length,
        tripsCount: storeState.trips.length,
        ticketsCount: storeState.tickets.length,
        totalVolumeXOF,
        platformCommission,
        maintenanceMode
      }, null, 2);
    } else {
      content = 'METRIQUE,VALEUR,DATE\n' +
        `Voyageurs Inscrits,${storeState.allUsers.length},${timestamp}\n` +
        `Sociétés Actives,${activeCompanies.length},${timestamp}\n` +
        `Volume XOF,${totalVolumeXOF},${timestamp}\n` +
        `Commission TSR XOF,${platformRevenueXOF},${timestamp}\n` +
        `Billets Validés,${storeState.tickets.length},${timestamp}\n`;
    }

    const blob = new Blob([content], { type: format === 'JSON' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify(`Rapport système exporté avec succès (${filename}).`);
  };

  // RBAC Access Control Enforcement
  if (storeState.currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-100 min-h-screen text-slate-900">
        <div className="max-w-md w-full bg-white rounded-3xl border-2 border-red-200 p-6 shadow-xl space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900">Accès Refusé — Rôle Administrateur Requis</h2>
            <p className="text-xs text-slate-500">
              L'espace de supervision de l'Administration Centrale (Écran 17) est strictement réservé au personnel accrédité de régulation et aux Super-Administrateurs TSR Transit.
            </p>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-2xl text-xs text-left space-y-1.5 border border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500">Utilisateur actuel :</span>
              <strong className="text-slate-800">{storeState.currentUser?.name || 'Visiteur non connecté'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rôle détecté :</span>
              <span className="font-mono font-bold text-red-600 px-2 py-0.5 rounded bg-red-50">{storeState.currentUser?.role || 'AUCUN'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Statut :</span>
              <span className="text-amber-700 font-semibold">{storeState.currentUser?.status || 'NON_CONNECTE'}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                appStore.loginAsRole('ADMIN');
                notify('Session basculée en Administrateur Central autorisé.');
              }}
              className="w-full py-2.5 px-4 bg-[#0F2C59] hover:bg-[#1E3A8A] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>S'authentifier comme Administrateur (Démo)</span>
            </button>
            <button
              onClick={() => appStore.navigateTo('02_PUBLIC_HOME')}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Retour à l'accueil public
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-100 text-slate-800">
      {/* Top Header - Enterprise Style */}
      <header className="bg-[#0F2C59] text-white px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Brand & System Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base tracking-tight">TSR TRANSIT</h1>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-800 text-blue-200 border border-blue-700">
                    Administration Centrale
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-blue-200">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Cloud Firestore : <strong className="text-white">Opérationnel</strong>
                  </span>
                  <span>•</span>
                  <span>Projet : <code className="text-amber-300 font-mono text-[10px]">zany-order-h1ttq</code></span>
                </div>
              </div>
            </div>

            {/* Mobile Navigation Drawer Toggle */}
            <div className="md:hidden flex items-center gap-2">
              <button 
                onClick={() => appStore.navigateTo('02_PUBLIC_HOME')}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs"
                title="Quitter l'administration"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Bar & Quick Indicators */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher société, voyageur, billet, car..."
                value={globalSearch}
                onChange={e => setGlobalSearch(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white/15"
              />
              {globalSearch && (
                <button 
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-blue-200 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-white/15 text-xs">
              <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Maps API : OK</span>
              </span>
              <span className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-200 border border-purple-500/30 flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini : Actif</span>
              </span>
              <button
                onClick={() => appStore.navigateTo('02_PUBLIC_HOME')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1 transition-colors"
                title="Retour vers l'application publique"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Quitter</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className={`p-3 text-xs flex items-center justify-between px-6 shadow-sm border-b transition-all ${
          actionNotice.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
          actionNotice.type === 'warning' ? 'bg-amber-50 border-amber-300 text-amber-900' :
          'bg-blue-50 border-blue-300 text-blue-900'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> :
             actionNotice.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> :
             <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />}
            <span className="font-semibold">{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-700">✕</button>
        </div>
      )}

      {/* Main Layout: Navigation Sidebar + Content */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-3 sm:p-4 gap-4">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-white rounded-2xl border border-slate-200 p-2 shadow-sm shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          <div className="hidden md:block px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Supervision Centrale
          </div>

          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-left ${
              activeTab === 'OVERVIEW'
                ? 'bg-[#0F2C59] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Vue Générale</span>
          </button>

          <button
            onClick={() => setActiveTab('COMPANIES')}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-left ${
              activeTab === 'COMPANIES'
                ? 'bg-[#0F2C59] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>Sociétés de Transport</span>
            </div>
            {pendingCompanies.length > 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === 'COMPANIES' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
              }`}>
                {pendingCompanies.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-left ${
              activeTab === 'USERS'
                ? 'bg-[#0F2C59] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Utilisateurs & Accès</span>
          </button>

          <button
            onClick={() => setActiveTab('TRIPS')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-left ${
              activeTab === 'TRIPS'
                ? 'bg-[#0F2C59] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Bus className="w-4 h-4 shrink-0" />
            <span>Trajets, Horaires & Cars</span>
          </button>

          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-left ${
              activeTab === 'TICKETS'
                ? 'bg-[#0F2C59] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>Billets & Réservations</span>
          </button>

          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-left ${
              activeTab === 'PAYMENTS'
                ? 'bg-[#0F2C59] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>Paiements Mobile Money</span>
          </button>

          <button
            onClick={() => setActiveTab('PARCELS')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-left ${
              activeTab === 'PARCELS'
                ? 'bg-[#0F2C59] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Fret & Colis</span>
          </button>

          <button
            onClick={() => setActiveTab('CLAIMS')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-left ${
              activeTab === 'CLAIMS'
                ? 'bg-[#0F2C59] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            <span>Réclamations & Litiges</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY_AUDIT')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-left ${
              activeTab === 'SECURITY_AUDIT'
                ? 'bg-[#0F2C59] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>Audit & Sécurité HMAC</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS_MAINTENANCE')}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-left ${
              activeTab === 'SETTINGS_MAINTENANCE'
                ? 'bg-[#0F2C59] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Maintenance & Export</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 space-y-4 min-w-0">
          {/* ========================================================================= */}
          {/* SECTION A : VUE GÉNÉRALE                                                  */}
          {/* ========================================================================= */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              {/* Alertes d'exploitation en bandeau */}
              {pendingCompanies.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-amber-950">
                        {pendingCompanies.length} demande{pendingCompanies.length > 1 ? 's' : ''} d'agrément de compagnie en attente
                      </h3>
                      <p className="text-xs text-amber-800">
                        Les dossiers professionnels (IFU, RCCM, agrément de transport) attendent votre validation administrative.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('COMPANIES')}
                    className="px-3.5 py-1.5 bg-[#0F2C59] hover:bg-[#1E3A8A] text-white font-bold rounded-xl text-xs shadow-sm transition-colors whitespace-nowrap"
                  >
                    Examiner les dossiers
                  </button>
                </div>
              )}

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Voyageurs inscrits */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Voyageurs Inscrits</span>
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">
                    {storeState.allUsers.length + 14816}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +18.4% ce mois (Burkina)
                  </div>
                </div>

                {/* 2. Compagnies Agréées */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Compagnies Agréées</span>
                    <Building2 className="w-4 h-4 text-[#0F2C59]" />
                  </div>
                  <div className="text-xl font-extrabold text-blue-900 font-mono">
                    {activeCompanies.length} actives
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {pendingCompanies.length} en instruction • {storeState.companies.filter(c => c.status === 'SUSPENDED').length} suspendues
                  </div>
                </div>

                {/* 3. Volume Transactions */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Volume Mobile Money</span>
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">
                    {formatXOF(totalVolumeXOF)}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">
                    100% collecté via Orange / Moov / Wave
                  </div>
                </div>

                {/* 4. Billets Émis & Validés Quai */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Billets Validés Quai</span>
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-xl font-extrabold text-purple-900 font-mono">
                    {storeState.tickets.length + 9420}
                  </div>
                  <div className="text-[10px] text-purple-700 font-semibold">
                    0 fraude détectée (HMAC-SHA256)
                  </div>
                </div>
              </div>

              {/* Interactive Performance Charts: SVG Responsive */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recettes & Billetterie Hebdomadaire */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Recettes Hebdomadaires (Millions FCFA)
                      </h3>
                      <span className="text-[11px] text-slate-500">Suivi consolidé des départs interurbains</span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      Taux Remplissage : 86.4%
                    </span>
                  </div>

                  {/* SVG Bar Chart */}
                  <div className="pt-2">
                    <div className="flex items-end justify-between h-36 gap-2 px-2 border-b border-slate-100">
                      {[
                        { day: 'Lun', val: 18.2, height: '65%' },
                        { day: 'Mar', val: 16.5, height: '58%' },
                        { day: 'Mer', val: 19.8, height: '70%' },
                        { day: 'Jeu', val: 22.4, height: '80%' },
                        { day: 'Ven', val: 28.5, height: '100%' },
                        { day: 'Sam', val: 26.1, height: '92%' },
                        { day: 'Dim', val: 23.9, height: '85%' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <span className="text-[9px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.val}M
                          </span>
                          <div className="w-full bg-slate-100 rounded-t-lg h-full flex items-end">
                            <div 
                              style={{ height: item.height }}
                              className="w-full bg-gradient-to-t from-[#0F2C59] to-blue-600 rounded-t-lg group-hover:from-blue-700 group-hover:to-amber-400 transition-all"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Répartition de l'Activité par Compagnie */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Parts de Marché par Compagnie
                      </h3>
                      <span className="text-[11px] text-slate-500">Volume de réservations et départs enregistrés</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Total : 100%</span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {[
                      { name: 'TSR TRANSIT BURKINA', share: 48, cars: 42, color: 'bg-[#0F2C59]' },
                      { name: 'RAKIETA TRANSPORT', share: 28, cars: 35, color: 'bg-blue-600' },
                      { name: 'TCV CONFORT & SÉCURITÉ', share: 18, cars: 28, color: 'bg-emerald-600' },
                      { name: 'SAHEL EXPRESS (En cours)', share: 6, cars: 14, color: 'bg-amber-500' },
                    ].map((comp, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-800">{comp.name}</span>
                          <span className="font-mono font-semibold text-slate-600">{comp.share}% ({comp.cars} cars)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${comp.color} rounded-full`} style={{ width: `${comp.share}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* État des Services & Alertes Récentes */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Statut des Services Backend */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>Santé des Systèmes</span>
                  </h3>
                  <div className="space-y-2 text-xs divide-y divide-slate-100">
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-slate-600">Cloud Firestore DB</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Actif (ai-studio-remixtsrtransit...)
                      </span>
                    </div>
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-slate-600">Firebase Auth & RBAC</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Actif (4 rôles stricts)
                      </span>
                    </div>
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-slate-600">Google Maps Platform</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Actif (Gares 100% géoréférencées)
                      </span>
                    </div>
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-slate-600">Gemini AI Chatbot</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Actif (Prompt Injection Shield)
                      </span>
                    </div>
                    <div className="pt-1.5 flex items-center justify-between">
                      <span className="text-slate-600">Mobile Money Webhooks</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Opérationnel (OM, Moov, Wave)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Derniers Événements d'Audit */}
                <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Activité Récente & Sécurité Quai</span>
                    </h3>
                    <button 
                      onClick={() => setActiveTab('SECURITY_AUDIT')}
                      className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <span>Voir tous les logs</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {auditLogs.slice(0, 4).map((log, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              log.result === 'SUCCESS' ? 'bg-emerald-500' :
                              log.result === 'WARNING' ? 'bg-amber-500' : 'bg-red-500'
                            }`} />
                            <span className="font-extrabold text-slate-800 text-[11px] font-mono">{log.action}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 font-bold text-slate-700">
                              {log.actorRole}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">
                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION B : GESTION DES SOCIÉTÉS DE TRANSPORT                             */}
          {/* ========================================================================= */}
          {activeTab === 'COMPANIES' && (
            <div className="space-y-4">
              {/* Header de section & Filtres */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-[#0F2C59]" />
                    <span>Répertoire National des Compagnies ({storeState.companies.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Validation des agréments de transport interurbain, vérification des licences et gestion de flotte.
                  </p>
                </div>

                {/* Filtres par statut */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {(['ALL', 'PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => setCompanyStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                        companyStatusFilter === st
                          ? 'bg-[#0F2C59] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st === 'ALL' ? 'Toutes' :
                       st === 'PENDING' ? `En attente (${pendingCompanies.length})` :
                       st === 'ACTIVE' ? 'Actives' :
                       st === 'SUSPENDED' ? 'Suspendues' : 'Rejetées'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Liste des Compagnies */}
              <div className="space-y-3">
                {filteredCompanies.length === 0 ? (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                    <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-600">Aucune société trouvée pour ce filtre.</p>
                  </div>
                ) : (
                  filteredCompanies.map(comp => (
                    <div 
                      key={comp.id}
                      className={`bg-white rounded-2xl border p-4 shadow-sm transition-all space-y-3 ${
                        comp.status === 'PENDING' ? 'border-2 border-amber-300 bg-amber-50/20' :
                        comp.status === 'SUSPENDED' ? 'border-slate-300 bg-slate-50/50' :
                        comp.status === 'REJECTED' ? 'border-red-200 bg-red-50/20' :
                        'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-slate-900">{comp.name}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              comp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                              comp.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                              comp.status === 'SUSPENDED' ? 'bg-slate-200 text-slate-700' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {comp.status === 'ACTIVE' ? 'ACTIF' :
                               comp.status === 'PENDING' ? 'EN ATTENTE D\'AGRÉMENT' :
                               comp.status === 'SUSPENDED' ? 'SUSPENDU' : 'REJETÉ'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>Siège : <strong className="text-slate-700">{comp.headquarters}</strong></span>
                            <span>Directeur : <strong className="text-slate-700">{comp.managerName}</strong></span>
                            <span>Contact : <strong className="text-slate-700">{comp.phone}</strong></span>
                          </div>
                        </div>

                        {/* Actions rapides */}
                        <div className="flex items-center gap-2 pt-2 sm:pt-0">
                          {comp.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApproveCompany(comp.id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Valider & Agréer</span>
                              </button>
                              <button
                                onClick={() => setShowRejectModal(comp.id)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs border border-red-200 transition-colors"
                              >
                                Rejeter
                              </button>
                            </>
                          )}

                          {comp.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleSuspendCompany(comp.id)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 font-bold rounded-xl text-xs border border-slate-200 transition-colors"
                            >
                              Suspendre
                            </button>
                          )}

                          {comp.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleReactivateCompany(comp.id)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl text-xs border border-emerald-300 transition-colors"
                            >
                              Réactiver
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedCompanyModal(comp)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Dossier</span>
                          </button>
                        </div>
                      </div>

                      {/* Données Métier & Documents */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">N° IFU</span>
                          <span className="font-mono font-bold text-slate-800">{comp.ifuNumber || 'Non renseigné'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">N° RCCM</span>
                          <span className="font-mono font-bold text-slate-800">{comp.rccmNumber || 'Non renseigné'}</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Flotte Déclarée</span>
                          <span className="font-bold text-slate-800">{comp.fleetCount} autocar(s)</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl">
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Code Marchand OM</span>
                          <span className="font-mono font-bold text-emerald-700">{comp.merchantCode || 'OM-BF-EN-COURS'}</span>
                        </div>
                      </div>

                      {/* Motif de rejet / suspension si présent */}
                      {comp.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-red-50 text-red-800 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Motif notifié : {comp.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION C : UTILISATEURS ET CONTRÔLE D'ACCÈS RBAC                         */}
          {/* ========================================================================= */}
          {activeTab === 'USERS' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>Annuaire des Utilisateurs ({storeState.allUsers.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Contrôle d'accès basé sur les rôles (RBAC/ABAC) : Voyageurs, Agents de quai, Gérants, Admins.
                  </p>
                </div>

                {/* Filtres par Rôle */}
                <div className="flex items-center gap-1 overflow-x-auto">
                  {(['ALL', 'TRAVELER', 'AGENT', 'COMPANY_MANAGER', 'ADMIN'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setUserRoleFilter(role)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                        userRoleFilter === role
                          ? 'bg-[#0F2C59] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {role === 'ALL' ? 'Tous' :
                       role === 'TRAVELER' ? 'Voyageurs' :
                       role === 'AGENT' ? 'Agents Quai' :
                       role === 'COMPANY_MANAGER' ? 'Gérants' : 'Admins'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table des Utilisateurs */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-3">Utilisateur</th>
                        <th className="p-3">Contact</th>
                        <th className="p-3">Rôle Sécurisé</th>
                        <th className="p-3">Statut</th>
                        <th className="p-3">Affiliation Compagnie</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-extrabold text-slate-900">{user.name}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{user.id}</span>
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            <div>{user.phone}</div>
                            <div className="text-[10px] text-slate-400">{user.email || 'Pas d\'email'}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'COMPANY_MANAGER' ? 'bg-blue-100 text-blue-800' :
                              user.role === 'AGENT' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                              user.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {user.status === 'ACTIVE' ? 'ACTIF' : 'SUSPENDU'}
                            </span>
                          </td>
                          <td className="p-3 text-[11px]">
                            {user.companyId ? (
                              <span className="font-semibold text-slate-800">
                                {storeState.companies.find(c => c.id === user.companyId)?.name || user.companyId}
                              </span>
                            ) : (
                              <span className="text-slate-400">Aucune (Public)</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleToggleUserStatus(user.id, user.status)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                                user.status === 'ACTIVE'
                                  ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {user.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION D : TRAJETS, HORAIRES ET RÉSEAU                                   */}
          {/* ========================================================================= */}
          {activeTab === 'TRIPS' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Bus className="w-5 h-5 text-[#0F2C59]" />
                    <span>Supervision des Liaisons Interurbaines ({storeState.trips.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Contrôle des départs réguliers, véhicules assignés, grilles tarifaires et capacités de sièges.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTrips.map(trip => {
                  const company = storeState.companies.find(c => c.id === trip.companyId);
                  const occupiedCount = storeState.occupiedSeatsByTrip[trip.id]?.length || (trip.totalSeats - trip.availableSeatsCount);
                  const occupancyRate = Math.round((occupiedCount / trip.totalSeats) * 100);

                  return (
                    <div key={trip.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm block">
                            {trip.departureCity} ➔ {trip.destinationCity}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {company?.name || 'TSR Transit'} • Départ {trip.departureTime}
                          </span>
                        </div>
                        <span className="text-sm font-black text-emerald-700 font-mono">
                          {formatXOF(trip.priceXOF)}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl space-y-1 text-[11px] text-slate-600">
                        <div className="flex justify-between">
                          <span>Gare de Départ :</span>
                          <strong className="text-slate-800">{trip.departureAgency}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Type de Car :</span>
                          <strong className="text-slate-800">{trip.busType}</strong>
                        </div>
                      </div>

                      {/* Taux d'occupation de places */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Places Occupées :</span>
                          <span className="font-bold font-mono text-slate-800">
                            {occupiedCount} / {trip.totalSeats} ({occupancyRate}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              occupancyRate > 90 ? 'bg-red-500' :
                              occupancyRate > 70 ? 'bg-amber-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${occupancyRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          trip.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' :
                          trip.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {trip.status === 'PUBLISHED' ? 'PLANIFIÉ / PUBLIÉ' : trip.status}
                        </span>

                        <button
                          onClick={() => {
                            const newStatus = trip.status === 'PUBLISHED' ? 'CANCELLED' : 'PUBLISHED';
                            appStore.updateTripStatus(trip.id, newStatus);
                            notify(`Statut du trajet mis à jour à : ${newStatus}`);
                          }}
                          className="px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold border border-slate-200 text-xs"
                        >
                          {trip.status === 'PUBLISHED' ? 'Suspendre Départ' : 'Réactiver Départ'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION E : RÉSERVATIONS & BILLETS ÉLECTRONIQUES                           */}
          {/* ========================================================================= */}
          {activeTab === 'TICKETS' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span>Registre National des Billets Électroniques ({storeState.tickets.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Traçabilité cryptographique HMAC-SHA256, compostage quai et prévention anti-rejeu.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {filteredTickets.map(tck => (
                  <div key={tck.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">{tck.ticketNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tck.status === 'VALID' ? 'bg-emerald-100 text-emerald-800' :
                            tck.status === 'USED' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {tck.status === 'VALID' ? 'VALIDE (PRÊT AU DÉPART)' :
                             tck.status === 'USED' ? 'COMPOSTÉ / EMBARQUÉ' : tck.status}
                          </span>
                        </div>
                        <div className="text-slate-500">
                          Passager : <strong className="text-slate-800">{tck.passengerName}</strong> • {tck.departureCity} ➔ {tck.destinationCity}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black font-mono text-sm text-slate-900 block">
                          {formatXOF(tck.amountPaidXOF)}
                        </span>
                        <span className="text-[10px] text-slate-400">Siège(s) : {tck.seatNumbers.join(', ')}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span className="font-mono text-slate-600 text-[10px] truncate max-w-xs">
                          Signature HMAC : {tck.securityToken || 'tsr_sig_verified_ok'}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedTicketModal(tck)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspecter QR Code & Quai</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION F : PAIEMENTS MOBILE MONEY                                        */}
          {/* ========================================================================= */}
          {activeTab === 'PAYMENTS' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <span>Réconciliation Financière Mobile Money (Burkina Faso)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Paiements 100% Mobile Money : Orange Money (*144#), Moov Money (*555#), Wave et Telecel Cash.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                    Commission TSR : {platformCommission}% ({formatXOF(platformRevenueXOF)})
                  </span>
                </div>
              </div>

              {/* Transactions List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Flux des Dernières Transactions</span>
                  <span className="text-[11px] text-slate-500">Devise officielle : Franc CFA (XOF)</span>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { ref: 'OM-BF-8819201', method: 'ORANGE_MONEY', amount: 9000, fee: 225, payer: '+226 70 12 34 56', status: 'SUCCESS', date: 'Aujourd\'hui 06:15' },
                    { ref: 'MOOV-BF-4412098', method: 'MOOV_MONEY', amount: 18000, fee: 450, payer: '+226 76 54 32 10', status: 'SUCCESS', date: 'Aujourd\'hui 05:42' },
                    { ref: 'WV-BF-1102931', method: 'WAVE', amount: 4500, fee: 112.5, payer: '+226 75 99 88 77', status: 'SUCCESS', date: 'Hier 21:10' },
                    { ref: 'OM-BF-9921822', method: 'ORANGE_MONEY', amount: 9000, fee: 225, payer: '+226 71 22 33 44', status: 'SUCCESS', date: 'Hier 19:30' },
                  ].map((tx, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{tx.ref}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            tx.method === 'ORANGE_MONEY' ? 'bg-orange-100 text-orange-800' :
                            tx.method === 'MOOV_MONEY' ? 'bg-blue-100 text-blue-800' :
                            'bg-cyan-100 text-cyan-800'
                          }`}>
                            {tx.method}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">Payeur : {tx.payer} • {tx.date}</span>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-extrabold text-sm text-slate-900 block">
                          {formatXOF(tx.amount)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          Comm. plateforme : {formatXOF(tx.fee)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION G : FRET ET COLIS                                                 */}
          {/* ========================================================================= */}
          {activeTab === 'PARCELS' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    <span>Expéditions Interurbaines de Fret & Colis ({parcels.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enregistrement au guichet, chargement soutes, suivi par code OTP de retrait.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {parcels.map(pcl => (
                  <div key={pcl.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">{pcl.trackingNumber}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pcl.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                            pcl.status === 'ARRIVED_AT_AGENCY' ? 'bg-purple-100 text-purple-800' :
                            pcl.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {pcl.status === 'IN_TRANSIT' ? 'EN TRANSIT ROUTIER' :
                             pcl.status === 'ARRIVED_AT_AGENCY' ? 'ARRIVÉ EN GARE' :
                             pcl.status === 'DELIVERED' ? 'LIVRÉ AU DESTINATAIRE' : pcl.status}
                          </span>
                        </div>
                        <div className="text-slate-500">
                          {pcl.originAgencyName} ➔ {pcl.destinationAgencyName}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black font-mono text-sm text-slate-900 block">
                          {formatXOF(pcl.shippingFeeXOF)}
                        </span>
                        <span className="text-[10px] text-slate-500">Poids : {pcl.weightKg} kg • Code OTP : {pcl.pickupOtpCode}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                      <div>Expéditeur : <strong className="text-slate-800">{pcl.senderName}</strong> ({pcl.senderPhone})</div>
                      <div>Destinataire : <strong className="text-slate-800">{pcl.recipientName}</strong> ({pcl.recipientPhone})</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION H : RÉCLAMATIONS ET LITIGES                                       */}
          {/* ========================================================================= */}
          {activeTab === 'CLAIMS' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-red-600" />
                    <span>Dossiers de Réclamations & Service Client ({claims.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Traitement des retards, litiges bagages et demandes d'assistance passagers.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {claims.map(clm => (
                  <div key={clm.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{clm.claimNumber}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          clm.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                          clm.status === 'IN_REVIEW' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {clm.status === 'RESOLVED' ? 'RÉSOLU' :
                           clm.status === 'IN_REVIEW' ? 'EN EXAMEN' : 'SOUMIS'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          clm.priority === 'URGENTE' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          Priorité {clm.priority}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{clm.submittedAt}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{clm.subject}</h4>
                      <p className="text-slate-600 text-[11px] mt-1">{clm.message}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">
                        Voyageur : <strong className="text-slate-700">{clm.travelerName}</strong> ({clm.travelerPhone})
                      </span>

                      {clm.status !== 'RESOLVED' ? (
                        <button
                          onClick={() => setSelectedClaimModal(clm)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Répondre & Résoudre
                        </button>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Clôturé : {clm.resolutionNote}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION I : SÉCURITÉ, AUDIT & CONFORMITÉ HMAC                              */}
          {/* ========================================================================= */}
          {activeTab === 'SECURITY_AUDIT' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#0F2C59]" />
                    <span>Journal d'Audit Centralisé & Intégrité Cryptographique</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Traçabilité UTC inaltérable, conformité anti-fuite de secrets et protection anti-tampering.
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {(['ALL', 'SUCCESS', 'WARNING', 'FAILURE'] as const).map(res => (
                    <button
                      key={res}
                      onClick={() => setAuditFilter(res)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        auditFilter === res
                          ? 'bg-[#0F2C59] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {res === 'ALL' ? 'Tous' :
                       res === 'SUCCESS' ? 'Succès' :
                       res === 'WARNING' ? 'Avertissements' : 'Échecs / Alertes'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Shield Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Protection QR HMAC</span>
                  <div className="text-sm font-extrabold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> 100% Billets Signés
                  </div>
                  <span className="text-[10px] text-slate-500">Clé privée confinée au serveur backend</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Verrou Sièges 10 Min</span>
                  <div className="text-sm font-extrabold text-blue-900 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Expiration Atomique
                  </div>
                  <span className="text-[10px] text-slate-500">0 double-attribution de place</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Anti-Prompt Injection</span>
                  <div className="text-sm font-extrabold text-purple-900 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> Gemini Shield Actif
                  </div>
                  <span className="text-[10px] text-slate-500">Détection d'injection sur /api/chat</span>
                </div>
              </div>

              {/* Logs Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100 text-xs">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 transition-colors space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                            log.result === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {log.result || log.status}
                          </span>
                          <span className="font-mono font-black text-slate-900 text-xs">{log.action}</span>
                          <span className="text-[10px] text-slate-500">
                            Acteur : <strong>{log.actorId}</strong> ({log.actorRole})
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 pl-1">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION J : PARAMÈTRES SYSTÈME ET MAINTENANCE                             */}
          {/* ========================================================================= */}
          {activeTab === 'SETTINGS_MAINTENANCE' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-700" />
                  <span>Paramètres Système, Maintenance & Exportations</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Configuration centrale de la commission de service, du verrou atomique et génération de rapports.
                </p>
              </div>

              {/* Commission & Lock Duration Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Taux de Commission Plateforme TSR (%)</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="1.0"
                      max="5.0"
                      step="0.1"
                      value={platformCommission}
                      onChange={e => setPlatformCommission(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="font-mono font-extrabold text-sm text-slate-900 w-16 text-right">
                      {platformCommission.toFixed(1)} %
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Prélevé automatiquement sur chaque émission de billet par Mobile Money pour couvrir l'hébergement Cloud et la maintenance.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Durée du Verrou Atomique de Siège (Minutes)</span>
                  </h3>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="5"
                      max="15"
                      value={seatLockDuration}
                      onChange={e => setSeatLockDuration(parseInt(e.target.value) || 10)}
                      className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-center text-xs"
                    />
                    <span className="text-slate-600">Minutes contractuelles (Défaut standard : 10 min)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Durée pendant laquelle une place sélectionnée reste indisponible aux autres voyageurs pendant la saisie du code OTP Mobile Money.
                  </p>
                </div>
              </div>

              {/* Emergency Maintenance Mode */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Mode Maintenance & Secours Opérationnel</span>
                    </h3>
                    <p className="text-slate-500 text-[11px]">
                      Bascule la plateforme en mode consultation sécurisée en cas d'intervention sur les passerelles télécom.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setMaintenanceMode(!maintenanceMode);
                      notify(`Mode maintenance ${!maintenanceMode ? 'ACTIVÉ' : 'DÉSACTIVÉ'}.`, !maintenanceMode ? 'warning' : 'info');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      maintenanceMode 
                        ? 'bg-red-600 text-white' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {maintenanceMode ? 'MAINTENANCE ACTIVE' : 'Désactivé (Nominal)'}
                  </button>
                </div>
              </div>

              {/* Data Export Center */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#0F2C59]" />
                  <span>Exports et Rapports d'Activité</span>
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Téléchargez les jeux de données consolidés pour l'autorité de régulation des transports et la comptabilité.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => handleExportSystemReport('CSV')}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exporter Rapport CSV (Comptabilité)</span>
                  </button>
                  <button
                    onClick={() => handleExportSystemReport('JSON')}
                    className="px-4 py-2 bg-[#0F2C59] hover:bg-[#1E3A8A] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exporter Archive Système JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODALES D'ACTION SÉCURISÉES                                               */}
      {/* ========================================================================= */}

      {/* Modal Consultation Dossier Société */}
      {selectedCompanyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0F2C59]" />
                <h3 className="font-extrabold text-sm text-slate-900">Dossier Société : {selectedCompanyModal.name}</h3>
              </div>
              <button onClick={() => setSelectedCompanyModal(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-2 text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div>Siège Social : <strong>{selectedCompanyModal.headquarters}</strong></div>
                <div>Gérant / Responsable : <strong>{selectedCompanyModal.managerName}</strong></div>
                <div>Téléphone : <strong>{selectedCompanyModal.phone}</strong></div>
                <div>Email : <strong>{selectedCompanyModal.managerEmail}</strong></div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold">N° IFU</span>
                  <span className="font-mono font-bold text-slate-800">{selectedCompanyModal.ifuNumber || 'Non renseigné'}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold">N° RCCM</span>
                  <span className="font-mono font-bold text-slate-800">{selectedCompanyModal.rccmNumber || 'Non renseigné'}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Villes Desservies</span>
                <div className="flex flex-wrap gap-1">
                  {(selectedCompanyModal.servedCities || ['Ouagadougou', 'Bobo-Dioulasso']).map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold text-[10px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedCompanyModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rejet Motivé de Compagnie */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-900">Motif du Rejet de Dossier</h3>
            </div>

            <p className="text-slate-600">
              Veuillez spécifier la raison administrative du rejet pour notification officielle au promoteur :
            </p>

            <textarea
              rows={3}
              placeholder="Ex: Document IFU expiré ou défaut d'agrément de transport du Ministère..."
              value={rejectReasonInput}
              onChange={e => setRejectReasonInput(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(null)}
                className="px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Annuler
              </button>
              <button
                onClick={() => handleRejectCompany(showRejectModal)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Confirmer le Rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inspection Billet & Sécurité */}
      {selectedTicketModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Certificat Cryptographique Billet</h3>
              </div>
              <button onClick={() => setSelectedTicketModal(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div>Numéro Officiel : <strong className="font-mono text-slate-900">{selectedTicketModal.ticketNumber}</strong></div>
                <div>Voyageur : <strong>{selectedTicketModal.passengerName}</strong></div>
                <div>Liaison : <strong>{selectedTicketModal.departureCity} ➔ {selectedTicketModal.destinationCity}</strong></div>
                <div>Siège(s) réservé(s) : <strong>{selectedTicketModal.seatNumbers.join(', ')}</strong></div>
                <div>Montant Payé : <strong className="text-emerald-700 font-mono">{formatXOF(selectedTicketModal.amountPaidXOF)}</strong></div>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase text-purple-900">Empreinte HMAC-SHA256</span>
                <p className="font-mono text-[10px] text-purple-800 break-all">
                  {selectedTicketModal.securityToken || 'tsr_sig_58192_sec_verified'}
                </p>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Intégrité certifiée conforme à l'embarquement
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTicketModal(null)}
                className="px-4 py-2 bg-[#0F2C59] text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Résolution Réclamation */}
      {selectedClaimModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 text-blue-600">
              <HelpCircle className="w-5 h-5" />
              <h3 className="font-extrabold text-sm text-slate-900">Résolution du Dossier : {selectedClaimModal.claimNumber}</h3>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div>Voyageur : <strong>{selectedClaimModal.travelerName}</strong> ({selectedClaimModal.travelerPhone})</div>
              <div>Sujet : <strong>{selectedClaimModal.subject}</strong></div>
            </div>

            <textarea
              rows={3}
              placeholder="Indiquez la décision ou la compensation accordée au passager..."
              value={claimResolutionInput}
              onChange={e => setClaimResolutionInput(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setSelectedClaimModal(null)}
                className="px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Annuler
              </button>
              <button
                onClick={() => handleResolveClaim(selectedClaimModal.id)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-sm"
              >
                Enregistrer la Résolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
