'use client';

import React, { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
}

// Map crypto symbols to TradingView symbols with fallbacks
const symbolMapping: Record<string, string[]> = {
  WLD: ['BINANCE:WLDUSD', 'COINBASE:WLDUSD', 'KRAKEN:WLDUSD'],
  USDC: ['KRAKEN:USDCUSD', 'BITSTAMP:USDCUSD', 'USDCUSD'],
  WBTC: ['BINANCE:BTCUSD', 'COINBASE:BTCUSD', 'KRAKEN:BTCUSD'], // WBTC tracks BTC price
  WETH: ['BINANCE:ETHUSD', 'COINBASE:ETHUSD', 'KRAKEN:ETHUSD'], // WETH tracks ETH price
};

export function TradingViewChart({ symbol }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const scriptLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!symbol || !containerRef.current) return;

    // Get the first (primary) symbol from the mapping, or fallback to BINANCE
    const symbolOptions = symbolMapping[symbol];
    const tradingViewSymbol = symbolOptions ? symbolOptions[0] : `BINANCE:${symbol}USD`;

    // Function to initialize the widget
    const initWidget = () => {
      if (!containerRef.current) return;

      // Clear previous widget if exists
      if (widgetRef.current) {
        containerRef.current.innerHTML = '';
      }

      // Check if TradingView is available
      if (typeof (window as any).TradingView === 'undefined') {
        console.error('TradingView library not loaded');
        return;
      }

      try {
        widgetRef.current = new (window as any).TradingView.widget({
          width: '100%',
          height: 400,
          symbol: tradingViewSymbol,
          interval: 'D', // Daily
          timezone: 'Asia/Tokyo',
          theme: 'light',
          style: '1', // Candlestick
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_side_toolbar: true,        // サイドバーを非表示
          allow_symbol_change: false,     // シンボル変更を無効化
          details: false,                 // 詳細パネルを非表示
          hotlist: false,                 // ホットリストを非表示
          calendar: false,                // カレンダーを非表示
          container_id: containerRef.current.id,
          studies: [],
          disabled_features: [
            'use_localstorage_for_settings',
            'header_symbol_search',
            'header_compare',
            'header_undo_redo',
            'header_screenshot',
            'header_saveload',
            'timeframes_toolbar',
            'left_toolbar',
            'control_bar',
            'symbol_info',
          ],
          enabled_features: [],
          loading_screen: { backgroundColor: '#ffffff' },
          overrides: {
            'mainSeriesProperties.candleStyle.upColor': '#26a69a',
            'mainSeriesProperties.candleStyle.downColor': '#ef5350',
            'mainSeriesProperties.candleStyle.borderUpColor': '#26a69a',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ef5350',
            'mainSeriesProperties.candleStyle.wickUpColor': '#26a69a',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ef5350',
          },
        });
      } catch (error) {
        console.error('Error initializing TradingView widget:', error);
      }
    };

    // Load TradingView script if not already loaded
    if (!scriptLoadedRef.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        initWidget();
      };
      script.onerror = () => {
        console.error('Failed to load TradingView script');
      };
      document.head.appendChild(script);
    } else {
      // Script already loaded, initialize widget
      initWidget();
    }

    // Cleanup function
    return () => {
      if (widgetRef.current && typeof widgetRef.current.remove === 'function') {
        try {
          widgetRef.current.remove();
        } catch (error) {
          console.error('Error removing TradingView widget:', error);
        }
      }
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container w-full">
      <div
        id={`tradingview_chart_${symbol}`}
        ref={containerRef}
        className="w-full h-[400px] rounded-lg overflow-hidden"
      />
      <div className="text-xs text-gray-500 text-center mt-2">
        {symbol}/USD Chart {symbolMapping[symbol] && `(${symbolMapping[symbol][0].split(':')[0]})`}
      </div>
    </div>
  );
}
