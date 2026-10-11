/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Phone, Clock, Navigation, Bus, ChevronRight } from 'lucide-react';
import { Agency } from '../types';

interface MarkerLocation {
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
        isMain: ag.name.toLowerCase().includes('centrale') || ag.name.toLowerCase().includes('principale'),
      }));
    }
    return [
      {
        id: 'tsr-ouaga-main',
        name: 'Gare Centrale TSR Gounghin',
        city: 'Ouagadougou',
        address: 'RN1 Boulevard de la Jeunesse, Gounghin',
        phone: '+226 25 36 20 20',
        hours: '05h00 - 23h00',
        lat: 12.3657,
        lng: -1.5339,
        isMain: true,
      },
      {
        id: 'tsr-bobo-main',
        name: 'Gare Principale TSR Bobo',
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
        address: 'Avenue Maurice Yaméogo',
        phone: '+226 25 44 02 10',
        hours: '06h00 - 21h00',
        lat: 12.2526,
        lng: -2.3627,
      },
      {
        id: 'tsr-banfora',
        name: 'Gare TSR Banfora',
        city: 'Banfora',
        address: 'Boulevard de la Cascade',
        phone: '+226 20 91 00 22',
        hours: '06h00 - 20h00',
        lat: 10.6344,
        lng: -4.7578,
      },
    ];
  }, [locations, agencies]);

  const handleMarkerClick = (loc: MarkerLocation) => {
    setActiveMarker(loc);
    if (onSelectLocation) {
      onSelectLocation(loc);
    }
  };

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
                {onBookDeparture && (
                  <button
                    onClick={() => onBookDeparture(activeMarker.city)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1 px-2 rounded flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer"
                  >
                    <span>Réserver ce départ</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
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
