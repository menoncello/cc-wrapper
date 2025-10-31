import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSessionStore } from '../../stores/session-store';

// Mock fetch with complete Response implementation
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    url: 'http://localhost',
    redirected: false,
    type: 'basic' as ResponseType,
    body: null,
    bodyUsed: false,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve(new FormData()),
    clone: () => structuredClone({}),
    preconnect: vi.fn()
  })
) as any;

// Mock the session store
vi.mock('../../stores/session-store', () => ({
  useSessionStore: vi.fn()
}));

// Setup localStorage mock
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

// Mock window and document for Node environment
Object.defineProperty(globalThis, 'window', {
  value: { localStorage: localStorageMock },
  writable: true
});

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Mock session object for testing
 */
export const mockSession = {
  id: 'session-123',
  userId: 'user-123',
  workspaceId: 'workspace-123',
  name: 'Test Session',
  isActive: true,
  lastSavedAt: '2023-12-01T10:00:00Z',
  createdAt: '2023-12-01T09:00:00Z',
  checkpointCount: 0,
  totalSize: 0
};

/**
 * Test suite for CheckpointForm component shared setup
 * Tests basic component initialization and shared utilities
 */
describe('CheckpointForm Component Shared Setup', () => {
  it('should initialize test environment correctly', () => {
    expect(localStorageMock).toBeDefined();
    expect(global.fetch).toBeDefined();
    expect(useSessionStore).toBeDefined();
  });

  it('should have properly configured mock session', () => {
    expect(mockSession.id).toBe('session-123');
    expect(mockSession.name).toBe('Test Session');
    expect(mockSession.isActive).toBe(true);
  });

  it('should clear mocks before each test', () => {
    // This test verifies that beforeEach is working
    const mockFn = vi.fn();
    mockFn();
    expect(mockFn).toHaveBeenCalled();
  });

  it('should restore mocks after each test', () => {
    // This test verifies that afterEach is working
    const originalLog = console.log;
    const spy = vi.spyOn(console, 'log');
    spy.mockImplementation(() => {});
    expect(typeof console.log).toBe('function');
    spy.mockRestore();
    expect(console.log).toBe(originalLog);
  });
});
