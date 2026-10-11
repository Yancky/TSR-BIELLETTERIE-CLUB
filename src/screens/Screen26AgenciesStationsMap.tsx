/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DETAILED_AGENCIES, AgencyDirectoryService } from '../services/agencyDirectoryService';
import { DetailedAgency } from '../types';
import { 
  MapPin, Phone, Clock, Package, Ticket, 
  Car, Shield, Check, Search, Navigation, ExternalLink 
} from 'lucide-react';
import { GoogleMapsViewer } from '../components/GoogleMapsViewer';

export const Screen26AgenciesStationsMap: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<string>('Toutes');
  const [onlyParcel, setOnlyParcel] = useState<boolean>(false);
  const [activeAgency, setActiveAgency] = useState<DetailedAgency>(DETAILED_AGENCIES[0]);

  const agencies = AgencyDirectoryService.filterAgencies(selectedCity, onlyParcel);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 text-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white px-4 pt-6 pb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Réseau Physique</span>
            <h1 className="text-xl font-bold">Gares & Agences Agréées</h1>
          </div>
          <Navigation className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-xs text-blue-100 mt-1">
          Localisation, coordonnées GPS, numéros de guichet et services disponibles par gare.
        </p>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full bg-blue-900/80 border border-blue-400/40 text-white rounded-lg p-2 font-medium focus:outline-none"
          >
            <option value="Toutes">Toutes les villes</option>
            <option value="Ouagadougou">Ouagadougou</option>
            <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
            <option value="Koudougou">Koudougou</option>
            <option value="Banfora">Banfora</option>
          </select>

          <button
            onClick={() => setOnlyParcel(!onlyParcel)}
            className={`p-2 rounded-lg font-medium border flex items-center justify-center gap-1.5 transition-colors ${
              onlyParcel
                ? 'bg-amber-400 border-amber-500 text-slate-950 font-bold'
                : 'bg-blue-900/60 border-blue-400/30 text-blue-100'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Guichet Colis / Fret</span>
          </button>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {/* Real Interactive Google Map */}
        <div className="space-y-2">
          <GoogleMapsViewer
            locations={agencies.map(ag => ({
              id: ag.id,
              name: ag.agencyName,
              city: ag.city,
              address: ag.address,
              phone: ag.phone,
              hours: ag.openingHours,
              lat: ag.gpsCoordinates.lat,
              lng: ag.gpsCoordinates.lng,
              isMain: ag.agencyName.toLowerCase().includes('centrale') || ag.agencyName.toLowerCase().includes('farakan'),
            }))}
            selectedLocationId={activeAgency.id}
            onSelectLocation={(loc) => {
              const matched = agencies.find(a => a.id === loc.id);
              if (matched) setActiveAgency(matched);
            }}
            center={{
              lat: activeAgency.gpsCoordinates.lat,
              lng: activeAgency.gpsCoordinates.lng,
            }}
            zoom={selectedCity === 'Toutes' ? 7 : 13}
            height="260px"
          />

          <div className="bg-slate-900/95 text-white p-2.5 rounded-xl border border-slate-700 text-xs flex items-center justify-between shadow-sm">
            <div className="truncate mr-2">
              <span className="text-slate-400 block text-[10px]">Gare sélectionnée :</span>
              <span className="font-bold text-white truncate text-xs">{activeAgency.agencyName}</span>
            </div>
            <a
              href={`https://maps.google.com/?q=${activeAgency.gpsCoordinates.lat},${activeAgency.gpsCoordinates.lng}`}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 shrink-0"
            >
              <span>Itinéraire Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Selected Agency Detailed Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {activeAgency.companyName}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">{activeAgency.agencyName}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{activeAgency.address}</span>
              </p>
            </div>
          </div>

          {/* Quick Contacts */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <a
              href={`tel:${activeAgency.phone.replace(/\s+/g, '')}`}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 p-2.5 rounded-lg border border-emerald-200 flex items-center gap-2 font-medium"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-[10px] text-emerald-600 block">Guichet d'appel</span>
                <span>{activeAgency.phone}</span>
              </div>
            </a>

            <div className="bg-slate-50 text-slate-700 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-[10px] text-slate-400 block">Horaires d'ouverture</span>
                <span className="font-medium text-slate-800">{activeAgency.openingHours}</span>
              </div>
            </div>
          </div>

          {/* Services Offered Grid */}
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-800 block mb-2">Services en gare :</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                activeAgency.servicesOffered.ticketCounter ? 'bg-blue-50/60 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <Ticket className="w-3.5 h-3.5 text-blue-600" />
                <span>Billetterie physique</span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                activeAgency.servicesOffered.parcelDesk ? 'bg-amber-50/60 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>Guichet Colis / Fret</span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                activeAgency.servicesOffered.waitingLounge ? 'bg-purple-50/60 border-purple-200 text-purple-900' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>Salle d'attente VIP</span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                activeAgency.servicesOffered.parking ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <Car className="w-3.5 h-3.5 text-emerald-600" />
                <span>Parking gardé</span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                activeAgency.servicesOffered.luggageStorage ? 'bg-cyan-50/60 border-cyan-200 text-cyan-900' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <Check className="w-3.5 h-3.5 text-cyan-600" />
                <span>Consigne bagages</span>
              </div>
              <div className={`p-2 rounded-lg border flex items-center gap-2 ${
                activeAgency.servicesOffered.mobileMoneyCash ? 'bg-orange-50/60 border-orange-200 text-orange-900' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <Check className="w-3.5 h-3.5 text-orange-600" />
                <span>Kiosque Mobile Money</span>
              </div>
            </div>
          </div>
        </div>

        {/* Directory List of All Agencies */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
            Toutes les gares ({agencies.length})
          </h3>
          {agencies.map((ag) => (
            <div
              key={ag.id}
              onClick={() => setActiveAgency(ag)}
              className={`p-3 rounded-xl border bg-white cursor-pointer transition-all flex items-center justify-between text-xs ${
                activeAgency.id === ag.id ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <span className="font-bold text-slate-900 block">{ag.agencyName}</span>
                <span className="text-slate-500 text-[11px]">{ag.city} • {ag.neighborhood}</span>
              </div>
              <span className="text-blue-600 font-semibold text-xs">
                {activeAgency.id === ag.id ? 'Sélectionné' : 'Voir détails'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
