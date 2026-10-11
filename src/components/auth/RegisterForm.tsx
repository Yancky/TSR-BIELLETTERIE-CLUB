/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { appStore } from '../../services/store';
import { User, Phone, Mail, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+226 7');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe saisis ne correspondent pas.');
      return;
    }
    if (!acceptTerms) {
      setErrorMsg('Veuillez accepter les conditions d\'utilisation de TSR TRANSIT.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.registerTraveler({
        name,
        phone,
        email: email || undefined,
        password
      });
      setLoading(false);

      if (!result.success || !result.user) {
        setErrorMsg(result.error || 'Erreur lors de la création de compte.');
        return;
      }

      // Synchronise avec le store
      appStore.switchUser(result.user);

      if (onSuccess) {
        onSuccess();
      } else {
        appStore.navigateTo('05_SEARCH_TRIP');
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Erreur technique lors de l\'inscription.');
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Nom et Prénom</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex : Aminata Ouédraogo"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Téléphone (Burkina Faso)</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+226 70 00 00 00"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Adresse E-mail (Facultatif)</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Ex : aminata@fasonet.bf"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Mot de passe</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 car."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Confirmation</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Répétez"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>
        </div>

        <div className="pt-1">
          <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={e => setAcceptTerms(e.target.checked)}
              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
            />
            <span>
              J'accepte les conditions d'utilisation et la politique de billetterie électronique TSR TRANSIT.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-70 mt-2"
        >
          {loading ? (
            <span>Création sécurisée du compte...</span>
          ) : (
            <>
              <span>Créer mon compte voyageur</span>
              <ArrowRight className="w-4 h-4 text-slate-900" />
            </>
          )}
        </button>
      </form>

      {onSwitchToLogin && (
        <div className="text-center text-xs text-slate-600 pt-3 border-t border-slate-100">
          <span>Déjà inscrit ? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-blue-700 font-bold hover:underline"
          >
            Se connecter
          </button>
        </div>
      )}
    </div>
  );
};
