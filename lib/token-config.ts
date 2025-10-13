// Token configuration for World Chain
// Source: technical_investigation_report.md section 3.2.1

import { Token } from '@/types/wallet';

export const WORLD_CHAIN_TOKENS: Token[] = [
  // WLD is excluded here as it's fetched separately via WorldAppVaultClient
  // which retrieves both Vault (locked) and Spending (liquid) balances from OP + World Chain
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
  },
  // Universal Protocol Assets
  {
    address: '0x9B8Df6E244526ab5F6e6400d331DB28C8fdDdb55',
    symbol: 'uSOL',
    decimals: 18,
    name: 'Universal SOL'
  },
  {
    address: '0x12E96C2BFEA6E835CF8Dd38a5834fa61Cf723736',
    symbol: 'uDOGE',
    decimals: 18,
    name: 'Universal DOGE'
  },
  {
    address: '0x2615a94df961278DcbC41Fb0a54fEc5f10a693aE',
    symbol: 'uXRP',
    decimals: 18,
    name: 'Universal XRP'
  },
  {
    address: '0xb0505e5a99abd03d94a1169e638B78EDfEd26ea4',
    symbol: 'uSUI',
    decimals: 18,
    name: 'Universal SUI'
  },
  {
    address: '0x378c326A472915d38b2D8D41e1345987835FaB64',
    symbol: 'uXLM',
    decimals: 18,
    name: 'Universal XLM'
  },
  {
    address: '0x3EB097375fc2FC361e4a472f5E7067238c547c52',
    symbol: 'uLTC',
    decimals: 18,
    name: 'Universal LTC'
  },
  {
    address: '0x239b9C1F24F3423062B0d364796e07Ee905E9FcE',
    symbol: 'uSHIB',
    decimals: 18,
    name: 'Universal SHIB'
  },
  {
    address: '0xa3A34A0D9A08CCDDB6Ed422Ac0A28a06731335aA',
    symbol: 'uADA',
    decimals: 18,
    name: 'Universal ADA'
  },
  {
    address: '0xd403D1624DAEF243FbcBd4A80d8A6F36afFe32b2',
    symbol: 'uLINK',
    decimals: 18,
    name: 'Universal LINK'
  },
  // Other Tokens
  {
    address: '0xcd1E32B86953D79a6AC58e813D2EA7a1790cAb63',
    symbol: 'ORO',
    decimals: 18,
    name: 'ORO'
  },
  {
    address: '0xf3f92a60e6004f3982f0fde0d43602fc0a30a0db',
    symbol: 'ORB',
    decimals: 18,
    name: 'Orb'
  },
  {
    address: '0x30974f73a4ac9e606ed80da928e454977ac486d2',
    symbol: 'oXAUt',
    decimals: 6,
    name: 'Tether Gold'
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
