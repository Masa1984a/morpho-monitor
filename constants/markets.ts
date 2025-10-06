/**
 * Market Configuration for Morpho Blue on World Chain
 * Contract Address: 0xe741bc7c34758b4cae05062794e8ae24978af432
 */

export interface MarketConfig {
  id: `0x${string}`; // Market ID (keccak256 hash)
  collateralToken: `0x${string}`; // Collateral token address
  loanToken: `0x${string}`; // Loan token address
  lltv: string; // Liquidation LTV (e.g., "0.75" for 75%)
  symbol: string; // UI display symbol (e.g., 'WLD->USDC')
  isOptional?: boolean; // If true, market will be validated at runtime
}

// Token addresses on World Chain
export const TOKEN_ADDRESSES = {
  WLD: '0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1',
  WETH: '0x4200000000000000000000000000000000000006',
  WBTC: '0x101d8242843712bf0e402e6f2d90fa50c3d61e5e',
  USDC: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
} as const;

export const TOKEN_SYMBOLS: Record<string, string> = {
  [TOKEN_ADDRESSES.WLD]: 'WLD',
  [TOKEN_ADDRESSES.WETH]: 'WETH',
  [TOKEN_ADDRESSES.WBTC]: 'WBTC',
  [TOKEN_ADDRESSES.USDC]: 'USDC',
};

/**
 * Known Morpho Blue markets on World Chain
 * Market IDs are from the official Morpho Blue deployment
 */
export const MARKETS: MarketConfig[] = [
  // WLD -> USDC (confirmed)
  {
    id: '0xba0ae12a5cdbf9a458566be68055f30c859771612950b5e43428a51becc6f6e9',
    collateralToken: TOKEN_ADDRESSES.WLD,
    loanToken: TOKEN_ADDRESSES.USDC,
    lltv: '0.75', // 75%
    symbol: 'WLD->USDC',
  },
  // WETH -> USDC (confirmed)
  {
    id: '0x8793cf302b8ffd655ab97bd1c695dbd967807e8367a65cb2f4edaf1380ba1bda',
    collateralToken: TOKEN_ADDRESSES.WETH,
    loanToken: TOKEN_ADDRESSES.USDC,
    lltv: '0.86', // 86%
    symbol: 'WETH->USDC',
  },
  // WBTC -> USDC (confirmed)
  {
    id: '0x3a85e619751152991742810df6ec69ce473daef99e28a64ab2340d7b7ccfee49',
    collateralToken: TOKEN_ADDRESSES.WBTC,
    loanToken: TOKEN_ADDRESSES.USDC,
    lltv: '0.86', // 86%
    symbol: 'WBTC->USDC',
  },
  // WBTC -> WETH (confirmed)
  {
    id: '0x138eec0e4a1937eb92ebc70043ed539661dd7ed5a89fb92a720b341650288a40',
    collateralToken: TOKEN_ADDRESSES.WBTC,
    loanToken: TOKEN_ADDRESSES.WETH,
    lltv: '0.86', // 86%
    symbol: 'WBTC->WETH',
  },
  // WETH -> WLD (optional - needs runtime validation)
  {
    id: '0x0000000000000000000000000000000000000000000000000000000000000000', // Will be validated at runtime
    collateralToken: TOKEN_ADDRESSES.WETH,
    loanToken: TOKEN_ADDRESSES.WLD,
    lltv: '0.70', // 70% (estimated for volatile pairs)
    symbol: 'WETH->WLD',
    isOptional: true,
  },
  // WBTC -> WLD (optional - needs runtime validation)
  {
    id: '0x0000000000000000000000000000000000000000000000000000000000000000', // Will be validated at runtime
    collateralToken: TOKEN_ADDRESSES.WBTC,
    loanToken: TOKEN_ADDRESSES.WLD,
    lltv: '0.70', // 70% (estimated for volatile pairs)
    symbol: 'WBTC->WLD',
    isOptional: true,
  },
];

/**
 * Get confirmed markets (non-optional)
 */
export function getConfirmedMarkets(): MarketConfig[] {
  return MARKETS.filter(m => !m.isOptional);
}

/**
 * Get optional markets that need validation
 */
export function getOptionalMarkets(): MarketConfig[] {
  return MARKETS.filter(m => m.isOptional);
}

/**
 * Get all market IDs for confirmed markets
 */
export function getConfirmedMarketIds(): `0x${string}`[] {
  return getConfirmedMarkets().map(m => m.id);
}
