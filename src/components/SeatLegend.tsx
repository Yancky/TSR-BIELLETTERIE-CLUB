/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { formatXOF } from '../services/ticketSecurity';

interface SeatLegendProps {
  selectedCount: number;
  unitPriceXOF: number;
  totalPriceXOF: number;
}

export const SeatLegend: React.FC<SeatLegendProps> = ({
  selectedCount,
  unitPriceXOF,
  totalPriceXOF
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Légende Visuelle Accessible */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg border-2 border-blue-600 bg-white shadow-xs" />
          <span className="font-semibold text-slate-700">Libre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-blue-900 border-2 border-blue-900 shadow-xs" />
          <span className="font-semibold text-slate-700">Sélectionné</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-amber-100 border-2 border-amber-400 shadow-xs" />
          <span className="font-semibold text-amber-900">Verrouillé (10 min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-slate-300 border-2 border-slate-400 shadow-xs" />
          <span className="font-semibold text-slate-500">Déjà réservé</span>
        </div>
      </div>

      {/* Résumé des sièges sélectionnés & Total XOF */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500">Sièges choisis :</span>
          <div className="text-sm font-black text-slate-800">
            {selectedCount} {selectedCount > 1 ? 'places' : 'place'}
          </div>
          <span className="text-[10px] text-slate-400">Tarif unitaire : {formatXOF(unitPriceXOF)}</span>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500">Total provisoire :</span>
          <div className="text-base font-extrabold text-blue-900">{formatXOF(totalPriceXOF)}</div>
        </div>
      </div>
    </div>
  );
};
