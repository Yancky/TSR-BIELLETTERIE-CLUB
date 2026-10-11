import React from 'react';
import { appStore } from '../services/store';
import { formatXOF } from '../services/ticketSecurity';
import { 
  Building2, Bus, Ticket, TrendingUp, Users, 
  PlusCircle, Calendar, ArrowRight, ShieldCheck, MapPin 
} from 'lucide-react';

export const Screen14CompanyDashboard: React.FC = () => {
  const state = appStore.getState();
  const company = state.companies.find(c => c.id === 'comp_tsr') || state.companies[0];
  const companyTrips = state.trips.filter(t => t.companyId === company.id);
  const companyTickets = state.tickets.filter(t => t.companyName.includes('TSR'));

  // Metrics
  const totalRevenue = companyTickets.reduce((acc, t) => acc + t.amountPaidXOF, 450000);
  const totalPassengers = companyTickets.reduce((acc, t) => acc + t.seatNumbers.length, 52);
  const fillRate = '78%';

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 space-y-4">
      {/* Company Header */}
      <div className="bg-[#0F2C59] text-white p-4 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1.5 flex items-center justify-center">
              <img
                src="/src/assets/images/tsr_transit_badge_1791641501297.jpg"
                alt="Logo TSR"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="font-extrabold text-sm">{company.name}</h2>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full inline-block mt-0.5">
                Compagnie Agréée • {company.fleetCount} Cars
              </span>
            </div>
          </div>
        </div>

        <div className="pt-1 text-[11px] text-blue-200 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span>Siège : {company.headquarters}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Chiffre d'Affaires</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-extrabold text-slate-900 font-mono">
            {formatXOF(totalRevenue)}
          </div>
          <span className="text-[9px] text-emerald-600 font-semibold block">Vérifié BCEAO</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Billets Vendus</span>
            <Ticket className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-sm font-extrabold text-slate-900 font-mono">
            {totalPassengers} billets
          </div>
          <span className="text-[9px] text-blue-600 font-semibold block">Aujourd'hui</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Départs Programmés</span>
            <Bus className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-sm font-extrabold text-slate-900 font-mono">
            {companyTrips.length} départs
          </div>
          <span className="text-[9px] text-slate-500 font-semibold block">Lignes actives</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">Taux Remplissage</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-extrabold text-slate-900 font-mono">
            {fillRate}
          </div>
          <span className="text-[9px] text-purple-600 font-semibold block">Moyenne flotte</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => appStore.navigateTo('15_MANAGE_TRIPS')}
          className="flex-1 py-2.5 px-3 bg-[#0F2C59] hover:bg-blue-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>Gérer les voyages &amp; départs</span>
        </button>

        <button
          onClick={() => appStore.navigateTo('16_QR_SCANNER')}
          className="py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
        >
          <span>Scanner de Gare</span>
        </button>
      </div>

      {/* Today's Departures List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Départs TSR du jour
          </h3>
          <button
            onClick={() => appStore.navigateTo('15_MANAGE_TRIPS')}
            className="text-xs text-blue-700 font-semibold hover:underline"
          >
            Tous les départs
          </button>
        </div>

        <div className="space-y-2">
          {companyTrips.slice(0, 3).map(trip => (
            <div
              key={trip.id}
              className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-slate-800">
                  {trip.departureCity} &rarr; {trip.destinationCity}
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-900">{trip.departureTime}</span>
                  <span>•</span>
                  <span>{trip.busType}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-slate-900 block">
                  {formatXOF(trip.priceXOF)}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  {trip.availableSeatsCount} places
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
