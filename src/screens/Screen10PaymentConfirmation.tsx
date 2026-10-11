import React, { useEffect } from 'react';
import { appStore } from '../services/store';
import { formatXOF } from '../services/ticketSecurity';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, QrCode, ArrowRight, ShieldCheck, 
  Download, Home, Calendar, MapPin, Receipt 
} from 'lucide-react';

export const Screen10PaymentConfirmation: React.FC = () => {
  const state = appStore.getState();
  const ticket = state.currentTicket || state.tickets[0];
  const lastPayment = state.payments[state.payments.length - 1];

  useEffect(() => {
    // Fire celebratory confetti on mount
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignored if canvas not available
    }
  }, []);

  const handleViewTicket = () => {
    appStore.navigateTo('11_ELECTRONIC_TICKET');
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-slate-50 justify-between text-center space-y-6">
      <div className="space-y-5 my-auto">
        {/* Animated Green Badge */}
        <div className="relative mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-md">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
          <div className="absolute inset-0 rounded-full ring-4 ring-emerald-300/40 animate-ping" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-900">
            Paiement Confirmé avec Succès !
          </h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Votre transaction Mobile Money a été approuvée et vos places sont réservées.
          </p>
        </div>

        {/* Transaction Receipt Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-left space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-500 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-600" />
              <span>Récépissé Numérique</span>
            </span>
            <span className="font-bold text-emerald-600 uppercase text-[10px] bg-emerald-50 px-2 py-0.5 rounded">
              Validé
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Montant Débité :</span>
            <span className="font-extrabold text-slate-900 font-mono text-sm">
              {formatXOF(ticket?.amountPaidXOF || 9000)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Réf. Transaction :</span>
            <span className="font-mono text-slate-700 font-semibold">
              {lastPayment?.externalRef || 'OM-BF-8821901'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Billet TSR N° :</span>
            <span className="font-mono text-blue-800 font-bold">
              {ticket?.ticketNumber || 'TSR-BF-2026-8819'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Voyageur :</span>
            <span className="font-semibold text-slate-800">
              {ticket?.passengerName || 'Aminata Ouédraogo'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Trajet :</span>
            <span className="font-bold text-slate-900">
              {ticket?.departureCity} &rarr; {ticket?.destinationCity}
            </span>
          </div>
        </div>

        {/* QR Ticket Teaser */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-left">
          <div className="p-2 bg-white rounded-lg shadow-sm text-blue-900">
            <QrCode className="w-6 h-6" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-blue-900 block">Billet Électronique Généré</span>
            <span className="text-[11px] text-blue-700">
              Votre QR Code d'embarquement est prêt à être contrôlé par l'agent.
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={handleViewTicket}
          className="w-full py-3.5 bg-[#0F2C59] hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
        >
          <QrCode className="w-4 h-4 text-amber-400" />
          <span>Afficher mon Billet Électronique QR</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={() => appStore.navigateTo('02_PUBLIC_HOME')}
          className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-200 transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};
