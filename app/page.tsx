'use client';

import React, { useState, useEffect } from 'react';
import { MiniKitService } from '@/lib/minikit';
import { MorphoAPIClient } from '@/lib/morpho-api';
import { calculateAggregateHealthFactor } from '@/lib/calculations';
import { MarketPosition } from '@/types/morpho';
import { WalletConnect } from '@/components/WalletConnect';
import { LoadingState } from '@/components/LoadingState';
import { HealthFactorCard } from '@/components/HealthFactorCard';
import { PositionList } from '@/components/PositionDisplay';

export default function Home() {
  const [isWorldApp, setIsWorldApp] = useState<boolean | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [positions, setPositions] = useState<MarketPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Check if running in World App
  useEffect(() => {
    const checkWorldApp = () => {
      try {
        const minikit = MiniKitService.getInstance();
        setIsWorldApp(minikit.isWorldApp());
      } catch (err) {
        console.error('Error checking World App:', err);
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
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching positions:', err);
      setError('Failed to fetch Morpho positions. Please try again later.');
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
        </div>
      </div>
    );
  }

  // Show wallet connect if not connected
  if (!walletAddress) {
    return <WalletConnect onConnect={handleWalletConnect} />;
  }

  // Calculate aggregate health factor
  const aggregateHealth = calculateAggregateHealthFactor(positions);

  return (
    <div className="min-h-screen px-4 py-6">
      {/* Header */}
      <header className="bg-white rounded-lg shadow-sm px-4 py-3 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Morpho Monitor</h1>
          <p className="text-xs text-gray-500">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Disconnect
        </button>
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
            <PositionList positions={positions} />
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
    </div>
  );
}