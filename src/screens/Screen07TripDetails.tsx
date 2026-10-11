import React from 'react';
import { appStore } from '../services/store';
import { formatXOF } from '../services/ticketSecurity';
import { 
  Bus, Clock, MapPin, ShieldCheck, Wifi, 
  Tv, Snowflake, Luggage, CheckCircle2, ArrowRight, AlertCircle
} from 'lucide-react';

export const Screen07TripDetails: React.FC = () => {
  const state = appStore.getState();
  const trip = state.selectedTrip || state.trips[0];
  const company = state.companies.find(c => c.id === trip.companyId);

  const handleContinueToSeats = () => {
    appStore.navigateTo('08_SEAT_SELECTION');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 justify-between space-y-4">
      <div className="space-y-4">
        {/* Top Company & Header */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 p-2 flex items-center justify-center border border-blue-100">
              <img
                src="/src/assets/images/tsr_transit_badge_1791641501297.jpg"
                alt="Logo TSR"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900">{company?.name || 'TSR TRANSIT'}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{trip.busType}</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">{trip.availableSeatsCount} places</span>
              </div>
            </div>
          </div>

          {/* Detailed timeline */}
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                <div className="w-0.5 h-10 bg-slate-200" />
                <div className="w-3 h-3 rounded-full bg-amber-500 ring-4 ring-amber-100" />
              </div>

              <div className="flex-1 space-y-4 text-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 font-mono">
                      {trip.departureTime}
                    </span>
                    <span className="text-[11px] text-slate-500">{trip.date}</span>
                  </div>
                  <span className="font-bold text-slate-800 block">{trip.departureCity}</span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {trip.departureAgency}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 font-mono">
                      {trip.arrivalTime}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">Arrivée estimée</span>
                  </div>
                  <span className="font-bold text-slate-800 block">{trip.destinationCity}</span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {trip.arrivalAgency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bus Amenities & Comfort */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Équipements et Services à Bord
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <Snowflake className="w-4 h-4 text-blue-500 shrink-0" />
              <span>Climatisation intégrale</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <Wifi className="w-4 h-4 text-purple-500 shrink-0" />
              <span>Wi-Fi haut débit</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <Luggage className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Soute bagages (2x20kg)</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl">
              <Tv className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Écran TV vidéo HD</span>
            </div>
          </div>
        </div>

        {/* Important Travel Note */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Consignes d'embarquement :</span>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Présentez-vous à la gare de départ 30 minutes avant l'heure prévue muni de votre pièce d'identité et de votre billet QR TSR TRANSIT.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">Tarif par passager</span>
          <span className="text-base font-extrabold text-[#0F2C59] font-mono">
            {formatXOF(trip.priceXOF)}
          </span>
        </div>

        <button
          onClick={handleContinueToSeats}
          className="py-3 px-5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
        >
          <span>Choisir mes places</span>
          <ArrowRight className="w-4 h-4 text-slate-900" />
        </button>
      </div>
    </div>
  );
};
