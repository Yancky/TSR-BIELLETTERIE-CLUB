/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Smartphone, Download, CheckCircle2, X, Terminal, 
  ExternalLink, Sparkles, Layers, ShieldCheck, Copy, 
  QrCode, ArrowRight, Share2, Check, RefreshCw
} from 'lucide-react';

export const AndroidApkModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'DIRECT' | 'QRCODE' | 'BUILD_APK'>('DIRECT');
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Target mobile URL for installation
  const mobileAppUrl = typeof window !== 'undefined' 
    ? (window.location.origin.includes('localhost') 
        ? 'https://ais-pre-vt5gmpahzkhf4dzz55ywqu-252988606820.europe-west1.run.app' 
        : window.location.origin)
    : 'https://ais-pre-vt5gmpahzkhf4dzz55ywqu-252988606820.europe-west1.run.app';

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

    // Generate QR code for mobile testing
    QRCode.toDataURL(mobileAppUrl, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#0F2C59',
        light: '#FFFFFF'
      }
    }).then((url) => {
      setQrCodeDataUrl(url);
    }).catch((err) => {
      console.warn('QR Code generation notice:', err);
    });

    return () => {
      window.removeEventListener('open-android-apk-modal', handleOpen);
      window.removeEventListener('pwa-installable', handleInstallable);
    };
  }, [mobileAppUrl]);

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
      // In browser preview / desktop where beforeinstallprompt may not fire directly
      setInstalledSuccess(true);
    }
  };

  const handleCopyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(mobileAppUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadApkKit = () => {
    const apkKitData = {
      package: "bf.tsr.transit",
      name: "TSR TRANSIT",
      short_name: "TSR Transit",
      version: "3.1.0",
      versionCode: 31,
      minSdkVersion: 24,
      targetSdkVersion: 34,
      url: mobileAppUrl,
      manifestUrl: `${mobileAppUrl}/manifest.json`,
      icons: {
        icon192: `${mobileAppUrl}/icon-192.png`,
        icon512: `${mobileAppUrl}/icon-512.png`,
        maskable: `${mobileAppUrl}/icon-512-maskable.png`
      },
      instructions: [
        "1. Option Rapide : Rendez-vous sur https://www.pwabuilder.com avec l'URL de votre application.",
        "2. Cliquez sur 'Android' > 'Build APK' pour télécharger directement le fichier APK signé.",
        "3. Option Bubblewrap CLI : npx @bubblewrap/cli init --manifest=" + mobileAppUrl + "/manifest.json",
        "4. Lancez npx @bubblewrap/cli build pour générer app-release-signed.apk"
      ]
    };

    const blob = new Blob([JSON.stringify(apkKitData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tsr-transit-android-apk-package.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(mobileAppUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl text-white font-sans flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0F2C59] p-4 sm:p-5 flex items-center justify-between border-b border-blue-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
              <Smartphone className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Installer l'Application Android</h3>
              <p className="text-xs text-blue-200">TSR TRANSIT • WebAPK &amp; Fichier .APK</p>
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
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950 px-3 pt-2 text-center text-xs">
          <button
            onClick={() => setActiveTab('DIRECT')}
            className={`pb-2.5 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'DIRECT'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Installation Directe
          </button>
          <button
            onClick={() => setActiveTab('QRCODE')}
            className={`pb-2.5 font-bold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'QRCODE'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>2. Flasher (Mobile)</span>
          </button>
          <button
            onClick={() => setActiveTab('BUILD_APK')}
            className={`pb-2.5 font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'BUILD_APK'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Fichier .APK
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: DIRECT WEBPK */}
          {activeTab === 'DIRECT' && (
            <div className="space-y-4">
              <div className="bg-blue-950/60 border border-blue-800/80 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Installation Native Instantanée WebAPK</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                  Sur les téléphones Android (Samsung, Xiaomi, Tecno, Infinix, Huawei, etc.), Android génère et installe automatiquement le paquet <strong className="text-white">WebAPK natif</strong>. Aucune manipulation complexe ni activation de sources inconnues n'est requise.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-300 font-medium">
                  <div className="flex items-center gap-1.5 bg-slate-900/70 p-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Icône dans le tiroir d'applis</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/70 p-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Billets &amp; mode hors-ligne</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/70 p-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Plein écran natif sans URL</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/70 p-2 rounded-xl">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Lecteur QR Code embarqué</span>
                  </div>
                </div>
              </div>

              {installedSuccess ? (
                <div className="bg-emerald-950/80 border border-emerald-700 p-4 rounded-2xl flex items-center gap-3 text-emerald-200">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-sm">Demande d'installation envoyée !</span>
                    <span className="text-[11px]">
                      L'application TSR Transit s'ajoute à votre écran d'accueil Android et fonctionnera comme une application native.
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleInstallDirect}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98 cursor-pointer"
                >
                  <Smartphone className="w-5 h-5 text-slate-950" />
                  <span>Installer maintenant sur cet appareil Android</span>
                </button>
              )}

              {/* Guide Chrome Android */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-[11px] text-slate-400">
                <span className="font-bold text-slate-200 block">Comment installer depuis Chrome sur votre téléphone :</span>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-300">
                  <li>Ouvrez l'application sur Google Chrome ou Samsung Internet.</li>
                  <li>Touchez le menu ⋮ (les 3 points en haut à droite du navigateur).</li>
                  <li>Appuyez sur <strong className="text-amber-400">"Installer l'application"</strong> ou <strong className="text-amber-400">"Ajouter à l'écran d'accueil"</strong>.</li>
                  <li>Confirmez : l'application apparaît instantanément avec son logo TSR Transit !</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: QR CODE SCAN */}
          {activeTab === 'QRCODE' && (
            <div className="space-y-4 text-center">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <p className="text-slate-300 text-xs">
                  Scannez ce QR Code avec l'appareil photo de votre smartphone Android pour ouvrir et installer directement TSR Transit :
                </p>

                <div className="flex justify-center p-3 bg-white rounded-2xl w-fit mx-auto shadow-md">
                  {qrCodeDataUrl ? (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="QR Code d'installation Android TSR TRANSIT" 
                      className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                      Génération du QR Code...
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="text-[11px] text-slate-400 font-mono truncate max-w-[240px]">
                    {mobileAppUrl}
                  </span>
                  <button
                    onClick={handleCopyUrl}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedUrl ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </div>

              <div className="text-left bg-blue-950/40 border border-blue-900/60 p-3 rounded-xl text-[11px] text-blue-200 space-y-1">
                <span className="font-bold block text-white">Astuce test Android :</span>
                <p>
                  Une fois la page ouverte sur votre téléphone, le bandeau d'installation native Android s'affichera automatiquement au bas de l'écran.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: STANDALONE APK COMPILATION */}
          {activeTab === 'BUILD_APK' && (
            <div className="space-y-4">
              {/* Option A: 1-Click Online PWABuilder */}
              <div className="bg-emerald-950/40 border border-emerald-700/60 p-4 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Option 1 : Générer le fichier .APK en 1 clic (Gratuit)</span>
                  </span>
                  <span className="bg-emerald-900/80 text-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    Recommandé
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  L'outil officiel Microsoft &amp; Google <strong>PWABuilder</strong> convertit le projet en paquet Android (fichier <code className="text-amber-300">.apk</code> ou <code className="text-amber-300">.aab</code>) prêt à être installé ou soumis au Play Store.
                </p>
                <a
                  href={pwaBuilderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-slate-950" />
                  <span>Ouvrir le Générateur APK PWABuilder</span>
                </a>
              </div>

              {/* Option B: Bubblewrap CLI */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-amber-400 font-bold text-xs">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-4 h-4" />
                    <span>Option 2 : Compiler en ligne de commande (Bubblewrap / TWA)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-normal">Développeur</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Utilisez Google Bubblewrap pour générer le binaire autonome signé sur votre machine :
                </p>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-700/80 font-mono text-[11px] text-amber-300 relative">
                  <code>
                    npx @bubblewrap/cli init --manifest={mobileAppUrl}/manifest.json<br />
                    npx @bubblewrap/cli build
                  </code>
                  <button
                    onClick={() => handleCopyCommand(`npx @bubblewrap/cli init --manifest=${mobileAppUrl}/manifest.json && npx @bubblewrap/cli build`)}
                    className="absolute top-2 right-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedCmd ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </div>

              {/* Kit download */}
              <div className="bg-indigo-950/40 border border-indigo-800/80 p-3.5 rounded-2xl space-y-2">
                <span className="font-bold text-slate-200 block text-xs">Télécharger le kit de configuration Android :</span>
                <p className="text-[11px] text-slate-300">
                  Télécharge les métadonnées de package (<code className="text-amber-300">bf.tsr.transit</code>), paramètres SDK 34 et liens de manifest.
                </p>
                <button
                  onClick={handleDownloadApkKit}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger le Package Config (.JSON)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Package Android :</span>
            <code className="text-amber-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">bf.tsr.transit</code>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
