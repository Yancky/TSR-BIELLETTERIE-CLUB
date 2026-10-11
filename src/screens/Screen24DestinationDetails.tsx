/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { appStore } from '../services/store';
import { DestinationService, BURKINA_DESTINATIONS } from '../services/destinationService';
import { DestinationInfo } from '../types';
import { 
  MapPin, Clock, Calendar, Compass, ShieldCheck, 
  ArrowRight, Search, Sun, ChevronRight, Bus, Tag 
} from 'lucide-react';

export const Screen24DestinationDetails: React.FC = () => {
  const [selectedDest, setSelectedDest] = useState<DestinationInfo>(BURKINA_DESTINATIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const destinations = DestinationService.searchDestinations(searchQuery);

  const handleBookTrip = (city: string) => {
    appStore.setSearchParams({
      departureCity: city === 'Ouagadougou' ? 'Bobo-Dioulasso' : 'Ouagadougou',
      destinationCity: city
    });
    appStore.navigateTo('06_SEARCH_RESULTS');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 text-slate-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white px-4 pt-6 pb-8 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Guide Voyage TSR</span>
            <h1 className="text-xl font-bold">Destinations du Burkina Faso</h1>
          </div>
          <span className="bg-blue-600/60 border border-blue-400/40 text-blue-100 text-xs px-2.5 py-1 rounded-full font-medium">
            {BURKINA_DESTINATIONS.length} villes desservies
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher une ville, région ou attrait..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-slate-800 text-sm pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Horizontal City Chips */}
        <div className="flex gap-2 overflow-x-auto mt-4 pt-1 no-scrollbar">
          {destinations.map(d => {
            const isSelected = selectedDest.id === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDest(d)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md scale-105'
                    : 'bg-blue-900/70 text-blue-100 hover:bg-blue-800/80'
                }`}
              >
                <MapPin className="w-3 h-3" />
                <span>{d.cityName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Destination Card */}
      <div className="p-4 max-w-3xl mx-auto space-y-5">
        {/* Destination Hero Image & Quick Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="relative h-48 w-full bg-slate-800">
            <img
              src={selectedDest.imageUrl}
              alt={selectedDest.cityName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">
                Région du {selectedDest.region}
              </span>
              <h2 className="text-2xl font-black">{selectedDest.cityName}</h2>
              <p className="text-xs text-slate-200 italic mt-0.5">{selectedDest.tagline}</p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-sm text-slate-700 leading-relaxed">
              {selectedDest.description}
            </p>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Tarif moyen</span>
                <span className="text-sm font-bold text-blue-700">{selectedDest.averageFareXOF.toLocaleString('fr-FR')} F</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Durée moyenne</span>
                <span className="text-sm font-bold text-slate-800">{selectedDest.averageDurationHours}h</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 block">Départs/jour</span>
                <span className="text-sm font-bold text-emerald-600">{selectedDest.dailyDeparturesCount}+</span>
              </div>
            </div>

            {/* Direct Booking CTA */}
            <button
              onClick={() => handleBookTrip(selectedDest.cityName)}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            >
              <Bus className="w-4 h-4" />
              <span>Voir les départs vers {selectedDest.cityName}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tourist Spots & Attractions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Compass className="w-4 h-4 text-blue-600" />
            <h3>Lieux emblématiques & Attraits à visiter</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedDest.popularSpots.map((spot, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-800">
                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                  {idx + 1}
                </div>
                <span className="font-medium">{spot}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Travel Tips & Security */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3>Conseils pratiques pour votre voyage</h3>
          </div>
          <ul className="space-y-2">
            {selectedDest.travelTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Climate & Season */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 flex items-start gap-3">
          <Sun className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900 block">Climat & Saisonnalité :</span>
            <p className="text-amber-800 mt-0.5">{selectedDest.climate}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
