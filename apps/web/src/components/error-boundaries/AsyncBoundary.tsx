'use client';

import React, { Suspense } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { logger } from '@/lib/logger';

interface AsyncBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error) => void;
}

// Loading skeleton component
function DefaultLoadingFallback() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

// Error fallback for async components
function AsyncErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void;
}) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Failed to load content
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>We couldn't load this section. Please try again.</p>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={resetError}
              className="text-sm font-medium text-red-600 hover:text-red-500"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Combined async boundary with loading and error states
export function AsyncBoundary({
  children,
  fallback = <DefaultLoadingFallback />,
  errorFallback = AsyncErrorFallback,
  onError,
}: AsyncBoundaryProps) {
  const handleError = (error: Error) => {
    logger.error('AsyncBoundary caught error', { error });
    onError?.(error);
  };

  return (
    <ErrorBoundary 
      fallback={errorFallback}
      onError={handleError}
    >
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Hook for async error handling
export function useAsyncError() {
  const [, setError] = React.useState();
  
  return React.useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
}