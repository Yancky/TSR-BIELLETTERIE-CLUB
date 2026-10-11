/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { appStore } from '../../services/store';
import { UserRole } from '../../types';
import { Phone, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Check } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [identifier, setIdentifier] = useState('+226 70 12 34 56');
  const [password, setPassword] = useState('pass1234');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRolePreset = (phone: string) => {
    setIdentifier(phone);
    setPassword('pass1234');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const result = await authService.login({ identifier, password });
      setLoading(false);

      if (!result.success || !result.user) {
        setErrorMsg(result.error || 'Identifiant ou mot de passe incorrect.');
        return;
      }

      // Synchronise avec le store
      appStore.switchUser(result.user);

      if (onSuccess) {
        onSuccess();
      } else {
        // Redirection selon le rôle
        if (result.user.role === 'COMPANY_MANAGER') {
          appStore.navigateTo('14_COMPANY_DASHBOARD');
        } else if (result.user.role === 'AGENT') {
          appStore.navigateTo('16_QR_SCANNER');
        } else if (result.user.role === 'ADMIN') {
          appStore.navigateTo('17_ADMIN_DASHBOARD');
        } else {
          appStore.navigateTo('05_SEARCH_TRIP');
        }
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Erreur technique lors de la connexion.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Profils de test pré-configurés */}
      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
          Accès rapide de démonstration sécurisé :
        </label>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {[
            { label: 'Voyageur', phone: '+226 70 12 34 56', sub: 'Aminata Ouédraogo' },
            { label: 'Compagnie', phone: '+226 78 90 12 34', sub: 'Jean-Pierre (TSR)' },
            { label: 'Agent Gare', phone: '+226 76 54 32 10', sub: 'Ibrahim (Quai 1)' },
            { label: 'Admin', phone: '+226 70 00 11 22', sub: 'Admin Central' }
          ].map(item => {
            const isSelected = identifier === item.phone;
            return (
              <button
                key={item.phone}
                type="button"
                onClick={() => handleRolePreset(item.phone)}
                className={`p-2 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{item.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className={`text-[10px] block ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                  {item.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">
            Téléphone (+226) ou E-mail
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="+226 70 00 00 00"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-slate-700">Mot de passe</label>
            <span className="text-[11px] text-blue-600 hover:underline cursor-pointer">
              Mot de passe oublié ?
            </span>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1.5 text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#0F2C59] hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-70 mt-2"
        >
          {loading ? (
            <span>Authentification en cours...</span>
          ) : (
            <>
              <span>Se connecter</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </>
          )}
        </button>
      </form>

      {onSwitchToRegister && (
        <div className="text-center text-xs text-slate-600 pt-3 border-t border-slate-100">
          <span>Pas encore de compte ? </span>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-blue-700 font-bold hover:underline"
          >
            Créer un compte voyageur
          </button>
        </div>
      )}
    </div>
  );
};
