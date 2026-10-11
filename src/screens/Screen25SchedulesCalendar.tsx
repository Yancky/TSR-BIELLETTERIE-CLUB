/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { appStore } from '../services/store';
import { ScheduleCalendarService, INITIAL_TIMETABLE } from '../services/scheduleCalendarService';
import { TimetableDeparture } from '../types';
import { 
  Calendar, Clock, Filter, Bus, Shield, 
  MapPin, CheckCircle2, ChevronRight, ArrowUpDown, Sparkles 
} from 'lucide-react';

const DAYS_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const Screen25SchedulesCalendar: React.FC = () => {
  const [selectedOrigin, setSelectedOrigin] = useState<string>('Toutes');
  const [selectedDest, setSelectedDest] = useState<string>('Toutes');
  const [selectedCompany, setSelectedCompany] = useState<string>('Toutes');
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0 = tous les jours

  const schedules = ScheduleCalendarService.filterSchedules({
    origin: selectedOrigin,
    destination: selectedDest,
    company: selectedCompany,
    dayOfWeek: selectedDay > 0 ? selectedDay : undefined
  });

  const handleSelectSchedule = (item: TimetableDeparture) => {
    appStore.setSearchParams({
      departureCity: item.departureCity,
      destinationCity: item.destinationCity
    });
    appStore.navigateTo('06_SEARCH_RESULTS');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 text-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white px-4 pt-6 pb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Grille Officielle</span>
            <h1 className="text-xl font-bold">Horaires & Calendrier des Départs</h1>
          </div>
          <Calendar className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-xs text-blue-100 mt-1">
          Consultez l'ensemble des fréquences régulières interurbaines des compagnies agréées.
        </p>

        {/* Days of Week Selector */}
        <div className="flex gap-1.5 overflow-x-auto mt-4 pt-1 no-scrollbar">
          <button
            onClick={() => setSelectedDay(0)}
            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
              selectedDay === 0 ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-blue-900/60 text-blue-100'
            }`}
          >
            Tous les jours
          </button>
          {DAYS_NAMES.map((name, idx) => {
            const dayNum = idx + 1;
            const isSel = selectedDay === dayNum;
            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  isSel ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-blue-900/60 text-blue-100'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {/* Filters Box */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtres de consultation</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <label className="text-slate-500 block text-[11px] mb-1">Ville de départ</label>
              <select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              >
                <option value="Toutes">Toutes les gares</option>
                <option value="Ouagadougou">Ouagadougou</option>
                <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 block text-[11px] mb-1">Destination</label>
              <select
                value={selectedDest}
                onChange={(e) => setSelectedDest(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              >
                <option value="Toutes">Toutes</option>
                <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
                <option value="Ouagadougou">Ouagadougou</option>
                <option value="Banfora">Banfora</option>
                <option value="Koudougou">Koudougou</option>
                <option value="Ouahigouya">Ouahigouya</option>
                <option value="Fada N’Gourma">Fada N’Gourma</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-slate-500 block text-[11px] mb-1">Compagnie</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              >
                <option value="Toutes">Toutes</option>
                <option value="TSR">TSR TRANSIT</option>
                <option value="RAKIETA">RAKIETA</option>
                <option value="STAF">STAF</option>
                <option value="TCV">TCV</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>{schedules.length} liaison{schedules.length > 1 ? 's' : ''} planifiée{schedules.length > 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mises à jour en direct
          </span>
        </div>

        {/* Timetable List */}
        <div className="space-y-3">
          {schedules.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
              Aucun départ ne correspond aux critères sélectionnés.
            </div>
          ) : (
            schedules.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-blue-400 transition-all space-y-3"
              >
                {/* Header: Company & Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                    {item.companyName}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    À l'heure
                  </span>
                </div>

                {/* Cities & Time */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-black text-slate-900">{item.departureTime}</div>
                    <div className="text-xs text-slate-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {item.departureCity}
                    </div>
                  </div>

                  <div className="flex flex-col items-center px-4">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Direct</span>
                    <div className="w-16 h-0.5 bg-blue-200 relative my-1">
                      <div className="w-2 h-2 rounded-full bg-blue-600 absolute -top-0.5 right-0"></div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Quotidien</span>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900">{item.arrivalTime}</div>
                    <div className="text-xs text-slate-600">{item.destinationCity}</div>
                  </div>
                </div>

                {/* Bus Details & Pricing Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-600 block text-[11px]">{item.busType}</span>
                    <span className="text-slate-400 text-[10px]">{item.agencyName}</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <span className="text-base font-black text-blue-700">
                        {item.priceXOF.toLocaleString('fr-FR')} F
                      </span>
                      <span className="text-[10px] text-slate-400 block">CFA</span>
                    </div>
                    <button
                      onClick={() => handleSelectSchedule(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1 transition-transform active:scale-95"
                    >
                      <span>Réserver</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
