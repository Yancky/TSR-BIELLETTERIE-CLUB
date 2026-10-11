import React from 'react';
import { Wifi, Battery, Signal, ArrowLeft, Bell } from 'lucide-react';
import { appStore } from '../services/store';

interface MobileFrameWrapperProps {
  children: React.ReactNode;
  isMobileFrame: boolean;
  screenTitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  showBell?: boolean;
}

export const MobileFrameWrapper: React.FC<MobileFrameWrapperProps> = ({
  children,
  isMobileFrame,
  screenTitle,
  showBack = false,
  onBack,
  showBell = true
}) => {
  const currentTime = '06:30'; // Africa/Ouagadougou time typical morning departure

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      appStore.goBack();
    }
  };

  const handleOpenNotifications = () => {
    appStore.navigateTo('20_NOTIFICATIONS');
  };

  if (!isMobileFrame) {
    // Full width web experience
    return (
      <div className="pt-14 min-h-screen bg-slate-100 flex flex-col items-center">
        <div className="w-full max-w-4xl min-h-[calc(100vh-3.5rem)] bg-white shadow-md flex flex-col">
          {screenTitle && (
            <div className="bg-[#0F2C59] text-white px-6 py-3.5 flex items-center justify-between border-b border-blue-900 sticky top-12 z-30">
              <div className="flex items-center gap-3">
                {showBack && (
                  <button
                    onClick={handleBack}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                    title="Retour"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                )}
                <h1 className="font-bold text-lg tracking-wide">{screenTitle}</h1>
              </div>
              {showBell && (
                <button
                  onClick={handleOpenNotifications}
                  className="p-1.5 hover:bg-white/10 rounded-full relative transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 text-white" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-[#0F2C59]" />
                </button>
              )}
            </div>
          )}
          <div className="flex-1 flex flex-col">{children}</div>
        </div>
      </div>
    );
  }

  // Realistic Android Phone Mockup
  return (
    <div className="pt-14 pb-8 min-h-screen bg-slate-900/90 flex flex-col items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-[410px] bg-black rounded-[42px] p-3 shadow-2xl border-4 border-slate-700 ring-1 ring-slate-800">
        {/* Device speaker & camera hole punch */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-40 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800 mr-2" />
          <div className="w-10 h-1 rounded-full bg-slate-800" />
        </div>

        {/* Screen inner area */}
        <div className="w-full bg-white rounded-[32px] overflow-hidden flex flex-col min-h-[780px] max-h-[85vh] relative shadow-inner">
          {/* Android Status Bar */}
          <div className="bg-[#0F2C59] text-white px-6 pt-3 pb-1 flex items-center justify-between text-[11px] font-medium tracking-tight select-none shrink-0 z-30">
            <span>{currentTime}</span>
            <div className="flex items-center gap-2">
              <Signal className="w-3 h-3" />
              <span className="text-[10px]">4G</span>
              <Wifi className="w-3 h-3" />
              <div className="flex items-center gap-0.5">
                <span className="text-[10px]">85%</span>
                <Battery className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Optional Screen Header */}
          {screenTitle && (
            <div className="bg-[#0F2C59] text-white px-4 py-2.5 flex items-center justify-between border-b border-blue-950 shrink-0 z-20">
              <div className="flex items-center gap-2.5">
                {showBack && (
                  <button
                    onClick={handleBack}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors active:scale-95"
                    title="Retour"
                  >
                    <ArrowLeft className="w-4 h-4 text-white" />
                  </button>
                )}
                <h1 className="font-bold text-sm truncate max-w-[240px]">{screenTitle}</h1>
              </div>
              {showBell && (
                <button
                  onClick={handleOpenNotifications}
                  className="p-1 hover:bg-white/10 rounded-full relative transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 text-white" />
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-amber-400 rounded-full ring-2 ring-[#0F2C59]" />
                </button>
              )}
            </div>
          )}

          {/* Screen Content Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50">
            {children}
          </div>

          {/* Android Bottom Navigation Pill */}
          <div className="h-5 bg-white flex items-center justify-center shrink-0 border-t border-slate-100">
            <div className="w-28 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
