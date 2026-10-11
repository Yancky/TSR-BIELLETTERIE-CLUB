/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LostFoundService, INITIAL_LOST_ITEMS } from '../services/lostFoundService';
import { LostItemReport, LostItemStatus } from '../types';
import { 
  Briefcase, Search, AlertCircle, CheckCircle2, 
  MapPin, Clock, Phone, Tag, ShieldAlert, PlusCircle 
} from 'lucide-react';

export const Screen29LuggageLostFound: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'DECLARE'>('LIST');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedReport, setSelectedReport] = useState<LostItemReport | null>(INITIAL_LOST_ITEMS[0]);

  // Form State
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+226 ');
  const [ticketNum, setTicketNum] = useState<string>('');
  const [tripInfo, setTripInfo] = useState<string>('Ouagadougou ➔ Bobo-Dioulasso (Car 06h30)');
  const [category, setCategory] = useState<LostItemReport['itemCategory']>('SAC_VALISE');
  const [color, setColor] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const reports = LostFoundService.getAllReports().filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.reference.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.travelerName.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !description) return;

    const rep = LostFoundService.reportLostItem({
      travelerName: name,
      travelerPhone: phone,
      ticketNumber: ticketNum,
      tripInfo,
      itemCategory: category,
      description,
      color
    });

    setSelectedReport(rep);
    setSuccessMessage(`Votre déclaration N° ${rep.reference} a bien été enregistrée et diffusée aux agents de gare.`);
    setActiveTab('LIST');
    setName('');
    setDescription('');
    setColor('');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 text-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-700 via-rose-800 to-slate-900 text-white px-4 pt-6 pb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-rose-200 text-xs font-semibold uppercase tracking-wider">Service Bagages</span>
            <h1 className="text-xl font-bold">Objets Perdus & Bagages</h1>
          </div>
          <Briefcase className="w-6 h-6 text-amber-300" />
        </div>
        <p className="text-xs text-rose-100 mt-1">
          Déclarez un bagage oublié ou vérifiez les objets retrouvés dans les autocars et gares.
        </p>

        {/* Tab Toggle */}
        <div className="flex gap-2 mt-4 bg-black/20 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'LIST' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            Objets Déclarés
          </button>
          <button
            onClick={() => setActiveTab('DECLARE')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'DECLARE' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            + Déclarer une perte
          </button>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: LIST / SEARCH */}
        {activeTab === 'LIST' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par référence (ex: TSR-OBJ-4402) ou mot clé..."
                className="w-full bg-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 shadow-sm"
              />
            </div>

            {/* Selected Item Detailed Card */}
            {selectedReport && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Dossier de recherche</span>
                    <h2 className="text-base font-black font-mono text-slate-900">{selectedReport.reference}</h2>
                    <span className="text-xs text-slate-600">{selectedReport.tripInfo}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    selectedReport.status === 'FOUND_IN_AGENCY'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : selectedReport.status === 'RESTORED'
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {selectedReport.status === 'REPORTED' && 'Enregistré'}
                    {selectedReport.status === 'SEARCHING' && 'Enquête en cours'}
                    {selectedReport.status === 'FOUND_IN_AGENCY' && 'Retrouvé en gare !'}
                    {selectedReport.status === 'RESTORED' && 'Restitué au voyageur'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs space-y-1.5">
                  <div className="font-bold text-slate-800">{selectedReport.description}</div>
                  <div className="text-slate-500">
                    Couleur : <span className="font-medium text-slate-700">{selectedReport.color}</span> • 
                    Déclaré le : <span className="font-medium text-slate-700">{selectedReport.reportedDate}</span>
                  </div>
                  {selectedReport.ticketNumber && (
                    <div className="text-blue-600 font-mono text-[11px]">
                      Billet lié : {selectedReport.ticketNumber}
                    </div>
                  )}
                </div>

                {selectedReport.foundLocation && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-emerald-900 block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      Lieu où retirer l'objet :
                    </span>
                    <span className="text-emerald-800 block">{selectedReport.foundLocation}</span>
                    {selectedReport.agentNotes && (
                      <span className="text-emerald-700 text-[11px] italic block mt-1">
                        Note agent : {selectedReport.agentNotes}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* List of All Reports */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
                Dossiers récents ({reports.length})
              </h3>
              {reports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`p-3 rounded-xl border bg-white cursor-pointer transition-all flex items-center justify-between text-xs ${
                    selectedReport?.id === r.id ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="font-bold font-mono text-slate-900">{r.reference}</span>
                    <p className="text-slate-600 text-[11px] truncate max-w-[220px]">{r.description}</p>
                    <span className="text-slate-400 text-[10px]">{r.reportedDate}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    r.status === 'FOUND_IN_AGENCY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {r.status === 'FOUND_IN_AGENCY' ? 'Trouvé' : 'Recherche'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DECLARE LOSS FORM */}
        {activeTab === 'DECLARE' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <h2>Formulaire de déclaration d'objet perdu</h2>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Votre Nom & Prénom *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Moussa Kaboré"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Téléphone de contact *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Numéro de billet (optionnel)</label>
                <input
                  type="text"
                  value={ticketNum}
                  onChange={(e) => setTicketNum(e.target.value)}
                  placeholder="Ex: TSR-BF-2026-8819"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Type d'objet *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as LostItemReport['itemCategory'])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                >
                  <option value="SAC_VALISE">Sac ou Valise</option>
                  <option value="APPAREIL_ELECTRONIQUE">Téléphone / Ordinateur</option>
                  <option value="DOCUMENTS">CNIB / Passeport / Dossier</option>
                  <option value="VETEMENTS">Vêtement / Veste</option>
                  <option value="AUTRE">Autre objet</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Trajet concerné</label>
              <input
                type="text"
                value={tripInfo}
                onChange={(e) => setTripInfo(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Couleur et signes distinctifs</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ex: Sac à dos bleu marine avec étiquette blanche"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Description détaillée de l'objet *</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Précisez le contenu, la marque, ou l'emplacement supposé dans le car (filet, soute, sous le siège...)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-md text-xs transition-transform active:scale-95"
            >
              Envoyer la déclaration de perte
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
