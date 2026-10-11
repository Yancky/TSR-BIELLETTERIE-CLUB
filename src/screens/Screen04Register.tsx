import React, { useState } from 'react';
import { appStore } from '../services/store';
import { authService } from '../services/authService';
import { User, Phone, Mail, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

export const Screen04Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+226 ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 8) {
      setErrorMsg('Veuillez saisir un numéro de téléphone burkinabè valide.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    if (!acceptTerms) {
      setErrorMsg('Veuillez accepter les conditions d\'utilisation de TSR TRANSIT.');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.registerTraveler({
        name: fullName,
        phone,
        email: email || undefined,
        password
      });
      setLoading(false);

      if (!result.success || !result.user) {
        setErrorMsg(result.error || 'Erreur lors de la création de compte.');
        return;
      }

      appStore.switchUser(result.user);
      appStore.navigateTo('05_SEARCH_TRIP');
    } catch (err: any) {
      setLoading(false);
      setErrorMsg(err.message || 'Erreur technique lors de l\'inscription.');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-white justify-between">
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Créer mon compte</h2>
          <p className="text-xs text-slate-500">
            Rejoignez des milliers de voyageurs et réservez vos billets en toute simplicité.
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Nom et Prénom</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ex : Aminata Ouédraogo"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Numéro de Téléphone (Burkina Faso)</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+226 70 00 00 00"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Adresse E-mail (Facultatif)</label>
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
              <label className="text-xs font-semibold text-slate-700">Mot de passe</label>
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
              <label className="text-xs font-semibold text-slate-700">Confirmation</label>
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
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-70 mt-2"
          >
            {loading ? (
              <span>Création du compte...</span>
            ) : (
              <>
                <span>Créer mon compte</span>
                <ArrowRight className="w-4 h-4 text-slate-900" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="pt-4 text-center text-xs text-slate-600 border-t border-slate-100">
        <span>Déjà un compte ? </span>
        <button
          onClick={() => appStore.navigateTo('03_LOGIN')}
          className="text-blue-700 font-bold hover:underline"
        >
          Se connecter
        </button>
      </div>
    </div>
  );
};
