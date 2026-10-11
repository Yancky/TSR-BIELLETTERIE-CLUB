/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OperationalKPIData } from '../types';

export const OPERATIONAL_DATA_OCTOBER_2026: OperationalKPIData = {
  period: 'Octobre 2026 (En cours)',
  totalRevenueXOF: 48950000,
  totalBookings: 5440,
  totalPassengers: 5440,
  averageFillRatePct: 88.4,
  onTimeDepartureRatePct: 96.2,
  parcelsHandled: 1280,
  parcelRevenueXOF: 4160000,
  topRoutes: [
    {
      route: 'Ouagadougou ➔ Bobo-Dioulasso (RN1)',
      passengerCount: 2840,
      revenueXOF: 25560000,
      fillRatePct: 94.6
    },
    {
      route: 'Bobo-Dioulasso ➔ Ouagadougou (RN1)',
      passengerCount: 2190,
      revenueXOF: 19710000,
      fillRatePct: 91.2
    },
    {
      route: 'Ouagadougou ➔ Banfora (RN1/RN7)',
      passengerCount: 520,
      revenueXOF: 5720000,
      fillRatePct: 84.0
    },
    {
      route: 'Ouagadougou ➔ Ouahigouya (RN2)',
      passengerCount: 460,
      revenueXOF: 2300000,
      fillRatePct: 82.5
    },
    {
      route: 'Ouagadougou ➔ Koudougou (RN14)',
      passengerCount: 710,
      revenueXOF: 2130000,
      fillRatePct: 78.9
    }
  ]
};

export class OperationalReportService {
  public static getMonthlyKPIs(): OperationalKPIData {
    return { ...OPERATIONAL_DATA_OCTOBER_2026 };
  }

  public static getCompanyKPIs(companyId: string): OperationalKPIData {
    // Pro-rata pour compagnie
    return {
      period: 'Octobre 2026 (TSR TRANSIT)',
      totalRevenueXOF: 32400000,
      totalBookings: 3600,
      totalPassengers: 3600,
      averageFillRatePct: 91.2,
      onTimeDepartureRatePct: 98.1,
      parcelsHandled: 890,
      parcelRevenueXOF: 2890000,
      topRoutes: OPERATIONAL_DATA_OCTOBER_2026.topRoutes.slice(0, 3)
    };
  }
}
