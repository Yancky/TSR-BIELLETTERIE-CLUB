import React, { useEffect, useState } from 'react';
import { appStore } from '../services/store';
import { generateQrDataUrl } from '../services/ticketSecurity';
import { 
  WifiOff, Wifi, QrCode, AlertCircle, RefreshCw, 
  ShieldAlert, CheckCircle2, Ticket 
} from 'lucide-react';

export const Screen22OfflineMode: React.FC = () => {
  const state = appStore.getState();
  const ticket = state.tickets[0];
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (ticket) {
      generateQrDataUrl(ticket.qrPayload).then(url => setQrUrl(url));
    }
  }, [ticket]);

  const handleReconnect = () => {
    if (state.isOffline) {
      appStore.toggleOfflineMode();
    }
    appStore.navigateTo('02_PUBLIC_HOME');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 justify-between space-y-4">
      <div className="space-y-4">
        {/* Offline Warning Banner */}
        <div className="bg-amber-600 text-white p-4 rounded-3xl shadow-sm space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <WifiOff className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm">Mode Hors Connexion Actif</h2>
              <span className="text-[10px] text-amber-100">
                Réseau mobile ou Wi-Fi indisponible
              </span>
            </div>
          </div>
          <p className="text-[11px] text-amber-100 leading-relaxed pt-1">
            Les fonctionnalités nécessitant les serveurs bancaires (Paiement Mobile Money, nouvelles réservations en direct) sont temporairement suspendues.
          </p>
        </div>

        {/* Offline Authorized Features */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="font-bold text-slate-800 uppercase text-[11px] flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-blue-600" />
              <span>Dernier Billet Enregistré en Cache</span>
            </span>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Disponible Hors Ligne
            </span>
          </div>

          {ticket ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block text-xs">
                    {ticket.departureCity} &rarr; {ticket.destinationCity}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {ticket.travelDate} à {ticket.departureTime}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-blue-900 block">
                    N° {ticket.ticketNumber}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Siège {ticket.seatNumbers.join(', ')}
                  </span>
                </div>
              </div>

              {/* Offline QR Preview */}
              <div className="p-3 bg-slate-50 rounded-xl flex flex-col items-center justify-center space-y-2 border border-slate-200">
                {qrUrl && (
                  <img
                    src={qrUrl}
                    alt="QR Code Offline"
                    className="w-36 h-36 object-contain bg-white p-2 rounded-lg"
                  />
                )}
                <span className="text-[10px] text-slate-500 text-center font-mono">
                  Jeton cryptographique sauvegardé : {ticket.securityToken}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-center py-4">
              Aucun billet sauvegardé dans le cache local.
            </div>
          )}
        </div>

        {/* Security Rule Notice */}
        <div className="p-3 bg-slate-100 border border-slate-300 rounded-2xl text-xs text-slate-700 space-y-1">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Règle de sécurité stricte :</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Conformément aux normes TSR TRANSIT, aucun débit ni compostage irréversible ne peut être simulé sans validation en temps réel avec les serveurs centraux.
          </p>
        </div>
      </div>

      {/* Reconnect Action Button */}
      <button
        onClick={handleReconnect}
        className="w-full py-3 bg-[#0F2C59] hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
      >
        <Wifi className="w-4 h-4 text-amber-400" />
        <span>Rétablir la connexion &amp; Synchroniser</span>
      </button>
    </div>
  );
};
