import React, { useState } from 'react';
import { appStore } from '../services/store';
import { CompanyService, PublicCompanyView } from '../services/companyService';
import { BURKINA_CITIES } from '../services/mockData';
import { CompanyRegistrationModal } from '../components/CompanyRegistrationModal';
import { 
  Search, Building2, UserPlus, LogIn, MapPin, 
  ShieldCheck, Clock, Bus, CheckCircle2, FileText, 
  ChevronRight, ArrowUpDown, Phone, MessageSquare, AlertCircle,
  Calendar, Package, Luggage, HelpCircle, Award, BarChart3, Sparkles
} from 'lucide-react';

export const Screen02PublicHome: React.FC = () => {
  const [showRegModal, setShowRegModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'HOME' | 'COMPANIES' | 'CONTACT'>('HOME');

  // Search parameters in hero
  const [depCity, setDepCity] = useState('Ouagadougou');
  const [destCity, setDestCity] = useState('Bobo-Dioulasso');
  const [travelDate, setTravelDate] = useState('2026-10-11');
  const [passengers, setPassengers] = useState(1);
  const [searchError, setSearchError] = useState('');

  // Only ACTIVE companies are retrieved publicly
  const activeCompanies: PublicCompanyView[] = CompanyService.getPublicActiveCompanies();

  const handleSwapCities = () => {
    const temp = depCity;
    setDepCity(destCity);
    setDestCity(temp);
    setSearchError('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depCity.toLowerCase() === destCity.toLowerCase()) {
      setSearchError('La ville de départ et la destination doivent être différentes.');
      return;
    }

    appStore.setSearchParams({
      departureCity: depCity,
      destinationCity: destCity,
      date: travelDate,
      passengers
    });

    appStore.navigateTo('06_SEARCH_RESULTS');
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* 1. En-tête Public Professionnel */}
      <header className="bg-[#0F2C59] text-white px-4 sm:px-6 py-3.5 border-b border-blue-950 sticky top-0 z-20 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('HOME')}>
            <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-sm">
              <img
                src="/src/assets/images/tsr_transit_badge_1791641501297.jpg"
                alt="Logo TSR TRANSIT"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-base sm:text-lg block leading-none">
                TSR <span className="text-amber-400">TRANSIT</span>
              </span>
              <span className="text-[10px] text-blue-200">Burkina Faso</span>
            </div>
          </div>

          {/* Navigation tabs with direct links to new screens */}
          <nav className="hidden lg:flex items-center gap-4 text-xs font-semibold text-blue-100">
            <button
              onClick={() => setActiveTab('HOME')}
              className={`hover:text-white transition-colors ${activeTab === 'HOME' ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5' : ''}`}
            >
              Accueil
            </button>
            <button
              onClick={() => appStore.navigateTo('05_SEARCH_TRIP')}
              className="hover:text-white transition-colors"
            >
              Trajets (05)
            </button>
            <button
              onClick={() => appStore.navigateTo('25_SCHEDULES_CALENDAR')}
              className="hover:text-amber-300 transition-colors flex items-center gap-1"
              title="Écran 25 : Horaires et calendrier des départs"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Horaires (25)</span>
            </button>
            <button
              onClick={() => appStore.navigateTo('26_AGENCIES_MAP')}
              className="hover:text-amber-300 transition-colors flex items-center gap-1"
              title="Écran 26 : Carte des gares et agences"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Gares (26)</span>
            </button>
            <button
              onClick={() => appStore.navigateTo('28_PARCEL_TRACKING')}
              className="hover:text-amber-300 transition-colors flex items-center gap-1"
              title="Écran 28 : Expédition et suivi de colis"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Colis &amp; Fret (28)</span>
            </button>
            <button
              onClick={() => appStore.navigateTo('31_LOYALTY_PROGRAM')}
              className="hover:text-amber-300 transition-colors flex items-center gap-1"
              title="Écran 31 : Fidélité et abonnements"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Fidélité (31)</span>
            </button>
            <button
              onClick={() => appStore.navigateTo('30_SUPPORT_CLAIMS')}
              className="hover:text-amber-300 transition-colors flex items-center gap-1"
              title="Écran 30 : Centre d'aide et réclamations"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-300" />
              <span>Aide &amp; FAQ (30)</span>
            </button>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => appStore.navigateTo('03_LOGIN')}
              className="px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>
            <button
              onClick={() => appStore.navigateTo('04_REGISTER')}
              className="px-3 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">S'inscrire</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section Principale */}
      <div className="relative bg-gradient-to-b from-[#0F2C59] via-[#12366b] to-[#1E3A8A] text-white p-5 sm:p-8 overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-5 relative z-10">
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Plateforme Nationale Officielle de Billetterie</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Voyagez simplement à travers le Burkina Faso.
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              Recherchez vos trajets interurbains, réservez vos sièges en car grand confort et recevez votre billet électronique sécurisé par QR Code avec règlement Mobile Money (Orange Money, Moov Money, Wave).
            </p>
          </div>

          {/* Formulaire de recherche de trajet Hero */}
          <div className="bg-white text-slate-900 p-4 sm:p-5 rounded-3xl shadow-xl border border-slate-100">
            {searchError && (
              <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            <form onSubmit={handleSearchSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                {/* Ville de départ */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-700" />
                    <span>Départ</span>
                  </label>
                  <select
                    value={depCity}
                    onChange={e => setDepCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {BURKINA_CITIES.map(c => (
                      <option key={`dep-${c}`} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Destination */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>Destination</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleSwapCities}
                      className="text-[10px] text-blue-700 font-bold hover:underline flex items-center gap-0.5"
                      title="Inverser les villes"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                      <span>Inverser</span>
                    </button>
                  </div>
                  <select
                    value={destCity}
                    onChange={e => setDestCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {BURKINA_CITIES.map(c => (
                      <option key={`dest-${c}`} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Date de voyage
                  </label>
                  <input
                    type="date"
                    value={travelDate}
                    onChange={e => setTravelDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Voyageurs */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Voyageurs
                  </label>
                  <select
                    value={passengers}
                    onChange={e => setPassengers(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value={1}>1 voyageur</option>
                    <option value={2}>2 voyageurs</option>
                    <option value={3}>3 voyageurs</option>
                    <option value={4}>4 voyageurs</option>
                  </select>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-1 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Départs vérifiés quotidiennement sur les axes nationaux.
                </span>
                <button
                  type="submit"
                  className="w-full sm:w-auto py-3 px-6 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <Search className="w-4 h-4 text-slate-900" />
                  <span>Rechercher un trajet</span>
                </button>
              </div>
            </form>
          </div>

          {/* Bouton d'enregistrement visible exigé par le cahier des charges */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setShowRegModal(true)}
              className="py-3 px-6 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs border border-white/30 backdrop-blur-md flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Building2 className="w-4 h-4 text-amber-300" />
              <span>ENREGISTRER UNE SOCIÉTÉ DE TRANSPORT</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2.5 NOUVEAUX SERVICES & MODULES V2 (ÉCRANS 24 À 33) */}
      <section className="p-5 sm:p-8 max-w-6xl mx-auto w-full space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold">
                Nouveaux Services V2
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Services &amp; Espace Voyageurs TSR (Écrans 24 à 33)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Découvrez l'ensemble des modules d'information, de fret, de bagages, de fidélité et d'assistance.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">10 nouveaux écrans reliés</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Écran 24 */}
          <button
            onClick={() => appStore.navigateTo('24_DESTINATION_DETAILS')}
            className="p-3 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-sm group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-blue-600 font-bold block">Écran 24</span>
              <h3 className="font-bold text-xs text-slate-900 leading-tight">Destinations &amp; Guides</h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Bobo, Ouaga, Koudougou, Fada...</p>
            </div>
          </button>

          {/* Écran 25 */}
          <button
            onClick={() => appStore.navigateTo('25_SCHEDULES_CALENDAR')}
            className="p-3 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-sm group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-amber-600 font-bold block">Écran 25</span>
              <h3 className="font-bold text-xs text-slate-900 leading-tight">Horaires &amp; Calendrier</h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Grille complète des départs quotidiens</p>
            </div>
          </button>

          {/* Écran 26 */}
          <button
            onClick={() => appStore.navigateTo('26_AGENCIES_MAP')}
            className="p-3 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-sm group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 font-bold block">Écran 26</span>
              <h3 className="font-bold text-xs text-slate-900 leading-tight">Gares &amp; Agences</h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Localisation, contacts &amp; services</p>
            </div>
          </button>

          {/* Écran 27 */}
          <button
            onClick={() => appStore.navigateTo('27_PARTNER_COMPANIES')}
            className="p-3 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-sm group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <Bus className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-purple-600 font-bold block">Écran 27</span>
              <h3 className="font-bold text-xs text-slate-900 leading-tight">Compagnies Partenaires</h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Transporteurs agréés &amp; avis clients</p>
            </div>
          </button>

          {/* Écran 28 */}
          <button
            onClick={() => appStore.navigateTo('28_PARCEL_TRACKING')}
            className="p-3 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-sm group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-cyan-600 font-bold block">Écran 28</span>
              <h3 className="font-bold text-xs text-slate-900 leading-tight">Expédition &amp; Suivi Colis</h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Suivi fret interurbain en direct avec OTP</p>
            </div>
          </button>

          {/* Écran 29 */}
          <button
            onClick={() => appStore.navigateTo('29_LUGGAGE_LOST_FOUND')}
            className="p-3 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-sm group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <Luggage className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-rose-600 font-bold block">Écran 29</span>
              <h3 className="font-bold text-xs text-slate-900 leading-tight">Objets Perdus &amp; Bagages</h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Déclarer ou récupérer un bagage</p>
            </div>
          </button>

          {/* Écran 30 */}
          <button
            onClick={() => appStore.navigateTo('30_SUPPORT_CLAIMS')}
            className="p-3 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-sm group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-indigo-600 font-bold block">Écran 30</span>
              <h3 className="font-bold text-xs text-slate-900 leading-tight">Centre d'Aide &amp; FAQ</h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Assistance voyageur &amp; réclamations</p>
            </div>
          </button>

          {/* Écran 31 */}
          <button
            onClick={() => appStore.navigateTo('31_LOYALTY_PROGRAM')}
            className="p-3 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-sm group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-amber-600 font-bold block">Écran 31</span>
              <h3 className="font-bold text-xs text-slate-900 leading-tight">Fidélité &amp; Abonnements</h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Points voyages, remises &amp; pass</p>
            </div>
          </button>

          {/* Écran 32 */}
          <button
            onClick={() => appStore.navigateTo('32_AGENCY_PARCEL_DESK')}
            className="p-3 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-sm group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-teal-600 font-bold block">Écran 32 (Agent)</span>
              <h3 className="font-bold text-xs text-slate-900 leading-tight">Guichet Fret en Gare</h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Réception &amp; remise sécurisée par OTP</p>
            </div>
          </button>

          {/* Écran 33 */}
          <button
            onClick={() => appStore.navigateTo('33_OPERATIONAL_REPORTS')}
            className="p-3 bg-white hover:bg-blue-50/60 rounded-2xl border border-slate-200 hover:border-blue-400 text-left transition-all shadow-sm group flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-2 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-blue-600 font-bold block">Écran 33 (Stats)</span>
              <h3 className="font-bold text-xs text-slate-900 leading-tight">Rapports Opérationnels</h3>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">Recettes, taux d'occupation &amp; audits</p>
            </div>
          </button>
        </div>
      </section>

      {/* 3. Section Compagnies Agréées (Seules les compagnies ACTIVE) */}
      <section className="p-5 sm:p-8 max-w-6xl mx-auto space-y-5 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Compagnies Partenaires Officielles ({activeCompanies.length})
            </h2>
            <p className="text-xs text-slate-500">
              Seules les compagnies titulaires d'une autorisation officielle et au statut ACTIVE sont référencées.
            </p>
          </div>

          <button
            onClick={() => setShowRegModal(true)}
            className="text-xs font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Rejoindre le réseau</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {activeCompanies.map(comp => (
            <div
              key={comp.id}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 p-1.5 flex items-center justify-center border border-blue-100">
                    <img
                      src={comp.logoUrl || '/src/assets/images/tsr_transit_badge_1791641501297.jpg'}
                      alt={comp.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900">{comp.tradeName}</h3>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      Agrément Vérifié • ⭐ {comp.rating}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {comp.description || `Dessertes régulières et navettes express au départ de ${comp.headquarters}.`}
                </p>

                <div className="space-y-1 text-[11px] text-slate-500 border-t pt-2">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{comp.headquarters}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-mono text-slate-700">{comp.phone}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  appStore.setSearchParams({ departureCity: comp.city || 'Ouagadougou' });
                  appStore.navigateTo('06_SEARCH_RESULTS');
                }}
                className="w-full py-2 bg-slate-50 hover:bg-blue-50 text-blue-900 font-bold rounded-xl text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1 mt-2"
              >
                <span>Voir les départs {comp.tradeName}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Footer & Mentions Légales */}
      <footer className="mt-auto bg-slate-900 text-slate-300 p-6 border-t border-slate-800 text-xs">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-800 text-[11px]">
            <div className="space-y-2">
              <span className="font-bold text-white uppercase text-[10px] tracking-wider block">Voyages &amp; Lignes</span>
              <ul className="space-y-1 text-slate-400">
                <li><button onClick={() => appStore.navigateTo('05_SEARCH_TRIP')} className="hover:text-white">Recherche Départs (05)</button></li>
                <li><button onClick={() => appStore.navigateTo('25_SCHEDULES_CALENDAR')} className="hover:text-white">Horaires Quotidiens (25)</button></li>
                <li><button onClick={() => appStore.navigateTo('24_DESTINATION_DETAILS')} className="hover:text-white">Guides Villes &amp; Destinations (24)</button></li>
                <li><button onClick={() => appStore.navigateTo('26_AGENCIES_MAP')} className="hover:text-white">Carte des Gares &amp; Agences (26)</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-white uppercase text-[10px] tracking-wider block">Fret &amp; Services</span>
              <ul className="space-y-1 text-slate-400">
                <li><button onClick={() => appStore.navigateTo('28_PARCEL_TRACKING')} className="hover:text-white">Suivi &amp; Expédition Colis (28)</button></li>
                <li><button onClick={() => appStore.navigateTo('29_LUGGAGE_LOST_FOUND')} className="hover:text-white">Objets Perdus &amp; Bagages (29)</button></li>
                <li><button onClick={() => appStore.navigateTo('31_LOYALTY_PROGRAM')} className="hover:text-white">Fidélité &amp; Abonnements (31)</button></li>
                <li><button onClick={() => appStore.navigateTo('23_PROMO_END')} className="hover:text-white">Offres Promo Voyageurs (23)</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-white uppercase text-[10px] tracking-wider block">Assistance &amp; Légal</span>
              <ul className="space-y-1 text-slate-400">
                <li><button onClick={() => appStore.navigateTo('30_SUPPORT_CLAIMS')} className="hover:text-white">Centre d'Aide &amp; Réclamations (30)</button></li>
                <li><button onClick={() => setShowTermsModal(true)} className="hover:text-white">Conditions Générales (CGU)</button></li>
                <li><button onClick={() => setShowRegModal(true)} className="hover:text-amber-300">Agrément Transporteur</button></li>
                <li><button onClick={() => appStore.navigateTo('22_OFFLINE_MODE')} className="hover:text-white">Mode Hors Ligne (22)</button></li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-white uppercase text-[10px] tracking-wider block">Espace Professionnel</span>
              <ul className="space-y-1 text-slate-400">
                <li><button onClick={() => appStore.navigateTo('27_PARTNER_COMPANIES')} className="hover:text-white">Compagnies Partenaires (27)</button></li>
                <li><button onClick={() => appStore.navigateTo('32_AGENCY_PARCEL_DESK')} className="hover:text-white">Guichet Fret Agence (32)</button></li>
                <li><button onClick={() => appStore.navigateTo('33_OPERATIONAL_REPORTS')} className="hover:text-white">Rapports &amp; Statistiques (33)</button></li>
                <li><button onClick={() => appStore.navigateTo('16_QR_SCANNER')} className="hover:text-white">Scanner QR Embarquement (16)</button></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div>
              <span className="font-bold text-white">TSR TRANSIT • Plateforme Officielle de Transport</span>
              <p className="text-[10px] text-slate-500">Plateforme nationale interurbaine au Burkina Faso. 33 écrans intégrés.</p>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span>Paiements certifiés :</span>
              <span className="text-orange-400 font-bold">Orange Money</span>
              <span>•</span>
              <span className="text-blue-400 font-bold">Moov Money</span>
              <span>•</span>
              <span className="text-cyan-400 font-bold">Wave</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal officiel d'enregistrement de compagnie */}
      <CompanyRegistrationModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
      />

      {/* Modal CGU */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-3 shadow-xl text-slate-900">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Conditions d'Agrément &amp; Billetterie</span>
              </h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2 max-h-60 overflow-y-auto pr-1">
              <p>
                <strong>1. Agrément des compagnies :</strong> Toute société candidate est enregistrée au statut initial PENDING. L'administration centrale vérifie le RCCM, l'IFU et la licence de transport avant toute publication de départs.
              </p>
              <p>
                <strong>2. Transactions financières :</strong> Les recettes sont exclusivement traitées via des comptes marchands validés (Orange Money, Moov Money, Wave).
              </p>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full py-2 bg-blue-900 text-white rounded-xl text-xs font-bold"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
