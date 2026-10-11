import React, { useState } from 'react';
import { ScreenId, UserRole } from '../types';
import { appStore } from '../services/store';
import { 
  Smartphone, Monitor, Users, Shield, ArrowLeft,
  ChevronRight, Sparkles, Wifi, WifiOff, X, Layers
} from 'lucide-react';

export const SCREENS_LIST: { id: ScreenId; num: string; group: string; label: string; roleHint?: string }[] = [
  // Groupe A
  { id: '01_SPLASH', num: '01', group: 'A. Accueil & Auth', label: 'Splash Screen' },
  { id: '02_PUBLIC_HOME', num: '02', group: 'A. Accueil & Auth', label: 'Accueil Public' },
  { id: '03_LOGIN', num: '03', group: 'A. Accueil & Auth', label: 'Connexion Multi-Rôles' },
  { id: '04_REGISTER', num: '04', group: 'A. Accueil & Auth', label: 'Inscription Voyageur' },

  // Groupe B
  { id: '05_SEARCH_TRIP', num: '05', group: 'B. Recherche & Réservation', label: 'Recherche de Trajet' },
  { id: '06_SEARCH_RESULTS', num: '06', group: 'B. Recherche & Réservation', label: 'Résultats & Filtres' },
  { id: '07_TRIP_DETAILS', num: '07', group: 'B. Recherche & Réservation', label: 'Détails du Trajet' },
  { id: '08_SEAT_SELECTION', num: '08', group: 'B. Recherche & Réservation', label: 'Sélection des Sièges' },

  // Groupe C
  { id: '09_PAYMENT', num: '09', group: 'C. Paiement & Billetterie', label: 'Paiement Mobile Money' },
  { id: '10_PAYMENT_CONFIRMATION', num: '10', group: 'C. Paiement & Billetterie', label: 'Confirmation Paiement' },
  { id: '11_ELECTRONIC_TICKET', num: '11', group: 'C. Paiement & Billetterie', label: 'Billet Électronique QR' },
  { id: '12_TRAVEL_HISTORY', num: '12', group: 'C. Paiement & Billetterie', label: 'Historique des Voyages' },

  // Groupe D
  { id: '13_TRAVELER_PROFILE', num: '13', group: 'D. Profil Voyageur', label: 'Profil Voyageur' },

  // Groupe E
  { id: '14_COMPANY_DASHBOARD', num: '14', group: 'E. Espace Compagnie & Agent', label: 'Tableau de Bord Compagnie', roleHint: 'Compagnie' },
  { id: '15_MANAGE_TRIPS', num: '15', group: 'E. Espace Compagnie & Agent', label: 'Gestion des Voyages', roleHint: 'Compagnie' },
  { id: '16_QR_SCANNER', num: '16', group: 'E. Espace Compagnie & Agent', label: 'Scanner QR & Validation', roleHint: 'Agent' },

  // Groupe F
  { id: '17_ADMIN_DASHBOARD', num: '17', group: 'F. Administration', label: 'Tableau de Bord Admin', roleHint: 'Admin' },
  { id: '18_REGISTER_COMPANY', num: '18', group: 'F. Administration', label: 'Enregistrer Société' },
  { id: '19_INTERACTIVE_MAP', num: '19', group: 'F. Administration', label: 'Carte des Compagnies' },

  // Groupe G
  { id: '20_NOTIFICATIONS', num: '20', group: 'G. Notifications & Paramètres', label: 'Centre Notifications' },
  { id: '21_SETTINGS', num: '21', group: 'G. Notifications & Paramètres', label: 'Paramètres' },
  { id: '22_OFFLINE_MODE', num: '22', group: 'G. Notifications & Paramètres', label: 'Mode Hors Connexion' },
  { id: '23_PROMO_END', num: '23', group: 'G. Notifications & Paramètres', label: 'Écran Promo Fin de Parcours' },

  // Groupe H — Informations & Réseau (Phase V2)
  { id: '24_DESTINATION_DETAILS', num: '24', group: 'H. Informations & Réseau Voyageurs', label: 'Détails Destination & Guides' },
  { id: '25_SCHEDULES_CALENDAR', num: '25', group: 'H. Informations & Réseau Voyageurs', label: 'Horaires & Calendrier Départs' },
  { id: '26_AGENCIES_MAP', num: '26', group: 'H. Informations & Réseau Voyageurs', label: 'Carte des Agences & Gares' },
  { id: '27_PARTNER_COMPANIES', num: '27', group: 'H. Informations & Réseau Voyageurs', label: 'Compagnies Partenaires Agréées' },

  // Groupe I — Fret, Bagages & Assistance (Phase V2)
  { id: '28_PARCEL_TRACKING', num: '28', group: 'I. Fret, Bagages & Assistance', label: 'Expédition & Suivi Colis' },
  { id: '29_LUGGAGE_LOST_FOUND', num: '29', group: 'I. Fret, Bagages & Assistance', label: 'Objets Perdus & Bagages' },
  { id: '30_SUPPORT_CLAIMS', num: '30', group: 'I. Fret, Bagages & Assistance', label: 'Centre d\'Aide & Réclamations' },
  { id: '31_LOYALTY_PROGRAM', num: '31', group: 'I. Fret, Bagages & Assistance', label: 'Fidélité & Abonnements' },

  // Groupe J — Opérations & Rapports (Phase V2)
  { id: '32_AGENCY_PARCEL_DESK', num: '32', group: 'J. Opérations & Rapports V2', label: 'Guichet Fret en Gare', roleHint: 'Agent' },
  { id: '33_OPERATIONAL_REPORTS', num: '33', group: 'J. Opérations & Rapports V2', label: 'Rapports & Statistiques', roleHint: 'Compagnie/Admin' }
];

interface ScreenNavDrawerProps {
  currentScreen: ScreenId;
  isMobileFrame: boolean;
  isOffline: boolean;
  currentUserRole?: UserRole;
}

export const ScreenNavDrawer: React.FC<ScreenNavDrawerProps> = ({
  currentScreen,
  isMobileFrame,
  isOffline,
  currentUserRole
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const allGroups = Array.from(new Set(SCREENS_LIST.map(s => s.group)));
  const currentMeta = SCREENS_LIST.find(s => s.id === currentScreen) || SCREENS_LIST[0];

  const handleSelectScreen = (screenId: ScreenId) => {
    appStore.navigateTo(screenId);
    setIsOpen(false);
  };

  const handleRoleChange = (role: UserRole) => {
    appStore.loginAsRole(role);
  };

  const filteredGroups = selectedGroupFilter === 'ALL'
    ? allGroups
    : selectedGroupFilter === 'V2'
    ? allGroups.filter(g => g.startsWith('H.') || g.startsWith('I.') || g.startsWith('J.'))
    : allGroups.filter(g => g === selectedGroupFilter);

  return (
    <>
      {/* Floating Navigator Bar at Top */}
      <aside aria-label="Sélecteur d'écran et barre de contrôle" className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 px-3 py-2 flex items-center justify-between text-xs shadow-lg">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md font-semibold shrink-0 transition-colors shadow-sm"
            title="Ouvrir la liste complète des 33 écrans TSR"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>33 Écrans TSR</span>
            <span className="bg-blue-800 px-1.5 py-0.2 rounded text-[10px] font-mono">
              {currentMeta.num}/33
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-300 shrink-0 font-medium">
            <span className="text-blue-400 font-mono font-semibold">Écran {currentMeta.num} :</span>
            <span className="text-white truncate max-w-[200px]">{currentMeta.label}</span>
          </div>

          {/* Quick jump to new screens 24-33 */}
          <div className="hidden xl:flex items-center gap-1 pl-2 border-l border-slate-700">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Accès direct V2 (24-33) :</span>
            <button
              onClick={() => appStore.navigateTo('24_DESTINATION_DETAILS')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px]"
              title="Écran 24 : Destinations"
            >
              24
            </button>
            <button
              onClick={() => appStore.navigateTo('25_SCHEDULES_CALENDAR')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px]"
              title="Écran 25 : Horaires"
            >
              25
            </button>
            <button
              onClick={() => appStore.navigateTo('26_AGENCIES_MAP')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px]"
              title="Écran 26 : Gares"
            >
              26
            </button>
            <button
              onClick={() => appStore.navigateTo('27_PARTNER_COMPANIES')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px]"
              title="Écran 27 : Compagnies"
            >
              27
            </button>
            <button
              onClick={() => appStore.navigateTo('28_PARCEL_TRACKING')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px]"
              title="Écran 28 : Colis"
            >
              28
            </button>
            <button
              onClick={() => appStore.navigateTo('29_LUGGAGE_LOST_FOUND')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px]"
              title="Écran 29 : Bagages"
            >
              29
            </button>
            <button
              onClick={() => appStore.navigateTo('30_SUPPORT_CLAIMS')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px]"
              title="Écran 30 : Aide"
            >
              30
            </button>
            <button
              onClick={() => appStore.navigateTo('31_LOYALTY_PROGRAM')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px]"
              title="Écran 31 : Fidélité"
            >
              31
            </button>
            <button
              onClick={() => appStore.navigateTo('32_AGENCY_PARCEL_DESK')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px]"
              title="Écran 32 : Guichet Fret"
            >
              32
            </button>
            <button
              onClick={() => appStore.navigateTo('33_OPERATIONAL_REPORTS')}
              className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px]"
              title="Écran 33 : Rapports"
            >
              33
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Role Switcher */}
          <div className="hidden md:flex items-center gap-1 bg-slate-800 p-0.5 rounded-md text-[11px]">
            <span className="px-2 text-slate-400 font-normal">Rôle :</span>
            {(['TRAVELER', 'COMPANY_MANAGER', 'AGENT', 'ADMIN'] as UserRole[]).map(r => {
              const active = currentUserRole === r;
              const label = r === 'TRAVELER' ? 'Voyageur' : r === 'COMPANY_MANAGER' ? 'Compagnie' : r === 'AGENT' ? 'Agent' : 'Admin';
              return (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={`px-2 py-1 rounded transition-colors ${
                    active ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Toggle Offline Mode */}
          <button
            onClick={() => appStore.toggleOfflineMode()}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md font-medium transition-colors ${
              isOffline
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
            title="Basculer le mode Hors Connexion"
          >
            {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isOffline ? 'Hors Ligne' : 'En Ligne'}</span>
          </button>

          {/* Toggle Mobile Frame Mockup vs Web Fullscreen */}
          <button
            onClick={() => appStore.toggleMobileFrame()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors cursor-pointer"
            title="Basculer entre le cadre Android Mobile et le mode Plein Écran Web"
          >
            {isMobileFrame ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden lg:inline">Vue Large</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden lg:inline">Vue Mobile</span>
              </>
            )}
          </button>

          {/* Android APK Button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-android-apk-modal'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-md transition-colors font-bold shadow-sm cursor-pointer"
            title="Installer ou compiler l'Application Android (APK / WebAPK)"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">App APK</span>
          </button>
        </div>
      </aside>

      {/* Screen Selection Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
                  TSR
                </div>
                <div>
                  <h2 className="font-bold text-sm">Navigation des 33 Écrans</h2>
                  <p className="text-[11px] text-amber-300">Plateforme Complète TSR TRANSIT V3 (Écrans 01 à 33)</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Filter Bar */}
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-slate-500 font-bold shrink-0">Filtrer :</span>
              <button
                onClick={() => setSelectedGroupFilter('ALL')}
                className={`px-2 py-0.5 rounded-full font-semibold shrink-0 transition-colors ${
                  selectedGroupFilter === 'ALL'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Tous (33)
              </button>
              <button
                onClick={() => setSelectedGroupFilter('V2')}
                className={`px-2 py-0.5 rounded-full font-bold shrink-0 transition-colors flex items-center gap-1 ${
                  selectedGroupFilter === 'V2'
                    ? 'bg-amber-500 text-slate-900 shadow-sm'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-700" />
                <span>Écrans 24 à 33 (Nouveautés)</span>
              </button>
            </div>

            {/* Quick Role bar in drawer */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Profil actif :</span>
              <div className="flex gap-1">
                {(['TRAVELER', 'COMPANY_MANAGER', 'AGENT', 'ADMIN'] as UserRole[]).map(r => {
                  const active = currentUserRole === r;
                  const label = r === 'TRAVELER' ? 'Voyageur' : r === 'COMPANY_MANAGER' ? 'Compagnie' : r === 'AGENT' ? 'Agent' : 'Admin';
                  return (
                    <button
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        active ? 'bg-blue-700 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Screens List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredGroups.map(groupName => {
                const screensInGroup = SCREENS_LIST.filter(s => s.group === groupName);
                const isV2Group = groupName.startsWith('H.') || groupName.startsWith('I.') || groupName.startsWith('J.');
                return (
                  <div key={groupName} className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        {groupName}
                      </h3>
                      {isV2Group && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                          Nouveauté V2
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {screensInGroup.map(s => {
                        const isActive = currentScreen === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => handleSelectScreen(s.id)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-all ${
                              isActive
                                ? 'bg-blue-50 border-2 border-blue-600 text-blue-900 font-bold shadow-sm'
                                : 'bg-white border border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[11px] font-bold ${
                                isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {s.num}
                              </span>
                              <div>
                                <div className="font-semibold">{s.label}</div>
                                {s.roleHint && (
                                  <span className="text-[10px] text-blue-600 font-medium">
                                    Accès réservé : {s.roleHint}
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500">
              TSR TRANSIT • Tous les 33 écrans sont pleinement reliés et testables.
            </div>
          </div>
        </div>
      )}
    </>
  );
};
