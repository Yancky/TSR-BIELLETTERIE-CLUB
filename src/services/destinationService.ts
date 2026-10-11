/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DestinationInfo } from '../types';

export const BURKINA_DESTINATIONS: DestinationInfo[] = [
  {
    id: 'dest_ouaga',
    cityName: 'Ouagadougou',
    region: 'Centre',
    tagline: 'Capitale culturelle et carrefour du Burkina Faso',
    description: "Cœur battant du pays, Ouagadougou est réputée pour ses festivals d'envergure mondiale (FESPACO, SIAO), ses marchés vibrants et son dynamisme économique. Point de convergence de tous les grands axes de transport interurbain.",
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    popularSpots: ['Monument des Héros Nationaux', 'Village Artisanal de Ouagadougou', 'Parc Urbain Bangr-Weoogo', 'Musée National', 'Grand Marché Rood-Woko'],
    travelTips: [
      'Privilégiez les départs tôt le matin (06h30 ou 07h30) pour éviter les encombrements urbains.',
      'Gardez une pièce d’identité valide (CNIB ou Passeport) à portée de main pour les contrôles de gendarmerie sur la RN1.',
      'Possibilité de consigne de bagages sécurisée à la Gare Centrale TSR Gounghin.'
    ],
    climate: 'Tropical sec (saison chaude de mars à mai, saison des pluies de juin à octobre).',
    averageFareXOF: 9000,
    averageDurationHours: 5.5,
    dailyDeparturesCount: 42,
    servedFrom: ['Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Fada N’Gourma', 'Banfora', 'Dédougou', 'Kaya']
  },
  {
    id: 'dest_bobo',
    cityName: 'Bobo-Dioulasso',
    region: 'Hauts-Bassins',
    tagline: 'Capitale économique, cité des arbres et de la musique',
    description: "Deuxième ville du Burkina Faso, Bobo-Dioulasso séduit par sa verdure, son architecture coloniale soudanaise, sa mosquée historique en banco et sa douceur de vivre légendaire. Pôle agro-industriel majeur.",
    imageUrl: 'https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?w=800&auto=format&fit=crop&q=80',
    popularSpots: ['Grande Mosquée de Dioulassoba', 'Vieille Ville de Dioulassoba', 'Guinguette de Bobo', 'Musée de la Musique d’Hier et d’Aujourd’hui', 'Marché Central'],
    travelTips: [
      'La ligne Ouaga-Bobo est la plus fréquentée : réservation conseillée 24h à l’avance les vendredis et dimanches.',
      'Autocars climatisés grand confort équipés de Wi-Fi recommandés pour ce trajet de 360 km.',
      'Les cars effectuent une pause repas de 15 minutes à Boromo (relais routier réputé).'
    ],
    climate: 'Soudano-guinéen, plus humide et tempéré que le nord, végétation luxuriante.',
    averageFareXOF: 9000,
    averageDurationHours: 5.5,
    dailyDeparturesCount: 38,
    servedFrom: ['Ouagadougou', 'Banfora', 'Dédougou', 'Koudougou', 'Gaoua']
  },
  {
    id: 'dest_banfora',
    cityName: 'Banfora',
    region: 'Cascades',
    tagline: 'Terre de merveilles naturelles et de tourisme verdoyant',
    description: "Joyau touristique du Burkina Faso, Banfora est entourée de paysages grandioses : cascades étagées, dômes de grès sculptés par le vent, champs de canne à sucre à perte de vue et lac aux hippopotames de Tengréla.",
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    popularSpots: ['Cascades de Karfiguéla', 'Dômes de Fabédougou', 'Lac de Tengréla', 'Pics de Sindou', 'Champs de la SN-SOSUCO'],
    travelTips: [
      'Départ matinal recommandé depuis Bobo-Dioulasso (trajet direct de 1h30).',
      'Emportez des vêtements légers et des chaussures de marche pour la visite des cascades.',
      'Connexion directe en car Express vers Ouagadougou disponible chaque jour à 06h00.'
    ],
    climate: 'Climat doux et arboré, forte pluviosité d’hivernage, période idéale de novembre à février.',
    averageFareXOF: 11000,
    averageDurationHours: 7.0,
    dailyDeparturesCount: 16,
    servedFrom: ['Bobo-Dioulasso', 'Ouagadougou', 'Gaoua']
  },
  {
    id: 'dest_koudougou',
    cityName: 'Koudougou',
    region: 'Centre-Ouest',
    tagline: 'Cité du Cavalier Rouge et capitale du Faso Dan Fani',
    description: "À seulement 100 km à l’ouest de Ouagadougou, Koudougou est un carrefour ferroviaire et universitaire dynamique, célèbre pour ses tisserands traditionnels, son festival Nuits Atypiques (NAK) et sa gastronomie locale.",
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    popularSpots: ['Place de la Nation', 'Marché central des tisserands', 'Université Norbert Zongo', 'Forêt classée de Tiogo', 'Crocodiles sacrés de Sabou (à proximité)'],
    travelTips: [
      'Liaison express de 1h45 très fluide sur la RN14 réhabilitée.',
      'Nombreuses navettes quotidiennes pour les professionnels et étudiants.',
      'Possibilité de combiner billet de car et envoi de colis Dan Fani le jour même.'
    ],
    climate: 'Sahélien tempéré en début d’année, sec et ensoleillé.',
    averageFareXOF: 3000,
    averageDurationHours: 1.75,
    dailyDeparturesCount: 24,
    servedFrom: ['Ouagadougou', 'Bobo-Dioulasso', 'Dédougou']
  },
  {
    id: 'dest_ouahigouya',
    cityName: 'Ouahigouya',
    region: 'Nord',
    tagline: 'Cité historique du Royaume du Yatenga',
    description: "Capitale historique du Yatenga, Ouahigouya se distingue par son riche patrimoine mossi, son artisanat du cuir réputé et son statut de carrefour commercial majeur du septentrion burkinabè.",
    imageUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
    popularSpots: ['Palais du Naaba Kango', 'Grand Marché de Ouahigouya', 'Centre d’artisanat du cuir', 'Barrage de Kanazoé'],
    travelTips: [
      'Trajet direct Ouaga-Ouahigouya en 3h15 par la RN2 bitumée.',
      'Départs fréquents tôt le matin et en milieu de journée.',
      'Contrôles de sécurité stricts au départ de la gare.'
    ],
    climate: 'Sahélien chaud et sec, brise fraîche en soirée entre décembre et février.',
    averageFareXOF: 5000,
    averageDurationHours: 3.25,
    dailyDeparturesCount: 18,
    servedFrom: ['Ouagadougou', 'Kaya']
  },
  {
    id: 'dest_fada',
    cityName: 'Fada N’Gourma',
    region: 'Est',
    tagline: 'Cité royale du Gulmu et porte de l’Est',
    description: "Cœur battant de la région de l’Est, Fada N’Gourma est renommée pour sa production de miel sauvage réputé, ses élevages et son patrimoine culturel gulmantché séculaire.",
    imageUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&auto=format&fit=crop&q=80',
    popularSpots: ['Palais royal du Kùpiendieli', 'Marché au miel de Fada', 'Collines sacrées', 'Place de la Mairie'],
    travelTips: [
      'Convois sécurisés organisés sur l’axe RN4 Ouagadougou-Fada.',
      'Réservation anticipée obligatoire pour l’enregistrement des listes de passagers.',
      'Bagages limités à 20 kg par voyageur en soute.'
    ],
    climate: 'Soudano-sahélien, chaud avec une saison des pluies marquée.',
    averageFareXOF: 6000,
    averageDurationHours: 4.5,
    dailyDeparturesCount: 12,
    servedFrom: ['Ouagadougou', 'Koupéla']
  }
];

export class DestinationService {
  public static getAllDestinations(): DestinationInfo[] {
    return [...BURKINA_DESTINATIONS];
  }

  public static getDestinationById(id: string): DestinationInfo | undefined {
    return BURKINA_DESTINATIONS.find(d => d.id === id || d.cityName.toLowerCase() === id.toLowerCase());
  }

  public static searchDestinations(query: string): DestinationInfo[] {
    const q = query.trim().toLowerCase();
    if (!q) return [...BURKINA_DESTINATIONS];
    return BURKINA_DESTINATIONS.filter(d =>
      d.cityName.toLowerCase().includes(q) ||
      d.region.toLowerCase().includes(q) ||
      d.tagline.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  }
}
