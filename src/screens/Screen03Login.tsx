import React, { useState } from 'react';
import { appStore } from '../services/store';
import { authService } from '../services/authService';
import { UserRole } from '../types';
import { DEMO_USERS } from '../services/mockData';
import { Eye, EyeOff, Lock, Phone, Mail, ArrowRight, ShieldCheck, Check } from 'lucide-react';

export const Screen03Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('+226 70 12 34 56');
  const [password, setPassword] = useState('pass1234');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('TRAVELER');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const demo = DEMO_USERS.find(u => u.role === role);
    if (demo) {
      setIdentifier(demo.phone);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login({ identifier, password });
      setLoading(false);

      if (!result.success || !result.user) {
        // Fallback pour profils de démo si mot de passe non standard
        appStore.loginAsRole(selectedRole);
      } else {
        appStore.switchUser(result.user);
      }

      // Redirect depending on role
      const activeRole = appStore.getState().currentUser?.role || selectedRole;
      if (activeRole === 'COMPANY_MANAGER') {
        appStore.navigateTo('14_COMPANY_DASHBOARD');
      } else if (activeRole === 'AGENT') {
        appStore.navigateTo('16_QR_SCANNER');
      } else if (activeRole === 'ADMIN') {
        appStore.navigateTo('17_ADMIN_DASHBOARD');
      } else {
        appStore.navigateTo('05_SEARCH_TRIP');
      }
    } catch {
      setLoading(false);
      appStore.loginAsRole(selectedRole);
      appStore.navigateTo('05_SEARCH_TRIP');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-white justify-between">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-50 text-blue-900 rounded-2xl mx-auto flex items-center justify-center p-2.5 shadow-sm border border-blue-100">
            <img
              src="/src/assets/images/tsr_transit_badge_1791641501297.jpg"
              alt="Logo TSR"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Connexion à TSR TRANSIT</h2>
          <p className="text-xs text-slate-500">
            Accédez à vos billets, réservations ou à votre espace professionnel.
          </p>
        </div>

        {/* Quick Role Profile Chooser */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
            Sélectionnez votre espace / profil de test :
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { role: 'TRAVELER', label: 'Voyageur', sub: 'Billets & Réservations' },
              { role: 'COMPANY_MANAGER', label: 'Compagnie', sub: 'Départs & Flotte' },
              { role: 'AGENT', label: 'Agent Gare', sub: 'Scanner & Embarquement' },
              { role: 'ADMIN', label: 'Admin Plateforme', sub: 'Supervision & Agréments' }
            ].map(item => {
              const active = selectedRole === item.role;
              return (
                <button
                  key={item.role}
                  type="button"
                  onClick={() => handleRoleSelect(item.role as UserRole)}
                  className={`p-2 rounded-lg text-left transition-all border ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{item.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-[10px] block ${active ? 'text-blue-100' : 'text-slate-400'}`}>
                    {item.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Numéro de téléphone ou E-mail
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="+226 70 00 00 00 ou email"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={() => alert('Veuillez contacter le support TSR au +226 25 36 20 20 pour la réinitialisation de compte.')}
                className="text-[11px] text-blue-600 hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
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
            className="w-full py-3 bg-[#0F2C59] hover:bg-blue-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? (
              <span>Vérification...</span>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer Register link */}
      <div className="pt-6 text-center text-xs text-slate-600 border-t border-slate-100">
        <span>Pas encore de compte ? </span>
        <button
          onClick={() => appStore.navigateTo('04_REGISTER')}
          className="text-blue-700 font-bold hover:underline"
        >
          Créer un compte voyageur
        </button>
      </div>
    </div>
  );
};
