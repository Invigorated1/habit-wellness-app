'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: {
      dom_event_allowlist: ['click', 'submit', 'change'],
      element_allowlist: ['button', 'input', 'select', 'textarea', 'a'],
    },
    session_recording: {
      maskAllInputs: false,
      maskTextSelector: '[data-mask]',
    },
  });
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  const { userId, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn && userId) {
      // Identify user in PostHog
      posthog.identify(userId);
    } else if (!isSignedIn) {
      // Reset on sign out
      posthog.reset();
    }
  }, [userId, isSignedIn]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}