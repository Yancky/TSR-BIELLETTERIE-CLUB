/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookingOrder, DepartureTrip } from '../types';
import { formatXOF } from '../services/ticketSecurity';
import { 
  Bus, Clock, MapPin, ShieldCheck, AlertCircle, 
  Calendar, CheckCircle2, FileText, ArrowRight
} from 'lucide-react';

interface BookingSummaryProps {
  booking: BookingOrder;
  trip: DepartureTrip;
  secondsRemaining?: number;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({
  booking,
  trip,
  secondsRemaining
}) => {
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isConfirmed = booking.status === 'CONFIRMED' || booking.status === 'TICKET_GENERATED';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
      {/* Entête avec Référence & Statut */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            Référence Réservation Provisoire
          </span>
          <span className="text-base font-black text-blue-900 font-mono">
            {booking.reference || booking.bookingRef}
          </span>
        </div>

        <div>
          {isConfirmed ? (
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Payé & Confirmé
            </span>
          ) : (
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-xs font-bold inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 animate-pulse text-amber-700" />
              Verrouillé • En attente
            </span>
          )}
        </div>
      </div>

      {/* Avertissement Officiel d'Autorité */}
      {!isConfirmed && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs flex items-start gap-2.5 text-blue-900">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold block">Réservation Provisoire (Non Payée)</span>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              Vos sièges sont réservés et bloqués sur le serveur de la compagnie. Cette fiche ne constitue pas un titre de transport officiel tant que le paiement Mobile Money n'a pas été validé.
            </p>
          </div>
        </div>
      )}

      {/* Détails du Voyage */}
      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Bus className="w-3.5 h-3.5 text-blue-600" />
            Trajet & Compagnie
          </span>
          <span className="font-semibold text-slate-900">{trip.busType}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Départ</span>
            <div className="font-bold text-sm text-slate-900">{trip.departureTime}</div>
            <div className="font-semibold">{trip.departureCity}</div>
            <div className="text-[10px] text-slate-500">{trip.departureAgency}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Arrivée estimée</span>
            <div className="font-bold text-sm text-slate-900">{trip.arrivalTime}</div>
            <div className="font-semibold">{trip.destinationCity}</div>
            <div className="text-[10px] text-slate-500">{trip.arrivalAgency}</div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-500 block">Date :</span>
            <span className="font-bold text-slate-800">{trip.date}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Siège(s) assigné(s) :</span>
            <span className="font-bold text-blue-900">{booking.seatIds.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Voyageur & Tarification Finale Calculée Côté Serveur */}
      <div className="space-y-2 pt-1 text-xs">
        <div className="flex justify-between text-slate-600">
          <span>Passager principal :</span>
          <span className="font-bold text-slate-800">{booking.passengerName}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Téléphone de contact :</span>
          <span className="font-bold text-slate-800">{booking.passengerPhone}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Tarif unitaire :</span>
          <span className="font-semibold text-slate-800">{formatXOF(booking.unitPriceXof || booking.unitPriceXOF || 0)}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Nombre de places :</span>
          <span className="font-semibold text-slate-800">{booking.passengerCount}</span>
        </div>

        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <span className="text-sm font-extrabold text-slate-900">Montant total dû (XOF) :</span>
          <span className="text-lg font-black text-blue-900">
            {formatXOF(booking.totalPriceXof || booking.totalAmountXOF || 0)}
          </span>
        </div>
      </div>

      {/* Minuteur si actif */}
      {secondsRemaining !== undefined && secondsRemaining > 0 && !isConfirmed && (
        <div className="pt-2 text-center text-xs text-amber-800 font-bold bg-amber-50 py-2 rounded-xl border border-amber-200">
          Temps restant pour payer : <span className="text-amber-950 font-black">{formatTimer(secondsRemaining)}</span>
        </div>
      )}
    </div>
  );
};
