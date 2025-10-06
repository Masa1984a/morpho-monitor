'use client';

import React, { useState, useEffect } from 'react';
import { MarketPosition } from '@/types/morpho';
import { HealthFactorThresholds } from '@/lib/calculations';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: MarketPosition | null;
  wldPrice: number;
  thresholds: HealthFactorThresholds;
}

export function SimulationModal({
  isOpen,
  onClose,
  position,
  wldPrice,
  thresholds,
}: SimulationModalProps) {
  const [newCollateral, setNewCollateral] = useState(0);
  const [newBorrow, setNewBorrow] = useState(0);

  // Initialize values when position changes
  useEffect(() => {
    if (position) {
      setNewCollateral(parseFloat(position.state.collateral));
      setNewBorrow(parseFloat(position.state.borrowAssets));
    }
  }, [position]);

  if (!isOpen || !position) return null;

  const currentCollateral = parseFloat(position.state.collateral);
  const currentBorrow = parseFloat(position.state.borrowAssets);
  const lltv = parseFloat(position.market.lltv);

  // Calculate current HF
  const currentCollateralUsd = currentCollateral * wldPrice;
  const currentBorrowUsd = currentBorrow;
  const currentHF = currentBorrowUsd > 0
    ? (currentCollateralUsd * lltv) / currentBorrowUsd
    : Infinity;

  // Calculate simulated HF
  const simCollateralUsd = newCollateral * wldPrice;
  const simBorrowUsd = newBorrow;
  const simHF = simBorrowUsd > 0
    ? (simCollateralUsd * lltv) / simBorrowUsd
    : Infinity;

  // Determine status
  const getStatus = (hf: number): 'healthy' | 'warning' | 'danger' => {
    if (hf === Infinity) return 'healthy';
    if (hf < thresholds.dangerThreshold) return 'danger';
    if (hf < thresholds.warningThreshold) return 'warning';
    return 'healthy';
  };

  const simStatus = getStatus(simHF);

  // Calculate changes
  const collateralChange = newCollateral - currentCollateral;
  const borrowChange = newBorrow - currentBorrow;
  const hfChange = simHF === Infinity || currentHF === Infinity
    ? 0
    : simHF - currentHF;

  const handleReset = () => {
    setNewCollateral(currentCollateral);
    setNewBorrow(currentBorrow);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Position Simulator</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Position */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Position</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Collateral (WLD)</p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentCollateral.toFixed(2)} WLD
                </p>
                <p className="text-xs text-gray-500">${currentCollateralUsd.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Borrowed (USDC)</p>
                <p className="text-lg font-semibold text-gray-900">
                  {currentBorrow.toFixed(2)} USDC
                </p>
                <p className="text-xs text-gray-500">${currentBorrowUsd.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600">Current Health Factor</p>
              <p className={`text-2xl font-bold ${
                currentHF === Infinity ? 'text-success' :
                currentHF < thresholds.dangerThreshold ? 'text-danger' :
                currentHF < thresholds.warningThreshold ? 'text-warning' :
                'text-success'
              }`}>
                {currentHF === Infinity ? '∞' : currentHF.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Adjustments */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Adjust Position</h3>

            {/* WLD Collateral Adjustment */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-700">Collateral (WLD)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newCollateral.toFixed(2)}
                    onChange={(e) => setNewCollateral(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-32 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-morpho-blue focus:border-transparent"
                  />
                  <span className="text-xs text-gray-500">WLD</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={currentCollateral * 2}
                step="0.1"
                value={newCollateral}
                onChange={(e) => setNewCollateral(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-morpho-blue"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span className={collateralChange >= 0 ? 'text-success' : 'text-danger'}>
                  {collateralChange >= 0 ? '+' : ''}{collateralChange.toFixed(2)} WLD
                </span>
                <span>{(currentCollateral * 2).toFixed(0)}</span>
              </div>
            </div>

            {/* USDC Borrow Adjustment */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-gray-700">Borrowed (USDC)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={currentCollateralUsd}
                    value={newBorrow.toFixed(2)}
                    onChange={(e) => setNewBorrow(Math.max(0, Math.min(currentCollateralUsd, parseFloat(e.target.value) || 0)))}
                    className="w-32 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-morpho-blue focus:border-transparent"
                  />
                  <span className="text-xs text-gray-500">USDC</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max={currentCollateralUsd}
                step="0.1"
                value={newBorrow}
                onChange={(e) => setNewBorrow(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-morpho-blue"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 (Repay All)</span>
                <span className={borrowChange <= 0 ? 'text-success' : 'text-danger'}>
                  {borrowChange <= 0 ? '' : '+'}{borrowChange.toFixed(2)} USDC
                </span>
                <span>{currentCollateralUsd.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Simulation Result */}
          <div className={`rounded-xl p-6 border-2 ${
            simStatus === 'danger' ? 'bg-danger/10 border-danger' :
            simStatus === 'warning' ? 'bg-warning/10 border-warning' :
            'bg-success/10 border-success'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Simulated Health Factor</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                simStatus === 'healthy' ? 'bg-success/20 text-success' :
                simStatus === 'warning' ? 'bg-warning/20 text-warning' :
                'bg-danger/20 text-danger'
              }`}>
                {simStatus.toUpperCase()}
              </div>
            </div>

            <div className="text-center mb-4">
              <div className={`text-5xl font-bold ${
                simStatus === 'danger' ? 'text-danger' :
                simStatus === 'warning' ? 'text-warning' :
                'text-success'
              }`}>
                {simHF === Infinity ? '∞' : simHF.toFixed(2)}
              </div>
              {hfChange !== 0 && (
                <div className={`text-sm mt-2 ${hfChange > 0 ? 'text-success' : 'text-danger'}`}>
                  {hfChange > 0 ? '▲' : '▼'} {Math.abs(hfChange).toFixed(2)}
                </div>
              )}
            </div>

            {/* Health Factor Gauge */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    simStatus === 'danger' ? 'bg-danger' :
                    simStatus === 'warning' ? 'bg-warning' :
                    'bg-success'
                  }`}
                  style={{
                    width: simHF === Infinity
                      ? '100%'
                      : `${Math.min(100, (simHF / thresholds.warningThreshold) * 50)}%`
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Danger &lt; {thresholds.dangerThreshold}</span>
                <span>Warning &lt; {thresholds.warningThreshold}</span>
                <span>Healthy ≥ {thresholds.warningThreshold}</span>
              </div>
            </div>

            {/* Position Details */}
            <div className="mt-4 pt-4 border-t border-gray-300/50 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">New Collateral</p>
                <p className="font-semibold">{newCollateral.toFixed(2)} WLD (${simCollateralUsd.toFixed(2)})</p>
              </div>
              <div>
                <p className="text-gray-600">New Borrow</p>
                <p className="font-semibold">{newBorrow.toFixed(2)} USDC (${simBorrowUsd.toFixed(2)})</p>
              </div>
              <div>
                <p className="text-gray-600">LTV</p>
                <p className="font-semibold">
                  {simCollateralUsd > 0 ? ((simBorrowUsd / simCollateralUsd) * 100).toFixed(1) : '0'}%
                </p>
              </div>
              <div>
                <p className="text-gray-600">Max LTV</p>
                <p className="font-semibold">{(lltv * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-morpho-blue text-white rounded-lg hover:bg-morpho-purple transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
