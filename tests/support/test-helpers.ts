/**
 * Test Helper Utilities
 *
 * Common utilities and helpers for testing across the project.
 * Provides mocking, assertions, and test fixtures.
 */

import { mock } from 'bun:test';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Temporary Directory Manager
 * Creates and manages temporary directories for testing
 */
export class TempDirectory {
  private path: string;
  private created = false;

  constructor(prefix = 'test-') {
    this.path = path.join(
      process.cwd(),
      `${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
  }

  async create(): Promise<string> {
    if (!this.created) {
      await fs.mkdir(this.path, { recursive: true });
      this.created = true;
    }
    return this.path;
  }

  async cleanup(): Promise<void> {
    if (this.created) {
      await fs.rm(this.path, { recursive: true, force: true });
      this.created = false;
    }
  }

  getPath(): string {
    return this.path;
  }

  async createFile(filename: string, content: string): Promise<string> {
    const filePath = path.join(this.path, filename);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  async readFile(filename: string): Promise<string> {
    const filePath = path.join(this.path, filename);
    return await fs.readFile(filePath, 'utf-8');
  }
}

/**
 * Mock Console
 * Captures console output for testing
 */
export class MockConsole {
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
  };

  public logs: string[] = [];
  public errors: string[] = [];
  public warnings: string[] = [];
  public infos: string[] = [];

  constructor() {
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };
  }

  install(): void {
    console.log = (...args: unknown[]) => {
      this.logs.push(args.map(String).join(' '));
    };

    console.error = (...args: unknown[]) => {
      this.errors.push(args.map(String).join(' '));
    };

    console.warn = (...args: unknown[]) => {
      this.warnings.push(args.map(String).join(' '));
    };

    console.info = (...args: unknown[]) => {
      this.infos.push(args.map(String).join(' '));
    };
  }

  restore(): void {
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
  }

  clear(): void {
    this.logs = [];
    this.errors = [];
    this.warnings = [];
    this.infos = [];
  }

  getAllOutput(): string[] {
    return [...this.logs, ...this.errors, ...this.warnings, ...this.infos];
  }
}

/**
 * Async Test Helpers
 */
export const asyncHelpers = {
  /**
   * Wait for a condition to be true with timeout
   */
  waitFor: async (
    condition: () => boolean | Promise<boolean>,
    options: { timeout?: number; interval?: number } = {}
  ): Promise<void> => {
    const { timeout = 5000, interval = 100 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  },

  /**
   * Delay execution for specified milliseconds
   */
  delay: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Retry an async operation with exponential backoff
   */
  retry: async <T>(
    operation: () => Promise<T>,
    options: { maxAttempts?: number; delayMs?: number; backoffFactor?: number } = {}
  ): Promise<T> => {
    const { maxAttempts = 3, delayMs = 1000, backoffFactor = 2 } = options;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxAttempts) {
          await asyncHelpers.delay(delayMs * Math.pow(backoffFactor, attempt - 1));
        }
      }
    }

    throw lastError || new Error('Retry failed');
  }
};

/**
 * Mock Factory
 * Creates common mock objects
 */
export const mockFactory = {
  /**
   * Create a mock API client
   */
  apiClient: () => ({
    get: mock(async (_url: string) => ({ data: {} })),
    post: mock(async (_url: string, __data: unknown) => ({ data: {} })),
    put: mock(async (_url: string, __data: unknown) => ({ data: {} })),
    delete: mock(async (_url: string) => ({ data: {} }))
  }),

  /**
   * Create a mock logger
   */
  logger: () => ({
    debug: mock((_message: string) => {}),
    info: mock((_message: string) => {}),
    warn: mock((_message: string) => {}),
    error: mock((_message: string, _error?: Error) => {})
  }),

  /**
   * Create a mock file system
   */
  fileSystem: () => ({
    readFile: mock(async (_path: string) => 'mock content'),
    writeFile: mock(async (_path: string, _content: string) => {}),
    exists: mock(async (_path: string) => true),
    delete: mock(async (_path: string) => {})
  })
};

/**
 * Assertion Helpers
 * Custom assertion utilities
 */
export const assertions = {
  /**
   * Assert that a value is within a range
   */
  assertInRange: (value: number, min: number, max: number, message?: string): void => {
    if (value < min || value > max) {
      throw new Error(message || `Expected ${value} to be between ${min} and ${max}`);
    }
  },

  /**
   * Assert that an array contains items matching a predicate
   */
  assertArrayContains: <T>(
    array: T[],
    predicate: (_item: T) => boolean,
    message?: string
  ): void => {
    if (!array.some(predicate)) {
      throw new Error(message || 'Array does not contain matching item');
    }
  },

  /**
   * Assert that a function throws a specific error type
   */
  assertThrowsType: async <T extends Error>(
    fn: () => Promise<unknown> | unknown,
    errorType: new (..._args: unknown[]) => T,
    message?: string
  ): Promise<void> => {
    try {
      await fn();
      throw new Error(message || `Expected function to throw ${errorType.name}`);
    } catch (error) {
      if (!(error instanceof errorType)) {
        throw new TypeError(message || `Expected ${errorType.name} but got ${error.constructor.name}`);
      }
    }
  }
};

/**
 * Test Data Generators
 * Generate test data for common scenarios
 */
export const generators = {
  /**
   * Generate random string
   */
  randomString: (length = 10): string => {
    return Math.random()
      .toString(36)
      .substring(2, length + 2);
  },

  /**
   * Generate random email
   */
  randomEmail: (): string => {
    return `test-${generators.randomString()}@example.com`;
  },

  /**
   * Generate random ID
   */
  randomId: (): string => {
    return `id-${Date.now()}-${generators.randomString(8)}`;
  },

  /**
   * Generate test user object
   */
  testUser: (overrides: Partial<TestUser> = {}): TestUser => ({
    id: generators.randomId(),
    email: generators.randomEmail(),
    name: `Test User ${generators.randomString(5)}`,
    createdAt: new Date(),
    ...overrides
  })
};

export interface TestUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

/**
 * Performance Helpers
 * Measure and assert performance metrics
 */
export class PerformanceMonitor {
  private startTime = 0;
  private endTime = 0;

  start(): void {
    this.startTime = performance.now();
  }

  stop(): void {
    this.endTime = performance.now();
  }

  getDuration(): number {
    return this.endTime - this.startTime;
  }

  assertDurationUnder(maxMs: number, message?: string): void {
    const duration = this.getDuration();
    if (duration > maxMs) {
      throw new Error(
        message || `Expected duration under ${maxMs}ms but got ${duration.toFixed(2)}ms`
      );
    }
  }

  static async measure<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  }
}
