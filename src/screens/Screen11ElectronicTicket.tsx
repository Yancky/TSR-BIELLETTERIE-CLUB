/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { appStore } from '../services/store';
import { formatXOF, generateQrDataUrl } from '../services/ticketSecurity';
import { 
  Download, Share2, ShieldCheck, CheckCircle2, 
  MapPin, Clock, Calendar, Bus, User, QrCode, AlertTriangle,
  RotateCw, Smartphone, Sparkles
} from 'lucide-react';

export const Screen11ElectronicTicket: React.FC = () => {
  const state = appStore.getState();
  const ticket = state.currentTicket || state.tickets[0];
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (ticket) {
      generateQrDataUrl(ticket.qrPayload).then(url => setQrDataUrl(url));
    }
  }, [ticket]);

  const replayAnimation = () => {
    setAnimationKey(prev => prev + 1);
  };

  if (!ticket) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-3">
        <p className="text-sm font-bold text-slate-800">Aucun billet trouvé.</p>
        <button
          onClick={() => appStore.navigateTo('05_SEARCH_TRIP')}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
        >
          Réserver un trajet
        </button>
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Billet TSR Transit - ${ticket.ticketNumber}`,
        text: `Billet de car pour ${ticket.passengerName} : ${ticket.departureCity} -> ${ticket.destinationCity} le ${ticket.travelDate}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`Billet TSR Transit : ${ticket.ticketNumber} | Voyageur: ${ticket.passengerName} | ${ticket.departureCity} -> ${ticket.destinationCity}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    window.print();
  };

  const handleTestAgentScan = () => {
    appStore.verifyAndScanTicket(ticket.qrPayload);
    appStore.navigateTo('16_QR_SCANNER');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-100 justify-between space-y-4 overflow-y-auto">
      {/* Ticket Dispenser Slot Indicator */}
      <div className="flex flex-col items-center justify-center pt-1 pb-1">
        <div className="w-36 h-2 bg-slate-300 rounded-full shadow-inner border border-slate-400/40 relative flex items-center justify-center">
          <div className="w-24 h-0.5 bg-slate-400 rounded-full"></div>
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 font-medium">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Émission physique du titre de transport</span>
          <button
            onClick={replayAnimation}
            className="ml-2 text-blue-700 hover:text-blue-900 font-bold flex items-center gap-0.5 underline cursor-pointer"
            title="Rejouer l'animation de sortie du billet"
          >
            <RotateCw className="w-2.5 h-2.5" />
            <span>Rejouer</span>
          </button>
        </div>
      </div>

      {/* Visual Boarding Pass Card with Physical Slide-In Animation */}
      <div 
        key={animationKey}
        className="animate-ticket-slide-in bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden relative transition-transform"
      >
        {/* Ticket Top Header */}
        <div className="bg-[#0F2C59] text-white p-4 space-y-2 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center shadow-xs">
                <img
                  src="/src/assets/images/tsr_transit_badge_1791641501297.jpg"
                  alt="TSR Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-extrabold text-xs tracking-wider block">TSR TRANSIT</span>
                <span className="text-[10px] text-amber-300">Billet Électronique Officiel</span>
              </div>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
              ticket.status === 'VALID'
                ? 'bg-emerald-500 text-white'
                : ticket.status === 'USED'
                ? 'bg-slate-700 text-slate-300'
                : 'bg-red-500 text-white'
            }`}>
              {ticket.status === 'VALID' ? 'VALIDE' : ticket.status === 'USED' ? 'COMPOSTÉ' : 'ANNULÉ'}
            </span>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs">
            <span className="text-blue-200">Réf. Billet :</span>
            <span className="font-mono font-bold text-amber-400 text-sm tracking-wider">
              {ticket.ticketNumber}
            </span>
          </div>
        </div>

        {/* Departure -> Destination Strip */}
        <div className="p-4 bg-blue-50/70 border-b border-dashed border-slate-300 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Départ</span>
            <span className="text-sm font-extrabold text-slate-900">{ticket.departureCity}</span>
            <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
              {ticket.departureAgency}
            </span>
          </div>

          <div className="flex flex-col items-center px-2">
            <Bus className="w-4 h-4 text-blue-700" />
            <div className="w-12 h-0.5 bg-blue-400 my-1" />
            <span className="text-[9px] text-slate-400 font-mono">DIRECT</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Destination</span>
            <span className="text-sm font-extrabold text-slate-900">{ticket.destinationCity}</span>
            <span className="text-[10px] text-slate-500 block">Gare Centrale</span>
          </div>
        </div>

        {/* Passenger & Seats details */}
        <div className="p-4 grid grid-cols-2 gap-3 text-xs border-b border-dashed border-slate-300 relative">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Nom du Passager</span>
            <span className="font-bold text-slate-800">{ticket.passengerName}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Siège(s) Attribué(s)</span>
            <span className="font-extrabold text-blue-900 text-sm font-mono">
              N° {ticket.seatNumbers.join(', ')}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Date du Voyage</span>
            <span className="font-semibold text-slate-800">{ticket.travelDate}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Heure de Départ</span>
            <span className="font-extrabold text-slate-900 font-mono text-sm">
              {ticket.departureTime}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Compagnie Transport</span>
            <span className="font-semibold text-slate-800">{ticket.companyName}</span>
          </div>

          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Montant Réglé</span>
            <span className="font-extrabold text-emerald-800 font-mono">
              {formatXOF(ticket.amountPaidXOF)}
            </span>
          </div>
        </div>

        {/* Realistic Perforation Cutout Notches */}
        <div className="relative w-full h-0 flex items-center">
          <div className="ticket-notch-left -top-3"></div>
          <div className="ticket-notch-right -top-3"></div>
        </div>

        {/* QR Code Section (Detachable Stub Look) */}
        <div className="p-5 flex flex-col items-center justify-center space-y-2 bg-gradient-to-b from-slate-50 to-white">
          <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-200">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code Billet TSR"
                className="w-44 h-44 object-contain"
              />
            ) : (
              <div className="w-44 h-44 flex items-center justify-center text-xs text-slate-400">
                Génération du QR Code...
              </div>
            )}
          </div>

          <div className="text-center space-y-0.5">
            <span className="text-[11px] font-bold text-slate-700 font-mono block">
              Jeton de Sécurité : {ticket.securityToken}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Présentez ce QR Code à l'agent lors de la montée dans le car.
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownload}
            className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-300 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-700" />
            <span>Télécharger (PDF)</span>
          </button>

          <button
            onClick={handleShare}
            className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-300 shadow-sm transition-colors cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-600" />
            <span>{copied ? 'Copié !' : 'Partager'}</span>
          </button>
        </div>

        {/* Shortcut to test scan by Agent */}
        <button
          onClick={handleTestAgentScan}
          className="w-full py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <QrCode className="w-4 h-4 text-amber-400" />
          <span>Simuler le contrôle de ce billet par l'Agent &rarr;</span>
        </button>

        {/* Android App Button */}
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('open-android-apk-modal'));
          }}
          className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-white" />
          <span>Installer l'Application Android (APK / PWA)</span>
        </button>
      </div>
    </div>
  );
};
