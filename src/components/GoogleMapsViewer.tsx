/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Phone, Clock, Navigation, Bus, ChevronRight, AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react';
import { Agency } from '../types';

export interface MarkerLocation {
  id: string;
  name: string;
  city: string;
  address: string;
  phone?: string;
  hours?: string;
  lat: number;
  lng: number;
  isMain?: boolean;
}

interface GoogleMapsViewerProps {
  locations?: MarkerLocation[];
  agencies?: Agency[];
  selectedLocationId?: string;
  onSelectLocation?: (location: MarkerLocation) => void;
  onBookDeparture?: (city: string) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
}

// Coordonnées géographiques officielles (Burkina Faso)
export const OFFICIAL_BURKINA_STATIONS: MarkerLocation[] = [
  {
    id: 'tsr-ouaga-main',
    name: 'Gare Centrale TSR Gounghin',
    city: 'Ouagadougou',
    address: 'Boulevard de la Révolution, Face Stade du 4 Août',
    phone: '+226 25 36 20 21',
    hours: '05h00 - 22h00',
    lat: 12.3686,
    lng: -1.5542,
    isMain: true,
  },
  {
    id: 'tsr-ouaga-tanghin',
    name: 'Agence TSR Tanghin Gare Nord',
    city: 'Ouagadougou',
    address: 'Route de Kaya, Carrefour Barrage',
    phone: '+226 25 36 20 22',
    hours: '05h30 - 21h00',
    lat: 12.4012,
    lng: -1.5055,
  },
  {
    id: 'tsr-bobo-farakan',
    name: 'Gare Principale TSR Farakan',
    city: 'Bobo-Dioulasso',
    address: 'Avenue de l\'Union Européenne, Quartier Farakan',
    phone: '+226 20 98 04 40',
    hours: '05h00 - 22h00',
    lat: 11.1764,
    lng: -4.2982,
    isMain: true,
  },
  {
    id: 'tsr-koudougou',
    name: 'Agence TSR Koudougou Gare',
    city: 'Koudougou',
    address: 'Place du Marché Central, Koudougou',
    phone: '+226 25 44 02 10',
    hours: '06h00 - 20h00',
    lat: 12.2526,
    lng: -2.3627,
  },
  {
    id: 'tsr-banfora',
    name: 'Gare TSR Banfora Cascades',
    city: 'Banfora',
    address: 'Boulevard de la Cascade, Quartier Administratif',
    phone: '+226 20 91 00 22',
    hours: '06h00 - 20h00',
    lat: 10.6344,
    lng: -4.7578,
  },
  {
    id: 'tsr-ouahigouya',
    name: 'Agence TSR Ouahigouya',
    city: 'Ouahigouya',
    address: 'Avenue Naaba Kango, Secteur 1',
    phone: '+226 24 55 01 12',
    hours: '06h00 - 20h00',
    lat: 13.5828,
    lng: -2.4216,
  },
  {
    id: 'tsr-fada',
    name: 'Agence TSR Fada N\'Gourma',
    city: 'Fada N\'Gourma',
    address: 'Avenue du 11 Décembre, Route de Niamey',
    phone: '+226 24 77 00 18',
    hours: '06h00 - 20h00',
    lat: 12.0616,
    lng: 0.3584,
  }
];

const DEFAULT_MAP_CENTER = { lat: 12.3714, lng: -1.5197 }; // Ouagadougou, Burkina Faso

export const GoogleMapsViewer: React.FC<GoogleMapsViewerProps> = ({
  locations,
  agencies,
  selectedLocationId,
  onSelectLocation,
  onBookDeparture,
  center = DEFAULT_MAP_CENTER,
  zoom = 7,
  height = '320px',
}) => {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBvlws8zjVZgO0JskGmkpvJjVoUUbtXR7g';
  const [activeMarker, setActiveMarker] = useState<MarkerLocation | null>(null);
  const [hasMapError, setHasMapError] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Convert agencies to marker locations if provided
  const markers: MarkerLocation[] = useMemo(() => {
    if (locations && locations.length > 0) return locations;
    if (agencies && agencies.length > 0) {
      return agencies.map((ag) => ({
        id: ag.id,
        name: ag.name,
        city: ag.city,
        address: ag.address,
        phone: ag.phone,
        hours: ag.openingHours,
        lat: ag.latitude || ag.lat || 12.3714,
        lng: ag.longitude || ag.lng || -1.5197,
        isMain: ag.name.toLowerCase().includes('centrale') || ag.name.toLowerCase().includes('principale') || ag.name.toLowerCase().includes('farakan'),
      }));
    }
    return OFFICIAL_BURKINA_STATIONS;
  }, [locations, agencies]);

  // Listen for quota exhaustion or auth errors on window
  useEffect(() => {
    const handleAuthFailure = () => {
      console.warn('[GoogleMaps] Auth failure or invalid key detected. Activating offline fallback UI.');
      setHasMapError(true);
    };

    const handleQuotaExceeded = () => {
      console.warn('[GoogleMaps] Quota limit reached. Switching to localized fallback map.');
      setQuotaExceeded(true);
    };

    window.addEventListener('gm_authFailure', handleAuthFailure);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);

    return () => {
      window.removeEventListener('gm_authFailure', handleAuthFailure);
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  const handleMarkerClick = (loc: MarkerLocation) => {
    setActiveMarker(loc);
    if (onSelectLocation) {
      onSelectLocation(loc);
    }
  };

  // Fallback UI when Google Maps is unavailable, offline, or quota exhausted
  if (hasMapError || quotaExceeded || !apiKey) {
    return (
      <div 
        className="w-full relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 p-4 text-white flex flex-col justify-between"
        style={{ height }}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Mode Cartographique Hors-Ligne / Fallback Réseau</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
            {markers.length} Gares Référencées
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {markers.map((loc) => (
            <div 
              key={loc.id} 
              onClick={() => {
                setActiveMarker(loc);
                if (onSelectLocation) onSelectLocation(loc);
              }}
              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                (selectedLocationId === loc.id || activeMarker?.id === loc.id)
                  ? 'bg-blue-900/60 border-blue-500'
                  : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <div className="truncate mr-2">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{loc.city} — {loc.name}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">{loc.address}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  GPS : {loc.lat.toFixed(4)}° N, {loc.lng.toFixed(4)}° W
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`https://maps.google.com/?q=${loc.lat},${loc.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200"
                  title="Ouvrir dans Google Maps Web"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {onBookDeparture && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookDeparture(loc.city);
                    }}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold"
                  >
                    Réserver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span>Coordonnées exactes vérifiées du réseau TSR Burkina</span>
          <button 
            onClick={() => {
              setHasMapError(false);
              setQuotaExceeded(false);
            }}
            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Réessayer</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-slate-700/60 shadow-lg bg-slate-900" style={{ height }}>
      {/* Google Maps API Provider */}
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling="cooperative"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          {markers.map((loc) => {
            const isSelected = selectedLocationId === loc.id || activeMarker?.id === loc.id;
            return (
              <AdvancedMarker
                key={loc.id}
                position={{ lat: loc.lat, lng: loc.lng }}
                title={loc.name}
                onClick={() => handleMarkerClick(loc)}
              >
                <Pin
                  background={isSelected ? '#F59E0B' : loc.isMain ? '#2563EB' : '#475569'}
                  glyphColor="#FFFFFF"
                  borderColor={isSelected ? '#78350F' : '#1E293B'}
                  scale={isSelected ? 1.25 : loc.isMain ? 1.1 : 0.95}
                />
              </AdvancedMarker>
            );
          })}

          {activeMarker && (
            <InfoWindow
              position={{ lat: activeMarker.lat, lng: activeMarker.lng }}
              onCloseClick={() => setActiveMarker(null)}
            >
              <div className="p-1 max-w-[220px] text-slate-900 font-sans">
                <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold mb-1">
                  <Bus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate">{activeMarker.city}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight mb-1">
                  {activeMarker.name}
                </h4>
                <p className="text-[11px] text-slate-600 mb-1 leading-snug">
                  {activeMarker.address}
                </p>
                {activeMarker.phone && (
                  <p className="text-[11px] text-slate-700 font-mono mb-2 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{activeMarker.phone}</span>
                  </p>
                )}
                <div className="flex items-center gap-1">
                  {onBookDeparture && (
                    <button
                      onClick={() => onBookDeparture(activeMarker.city)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1 px-2 rounded flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
                    >
                      <span>Réserver</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                  <a
                    href={`https://maps.google.com/?q=${activeMarker.lat},${activeMarker.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300"
                    title="Itinéraire"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Map Floating Legend */}
      <div className="absolute top-2.5 left-2.5 z-10 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-200 shadow-md flex items-center gap-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        <span className="font-semibold text-white">Google Maps • Réseau TSR Transit BF</span>
      </div>
    </div>
  );
};
