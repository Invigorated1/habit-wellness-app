/**
 * Keyboard navigation utilities
 */

export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

export type Key = typeof KEYS[keyof typeof KEYS];

/**
 * Checks if a keyboard event matches any of the given keys
 */
export function isKey(event: KeyboardEvent, ...keys: Key[]): boolean {
  return keys.includes(event.key as Key);
}

/**
 * Manages keyboard navigation for lists and grids
 */
export class KeyboardNavigator {
  private items: HTMLElement[];
  private currentIndex: number = -1;
  private orientation: 'horizontal' | 'vertical' | 'grid';
  private wrap: boolean;
  private cols?: number;
  
  constructor(options: {
    items: HTMLElement[];
    orientation?: 'horizontal' | 'vertical' | 'grid';
    wrap?: boolean;
    cols?: number;
  }) {
    this.items = options.items;
    this.orientation = options.orientation || 'vertical';
    this.wrap = options.wrap ?? true;
    this.cols = options.cols;
  }
  
  handleKeyDown(event: KeyboardEvent): boolean {
    let handled = false;
    
    switch (event.key) {
      case KEYS.ARROW_UP:
        if (this.orientation !== 'horizontal') {
          this.movePrevious();
          handled = true;
        }
        break;
        
      case KEYS.ARROW_DOWN:
        if (this.orientation !== 'horizontal') {
          this.moveNext();
          handled = true;
        }
        break;
        
      case KEYS.ARROW_LEFT:
        if (this.orientation !== 'vertical') {
          this.movePrevious();
          handled = true;
        }
        break;
        
      case KEYS.ARROW_RIGHT:
        if (this.orientation !== 'vertical') {
          this.moveNext();
          handled = true;
        }
        break;
        
      case KEYS.HOME:
        this.moveToFirst();
        handled = true;
        break;
        
      case KEYS.END:
        this.moveToLast();
        handled = true;
        break;
    }
    
    if (handled) {
      event.preventDefault();
      this.focusCurrent();
    }
    
    return handled;
  }
  
  private moveNext() {
    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
    } else if (this.wrap) {
      this.currentIndex = 0;
    }
  }
  
  private movePrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else if (this.wrap) {
      this.currentIndex = this.items.length - 1;
    }
  }
  
  private moveToFirst() {
    this.currentIndex = 0;
  }
  
  private moveToLast() {
    this.currentIndex = this.items.length - 1;
  }
  
  private focusCurrent() {
    if (this.currentIndex >= 0 && this.currentIndex < this.items.length) {
      this.items[this.currentIndex].focus();
    }
  }
  
  setActiveIndex(index: number) {
    if (index >= 0 && index < this.items.length) {
      this.currentIndex = index;
    }
  }
  
  updateItems(items: HTMLElement[]) {
    this.items = items;
    if (this.currentIndex >= items.length) {
      this.currentIndex = items.length - 1;
    }
  }
}

/**
 * React hook for keyboard navigation
 */
export function useKeyboardNavigation(
  ref: React.RefObject<HTMLElement>,
  options: {
    selector: string;
    orientation?: 'horizontal' | 'vertical' | 'grid';
    wrap?: boolean;
    cols?: number;
  }
) {
  const navigatorRef = React.useRef<KeyboardNavigator | null>(null);
  
  React.useEffect(() => {
    if (!ref.current) return;
    
    const items = Array.from(
      ref.current.querySelectorAll(options.selector)
    ) as HTMLElement[];
    
    navigatorRef.current = new KeyboardNavigator({
      items,
      ...options,
    });
    
    const handleKeyDown = (event: KeyboardEvent) => {
      navigatorRef.current?.handleKeyDown(event);
    };
    
    ref.current.addEventListener('keydown', handleKeyDown);
    
    return () => {
      ref.current?.removeEventListener('keydown', handleKeyDown);
    };
  }, [ref, options]);
  
  return navigatorRef.current;
}

// Import React
import React from 'react';