/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LoyaltyAccount } from '../types';

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceXOF: number;
  period: 'MENSUEL' | 'TRIMESTRIEL' | 'ANNUEL';
  discountPct: number;
  perks: string[];
  popular?: boolean;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'sub_etudiant',
    name: 'Carte Jeune & Étudiant',
    priceXOF: 5000,
    period: 'ANNUEL',
    discountPct: 15,
    perks: ['-15% sur tous les trajets interurbains', 'Bagage soute supplémentaire gratuit (10kg)', 'Priorité sur liste d’attente']
  },
  {
    id: 'sub_navetteur',
    name: 'Pass Navetteur Pro Ouaga-Bobo',
    priceXOF: 25000,
    period: 'MENSUEL',
    discountPct: 25,
    perks: ['-25% sur les allers-retours de la ligne', 'Accès Salon VIP en gare', 'Modification sans frais jusqu’à 1h avant départ', 'Guichet coupe-file'],
    popular: true
  },
  {
    id: 'sub_famille',
    name: 'Pack Famille & Groupe',
    priceXOF: 15000,
    period: 'TRIMESTRIEL',
    discountPct: 20,
    perks: ['-20% dès 3 billets achetés ensemble', 'Assurance bagages premium incluse', 'Choix des sièges adjacents garanti']
  }
];

export class LoyaltyService {
  private static userLoyalty: Map<string, LoyaltyAccount> = new Map([
    [
      'user_traveler_01',
      {
        userId: 'user_traveler_01',
        cardNumber: 'TSR-FID-2026-9914',
        pointsBalance: 450,
        tier: 'ARGENT',
        lifetimePoints: 1250,
        totalTripsCompleted: 8,
        totalSpentXOF: 72000,
        benefits: [
          '5% de réduction permanente sur vos réservations',
          'Enregistrement prioritaire au guichet',
          'Colis fret : -10% sur le premier envoi mensuel'
        ]
      }
    ]
  ]);

  public static getAccount(userId: string): LoyaltyAccount {
    const existing = this.userLoyalty.get(userId);
    if (existing) return { ...existing };

    const newAccount: LoyaltyAccount = {
      userId,
      cardNumber: `TSR-FID-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      pointsBalance: 100, // Bonus de bienvenue
      tier: 'STANDARD',
      lifetimePoints: 100,
      totalTripsCompleted: 0,
      totalSpentXOF: 0,
      benefits: [
        'Cumul de 1 point par tranche de 100 FCFA dépensés',
        'Convertible en réductions dès 500 points (500 pts = 2 500 FCFA)',
        'Accès aux promotions flash exclusives'
      ]
    };
    this.userLoyalty.set(userId, newAccount);
    return { ...newAccount };
  }

  public static creditPoints(userId: string, amountSpentXOF: number): LoyaltyAccount {
    const account = this.getAccount(userId);
    const earned = Math.floor(amountSpentXOF / 100);
    account.pointsBalance += earned;
    account.lifetimePoints += earned;
    account.totalSpentXOF += amountSpentXOF;
    account.totalTripsCompleted += 1;

    // Mise à jour du palier
    if (account.lifetimePoints >= 5000) {
      account.tier = 'PLATINE';
      account.benefits = [
        '15% de réduction permanente',
        'Accès illimité aux Salons VIP',
        'Priorité absolue sur les places avant',
        'Billet anniversaire offert'
      ];
    } else if (account.lifetimePoints >= 2500) {
      account.tier = 'OR';
      account.benefits = [
        '10% de réduction permanente',
        'Salon VIP dans les grandes gares',
        'Bagage soute 30kg autorisé sans supplément'
      ];
    } else if (account.lifetimePoints >= 1000) {
      account.tier = 'ARGENT';
      account.benefits = [
        '5% de réduction permanente',
        'Enregistrement prioritaire',
        '-10% sur les colis fret'
      ];
    }

    this.userLoyalty.set(userId, account);
    return { ...account };
  }

  public static redeemPoints(userId: string, pointsToRedeem: number): { success: boolean; discountXOF: number; message: string } {
    const account = this.getAccount(userId);
    if (account.pointsBalance < pointsToRedeem) {
      return { success: false, discountXOF: 0, message: 'Solde de points insuffisant.' };
    }
    if (pointsToRedeem < 200) {
      return { success: false, discountXOF: 0, message: 'Le palier minimum d’utilisation est de 200 points (1 000 FCFA).' };
    }

    const discountXOF = Math.floor(pointsToRedeem * 5); // 1 pt = 5 FCFA
    account.pointsBalance -= pointsToRedeem;
    this.userLoyalty.set(userId, account);

    return {
      success: true,
      discountXOF,
      message: `Félicitations ! Vous bénéficiez d'un bon de réduction de ${discountXOF.toLocaleString('fr-FR')} FCFA.`
    };
  }

  public static getSubscriptionPlans(): SubscriptionPlan[] {
    return [...SUBSCRIPTION_PLANS];
  }
}
