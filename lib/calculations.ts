import { MarketPosition, HealthFactorData } from '@/types/morpho';

export interface HealthFactorThresholds {
  warningThreshold: number;
  dangerThreshold: number;
}

const DEFAULT_THRESHOLDS: HealthFactorThresholds = {
  warningThreshold: 1.5,
  dangerThreshold: 1.2,
};

/**
 * Calculate health factor for a position
 * Health Factor = (Collateral Value × LLTV) / Borrow Value
 */
export function calculateHealthFactor(
  position: MarketPosition,
  thresholds: HealthFactorThresholds = DEFAULT_THRESHOLDS
): HealthFactorData {
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

  // Determine status based on thresholds
  let status: 'healthy' | 'warning' | 'danger';
  if (healthFactor < thresholds.dangerThreshold) {
    status = 'danger'; // Below danger threshold
  } else if (healthFactor < thresholds.warningThreshold) {
    status = 'warning'; // Below warning threshold
  } else {
    status = 'healthy'; // Above warning threshold
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
export function calculateAggregateHealthFactor(
  positions: MarketPosition[],
  thresholds: HealthFactorThresholds = DEFAULT_THRESHOLDS
): HealthFactorData | null {
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

  // Determine status based on thresholds
  let status: 'healthy' | 'warning' | 'danger';
  if (healthFactor < thresholds.dangerThreshold) {
    status = 'danger';
  } else if (healthFactor < thresholds.warningThreshold) {
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
  if (value === 0) return '$0.00';
  if (value < 0.01) return '<$0.01';
  if (value < 1) return `$${value.toFixed(4)}`;
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Format token amount (amount is already formatted as string)
 */
export function formatTokenAmount(amount: string, decimals: number): string {
  const value = parseFloat(amount);
  if (value === 0) return '0';
  if (value < 0.0001) return '<0.0001';
  if (value < 1) return value.toFixed(4);
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
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