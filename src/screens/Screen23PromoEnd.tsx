import React from 'react';
import { appStore } from '../services/store';
import { 
  Bus, Search, Home, ShieldCheck, Heart, 
  MapPin, CheckCircle2, ArrowRight, Sparkles 
} from 'lucide-react';

export const Screen23PromoEnd: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col p-5 bg-gradient-to-b from-white via-slate-50 to-blue-50/60 justify-between text-center space-y-4">
      <div className="space-y-4 my-auto">
        {/* High-fidelity Photo Asset: TSR Modern VIP Coach Banner */}
        <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200">
          <img
            src="/src/assets/images/screen23_banner.jpg"
            onError={(e) => {
              // fallback if needed
              (e.currentTarget as HTMLImageElement).src = '/src/assets/images/screen23_promo_banner_1791712682625.jpg';
            }}
            alt="Bannière Officielle TSR TRANSIT Autocar VIP Burkina Faso"
            className="w-full h-52 object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent flex flex-col justify-end p-4 text-left text-white">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Flotte Moderne Interurbaine • TSR TRANSIT
            </span>
            <h3 className="font-extrabold text-sm sm:text-base leading-tight text-white drop-shadow-sm">
              L'excellence du voyage interurbain au Burkina Faso
            </h3>
          </div>
        </div>

        {/* Brand identity & Motto */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>TSR TRANSIT • Partenaire Officiel</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            « Voyagez simplement, voyagez en sécurité. »
          </h2>
          <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
            Merci de faire confiance à la plateforme de référence pour vos trajets à travers les 13 régions du Burkina Faso.
          </p>
        </div>

        {/* Key value pillars */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <ShieldCheck className="w-5 h-5 text-blue-600 mx-auto" />
            <span className="font-bold text-[11px] text-slate-800 block">100% Sécurisé</span>
            <span className="text-[9px] text-slate-400">QR Code certifié</span>
          </div>

          <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <Bus className="w-5 h-5 text-amber-500 mx-auto" />
            <span className="font-bold text-[11px] text-slate-800 block">Cars VIP Climat</span>
            <span className="text-[9px] text-slate-400">Confort garanti</span>
          </div>

          <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <Heart className="w-5 h-5 text-emerald-600 mx-auto" />
            <span className="font-bold text-[11px] text-slate-800 block">Assistance 24/7</span>
            <span className="text-[9px] text-slate-400">+226 25 36 20 20</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          onClick={() => appStore.navigateTo('05_SEARCH_TRIP')}
          className="w-full py-3.5 bg-[#0F2C59] hover:bg-blue-900 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
        >
          <Search className="w-4 h-4 text-amber-400" />
          <span>Planifier un nouveau trajet</span>
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>

        <button
          onClick={() => appStore.navigateTo('02_PUBLIC_HOME')}
          className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-300 transition-colors flex items-center justify-center gap-1.5"
        >
          <Home className="w-4 h-4 text-slate-500" />
          <span>Retour à l'accueil public</span>
        </button>
      </div>
    </div>
  );
};
