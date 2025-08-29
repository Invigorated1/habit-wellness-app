'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook for screen reader announcements
 * Announces messages to screen readers without visual change
 */
export function useAnnouncer() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcer element if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      // Cleanup on unmount
      if (announcerRef.current && document.body.contains(announcerRef.current)) {
        document.body.removeChild(announcerRef.current);
      }
    };
  }, []);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      // Update aria-live if needed
      announcerRef.current.setAttribute('aria-live', priority);
      
      // Clear and set message for announcement
      announcerRef.current.textContent = '';
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message;
        }
      }, 100);
    }
  };

  return { announce };
}

/**
 * Hook for announcing loading states
 */
export function useLoadingAnnouncement(isLoading: boolean, loadingMessage = 'Loading...', completeMessage = 'Loading complete') {
  const { announce } = useAnnouncer();
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    if (isLoading && !wasLoadingRef.current) {
      announce(loadingMessage);
    } else if (!isLoading && wasLoadingRef.current) {
      announce(completeMessage);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, loadingMessage, completeMessage, announce]);
}