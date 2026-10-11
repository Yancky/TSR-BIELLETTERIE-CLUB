import React, { useState } from 'react';
import { appStore } from '../services/store';
import { BURKINA_CITIES } from '../services/mockData';
import { 
  MapPin, ArrowUpDown, Calendar, Users, Search, 
  Sparkles, Bus, ShieldCheck 
} from 'lucide-react';

export const Screen05SearchTrip: React.FC = () => {
  const state = appStore.getState();
  const [departureCity, setDepartureCity] = useState(state.searchDepartureCity);
  const [destinationCity, setDestinationCity] = useState(state.searchDestinationCity);
  const [date, setDate] = useState(state.searchDate);
  const [passengers, setPassengers] = useState(state.searchPassengersCount);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSwap = () => {
    const temp = departureCity;
    setDepartureCity(destinationCity);
    setDestinationCity(temp);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (departureCity === destinationCity) {
      setErrorMsg('La ville de départ et la destination doivent être différentes.');
      return;
    }

    appStore.setSearchParams({
      departureCity,
      destinationCity,
      date,
      passengers
    });

    appStore.navigateTo('06_SEARCH_RESULTS');
  };

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 bg-slate-50 justify-between">
      <div className="space-y-4">
        {/* Banner with bus image */}
        <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200">
          <img
            src="/src/assets/images/tsr_coach_burkina_1791641491022.jpg"
            alt="Car TSR sur route du Faso"
            className="w-full h-32 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent flex flex-col justify-end p-3.5 text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Lignes Nationales &amp; Confort
            </span>
            <h2 className="text-sm font-extrabold">Où souhaitez-vous voyager ?</h2>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Search Card Form */}
        <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3.5">
          {/* Departure & Destination with Swap button */}
          <div className="space-y-2 relative">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Ville de départ</span>
              </label>
              <select
                value={departureCity}
                onChange={e => setDepartureCity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {BURKINA_CITIES.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-end -my-2.5 pr-4 relative z-10">
              <button
                type="button"
                onClick={handleSwap}
                className="w-7 h-7 rounded-full bg-white border border-slate-300 text-blue-700 hover:bg-blue-50 flex items-center justify-center shadow-sm transition-transform active:rotate-180"
                title="Inverser les villes"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Destination</span>
              </label>
              <select
                value={destinationCity}
                onChange={e => setDestinationCity(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {BURKINA_CITIES.map(city => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Passengers Row */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Date de voyage</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Passagers</span>
              </label>
              <select
                value={passengers}
                onChange={e => setPassengers(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value={1}>1 voyageur</option>
                <option value={2}>2 voyageurs</option>
                <option value={3}>3 voyageurs</option>
                <option value={4}>4 voyageurs</option>
              </select>
            </div>
          </div>

          {/* Submit Search button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#0F2C59] hover:bg-blue-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] mt-2"
          >
            <Search className="w-4 h-4 text-amber-400" />
            <span>Rechercher les départs</span>
          </button>
        </form>

        {/* Quick Route badges */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Destinations directes fréquentes :
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { from: 'Ouagadougou', to: 'Bobo-Dioulasso' },
              { from: 'Ouagadougou', to: 'Koudougou' },
              { from: 'Bobo-Dioulasso', to: 'Ouagadougou' },
              { from: 'Ouagadougou', to: 'Ouahigouya' }
            ].map(r => (
              <button
                key={`${r.from}-${r.to}`}
                type="button"
                onClick={() => {
                  setDepartureCity(r.from);
                  setDestinationCity(r.to);
                }}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 font-medium transition-colors"
              >
                {r.from} &rarr; {r.to}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-3 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
        <span>Garantie de place et billet certifié par QR Code</span>
      </div>
    </div>
  );
};
