import { createPublicClient, http, formatUnits } from 'viem';
import { MarketPosition } from '@/types/morpho';
import { getActiveMarketIds } from './market-config';

// World Chain configuration
const WORLD_CHAIN = {
  id: 480,
  name: 'World Chain',
  network: 'worldchain',
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://worldchain-mainnet.g.alchemy.com/public'] }
  },
  blockExplorers: {
    default: { name: 'Worldscan', url: 'https://worldscan.org' }
  }
} as const;

// Morpho Blue contract address on World Chain
// Correct address (0xBBBBB... is for other chains)
const MORPHO_BLUE_ADDRESS = '0xe741bc7c34758b4cae05062794e8ae24978af432';

// Get known market IDs from configuration
const KNOWN_MARKET_IDS: `0x${string}`[] = getActiveMarketIds();

// Minimal Morpho Blue ABI for reading positions
const MORPHO_BLUE_ABI = [
  {
    type: 'function',
    name: 'position',
    stateMutability: 'view',
    inputs: [
      { name: 'id', type: 'bytes32' },
      { name: 'user', type: 'address' }
    ],
    outputs: [
      { name: 'supplyShares', type: 'uint256' },
      { name: 'borrowShares', type: 'uint128' },
      { name: 'collateral', type: 'uint128' }
    ]
  },
  {
    type: 'function',
    name: 'market',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'bytes32' }],
    outputs: [
      { name: 'totalSupplyAssets', type: 'uint128' },
      { name: 'totalSupplyShares', type: 'uint128' },
      { name: 'totalBorrowAssets', type: 'uint128' },
      { name: 'totalBorrowShares', type: 'uint128' },
      { name: 'lastUpdate', type: 'uint128' },
      { name: 'fee', type: 'uint128' }
    ]
  },
  {
    type: 'function',
    name: 'idToMarketParams',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'bytes32' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'loanToken', type: 'address' },
        { name: 'collateralToken', type: 'address' },
        { name: 'oracle', type: 'address' },
        { name: 'irm', type: 'address' },
        { name: 'lltv', type: 'uint256' }
      ]
    }]
  },
  {
    type: 'event',
    name: 'CreateMarket',
    inputs: [
      { name: 'id', type: 'bytes32', indexed: true }
    ]
  },
  {
    type: 'event',
    name: 'Supply',
    inputs: [
      { name: 'id', type: 'bytes32', indexed: true },
      { name: 'caller', type: 'address', indexed: false },
      { name: 'onBehalf', type: 'address', indexed: true },
      { name: 'assets', type: 'uint256', indexed: false },
      { name: 'shares', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'Borrow',
    inputs: [
      { name: 'id', type: 'bytes32', indexed: true },
      { name: 'caller', type: 'address', indexed: false },
      { name: 'onBehalf', type: 'address', indexed: true },
      { name: 'receiver', type: 'address', indexed: false },
      { name: 'assets', type: 'uint256', indexed: false },
      { name: 'shares', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'SupplyCollateral',
    inputs: [
      { name: 'id', type: 'bytes32', indexed: true },
      { name: 'caller', type: 'address', indexed: false },
      { name: 'onBehalf', type: 'address', indexed: true },
      { name: 'assets', type: 'uint256', indexed: false }
    ]
  }
] as const;

// ERC20 ABI for token metadata
const ERC20_ABI = [
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }]
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }]
  }
] as const;

// Oracle ABI for price feeds
const ORACLE_ABI = [
  {
    type: 'function',
    name: 'price',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'latestAnswer',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'int256' }]
  }
] as const;

// World App Price API
interface PriceResponse {
  result: {
    prices: {
      [crypto: string]: {
        [fiat: string]: {
          asset: string;
          amount: string;
          decimals: number;
          symbol: string;
        };
      };
    };
  };
}

interface TokenInfo {
  address: string;
  symbol: string;
  decimals: number;
}

export class WorldChainRPCClient {
  private static instance: WorldChainRPCClient;
  private client;
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private tokenCache: Map<string, TokenInfo> = new Map();
  private readonly PRICE_CACHE_DURATION = 60000; // 1 minute
  public debugLogs: string[] = [];

  private constructor() {
    this.client = createPublicClient({
      chain: WORLD_CHAIN,
      transport: http()
    });
  }

  private log(message: string) {
    console.log(message);
    this.debugLogs.push(message);
  }

  clearDebugLogs() {
    this.debugLogs = [];
  }

  static getInstance(): WorldChainRPCClient {
    if (!WorldChainRPCClient.instance) {
      WorldChainRPCClient.instance = new WorldChainRPCClient();
    }
    return WorldChainRPCClient.instance;
  }

  private async getTokenInfo(tokenAddress: `0x${string}`): Promise<TokenInfo> {
    const cached = this.tokenCache.get(tokenAddress);
    if (cached) return cached;

    try {
      const [symbol, decimals] = await Promise.all([
        this.client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol'
        }),
        this.client.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'decimals'
        })
      ]);

      const tokenInfo: TokenInfo = {
        address: tokenAddress,
        symbol,
        decimals
      };

      this.tokenCache.set(tokenAddress, tokenInfo);
      return tokenInfo;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log(`  ERROR getting token info for ${tokenAddress}: ${errorMsg}`);
      console.error(`Failed to get token info for ${tokenAddress}:`, error);
      return {
        address: tokenAddress,
        symbol: 'UNKNOWN',
        decimals: 18
      };
    }
  }

  async getPriceFromOracle(
    oracleAddress: `0x${string}`,
    loanDecimals: number,
    collateralDecimals: number
  ): Promise<number> {
    try {
      this.log(`  Reading price from oracle: ${oracleAddress}`);

      // Try Morpho Oracle interface first (price())
      try {
        const priceResult = await this.client.readContract({
          address: oracleAddress,
          abi: ORACLE_ABI,
          functionName: 'price'
        }) as bigint;

        // Morpho oracles return: USDC per WLD * 10^(36 + loanDecimals - collateralDecimals)
        // For WLD/USDC: scale = 36 + 6 - 18 = 24
        const scale = 36 + loanDecimals - collateralDecimals;
        const price = Number(priceResult) / Math.pow(10, scale);
        this.log(`  Oracle price raw: ${priceResult.toString()}`);
        this.log(`  Scale: 10^${scale} (36 + ${loanDecimals} - ${collateralDecimals})`);
        this.log(`  Oracle price calculated: $${price}`);
        return price;
      } catch (e) {
        this.log(`  price() method failed, trying latestAnswer()...`);
      }

      // Try Chainlink interface (latestAnswer())
      try {
        const answer = await this.client.readContract({
          address: oracleAddress,
          abi: ORACLE_ABI,
          functionName: 'latestAnswer'
        }) as bigint;

        // Chainlink typically uses 8 decimals
        const price = Number(answer) / 1e8;
        this.log(`  Oracle price (via latestAnswer()): ${answer.toString()} -> $${price}`);
        return price;
      } catch (e) {
        this.log(`  latestAnswer() method failed`);
      }

      return 0;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.log(`  ERROR reading oracle: ${errorMsg}`);
      return 0;
    }
  }

  // Fetch World Coin API supported tokens (WLD, USDC) in batch via proxy
  private async fetchWorldCoinPrices(): Promise<void> {
    try {
      this.log(`  Fetching WLD, USDC prices from World Coin API (batch via proxy)...`);

      // Use our Next.js API Route as proxy to avoid CORS issues
      const response = await fetch(
        `/api/prices?cryptoCurrencies=WLD,USDC&fiatCurrencies=USD`
      );

      if (response.ok) {
        const data: PriceResponse = await response.json();
        this.log(`  World Coin API batch response: ${JSON.stringify(data).substring(0, 200)}...`);

        // Cache WLD price
        const wldPrice = data.result.prices.WLD?.USD;
        if (wldPrice) {
          const price = parseFloat(wldPrice.amount) / Math.pow(10, wldPrice.decimals);
          this.priceCache.set('WLD-USD', { price, timestamp: Date.now() });
          this.log(`  WLD price from World Coin API: $${price}`);
        }

        // Cache USDC price
        const usdcPrice = data.result.prices.USDC?.USD;
        if (usdcPrice) {
          const price = parseFloat(usdcPrice.amount) / Math.pow(10, usdcPrice.decimals);
          this.priceCache.set('USDC-USD', { price, timestamp: Date.now() });
          this.log(`  USDC price from World Coin API: $${price}`);
        }
      } else {
        this.log(`  World Coin API proxy error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      this.log(`  World Coin API proxy failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Fetch CoinGecko prices for WBTC and WETH
  private async fetchCoinGeckoPrices(): Promise<void> {
    try {
      this.log(`  Fetching WBTC, WETH prices from CoinGecko API (batch)...`);

      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin,weth&vs_currencies=usd`
      );

      if (response.ok) {
        const data = await response.json();
        this.log(`  CoinGecko API batch response received`);

        // Cache WBTC price
        const wbtcPrice = data['wrapped-bitcoin']?.usd;
        if (wbtcPrice && typeof wbtcPrice === 'number') {
          this.priceCache.set('WBTC-USD', { price: wbtcPrice, timestamp: Date.now() });
          this.log(`  WBTC price from CoinGecko: $${wbtcPrice}`);
        }

        // Cache WETH price
        const wethPrice = data.weth?.usd;
        if (wethPrice && typeof wethPrice === 'number') {
          this.priceCache.set('WETH-USD', { price: wethPrice, timestamp: Date.now() });
          this.log(`  WETH price from CoinGecko: $${wethPrice}`);
        }
      } else {
        this.log(`  CoinGecko API batch error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      this.log(`  CoinGecko API batch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTokenPrice(symbol: string): Promise<number> {
    const cacheKey = `${symbol}-USD`;
    const cached = this.priceCache.get(cacheKey);

    // Return cached price if still valid
    if (cached && Date.now() - cached.timestamp < this.PRICE_CACHE_DURATION) {
      this.log(`  Using cached ${symbol} price: $${cached.price}`);
      return cached.price;
    }

    // If not cached or expired, fetch prices based on token
    if (symbol === 'WLD' || symbol === 'USDC') {
      this.log(`  ${symbol} price not in cache or expired, fetching from World Coin API...`);
      await this.fetchWorldCoinPrices();
    } else if (symbol === 'WBTC' || symbol === 'WETH') {
      this.log(`  ${symbol} price not in cache or expired, fetching from CoinGecko API...`);
      await this.fetchCoinGeckoPrices();
    }

    // Try to get the price from cache after fetching
    const newCached = this.priceCache.get(cacheKey);
    if (newCached) {
      return newCached.price;
    }

    // If still not available, return 0
    this.log(`  ⚠️  Failed to get ${symbol} price, returning 0`);
    return 0;
  }

  // No longer needed - using known market IDs instead of event log scanning

  async getUserPositions(address: string): Promise<MarketPosition[]> {
    this.clearDebugLogs();

    try {
      const userAddress = address as `0x${string}`;

      this.log(`Checking ${KNOWN_MARKET_IDS.length} known market(s)`);
      this.log(`User address: ${userAddress}`);
      this.log(`Morpho Blue: ${MORPHO_BLUE_ADDRESS}`);

      const positions: MarketPosition[] = [];

      // Check each known market ID
      for (const marketId of KNOWN_MARKET_IDS) {
        this.log(`\nChecking market: ${marketId}`);
        try {
          const position = await this.client.readContract({
            address: MORPHO_BLUE_ADDRESS,
            abi: MORPHO_BLUE_ABI,
            functionName: 'position',
            args: [marketId, userAddress]
          });

          this.log(`  Supply shares: ${position[0].toString()}`);
          this.log(`  Borrow shares: ${position[1].toString()}`);
          this.log(`  Collateral: ${position[2].toString()}`);

          if (position && (position[0] > 0n || position[1] > 0n || position[2] > 0n)) {
            this.log(`  ✓ Active position found!`);

            try {
              // Get market parameters
              const marketParams = await this.client.readContract({
                address: MORPHO_BLUE_ADDRESS,
                abi: MORPHO_BLUE_ABI,
                functionName: 'idToMarketParams',
                args: [marketId]
              }) as any;

              this.log(`  Loan token: ${marketParams.loanToken}`);
              this.log(`  Collateral token: ${marketParams.collateralToken}`);
              this.log(`  LLTV: ${formatUnits(marketParams.lltv, 18)}`);

              // Get market state
              const marketInfo = await this.client.readContract({
                address: MORPHO_BLUE_ADDRESS,
                abi: MORPHO_BLUE_ABI,
                functionName: 'market',
                args: [marketId]
              });

              this.log(`  Market info received`);

              // Get token info (using named properties, not array indices)
              const [loanToken, collateralToken] = await Promise.all([
                this.getTokenInfo(marketParams.loanToken),
                this.getTokenInfo(marketParams.collateralToken)
              ]);

              this.log(`  Tokens: ${loanToken.symbol}/${collateralToken.symbol}`);
              this.log(`  Token decimals: ${loanToken.decimals}/${collateralToken.decimals}`);

              // Convert shares to assets
              const supplyAssets = marketInfo[1] > 0n
                ? (position[0] * marketInfo[0]) / marketInfo[1]
                : 0n;
              const borrowAssets = marketInfo[3] > 0n
                ? (BigInt(position[1]) * marketInfo[2]) / marketInfo[3]
                : 0n;

              this.log(`  Raw values - Supply: ${supplyAssets}, Borrow: ${borrowAssets}, Collateral: ${position[2]}`);

              // Format amounts
              const collateralAmount = formatUnits(position[2], collateralToken.decimals);
              const supplyAmount = formatUnits(supplyAssets, loanToken.decimals);
              const borrowAmount = formatUnits(borrowAssets, loanToken.decimals);

              this.log(`  Formatted - Supply: ${supplyAmount}, Borrow: ${borrowAmount}, Collateral: ${collateralAmount}`);

              // Get prices for collateral and loan tokens
              let collateralPrice = 0;
              let loanPrice = 0;

              // Try oracle first if available (for collateral/loan price ratio)
              if (marketParams.oracle !== '0x0000000000000000000000000000000000000000') {
                const oraclePrice = await this.getPriceFromOracle(
                  marketParams.oracle,
                  loanToken.decimals,
                  collateralToken.decimals
                );
                if (oraclePrice > 0) {
                  this.log(`  Using oracle price ratio: ${oraclePrice}`);
                  // Oracle gives us loan/collateral ratio, we need absolute prices
                  // For now, fall back to API for absolute prices
                }
              }

              // Get token prices from API
              collateralPrice = await this.getTokenPrice(collateralToken.symbol);
              loanPrice = await this.getTokenPrice(loanToken.symbol);

              this.log(`  Token prices - ${collateralToken.symbol}: $${collateralPrice}, ${loanToken.symbol}: $${loanPrice}`);

              // Calculate USD values
              const collateralUsd = parseFloat(collateralAmount) * collateralPrice;
              const supplyAssetsUsd = parseFloat(supplyAmount) * loanPrice;
              const borrowAssetsUsd = parseFloat(borrowAmount) * loanPrice;

              this.log(`  USD values - Collateral: $${collateralUsd}, Supply: $${supplyAssetsUsd}, Borrow: $${borrowAssetsUsd}`);

              positions.push({
                market: {
                  uniqueKey: marketId,
                  lltv: formatUnits(marketParams.lltv, 18),
                  loanAsset: {
                    address: loanToken.address,
                    symbol: loanToken.symbol,
                    decimals: loanToken.decimals
                  },
                  collateralAsset: {
                    address: collateralToken.address,
                    symbol: collateralToken.symbol,
                    decimals: collateralToken.decimals
                  }
                },
                state: {
                  collateral: collateralAmount,
                  collateralUsd,
                  borrowAssets: borrowAmount,
                  borrowAssetsUsd,
                  borrowShares: position[1].toString(),
                  supplyAssets: supplyAmount,
                  supplyAssetsUsd,
                  supplyShares: position[0].toString()
                }
              });

              this.log(`  ✓ Position processed successfully!`);
            } catch (innerError) {
              this.log(`  ERROR processing position: ${innerError instanceof Error ? innerError.message : String(innerError)}`);
            }
          } else {
            this.log(`  No position (all values are 0)`);
          }
        } catch (marketError) {
          this.log(`  ERROR: ${marketError instanceof Error ? marketError.message : String(marketError)}`);
        }
      }

      this.log(`\n=== TOTAL: ${positions.length} position(s) found ===`);
      return positions;
    } catch (error) {
      this.log(`FATAL ERROR: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
