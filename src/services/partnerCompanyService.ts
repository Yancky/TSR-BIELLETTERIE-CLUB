/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PartnerCompanyProfile } from '../types';

export const PARTNER_COMPANIES: PartnerCompanyProfile[] = [
  {
    id: 'comp_tsr_01',
    name: 'TSR TRANSIT BURKINA',
    tradeName: 'TSR Transit',
    slogan: 'La référence du confort et de la sécurité sur les routes du Faso',
    logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200&auto=format&fit=crop&q=80',
    headquarters: 'Ouagadougou, Gounghin Nord',
    foundedYear: 2004,
    fleetSize: 68,
    destinationsCount: 14,
    rating: 4.8,
    reviewCount: 1420,
    amenities: ['Climatisation intégrale', 'Wi-Fi 4G gratuit', 'Prises USB individuelles', 'Toilettes à bord', 'Écrans vidéo HD', 'Bouteille d’eau offerte'],
    safetyCertifications: ['Agrément Ministère des Transports BF', 'Contrôle Technique CCVA trimestriel', 'Chauffeurs certifiés éco-conduite', 'Suivi GPS temps réel de flotte'],
    description: 'Pionnière de la modernisation du transport interurbain au Burkina Faso, TSR TRANSIT dispose d’une flotte récente de cars climatisés de dernière génération reliant quotidiennement les principales capitales régionales.',
    contactPhone: '+226 25 34 11 00',
    contactEmail: 'contact@tsrtransit.bf',
    featuredRoutes: [
      { from: 'Ouagadougou', to: 'Bobo-Dioulasso', priceXOF: 9000 },
      { from: 'Ouagadougou', to: 'Banfora', priceXOF: 11000 },
      { from: 'Ouagadougou', to: 'Koudougou', priceXOF: 3000 },
      { from: 'Ouagadougou', to: 'Ouahigouya', priceXOF: 5000 }
    ]
  },
  {
    id: 'comp_rakieta_02',
    name: 'RAKIETA TRANSPORT',
    tradeName: 'Rakieta',
    slogan: 'Voyager en toute sérénité, partout au Burkina',
    logoUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=200&auto=format&fit=crop&q=80',
    headquarters: 'Bobo-Dioulasso, Zone Industrielle',
    foundedYear: 1998,
    fleetSize: 52,
    destinationsCount: 12,
    rating: 4.6,
    reviewCount: 980,
    amenities: ['Climatisation', 'Prises recharge', 'Vidéo projection', 'Soute volumineuse pour fret'],
    safetyCertifications: ['Agrément d’État A-449', 'Certification CCVA', 'Limiteurs de vitesse 90 km/h'],
    description: 'Institution reconnue du transport ouest-burkinabè, Rakieta assure des liaisons quotidiennes à haute fréquence avec un service de fret express très apprécié des commerçants.',
    contactPhone: '+226 20 97 12 40',
    contactEmail: 'service-client@rakieta.bf',
    featuredRoutes: [
      { from: 'Bobo-Dioulasso', to: 'Ouagadougou', priceXOF: 9000 },
      { from: 'Bobo-Dioulasso', to: 'Banfora', priceXOF: 2500 },
      { from: 'Ouagadougou', to: 'Koudougou', priceXOF: 3000 }
    ]
  },
  {
    id: 'comp_staf_03',
    name: 'STAF EXPRESS',
    tradeName: 'STAF',
    slogan: 'Le réseau le plus vaste du Burkina Faso',
    logoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=200&auto=format&fit=crop&q=80',
    headquarters: 'Ouagadougou, Larlé',
    foundedYear: 1992,
    fleetSize: 95,
    destinationsCount: 22,
    rating: 4.4,
    reviewCount: 2150,
    amenities: ['Ventilation puissante', 'Grandes soutes', 'Tarifs accessibles', 'Départs matinaux'],
    safetyCertifications: ['Agrément Ministère', 'Audit de sécurité routière annuel'],
    description: 'Avec le plus grand nombre de dessertes provinciales, STAF Express dessert les grands corridors comme les villes secondaires avec ponctualité et des tarifs avantageux.',
    contactPhone: '+226 25 31 15 15',
    contactEmail: 'info@stafburkina.com',
    featuredRoutes: [
      { from: 'Ouagadougou', to: 'Bobo-Dioulasso', priceXOF: 8500 },
      { from: 'Ouagadougou', to: 'Fada N’Gourma', priceXOF: 6000 },
      { from: 'Ouagadougou', to: 'Ouahigouya', priceXOF: 5000 }
    ]
  },
  {
    id: 'comp_tcv_04',
    name: 'TCV CONFORT VOYAGES',
    tradeName: 'TCV',
    slogan: 'Le voyage d’affaires et de famille en classe supérieure',
    logoUrl: 'https://images.unsplash.com/photo-1557223562-6c77ef16210f?w=200&auto=format&fit=crop&q=80',
    headquarters: 'Ouagadougou, Somgandé',
    foundedYear: 2010,
    fleetSize: 34,
    destinationsCount: 8,
    rating: 4.7,
    reviewCount: 640,
    amenities: ['Sièges ergonomiques cuir', 'Wi-Fi haut débit', 'Service hôtesse', 'Collation servie à bord', 'Toilettes'],
    safetyCertifications: ['Norme sécurité ISO Transport Passagers', 'Véhicules Mercedes-Benz & Scania récents'],
    description: 'TCV Confort Voyages cible une clientèle d’affaires et de voyageurs exigeants cherchant un standard de confort digne des compagnies aériennes régionales.',
    contactPhone: '+226 25 36 88 88',
    contactEmail: 'vip@tcvvoyages.bf',
    featuredRoutes: [
      { from: 'Ouagadougou', to: 'Bobo-Dioulasso', priceXOF: 9500 },
      { from: 'Ouagadougou', to: 'Koudougou', priceXOF: 3500 }
    ]
  }
];

export class PartnerCompanyService {
  public static getAllPartners(): PartnerCompanyProfile[] {
    return [...PARTNER_COMPANIES];
  }

  public static getPartnerById(id: string): PartnerCompanyProfile | undefined {
    return PARTNER_COMPANIES.find(p => p.id === id || p.tradeName.toLowerCase() === id.toLowerCase());
  }
}
