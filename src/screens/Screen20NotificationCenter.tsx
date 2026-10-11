import React, { useState } from 'react';
import { appStore } from '../services/store';
import { AppNotification } from '../types';
import { 
  Bell, CheckCircle2, AlertTriangle, Bus, 
  Info, Check, Trash2, Clock 
} from 'lucide-react';

export const Screen20NotificationCenter: React.FC = () => {
  const state = appStore.getState();
  const [notifications, setNotifications] = useState(state.notifications);

  const handleMarkAsRead = (id: string) => {
    appStore.markNotificationAsRead(id);
    setNotifications([...appStore.getState().notifications]);
  };

  const handleMarkAllRead = () => {
    appStore.markAllNotificationsAsRead();
    setNotifications([...appStore.getState().notifications]);
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Centre de Notifications</h2>
          <span className="text-[11px] text-slate-500">
            {notifications.filter(n => !n.read).length} non lues
          </span>
        </div>

        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Tout marquer comme lu</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-2.5 flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center space-y-2 border border-slate-200 my-auto">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="font-bold text-xs text-slate-700">Aucune notification</h3>
            <p className="text-[11px] text-slate-400">
              Vous recevrez ici vos confirmations de réservation et rappels de départ.
            </p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleMarkAsRead(n.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                n.read
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-blue-50/70 border-blue-300 text-blue-950 font-medium shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      n.type === 'BOOKING'
                        ? 'bg-emerald-100 text-emerald-700'
                        : n.type === 'TRIP'
                        ? 'bg-blue-100 text-blue-700'
                        : n.type === 'ALERT'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {n.type === 'BOOKING' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : n.type === 'TRIP' ? (
                      <Bus className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>
                  <span className="font-bold text-xs">{n.title}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">{n.timestamp}</span>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 ring-2 ring-blue-100" />
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-600 pl-9 leading-relaxed">{n.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
