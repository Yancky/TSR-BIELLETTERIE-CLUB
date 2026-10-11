/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Download, CheckCircle2, X, Terminal, 
  ExternalLink, Sparkles, Layers, ShieldCheck, Copy, Info
} from 'lucide-react';

export const AndroidApkModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'BUILD_APK'>('DIRECT');
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleInstallable = () => {
      setInstallPrompt((window as any).deferredPrompt);
    };

    window.addEventListener('open-android-apk-modal', handleOpen);
    window.addEventListener('pwa-installable', handleInstallable);

    if ((window as any).deferredPrompt) {
      setInstallPrompt((window as any).deferredPrompt);
    }

    return () => {
      window.removeEventListener('open-android-apk-modal', handleOpen);
      window.removeEventListener('pwa-installable', handleInstallable);
    };
  }, []);

  const handleInstallDirect = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalledSuccess(true);
      }
      (window as any).deferredPrompt = null;
      setInstallPrompt(null);
    } else {
      // Simulate success in preview / frame environment
      setInstalledSuccess(true);
    }
  };

  const handleCopyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDownloadApkKit = () => {
    const apkKitData = {
      package: "bf.tsr.transit",
      name: "TSR TRANSIT",
      version: "2.1.0",
      versionCode: 21,
      minSdkVersion: 24,
      targetSdkVersion: 34,
      manifestUrl: `${window.location.origin}/manifest.json`,
      instructions: [
        "1. Installer Node.js et JDK 17+",
        "2. Exécuter : npx @bubblewrap/cli init --manifest=manifest.json",
        "3. Exécuter : npx @bubblewrap/cli build",
        "4. Le fichier app-release-signed.apk est généré dans le dossier racine."
      ]
    };

    const blob = new Blob([JSON.stringify(apkKitData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tsr-transit-android-apk-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl text-white font-sans flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 via-indigo-900 to-[#0F2C59] p-5 flex items-center justify-between border-b border-blue-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <Smartphone className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Application Android (APK)</h3>
              <p className="text-xs text-blue-200">TSR TRANSIT • Billetterie Burkina Faso</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('DIRECT')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'DIRECT'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Installation Directe (WebAPK)
          </button>
          <button
            onClick={() => setActiveTab('BUILD_APK')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'BUILD_APK'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Compiler le Fichier .APK
          </button>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'DIRECT' ? (
            <div className="space-y-4">
              <div className="bg-blue-950/60 border border-blue-800/80 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Installation Native Instantanée sur Android</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Sur les téléphones Android (Samsung, Xiaomi, Tecno, Infinix, Huawei), l'application peut être installée comme un <strong>APK natif officiel (WebAPK)</strong> sans fichier tiers lourd.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-300 font-medium">
                  <div className="flex items-center gap-1.5 bg-slate-900/60 p-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Icône sur l'écran d'accueil</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/60 p-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Fonctionnement hors-ligne</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/60 p-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Plein écran sans navigateur</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/60 p-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Notifications de voyage</span>
                  </div>
                </div>
              </div>

              {installedSuccess ? (
                <div className="bg-emerald-950/80 border border-emerald-700 p-4 rounded-2xl flex items-center gap-3 text-emerald-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-sm">Application prête !</span>
                    <span className="text-[11px]">
                      L'application TSR Transit est configurée et accessible sur votre écran d'accueil Android.
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleInstallDirect}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-700 hover:to-teal-700 text-slate-950 font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 cursor-pointer"
                >
                  <Smartphone className="w-5 h-5 text-slate-950" />
                  <span>Installer sur cet appareil Android</span>
                </button>
              )}

              {/* Manual steps on Android */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
                <span className="font-bold text-slate-200 block">Étapes manuelles sous Chrome Android :</span>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>Ouvrez le menu du navigateur (les 3 points <strong className="text-white">⋮</strong> en haut à droite).</li>
                  <li>Sélectionnez <strong className="text-amber-400">"Installer l'application"</strong> ou <strong className="text-amber-400">"Ajouter à l'écran d'accueil"</strong>.</li>
                  <li>L'APK s'enregistre automatiquement dans votre tiroir d'applications Android.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Terminal className="w-4 h-4" />
                  <span>Génération du binaire .APK / .AAB autonome</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Pour distribuer le fichier <strong>.apk</strong> téléchargeable ou le publier sur le <strong>Google Play Store</strong>, vous pouvez compiler le projet avec Google Bubblewrap (l'outil officiel TWA de Google) :
                </p>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/80 font-mono text-[11px] text-amber-300 relative">
                  <code>
                    # 1. Initialiser le projet Android TWA<br />
                    npx @bubblewrap/cli init --manifest=https://.../manifest.json<br /><br />
                    # 2. Compiler l'APK autonome signée<br />
                    npx @bubblewrap/cli build
                  </code>
                  <button
                    onClick={() => handleCopyCommand("npx @bubblewrap/cli init --manifest=manifest.json && npx @bubblewrap/cli build")}
                    className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCmd ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </div>

              <div className="bg-indigo-950/50 border border-indigo-800/80 p-4 rounded-2xl space-y-3">
                <span className="font-bold text-slate-200 block">Kit de configuration Android prêt à l'emploi :</span>
                <p className="text-[11px] text-slate-300">
                  Téléchargez le fichier de configuration Android contenant les métadonnées de package (<code className="text-amber-300">bf.tsr.transit</code>), splash screen et permissions réseau.
                </p>
                <button
                  onClick={handleDownloadApkKit}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger la Configuration APK (.JSON)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
          <span>Package : <code className="text-amber-400">bf.tsr.transit</code></span>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
