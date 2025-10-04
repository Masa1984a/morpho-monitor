# Morpho Monitor - World App Mini-App

A monitoring tool for Morpho Blue positions on Base chain, built as a World App mini-app. Track your lending and borrowing positions, monitor health factors, and receive visual alerts for liquidation risks.

## Features

- 🔗 **World App Integration**: Seamless wallet connection through World App
- 📊 **Position Monitoring**: View all your Morpho Blue positions on Base chain
- 🏥 **Health Factor Tracking**: Real-time health factor calculation with visual status indicators
- ⚠️ **Risk Alerts**: Visual warnings when positions approach liquidation
- 📱 **Mobile Optimized**: Designed for World App's WebView environment
- 🔄 **Manual Refresh**: Update positions data on demand

## Installation

1. **Install dependencies:**
   ```bash
   cd morpho-monitor
   npm install
   ```

2. **Configure environment variables:**
   The `.env.local` file is already configured with default values:
   - `NEXT_PUBLIC_MORPHO_API_URL`: Morpho GraphQL API endpoint
   - `NEXT_PUBLIC_CHAIN_ID`: Base chain ID (8453)
   - `NEXT_PUBLIC_HEALTH_FACTOR_THRESHOLD`: Warning threshold (1.10)
   - `NEXT_PUBLIC_CACHE_DURATION`: Cache duration in seconds (60)

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Testing in World App

To test this mini-app in World App:

1. Deploy the application to a public URL
2. Register your mini-app with World App through their developer portal
3. Access the mini-app through World App's mini-app section

## Project Structure

```
morpho-monitor/
├── app/
│   ├── layout.tsx       # Root layout with viewport configuration
│   ├── page.tsx         # Main application page
│   └── globals.css      # Global styles and WebView optimizations
├── components/
│   ├── WalletConnect.tsx     # Wallet connection component
│   ├── PositionDisplay.tsx   # Position list and cards
│   ├── HealthFactorCard.tsx  # Health factor visualization
│   └── LoadingState.tsx      # Loading indicators
├── lib/
│   ├── minikit.ts       # MiniKit SDK integration
│   ├── morpho-api.ts    # Morpho GraphQL API client
│   └── calculations.ts  # Health factor calculations
└── types/
    └── morpho.ts        # TypeScript type definitions
```

## Health Factor Calculation

Health Factor = (Collateral Value × LLTV) / Borrowed Value

- **Healthy (>1.10)**: Green status, position is safe
- **Warning (1.00-1.10)**: Yellow status, approaching liquidation
- **Danger (<1.00)**: Red status, position can be liquidated

## Important Notes

- This is a third-party monitoring tool, not affiliated with Morpho Protocol
- Always verify positions on the official Morpho interface before making decisions
- The app only works within World App's WebView environment
- Data is cached for 60 seconds to prevent excessive API calls

## Security Considerations

- No private keys or sensitive data are stored
- All API calls are made directly to Morpho's public GraphQL endpoint
- Wallet connection is handled securely through World App's MiniKit SDK
- Position data is only stored in memory during the session

## Troubleshooting

**"World App Required" error:**
- Ensure you're opening the app within World App, not in a regular browser

**No positions showing:**
- Verify you have active positions on Morpho Blue (Base chain)
- Try refreshing the data using the refresh button
- Check that your wallet address has positions on Base chain (chainId: 8453)

**Connection issues:**
- Ensure you have a stable internet connection
- Try disconnecting and reconnecting your wallet
- Check if Morpho API is operational

## License

This project is provided as-is for monitoring purposes. Users are responsible for their own trading decisions.

## Disclaimer

This tool is for informational purposes only. It is not affiliated with, endorsed by, or officially connected to Morpho Protocol. Always verify your positions and make financial decisions based on official sources.