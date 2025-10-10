// Morpho API Types

export interface Asset {
  address: string;
  symbol: string;
  decimals: number;
}

export interface Market {
  uniqueKey: string;
  lltv: string; // Liquidation Loan-to-Value as string (e.g., "0.77")
  loanAsset: Asset;
  collateralAsset: Asset;
}

export interface MarketState {
  collateral: string;
  collateralUsd: number;
  borrowAssets: string;
  borrowAssetsUsd: number;
  borrowShares: string;
  supplyAssets: string;
  supplyAssetsUsd: number;
  supplyShares: string;
}

export interface MarketPosition {
  market: Market;
  state: MarketState;
}

export interface UserData {
  address: string;
  marketPositions: MarketPosition[];
}

export interface UserByAddressResponse {
  userByAddress?: UserData;
}

export interface HealthFactorData {
  value: number;
  status: 'healthy' | 'warning' | 'danger';
  lltv: number;
  collateralUsd: number;
  borrowAssetsUsd: number;
}

// Lend Position Types
export interface LendPosition {
  type: 'lend';
  market: Market;
  state: {
    supplyAssets: string;
    supplyAssetsUsd: number;
    supplyShares: string;
  };
  apy?: number; // Optional for now - requires IRM contract calls
  marketUtilization?: number; // Optional - calculated from market info
}

export interface BorrowPosition {
  type: 'borrow';
  market: Market;
  state: MarketState;
}

// Union type for all position types
export type MorphoPositionType = LendPosition | BorrowPosition;