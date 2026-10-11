import React, { useState } from 'react';
import { appStore } from '../services/store';
import { 
  QrCode, Camera, CheckCircle2, AlertTriangle, 
  XCircle, ShieldCheck, User, Bus, RefreshCw, Smartphone 
} from 'lucide-react';

export const Screen16QRScanner: React.FC = () => {
  const state = appStore.getState();
  const [manualCode, setManualCode] = useState('');
  const [scanResult, setScanResult] = useState(state.lastScanResult);
  const [isScanning, setIsScanning] = useState(false);

  const tickets = state.tickets;
  const currentTicket = tickets[0];

  const handleScanCode = (code: string) => {
    setIsScanning(true);
    setTimeout(() => {
      const res = appStore.verifyAndScanTicket(code);
      setScanResult(res);
      setIsScanning(false);
    }, 600);
  };

  const handleTestValidScan = () => {
    if (currentTicket) {
      handleScanCode(currentTicket.ticketNumber);
    }
  };

  const handleTestFakeScan = () => {
    handleScanCode('TSR-FAKE-9999-INVALIDE');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-900 text-white justify-between space-y-4">
      {/* Top Agent Bar */}
      <div className="bg-slate-800 p-3 rounded-2xl flex items-center justify-between border border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs">
            <QrCode className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-xs block">Contrôle Embarquement TSR</span>
            <span className="text-[10px] text-slate-400 font-mono">Agent: Quai 1 • Ouaga Gounghin</span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
          En Ligne
        </span>
      </div>

      {/* Visual Scanner Camera Viewport */}
      <div className="relative bg-black rounded-3xl overflow-hidden border-2 border-slate-700 flex flex-col items-center justify-center min-h-[260px] p-4">
        {/* Aim Target Corners */}
        <div className="relative w-52 h-52 border-2 border-blue-500/40 rounded-2xl flex items-center justify-center">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1 rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1 rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1 rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1 rounded-br-lg" />

          {/* Animated Laser Beam */}
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_8px_#f59e0b]" />

          <div className="text-center space-y-1 select-none pointer-events-none">
            <Camera className="w-8 h-8 text-slate-500 mx-auto opacity-40" />
            <span className="text-[10px] text-slate-400 block font-medium">
              Centrez le QR Code du billet
            </span>
          </div>
        </div>

        {isScanning && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-xs text-amber-400 font-bold gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Vérification atomique en cours...</span>
          </div>
        )}
      </div>

      {/* Scan Result Feedback Banner */}
      {scanResult && (
        <div
          className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
            scanResult.status === 'VALID'
              ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
              : scanResult.status === 'USED'
              ? 'bg-red-950/80 border-red-600 text-red-200'
              : 'bg-amber-950/80 border-amber-600 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-sm">
            {scanResult.status === 'VALID' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300">EMBARQUEMENT AUTORISÉ</span>
              </>
            ) : scanResult.status === 'USED' ? (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-300">ALERTE : BILLET DÉJÀ COMPOSTÉ</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span className="text-amber-300">BILLET INVALIDE OU NON RECONNU</span>
              </>
            )}
          </div>

          <p className="text-[11px] leading-relaxed">{scanResult.message}</p>

          {scanResult.ticket && (
            <div className="bg-black/40 p-2.5 rounded-xl space-y-1 font-mono text-[11px] border border-white/10">
              <div className="flex justify-between">
                <span className="text-slate-400">Voyageur :</span>
                <span className="text-white font-bold">{scanResult.ticket.passengerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sièges :</span>
                <span className="text-amber-400 font-bold">N° {scanResult.ticket.seatNumbers.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Trajet :</span>
                <span className="text-white">
                  {scanResult.ticket.departureCity} &rarr; {scanResult.ticket.destinationCity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Composté à :</span>
                <span className="text-slate-300">{scanResult.ticket.validatedAt || 'À l\'instant'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fast Test Scans for Evaluation */}
      <div className="bg-slate-800 p-3 rounded-2xl border border-slate-700 space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Tester le contrôle des billets :
        </span>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handleTestValidScan}
            className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Scanner Billet Valide</span>
          </button>

          <button
            onClick={handleTestValidScan}
            className="py-2.5 px-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            title="Re-scanner pour tester l'interdiction de double validation"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Re-scanner (Test Double)</span>
          </button>
        </div>

        <button
          onClick={handleTestFakeScan}
          className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-[11px] font-medium transition-colors"
        >
          Tester un faux QR Code non homologué
        </button>
      </div>
    </div>
  );
};
