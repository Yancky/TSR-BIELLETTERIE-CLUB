/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BusSeatLayout, Seat, SeatStatus } from '../types';
import { Clock, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

interface SeatMapProps {
  layout: BusSeatLayout;
  seats: (Seat & { status: SeatStatus })[];
  selectedSeatNumbers: number[];
  onToggleSeat: (seatNumber: number) => void;
  holdExpiresAt?: string | null;
  secondsRemaining?: number;
  isLoading?: boolean;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  layout,
  seats,
  selectedSeatNumbers,
  onToggleSeat,
  holdExpiresAt,
  secondsRemaining,
  isLoading = false
}) => {
  const selectedSet = new Set(selectedSeatNumbers);

  // Regrouper par rangée
  const rowsMap = new Map<number, (Seat & { status: SeatStatus })[]>();
  for (const s of seats) {
    const list = rowsMap.get(s.row) || [];
    list.push(s);
    rowsMap.set(s.row, list);
  }

  // Formatage du temps restant
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Alerte Compte à Rebours du Verrou de 10 Minutes */}
      {secondsRemaining !== undefined && secondsRemaining > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-700 animate-pulse" />
            <div>
              <span className="text-xs font-bold text-amber-900 block">Sièges temporairement verrouillés</span>
              <span className="text-[10px] text-amber-700">Valables 10 minutes pour finaliser votre commande</span>
            </div>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 bg-amber-200/80 text-amber-950 font-black text-xs rounded-lg tracking-wider">
              {formatTimer(secondsRemaining)}
            </span>
          </div>
        </div>
      )}

      {/* Carrosserie Autocar */}
      <div className="bg-slate-100 rounded-3xl p-5 border-2 border-slate-300 shadow-inner max-w-sm mx-auto">
        {/* Cabine Conducteur & Porte d'Accès */}
        <div className="pb-4 mb-4 border-b-2 border-dashed border-slate-300 flex items-center justify-between text-[11px] font-bold text-slate-500">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="w-5 h-5 rounded-full border-2 border-slate-400 flex items-center justify-center text-[10px]">
              🚘
            </div>
            <span>Conducteur</span>
          </div>

          <div className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-300">
            Porte Accès
          </div>
        </div>

        {/* Grille des Sièges */}
        <div className="space-y-2.5">
          {Array.from(rowsMap.entries()).map(([rowNum, rowSeats]) => {
            return (
              <div key={`row_${rowNum}`} className="flex items-center justify-between gap-1">
                {/* Rendu des colonnes de gauche */}
                <div className="flex items-center gap-1.5">
                  {rowSeats
                    .filter(s => s.column < 2)
                    .map(seat => renderSeatButton(seat, selectedSet, onToggleSeat, isLoading))}
                </div>

                {/* Allée Centrale */}
                <div className="w-8 flex items-center justify-center text-[9px] font-bold text-slate-300 select-none">
                  {rowNum}
                </div>

                {/* Rendu des colonnes de droite */}
                <div className="flex items-center gap-1.5">
                  {rowSeats
                    .filter(s => s.column >= 2)
                    .map(seat => renderSeatButton(seat, selectedSet, onToggleSeat, isLoading))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Arrière de l'Autocar */}
        <div className="pt-4 mt-4 border-t-2 border-dashed border-slate-300 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Fond du Car • {layout.totalSeats} Places Homologuées
          </span>
        </div>
      </div>
    </div>
  );
};

function renderSeatButton(
  seat: Seat & { status: SeatStatus },
  selectedSet: Set<number>,
  onToggleSeat: (num: number) => void,
  isLoading: boolean
) {
  const isSelected = selectedSet.has(seat.seatNumber);
  const isOccupied = seat.status === 'OCCUPIED';
  const isLocked = seat.status === 'LOCKED';
  const isAvailable = !isOccupied && !isLocked;

  let btnClasses = 'w-10 h-10 rounded-xl font-bold text-xs flex flex-col items-center justify-center transition shadow-xs relative ';

  if (isSelected) {
    btnClasses += 'bg-blue-900 text-white border-2 border-blue-950 scale-105 shadow-md ring-2 ring-blue-400/50';
  } else if (isOccupied) {
    btnClasses += 'bg-slate-300 text-slate-500 border border-slate-400 cursor-not-allowed opacity-75';
  } else if (isLocked) {
    btnClasses += 'bg-amber-100 text-amber-900 border-2 border-amber-400 cursor-not-allowed';
  } else {
    btnClasses += 'bg-white hover:bg-blue-50 text-slate-800 border-2 border-blue-600 active:scale-95 cursor-pointer';
  }

  return (
    <button
      key={seat.id}
      type="button"
      disabled={!isAvailable && !isSelected || isLoading}
      onClick={() => onToggleSeat(seat.seatNumber)}
      aria-label={`Siège numéro ${seat.seatNumber}, rang ${seat.row}, statut : ${
        isSelected ? 'Sélectionné' : isOccupied ? 'Occupé' : isLocked ? 'Verrouillé' : 'Disponible'
      }`}
      className={btnClasses}
    >
      <span className="text-[11px] leading-tight font-extrabold">{seat.seatNumber}</span>
      {isSelected ? (
        <span className="text-[8px] font-black text-blue-200">OK</span>
      ) : isLocked ? (
        <span className="text-[7px] text-amber-700 font-bold uppercase">Hold</span>
      ) : isOccupied ? (
        <span className="text-[7px] text-slate-500 font-bold uppercase">Pris</span>
      ) : (
        <span className="text-[7px] text-blue-600 font-medium">Libre</span>
      )}
    </button>
  );
}
