import React, { useState } from 'react';
import { appStore } from '../services/store';
import { ElectronicTicket } from '../types';
import { formatXOF } from '../services/ticketSecurity';
import { 
  Bus, QrCode, Clock, Calendar, CheckCircle2, 
  ChevronRight, Filter, AlertCircle 
} from 'lucide-react';

export const Screen12TravelHistory: React.FC = () => {
  const state = appStore.getState();
  const [activeTab, setActiveTab] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');

  const tickets = state.tickets;

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'UPCOMING') return t.status === 'VALID';
    if (activeTab === 'PAST') return t.status === 'USED' || t.status === 'CANCELLED';
    return true;
  });

  const handleOpenTicket = (ticket: ElectronicTicket) => {
    state.currentTicket = ticket;
    appStore.navigateTo('11_ELECTRONIC_TICKET');
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 space-y-3">
      {/* Tab Filter */}
      <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'ALL'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tous ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'UPCOMING'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          À venir ({tickets.filter(t => t.status === 'VALID').length})
        </button>
        <button
          onClick={() => setActiveTab('PAST')}
          className={`flex-1 py-1.5 rounded-lg transition-all ${
            activeTab === 'PAST'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Passés ({tickets.filter(t => t.status !== 'VALID').length})
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {filteredTickets.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl text-center space-y-3 border border-slate-200 my-auto">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full mx-auto flex items-center justify-center">
              <Bus className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">Aucun voyage dans cette catégorie</h3>
            <p className="text-xs text-slate-500">
              Réservez votre premier trajet en car au Burkina Faso dès maintenant.
            </p>
            <button
              onClick={() => appStore.navigateTo('05_SEARCH_TRIP')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Réserver un billet
            </button>
          </div>
        ) : (
          filteredTickets.map(ticket => {
            const isValid = ticket.status === 'VALID';
            return (
              <div
                key={ticket.id}
                onClick={() => handleOpenTicket(ticket)}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-sm cursor-pointer transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      {ticket.companyName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{ticket.ticketNumber}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isValid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isValid ? 'À VENIR' : ticket.status === 'USED' ? 'UTILISÉ' : 'ANNULÉ'}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{ticket.departureCity}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {ticket.departureTime}
                    </span>
                  </div>

                  <div className="text-slate-400">&rarr;</div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{ticket.destinationCity}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{ticket.travelDate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="text-slate-500 text-[11px]">
                    <span>Siège(s) : </span>
                    <span className="font-mono font-bold text-blue-900">
                      N° {ticket.seatNumbers.join(', ')}
                    </span>
                    <span className="mx-1">•</span>
                    <span className="font-mono text-slate-700 font-semibold">
                      {formatXOF(ticket.amountPaidXOF)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-blue-600 font-bold text-xs">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Voir le billet</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
