'use client';

import React, { useState, useEffect } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { MiniKitService } from '@/lib/minikit';
import { MorphoAPIClient } from '@/lib/morpho-api';
import { calculateAggregateHealthFactor } from '@/lib/calculations';
import { MarketPosition } from '@/types/morpho';
import { WalletConnect } from '@/components/WalletConnect';
import { LoadingState } from '@/components/LoadingState';
import { HealthFactorCard } from '@/components/HealthFactorCard';
import { PositionList } from '@/components/PositionDisplay';
import { SettingsModal } from '@/components/SettingsModal';
import { SimulationModal } from '@/components/SimulationModal';
import { NotificationToast } from '@/components/NotificationToast';
import { useSettings } from '@/hooks/useSettings';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';

export default function Home() {
  const [isWorldApp, setIsWorldApp] = useState<boolean | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [positions, setPositions] = useState<MarketPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [chainDebug, setChainDebug] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSimulation, setShowSimulation] = useState(false);

  // Settings hook
  const { settings, isLoaded: settingsLoaded, saveSettings, resetSettings, defaultSettings } = useSettings();

  // Check if running in World App
  useEffect(() => {
    const checkWorldApp = () => {
      try {
        // MiniKitをインストール（World App IDは不要な場合が多い）
        const installResult = MiniKit.install();

        const minikit = MiniKitService.getInstance();
        const result = minikit.isWorldApp();

        // デバッグ情報を収集
        const debug = {
          installResult,
          isWorldApp: result,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
          windowMiniKit: typeof window !== 'undefined' ? !!(window as any).MiniKit : false,
          miniKitInstalled: MiniKit.isInstalled(),
          timestamp: new Date().toISOString()
        };

        setDebugInfo(JSON.stringify(debug, null, 2));
        setIsWorldApp(result);
      } catch (err) {
        console.error('Error checking World App:', err);
        setDebugInfo(`Error: ${err instanceof Error ? err.message : String(err)}`);
        setIsWorldApp(false);
      }
    };

    checkWorldApp();
  }, []);

  // Fetch positions when wallet is connected
  useEffect(() => {
    if (walletAddress) {
      fetchPositions();
    }
  }, [walletAddress]);

  const fetchPositions = async () => {
    if (!walletAddress) return;

    setLoading(true);
    setError(null);

    try {
      const morphoClient = MorphoAPIClient.getInstance();
      const userPositions = await morphoClient.getUserPositions(walletAddress);
      setPositions(userPositions);
      setChainDebug(morphoClient.getChainDebugInfo());
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching positions:', err);
      setError('Failed to fetch Morpho positions. Please try again later.');
      const morphoClient = MorphoAPIClient.getInstance();
      setChainDebug(morphoClient.getChainDebugInfo());
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (walletAddress) {
      const morphoClient = MorphoAPIClient.getInstance();
      morphoClient.clearCache(walletAddress);
      fetchPositions();
    }
  };

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setPositions([]);
    setError(null);
    setLastUpdate(null);
  };

  // Calculate aggregate health factor with thresholds (before early returns)
  const aggregateHealth = walletAddress ? calculateAggregateHealthFactor(positions, settings) : null;

  // Health monitoring (must be called before early returns)
  const { notifications, removeNotification } = useHealthMonitor(
    aggregateHealth,
    settings,
    walletAddress
  );

  // Show loading while checking World App
  if (isWorldApp === null) {
    return <LoadingState message="Initializing..." />;
  }

  // Show error if not in World App
  if (!isWorldApp) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            World App Required
          </h2>
          <p className="text-gray-600">
            This mini-app must be opened within World App to function properly.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Please open this application through World App.
          </p>
          {/* デバッグ情報 */}
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
              Debug Info
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-60">
              {debugInfo}
            </pre>
          </details>
        </div>
      </div>
    );
  }

  // Show wallet connect if not connected
  if (!walletAddress) {
    return <WalletConnect onConnect={handleWalletConnect} />;
  }

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Notifications */}
      <NotificationToast notifications={notifications} onRemove={removeNotification} />
      {/* Header */}
      <header className="bg-white rounded-lg shadow-sm px-4 py-3 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Morpho Monitor</h1>
          <p className="text-xs text-gray-500">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSimulation(true)}
            disabled={positions.length === 0}
            className="p-2 text-gray-600 hover:text-morpho-blue hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Simulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-600 hover:text-morpho-blue hover:bg-gray-100 rounded-lg transition-colors"
            title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            onClick={handleDisconnect}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Disconnect
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-lg">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <LoadingState message="Fetching your Morpho positions..." />
      ) : (
        <>
          {/* Aggregate Health Factor */}
          {aggregateHealth && (
            <div className="mb-6">
              <HealthFactorCard
                healthFactor={aggregateHealth}
                title="Overall Health Factor"
              />
            </div>
          )}

          {/* Positions */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Positions ({positions.length})
              </h2>
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 text-sm text-morpho-blue hover:text-morpho-purple"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
            <PositionList positions={positions} thresholds={settings} />

            {/* Chain Debug Info */}
            {chainDebug && (
              <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600 whitespace-pre-wrap">
                <strong>Debug Info:</strong><br />
                {chainDebug}
              </div>
            )}
          </div>

          {/* Last Update */}
          {lastUpdate && (
            <div className="text-center text-xs text-gray-500 mt-8">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}

          {/* Disclaimer */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              This is a third-party monitoring tool and is not affiliated with Morpho.
              Always verify your positions on the official Morpho interface before making decisions.
            </p>
          </div>
        </>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentSettings={settings}
        onSave={saveSettings}
        onReset={resetSettings}
        defaultSettings={defaultSettings}
      />

      {/* Simulation Modal */}
      <SimulationModal
        isOpen={showSimulation}
        onClose={() => setShowSimulation(false)}
        position={positions.length > 0 ? positions[0] : null}
        wldPrice={
          positions.length > 0 && parseFloat(positions[0].state.collateral) > 0
            ? positions[0].state.collateralUsd / parseFloat(positions[0].state.collateral)
            : 0
        }
        thresholds={settings}
      />
    </div>
  );
}