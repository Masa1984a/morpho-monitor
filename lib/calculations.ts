import { MarketPosition, HealthFactorData } from '@/types/morpho';

const HEALTH_FACTOR_THRESHOLD = parseFloat(process.env.NEXT_PUBLIC_HEALTH_FACTOR_THRESHOLD || '1.10');

/**
 * Calculate health factor for a position
 * Health Factor = (Collateral Value × LLTV) / Borrow Value
 */
export function calculateHealthFactor(position: MarketPosition): HealthFactorData {
  const { state, market } = position;
  const collateralUsd = state.collateralUsd;
  const borrowAssetsUsd = state.borrowAssetsUsd;
  const lltv = parseFloat(market.lltv);

  // If no borrow, health factor is infinite (healthy)
  if (borrowAssetsUsd === 0 || borrowAssetsUsd === null) {
    return {
      value: Infinity,
      status: 'healthy',
      lltv,
      collateralUsd,
      borrowAssetsUsd: 0,
    };
  }

  // Calculate health factor
  const healthFactor = (collateralUsd * lltv) / borrowAssetsUsd;

  // Determine status
  let status: 'healthy' | 'warning' | 'danger';
  if (healthFactor < 1.0) {
    status = 'danger'; // Liquidatable
  } else if (healthFactor < HEALTH_FACTOR_THRESHOLD) {
    status = 'warning'; // Close to liquidation
  } else {
    status = 'healthy';
  }

  return {
    value: healthFactor,
    status,
    lltv,
    collateralUsd,
    borrowAssetsUsd,
  };
}

/**
 * Calculate aggregate health factor for multiple positions
 */
export function calculateAggregateHealthFactor(positions: MarketPosition[]): HealthFactorData | null {
  if (positions.length === 0) return null;

  let totalCollateralValue = 0;
  let totalBorrowValue = 0;
  let weightedLltv = 0;

  positions.forEach(position => {
    const { state, market } = position;
    const collateralUsd = state.collateralUsd || 0;
    const borrowAssetsUsd = state.borrowAssetsUsd || 0;
    const lltv = parseFloat(market.lltv);

    totalCollateralValue += collateralUsd;
    totalBorrowValue += borrowAssetsUsd;

    // Weight LLTV by collateral value
    if (collateralUsd > 0) {
      weightedLltv += lltv * collateralUsd;
    }
  });

  // Calculate weighted average LLTV
  const avgLltv = totalCollateralValue > 0 ? weightedLltv / totalCollateralValue : 0;

  // If no borrow, health factor is infinite
  if (totalBorrowValue === 0) {
    return {
      value: Infinity,
      status: 'healthy',
      lltv: avgLltv,
      collateralUsd: totalCollateralValue,
      borrowAssetsUsd: 0,
    };
  }

  // Calculate aggregate health factor
  const healthFactor = (totalCollateralValue * avgLltv) / totalBorrowValue;

  // Determine status
  let status: 'healthy' | 'warning' | 'danger';
  if (healthFactor < 1.0) {
    status = 'danger';
  } else if (healthFactor < HEALTH_FACTOR_THRESHOLD) {
    status = 'warning';
  } else {
    status = 'healthy';
  }

  return {
    value: healthFactor,
    status,
    lltv: avgLltv,
    collateralUsd: totalCollateralValue,
    borrowAssetsUsd: totalBorrowValue,
  };
}

/**
 * Format health factor value for display
 */
export function formatHealthFactor(value: number): string {
  if (value === Infinity) {
    return '∞';
  }
  if (value > 100) {
    return '>100';
  }
  return value.toFixed(2);
}

/**
 * Format USD value
 */
export function formatUsdValue(value: number): string {
  const sign = value < 0 ? '-' : '';
  const absolute = Math.abs(value);

  if (absolute === 0) return '$0.00';
  if (absolute < 0.01) return `${sign}<${'$'}0.01`;
  if (absolute < 1) return `${sign}$${absolute.toFixed(4)}`;
  if (absolute < 1000) return `${sign}$${absolute.toFixed(2)}`;
  if (absolute < 1000000) {
    return `${sign}$${(absolute / 1000).toFixed(1)}K`;
  }
  return `${sign}$${(absolute / 1000000).toFixed(2)}M`;
}

/**
 * Format token amount
 */
export function formatTokenAmount(amount: string, decimals: number): string {
  const value = parseFloat(amount) / Math.pow(10, decimals);
  if (value === 0) return '0';
  if (value < 0.0001) return '<0.0001';
  if (value < 1) return value.toFixed(4);
  if (value < 1000) return value.toFixed(2);
  if (value < 1000000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return `${(value / 1000000).toFixed(2)}M`;
}

/**
 * Get color classes based on health factor status
 */
export function getHealthFactorColor(status: 'healthy' | 'warning' | 'danger'): string {
  switch (status) {
    case 'healthy':
      return 'text-success';
    case 'warning':
      return 'text-warning';
    case 'danger':
      return 'text-danger';
    default:
      return 'text-gray-500';
  }
}

export function getHealthFactorBgColor(status: 'healthy' | 'warning' | 'danger'): string {
  switch (status) {
    case 'healthy':
      return 'bg-success/10';
    case 'warning':
      return 'bg-warning/10';
    case 'danger':
      return 'bg-danger/10';
    default:
      return 'bg-gray-100';
  }
}

export interface PositionTotals {
  totalCollateralUsd: number;
  totalBorrowUsd: number;
  totalSuppliedUsd: number;
  netSupplyUsd: number;
}

export function calculatePositionTotals(positions: MarketPosition[]): PositionTotals {
  return positions.reduce<PositionTotals>((totals, position) => {
    const { state } = position;
    const collateral = state.collateralUsd || 0;
    const borrow = state.borrowAssetsUsd || 0;
    const supplied = state.supplyAssetsUsd || 0;

    totals.totalCollateralUsd += collateral;
    totals.totalBorrowUsd += borrow;
    totals.totalSuppliedUsd += supplied;
    totals.netSupplyUsd += supplied - borrow;

    return totals;
  }, {
    totalCollateralUsd: 0,
    totalBorrowUsd: 0,
    totalSuppliedUsd: 0,
    netSupplyUsd: 0,
  });
}

export function separatePositions(positions: MarketPosition[]): {
  lendingPositions: MarketPosition[];
  borrowingPositions: MarketPosition[];
} {
  const lendingPositions: MarketPosition[] = [];
  const borrowingPositions: MarketPosition[] = [];

  positions.forEach(position => {
    const { state } = position;

    const supplyAmount = parseFloat(state.supplyAssets || '0');
    const borrowAmount = parseFloat(state.borrowAssets || '0');
    const supplyUsd = state.supplyAssetsUsd || 0;
    const borrowUsd = state.borrowAssetsUsd || 0;

    if (supplyAmount > 0 || supplyUsd > 0) {
      lendingPositions.push(position);
    }

    if (borrowAmount > 0 || borrowUsd > 0) {
      borrowingPositions.push(position);
    }
  });

  return { lendingPositions, borrowingPositions };
}
