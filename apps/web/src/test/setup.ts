import '@testing-library/jest-dom';

import * as matchers from '@testing-library/jest-dom/matchers';
import { afterEach, expect, vi } from 'vitest';

// Extend expect with jest-dom matchers
expect.extend(matchers);

// Mock IntersectionObserverEntry interface for testing
interface MockIntersectionObserverEntry {
  intersectionRatio: number;
  isIntersecting: boolean;
  target: Element;
  boundingClientRect: DOMRectReadOnly;
  intersectionRect: DOMRectReadOnly;
  rootBounds: DOMRectReadOnly | null;
  time: number;
}

// Mock IntersectionObserver interface for testing
interface MockIntersectionObserver {
  callback: (entries: MockIntersectionObserverEntry[]) => void;
  options?: { root?: Element | null; rootMargin?: string; threshold?: number | number[] };
  root: Element | null;
  rootMargin: string;
  thresholds: readonly number[];
  observe: (target: Element) => void;
  unobserve: (target: Element) => void;
  disconnect: () => void;
  takeRecords: () => MockIntersectionObserverEntry[];
}

// Type assertions for testing
type IntersectionObserverEntry = MockIntersectionObserverEntry;
type IntersectionObserver = MockIntersectionObserver;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: (): void => {
      /* mock implementation */
    },
    removeListener: (): void => {
      /* mock implementation */
    },
    addEventListener: (): void => {
      /* mock implementation */
    },
    removeEventListener: (): void => {
      /* mock implementation */
    },
    dispatchEvent: (): boolean => {
      /* mock implementation */
      return true;
    }
  })
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  /**
   * Starts observing the specified element for resize events.
   * Mock implementation that does nothing.
   * @param {Element} _target - The element to observe
   * @param {ResizeObserverOptions} [_options] - Optional configuration options
   * @returns {void}
   */
  observe(_target: Element, _options?: ResizeObserverOptions): void {
    // Mock implementation - does nothing in test environment
  }

  /**
   * Stops observing the specified element.
   * Mock implementation that does nothing.
   * @param {Element} _target - The element to stop observing
   * @returns {void}
   */
  unobserve(_target: Element): void {
    // Mock implementation - does nothing in test environment
  }

  /**
   * Stops observing all elements.
   * Mock implementation that does nothing.
   * @returns {void}
   */
  disconnect(): void {
    // Mock implementation - does nothing in test environment
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(
  (
    callback: (entries: IntersectionObserverEntry[]) => void,
    options?: { root?: Element | null; rootMargin?: string; threshold?: number | number[] }
  ): IntersectionObserver => ({
    callback,
    options,
    root: options?.root || null,
    rootMargin: options?.rootMargin || '',
    thresholds: Array.isArray(options?.threshold)
      ? options.threshold
      : ([options?.threshold ?? 0] as readonly number[]),
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn((): IntersectionObserverEntry[] => [])
  })
);

// Mock localStorage with a simple in-memory implementation
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
})();

// Set localStorage and sessionStorage on global window before any stores are created
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
  writable: true
});

// Also ensure localStorage is available globally for Zustand
(global as any).localStorage = localStorageMock;

// Set test environment flag for Zustand stores
(window as any).__vitest__ = true;

// Clean up after each test
afterEach((): void => {
  vi.clearAllMocks();
  // Clear localStorage store
  localStorageMock.clear();
});
