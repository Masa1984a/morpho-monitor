'use client';

import { useState, useEffect } from 'react';

export interface HealthFactorSettings {
  warningThreshold: number;
  dangerThreshold: number;
  notificationsEnabled: boolean;
  notifyOnWarning: boolean;
  notifyOnDanger: boolean;
  checkInterval: number; // in minutes
  showDebugInfo: boolean;
}

const DEFAULT_SETTINGS: HealthFactorSettings = {
  warningThreshold: 1.5,
  dangerThreshold: 1.2,
  notificationsEnabled: true,
  notifyOnWarning: true,
  notifyOnDanger: true,
  checkInterval: 60, // 1 hour
  showDebugInfo: false,
};

const STORAGE_KEY = 'morpho-monitor-settings';

export function useSettings() {
  const [settings, setSettings] = useState<HealthFactorSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({
          warningThreshold: parsed.warningThreshold ?? DEFAULT_SETTINGS.warningThreshold,
          dangerThreshold: parsed.dangerThreshold ?? DEFAULT_SETTINGS.dangerThreshold,
          notificationsEnabled: parsed.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled,
          notifyOnWarning: parsed.notifyOnWarning ?? DEFAULT_SETTINGS.notifyOnWarning,
          notifyOnDanger: parsed.notifyOnDanger ?? DEFAULT_SETTINGS.notifyOnDanger,
          checkInterval: parsed.checkInterval ?? DEFAULT_SETTINGS.checkInterval,
          showDebugInfo: parsed.showDebugInfo ?? DEFAULT_SETTINGS.showDebugInfo,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = (newSettings: HealthFactorSettings) => {
    if (typeof window === 'undefined') return;

    try {
      // Validate: danger threshold must be less than warning threshold
      if (newSettings.dangerThreshold >= newSettings.warningThreshold) {
        throw new Error('Danger threshold must be less than warning threshold');
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  };

  // Reset to default settings
  const resetSettings = () => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      setSettings(DEFAULT_SETTINGS);
    } catch (error) {
      console.error('Failed to reset settings:', error);
    }
  };

  return {
    settings,
    isLoaded,
    saveSettings,
    resetSettings,
    defaultSettings: DEFAULT_SETTINGS,
  };
}
