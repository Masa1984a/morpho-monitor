'use client';

import React, { useState } from 'react';
import { FluidSimulationBackground } from './FluidSimulationBackground';
import { MiniKitService } from '@/lib/minikit';

interface WalletConnectProps {
  onConnect: (address: string) => void;
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const minikit = MiniKitService.getInstance();
      const result = await minikit.connectWallet();

      if (result.success && result.address) {
        onConnect(result.address);
      } else {
        setError(result.error || 'Failed to connect wallet');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#04070f] px-6 py-16 text-white">
      <FluidSimulationBackground className="opacity-90" />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.28),transparent_55%),radial-gradient(circle_at_85%_25%,rgba(167,139,250,0.25),transparent_55%),radial-gradient(circle_at_50%_80%,rgba(14,116,144,0.22),transparent_60%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-[#04070f]/80 backdrop-blur-[2px]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-xl">
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white/70 backdrop-blur-md px-10 py-14 shadow-2xl">
          <div className="relative text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-gray-600">
              WalletConnect
            </div>
            <h2 className="mb-4 text-3xl font-semibold leading-tight text-gray-900 sm:text-4xl">
              Crypto Asset Monitor
            </h2>
            <p className="mx-auto mb-10 max-w-md text-sm text-gray-600">
              Connect your World App wallet to view your asset, earning and borrowing.
            </p>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`group relative flex w-full items-center justify-center overflow-hidden rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-300 ${
                isConnecting
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'bg-gradient-to-r from-morpho-blue to-morpho-purple text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg
                    className="h-5 w-5 animate-spin text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-20"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
                  Connect Wallet
                  <svg
                    className="h-4 w-4 text-white transition-transform group-hover:translate-x-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 12h14m-4-4l4 4-4 4"
                    />
                  </svg>
                </span>
              )}
            </button>

            <div className="mt-10 space-y-5 text-xs text-gray-600">
              <p className="text-gray-600">
                This is an independent community dashboard. Always verify your positions on the canonical World &amp; Morpho interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
