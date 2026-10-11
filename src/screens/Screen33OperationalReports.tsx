/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { OperationalReportService } from '../services/operationalReportService';
import { OperationalKPIData } from '../types';
import { 
  BarChart3, TrendingUp, Users, DollarSign, 
  Clock, Package, Download, Calendar, ArrowUpRight, CheckCircle2 
} from 'lucide-react';

export const Screen33OperationalReports: React.FC = () => {
  const [period, setPeriod] = useState<string>('OCTOBRE_2026');
  const [reportData, setReportData] = useState<OperationalKPIData>(
    OperationalReportService.getMonthlyKPIs()
  );
  const [exportNotice, setExportNotice] = useState<string>('');

  const handleExportCSV = () => {
    setExportNotice('Export du rapport consolidé d’exploitation généré (TSR_Rapport_Octobre2026.csv).');
    setTimeout(() => setExportNotice(''), 4000);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 text-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-4 pt-6 pb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-blue-300 text-xs font-semibold uppercase tracking-wider">Direction d'Exploitation</span>
            <h1 className="text-xl font-bold">Rapports & Statistiques Métier</h1>
          </div>
          <BarChart3 className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-xs text-slate-300 mt-1">
          Indicateurs de performance, taux de remplissage par axe et ventilation financière.
        </p>

        {/* Period Selector & Export Button */}
        <div className="flex items-center justify-between mt-4">
          <span className="bg-slate-800/80 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>{reportData.period}</span>
          </span>

          <button
            onClick={handleExportCSV}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter Rapport</span>
          </button>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {exportNotice && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Global Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">Chiffre d'Affaires</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base font-black text-slate-900">
              {(reportData.totalRevenueXOF / 1000000).toFixed(1)} M FCFA
            </div>
            <span className="text-[10px] text-emerald-600 font-bold flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +12.4% vs M-1
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">Taux Remplissage</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-base font-black text-blue-700">
              {reportData.averageFillRatePct}%
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">Moyenne flotte</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">Ponctualité Départs</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-base font-black text-purple-700">
              {reportData.onTimeDepartureRatePct}%
            </div>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Excellente régularité</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px]">Fret & Colis</span>
              <Package className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-base font-black text-amber-700">
              {(reportData.parcelRevenueXOF / 1000000).toFixed(1)} M FCFA
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {reportData.parcelsHandled} colis traités
            </span>
          </div>
        </div>

        {/* Detailed Route Performance Ranking */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">
              Performance des Lignes & Axes Interurbains
            </span>
            <span className="text-[11px] text-slate-500">Par volume passagers</span>
          </div>

          <div className="space-y-3">
            {reportData.topRoutes.map((route, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span>{route.route}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">
                    {route.revenueXOF.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                {/* Fill Rate Progress Bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>{route.passengerCount} passagers transportés</span>
                    <span className="font-bold text-blue-700">{route.fillRatePct}% remplissage</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${route.fillRatePct}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Money Collection Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
          <span className="font-bold text-sm text-slate-900 block">
            Répartition des Encaissements Mobile Money
          </span>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg overflow-hidden mb-1 shadow-xs bg-orange-500">
                <img
                  src="/src/assets/images/orange_money.png"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/src/assets/images/orange_money_logo_1791712697677.jpg';
                  }}
                  alt="Orange Money"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] text-orange-800 font-bold uppercase block">Orange Money</span>
              <span className="text-base font-black text-orange-950">58 %</span>
              <span className="text-[10px] text-orange-700 block mt-0.5">Leader national</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg overflow-hidden mb-1 shadow-xs bg-blue-700">
                <img
                  src="/src/assets/images/moov_money.png"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/src/assets/images/moov_money_logo_1791712713926.jpg';
                  }}
                  alt="Moov Money"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] text-blue-800 font-bold uppercase block">Moov Money</span>
              <span className="text-base font-black text-blue-950">28 %</span>
              <span className="text-[10px] text-blue-700 block mt-0.5">Réseau Ouest & Nord</span>
            </div>

            <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-xl flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-[#1DC3EF] text-white flex items-center justify-center font-black text-[10px] mb-1 shadow-xs">
                W
              </div>
              <span className="text-[10px] text-cyan-800 font-bold uppercase block">Wave Burkina</span>
              <span className="text-base font-black text-cyan-950">14 %</span>
              <span className="text-[10px] text-cyan-700 block mt-0.5">Croissance rapide</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
