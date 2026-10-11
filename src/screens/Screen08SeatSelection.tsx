/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { appStore } from '../services/store';
import { formatXOF } from '../services/ticketSecurity';
import { SeatAvailabilityService } from '../services/seatAvailabilityService';
import { ApiClient } from '../services/apiClient';
import { SeatHold } from '../types';
import { SeatMap } from '../components/SeatMap';
import { SeatLegend } from '../components/SeatLegend';
import { 
  Bus, ArrowRight, ShieldCheck, AlertCircle, 
  Clock, Lock, Sparkles, RefreshCw
} from 'lucide-react';

export const Screen08SeatSelection: React.FC = () => {
  const state = appStore.getState();
  const trip = state.selectedTrip || state.trips[0];
  const currentUser = state.currentUser;

  const [seatMapData, setSeatMapData] = useState(() => 
    SeatAvailabilityService.getTripSeatMap(trip.id, currentUser?.id)
  );
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<number[]>(state.selectedSeats);
  const [activeHold, setActiveHold] = useState<SeatHold | null>(state.activeHold);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocking, setIsLocking] = useState<boolean>(false);

  // Charger la disposition officielle et vérifier les verrous
  const refreshSeatMap = () => {
    try {
      const data = SeatAvailabilityService.getTripSeatMap(trip.id, currentUser?.id);
      setSeatMapData(data);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erreur lors du chargement du plan.');
    }
  };

  useEffect(() => {
    refreshSeatMap();
  }, [trip.id, currentUser?.id]);

  // Gestion du décompte du verrou de 10 minutes (600 secondes)
  useEffect(() => {
    if (!activeHold || activeHold.status !== 'ACTIVE') {
      setSecondsRemaining(0);
      return;
    }

    const updateTimer = () => {
      const expiresAtMs = new Date(activeHold.expiresAt).getTime();
      const diffSec = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setSecondsRemaining(diffSec);

      if (diffSec === 0) {
        setErrorMessage('Votre sélection a expiré (10 minutes écoulées). Veuillez sélectionner vos sièges à nouveau.');
        setActiveHold(null);
        appStore.setActiveHold(null);
        refreshSeatMap();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeHold]);

  // Bascule de sélection de siège
  const handleToggleSeat = (seatNum: number) => {
    setErrorMessage(null);
    const maxAllowed = Math.max(state.searchPassengersCount, 4);

    if (selectedSeatNumbers.includes(seatNum)) {
      if (selectedSeatNumbers.length > 1) {
        setSelectedSeatNumbers(selectedSeatNumbers.filter(s => s !== seatNum));
      }
    } else {
      if (selectedSeatNumbers.length < maxAllowed) {
        setSelectedSeatNumbers([...selectedSeatNumbers, seatNum].sort((a, b) => a - b));
      } else {
        // Remplacer le premier
        setSelectedSeatNumbers([...selectedSeatNumbers.slice(1), seatNum].sort((a, b) => a - b));
      }
    }
  };

  // Verrouillage atomique des sièges
  const handleAcquireHoldAndProceed = async () => {
    if (selectedSeatNumbers.length === 0) {
      setErrorMessage('Veuillez sélectionner au moins un siège.');
      return;
    }

    setIsLocking(true);
    setErrorMessage(null);

    const idempotencyKey = `hold_${currentUser?.id || 'guest'}_${trip.id}_${selectedSeatNumbers.join('_')}`;
    const res = await ApiClient.createSeatHold(trip.id, selectedSeatNumbers, idempotencyKey);

    setIsLocking(false);

    if (!res.success || !res.data?.hold) {
      setErrorMessage(res.error || 'Erreur lors du verrouillage des sièges.');
      refreshSeatMap();
      return;
    }

    const hold = res.data.hold;
    setActiveHold(hold);
    appStore.setActiveHold(hold);

    // Mettre à jour les sièges sélectionnés dans le store
    appStore.getState().selectedSeats = [...selectedSeatNumbers];

    // Créer la réservation provisoire faisant autorité
    const bookingRes = await ApiClient.createProvisionalBooking(
      hold.id,
      currentUser?.name || 'Voyageur TSR',
      currentUser?.phone || '+226 70 00 00 00'
    );

    if (bookingRes.success && bookingRes.data?.booking) {
      appStore.getState().currentBooking = bookingRes.data.booking;
    } else {
      // Fallback local store si nécessaire
      appStore.createBooking();
    }

    // Redirection vers l'écran de paiement
    appStore.navigateTo('09_PAYMENT');
  };

  const unitPriceXOF = trip.priceXOF;
  const totalPriceXOF = selectedSeatNumbers.length * unitPriceXOF;

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 justify-between space-y-4">
      <div className="space-y-4">
        {/* Entête Trajet & Info Car */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Trajet Sélectionné
            </span>
            <div className="text-xs font-black text-slate-900">
              {trip.departureCity} &rarr; {trip.destinationCity}
            </div>
            <span className="text-[11px] text-slate-500">{trip.date} • {trip.departureTime}</span>
          </div>

          <button
            type="button"
            onClick={refreshSeatMap}
            title="Rafraîchir la disponibilité"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Message d'Erreur ou de Conflit de Sièges */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 shadow-xs">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Conflit de disponibilité</span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Légende Accessible et Totaux */}
        <SeatLegend
          selectedCount={selectedSeatNumbers.length}
          unitPriceXOF={unitPriceXOF}
          totalPriceXOF={totalPriceXOF}
        />

        {/* Plan Dynamique des Sièges */}
        <SeatMap
          layout={seatMapData.layout}
          seats={seatMapData.seats}
          selectedSeatNumbers={selectedSeatNumbers}
          onToggleSeat={handleToggleSeat}
          holdExpiresAt={activeHold?.expiresAt}
          secondsRemaining={secondsRemaining}
          isLoading={isLocking}
        />
      </div>

      {/* Barre d'Action Inférieure */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-slate-500 font-medium">Places sélectionnées :</span>
          <span className="font-extrabold text-blue-900">{selectedSeatNumbers.join(', ')}</span>
        </div>

        <button
          type="button"
          disabled={selectedSeatNumbers.length === 0 || isLocking}
          onClick={handleAcquireHoldAndProceed}
          className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 active:scale-[0.99] text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
        >
          {isLocking ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Lock className="w-4 h-4 text-amber-400" />
          )}
          <span>Verrouiller mes sièges (10 min) &amp; Payer</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[10px] text-center text-slate-400">
          🔒 Verrouillage atomique serveur : aucun autre voyageur ne peut acquérir vos sièges pendant 10 minutes.
        </p>
      </div>
    </div>
  );
};
