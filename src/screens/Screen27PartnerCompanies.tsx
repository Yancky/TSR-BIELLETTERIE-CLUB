/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PARTNER_COMPANIES, PartnerCompanyService } from '../services/partnerCompanyService';
import { PartnerCompanyProfile } from '../types';
import { appStore } from '../services/store';
import { 
  Building2, Star, ShieldCheck, Bus, 
  Phone, Mail, ArrowRight, Award, CheckCircle2 
} from 'lucide-react';

export const Screen27PartnerCompanies: React.FC = () => {
  const [selectedComp, setSelectedComp] = useState<PartnerCompanyProfile>(PARTNER_COMPANIES[0]);

  const handleBookRoute = (from: string, to: string) => {
    appStore.setSearchParams({
      departureCity: from,
      destinationCity: to
    });
    appStore.navigateTo('06_SEARCH_RESULTS');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 text-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white px-4 pt-6 pb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Transporteurs Agréés</span>
            <h1 className="text-xl font-bold">Compagnies Partenaires</h1>
          </div>
          <Building2 className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-xs text-blue-100 mt-1">
          Découvrez les transporteurs certifiés opérant sur le réseau national burkinabè.
        </p>

        {/* Company Selector Tabs */}
        <div className="flex gap-2 overflow-x-auto mt-4 pt-1 no-scrollbar">
          {PARTNER_COMPANIES.map((c) => {
            const isSel = selectedComp.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedComp(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSel ? 'bg-amber-400 text-slate-950 font-bold shadow-md scale-105' : 'bg-blue-900/70 text-blue-100'
                }`}
              >
                <span>{c.tradeName}</span>
                <span className="text-[10px] bg-slate-900/40 px-1.5 py-0.2 rounded">
                  ★ {c.rating}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {/* Main Company Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">{selectedComp.name}</h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Agrément d'État
                </span>
              </div>
              <p className="text-xs text-blue-700 font-semibold italic mt-0.5">« {selectedComp.slogan} »</p>
              <p className="text-xs text-slate-500 mt-1">
                Siège : {selectedComp.headquarters} • Fondée en {selectedComp.foundedYear}
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
            {selectedComp.description}
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-4 gap-2 text-center py-2 border-y border-slate-100">
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Flotte</span>
              <span className="text-sm font-bold text-slate-900">{selectedComp.fleetSize} autocars</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Villes</span>
              <span className="text-sm font-bold text-blue-700">{selectedComp.destinationsCount} gares</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Avis</span>
              <span className="text-sm font-bold text-amber-600">★ {selectedComp.rating}</span>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-[10px] text-slate-500 block">Retours</span>
              <span className="text-sm font-bold text-slate-700">{selectedComp.reviewCount}</span>
            </div>
          </div>

          {/* Amenities & Onboard Services */}
          <div>
            <span className="text-xs font-bold text-slate-800 block mb-2">Équipements & Services à bord :</span>
            <div className="grid grid-cols-2 gap-2">
              {selectedComp.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-blue-50/50 p-2 rounded-lg border border-blue-100/60">
                  <Bus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Certifications */}
          <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
            <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs mb-1.5">
              <Award className="w-4 h-4 text-emerald-700" />
              <span>Garanties & Certifications de sécurité</span>
            </div>
            <ul className="space-y-1 text-xs text-emerald-800">
              {selectedComp.safetyCertifications.map((cert, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{cert}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Featured Routes */}
          <div>
            <span className="text-xs font-bold text-slate-800 block mb-2">Liaisons directes populaires :</span>
            <div className="space-y-2">
              {selectedComp.featuredRoutes.map((route, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-400 text-xs transition-colors">
                  <div className="font-semibold text-slate-800">
                    {route.from} ➔ {route.to}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-blue-700">{route.priceXOF.toLocaleString('fr-FR')} F CFA</span>
                    <button
                      onClick={() => handleBookRoute(route.from, route.to)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1"
                    >
                      <span>Voir départs</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Details Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {selectedComp.contactPhone}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {selectedComp.contactEmail}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
