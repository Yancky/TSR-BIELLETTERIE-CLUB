import React, { useState } from 'react';
import { appStore } from '../services/store';
import { 
  Globe, Bell, Shield, Smartphone, HelpCircle, 
  Trash2, LogOut, ChevronRight, CheckCircle2 
} from 'lucide-react';

export const Screen21Settings: React.FC = () => {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, current: boolean) => {
    setter(!current);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleClearCache = () => {
    if (confirm('Voulez-vous purger le cache local de l\'application ? Vos billets enregistrés seront rechargés au prochain démarrage.')) {
      alert('Cache local nettoyé.');
    }
  };

  const handleLogout = () => {
    appStore.switchUser(null);
    appStore.navigateTo('02_PUBLIC_HOME');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 justify-between space-y-4">
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Paramètres de l'application</h2>

        {savedNotice && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Préférence enregistrée.</span>
          </div>
        )}

        {/* Regional Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 text-xs">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-semibold text-slate-800 block">Langue principale</span>
                <span className="text-[10px] text-slate-400">Français (Burkina Faso)</span>
              </div>
            </div>
            <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
              Français
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 text-amber-500 font-mono font-bold">XOF</span>
              <div>
                <span className="font-semibold text-slate-800 block">Devise des tarifs</span>
                <span className="text-[10px] text-slate-400">Franc CFA BCEAO</span>
              </div>
            </div>
            <span className="font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
              FCFA (XOF)
            </span>
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 text-emerald-500 font-bold">🕒</span>
              <div>
                <span className="font-semibold text-slate-800 block">Fuseau horaire</span>
                <span className="text-[10px] text-slate-400">GMT+0 Ouagadougou</span>
              </div>
            </div>
            <span className="font-mono text-slate-600 text-[11px]">
              Africa/Ouagadougou
            </span>
          </div>
        </div>

        {/* Notifications & Connectivity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 text-xs">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-purple-600" />
              <div>
                <span className="font-semibold text-slate-800 block">Notifications Push</span>
                <span className="text-[10px] text-slate-400">Rappels de car 30 min avant</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushNotifs}
              onChange={() => handleToggle(setPushNotifs, pushNotifs)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-semibold text-slate-800 block">Alertes SMS Passager</span>
                <span className="text-[10px] text-slate-400">Numéro de billet et quai par SMS</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={() => handleToggle(setSmsAlerts, smsAlerts)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>

          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-blue-600" />
              <div>
                <span className="font-semibold text-slate-800 block">Mise en cache hors ligne</span>
                <span className="text-[10px] text-slate-400">Conservation des billets locaux</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={offlineSync}
              onChange={() => handleToggle(setOfflineSync, offlineSync)}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>
        </div>

        {/* Legal & Storage */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 text-xs">
          <button
            onClick={() => appStore.navigateTo('22_OFFLINE_MODE')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <span className="font-semibold text-slate-800">Mode Hors Connexion</span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={handleClearCache}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <span>Purger le cache local des données</span>
            <Trash2 className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 border border-red-200 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Se déconnecter</span>
      </button>
    </div>
  );
};
