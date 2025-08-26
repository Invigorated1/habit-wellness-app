'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { initPostHog, trackPageView, identifyUser, resetUser } from '@/lib/posthog';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { userId, isLoaded } = useAuth();

  // Initialize PostHog
  useEffect(() => {
    initPostHog();
  }, []);

  // Track page views
  useEffect(() => {
    if (pathname) {
      const pageName = pathname === '/' ? 'Home' : pathname.slice(1).replace(/\//g, ' ');
      trackPageView(pageName, {
        search_params: searchParams?.toString(),
      });
    }
  }, [pathname, searchParams]);

  // Identify user
  useEffect(() => {
    if (!isLoaded) return;

    if (userId) {
      identifyUser(userId);
    } else {
      resetUser();
    }
  }, [userId, isLoaded]);

  return <>{children}</>;
}