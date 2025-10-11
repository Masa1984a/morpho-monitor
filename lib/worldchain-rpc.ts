import { createPublicClient, http, formatUnits } from 'viem';
import { MarketPosition } from '@/types/morpho';
import { getActiveMarketIds } from './market-config';
import { METAMORPHO_VAULTS, type MetaMorphoVault } from './metamorpho-config';

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
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11' as `0x${string}`,
      blockCreated: 0
    }
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
  },
  {
    type: 'event',
    name: 'Repay',
    inputs: [
      { name: 'id', type: 'bytes32', indexed: true },
      { name: 'caller', type: 'address', indexed: true },
      { name: 'onBehalf', type: 'address', indexed: true },
      { name: 'assets', type: 'uint256', indexed: false },
      { name: 'shares', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'Liquidate',
    inputs: [
      { name: 'id', type: 'bytes32', indexed: true },
      { name: 'liquidator', type: 'address', indexed: true },
      { name: 'borrower', type: 'address', indexed: true },
      { name: 'repaidAssets', type: 'uint256', indexed: false },
      { name: 'repaidShares', type: 'uint256', indexed: false },
      { name: 'seizedAssets', type: 'uint256', indexed: false },
      { name: 'badDebtAssets', type: 'uint256', indexed: false },
      { name: 'badDebtShares', type: 'uint256', indexed: false }
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
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;

// MetaMorpho Vault ABI for Earn positions
const METAMORPHO_VAULT_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'convertToAssets',
    stateMutability: 'view',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'asset',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'totalAssets',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
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

// Unified Price API Response
interface PriceResponse {
  WLD?: number;
  USDC?: number;
  WBTC?: number;
  WETH?: number;
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
  private externalLogger?: (message: string) => void;

  private constructor() {
    this.client = createPublicClient({
      chain: WORLD_CHAIN,
      transport: http()
    });
  }

  public setExternalLogger(logger: (message: string) => void) {
    this.externalLogger = logger;
  }

  private log(message: string) {
    console.log(message);
    this.debugLogs.push(message);
    if (this.externalLogger) {
      this.externalLogger(message);
    }
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

  // Fetch all crypto prices via unified API proxy
  private async fetchAllPrices(): Promise<void> {
    try {
      this.log(`  Fetching all crypto prices (WLD, USDC, WBTC, WETH) via unified API...`);

      // Use our Next.js API Route as proxy to avoid CORS issues
      const response = await fetch('/api/prices');

      if (response.ok) {
        const data: PriceResponse = await response.json();
        this.log(`  Unified API response: ${JSON.stringify(data).substring(0, 200)}...`);

        // Cache all prices from unified API
        const timestamp = Date.now();

        if (data.WLD && typeof data.WLD === 'number') {
          this.priceCache.set('WLD-USD', { price: data.WLD, timestamp });
          this.log(`  WLD price: $${data.WLD}`);
        }

        if (data.USDC && typeof data.USDC === 'number') {
          this.priceCache.set('USDC-USD', { price: data.USDC, timestamp });
          this.log(`  USDC price: $${data.USDC}`);
        }

        if (data.WBTC && typeof data.WBTC === 'number') {
          this.priceCache.set('WBTC-USD', { price: data.WBTC, timestamp });
          this.log(`  WBTC price: $${data.WBTC}`);
        }

        if (data.WETH && typeof data.WETH === 'number') {
          this.priceCache.set('WETH-USD', { price: data.WETH, timestamp });
          this.log(`  WETH price: $${data.WETH}`);
        }
      } else {
        this.log(`  Unified API proxy error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      this.log(`  Unified API proxy failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Keep old method name for backwards compatibility
  private async fetchWorldCoinPrices(): Promise<void> {
    await this.fetchAllPrices();
  }

  // Keep old method name for backwards compatibility
  private async fetchCoinGeckoPrices(): Promise<void> {
    await this.fetchAllPrices();
  }

  async getTokenPrice(symbol: string): Promise<number> {
    const cacheKey = `${symbol}-USD`;
    const cached = this.priceCache.get(cacheKey);

    // Return cached price if still valid
    if (cached && Date.now() - cached.timestamp < this.PRICE_CACHE_DURATION) {
      this.log(`  Using cached ${symbol} price: $${cached.price}`);
      return cached.price;
    }

    // If not cached or expired, fetch all prices from unified API
    this.log(`  ${symbol} price not in cache or expired, fetching from unified API...`);
    await this.fetchAllPrices();

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

  // Get native ETH balance
  async getNativeBalance(address: `0x${string}`): Promise<bigint> {
    try {
      const balance = await this.client.getBalance({ address });
      this.log(`  Native ETH balance: ${balance.toString()}`);
      return balance;
    } catch (error) {
      this.log(`  ERROR getting native balance: ${error instanceof Error ? error.message : String(error)}`);
      return 0n;
    }
  }

  // Get ERC20 token balances using multicall with fallback to individual calls
  async getTokenBalances(
    address: `0x${string}`,
    tokens: Array<{ address: `0x${string}`; symbol: string; decimals: number }>
  ): Promise<Array<{ token: typeof tokens[0]; balance: bigint }>> {
    try {
      this.log(`[RPC] Fetching balances for ${tokens.length} tokens via multicall for address ${address}`);
      this.log(`[RPC] Token addresses: ${tokens.map(t => t.symbol + '=' + t.address).join(', ')}`);

      const results = await this.client.multicall({
        contracts: tokens.map(token => ({
          address: token.address,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [address]
        }))
      });

      this.log(`[RPC] Multicall completed, processing ${results.length} results`);

      return results.map((result, index) => {
        const token = tokens[index];
        this.log(`[RPC] ${token.symbol}: status=${result.status}, result=${result.status === 'success' ? result.result : 'N/A'}`);

        if (result.status === 'success' && result.result !== undefined) {
          const balance = BigInt(result.result as string | number | bigint);
          this.log(`[RPC] ${token.symbol}: Successfully parsed balance=${balance.toString()}`);
          return {
            token,
            balance
          };
        }

        if (result.status === 'failure') {
          this.log(`[RPC] ${token.symbol}: FAILED - ${result.error?.message || 'Unknown error'}`);
        }

        return {
          token,
          balance: 0n
        };
      });
    } catch (error) {
      this.log(`[RPC] ERROR in multicall: ${error instanceof Error ? error.message : String(error)}`);
      this.log(`[RPC] Falling back to individual balanceOf calls...`);

      // Fallback: Call balanceOf individually for each token
      return await this.getTokenBalancesIndividually(address, tokens);
    }
  }

  // Fallback method: Get token balances one by one
  private async getTokenBalancesIndividually(
    address: `0x${string}`,
    tokens: Array<{ address: `0x${string}`; symbol: string; decimals: number }>
  ): Promise<Array<{ token: typeof tokens[0]; balance: bigint }>> {
    this.log(`[RPC] Fetching ${tokens.length} token balances individually...`);

    const results = await Promise.all(
      tokens.map(async (token) => {
        try {
          const result = await this.client.readContract({
            address: token.address,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address]
          });

          const balance = BigInt(result as string | number | bigint);
          this.log(`[RPC] ${token.symbol}: Individual call successful, balance=${balance.toString()}`);
          return { token, balance };
        } catch (error) {
          this.log(`[RPC] ${token.symbol}: Individual call failed - ${error instanceof Error ? error.message : String(error)}`);
          return { token, balance: 0n };
        }
      })
    );

    return results;
  }

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

  // Get MetaMorpho Vault positions (Earn)
  async getMetaMorphoPositions(address: string): Promise<any[]> {
    const userAddress = address as `0x${string}`;
    const positions: any[] = [];

    this.log(`\n=== Checking MetaMorpho Vaults ===`);

    for (const vault of METAMORPHO_VAULTS) {
      try {
        this.log(`\nChecking vault: ${vault.name} (${vault.vaultAddress})`);

        // Get user's vault shares
        const shares = await this.client.readContract({
          address: vault.vaultAddress,
          abi: METAMORPHO_VAULT_ABI,
          functionName: 'balanceOf',
          args: [userAddress]
        }) as bigint;

        this.log(`  User shares: ${shares.toString()}`);

        if (shares > 0n) {
          // Convert shares to assets
          const assets = await this.client.readContract({
            address: vault.vaultAddress,
            abi: METAMORPHO_VAULT_ABI,
            functionName: 'convertToAssets',
            args: [shares]
          }) as bigint;

          this.log(`  Assets: ${assets.toString()}`);

          // Format amounts
          const supplyAmount = formatUnits(assets, vault.decimals);
          this.log(`  Formatted supply: ${supplyAmount} ${vault.assetSymbol}`);

          // Get token price
          const tokenPrice = await this.getTokenPrice(vault.assetSymbol);
          this.log(`  Token price: $${tokenPrice}`);

          // Calculate USD value
          const supplyAssetsUsd = parseFloat(supplyAmount) * tokenPrice;
          this.log(`  USD value: $${supplyAssetsUsd}`);

          positions.push({
            type: 'lend' as const,
            vaultType: 'metamorpho' as const,
            market: {
              uniqueKey: vault.vaultAddress,
              lltv: '0',
              loanAsset: {
                address: vault.assetAddress,
                symbol: vault.assetSymbol,
                decimals: vault.decimals
              },
              collateralAsset: {
                address: vault.assetAddress,
                symbol: vault.assetSymbol,
                decimals: vault.decimals
              }
            },
            state: {
              supplyAssets: supplyAmount,
              supplyAssetsUsd: supplyAssetsUsd,
              supplyShares: shares.toString()
            }
          });

          this.log(`  ✓ Position added`);
        } else {
          this.log(`  No shares in this vault`);
        }
      } catch (error) {
        this.log(`  ERROR: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.log(`\n=== Total MetaMorpho positions: ${positions.length} ===`);
    return positions;
  }

  // Helper to separate lend and borrow positions
  async getLendPositions(address: string): Promise<any[]> {
    // Get positions from both Morpho Blue markets and MetaMorpho vaults
    const [morphoPositions, vaultPositions] = await Promise.all([
      this.getUserPositions(address),
      this.getMetaMorphoPositions(address)
    ]);

    // Filter Morpho Blue positions for lend only
    const morphoLendPositions = morphoPositions
      .filter(pos => parseFloat(pos.state.supplyAssets) > 0)
      .map(pos => ({
        type: 'lend' as const,
        vaultType: 'morpho-blue' as const,
        market: pos.market,
        state: {
          supplyAssets: pos.state.supplyAssets,
          supplyAssetsUsd: pos.state.supplyAssetsUsd,
          supplyShares: pos.state.supplyShares
        }
      }));

    // Combine both types of positions
    return [...morphoLendPositions, ...vaultPositions];
  }

  async getBorrowPositions(address: string): Promise<any[]> {
    const allPositions = await this.getUserPositions(address);

    return allPositions
      .filter(pos => parseFloat(pos.state.borrowAssets) > 0)
      .map(pos => ({
        type: 'borrow' as const,
        market: pos.market,
        state: pos.state
      }));
  }

  // Get transaction history for a wallet (最近のイベントのみ)
  async getTransactionHistory(address: string, limit: number = 5): Promise<any[]> {
    try {
      const userAddress = address as `0x${string}`;
      const currentBlock = await this.client.getBlockNumber();
      const fromBlock = currentBlock - 50000n; // 直近50,000ブロック（約2週間分）

      const events: any[] = [];

      // Borrow イベント
      try {
        const borrowLogs = await this.client.getLogs({
          address: MORPHO_BLUE_ADDRESS as `0x${string}`,
          event: {
            type: 'event',
            name: 'Borrow',
            inputs: [
              { name: 'id', type: 'bytes32', indexed: true },
              { name: 'caller', type: 'address', indexed: false },
              { name: 'onBehalf', type: 'address', indexed: true },
              { name: 'receiver', type: 'address', indexed: true },
              { name: 'assets', type: 'uint256', indexed: false },
              { name: 'shares', type: 'uint256', indexed: false }
            ]
          },
          args: {
            onBehalf: userAddress
          },
          fromBlock,
          toBlock: currentBlock
        });

        for (const log of borrowLogs) {
          const block = await this.client.getBlock({ blockNumber: log.blockNumber });
          events.push({
            event: 'Borrow',
            timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
            block: Number(log.blockNumber),
            txHash: log.transactionHash,
            marketId: log.topics[1] || '',
            args: log.args
          });
        }
      } catch (e) {
        console.error('Error fetching Borrow events:', e);
      }

      // Repay イベント
      try {
        const repayLogs = await this.client.getLogs({
          address: MORPHO_BLUE_ADDRESS as `0x${string}`,
          event: {
            type: 'event',
            name: 'Repay',
            inputs: [
              { name: 'id', type: 'bytes32', indexed: true },
              { name: 'caller', type: 'address', indexed: true },
              { name: 'onBehalf', type: 'address', indexed: true },
              { name: 'assets', type: 'uint256', indexed: false },
              { name: 'shares', type: 'uint256', indexed: false }
            ]
          },
          args: {
            onBehalf: userAddress
          },
          fromBlock,
          toBlock: currentBlock
        });

        for (const log of repayLogs) {
          const block = await this.client.getBlock({ blockNumber: log.blockNumber });
          events.push({
            event: 'Repay',
            timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
            block: Number(log.blockNumber),
            txHash: log.transactionHash,
            marketId: log.topics[1] || '',
            args: log.args
          });
        }
      } catch (e) {
        console.error('Error fetching Repay events:', e);
      }

      // Liquidate イベント
      try {
        const liquidateLogs = await this.client.getLogs({
          address: MORPHO_BLUE_ADDRESS as `0x${string}`,
          event: {
            type: 'event',
            name: 'Liquidate',
            inputs: [
              { name: 'id', type: 'bytes32', indexed: true },
              { name: 'liquidator', type: 'address', indexed: true },
              { name: 'borrower', type: 'address', indexed: true },
              { name: 'repaidAssets', type: 'uint256', indexed: false },
              { name: 'repaidShares', type: 'uint256', indexed: false },
              { name: 'seizedAssets', type: 'uint256', indexed: false },
              { name: 'badDebtAssets', type: 'uint256', indexed: false },
              { name: 'badDebtShares', type: 'uint256', indexed: false }
            ]
          },
          args: {
            borrower: userAddress
          },
          fromBlock,
          toBlock: currentBlock
        });

        for (const log of liquidateLogs) {
          const block = await this.client.getBlock({ blockNumber: log.blockNumber });
          events.push({
            event: 'Liquidate',
            timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
            block: Number(log.blockNumber),
            txHash: log.transactionHash,
            marketId: log.topics[1] || '',
            args: log.args
          });
        }
      } catch (e) {
        console.error('Error fetching Liquidate events:', e);
      }

      // ブロック番号でソート（新しい順）
      events.sort((a, b) => b.block - a.block);

      // 上位N件のみ返す
      return events.slice(0, limit);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }
}
