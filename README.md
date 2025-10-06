# CTS (Collateral Tracking System)

A World App mini-app for monitoring Morpho Blue borrow positions and health factors on World Chain.

## Features

- 🔗 **World App Integration**: Seamless wallet connection through World App
- 📊 **Multi-Market Position Monitoring**: Track multiple Morpho positions across different token pairs
- 🏥 **Health Factor Tracking**: Real-time health factor monitoring with customizable thresholds
- ⚠️ **Configurable Alerts**: Set custom warning and danger thresholds
- 🔔 **Notifications**: In-app notifications when positions reach threshold levels
- 🧮 **Position Simulator**: Simulate collateral and borrow adjustments
- 📱 **Mobile Optimized**: Designed for World App's WebView environment
- ⚙️ **Settings**: Customize thresholds, notification preferences, and debug info visibility

## Supported Market Pairs

Currently supported (active):
- **WLD → USDC**: Collateralize WLD to borrow USDC

Ready to support (requires market IDs):
- **WETH → USDC**: Collateralize WETH to borrow USDC
- **WETH → WLD**: Collateralize WETH to borrow WLD
- **WBTC → WLD**: Collateralize WBTC to borrow WLD
- **WBTC → WETH**: Collateralize WBTC to borrow WETH
- **WBTC → USDC**: Collateralize WBTC to borrow USDC

To enable additional markets, update `lib/market-config.ts` with actual market IDs from [Morpho Blue](https://app.morpho.org) or [World Chain Explorer](https://worldscan.org).

## Health Factor

Health Factor = (Collateral Value × LLTV) / Borrowed Value

- **Healthy**: HF ≥ Warning Threshold (default: 1.5)
- **Warning**: Danger Threshold ≤ HF < Warning Threshold (default: 1.2)
- **Danger**: HF < Danger Threshold (default: 1.2)

Thresholds can be customized in the settings.

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
