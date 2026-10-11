import React, { useState } from 'react';
import { appStore } from '../services/store';
import { 
  User, Phone, Mail, Ticket, Settings, 
  LogOut, Shield, ChevronRight, Edit3, CheckCircle2 
} from 'lucide-react';

export const Screen13TravelerProfile: React.FC = () => {
  const state = appStore.getState();
  const user = state.currentUser || {
    id: 'guest',
    name: 'Aminata Ouédraogo',
    phone: '+226 70 12 34 56',
    email: 'aminata.ouedraogo@fasonet.bf',
    role: 'TRAVELER',
    createdAt: '2026-01-10'
  };

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.currentUser) {
      state.currentUser.name = name;
      state.currentUser.phone = phone;
      state.currentUser.email = email;
    }
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLogout = () => {
    appStore.switchUser(null);
    appStore.navigateTo('02_PUBLIC_HOME');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 justify-between space-y-4">
      <div className="space-y-4">
        {/* Profile Card Header */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center space-y-3">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-[#0F2C59] text-white flex items-center justify-center font-bold text-2xl shadow-md border-4 border-white">
              {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute bottom-0 right-0 p-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-full shadow-md"
              title="Modifier"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <h2 className="text-base font-bold text-slate-900">{name}</h2>
            <span className="text-xs text-blue-700 font-medium bg-blue-50 px-2.5 py-0.5 rounded-full inline-block mt-1">
              Voyageur Vérifié TSR
            </span>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Informations de profil mises à jour avec succès.</span>
          </div>
        )}

        {/* Profile Details or Edit Form */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Coordonnées Personnelles
            </h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              {isEditing ? 'Annuler' : 'Modifier'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Nom complet</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Téléphone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#0F2C59] text-white rounded-lg text-xs font-bold"
              >
                Enregistrer les modifications
              </button>
            </form>
          ) : (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Téléphone</span>
                  <span className="font-semibold text-slate-800 font-mono">{phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block">E-mail</span>
                  <span className="font-semibold text-slate-800">{email || 'Non renseigné'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Pays de résidence</span>
                  <span className="font-semibold text-slate-800">Burkina Faso (BF)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Menu Links */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 text-xs">
          <button
            onClick={() => appStore.navigateTo('12_TRAVEL_HISTORY')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Ticket className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-800">Mes Billets &amp; Voyages</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => appStore.navigateTo('20_NOTIFICATIONS')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 text-amber-500 font-bold">🔔</span>
              <span className="font-semibold text-slate-800">Centre de Notifications</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => appStore.navigateTo('21_SETTINGS')}
            className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-slate-600" />
              <span className="font-semibold text-slate-800">Paramètres &amp; Sécurité</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Logout button */}
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
