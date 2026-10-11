import React, { useState } from 'react';
import { appStore } from '../services/store';
import { Company } from '../types';
import { formatXOF } from '../services/ticketSecurity';
import { 
  ShieldCheck, Building2, Users, AlertCircle, 
  CheckCircle2, XCircle, TrendingUp, Bus, FileText, Check 
} from 'lucide-react';

export const Screen17AdminDashboard: React.FC = () => {
  const state = appStore.getState();
  const [companies, setCompanies] = useState(state.companies);
  const [selectedComp, setSelectedComp] = useState<Company | null>(null);
  const [actionNotice, setActionNotice] = useState('');

  const pendingCompanies = companies.filter(c => c.status === 'PENDING');
  const activeCompanies = companies.filter(c => c.status === 'ACTIVE');

  const handleApprove = (companyId: string) => {
    appStore.updateCompanyStatus(companyId, 'ACTIVE');
    setCompanies([...appStore.getState().companies]);
    setActionNotice('Compagnie approuvée avec succès ! Elle peut maintenant publier des départs.');
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleReject = (companyId: string) => {
    const reason = prompt('Motif du rejet (ex: documents IFU ou agrément transport incomplets) :') || 'Dossier incomplet';
    appStore.updateCompanyStatus(companyId, 'REJECTED', reason);
    setCompanies([...appStore.getState().companies]);
    setActionNotice('Demande de compagnie rejetée avec motif.');
    setTimeout(() => setActionNotice(''), 3000);
  };

  const handleSuspend = (companyId: string) => {
    appStore.updateCompanyStatus(companyId, 'SUSPENDED', 'Contrôle réglementaire');
    setCompanies([...appStore.getState().companies]);
    setActionNotice('Compagnie suspendue temporairement.');
    setTimeout(() => setActionNotice(''), 3000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 space-y-4">
      {/* Top Banner */}
      <div className="bg-[#0F2C59] text-white p-4 rounded-3xl shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm">Supervision Administrateur</h2>
              <span className="text-[10px] text-blue-200">Plateforme Centrale TSR TRANSIT BF</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-900 text-blue-200 border border-blue-700">
            Super-Admin
          </span>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Global Metrics */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Voyageurs Inscrits</span>
          <div className="text-base font-extrabold text-slate-900 font-mono">14 820</div>
          <span className="text-[10px] text-emerald-600 font-semibold">+18% ce mois</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Compagnies Actives</span>
          <div className="text-base font-extrabold text-blue-900 font-mono">
            {activeCompanies.length} sociétés
          </div>
          <span className="text-[10px] text-slate-500">{pendingCompanies.length} en attente</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Volume Transactions</span>
          <div className="text-base font-extrabold text-slate-900 font-mono">
            {formatXOF(135400000)}
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold">100% Mobile Money</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Billets Validés Quai</span>
          <div className="text-base font-extrabold text-purple-900 font-mono">9 421</div>
          <span className="text-[10px] text-purple-700 font-semibold">0 fraude signalée</span>
        </div>
      </div>

      {/* Pending Companies Approvals */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Demandes d'Agrément Compagnies ({pendingCompanies.length})</span>
          </h3>
        </div>

        {pendingCompanies.length === 0 ? (
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
            Toutes les demandes de compagnies ont été traitées.
          </div>
        ) : (
          pendingCompanies.map(comp => (
            <div
              key={comp.id}
              className="bg-white p-3.5 rounded-2xl border-2 border-amber-300 shadow-sm space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-slate-900 text-sm block">{comp.name}</span>
                  <span className="text-[10px] text-slate-500">
                    Responsable : {comp.managerName} ({comp.phone})
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  EN ATTENTE
                </span>
              </div>

              <div className="bg-slate-50 p-2 rounded-xl text-[11px] text-slate-600 space-y-0.5">
                <div>Siège : {comp.headquarters}</div>
                <div>Code Marchand : {comp.merchantCode || 'OM-BF-EN-COURS'}</div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => handleApprove(comp.id)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Valider &amp; Activer</span>
                </button>

                <button
                  onClick={() => handleReject(comp.id)}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs border border-red-200 transition-colors"
                >
                  Rejeter
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Active Companies Directory */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Compagnies Actives Partenaires ({activeCompanies.length})
        </h3>

        <div className="space-y-2">
          {activeCompanies.map(comp => (
            <div
              key={comp.id}
              className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-bold text-slate-800 block">{comp.name}</span>
                <span className="text-[10px] text-slate-500">
                  {comp.fleetCount} cars • Note : ⭐ {comp.rating}
                </span>
              </div>

              <button
                onClick={() => handleSuspend(comp.id)}
                className="text-[10px] text-slate-500 hover:text-red-600 border border-slate-200 px-2 py-1 rounded-lg"
              >
                Suspendre
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
