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
  {
    address: '0x6814e4BE03aEB33fe135Fe0e85CA6b0A03247519',
    symbol: 'uPNUT',
    decimals: 18,
    name: 'Universal PNUT'
  },
  {
    address: '0xd6a34b430C05ac78c24985f8abEE2616BC1788Cb',
    symbol: 'uAVAX',
    decimals: 18,
    name: 'Universal AVAX'
  },
  {
    address: '0xc79e06860Aa9564f95E08fb7E5b61458d0C63898',
    symbol: 'uHBAR',
    decimals: 18,
    name: 'Universal HBAR'
  },
  {
    address: '0xc79e06860Aa9564f95E08fb7E5b61458d0C63898',
    symbol: 'uDOT',
    decimals: 18,
    name: 'Universal DOT'
  },
  {
    address: '0xfb3CB973B2a9e2E09746393C59e7FB0d5189d290',
    symbol: 'uUNI',
    decimals: 18,
    name: 'Universal UNI'
  },
  {
    address: '0xE5c436B0a34DF18F1dae98af344Ca5122E7d57c4',
    symbol: 'uPEPE',
    decimals: 18,
    name: 'Universal PEPE'
  },
  {
    address: '0xf383074c4B993d1ccd196188d27D0dDf22AD463c',
    symbol: 'uAAVE',
    decimals: 18,
    name: 'Universal AAVE'
  },
  {
    address: '0x90131D95a9a5b48b6a3eE0400807248bEcf4B7A4',
    symbol: 'uONDO',
    decimals: 18,
    name: 'Universal ONDO'
  },
  {
    address: '0xf653E8B6Fcbd2A63246c6B7722d1e9d819611241',
    symbol: 'uCRO',
    decimals: 18,
    name: 'Universal CRO'
  },
  {
    address: '0x5ed25E305E08F58AFD7995EaC72563E6BE65A617',
    symbol: 'uNEAR',
    decimals: 18,
    name: 'Universal NEAR'
  },
  {
    address: '0x9c0e042d65a2e1fF31aC83f404E5Cb79F452c337',
    symbol: 'uAPT',
    decimals: 18,
    name: 'Universal APT'
  },
  {
    address: '0xD01CB4171A985571dEFF48c9dC2F6E153A244d64',
    symbol: 'uARB',
    decimals: 18,
    name: 'Universal ARB'
  },
  {
    address: '0x40318eE213227894b5316E5EC84f6a5caf3bBEDd',
    symbol: 'uICP',
    decimals: 18,
    name: 'Universal ICP'
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
  },
  {
    address: '0xab09a728e53d3d6bc438be95eed46da0bbe7fb38',
    symbol: 'SUSHI',
    decimals: 18,
    name: 'SUSHI Token'
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
