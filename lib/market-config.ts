// Market configuration for Morpho markets on World Chain
export interface MarketConfig {
  marketName: string;
  marketId: `0x${string}`;
  collateralToken: {
    address: `0x${string}`;
    symbol: string;
    decimals: number;
  };
  loanToken: {
    address: `0x${string}`;
    symbol: string;
    decimals: number;
  };
  oracle: `0x${string}`;
  lltv: string;
  isActive: boolean;
}

// Market configurations for World Chain
// NOTE: To add more markets, you need to find the actual market IDs from:
// 1. Morpho Blue app: https://app.morpho.org
// 2. World Chain explorer: https://worldscan.org
// 3. Or by querying the Morpho Blue contract directly
export const MARKET_CONFIGS: MarketConfig[] = [
  // WLD→USDC - Currently active and verified
  {
    marketName: "WLD→USDC",
    marketId: "0xba0ae12a5cdbf9a458566be68055f30c859771612950b5e43428a51becc6f6e9",
    collateralToken: {
      address: "0x2cfc85d8e48f8eab294be644d9e25c3030863003",
      symbol: "WLD",
      decimals: 18
    },
    loanToken: {
      address: "0x79a02482a880bce3f13e09da970dc34db4cd24d1",
      symbol: "USDC",
      decimals: 6
    },
    oracle: "0x0000000000000000000000000000000000000000",
    lltv: "0.77",
    isActive: true
  },

  // Additional verified markets on World Chain - All active
  {
    marketName: "WETH→USDC",
    marketId: "0x5fadb14df6523eb13a939f8024dbc54b10bdb4e521741e9995e2951337134b53",
    collateralToken: {
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      decimals: 18
    },
    loanToken: {
      address: "0x79a02482a880bce3f13e09da970dc34db4cd24d1",
      symbol: "USDC",
      decimals: 6
    },
    oracle: "0x0000000000000000000000000000000000000000",
    lltv: "0.86",
    isActive: true
  },
  {
    marketName: "WETH→WLD",
    marketId: "0x296a8139fbd0e764a517d26956bb868a6c07b30c8627df5ad9a720963622bf37",
    collateralToken: {
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      decimals: 18
    },
    loanToken: {
      address: "0x2cfc85d8e48f8eab294be644d9e25c3030863003",
      symbol: "WLD",
      decimals: 18
    },
    oracle: "0x0000000000000000000000000000000000000000",
    lltv: "0.77",
    isActive: true
  },
  {
    marketName: "WBTC→WLD",
    marketId: "0x14f297e80b8d7410ad506f80f2d747ff9eb0d9d44ab8c298a444219fcaf3c2f2",
    collateralToken: {
      address: "0x03c7054bcb39f7b2e5b2c7acb37583e32d70cfa3",
      symbol: "WBTC",
      decimals: 8
    },
    loanToken: {
      address: "0x2cfc85d8e48f8eab294be644d9e25c3030863003",
      symbol: "WLD",
      decimals: 18
    },
    oracle: "0x0000000000000000000000000000000000000000",
    lltv: "0.77",
    isActive: true
  },
  {
    marketName: "WBTC→WETH",
    marketId: "0x19c682c3a37025075074cefea866fbe54656abc0fb6a7355b62a53f45b959abf",
    collateralToken: {
      address: "0x03c7054bcb39f7b2e5b2c7acb37583e32d70cfa3",
      symbol: "WBTC",
      decimals: 8
    },
    loanToken: {
      address: "0x4200000000000000000000000000000000000006",
      symbol: "WETH",
      decimals: 18
    },
    oracle: "0x0000000000000000000000000000000000000000",
    lltv: "0.91",
    isActive: true
  },
  {
    marketName: "WBTC→USDC",
    marketId: "0x787c5ff694f04e20cc6b3932cd662425161109bb0d63b189c48d99e714a3bd69",
    collateralToken: {
      address: "0x03c7054bcb39f7b2e5b2c7acb37583e32d70cfa3",
      symbol: "WBTC",
      decimals: 8
    },
    loanToken: {
      address: "0x79a02482a880bce3f13e09da970dc34db4cd24d1",
      symbol: "USDC",
      decimals: 6
    },
    oracle: "0x0000000000000000000000000000000000000000",
    lltv: "0.86",
    isActive: true
  },
];

// Get active market IDs
export function getActiveMarketIds(): `0x${string}`[] {
  return MARKET_CONFIGS
    .filter(config => config.isActive)
    .map(config => config.marketId);
}

// Get market config by ID
export function getMarketConfigById(marketId: string): MarketConfig | undefined {
  return MARKET_CONFIGS.find(config => config.marketId === marketId);
}

// Get market config by token pair
export function getMarketConfigByPair(
  collateralSymbol: string,
  loanSymbol: string
): MarketConfig | undefined {
  return MARKET_CONFIGS.find(
    config =>
      config.collateralToken.symbol === collateralSymbol &&
      config.loanToken.symbol === loanSymbol
  );
}
