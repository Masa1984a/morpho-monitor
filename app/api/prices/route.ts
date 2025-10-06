import { NextResponse } from 'next/server';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cryptoCurrencies = searchParams.get('cryptoCurrencies') || 'WLD,USDC';
    const fiatCurrencies = searchParams.get('fiatCurrencies') || 'USD';

    // Fetch from World Coin API (server-side, no CORS issue)
    const response = await fetch(
      `https://app-backend.worldcoin.dev/public/v1/miniapps/prices?cryptoCurrencies=${cryptoCurrencies}&fiatCurrencies=${fiatCurrencies}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`World Coin API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: 'Failed to fetch prices from World Coin API' },
        { status: response.status }
      );
    }

    const data: PriceResponse = await response.json();

    // Return the data with CORS headers for client access
    return NextResponse.json(data, {
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
