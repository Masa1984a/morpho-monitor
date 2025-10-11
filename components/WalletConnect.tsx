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
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 px-10 py-14 shadow-[0_40px_120px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
          <div
            className="pointer-events-none absolute -right-24 top-6 h-56 w-56 rounded-full bg-gradient-to-br from-cyan-400/40 via-fuchsia-500/30 to-transparent blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-28 -bottom-28 h-72 w-72 rounded-full bg-gradient-to-tr from-blue-500/25 via-teal-400/30 to-transparent blur-3xl"
            aria-hidden="true"
          />

          <div className="relative text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
              WalletConnect
            </div>
            <h2 className="mb-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Crypto Asset Monitor
            </h2>
            <p className="mx-auto mb-10 max-w-md text-sm text-white/70">
              Connect your World App wallet to view your asset, earning and borrowing.
            </p>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-200 backdrop-blur">
                {error}
              </div>
            )}

            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className={`group relative flex w-full items-center justify-center overflow-hidden rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-transform duration-300 ${
                isConnecting
                  ? 'cursor-not-allowed bg-white/10 text-white/60'
                  : 'bg-gradient-to-r from-cyan-300 via-sky-500 to-indigo-500 text-slate-900 shadow-[0_20px_60px_rgba(56,189,248,0.45)] hover:scale-[1.02] hover:shadow-[0_32px_90px_rgba(99,102,241,0.55)] active:scale-95'
              }`}
            >
              {isConnecting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg
                    className="h-5 w-5 animate-spin text-white/70"
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
                  <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.8)]" />
                  Connect Wallet
                  <svg
                    className="h-4 w-4 text-slate-900/80 transition-transform group-hover:translate-x-1"
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

            <div className="mt-10 space-y-5 text-xs text-white/55">
              <p className="text-white/40">
                This is an independent community dashboard. Always verify your positions on the canonical World &amp; Morpho interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
