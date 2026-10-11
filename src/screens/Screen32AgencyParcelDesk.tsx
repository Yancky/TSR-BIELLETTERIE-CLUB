/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ParcelService } from '../services/parcelService';
import { ParcelCategory, ParcelShipment, ParcelStatus } from '../types';
import { 
  Package, Scale, CheckCircle2, AlertCircle, 
  KeyRound, Shield, Search, ArrowUpRight, Truck 
} from 'lucide-react';

export const Screen32AgencyParcelDesk: React.FC = () => {
  const [parcels, setParcels] = useState<ParcelShipment[]>(ParcelService.getAllParcels());
  const [searchRef, setSearchRef] = useState<string>('');
  const [selectedParcel, setSelectedParcel] = useState<ParcelShipment | null>(parcels[0] || null);

  // Delivery OTP Modal
  const [otpInput, setOtpInput] = useState<string>('');
  const [deliveryMessage, setDeliveryMessage] = useState<{ success: boolean; text: string } | null>(null);

  // Quick Counter Intake Form
  const [senderName, setSenderName] = useState<string>('');
  const [senderPhone, setSenderPhone] = useState<string>('+226 ');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientPhone, setRecipientPhone] = useState<string>('+226 ');
  const [weightKg, setWeightKg] = useState<number>(3);
  const [category, setCategory] = useState<ParcelCategory>('CARTON_MOYEN');
  const [destinationAgency, setDestinationAgency] = useState<string>('Gare Principale TSR Accart-Ville (Bobo)');

  const refreshList = () => {
    setParcels(ParcelService.getAllParcels());
  };

  const handleCreateCounterParcel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName || !recipientName) return;

    const newParcel = ParcelService.registerParcel({
      companyId: 'comp_tsr_01',
      companyName: 'TSR TRANSIT BURKINA',
      originAgencyId: 'ag_tsr_ouaga_gounghin',
      originAgencyName: 'Gare Centrale TSR Gounghin (Ouaga)',
      destinationAgencyId: 'ag_tsr_bobo_accart',
      destinationAgencyName: destinationAgency,
      senderName,
      senderPhone,
      recipientName,
      recipientPhone,
      category,
      weightKg,
      declaredValueXOF: 25000
    });

    refreshList();
    setSelectedParcel(newParcel);
    setSenderName('');
    setRecipientName('');
    setDeliveryMessage({
      success: true,
      text: `Colis ${newParcel.trackingNumber} enregistré avec succès au guichet ! Code OTP transmis au client.`
    });
  };

  const handleDeliverWithOtp = () => {
    if (!selectedParcel) return;
    setDeliveryMessage(null);

    const res = ParcelService.updateParcelStatus({
      trackingNumber: selectedParcel.trackingNumber,
      newStatus: 'DELIVERED',
      location: 'Gare d’arrivée - Guichet Retrait',
      note: 'Remis en main propre au destinataire après vérification de CNIB et code OTP.',
      otpCode: otpInput
    });

    if (res.success && res.parcel) {
      setSelectedParcel(res.parcel);
      refreshList();
      setDeliveryMessage({ success: true, text: 'Colis remis et clôturé avec succès !' });
      setOtpInput('');
    } else {
      setDeliveryMessage({ success: false, text: res.message });
    }
  };

  const handleUpdateStatus = (newStatus: ParcelStatus) => {
    if (!selectedParcel) return;
    const res = ParcelService.updateParcelStatus({
      trackingNumber: selectedParcel.trackingNumber,
      newStatus,
      location: 'Gare Centrale TSR Gounghin',
      note: `Statut mis à jour par l'agent de gare.`
    });
    if (res.success && res.parcel) {
      setSelectedParcel(res.parcel);
      refreshList();
    }
  };

  const filtered = parcels.filter(p =>
    !searchRef || p.trackingNumber.toLowerCase().includes(searchRef.toLowerCase()) ||
    p.recipientName.toLowerCase().includes(searchRef.toLowerCase())
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-20 text-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white px-4 pt-6 pb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Espace Agent & Gare</span>
            <h1 className="text-xl font-bold">Guichet Opérationnel Fret & Colis</h1>
          </div>
          <Scale className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-xs text-slate-300 mt-1">
          Pesée au guichet, encaissement, pointage dans les cars et validation sécurisée par code OTP.
        </p>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {deliveryMessage && (
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            deliveryMessage.success
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {deliveryMessage.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{deliveryMessage.text}</span>
          </div>
        )}

        {/* Counter Intake Form */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-amber-600" />
              <span>Enregistrement Direct au Guichet</span>
            </span>
            <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px]">
              Gare Gounghin
            </span>
          </div>

          <form onSubmit={handleCreateCounterParcel} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Expéditeur</label>
                <input
                  type="text"
                  required
                  placeholder="Nom complet"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium block mb-1">Téléphone expéditeur</label>
                <input
                  type="tel"
                  required
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Destinataire</label>
                <input
                  type="text"
                  required
                  placeholder="Nom complet"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium block mb-1">Téléphone destinataire</label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-600 font-medium block mb-1">Pesée (kg) sur balance</label>
                <input
                  type="number"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                />
              </div>
              <div>
                <label className="text-slate-600 font-medium block mb-1">Gare de destination</label>
                <select
                  value={destinationAgency}
                  onChange={(e) => setDestinationAgency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                >
                  <option value="Gare Principale TSR Accart-Ville (Bobo)">Bobo Accart-Ville</option>
                  <option value="Gare TSR Banfora Cascades">Banfora Cascades</option>
                  <option value="Gare TSR Koudougou Centre">Koudougou Centre</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg shadow-sm"
            >
              Encaisser & Imprimer Bordereau
            </button>
          </form>
        </div>

        {/* Selected Parcel Inspector & Actions */}
        {selectedParcel && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-slate-400 font-mono text-[10px]">COLIS SÉLECTIONNÉ</span>
                <h3 className="text-base font-black font-mono text-slate-900">{selectedParcel.trackingNumber}</h3>
                <span className="text-blue-700">{selectedParcel.originAgencyName} ➔ {selectedParcel.destinationAgencyName}</span>
              </div>
              <span className="bg-slate-100 font-bold px-2 py-0.5 rounded text-[11px]">
                Statut : {selectedParcel.status}
              </span>
            </div>

            {/* Quick Agent Actions */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => handleUpdateStatus('LOADED')}
                disabled={selectedParcel.status === 'DELIVERED'}
                className="bg-blue-50 hover:bg-blue-100 text-blue-800 p-2 rounded-lg border border-blue-200 font-semibold flex items-center justify-center gap-1"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Pointer Chargé dans le car</span>
              </button>
              <button
                onClick={() => handleUpdateStatus('ARRIVED_AT_AGENCY')}
                disabled={selectedParcel.status === 'DELIVERED'}
                className="bg-purple-50 hover:bg-purple-100 text-purple-800 p-2 rounded-lg border border-purple-200 font-semibold flex items-center justify-center gap-1"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Décharger en agence</span>
              </button>
            </div>

            {/* OTP Delivery Verification Box */}
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <KeyRound className="w-4 h-4 text-emerald-700" />
                <span>Remise au Destinataire (Vérification OTP Obligatoire)</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Demandez au client le code à 4 chiffres reçu par SMS pour déverrouiller la remise.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Code OTP (4 chiffres)"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  className="flex-1 bg-white border border-emerald-300 rounded-lg p-2 font-mono font-black text-center text-sm"
                />
                <button
                  onClick={handleDeliverWithOtp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-lg shadow-sm"
                >
                  Valider Remise
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Parcels List Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm text-xs">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-slate-800">Registre du Guichet ({filtered.length})</span>
            <input
              type="text"
              placeholder="Filtrer réf / destinataire..."
              value={searchRef}
              onChange={(e) => setSearchRef(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
            />
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedParcel(p)}
                className={`p-3 cursor-pointer transition-colors flex items-center justify-between ${
                  selectedParcel?.id === p.id ? 'bg-amber-50/70 font-semibold' : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-mono text-slate-900">{p.trackingNumber}</div>
                  <div className="text-[11px] text-slate-500">Pour : {p.recipientName} ({p.recipientPhone})</div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.status}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-0.5">{p.weightKg} kg • {p.shippingFeeXOF} F</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
