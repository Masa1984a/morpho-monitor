// Token configuration for World Chain
// Source: technical_investigation_report.md section 3.2.1

import { Token } from '@/types/wallet';

export const WORLD_CHAIN_TOKENS: Token[] = [
  {
    address: '0x2cfc85d8e48f8eab294be644d9e25c3030863003',
    symbol: 'WLD',
    decimals: 18,
    name: 'Worldcoin'
  },
  {
    address: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1',
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin'
  },
  {
    address: '0x03c7054bcb39f7b2e5b2c7acb37583e32d70cfa3',
    symbol: 'WBTC',
    decimals: 8,
    name: 'Wrapped Bitcoin'
  },
  {
    address: '0x4200000000000000000000000000000000000006',
    symbol: 'WETH',
    decimals: 18,
    name: 'Wrapped Ether'
  }
];

// Helper function to get token by symbol
export function getTokenBySymbol(symbol: string): Token | undefined {
  return WORLD_CHAIN_TOKENS.find(token => token.symbol === symbol);
}

// Helper function to get token by address
export function getTokenByAddress(address: string): Token | undefined {
  return WORLD_CHAIN_TOKENS.find(
    token => token.address.toLowerCase() === address.toLowerCase()
  );
}

// Get all supported token addresses
export function getSupportedTokenAddresses(): `0x${string}`[] {
  return WORLD_CHAIN_TOKENS.map(token => token.address);
}
