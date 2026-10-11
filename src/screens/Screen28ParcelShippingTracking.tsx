/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ParcelService } from '../services/parcelService';
import { ParcelCategory, ParcelShipment } from '../types';
import { 
  Package, Search, Calculator, ShieldCheck, 
  MapPin, Clock, ArrowRight, CheckCircle2, AlertCircle, Copy, Check 
} from 'lucide-react';

export const Screen28ParcelShippingTracking: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TRACKING' | 'CALCULATOR' | 'NEW_SHIPMENT'>('TRACKING');
  const [trackingInput, setTrackingInput] = useState<string>('TSR-COL-2026-8812');
  const [searchedParcel, setSearchedParcel] = useState<ParcelShipment | null>(
    ParcelService.getParcelByTracking('TSR-COL-2026-8812')
  );
  const [copiedOtp, setCopiedOtp] = useState<boolean>(false);

  // Calculator State
  const [calcCategory, setCalcCategory] = useState<ParcelCategory>('CARTON_MOYEN');
  const [calcWeight, setCalcWeight] = useState<number>(5);
  const [calcDeclaredValue, setCalcDeclaredValue] = useState<number>(20000);

  // New Shipment Form State
  const [senderName, setSenderName] = useState<string>('');
  const [senderPhone, setSenderPhone] = useState<string>('+226 ');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('+226 ');
  const [createdParcel, setCreatedParcel] = useState<ParcelShipment | null>(null);

  const calculatedFee = ParcelService.calculateShippingFee({
    category: calcCategory,
    weightKg: calcWeight,
    declaredValueXOF: calcDeclaredValue
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingInput.trim()) return;
    const res = ParcelService.getParcelByTracking(trackingInput);
    setSearchedParcel(res);
  };

  const handleCreateShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !senderPhone || !recipientName || !recipientPhone) return;

    const parcel = ParcelService.registerParcel({
      companyId: 'comp_tsr_01',
      companyName: 'TSR TRANSIT BURKINA',
      originAgencyId: 'ag_tsr_ouaga_gounghin',
      originAgencyName: 'Gare Centrale TSR Gounghin (Ouaga)',
      destinationAgencyId: 'ag_tsr_bobo_accart',
      destinationAgencyName: 'Gare Principale TSR Accart-Ville (Bobo)',
      senderName,
      senderPhone,
      recipientName,
      recipientPhone,
      category: calcCategory,
      weightKg: calcWeight,
      declaredValueXOF: calcDeclaredValue
    });

    setCreatedParcel(parcel);
    setSearchedParcel(parcel);
    setTrackingInput(parcel.trackingNumber);
    setActiveTab('TRACKING');
  };

  const handleCopyOtp = (otp: string) => {
    navigator.clipboard?.writeText(otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 text-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-700 to-slate-900 text-white px-4 pt-6 pb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-amber-200 text-xs font-semibold uppercase tracking-wider">Fret & Colis Express</span>
            <h1 className="text-xl font-bold">Expédition & Suivi de Colis</h1>
          </div>
          <Package className="w-6 h-6 text-amber-300" />
        </div>
        <p className="text-xs text-amber-100 mt-1">
          Acheminent interurbain sécurisé avec code OTP de remise et traçabilité en temps réel.
        </p>

        {/* Tab Switcher */}
        <div className="flex gap-1.5 mt-4 bg-black/20 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('TRACKING')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'TRACKING' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            Suivi Colis
          </button>
          <button
            onClick={() => setActiveTab('CALCULATOR')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'CALCULATOR' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            Calculateur Tarif
          </button>
          <button
            onClick={() => setActiveTab('NEW_SHIPMENT')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'NEW_SHIPMENT' ? 'bg-white text-slate-900 shadow-sm' : 'text-white/80 hover:text-white'
            }`}
          >
            Enregistrer Envoi
          </button>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {/* TAB 1: TRACKING */}
        {activeTab === 'TRACKING' && (
          <div className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-bold text-slate-800 block">Numéro de suivi du colis :</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Package className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Ex: TSR-COL-2026-8812"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1"
                >
                  <Search className="w-4 h-4" />
                  <span>Suivre</span>
                </button>
              </div>
            </form>

            {/* Parcel Details Result */}
            {searchedParcel ? (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase">Référence Colis</span>
                    <h2 className="text-base font-black text-slate-900 font-mono">{searchedParcel.trackingNumber}</h2>
                    <span className="text-xs text-blue-700 font-medium">{searchedParcel.companyName}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                    searchedParcel.status === 'DELIVERED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : searchedParcel.status === 'ARRIVED_AT_AGENCY'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {searchedParcel.status === 'REGISTERED' && 'Enregistré'}
                    {searchedParcel.status === 'LOADED' && 'Chargé dans le car'}
                    {searchedParcel.status === 'IN_TRANSIT' && 'En transit routier'}
                    {searchedParcel.status === 'ARRIVED_AT_AGENCY' && 'Disponible en agence'}
                    {searchedParcel.status === 'DELIVERED' && 'Livré au destinataire'}
                  </span>
                </div>

                {/* Secret Pickup OTP Box */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-amber-800 uppercase font-bold block">
                      Code Secret de Retrait (OTP) :
                    </span>
                    <span className="text-lg font-black font-mono text-amber-950 tracking-wider">
                      {searchedParcel.pickupOtpCode}
                    </span>
                    <span className="text-[10px] text-amber-700 block mt-0.5">
                      À présenter impérativement par le destinataire au guichet pour retirer le colis.
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyOtp(searchedParcel.pickupOtpCode)}
                    className="p-2 bg-amber-200 hover:bg-amber-300 rounded-lg text-amber-900 text-xs font-semibold flex items-center gap-1"
                  >
                    {copiedOtp ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedOtp ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>

                {/* Route & Contacts */}
                <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-3">
                  <div className="space-y-1">
                    <span className="text-slate-400 block text-[10px]">Expéditeur :</span>
                    <span className="font-bold text-slate-800 block">{searchedParcel.senderName}</span>
                    <span className="text-slate-600 block">{searchedParcel.senderPhone}</span>
                    <span className="text-blue-600 text-[11px] block mt-1">Départ : {searchedParcel.originAgencyName}</span>
                  </div>

                  <div className="space-y-1 border-l border-slate-100 pl-3">
                    <span className="text-slate-400 block text-[10px]">Destinataire :</span>
                    <span className="font-bold text-slate-800 block">{searchedParcel.recipientName}</span>
                    <span className="text-slate-600 block">{searchedParcel.recipientPhone}</span>
                    <span className="text-blue-600 text-[11px] block mt-1">Arrivée : {searchedParcel.destinationAgencyName}</span>
                  </div>
                </div>

                {/* Package Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Poids</span>
                    <span className="font-bold text-slate-800">{searchedParcel.weightKg} kg</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Type</span>
                    <span className="font-bold text-slate-800">{searchedParcel.category}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Frais payés</span>
                    <span className="font-bold text-emerald-600">{searchedParcel.shippingFeeXOF.toLocaleString('fr-FR')} F</span>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <span className="text-xs font-bold text-slate-800 block mb-3">Historique d'acheminement :</span>
                  <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {searchedParcel.history.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 relative z-10 text-xs">
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{step.location}</div>
                          <div className="text-[11px] text-slate-500">{step.timestamp}</div>
                          {step.note && <div className="text-slate-600 text-[11px] italic mt-0.5">{step.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span>Aucun colis trouvé avec la référence « {trackingInput} ».</span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CALCULATOR */}
        {activeTab === 'CALCULATOR' && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Calculator className="w-4 h-4 text-amber-600" />
              <h2>Calculateur autoritaire de frais de colis</h2>
            </div>
            <p className="text-xs text-slate-500">
              Estimez le coût d'expédition selon la grille officielle en vigueur au Burkina Faso.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Catégorie de colis :</label>
                <select
                  value={calcCategory}
                  onChange={(e) => setCalcCategory(e.target.value as ParcelCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
                >
                  <option value="ENVELOPPE">Enveloppe / Documents légers (1 000 F base)</option>
                  <option value="PAQUET_PETIT">Petit paquet (&lt; 2 kg, 2 000 F base)</option>
                  <option value="CARTON_MOYEN">Carton moyen (2-10 kg, 3 500 F base)</option>
                  <option value="COLIS_LOURD">Colis lourd ou sac volumineux (6 000 F base)</option>
                  <option value="FRET_SPECIAL">Fret spécial / Électronique / Moto (10 000 F base)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Poids estimé (kg) : {calcWeight} kg</label>
                <input
                  type="range"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(parseFloat(e.target.value))}
                  className="w-full accent-amber-600"
                />
                <span className="text-[10px] text-slate-400">300 FCFA par kg supplémentaire au-delà de 2 kg.</span>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Valeur marchande déclarée (FCFA) :</label>
                <input
                  type="number"
                  step="5000"
                  value={calcDeclaredValue}
                  onChange={(e) => setCalcDeclaredValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium font-mono"
                />
                <span className="text-[10px] text-slate-400">Assurance perte / casse de 1% au-delà de 20 000 FCFA.</span>
              </div>
            </div>

            {/* Total Fee Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-800 font-semibold uppercase block">Tarif officiel calculé :</span>
                <span className="text-2xl font-black text-amber-950">
                  {calculatedFee.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
              <button
                onClick={() => setActiveTab('NEW_SHIPMENT')}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm"
              >
                Expédier ce colis
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: NEW SHIPMENT FORM */}
        {activeTab === 'NEW_SHIPMENT' && (
          <form onSubmit={handleCreateShipment} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Package className="w-4 h-4 text-amber-600" />
              <h2>Enregistrement d'un nouvel envoi de colis</h2>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nom de l'expéditeur *</label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Ex: Ousmane Ouédraogo"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Téléphone expéditeur *</label>
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nom du destinataire *</label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Ex: Alimatou Sanou"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Téléphone destinataire *</label>
                  <input
                    type="tel"
                    required
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-mono"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800 block">Ligne d'acheminement :</span>
                <span className="text-slate-600 block">Départ : Gare Centrale TSR Gounghin (Ouagadougou)</span>
                <span className="text-slate-600 block">Arrivée : Gare Principale TSR Accart-Ville (Bobo-Dioulasso)</span>
                <span className="text-amber-800 font-bold block pt-1">
                  Montant à régler au guichet : {calculatedFee.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl shadow-md text-xs transition-transform active:scale-95"
            >
              Générer l'étiquette et le bordereau de colis
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
