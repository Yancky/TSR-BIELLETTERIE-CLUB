/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import { appStore } from '../services/store';

interface UnauthorizedPageProps {
  requiredRole?: string;
  reason?: string;
  onBack?: () => void;
}

export const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  requiredRole,
  reason,
  onBack
}) => {
  const state = appStore.getState();
  const currentRole = state.currentUser?.role || 'NON CONNECTÉ';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 text-center space-y-4 min-h-[500px]">
      <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center shadow-md">
        <ShieldAlert className="w-9 h-9 stroke-[2.2]" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h2 className="text-lg font-extrabold text-slate-900">
          Accès Refusé (403 Forbidden)
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {reason || 'Votre profil ne dispose pas des autorisations nécessaires pour accéder à cette interface.'}
        </p>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 w-full max-w-xs space-y-1.5 shadow-sm text-left">
        <div className="flex justify-between">
          <span className="text-slate-400">Votre rôle actuel :</span>
          <span className="font-bold text-red-700 font-mono">{currentRole}</span>
        </div>
        {requiredRole && (
          <div className="flex justify-between">
            <span className="text-slate-400">Rôle requis :</span>
            <span className="font-bold text-blue-900 font-mono">{requiredRole}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col w-full max-w-xs gap-2 pt-2">
        <button
          onClick={() => {
            if (onBack) onBack();
            else appStore.navigateTo('03_LOGIN');
          }}
          className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
        >
          <LogIn className="w-3.5 h-3.5 text-amber-400" />
          <span>Se connecter avec un profil autorisé</span>
        </button>

        <button
          onClick={() => appStore.navigateTo('02_PUBLIC_HOME')}
          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Retour à l'accueil public</span>
        </button>
      </div>
    </div>
  );
};
