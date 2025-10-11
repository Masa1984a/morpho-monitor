// Transaction history types for Morpho Blue

export interface TransactionEvent {
  event: 'Borrow' | 'Repay' | 'SupplyCollateral' | 'Liquidate';
  timestamp: string;
  block: number;
  txHash: string;
  marketId: string;
  marketName: string;
  collateral?: {
    amount: string;
    symbol: string;
    direction: '+' | '-';
  };
  loan?: {
    amount: string;
    symbol: string;
    direction: '+' | '-';
  };
}
