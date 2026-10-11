import React, { useState } from 'react';
import { appStore } from '../services/store';
import { 
  Building2, Phone, Mail, MapPin, ShieldCheck, 
  CheckCircle2, ArrowRight, Lock, Bus, MessageSquare 
} from 'lucide-react';

export const Screen18RegisterCompany: React.FC = () => {
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [headquarters, setHeadquarters] = useState('Gare Routière, Ouagadougou');
  const [phone, setPhone] = useState('+226 25 ');
  const [whatsapp, setWhatsapp] = useState('+226 70 ');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [merchantCode, setMerchantCode] = useState('OM-BF-');
  const [password, setPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !managerName.trim()) {
      setErrorMsg('Veuillez renseigner le nom de la compagnie et du responsable.');
      return;
    }
    if (phone.replace(/[^0-9]/g, '').length < 8) {
      setErrorMsg('Veuillez renseigner un numéro de téléphone valide au Burkina Faso.');
      return;
    }

    appStore.registerCompany({
      name,
      tradeName: tradeName || name,
      headquarters,
      phone,
      whatsapp,
      managerName,
      managerEmail,
      merchantCode
    });

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="flex-1 p-6 bg-white flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-slate-900">
            Dossier d'agrément transmis !
          </h2>
          <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
            Votre demande pour la société <strong>{name}</strong> a été enregistrée avec le statut <strong>EN ATTENTE DE VALIDATION</strong>.
          </p>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 text-left space-y-1 w-full max-w-xs">
          <div className="font-bold">Prochaines étapes :</div>
          <p className="text-[11px] text-blue-800">
            L'administration centrale TSR TRANSIT examine vos pièces justificatives. Dès validation, vous pourrez publier vos départs.
          </p>
        </div>
        <div className="pt-2 flex flex-col w-full max-w-xs gap-2">
          <button
            onClick={() => appStore.navigateTo('17_ADMIN_DASHBOARD')}
            className="w-full py-2.5 bg-blue-900 text-white rounded-xl text-xs font-bold"
          >
            Voir la demande dans l'Espace Admin &rarr;
          </button>
          <button
            onClick={() => appStore.navigateTo('02_PUBLIC_HOME')}
            className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 justify-between space-y-4">
      <div className="space-y-4">
        {/* Banner */}
        <div className="bg-[#0F2C59] text-white p-4 rounded-2xl shadow-sm space-y-1.5">
          <h2 className="text-sm font-extrabold">Enregistrement d'une Société de Transport</h2>
          <p className="text-xs text-blue-200">
            Rejoignez le réseau national TSR TRANSIT et vendez vos billets par Mobile Money en ligne.
          </p>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Raison Sociale Officielle</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex : SAHEL VOYAGES EXPRESS SARL"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Enseigne commerciale</label>
              <input
                type="text"
                value={tradeName}
                onChange={e => setTradeName(e.target.value)}
                placeholder="Ex : Sahel Express"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Ville du Siège</label>
              <input
                type="text"
                value={headquarters}
                onChange={e => setHeadquarters(e.target.value)}
                placeholder="Ouagadougou, Secteur 28"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Téléphone Fixe / Standard</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">WhatsApp Commercial</label>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2 space-y-2">
            <h3 className="font-bold text-slate-800 text-[11px] uppercase">
              Compte du Responsable Légal
            </h3>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Nom et Prénom du Responsable</label>
              <input
                type="text"
                value={managerName}
                onChange={e => setManagerName(e.target.value)}
                placeholder="Ex : Amadou Diallo"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">E-mail professionnel</label>
                <input
                  type="email"
                  value={managerEmail}
                  onChange={e => setManagerEmail(e.target.value)}
                  placeholder="direction@sahel.bf"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Code Marchand OM / Moov</label>
                <input
                  type="text"
                  value={merchantCode}
                  onChange={e => setMerchantCode(e.target.value)}
                  placeholder="OM-BF-8821"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mot de passe de gestion</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 caractères sécurisés"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
              <span className="text-[10px] text-slate-400 block">
                Sécurisé et chiffré par Firebase Authentication.
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#0F2C59] hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] mt-2"
          >
            <span>Soumettre la demande d'adhésion</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </form>
      </div>

      <div className="text-center text-[10px] text-slate-400">
        Statut initial : <strong>En attente d'approbation administrative</strong>
      </div>
    </div>
  );
};
