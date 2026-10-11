import React, { useEffect, useState } from 'react';
import { appStore } from '../services/store';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const Screen01Splash: React.FC = () => {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Vérification de la session...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(55);
      setStatusText('Chargement des gares et départs...');
    }, 600);

    const timer2 = setTimeout(() => {
      setProgress(100);
      setStatusText('Prêt ! Redirection...');
    }, 1300);

    const timer3 = setTimeout(() => {
      appStore.navigateTo('02_PUBLIC_HOME');
    }, 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="flex-1 bg-gradient-to-b from-[#0F2C59] via-[#0D2447] to-[#0A192F] text-white flex flex-col items-center justify-between p-8 text-center min-h-[640px]">
      <div className="w-full flex justify-end">
        <span className="text-[11px] font-mono text-blue-300 bg-white/10 px-2.5 py-1 rounded-full">
          V1.0 • Burkina Faso
        </span>
      </div>

      {/* Main Logo & Identity */}
      <div className="flex flex-col items-center space-y-6 my-auto">
        <div className="relative">
          <div className="w-28 h-28 rounded-2xl bg-white p-3 shadow-2xl flex items-center justify-center ring-4 ring-blue-400/30">
            <img
              src="/src/assets/images/tsr_transit_badge_1791641501297.jpg"
              alt="Logo TSR TRANSIT"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-900 rounded-full p-1.5 shadow-md">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-extrabold tracking-wider text-white">
            TSR <span className="text-amber-400">TRANSIT</span>
          </h1>
          <p className="text-sm text-blue-200 mt-2 max-w-xs italic font-medium">
            « Voyagez simplement, voyagez en sécurité. »
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-blue-300/80">
          <span>Ouagadougou</span>
          <span>•</span>
          <span>Bobo-Dioulasso</span>
          <span>•</span>
          <span>Toutes Gares BF</span>
        </div>
      </div>

      {/* Loading Progress & Session Check */}
      <div className="w-full max-w-xs space-y-3 pb-6">
        <div className="w-full bg-blue-950 rounded-full h-2 overflow-hidden p-0.5 border border-blue-800">
          <div
            className="bg-gradient-to-r from-blue-400 to-amber-400 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-blue-200 font-medium animate-pulse">
          {statusText}
        </p>

        <button
          onClick={() => appStore.navigateTo('02_PUBLIC_HOME')}
          className="text-xs text-blue-300 hover:text-white underline pt-2"
        >
          Passer l'introduction &rarr;
        </button>
      </div>
    </div>
  );
};
