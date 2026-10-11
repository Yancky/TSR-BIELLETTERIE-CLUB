import React, { useState } from 'react';
import { appStore } from '../services/store';
import { DepartureTrip } from '../types';
import { formatXOF } from '../services/ticketSecurity';
import { 
  Bus, Clock, MapPin, Users, SlidersHorizontal, 
  ArrowRight, Check, Sparkles, Filter 
} from 'lucide-react';

export const Screen06SearchResults: React.FC = () => {
  const state = appStore.getState();
  const [filterType, setFilterType] = useState<'ALL' | 'VIP' | 'STANDARD'>('ALL');
  const [sortBy, setSortBy] = useState<'TIME' | 'PRICE'>('TIME');

  const filteredTrips = state.trips.filter(t => {
    // Match route cities
    const matchRoute =
      t.departureCity.toLowerCase() === state.searchDepartureCity.toLowerCase() &&
      t.destinationCity.toLowerCase() === state.searchDestinationCity.toLowerCase();
    
    if (!matchRoute) return false;

    if (filterType === 'VIP') {
      return t.busType.toLowerCase().includes('vip');
    }
    if (filterType === 'STANDARD') {
      return !t.busType.toLowerCase().includes('vip');
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'PRICE') return a.priceXOF - b.priceXOF;
    return a.departureTime.localeCompare(b.departureTime);
  });

  const handleSelectTrip = (trip: DepartureTrip) => {
    appStore.selectTrip(trip);
    appStore.navigateTo('07_TRIP_DETAILS');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 space-y-3">
      {/* Route Header Info Card */}
      <div className="bg-[#0F2C59] text-white p-3.5 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold">
            <span>{state.searchDepartureCity}</span>
            <span className="text-amber-400">&rarr;</span>
            <span>{state.searchDestinationCity}</span>
          </div>
          <button
            onClick={() => appStore.navigateTo('05_SEARCH_TRIP')}
            className="text-[11px] text-blue-200 hover:text-white underline"
          >
            Modifier
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-blue-200">
          <span>Date : {state.searchDate}</span>
          <span>{state.searchPassengersCount} passager(s)</span>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto py-1 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterType === 'ALL'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Tous les départs
          </button>
          <button
            onClick={() => setFilterType('VIP')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterType === 'VIP'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Car VIP Climatisé
          </button>
          <button
            onClick={() => setFilterType('STANDARD')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterType === 'STANDARD'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Standard
          </button>
        </div>

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'TIME' | 'PRICE')}
          className="p-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 font-medium shrink-0"
        >
          <option value="TIME">Trier : Horaire</option>
          <option value="PRICE">Trier : Prix croissant</option>
        </select>
      </div>

      {/* Trips list */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {filteredTrips.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl text-center space-y-3 border border-slate-200 my-auto">
            <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-full mx-auto flex items-center justify-center">
              <Bus className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">
              Aucun départ direct trouvé pour cette sélection
            </h3>
            <p className="text-xs text-slate-500">
              Essayez la ligne principale Ouagadougou &harr; Bobo-Dioulasso ou modifiez la date.
            </p>
            <button
              onClick={() => {
                appStore.setSearchParams({
                  departureCity: 'Ouagadougou',
                  destinationCity: 'Bobo-Dioulasso'
                });
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Afficher Ouagadougou &rarr; Bobo-Dioulasso
            </button>
          </div>
        ) : (
          filteredTrips.map(trip => {
            const company = state.companies.find(c => c.id === trip.companyId);
            return (
              <div
                key={trip.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm transition-all space-y-3"
              >
                {/* Header: Company & Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-blue-50 p-1 flex items-center justify-center">
                      <img
                        src="/src/assets/images/tsr_transit_badge_1791641501297.jpg"
                        alt="Logo TSR"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-900 block leading-none">
                        {company?.name || 'TSR TRANSIT'}
                      </span>
                      <span className="text-[10px] text-slate-400">{trip.busType}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {trip.availableSeatsCount} places libres
                  </span>
                </div>

                {/* Times & Route Row */}
                <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      {trip.departureTime}
                    </span>
                    <span className="block text-[10px] text-slate-500 truncate max-w-[110px]">
                      {trip.departureAgency}
                    </span>
                  </div>

                  <div className="flex flex-col items-center px-2">
                    <span className="text-[10px] text-slate-400 font-mono">Direct</span>
                    <div className="w-16 h-0.5 bg-blue-300 relative my-1">
                      <div className="w-2 h-2 rounded-full bg-blue-600 absolute right-0 -top-[3px]" />
                    </div>
                    <span className="text-[10px] text-slate-500">~5h 15m</span>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900 font-mono">
                      {trip.arrivalTime}
                    </span>
                    <span className="block text-[10px] text-slate-500 truncate max-w-[110px]">
                      {trip.arrivalAgency}
                    </span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tarif par passager</span>
                    <span className="text-sm font-extrabold text-blue-900 font-mono">
                      {formatXOF(trip.priceXOF)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectTrip(trip)}
                    className="px-4 py-2 bg-[#0F2C59] hover:bg-blue-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                  >
                    <span>Voir le trajet</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
