/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CompanyRegistrationInput, BusCategory } from '../types';
import { CompanyService } from '../services/companyService';
import { BURKINA_CITIES } from '../services/mockData';
import { 
  Building2, User, Lock, Phone, Mail, MapPin, 
  ShieldCheck, Upload, CheckCircle2, X, ArrowRight, ArrowLeft 
} from 'lucide-react';

interface CompanyRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (applicationRef: string) => void;
}

export const CompanyRegistrationModal: React.FC<CompanyRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successRef, setSuccessRef] = useState<string | null>(null);

  // Form state matching CompanyRegistrationInput
  const [form, setForm] = useState<CompanyRegistrationInput>({
    name: '',
    tradeName: '',
    companyType: 'SARL',
    ifuNumber: '',
    rccmNumber: '',
    establishedYear: '2022',
    description: '',
    headquartersAddress: '',
    city: 'Ouagadougou',
    region: 'Centre',
    country: 'Burkina Faso',

    managerName: '',
    managerRole: 'Directeur Général',
    phone: '+226 ',
    email: '',
    professionalAddress: '',
    desiredUsername: '',

    password: '',
    confirmPassword: '',
    termsAccepted: false,
    dataConsentAccepted: false,

    whatsapp: '+226 ',
    secondaryPhone: '',
    acceptedPaymentMethods: ['ORANGE_MONEY', 'MOOV_MONEY', 'WAVE'],
    merchantCode: '',
    websiteUrl: '',

    estimatedVehicles: 10,
    estimatedSeats: 500,
    agenciesCount: 3,
    servedCities: ['Ouagadougou', 'Bobo-Dioulasso'],
    mainRoutes: ['Ouagadougou - Bobo-Dioulasso'],
    serviceCategories: ['CONFORT', 'VIP'],

    rccmDocName: 'registre_commerce.pdf',
    transportLicenseDocName: 'licence_ministere_transports.pdf',
    identityDocName: 'cnib_responsable.pdf'
  });

  if (!isOpen) return null;

  const handleChange = (field: keyof CompanyRegistrationInput, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (step === 1) {
      if (!form.name.trim() || !form.ifuNumber.trim() || !form.rccmNumber.trim() || !form.headquartersAddress.trim()) {
        setErrorMsg('Veuillez renseigner les champs obligatoires de l\'identité de la société.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.managerName.trim() || !form.phone.trim() || !form.email.trim()) {
        setErrorMsg('Veuillez renseigner les coordonnées complètes du représentant légal.');
        return;
      }
      if (!form.password || form.password.length < 6) {
        setErrorMsg('Le mot de passe de gestion doit contenir au moins 6 caractères.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setErrorMsg('Les mots de passe ne correspondent pas.');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.termsAccepted) {
      setErrorMsg('Veuillez accepter les conditions d\'agrément TSR TRANSIT.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const res = CompanyService.submitRegistration(form);
      setSubmitting(false);

      if (!res.success || !res.applicationRef) {
        setErrorMsg(res.error || 'Erreur lors de la transmission de la demande.');
        return;
      }

      setSuccessRef(res.applicationRef);
      if (onSuccess) onSuccess(res.applicationRef);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col border border-slate-200">
        {/* Modal Top Header */}
        <div className="bg-[#0F2C59] text-white p-5 rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-wide">
                Enregistrer une Société de Transport
              </h2>
              <p className="text-xs text-blue-200">
                Agrément officiel au réseau national TSR TRANSIT (Burkina Faso)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progression Bar */}
        {!successRef && (
          <div className="bg-slate-100 p-3 flex items-center justify-around border-b border-slate-200 text-xs font-semibold">
            <div className={`flex items-center gap-1.5 ${step === 1 ? 'text-blue-900 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-blue-900 text-white' : 'bg-slate-300'}`}>1</span>
              <span>Identité Société</span>
            </div>
            <span>&rarr;</span>
            <div className={`flex items-center gap-1.5 ${step === 2 ? 'text-blue-900 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-blue-900 text-white' : 'bg-slate-300'}`}>2</span>
              <span>Responsable &amp; Sécurité</span>
            </div>
            <span>&rarr;</span>
            <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-blue-900 font-bold' : 'text-slate-500'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-blue-900 text-white' : 'bg-slate-300'}`}>3</span>
              <span>Flotte &amp; Agrément</span>
            </div>
          </div>
        )}

        {/* Body content */}
        <div className="p-6 flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          {successRef ? (
            /* Confirmation View */
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-slate-900">
                  Dossier d'Agrément Enregistré avec Succès !
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Votre demande pour <strong>{form.name}</strong> a été enregistrée au statut <strong>EN ATTENTE DE VALIDATION (PENDING)</strong>.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl w-full max-w-sm text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Référence de suivi :</span>
                  <span className="font-mono font-bold text-blue-900">{successRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Statut initial :</span>
                  <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[10px]">
                    PENDING
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pays d'enregistrement :</span>
                  <span className="font-semibold text-slate-800">Burkina Faso</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 max-w-sm">
                Conformément aux règles de sécurité, les compagnies en attente ne peuvent pas publier de départs sans validation explicite par l'administration centrale.
              </p>

              <button
                onClick={onClose}
                className="py-2.5 px-6 bg-[#0F2C59] text-white rounded-xl text-xs font-bold shadow-md hover:bg-blue-900 transition-colors"
              >
                Fermer &amp; Retourner au portail
              </button>
            </div>
          ) : (
            <form onSubmit={step === 3 ? handleSubmit : handleNextStep} className="space-y-4 text-xs">
              {/* STEP 1: Identité Société */}
              {step === 1 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider border-b pb-1.5">
                    Section A — Identité Légale de la Société
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Dénomination Sociale *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => handleChange('name', e.target.value)}
                        placeholder="Ex : SOTRAO TRANSPORT BURKINA"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Nom commercial / Enseigne</label>
                      <input
                        type="text"
                        value={form.tradeName}
                        onChange={e => handleChange('tradeName', e.target.value)}
                        placeholder="Ex : Sotrao Express"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Forme Juridique</label>
                      <select
                        value={form.companyType}
                        onChange={e => handleChange('companyType', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        <option value="SARL">SARL</option>
                        <option value="SA">SA</option>
                        <option value="SAS">SAS</option>
                        <option value="EURL">EURL</option>
                        <option value="GIE">GIE</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Numéro IFU (Burkina) *</label>
                      <input
                        type="text"
                        value={form.ifuNumber}
                        onChange={e => handleChange('ifuNumber', e.target.value)}
                        placeholder="00012345M"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Numéro RCCM *</label>
                      <input
                        type="text"
                        value={form.rccmNumber}
                        onChange={e => handleChange('rccmNumber', e.target.value)}
                        placeholder="BF-OUA-2022-B-0012"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1 sm:col-span-2">
                      <label className="font-semibold text-slate-700">Adresse du Siège Social *</label>
                      <input
                        type="text"
                        value={form.headquartersAddress}
                        onChange={e => handleChange('headquartersAddress', e.target.value)}
                        placeholder="Secteur 28, Boulevard Charles de Gaulle"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Ville du Siège</label>
                      <select
                        value={form.city}
                        onChange={e => handleChange('city', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      >
                        {BURKINA_CITIES.map(c => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Responsable & Connexion */}
              {step === 2 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider border-b pb-1.5">
                    Section B &amp; C — Représentant Légal &amp; Accès Sécurisé
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Nom et Prénom du Responsable *</label>
                      <input
                        type="text"
                        value={form.managerName}
                        onChange={e => handleChange('managerName', e.target.value)}
                        placeholder="Ex : Ousmane Sawadogo"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Fonction / Titre</label>
                      <input
                        type="text"
                        value={form.managerRole}
                        onChange={e => handleChange('managerRole', e.target.value)}
                        placeholder="Directeur Général"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Téléphone Professionnel *</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => handleChange('phone', e.target.value)}
                        placeholder="+226 70 00 00 00"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">E-mail Professionnel *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => handleChange('email', e.target.value)}
                        placeholder="direction@sotrao.bf"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Mot de Passe du Compte *</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={e => handleChange('password', e.target.value)}
                        placeholder="Min. 6 caractères"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Confirmer le Mot de Passe *</label>
                      <input
                        type="password"
                        value={form.confirmPassword}
                        onChange={e => handleChange('confirmPassword', e.target.value)}
                        placeholder="Répétez le mot de passe"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Flotte, Justificatifs & Agrément */}
              {step === 3 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-800 uppercase text-[11px] tracking-wider border-b pb-1.5">
                    Section D &amp; E — Flotte, Itinéraires &amp; Pièces Justificatives
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Flotte estimée (cars)</label>
                      <input
                        type="number"
                        value={form.estimatedVehicles}
                        onChange={e => handleChange('estimatedVehicles', Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                        min={1}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Nombre d'agences</label>
                      <input
                        type="number"
                        value={form.agenciesCount}
                        onChange={e => handleChange('agenciesCount', Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                        min={1}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">WhatsApp Commercial</label>
                      <input
                        type="tel"
                        value={form.whatsapp}
                        onChange={e => handleChange('whatsapp', e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>

                  {/* Justificatifs déposés */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-700 block">Dépôt des Pièces Justificatives :</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5 p-2 bg-white rounded-lg border">
                        <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">Attestation RCCM</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 bg-white rounded-lg border">
                        <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">Licence Transport BF</span>
                      </div>
                      <div className="flex items-center gap-1.5 p-2 bg-white rounded-lg border">
                        <Upload className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">CNIB Responsable</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.termsAccepted}
                        onChange={e => handleChange('termsAccepted', e.target.checked)}
                        className="mt-0.5 rounded text-blue-600"
                        required
                      />
                      <span className="text-slate-600">
                        Je certifie l'authenticité des informations fournies et demande l'agrément officiel de la société sur le réseau <strong>TSR TRANSIT</strong>. Le dossier sera soumis à validation administrative (statut PENDING).
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((step - 1) as any)}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Précédent</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-4 text-slate-500 hover:text-slate-700 font-medium"
                  >
                    Annuler
                  </button>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-6 bg-[#0F2C59] hover:bg-blue-900 disabled:bg-slate-300 text-white font-extrabold rounded-xl flex items-center gap-2 shadow-md transition-all active:scale-[0.98]"
                >
                  {submitting ? (
                    <span>Transmission en cours...</span>
                  ) : step < 3 ? (
                    <>
                      <span>Continuer</span>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </>
                  ) : (
                    <>
                      <span>Soumettre la demande d'agrément</span>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
