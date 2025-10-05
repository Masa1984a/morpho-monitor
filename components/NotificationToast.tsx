'use client';

import React, { useEffect } from 'react';
import { Notification } from '@/hooks/useHealthMonitor';

interface NotificationToastProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export function NotificationToast({ notifications, onRemove }: NotificationToastProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

interface ToastItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

function ToastItem({ notification, onRemove }: ToastItemProps) {
  useEffect(() => {
    // Vibrate if supported (mobile)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (notification.type === 'danger') {
        navigator.vibrate([200, 100, 200]); // Three short vibrations
      } else {
        navigator.vibrate(200); // Single vibration
      }
    }
  }, [notification.type]);

  return (
    <div
      className={`animate-slide-in-right rounded-lg shadow-lg p-4 ${
        notification.type === 'danger'
          ? 'bg-danger text-white'
          : 'bg-warning text-white'
      } border-l-4 ${
        notification.type === 'danger' ? 'border-red-700' : 'border-yellow-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {notification.type === 'danger' ? (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
            <p className="text-xs mt-1 opacity-90">
              {new Date(notification.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <button
          onClick={() => onRemove(notification.id)}
          className="flex-shrink-0 ml-3 text-white hover:opacity-75 focus:outline-none"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
