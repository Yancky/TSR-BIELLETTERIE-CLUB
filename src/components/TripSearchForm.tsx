/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TripSearchQuery } from '../types';
import { BURKINA_CITIES } from '../services/mockData';
import { MAX_PASSENGERS_PER_BOOKING } from '../services/tripSearchService';
import { MapPin, ArrowUpDown, Calendar, Users, Search, AlertCircle } from 'lucide-react';

interface TripSearchFormProps {
  initialQuery?: Partial<TripSearchQuery>;
  onSearch: (query: TripSearchQuery) => void;
  isLoading?: boolean;
}

export const TripSearchForm: React.FC<TripSearchFormProps> = ({
  initialQuery,
  onSearch,
  isLoading = false
}) => {
  const [originCity, setOriginCity] = useState(initialQuery?.originCity || 'Ouagadougou');
  const [destinationCity, setDestinationCity] = useState(initialQuery?.destinationCity || 'Bobo-Dioulasso');
  const [departureDate, setDepartureDate] = useState(
    initialQuery?.departureDate || new Date().toISOString().split('T')[0]
  );
  const [passengerCount, setPassengerCount] = useState(initialQuery?.passengerCount || 1);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSwapCities = () => {
    const temp = originCity;
    setOriginCity(destinationCity);
    setDestinationCity(temp);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (originCity.toLowerCase() === destinationCity.toLowerCase()) {
      setValidationError('La ville de départ et la ville de destination doivent être distinctes.');
      return;
    }

    setValidationError(null);
    onSearch({
      originCity,
      destinationCity,
      departureDate,
      passengerCount: Number(passengerCount),
      sortBy: 'PRICE_ASC'
    });
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-4">
      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Trajets Villes */}
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            Ville de départ
          </label>
          <select
            value={originCity}
            onChange={e => {
              setOriginCity(e.target.value);
              setValidationError(null);
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {BURKINA_CITIES.map(city => (
              <option key={`origin_${city}`} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton Inversion */}
        <button
          type="button"
          onClick={handleSwapCities}
          title="Inverser les villes"
          className="md:absolute md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-10 mx-auto w-9 h-9 bg-white border border-slate-300 rounded-full flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-500 shadow-sm transition active:scale-95"
        >
          <ArrowUpDown className="w-4 h-4" />
        </button>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Destination
          </label>
          <select
            value={destinationCity}
            onChange={e => {
              setDestinationCity(e.target.value);
              setValidationError(null);
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {BURKINA_CITIES.map(city => (
              <option key={`dest_${city}`} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date et Voyageurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            Date du départ
          </label>
          <input
            type="date"
            min={todayStr}
            value={departureDate}
            onChange={e => setDepartureDate(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            Nombre de voyageurs
          </label>
          <select
            value={passengerCount}
            onChange={e => setPassengerCount(Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {Array.from({ length: MAX_PASSENGERS_PER_BOOKING }, (_, i) => i + 1).map(num => (
              <option key={num} value={num}>
                {num} {num === 1 ? 'passager' : 'passagers'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-blue-900 hover:bg-blue-800 active:scale-[0.99] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-75"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Search className="w-4 h-4" />
        )}
        <span>Rechercher les départs autorisés</span>
      </button>
    </form>
  );
};
