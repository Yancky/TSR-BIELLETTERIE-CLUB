/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DepartureTrip, TripSortOption } from '../types';
import { TripSearchResultItem } from '../services/tripSearchService';
import { formatXOF } from '../services/ticketSecurity';
import { 
  Bus, Clock, MapPin, Users, SlidersHorizontal, 
  ArrowRight, ShieldCheck, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';

interface TripResultsProps {
  items: TripSearchResultItem[];
  isLoading: boolean;
  error?: string | null;
  onSelectTrip: (trip: DepartureTrip) => void;
  onViewDetails: (trip: DepartureTrip) => void;
  onSortChange: (sort: TripSortOption) => void;
  currentSort: TripSortOption;
  onRetry: () => void;
}

export const TripResults: React.FC<TripResultsProps> = ({
  items,
  isLoading,
  error,
  onSelectTrip,
  onViewDetails,
  onSortChange,
  currentSort,
  onRetry
}) => {
  const [selectedAmenity, setSelectedAmenity] = useState<string>('ALL');
  const [selectedCompany, setSelectedCompany] = useState<string>('ALL');

  // Extraire les compagnies et commodités uniques pour les filtres
  const companies = Array.from(new Set(items.map(i => i.companyName)));
  const allAmenities = Array.from(new Set(items.flatMap(i => i.trip.amenities)));

  // Filtrage local interactif
  const filteredItems = items.filter(item => {
    if (selectedCompany !== 'ALL' && item.companyName !== selectedCompany) return false;
    if (selectedAmenity !== 'ALL' && !item.trip.amenities.includes(selectedAmenity)) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-9 h-9 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Recherche des départs en temps réel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
        <h4 className="font-bold text-red-900">Impossible de charger les trajets</h4>
        <p className="text-xs text-red-700 max-w-md mx-auto">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Réessayer
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-sm">
        <Bus className="w-10 h-10 text-slate-400 mx-auto" />
        <h4 className="font-bold text-slate-800">Aucun départ disponible</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Aucun autocar régulier ou VIP n'est programmé sur ce corridor pour la date sélectionnée. Veuillez essayer une autre date.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre d'outils de Tri & Filtres */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>Trier par :</span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => onSortChange('PRICE_ASC')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                currentSort === 'PRICE_ASC'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Prix croissant
            </button>
            <button
              onClick={() => onSortChange('PRICE_DESC')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                currentSort === 'PRICE_DESC'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Prix décroissant
            </button>
            <button
              onClick={() => onSortChange('TIME_ASC')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                currentSort === 'TIME_ASC'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Heure départ
            </button>
            <button
              onClick={() => onSortChange('DURATION_ASC')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                currentSort === 'DURATION_ASC'
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Durée
            </button>
          </div>
        </div>

        {/* Filtres par compagnie et commodité */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Compagnie</label>
            <select
              value={selectedCompany}
              onChange={e => setSelectedCompany(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Toutes les compagnies</option>
              {companies.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase">Option à bord</label>
            <select
              value={selectedAmenity}
              onChange={e => setSelectedAmenity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="ALL">Toutes les options</option>
              {allAmenities.map(a => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cartes des Départs */}
      <div className="space-y-3">
        {filteredItems.map(item => {
          const { trip, companyName, companyLogoUrl, availableSeatsCount, isBookable, formattedDuration } = item;
          const isFull = availableSeatsCount <= 0;

          return (
            <div
              key={trip.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-4 relative overflow-hidden"
            >
              {/* Entête Compagnie & Disponibilité */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center overflow-hidden shrink-0">
                    {companyLogoUrl ? (
                      <img src={companyLogoUrl} alt={companyName} className="w-full h-full object-cover" />
                    ) : (
                      <Bus className="w-4 h-4 text-blue-700" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900">{companyName}</span>
                      <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    </div>
                    <span className="text-[11px] text-slate-500">{trip.busType}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-blue-900">{formatXOF(trip.priceXOF)}</div>
                  <span className="text-[10px] text-slate-400 font-medium">par passager</span>
                </div>
              </div>

              {/* Itinéraire et Horaires */}
              <div className="py-3 grid grid-cols-3 items-center text-center">
                <div className="text-left">
                  <div className="text-lg font-black text-slate-900">{trip.departureTime}</div>
                  <div className="text-xs font-semibold text-slate-700">{trip.departureCity}</div>
                  <div className="text-[10px] text-slate-400 truncate">{trip.departureAgency}</div>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formattedDuration}
                  </span>
                  <div className="w-full flex items-center gap-1">
                    <div className="h-[2px] flex-1 bg-slate-200" />
                    <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <div className="h-[2px] flex-1 bg-slate-200" />
                  </div>
                  <span className="text-[9px] text-emerald-600 font-bold mt-1">Direct sécurisé</span>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-slate-900">{trip.arrivalTime}</div>
                  <div className="text-xs font-semibold text-slate-700">{trip.destinationCity}</div>
                  <div className="text-[10px] text-slate-400 truncate">{trip.arrivalAgency}</div>
                </div>
              </div>

              {/* Commodités & Disponibilité Réelle */}
              <div className="pt-2 pb-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {trip.amenities.map(amenity => (
                    <span
                      key={amenity}
                      className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium text-[10px]"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {isFull ? (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold text-[10px]">
                      Complet (0 place)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px]">
                      {availableSeatsCount} places réelles
                    </span>
                  )}
                </div>
              </div>

              {/* Boutons d'Action */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => onViewDetails(trip)}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
                >
                  Voir le trajet
                </button>
                <button
                  type="button"
                  disabled={!isBookable}
                  onClick={() => onSelectTrip(trip)}
                  className={`py-2.5 px-3 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-sm ${
                    isBookable
                      ? 'bg-blue-900 hover:bg-blue-800 text-white active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Choisir mes sièges</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
