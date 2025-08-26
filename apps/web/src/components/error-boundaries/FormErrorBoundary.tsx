'use client';

import React from 'react';
import { ErrorBoundary } from '../ErrorBoundary';
import { logger } from '@/lib/logger';

interface FormErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
  resetKeys?: Array<string | number>;
}

function FormErrorFallback({ 
  error, 
  resetError 
}: { 
  error: Error; 
  resetError: () => void;
}) {
  // Check if it's a validation error
  const isValidationError = error.message.toLowerCase().includes('validation');
  
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            {isValidationError ? 'Validation Error' : 'Form Submission Error'}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>
              {isValidationError
                ? 'Please check your input and try again.'
                : 'There was a problem submitting the form. Please try again.'}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="mt-1 text-xs">
                {error.message}
              </p>
            )}
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={resetError}
              className="inline-flex items-center rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-200"
            >
              Reset form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormErrorBoundary({
  children,
  onError,
  resetKeys = [],
}: FormErrorBoundaryProps) {
  const resetKeysRef = React.useRef(resetKeys);
  const [resetCount, setResetCount] = React.useState(0);

  // Reset error boundary when resetKeys change
  React.useEffect(() => {
    const hasKeysChanged = resetKeys.some(
      (key, index) => key !== resetKeysRef.current[index]
    );
    
    if (hasKeysChanged) {
      resetKeysRef.current = resetKeys;
      setResetCount(count => count + 1);
    }
  }, [resetKeys]);

  const handleError = (error: Error) => {
    logger.error('Form error', { error });
    onError?.(error);
  };

  return (
    <ErrorBoundary 
      key={resetCount}
      fallback={FormErrorFallback}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for form error handling
export function useFormError() {
  const [error, setError] = React.useState<Error | null>(null);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  const throwError = React.useCallback((error: Error) => {
    setError(error);
    throw error;
  }, []);

  return { error, clearError, throwError };
}