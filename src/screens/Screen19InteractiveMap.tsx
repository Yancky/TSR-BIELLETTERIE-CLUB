/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { appStore } from '../services/store';
import { Agency } from '../types';
import { GoogleMapsViewer } from '../components/GoogleMapsViewer';
import { 
  MapPin, Phone, Clock, Bus, Navigation, 
  ChevronRight, Layers, Compass
} from 'lucide-react';

export const Screen19InteractiveMap: React.FC = () => {
  const state = appStore.getState();
  const agencies = state.agencies;
  const [selectedAgency, setSelectedAgency] = useState<Agency>(agencies[0]);
  const [mapMode, setMapMode] = useState<'google' | 'routes'>('google');

  const handleBookFromAgency = (agency: Agency) => {
    appStore.setSearchParams({ departureCity: agency.city });
    appStore.navigateTo('05_SEARCH_TRIP');
  };

  const handleSelectFromMap = (loc: { id: string; name: string; city: string }) => {
    const matched = agencies.find(a => a.id === loc.id || a.city.toLowerCase() === loc.city.toLowerCase());
    if (matched) {
      setSelectedAgency(matched);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 justify-between space-y-3 pb-8">
      {/* Map Header info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Gares &amp; Agences Nationales</h2>
          <span className="text-[11px] text-slate-500">
            {agencies.length} gares géolocalisées au Burkina Faso
          </span>
        </div>
        <div className="flex gap-1 bg-slate-200 p-0.5 rounded-lg text-[10px] font-bold">
          <button
            onClick={() => setMapMode('google')}
            className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
              mapMode === 'google'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>Google Maps</span>
          </button>
          <button
            onClick={() => setMapMode('routes')}
            className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
              mapMode === 'routes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Corridors</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map Section */}
      {mapMode === 'google' ? (
        <div className="space-y-1.5">
          <GoogleMapsViewer
            agencies={agencies}
            selectedLocationId={selectedAgency.id}
            onSelectLocation={handleSelectFromMap}
            onBookDeparture={(city) => {
              appStore.setSearchParams({ departureCity: city });
              appStore.navigateTo('05_SEARCH_TRIP');
            }}
            center={{
              lat: selectedAgency.latitude || selectedAgency.lat || 12.3714,
              lng: selectedAgency.longitude || selectedAgency.lng || -1.5197
            }}
            zoom={selectedAgency.city === 'Ouagadougou' ? 12 : 11}
            height="270px"
          />
          <div className="flex justify-between items-center text-[10px] text-slate-500 px-1">
            <span>Repères interactifs Google Maps avec zoom &amp; fiches</span>
            <span className="font-semibold text-blue-700">Burkina Faso (BF)</span>
          </div>
        </div>
      ) : (
        /* Corridor Schematic View */
        <div className="relative bg-[#0F2C59] rounded-2xl p-4 shadow-md overflow-hidden h-[270px] flex flex-col justify-between border border-blue-900">
          <div className="flex justify-between items-start text-white text-[10px] font-mono z-10">
            <span className="bg-white/10 px-2 py-0.5 rounded">Afrique de l'Ouest • Corridors</span>
            <span className="text-amber-300 font-semibold">RN1 / RN2 / RN4</span>
          </div>

          <div className="relative w-full h-44 my-auto flex items-center justify-center">
            <svg
              viewBox="0 0 400 240"
              className="w-full h-full opacity-40 pointer-events-none"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M 60 140 Q 110 90, 160 80 Q 220 50, 290 80 Q 350 120, 340 160 Q 300 190, 240 210 Q 150 220, 90 190 Z"
                fill="#1E3A8A"
                stroke="#60A5FA"
                strokeWidth="2"
              />
              <path d="M 190 125 L 105 165" stroke="#F59E0B" strokeWidth="3" strokeDasharray="5 3" />
              <path d="M 190 125 L 140 135" stroke="#F59E0B" strokeWidth="2.5" />
              <path d="M 190 125 L 160 65" stroke="#F59E0B" strokeWidth="2" />
              <path d="M 190 125 L 300 130" stroke="#F59E0B" strokeWidth="2" />
            </svg>

            {/* Quick interactive points */}
            {agencies.slice(0, 5).map((ag, idx) => {
              const isSelected = selectedAgency.id === ag.id;
              const positions = [
                { top: '48%', left: '48%' }, // Ouaga
                { top: '38%', left: '50%' }, // Tanghin
                { top: '68%', left: '26%' }, // Bobo
                { top: '55%', left: '35%' }, // Koudougou
                { top: '28%', left: '40%' }, // Ouahigouya
              ];
              const pos = positions[idx] || { top: '50%', left: '50%' };
              return (
                <button
                  key={ag.id}
                  onClick={() => setSelectedAgency(ag)}
                  style={{ top: pos.top, left: pos.left }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-transform ${
                    isSelected ? 'scale-125 z-20' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className={`p-1.5 rounded-full shadow-lg border-2 ${
                    isSelected
                      ? 'bg-amber-400 text-slate-900 border-white ring-4 ring-amber-400/40'
                      : 'bg-blue-600 text-white border-blue-300'
                  }`}>
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold text-white bg-slate-900/80 px-1 py-0.2 rounded mt-0.5 shadow">
                    {ag.city}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Agency Card Info */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">{selectedAgency.name}</h3>
            <span className="text-[11px] font-semibold text-blue-700">
              Gare de départ : {selectedAgency.city}
            </span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
            Ouverte au public
          </span>
        </div>

        <div className="space-y-2 text-slate-600">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{selectedAgency.address}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
            <a href={`tel:${selectedAgency.phone.replace(/\s+/g, '')}`} className="font-mono font-semibold text-slate-800 hover:underline">
              {selectedAgency.phone}
            </a>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Guichet et expéditions : {selectedAgency.openingHours}</span>
          </div>
        </div>

        <button
          onClick={() => handleBookFromAgency(selectedAgency)}
          className="w-full py-2.5 bg-[#0F2C59] hover:bg-blue-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors mt-2 cursor-pointer"
        >
          <Bus className="w-4 h-4 text-amber-400" />
          <span>Réserver un voyage depuis {selectedAgency.city}</span>
          <ChevronRight className="w-4 h-4 text-amber-400" />
        </button>
      </div>

      {/* Agency list quick scroll */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
          Gares desservies ({agencies.length}) :
        </span>
        <div className="flex gap-2 overflow-x-auto py-1">
          {agencies.map(ag => (
            <button
              key={ag.id}
              onClick={() => setSelectedAgency(ag)}
              className={`p-2 rounded-xl text-left border shrink-0 transition-all text-xs cursor-pointer ${
                selectedAgency.id === ag.id
                  ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
              }`}
            >
              <div className="font-bold">{ag.city}</div>
              <div className="text-[10px] text-slate-400 truncate max-w-[110px]">{ag.name}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
