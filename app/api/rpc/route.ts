import { NextResponse } from 'next/server';

// World Chain RPC endpoint
const getAlchemyRpcUrl = () => {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (apiKey) {
    return `https://worldchain-mainnet.g.alchemy.com/v2/${apiKey}`;
  }
  return 'https://worldchain-mainnet.g.alchemy.com/public';
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate JSON-RPC request
    if (!body.jsonrpc || !body.method) {
      return NextResponse.json(
        { error: 'Invalid JSON-RPC request' },
        { status: 400 }
      );
    }

    const rpcUrl = getAlchemyRpcUrl();

    // Forward the request to Alchemy
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`Alchemy RPC error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `RPC request failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-cache', // Don't cache RPC responses by default
      },
    });
  } catch (error) {
    console.error('Error in RPC proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
