import React, { useState } from 'react';
import { appStore } from '../services/store';
import { PaymentMethod } from '../types';
import { formatXOF } from '../services/ticketSecurity';
import { 
  ShieldCheck, Smartphone, Check, ArrowRight, 
  AlertCircle, Lock, Bus, ArrowLeft 
} from 'lucide-react';

export const Screen09PaymentMobileMoney: React.FC = () => {
  const state = appStore.getState();
  const booking = state.currentBooking;
  const trip = state.selectedTrip || state.trips[0];
  const user = state.currentUser;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ORANGE_MONEY');
  const [payerPhone, setPayerPhone] = useState(user?.phone || '+226 70 12 34 56');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!booking) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500" />
        <p className="text-sm font-bold text-slate-800">Aucune réservation en cours.</p>
        <button
          onClick={() => appStore.navigateTo('05_SEARCH_TRIP')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          Rechercher un voyage
        </button>
      </div>
    );
  }

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!payerPhone || payerPhone.replace(/[^0-9]/g, '').length < 8) {
      setErrorMsg('Veuillez entrer un numéro de téléphone mobile money burkinabè valide.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      try {
        appStore.confirmPaymentAndGenerateTicket(paymentMethod, payerPhone);
        setIsProcessing(false);
        appStore.navigateTo('10_PAYMENT_CONFIRMATION');
      } catch (err: any) {
        setIsProcessing(false);
        setErrorMsg(err.message || 'Erreur lors du traitement du paiement.');
      }
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 justify-between space-y-4">
      <div className="space-y-4">
        {/* Order Summary Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Récapitulatif de Réservation
            </span>
            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
              {booking.bookingRef}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Trajet :</span>
              <span className="font-bold text-slate-800">
                {trip.departureCity} &rarr; {trip.destinationCity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date &amp; Heure :</span>
              <span className="font-semibold text-slate-800">
                {trip.date} à {trip.departureTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Siège(s) réservé(s) :</span>
              <span className="font-bold text-blue-900 font-mono">
                N° {(booking.seatIds || booking.selectedSeats || []).join(', ')} ({(booking.seatIds || booking.selectedSeats || []).length} place(s))
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Voyageur :</span>
              <span className="font-semibold text-slate-800">{booking.passengerName}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Montant total net :</span>
            <span className="text-lg font-extrabold text-[#0F2C59] font-mono">
              {formatXOF(booking.totalPriceXof || booking.totalAmountXOF || 0)}
            </span>
          </div>
        </div>

        {/* Mobile Money Provider Chooser */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
            Sélectionnez votre moyen de paiement Mobile Money
          </label>

          <div className="grid grid-cols-3 gap-2">
            {/* Orange Money */}
            <button
              type="button"
              onClick={() => setPaymentMethod('ORANGE_MONEY')}
              className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
                paymentMethod === 'ORANGE_MONEY'
                  ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-400 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-orange-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-orange-500">
                <img
                  src="/src/assets/images/orange_money.png"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/src/assets/images/orange_money_logo_1791712697677.jpg';
                  }}
                  alt="Logo Orange Money Burkina Faso"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Orange Money</span>
              <span className="text-[9px] text-orange-600 font-semibold">*144# BF</span>
            </button>

            {/* Moov Money */}
            <button
              type="button"
              onClick={() => setPaymentMethod('MOOV_MONEY')}
              className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
                paymentMethod === 'MOOV_MONEY'
                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm flex items-center justify-center bg-blue-700">
                <img
                  src="/src/assets/images/moov_money.png"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/src/assets/images/moov_money_logo_1791712713926.jpg';
                  }}
                  alt="Logo Moov Money Africa Burkina Faso"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[11px] font-bold text-slate-800">Moov Money</span>
              <span className="text-[9px] text-blue-700 font-semibold">*555# Flooz</span>
            </button>

            {/* Wave */}
            <button
              type="button"
              onClick={() => setPaymentMethod('WAVE')}
              className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
                paymentMethod === 'WAVE'
                  ? 'border-cyan-500 bg-cyan-50 ring-2 ring-cyan-400 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-cyan-300'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#1DC3EF] text-white flex items-center justify-center font-black text-xs shadow-sm">
                <span className="tracking-tighter">wave</span>
              </div>
              <span className="text-[11px] font-bold text-slate-800">Wave BF</span>
              <span className="text-[9px] text-cyan-700 font-semibold">Instantané</span>
            </button>
          </div>

          {/* Phone input */}
          <form onSubmit={handlePay} className="space-y-3 pt-2">
            {errorMsg && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Numéro de compte débité ({paymentMethod === 'ORANGE_MONEY' ? 'Orange' : paymentMethod === 'MOOV_MONEY' ? 'Moov' : 'Wave'})
              </label>
              <div className="relative">
                <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={payerPhone}
                  onChange={e => setPayerPhone(e.target.value)}
                  placeholder="+226 70 00 00 00"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                Un message de confirmation USSD / Push s'affichera sur votre téléphone.
              </span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] mt-2"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validation bancaire en cours...</span>
                </span>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-white" />
                  <span>Confirmer &amp; Payer {formatXOF(booking.totalPriceXof || booking.totalAmountXOF || 0)}</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pb-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Paiement crypté 256-bit certifié BCEAO</span>
      </div>
    </div>
  );
};
