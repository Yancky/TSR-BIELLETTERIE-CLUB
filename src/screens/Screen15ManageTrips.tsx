import React, { useState } from 'react';
import { appStore } from '../services/store';
import { DepartureTrip, TripStatus } from '../types';
import { BURKINA_CITIES } from '../services/mockData';
import { formatXOF } from '../services/ticketSecurity';
import { 
  Plus, Bus, Clock, Calendar, CheckCircle, 
  XCircle, AlertCircle, Edit, MapPin 
} from 'lucide-react';

export const Screen15ManageTrips: React.FC = () => {
  const state = appStore.getState();
  const [showAddModal, setShowAddModal] = useState(false);
  const [trips, setTrips] = useState(state.trips);

  // Form states for new trip
  const [depCity, setDepCity] = useState('Ouagadougou');
  const [destCity, setDestCity] = useState('Bobo-Dioulasso');
  const [depTime, setDepTime] = useState('10:00');
  const [arrTime, setArrTime] = useState('15:15');
  const [price, setPrice] = useState(9000);
  const [busType, setBusType] = useState('Car VIP Climatise 50 Places');
  const [seats, setSeats] = useState(50);

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    const newTrip = appStore.addTrip({
      companyId: 'comp_tsr',
      departureCity: depCity,
      destinationCity: destCity,
      departureAgency: `Gare Principale ${depCity}`,
      arrivalAgency: `Gare Centrale ${destCity}`,
      departureTime: depTime,
      arrivalTime: arrTime,
      date: '2026-10-12',
      priceXOF: price,
      busType,
      amenities: ['Climatisation', 'Wi-Fi 4G', 'Prises USB'],
      totalSeats: seats
    });

    setTrips([...appStore.getState().trips]);
    setShowAddModal(false);
  };

  const handleStatusChange = (tripId: string, newStatus: TripStatus) => {
    appStore.updateTripStatus(tripId, newStatus);
    setTrips([...appStore.getState().trips]);
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-slate-50 space-y-3">
      {/* Top Header bar with Add Trip Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Gestion des Départs &amp; Lignes</h2>
          <span className="text-[11px] text-slate-500">TSR Transit • {trips.length} départs enregistrés</span>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nouveau départ</span>
        </button>
      </div>

      {/* Trips list */}
      <div className="space-y-3 flex-1 overflow-y-auto">
        {trips.map(trip => (
          <div
            key={trip.id}
            className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900">
                {trip.departureCity} &rarr; {trip.destinationCity}
              </span>
              <select
                value={trip.status}
                onChange={e => handleStatusChange(trip.id, e.target.value as TripStatus)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  trip.status === 'PUBLISHED'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : trip.status === 'BOARDING'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : trip.status === 'DEPARTED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                <option value="PUBLISHED">PUBLIÉ</option>
                <option value="BOARDING">EMBARQUEMENT</option>
                <option value="DEPARTED">PARTI</option>
                <option value="CANCELLED">ANNULÉ</option>
              </select>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-mono font-bold text-blue-900 block">{trip.departureTime}</span>
                <span className="text-[10px] text-slate-500">{trip.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Capacité</span>
                <span className="font-semibold text-slate-700">
                  {trip.availableSeatsCount} / {trip.totalSeats} places
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Tarif</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatXOF(trip.priceXOF)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>{trip.busType}</span>
              <span className="text-emerald-700 font-medium">Gare : {trip.departureAgency}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Trip */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Programmer un nouveau départ</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Ville départ</label>
                  <select
                    value={depCity}
                    onChange={e => setDepCity(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {BURKINA_CITIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Destination</label>
                  <select
                    value={destCity}
                    onChange={e => setDestCity(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    {BURKINA_CITIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Heure départ</label>
                  <input
                    type="time"
                    value={depTime}
                    onChange={e => setDepTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Heure arrivée</label>
                  <input
                    type="time"
                    value={arrTime}
                    onChange={e => setArrTime(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Prix (FCFA)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-600">Places (Sièges)</label>
                  <input
                    type="number"
                    value={seats}
                    onChange={e => setSeats(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-600">Catégorie de car</label>
                <input
                  type="text"
                  value={busType}
                  onChange={e => setBusType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
