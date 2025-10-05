'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { HealthFactorData } from '@/types/morpho';
import { HealthFactorSettings } from './useSettings';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'danger';
  value: number;
  timestamp: number;
}

export interface Notification {
  id: string;
  type: 'warning' | 'danger';
  message: string;
  timestamp: number;
}

const STORAGE_KEY_STATUS = 'morpho-monitor-last-status';

export function useHealthMonitor(
  healthFactor: HealthFactorData | null,
  settings: HealthFactorSettings,
  walletAddress: string | null
) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastStatus, setLastStatus] = useState<HealthStatus | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  // Load last status from localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !walletAddress) return;

    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_STATUS}-${walletAddress}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLastStatus(parsed);
      }
    } catch (error) {
      console.error('Failed to load last health status:', error);
    }
  }, [walletAddress]);

  // Save status to localStorage
  const saveStatus = useCallback((status: HealthStatus) => {
    if (typeof window === 'undefined' || !walletAddress) return;

    try {
      localStorage.setItem(`${STORAGE_KEY_STATUS}-${walletAddress}`, JSON.stringify(status));
      setLastStatus(status);
    } catch (error) {
      console.error('Failed to save health status:', error);
    }
  }, [walletAddress]);

  // Add notification
  const addNotification = useCallback((type: 'warning' | 'danger', message: string) => {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, notification]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Remove notification manually
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Check health and trigger notifications
  const checkHealth = useCallback(() => {
    if (!healthFactor || healthFactor.value === Infinity) return;
    if (!settings.notificationsEnabled) return;

    const currentStatus: HealthStatus = {
      status: healthFactor.status,
      value: healthFactor.value,
      timestamp: Date.now(),
    };

    // Check if status changed from healthy to warning/danger
    if (lastStatus) {
      const statusChanged = lastStatus.status !== currentStatus.status;
      const becameWarning = lastStatus.status === 'healthy' && currentStatus.status === 'warning';
      const becameDanger =
        (lastStatus.status === 'healthy' || lastStatus.status === 'warning') &&
        currentStatus.status === 'danger';

      if (statusChanged) {
        if (becameDanger && settings.notifyOnDanger) {
          addNotification(
            'danger',
            `⚠️ Health Factor dropped to ${healthFactor.value.toFixed(2)} - Danger level!`
          );
        } else if (becameWarning && settings.notifyOnWarning) {
          addNotification(
            'warning',
            `⚠️ Health Factor dropped to ${healthFactor.value.toFixed(2)} - Warning level`
          );
        }
      }
    }

    // Periodic check: notify if currently in warning/danger
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckRef.current;
    const intervalMs = settings.checkInterval * 60 * 1000; // convert minutes to ms

    if (timeSinceLastCheck >= intervalMs) {
      lastCheckRef.current = now;

      if (currentStatus.status === 'danger' && settings.notifyOnDanger) {
        addNotification(
          'danger',
          `⚠️ Health Factor is ${healthFactor.value.toFixed(2)} - Position at risk!`
        );
      } else if (currentStatus.status === 'warning' && settings.notifyOnWarning) {
        addNotification(
          'warning',
          `⚠️ Health Factor is ${healthFactor.value.toFixed(2)} - Monitor closely`
        );
      }
    }

    // Save current status
    saveStatus(currentStatus);
  }, [healthFactor, settings, lastStatus, saveStatus, addNotification]);

  // Set up periodic check interval
  useEffect(() => {
    if (!settings.notificationsEnabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check
    checkHealth();

    // Set up interval for periodic checks
    const intervalMs = settings.checkInterval * 60 * 1000;
    intervalRef.current = setInterval(checkHealth, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [settings.notificationsEnabled, settings.checkInterval, checkHealth]);

  // Trigger check when health factor changes
  useEffect(() => {
    checkHealth();
  }, [healthFactor?.value, healthFactor?.status]);

  return {
    notifications,
    removeNotification,
  };
}
