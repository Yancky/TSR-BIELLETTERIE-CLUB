/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LoyaltyService } from '../services/loyaltyService';
import { appStore } from '../services/store';
import { 
  Award, QrCode, Sparkles, CheckCircle2, 
  ArrowRight, CreditCard, Gift, Shield, ChevronRight 
} from 'lucide-react';

export const Screen31LoyaltyProgram: React.FC = () => {
  const currentUser = appStore.getState().currentUser;
  const userId = currentUser?.id || 'user_traveler_01';
  const [account, setAccount] = useState(LoyaltyService.getAccount(userId));
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(200);
  const [redeemSuccess, setRedeemSuccess] = useState<string>('');
  const [redeemError, setRedeemError] = useState<string>('');

  const plans = LoyaltyService.getSubscriptionPlans();

  const handleRedeem = () => {
    setRedeemError('');
    setRedeemSuccess('');
    const res = LoyaltyService.redeemPoints(userId, pointsToRedeem);
    if (res.success) {
      setRedeemSuccess(res.message);
      setAccount(LoyaltyService.getAccount(userId));
    } else {
      setRedeemError(res.message);
    }
  };

  const handleSubscribe = (planName: string) => {
    alert(`Votre demande de souscription au « ${planName} » a été initiée. Vous recevrez le lien de paiement Mobile Money par SMS.`);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 text-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-800 via-blue-900 to-slate-950 text-white px-4 pt-6 pb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Avantages Voyageurs</span>
            <h1 className="text-xl font-bold">Programme Fidélité TSR</h1>
          </div>
          <Award className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-xs text-blue-100 mt-1">
          Cumulez des points à chaque kilomètre parcouru et débloquez des réductions exclusives.
        </p>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
        {/* Digital Loyalty Card */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white rounded-2xl p-5 shadow-xl border border-blue-500/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"></div>

          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-[11px] text-blue-200 uppercase font-mono tracking-wider">Carte Membre Privilège</span>
              <h2 className="text-lg font-black tracking-wide mt-0.5">TSR CLUB BURKINA</h2>
            </div>
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full uppercase shadow">
              Statut {account.tier}
            </span>
          </div>

          <div className="my-6 relative z-10 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-300 block">Solde de Points Disponibles</span>
              <div className="text-3xl font-black text-amber-400 tracking-tight">
                {account.pointsBalance.toLocaleString('fr-FR')} <span className="text-sm font-semibold text-white">pts</span>
              </div>
              <span className="text-[10px] text-slate-300">
                Valeur estimée : ~{(account.pointsBalance * 5).toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <div className="bg-white p-2 rounded-xl text-slate-900 flex flex-col items-center shadow-lg">
              <QrCode className="w-12 h-12 text-slate-900" />
              <span className="text-[9px] font-mono font-bold mt-1">SCAN CLUB</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3 relative z-10 text-xs text-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 block">Titulaire :</span>
              <span className="font-bold text-white">{currentUser?.name || 'Aminata Ouédraogo'}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">N° de Carte :</span>
              <span className="font-mono font-bold text-amber-300">{account.cardNumber}</span>
            </div>
          </div>
        </div>

        {/* Account Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <span className="text-slate-400 text-[10px] block">Voyages effectués</span>
            <span className="font-bold text-slate-800 text-sm">{account.totalTripsCompleted} trajets</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Dépenses cumulées</span>
            <span className="font-bold text-blue-700 text-sm">{account.totalSpentXOF.toLocaleString('fr-FR')} F</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Points à vie</span>
            <span className="font-bold text-amber-600 text-sm">{account.lifetimePoints} pts</span>
          </div>
        </div>

        {/* Tier Benefits */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Vos privilèges du palier {account.tier}</span>
          </div>
          <div className="space-y-1.5">
            {account.benefits.map((b, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Convert Points to Discount Voucher */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
            <Gift className="w-4 h-4 text-blue-600" />
            <span>Convertir vos points en réduction immédiate</span>
          </div>

          {redeemSuccess && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-2.5 rounded-lg text-xs font-medium">
              {redeemSuccess}
            </div>
          )}
          {redeemError && (
            <div className="bg-rose-50 text-rose-800 border border-rose-200 p-2.5 rounded-lg text-xs font-medium">
              {redeemError}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setPointsToRedeem(200)}
              className={`flex-1 py-2 px-1 rounded-lg border text-center font-bold ${
                pointsToRedeem === 200 ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              200 pts (1 000 F)
            </button>
            <button
              onClick={() => setPointsToRedeem(500)}
              className={`flex-1 py-2 px-1 rounded-lg border text-center font-bold ${
                pointsToRedeem === 500 ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              500 pts (2 500 F)
            </button>
            <button
              onClick={() => setPointsToRedeem(1000)}
              className={`flex-1 py-2 px-1 rounded-lg border text-center font-bold ${
                pointsToRedeem === 1000 ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              1000 pts (5 000 F)
            </button>
          </div>

          <button
            onClick={handleRedeem}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm transition-transform active:scale-95"
          >
            Échanger {pointsToRedeem} points contre un bon de {pointsToRedeem * 5} FCFA
          </button>
        </div>

        {/* Subscription Passes */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
            Cartes d'Abonnement Annuelles & Forfaits
          </h3>
          <div className="space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-blue-400 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{plan.name}</h4>
                    <span className="text-[11px] text-blue-600 font-semibold">{plan.period}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">{plan.priceXOF.toLocaleString('fr-FR')} F</span>
                    <span className="text-[10px] text-emerald-600 font-bold block">-{plan.discountPct}% sur trajets</span>
                  </div>
                </div>

                <ul className="space-y-1 text-xs text-slate-600">
                  {plan.perks.map((perk, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.name)}
                  className="w-full bg-slate-900 hover:bg-blue-900 text-white font-bold py-2 rounded-lg text-xs shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Souscrire à ce pass</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
