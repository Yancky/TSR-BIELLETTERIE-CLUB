/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DetailedAgency } from '../types';

export const DETAILED_AGENCIES: DetailedAgency[] = [
  {
    id: 'ag_tsr_ouaga_gounghin',
    companyId: 'comp_tsr_01',
    companyName: 'TSR TRANSIT BURKINA',
    agencyName: 'Gare Centrale TSR Gounghin',
    city: 'Ouagadougou',
    neighborhood: 'Gounghin Nord',
    address: 'Boulevard de la Jeunesse, face Station Total, Secteur 09',
    phone: '+226 25 34 11 00',
    secondaryPhone: '+226 70 20 15 15',
    openingHours: '05h00 - 22h30 (7j/7)',
    gpsCoordinates: { lat: 12.3582, lng: -1.5541 },
    servicesOffered: {
      ticketCounter: true,
      parcelDesk: true,
      waitingLounge: true,
      parking: true,
      luggageStorage: true,
      mobileMoneyCash: true
    }
  },
  {
    id: 'ag_tsr_ouaga_tampouy',
    companyId: 'comp_tsr_01',
    companyName: 'TSR TRANSIT BURKINA',
    agencyName: 'Gare TSR Tampouy',
    city: 'Ouagadougou',
    neighborhood: 'Tampouy',
    address: 'Avenue Yatenga, à 200m du Rond-point de la Jeunesse',
    phone: '+226 25 35 22 18',
    secondaryPhone: '+226 76 55 44 33',
    openingHours: '05h30 - 21h00 (7j/7)',
    gpsCoordinates: { lat: 12.3921, lng: -1.5492 },
    servicesOffered: {
      ticketCounter: true,
      parcelDesk: true,
      waitingLounge: true,
      parking: false,
      luggageStorage: true,
      mobileMoneyCash: true
    }
  },
  {
    id: 'ag_tsr_bobo_accart',
    companyId: 'comp_tsr_01',
    companyName: 'TSR TRANSIT BURKINA',
    agencyName: 'Gare Principale TSR Accart-Ville',
    city: 'Bobo-Dioulasso',
    neighborhood: 'Accart-Ville',
    address: 'Avenue de la Liberté, proche de la Place Tiéfo Amoro',
    phone: '+226 20 97 12 40',
    secondaryPhone: '+226 78 88 12 12',
    openingHours: '05h00 - 22h00 (7j/7)',
    gpsCoordinates: { lat: 11.1824, lng: -4.2965 },
    servicesOffered: {
      ticketCounter: true,
      parcelDesk: true,
      waitingLounge: true,
      parking: true,
      luggageStorage: true,
      mobileMoneyCash: true
    }
  },
  {
    id: 'ag_rakieta_ouaga',
    companyId: 'comp_rakieta_02',
    companyName: 'RAKIETA TRANSPORT',
    agencyName: 'Gare Rakieta Ouagarinter',
    city: 'Ouagadougou',
    neighborhood: 'Ouaga-Inter',
    address: 'Gare Routière Internationale Ouagarinter, Secteur 24',
    phone: '+226 25 37 40 40',
    secondaryPhone: '+226 70 11 22 33',
    openingHours: '05h30 - 21h30 (7j/7)',
    gpsCoordinates: { lat: 12.3312, lng: -1.5124 },
    servicesOffered: {
      ticketCounter: true,
      parcelDesk: true,
      waitingLounge: true,
      parking: true,
      luggageStorage: true,
      mobileMoneyCash: true
    }
  },
  {
    id: 'ag_staf_larle',
    companyId: 'comp_staf_03',
    companyName: 'STAF EXPRESS',
    agencyName: 'Gare STAF Larlé',
    city: 'Ouagadougou',
    neighborhood: 'Larlé',
    address: 'Rue du Larlé Naba, face Marché de Larlé',
    phone: '+226 25 31 15 15',
    secondaryPhone: '+226 71 00 99 88',
    openingHours: '05h00 - 22h00 (7j/7)',
    gpsCoordinates: { lat: 12.3741, lng: -1.5365 },
    servicesOffered: {
      ticketCounter: true,
      parcelDesk: true,
      waitingLounge: false,
      parking: true,
      luggageStorage: true,
      mobileMoneyCash: true
    }
  },
  {
    id: 'ag_tsr_koudougou',
    companyId: 'comp_tsr_01',
    companyName: 'TSR TRANSIT BURKINA',
    agencyName: 'Gare TSR Koudougou Centre',
    city: 'Koudougou',
    neighborhood: 'Secteur 1',
    address: 'Avenue Maurice Yaméogo, à 100m de la Gare Ferroviaire',
    phone: '+226 25 44 02 10',
    openingHours: '06h00 - 20h00 (7j/7)',
    gpsCoordinates: { lat: 12.2514, lng: -2.3684 },
    servicesOffered: {
      ticketCounter: true,
      parcelDesk: true,
      waitingLounge: true,
      parking: true,
      luggageStorage: true,
      mobileMoneyCash: true
    }
  },
  {
    id: 'ag_tsr_banfora',
    companyId: 'comp_tsr_01',
    companyName: 'TSR TRANSIT BURKINA',
    agencyName: 'Gare TSR Banfora Cascades',
    city: 'Banfora',
    neighborhood: 'Secteur 2',
    address: 'Route Nationale 7, entrée de ville',
    phone: '+226 20 91 04 55',
    openingHours: '05h30 - 19h30 (7j/7)',
    gpsCoordinates: { lat: 10.6385, lng: -4.7578 },
    servicesOffered: {
      ticketCounter: true,
      parcelDesk: true,
      waitingLounge: true,
      parking: true,
      luggageStorage: true,
      mobileMoneyCash: true
    }
  }
];

export class AgencyDirectoryService {
  public static getAllAgencies(): DetailedAgency[] {
    return [...DETAILED_AGENCIES];
  }

  public static getAgencyById(id: string): DetailedAgency | undefined {
    return DETAILED_AGENCIES.find(a => a.id === id);
  }

  public static filterAgencies(city?: string, hasParcelDesk?: boolean): DetailedAgency[] {
    return DETAILED_AGENCIES.filter(a => {
      if (city && city !== 'Toutes' && a.city.toLowerCase() !== city.toLowerCase()) {
        return false;
      }
      if (hasParcelDesk && !a.servicesOffered.parcelDesk) {
        return false;
      }
      return true;
    });
  }
}
