// Wallet and Token Balance Types

export interface Token {
  address: `0x${string}`;
  symbol: string;
  decimals: number;
  name?: string;
}

export interface TokenBalance extends Token {
  balance: string; // Formatted with decimals (e.g., "100.5")
  balanceRaw: bigint; // Raw balance from contract
  balanceUsd: number;
  priceUsd: number;
}

export interface NativeBalance {
  symbol: 'ETH';
  balance: string;
  balanceRaw: bigint;
  balanceUsd: number;
  priceUsd: number;
}

// WLD Vault Balance (Locked WLD earning interest)
export interface WLDVaultBalance {
  amountNow: string;           // Current balance including interest
  principal: string;           // Original deposited amount
  accruedInterest: string;     // Accrued interest
  amountNowUsd: number;
  principalUsd: number;
  accruedInterestUsd: number;
  symbol: 'WLD';
}

// WLD Spending Balance (Liquid WLD available for transactions)
export interface WLDSpendingBalance {
  balance: string;
  balanceUsd: number;
  symbol: 'WLD';
}
