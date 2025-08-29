'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Accessible Form Field
interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ children, error, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {children}
        {error && (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

// Accessible Label
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required, className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('block text-sm font-medium text-gray-700', className)}
        {...props}
      >
        {children}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
    );
  }
);

Label.displayName = 'Label';

// Accessible Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, 'aria-describedby': ariaDescribedBy, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'block w-full rounded-md border px-3 py-2',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={ariaDescribedBy}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

// Accessible Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error, className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'block w-full rounded-md border px-3 py-2',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
          className
        )}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

// Accessible Checkbox
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, id, ...props }, ref) => {
    const inputId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="flex items-center">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={cn(
            'h-4 w-4 rounded border-gray-300 text-blue-600',
            'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
        <label htmlFor={inputId} className="ml-2 block text-sm text-gray-900">
          {label}
        </label>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Form validation announcer
export function useFormValidation() {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const { announce } = useAnnouncer();

  const validateField = (name: string, value: any, rules: Record<string, any>) => {
    let error = '';

    if (rules.required && !value) {
      error = `${name} is required`;
    } else if (rules.minLength && value.length < rules.minLength) {
      error = `${name} must be at least ${rules.minLength} characters`;
    } else if (rules.maxLength && value.length > rules.maxLength) {
      error = `${name} must be less than ${rules.maxLength} characters`;
    } else if (rules.pattern && !rules.pattern.test(value)) {
      error = rules.patternMessage || `${name} is invalid`;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    if (error) {
      announce(error, 'polite');
    }

    return !error;
  };

  const clearError = (name: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  return { errors, validateField, clearError };
}

// Import announcer hook
import { useAnnouncer } from '@/hooks/use-announcer';