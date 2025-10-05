'use client';

import React, { useState, useEffect } from 'react';
import { HealthFactorSettings } from '@/hooks/useSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: HealthFactorSettings;
  onSave: (settings: HealthFactorSettings) => void;
  onReset: () => void;
  defaultSettings: HealthFactorSettings;
}

export function SettingsModal({
  isOpen,
  onClose,
  currentSettings,
  onSave,
  onReset,
  defaultSettings,
}: SettingsModalProps) {
  const [warningThreshold, setWarningThreshold] = useState(currentSettings.warningThreshold.toString());
  const [dangerThreshold, setDangerThreshold] = useState(currentSettings.dangerThreshold.toString());
  const [error, setError] = useState<string>('');

  // Update local state when currentSettings changes
  useEffect(() => {
    setWarningThreshold(currentSettings.warningThreshold.toString());
    setDangerThreshold(currentSettings.dangerThreshold.toString());
    setError('');
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const warning = parseFloat(warningThreshold);
    const danger = parseFloat(dangerThreshold);

    // Validation
    if (isNaN(warning) || isNaN(danger)) {
      setError('Please enter valid numbers');
      return;
    }

    if (warning <= 0 || danger <= 0) {
      setError('Thresholds must be positive numbers');
      return;
    }

    if (danger >= warning) {
      setError('Danger threshold must be less than warning threshold');
      return;
    }

    try {
      onSave({ warningThreshold: warning, dangerThreshold: danger });
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    }
  };

  const handleReset = () => {
    setWarningThreshold(defaultSettings.warningThreshold.toString());
    setDangerThreshold(defaultSettings.dangerThreshold.toString());
    setError('');
    onReset();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Health Factor Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Warning Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Warning Threshold (注意)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="0.1"
                min="0"
                value={warningThreshold}
                onChange={(e) => setWarningThreshold(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morpho-blue focus:border-transparent"
              />
              <div className="w-4 h-4 rounded-full bg-warning"></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Default: {defaultSettings.warningThreshold.toFixed(1)}
            </p>
          </div>

          {/* Danger Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danger Threshold (危険)
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                step="0.1"
                min="0"
                value={dangerThreshold}
                onChange={(e) => setDangerThreshold(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morpho-blue focus:border-transparent"
              />
              <div className="w-4 h-4 rounded-full bg-danger"></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Default: {defaultSettings.dangerThreshold.toFixed(1)}
            </p>
          </div>

          {/* Description */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">How it works:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <span>Healthy: HF ≥ {warningThreshold || '2.0'}</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <span>Warning: {dangerThreshold || '1.2'} ≤ HF &lt; {warningThreshold || '2.0'}</span>
              </li>
              <li className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-danger"></div>
                <span>Danger: HF &lt; {dangerThreshold || '1.2'}</span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-3">
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-morpho-blue text-white rounded-lg hover:bg-morpho-purple transition-colors font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
