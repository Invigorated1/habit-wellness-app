'use client';

import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { logger } from '@/lib/logger';

interface DataErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  showDetails?: boolean;
}

function DataErrorFallback({ 
  error, 
  resetError,
  onRetry,
  showDetails = false,
}: { 
  error: Error; 
  resetError: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
}) {
  const isNetworkError = error.message.toLowerCase().includes('network') || 
                        error.message.toLowerCase().includes('fetch');
  const isAuthError = error.message.toLowerCase().includes('unauthorized') ||
                      error.message.toLowerCase().includes('401');
  
  const handleRetry = () => {
    onRetry?.();
    resetError();
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">
        {isNetworkError ? (
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        ) : (
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isNetworkError
          ? 'Connection Problem'
          : isAuthError
          ? 'Authentication Required'
          : 'Unable to Load Data'}
      </h3>

      <p className="text-sm text-gray-600 mb-6 max-w-md">
        {isNetworkError
          ? 'Please check your internet connection and try again.'
          : isAuthError
          ? 'Your session may have expired. Please sign in again.'
          : 'We encountered an error while loading this data.'}
      </p>

      {showDetails && process.env.NODE_ENV === 'development' && (
        <details className="mb-6 text-left max-w-md w-full">
          <summary className="cursor-pointer text-sm text-gray-500 mb-2">
            Technical details
          </summary>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
            {error.message}
          </pre>
        </details>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Try Again
        </button>

        {isAuthError && (
          <button
            onClick={() => window.location.href = '/sign-in'}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
}

export function DataErrorBoundary({
  children,
  onRetry,
  showDetails = false,
}: DataErrorBoundaryProps) {
  const handleError = (error: Error) => {
    logger.error('Data loading error', { 
      error,
      component: 'DataErrorBoundary',
    });
  };

  return (
    <ErrorBoundary 
      fallback={(props) => (
        <DataErrorFallback 
          {...props} 
          onRetry={onRetry}
          showDetails={showDetails}
        />
      )}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}

// Error retry hook
export function useErrorRetry() {
  const [retryCount, setRetryCount] = React.useState(0);
  const [lastError, setLastError] = React.useState<Error | null>(null);

  const retry = React.useCallback(() => {
    setRetryCount(count => count + 1);
    setLastError(null);
  }, []);

  const reset = React.useCallback(() => {
    setRetryCount(0);
    setLastError(null);
  }, []);

  const recordError = React.useCallback((error: Error) => {
    setLastError(error);
  }, []);

  return {
    retryCount,
    lastError,
    retry,
    reset,
    recordError,
  };
}