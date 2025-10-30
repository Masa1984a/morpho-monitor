import { NextResponse } from 'next/server';

interface WorldCoinPriceResponse {
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

interface CoinGeckoPriceResponse {
  bitcoin?: { usd: number };
  ethereum?: { usd: number };
  solana?: { usd: number };
  dogecoin?: { usd: number };
  ripple?: { usd: number };
  sui?: { usd: number };
  stellar?: { usd: number };
  litecoin?: { usd: number };
  'shiba-inu'?: { usd: number };
  cardano?: { usd: number };
  chainlink?: { usd: number };
  'tether-gold'?: { usd: number };
  'peanut-the-squirrel'?: { usd: number };
  'avalanche-2'?: { usd: number };
  'hedera-hashgraph'?: { usd: number };
  polkadot?: { usd: number };
  uniswap?: { usd: number };
  pepe?: { usd: number };
  aave?: { usd: number };
  'ondo-finance'?: { usd: number };
  'crypto-com-chain'?: { usd: number };
  near?: { usd: number };
  aptos?: { usd: number };
  arbitrum?: { usd: number };
  'internet-computer'?: { usd: number };
  // Note: ORO and ORB prices are fetched from GeckoTerminal
}

interface GeckoTerminalPoolResponse {
  data?: {
    attributes?: {
      base_token_price_usd?: string;
      quote_token_price_usd?: string;
    };
  };
}

interface UnifiedPriceResponse {
  WLD?: number;
  USDC?: number;
  WBTC?: number;
  WETH?: number;
  // Universal Protocol Assets
  uSOL?: number;
  uDOGE?: number;
  uXRP?: number;
  uSUI?: number;
  uXLM?: number;
  uLTC?: number;
  uSHIB?: number;
  uADA?: number;
  uLINK?: number;
  uPNUT?: number;
  uAVAX?: number;
  uHBAR?: number;
  uDOT?: number;
  uUNI?: number;
  uPEPE?: number;
  uAAVE?: number;
  uONDO?: number;
  uCRO?: number;
  uNEAR?: number;
  uAPT?: number;
  uARB?: number;
  uICP?: number;
  // Other Tokens
  ORO?: number;
  ORB?: number;
  oXAUt?: number;
  SUSHI?: number;
}

// Fetch with timeout and retry logic
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 5000,
  retries = 2
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // If this was the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }

      // Wait before retrying (exponential backoff: 100ms, 200ms, 400ms...)
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Max retries exceeded');
}

export async function GET(request: Request) {
  try {
    const prices: UnifiedPriceResponse = {};

    // Fetch WLD and USDC from World Coin API
    try {
      const worldCoinResponse = await fetchWithTimeout(
        'https://app-backend.worldcoin.dev/public/v1/miniapps/prices?cryptoCurrencies=WLD,USDC&fiatCurrencies=USD',
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
        },
        5000, // 5 second timeout
        2     // 2 retries
      );

      if (worldCoinResponse.ok) {
        const data: WorldCoinPriceResponse = await worldCoinResponse.json();

        // Parse WLD price
        if (data.result?.prices?.WLD?.USD) {
          const wldAmount = data.result.prices.WLD.USD.amount;
          const wldDecimals = data.result.prices.WLD.USD.decimals;
          prices.WLD = parseFloat(wldAmount) / Math.pow(10, wldDecimals);
        }

        // Parse USDC price
        if (data.result?.prices?.USDC?.USD) {
          const usdcAmount = data.result.prices.USDC.USD.amount;
          const usdcDecimals = data.result.prices.USDC.USD.decimals;
          prices.USDC = parseFloat(usdcAmount) / Math.pow(10, usdcDecimals);
        }
      }
    } catch (error) {
      console.error('World Coin API error:', error);
    }

    // Fetch crypto prices from CoinGecko
    try {
      const coinIds = [
        'bitcoin',
        'ethereum',
        'solana',
        'dogecoin',
        'ripple',
        'sui',
        'stellar',
        'litecoin',
        'shiba-inu',
        'cardano',
        'chainlink',
        'tether-gold',
        'peanut-the-squirrel',
        'avalanche-2',
        'hedera-hashgraph',
        'polkadot',
        'uniswap',
        'pepe',
        'aave',
        'ondo-finance',
        'crypto-com-chain',
        'near',
        'aptos',
        'arbitrum',
        'internet-computer'
      ].join(',');

      const coinGeckoResponse = await fetchWithTimeout(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
        },
        5000, // 5 second timeout
        2     // 2 retries
      );

      if (coinGeckoResponse.ok) {
        const data: CoinGeckoPriceResponse = await coinGeckoResponse.json();

        // Main tokens
        if (data.bitcoin?.usd) prices.WBTC = data.bitcoin.usd;
        if (data.ethereum?.usd) prices.WETH = data.ethereum.usd;

        // Universal Protocol Assets (mapped to their underlying assets)
        if (data.solana?.usd) prices.uSOL = data.solana.usd;
        if (data.dogecoin?.usd) prices.uDOGE = data.dogecoin.usd;
        if (data.ripple?.usd) prices.uXRP = data.ripple.usd;
        if (data.sui?.usd) prices.uSUI = data.sui.usd;
        if (data.stellar?.usd) prices.uXLM = data.stellar.usd;
        if (data.litecoin?.usd) prices.uLTC = data.litecoin.usd;
        if (data['shiba-inu']?.usd) prices.uSHIB = data['shiba-inu'].usd;
        if (data.cardano?.usd) prices.uADA = data.cardano.usd;
        if (data.chainlink?.usd) prices.uLINK = data.chainlink.usd;
        if (data['peanut-the-squirrel']?.usd) prices.uPNUT = data['peanut-the-squirrel'].usd;
        if (data['avalanche-2']?.usd) prices.uAVAX = data['avalanche-2'].usd;
        if (data['hedera-hashgraph']?.usd) prices.uHBAR = data['hedera-hashgraph'].usd;
        if (data.polkadot?.usd) prices.uDOT = data.polkadot.usd;
        if (data.uniswap?.usd) prices.uUNI = data.uniswap.usd;
        if (data.pepe?.usd) prices.uPEPE = data.pepe.usd;
        if (data.aave?.usd) prices.uAAVE = data.aave.usd;
        if (data['ondo-finance']?.usd) prices.uONDO = data['ondo-finance'].usd;
        if (data['crypto-com-chain']?.usd) prices.uCRO = data['crypto-com-chain'].usd;
        if (data.near?.usd) prices.uNEAR = data.near.usd;
        if (data.aptos?.usd) prices.uAPT = data.aptos.usd;
        if (data.arbitrum?.usd) prices.uARB = data.arbitrum.usd;
        if (data['internet-computer']?.usd) prices.uICP = data['internet-computer'].usd;

        // Tether Gold (oXAUt)
        if (data['tether-gold']?.usd) prices.oXAUt = data['tether-gold'].usd;
      }
    } catch (error) {
      console.error('CoinGecko API error:', error);
    }

    // Fetch ORO, ORB, and SUSHI prices from GeckoTerminal (World Chain DEX pools)
    try {
      // ORO/WLD pool on Uniswap V3 (World Chain)
      const oroPoolAddress = '0x8b9ffc6909cb826d8dc5a2f7f720fa7a818b8574';
      const oroPoolResponse = await fetchWithTimeout(
        `https://api.geckoterminal.com/api/v2/networks/world-chain/pools/${oroPoolAddress}`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
        },
        5000,
        2
      );

      if (oroPoolResponse.ok) {
        const oroData: GeckoTerminalPoolResponse = await oroPoolResponse.json();
        // GeckoTerminal returns price in USD directly
        if (oroData.data?.attributes?.base_token_price_usd) {
          prices.ORO = parseFloat(oroData.data.attributes.base_token_price_usd);
        }
      }

      // ORB/WLD pool on Uniswap V3 (World Chain)
      const orbPoolAddress = '0xee21af1d049211206b20b957d07794e7d0b140b3';
      const orbPoolResponse = await fetchWithTimeout(
        `https://api.geckoterminal.com/api/v2/networks/world-chain/pools/${orbPoolAddress}`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
        },
        5000,
        2
      );

      if (orbPoolResponse.ok) {
        const orbData: GeckoTerminalPoolResponse = await orbPoolResponse.json();
        // GeckoTerminal returns price in USD directly
        if (orbData.data?.attributes?.base_token_price_usd) {
          prices.ORB = parseFloat(orbData.data.attributes.base_token_price_usd);
        }
      }

      // SUSHI/WLD pool on Uniswap V3 (World Chain)
      const sushiPoolAddress = '0xe2b3bbe86da7463e3995488ad07d832760906e54';
      const sushiPoolResponse = await fetchWithTimeout(
        `https://api.geckoterminal.com/api/v2/networks/world-chain/pools/${sushiPoolAddress}`,
        {
          headers: {
            'Accept': 'application/json',
          },
          next: { revalidate: 60 }, // Cache for 60 seconds
        },
        5000,
        2
      );

      if (sushiPoolResponse.ok) {
        const sushiData: GeckoTerminalPoolResponse = await sushiPoolResponse.json();
        // GeckoTerminal returns price in USD directly
        if (sushiData.data?.attributes?.base_token_price_usd) {
          prices.SUSHI = parseFloat(sushiData.data.attributes.base_token_price_usd);
        }
      }
    } catch (error) {
      console.error('GeckoTerminal API error:', error);
    }

    // Return unified prices
    return NextResponse.json(prices, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error in prices API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
