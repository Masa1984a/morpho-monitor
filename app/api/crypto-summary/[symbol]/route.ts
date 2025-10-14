import { NextResponse } from 'next/server';

const CRYPTO_API_BASE = 'https://morpho-ai.vercel.app/';
const BEARER_TOKEN = 'CTS_TOKENS_20251008';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get('lang') || 'en';
    const resolvedParams = await params;
    const symbol = resolvedParams.symbol.toUpperCase();

    // Validate symbol
    const validSymbols = ['WLD', 'USDC', 'WBTC', 'WETH', 'OXAUT'];
    if (!validSymbols.includes(symbol)) {
      return NextResponse.json(
        { error: 'Invalid symbol. Must be one of: WLD, USDC, WBTC, WETH, oXAUt' },
        { status: 400 }
      );
    }

    // Validate language
    const validLangs = ['en', 'ja', 'zh-CN', 'zh-TW', 'ko', 'th', 'pt', 'es'];
    if (!validLangs.includes(lang)) {
      return NextResponse.json(
        { error: 'Invalid language code' },
        { status: 400 }
      );
    }

    // Map oXAUt to XAUt for API requests
    const apiSymbol = symbol === 'OXAUT' ? 'XAUt' : symbol;

    console.log(`Fetching crypto summary for ${apiSymbol} in ${lang}...`);

    // Fetch from Crypto Insight Ingestor API with authentication
    const response = await fetch(
      `${CRYPTO_API_BASE}/api/assets/${apiSymbol}/summary?lang=${lang}`,
      {
        headers: {
          'Authorization': `Bearer ${BEARER_TOKEN}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`Crypto API error: ${response.status} ${response.statusText}`);

      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Asset not found or no summary available' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch crypto summary' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Add language to response
    const responseData = {
      ...data,
      language: lang,
    };

    // Return with cache headers
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('Error in crypto-summary API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
