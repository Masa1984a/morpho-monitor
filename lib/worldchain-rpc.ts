import { createPublicClient, http, formatUnits } from 'viem';
import { MarketPosition } from '@/types/morpho';

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
const MORPHO_BLUE_ADDRESS = '0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb';

// Known Market IDs on World Chain (from Morpho Blue)
// You can find more at: https://app.morpho.org or by checking World Chain explorer
const KNOWN_MARKET_IDS: `0x${string}`[] = [
  // Main market provided by user
  '0xba0ae12a5cdbf9a458566be68055f30c859771612950b5e43428a51becc6f6e9',
  // Add more market IDs here as needed
];

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

  private constructor() {
    this.client = createPublicClient({
      chain: WORLD_CHAIN,
      transport: http()
    });
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
      console.error(`Failed to get token info for ${tokenAddress}:`, error);
      return {
        address: tokenAddress,
        symbol: 'UNKNOWN',
        decimals: 18
      };
    }
  }

  async getWLDPrice(): Promise<number> {
    const cacheKey = 'WLD-USD';
    const cached = this.priceCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.PRICE_CACHE_DURATION) {
      return cached.price;
    }

    try {
      const response = await fetch(
        'https://app-backend.worldcoin.dev/public/v1/miniapps/prices?cryptoCurrencies=WLD&fiatCurrencies=USD'
      );
      const data: PriceResponse = await response.json();

      const priceData = data.result.prices.WLD.USD;
      const price = parseFloat(priceData.amount) / Math.pow(10, priceData.decimals);

      this.priceCache.set(cacheKey, { price, timestamp: Date.now() });
      return price;
    } catch (error) {
      console.error('Failed to fetch WLD price:', error);
      return cached?.price || 0;
    }
  }

  // No longer needed - using known market IDs instead of event log scanning

  async getUserPositions(address: string): Promise<MarketPosition[]> {
    try {
      const userAddress = address as `0x${string}`;

      console.log(`[DEBUG] Checking positions for ${userAddress} across ${KNOWN_MARKET_IDS.length} known markets`);

      const positions: MarketPosition[] = [];

      // Check each known market ID
      for (const marketId of KNOWN_MARKET_IDS) {
        console.log(`[DEBUG] Checking market ${marketId}`);
        try {
          const position = await this.client.readContract({
            address: MORPHO_BLUE_ADDRESS,
            abi: MORPHO_BLUE_ABI,
            functionName: 'position',
            args: [marketId, userAddress]
          });

          console.log(`[DEBUG] Position data:`, {
            supplyShares: position[0].toString(),
            borrowShares: position[1].toString(),
            collateral: position[2].toString()
          });

          if (position && (position[0] > 0n || position[1] > 0n || position[2] > 0n)) {
            console.log(`[DEBUG] Found active position in market ${marketId}`);
            // Get market parameters
            const marketParams = await this.client.readContract({
              address: MORPHO_BLUE_ADDRESS,
              abi: MORPHO_BLUE_ABI,
              functionName: 'idToMarketParams',
              args: [marketId]
            }) as any;

            // Get market state
            const marketInfo = await this.client.readContract({
              address: MORPHO_BLUE_ADDRESS,
              abi: MORPHO_BLUE_ABI,
              functionName: 'market',
              args: [marketId]
            });

            // Get token info
            const [loanToken, collateralToken] = await Promise.all([
              this.getTokenInfo(marketParams[0]),
              this.getTokenInfo(marketParams[1])
            ]);

            // Convert shares to assets
            const supplyAssets = marketInfo[1] > 0n
              ? (position[0] * marketInfo[0]) / marketInfo[1]
              : 0n;
            const borrowAssets = marketInfo[3] > 0n
              ? (BigInt(position[1]) * marketInfo[2]) / marketInfo[3]
              : 0n;

            // Format amounts
            const collateralAmount = formatUnits(position[2], collateralToken.decimals);
            const supplyAmount = formatUnits(supplyAssets, loanToken.decimals);
            const borrowAmount = formatUnits(borrowAssets, loanToken.decimals);

            // Get price for USD conversion (simplified - only WLD for now)
            const wldPrice = await this.getWLDPrice();

            // Calculate USD values (simplified)
            const collateralUsd = collateralToken.symbol === 'WLD'
              ? parseFloat(collateralAmount) * wldPrice
              : 0;
            const supplyAssetsUsd = loanToken.symbol === 'USDC'
              ? parseFloat(supplyAmount)
              : 0;
            const borrowAssetsUsd = loanToken.symbol === 'USDC'
              ? parseFloat(borrowAmount)
              : 0;

            positions.push({
              market: {
                uniqueKey: marketId,
                lltv: formatUnits(marketParams[4], 18),
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
          } else {
            console.log(`[DEBUG] No position in market ${marketId} (all values are 0)`);
          }
        } catch (marketError) {
          console.error(`[ERROR] Error fetching position for market ${marketId}:`, marketError);
        }
      }

      console.log(`[DEBUG] Total positions found: ${positions.length}`);
      return positions;
    } catch (error) {
      console.error('[ERROR] Error fetching positions from World Chain:', error);
      throw error;
    }
  }
}
