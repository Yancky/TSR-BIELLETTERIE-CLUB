/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SupportClaimService, FAQ_LIST } from '../services/supportClaimService';
import { ClaimCategory, SupportClaim } from '../types';
import { 
  HelpCircle, MessageSquare, AlertTriangle, CheckCircle2, 
  ChevronDown, ChevronUp, Send, PhoneCall, ShieldCheck, FileText,
  Bot, Sparkles
} from 'lucide-react';
import { FirebaseSyncService } from '../services/firebaseSyncService';

export const Screen30SupportClaimsFAQ: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'FAQ' | 'NEW_CLAIM' | 'MY_CLAIMS'>('FAQ');
  const [openFaqId, setOpenFaqId] = useState<string>('faq_01');

  // Form State
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('+226 ');
  const [email, setEmail] = useState<string>('');
  const [ticketNum, setTicketNum] = useState<string>('');
  const [category, setCategory] = useState<ClaimCategory>('RETARD_DEPART');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submittedClaim, setSubmittedClaim] = useState<SupportClaim | null>(null);

  const claims = SupportClaimService.getAllClaims();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !subject || !message) return;

    const claim = SupportClaimService.submitClaim({
      travelerName: name,
      travelerPhone: phone,
      travelerEmail: email,
      ticketNumber: ticketNum,
      category,
      subject,
      message
    });

    setSubmittedClaim(claim);
    // Sync claim to Firestore
    FirebaseSyncService.persistClaim(claim).catch(err => console.warn('Claim sync to firestore failed:', err));

    setActiveTab('MY_CLAIMS');
    setSubject('');
    setMessage('');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 text-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 text-white px-4 pt-6 pb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Assistance 24/7</span>
            <h1 className="text-xl font-bold">Centre d'Aide & Réclamations</h1>
          </div>
          <HelpCircle className="w-6 h-6 text-amber-300" />
        </div>
        <p className="text-xs text-blue-100 mt-1">
          Trouvez des réponses immédiates ou déposez un dossier suivi par notre service relation client.
        </p>

        {/* Tab Selector */}
        <div className="flex gap-1.5 mt-4 bg-black/20 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('FAQ')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'FAQ' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            Foire Aux Questions
          </button>
          <button
            onClick={() => setActiveTab('NEW_CLAIM')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'NEW_CLAIM' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            + Réclamation
          </button>
          <button
            onClick={() => setActiveTab('MY_CLAIMS')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'MY_CLAIMS' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            Dossiers ({claims.length})
          </button>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {/* Urgent Call Line */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3.5 rounded-xl shadow-sm flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-full">
              <PhoneCall className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold block">Assistance Téléphonique Urgente</span>
              <span className="text-emerald-100 text-[11px]">Disponible 7j/7 de 05h à 22h</span>
            </div>
          </div>
          <a
            href="tel:+22625341100"
            className="bg-white text-emerald-800 font-bold px-3 py-1.5 rounded-lg shadow-sm"
          >
            25 34 11 00
          </a>
        </div>

        {/* TAB 1: FAQ */}
        {activeTab === 'FAQ' && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Questions les plus fréquentes
            </h2>
            {FAQ_LIST.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-all"
                >
                  <button
                    onClick={() => setOpenFaqId(isOpen ? '' : faq.id)}
                    className="w-full p-3.5 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-3.5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: NEW CLAIM FORM */}
        {activeTab === 'NEW_CLAIM' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <h2>Formulaire de dépôt de réclamation officielle</h2>
            </div>
            <p className="text-xs text-slate-500">
              Un numéro de dossier unique vous sera attribué pour suivre le traitement et les dédommagements éventuels.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Aminata Ouédraogo"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Téléphone *</label>
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
                <label className="text-slate-700 font-semibold block mb-1">E-mail (optionnel)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aminata@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Numéro de billet lié</label>
                <input
                  type="text"
                  value={ticketNum}
                  onChange={(e) => setTicketNum(e.target.value)}
                  placeholder="Ex: TSR-BF-2026-8819"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Catégorie du litige *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ClaimCategory)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
              >
                <option value="RETARD_DEPART">Retard important au départ ou à l'arrivée</option>
                <option value="BAGAGE_ENDOMMAGE">Bagage endommagé ou manquant</option>
                <option value="PROBLEME_RESERVATION">Problème d'attribution de siège ou billet</option>
                <option value="COMPORTEMENT_EQUIPAGE">Qualité de service / Comportement personnel</option>
                <option value="REMBOURSEMENT">Demande de remboursement</option>
                <option value="AUTRE">Autre réclamation</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Objet succinct *</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Retard de 45 minutes sans information préalable"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Explication détaillée des faits *</label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez avec précision la date, l'heure, la gare et les circonstances..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md text-xs transition-transform active:scale-95"
            >
              Soumettre la réclamation
            </button>
          </form>
        )}

        {/* TAB 3: MY CLAIMS */}
        {activeTab === 'MY_CLAIMS' && (
          <div className="space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400">DOSSIER</span>
                    <h3 className="text-sm font-black font-mono text-slate-900">{claim.claimNumber}</h3>
                    <span className="text-blue-700 font-semibold">{claim.subject}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                    claim.status === 'RESOLVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : claim.status === 'IN_REVIEW'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {claim.status === 'SUBMITTED' && 'Reçu'}
                    {claim.status === 'IN_REVIEW' && 'En examen'}
                    {claim.status === 'RESOLVED' && 'Résolu'}
                    {claim.status === 'REJECTED' && 'Rejeté'}
                  </span>
                </div>

                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {claim.message}
                </p>

                {claim.resolutionNote && (
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-emerald-900">
                    <span className="font-bold block flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      Réponse du service client :
                    </span>
                    <p className="mt-0.5 text-[11px]">{claim.resolutionNote}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Déposé le {claim.submittedAt}</span>
                  <span>Catégorie : {claim.category}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
