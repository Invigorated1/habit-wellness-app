/**
 * Focus trap utility for modals and dialogs
 */
export class FocusTrap {
  private element: HTMLElement;
  private previouslyFocusedElement: HTMLElement | null = null;
  private focusableElements: HTMLElement[] = [];
  
  constructor(element: HTMLElement) {
    this.element = element;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleFocusIn = this.handleFocusIn.bind(this);
  }
  
  activate() {
    // Save currently focused element
    this.previouslyFocusedElement = document.activeElement as HTMLElement;
    
    // Get all focusable elements
    this.updateFocusableElements();
    
    // Add event listeners
    this.element.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('focusin', this.handleFocusIn);
    
    // Focus first element
    if (this.focusableElements.length > 0) {
      this.focusableElements[0].focus();
    }
  }
  
  deactivate() {
    // Remove event listeners
    this.element.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('focusin', this.handleFocusIn);
    
    // Restore focus
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus();
    }
  }
  
  private updateFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ];
    
    this.focusableElements = Array.from(
      this.element.querySelectorAll(focusableSelectors.join(','))
    ) as HTMLElement[];
  }
  
  private handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    
    const firstElement = this.focusableElements[0];
    const lastElement = this.focusableElements[this.focusableElements.length - 1];
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
  
  private handleFocusIn(event: FocusEvent) {
    if (!this.element.contains(event.target as Node)) {
      event.preventDefault();
      this.focusableElements[0]?.focus();
    }
  }
}

/**
 * React hook for focus trap
 */
export function useFocusTrap(ref: React.RefObject<HTMLElement>, active: boolean) {
  const trapRef = React.useRef<FocusTrap | null>(null);
  
  React.useEffect(() => {
    if (!ref.current) return;
    
    if (active) {
      trapRef.current = new FocusTrap(ref.current);
      trapRef.current.activate();
    }
    
    return () => {
      if (trapRef.current) {
        trapRef.current.deactivate();
        trapRef.current = null;
      }
    };
  }, [ref, active]);
}

// Import React
import React from 'react';