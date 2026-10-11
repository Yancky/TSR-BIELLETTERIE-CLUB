/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TimetableDeparture } from '../types';

export const INITIAL_TIMETABLE: TimetableDeparture[] = [
  {
    id: 'tt_01',
    companyName: 'TSR TRANSIT BURKINA',
    departureCity: 'Ouagadougou',
    destinationCity: 'Bobo-Dioulasso',
    departureTime: '06:30',
    arrivalTime: '12:00',
    priceXOF: 9000,
    busType: 'Car Climatiseur VIP (50 places)',
    amenities: ['Climatisation', 'Wi-Fi 4G', 'Prises USB', 'Toilettes à bord', 'Écran Vidéo'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    agencyName: 'Gare Centrale TSR Gounghin',
    availableSeats: 38,
    status: 'A_L_HEURE'
  },
  {
    id: 'tt_02',
    companyName: 'RAKIETA TRANSPORT',
    departureCity: 'Ouagadougou',
    destinationCity: 'Bobo-Dioulasso',
    departureTime: '07:30',
    arrivalTime: '13:00',
    priceXOF: 9000,
    busType: 'Grand Tourisme Express (54 places)',
    amenities: ['Climatisation', 'Prises USB', 'Vidéo'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    agencyName: 'Gare Rakieta Ouagarinter',
    availableSeats: 42,
    status: 'A_L_HEURE'
  },
  {
    id: 'tt_03',
    companyName: 'STAF EXPRESS',
    departureCity: 'Ouagadougou',
    destinationCity: 'Bobo-Dioulasso',
    departureTime: '08:30',
    arrivalTime: '14:15',
    priceXOF: 8500,
    busType: 'Standard Confort (60 places)',
    amenities: ['Ventilation renforcée', 'Musique locale', 'Bagages 25kg'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    agencyName: 'Gare STAF Larlé',
    availableSeats: 15,
    status: 'A_L_HEURE'
  },
  {
    id: 'tt_04',
    companyName: 'TCV CONFORT VOYAGES',
    departureCity: 'Ouagadougou',
    destinationCity: 'Bobo-Dioulasso',
    departureTime: '10:00',
    arrivalTime: '15:30',
    priceXOF: 9500,
    busType: 'Business Executive VIP (45 places)',
    amenities: ['Sièges inclinables cuir', 'Wi-Fi haut débit', 'Collation offerte', 'Toilettes'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    agencyName: 'Gare TCV Somgandé',
    availableSeats: 29,
    status: 'A_L_HEURE'
  },
  {
    id: 'tt_05',
    companyName: 'TSR TRANSIT BURKINA',
    departureCity: 'Ouagadougou',
    destinationCity: 'Bobo-Dioulasso',
    departureTime: '14:00',
    arrivalTime: '19:30',
    priceXOF: 9000,
    busType: 'Car Climatiseur VIP (50 places)',
    amenities: ['Climatisation', 'Wi-Fi 4G', 'Prises USB', 'Toilettes'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    agencyName: 'Gare Centrale TSR Gounghin',
    availableSeats: 34,
    status: 'A_L_HEURE'
  },
  {
    id: 'tt_06',
    companyName: 'TSR TRANSIT BURKINA',
    departureCity: 'Ouagadougou',
    destinationCity: 'Banfora',
    departureTime: '06:00',
    arrivalTime: '13:00',
    priceXOF: 11000,
    busType: 'Express Cascades VIP (50 places)',
    amenities: ['Climatisation', 'Prises USB', 'Arrêt Bobo', 'Eau minérale'],
    daysOfWeek: [1, 3, 5, 6, 7],
    agencyName: 'Gare Centrale TSR Gounghin',
    availableSeats: 26,
    status: 'A_L_HEURE'
  },
  {
    id: 'tt_07',
    companyName: 'RAKIETA TRANSPORT',
    departureCity: 'Ouagadougou',
    destinationCity: 'Koudougou',
    departureTime: '07:00',
    arrivalTime: '08:45',
    priceXOF: 3000,
    busType: 'Navette Rapide (40 places)',
    amenities: ['Climatisation', 'Départ ponctuel'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    agencyName: 'Gare Rakieta Ouagarinter',
    availableSeats: 19,
    status: 'A_L_HEURE'
  },
  {
    id: 'tt_08',
    companyName: 'TSR TRANSIT BURKINA',
    departureCity: 'Ouagadougou',
    destinationCity: 'Koudougou',
    departureTime: '11:30',
    arrivalTime: '13:15',
    priceXOF: 3000,
    busType: 'Navette Express (45 places)',
    amenities: ['Climatisation', 'Musique douce'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    agencyName: 'Gare Centrale TSR Gounghin',
    availableSeats: 31,
    status: 'A_L_HEURE'
  },
  {
    id: 'tt_09',
    companyName: 'TSR TRANSIT BURKINA',
    departureCity: 'Ouagadougou',
    destinationCity: 'Ouahigouya',
    departureTime: '07:00',
    arrivalTime: '10:15',
    priceXOF: 5000,
    busType: 'Car Régional Climatiseur (50 places)',
    amenities: ['Climatisation', 'Prises USB'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    agencyName: 'Gare TSR Tampouy',
    availableSeats: 22,
    status: 'A_L_HEURE'
  },
  {
    id: 'tt_10',
    companyName: 'STAF EXPRESS',
    departureCity: 'Ouagadougou',
    destinationCity: 'Fada N’Gourma',
    departureTime: '06:30',
    arrivalTime: '11:00',
    priceXOF: 6000,
    busType: 'Car Convoi Sécurisé (55 places)',
    amenities: ['Ventilation', 'Escorte sécurisée'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    agencyName: 'Gare STAF Kamsonghin',
    availableSeats: 18,
    status: 'A_L_HEURE'
  },
  {
    id: 'tt_11',
    companyName: 'TSR TRANSIT BURKINA',
    departureCity: 'Bobo-Dioulasso',
    destinationCity: 'Ouagadougou',
    departureTime: '06:30',
    arrivalTime: '12:00',
    priceXOF: 9000,
    busType: 'Car Climatiseur VIP (50 places)',
    amenities: ['Climatisation', 'Wi-Fi 4G', 'Prises USB', 'Toilettes'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    agencyName: 'Gare Principale TSR Accart-Ville',
    availableSeats: 35,
    status: 'A_L_HEURE'
  },
  {
    id: 'tt_12',
    companyName: 'RAKIETA TRANSPORT',
    departureCity: 'Bobo-Dioulasso',
    destinationCity: 'Banfora',
    departureTime: '08:00',
    arrivalTime: '09:30',
    priceXOF: 2500,
    busType: 'Navette Cascades (35 places)',
    amenities: ['Climatisation'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    agencyName: 'Gare Rakieta Bobo Ouezzin',
    availableSeats: 12,
    status: 'A_L_HEURE'
  }
];

export class ScheduleCalendarService {
  public static getAllSchedules(): TimetableDeparture[] {
    return [...INITIAL_TIMETABLE];
  }

  public static filterSchedules(params: {
    origin?: string;
    destination?: string;
    company?: string;
    dayOfWeek?: number;
    maxPrice?: number;
  }): TimetableDeparture[] {
    return INITIAL_TIMETABLE.filter(item => {
      if (params.origin && params.origin !== 'Toutes' && item.departureCity.toLowerCase() !== params.origin.toLowerCase()) {
        return false;
      }
      if (params.destination && params.destination !== 'Toutes' && item.destinationCity.toLowerCase() !== params.destination.toLowerCase()) {
        return false;
      }
      if (params.company && params.company !== 'Toutes' && !item.companyName.toLowerCase().includes(params.company.toLowerCase())) {
        return false;
      }
      if (params.dayOfWeek && !item.daysOfWeek.includes(params.dayOfWeek)) {
        return false;
      }
      if (params.maxPrice && item.priceXOF > params.maxPrice) {
        return false;
      }
      return true;
    });
  }
}
