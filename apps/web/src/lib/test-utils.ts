import { mock } from 'bun:test';

// Mock fetch to control HTTP requests
export const mockedFetch = mock((_url?: string | Request, _options?: RequestInit) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
    text: () => Promise.resolve('{"success": true}')
  } as globalThis.Response);
});

// Mock dispatchEvent function to avoid inline arrow function
export const dispatchEventMock = mock(() => true);

// Mock localStorage for token testing
export const localStorageMock = {
  getItem: mock((() => null) as (key: string) => string | null),
  setItem: mock((() => {
    // Mock implementation
  }) as (key: string, value: string) => void),
  removeItem: mock((() => {
    // Mock implementation
  }) as (key: string) => void),
  clear: mock((() => {
    // Mock implementation
  }) as () => void),
  length: 0,
  key: mock((() => null) as (index: number) => string | null)
};

/**
 * Creates mock browser APIs for the window object
 *
 * @returns {object} Mock browser APIs
 */
function createMockBrowserAPIs(): Record<string, unknown> {
  return {
    btoa: (str: string) => Buffer.from(str).toString('base64'),
    atob: (str: string) => Buffer.from(str, 'base64').toString(),
    Blob: globalThis.Blob,
    FormData: globalThis.FormData,
    URLSearchParams: globalThis.URLSearchParams,
    WebSocket: globalThis.WebSocket,
    Event: globalThis.Event,
    CustomEvent: globalThis.CustomEvent,
    AbortController: globalThis.AbortController,
    AbortSignal: globalThis.AbortSignal,
    Headers: globalThis.Headers,
    Request: globalThis.Request,
    Response: globalThis.Response,
    TextEncoder: globalThis.TextEncoder,
    TextDecoder: globalThis.TextDecoder,
    URL: globalThis.URL
  };
}

/**
 * Creates mock JavaScript built-ins for the window object
 *
 * @returns {object} Mock JavaScript built-ins
 */
function createMockJavaScriptBuiltIns(): Record<string, unknown> {
  return {
    JSON: globalThis.JSON,
    Math: globalThis.Math,
    parseInt: Number.parseInt,
    parseFloat: Number.parseFloat,
    isNaN: Number.isNaN,
    isFinite: Number.isFinite,
    encodeURIComponent: globalThis.encodeURIComponent,
    decodeURIComponent: globalThis.decodeURIComponent,
    encodeURI: globalThis.encodeURI,
    decodeURI: globalThis.decodeURI
  };
}

/**
 * Creates mock error constructors for the window object
 *
 * @returns {object} Mock error constructors
 */
function createMockErrorConstructors(): Record<string, unknown> {
  return {
    Error: globalThis.Error,
    TypeError: globalThis.TypeError,
    ReferenceError: globalThis.ReferenceError,
    SyntaxError: globalThis.SyntaxError,
    RangeError: globalThis.RangeError,
    EvalError: globalThis.EvalError,
    URIError: globalThis.URIError
  };
}

/**
 * Creates mock collection objects for the window object
 *
 * @returns {object} Mock collection objects
 */
function createMockCollections(): Record<string, unknown> {
  return {
    Map: globalThis.Map,
    Set: globalThis.Set,
    WeakMap: globalThis.WeakMap,
    WeakSet: globalThis.WeakSet
  };
}

/**
 * Creates mock global objects for the window object
 *
 * @returns {object} Mock global objects
 */
function createMockGlobalObjects(): Record<string, unknown> {
  const errorConstructors = createMockErrorConstructors();
  const collections = createMockCollections();

  return {
    console: globalThis.console,
    Array: globalThis.Array,
    Object: globalThis.Object,
    String: globalThis.String,
    Number: globalThis.Number,
    Boolean: globalThis.Boolean,
    Date: globalThis.Date,
    RegExp: globalThis.RegExp,
    ...errorConstructors,
    ...collections,
    Proxy: globalThis.Proxy,
    Reflect: globalThis.Reflect,
    Promise: globalThis.Promise,
    Symbol: globalThis.Symbol,
    Function: globalThis.Function,
    undefined: globalThis.undefined,
    NaN: Number.NaN,
    Infinity: globalThis.Infinity,
    globalThis: globalThis.globalThis
  };
}

/**
 * Creates mock typed arrays for the window object
 *
 * @returns {object} Mock typed arrays
 */
function createMockTypedArrays(): Record<string, unknown> {
  return {
    ArrayBuffer: globalThis.ArrayBuffer,
    DataView: globalThis.DataView,
    Int8Array: globalThis.Int8Array,
    Uint8Array: globalThis.Uint8Array,
    Uint8ClampedArray: globalThis.Uint8ClampedArray,
    Int16Array: globalThis.Int16Array,
    Uint16Array: globalThis.Uint16Array,
    Int32Array: globalThis.Int32Array,
    Uint32Array: globalThis.Uint32Array,
    Float32Array: globalThis.Float32Array,
    Float64Array: globalThis.Float64Array,
    BigInt64Array: globalThis.BigInt64Array,
    BigUint64Array: globalThis.BigUint64Array,
    BigInt: globalThis.BigInt
  };
}

/**
 * Creates mock DOM and browser interface objects for the window object
 *
 * @returns {object} Mock DOM and browser interface objects
 */
function createMockDOMObjects(): Record<string, unknown> {
  return {
    localStorage: localStorageMock,
    location: { href: '' } as Location,
    document: {} as Document,
    navigator: {} as Navigator,
    history: {} as History,
    performance: {} as Performance,
    addEventListener: mock(() => {
      // Mock implementation
    }),
    removeEventListener: mock(() => {
      // Mock implementation
    }),
    dispatchEvent: dispatchEventMock,
    requestAnimationFrame: mock(() => 0),
    cancelAnimationFrame: mock(() => {
      // Mock implementation
    }),
    fetch: mockedFetch as unknown as typeof globalThis.fetch
  };
}

/**
 * Creates mock timer functions for the window object
 *
 * @returns {object} Mock timer functions
 */
function createMockTimers(): Record<string, unknown> {
  return {
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval
  };
}

/**
 * Creates a comprehensive mock window object for testing
 *
 * @returns {typeof globalThis.window} Mock window object
 */
export function createMockWindow(): typeof globalThis.window {
  const browserAPIs = createMockBrowserAPIs();
  const jsBuiltIns = createMockJavaScriptBuiltIns();
  const globalObjects = createMockGlobalObjects();
  const typedArrays = createMockTypedArrays();
  const domObjects = createMockDOMObjects();
  const timers = createMockTimers();

  return {
    ...domObjects,
    ...timers,
    ...browserAPIs,
    ...jsBuiltIns,
    ...globalObjects,
    ...typedArrays
  } as unknown as typeof globalThis.window;
}

/**
 * Sets up the global test environment
 *
 * @returns void
 */
export function setupTestEnvironment(): void {
  // Reset mocks
  mockedFetch.mockClear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();

  // Reset localStorage to return null by default (no token stored)
  localStorageMock.getItem.mockReturnValue(null);

  // Mock window and localStorage for testing
  global.window = createMockWindow();

  // Mock localStorage as global variable (used directly in api.ts)
  global.localStorage = localStorageMock;

  // Set the mock to global with proper typing
  global.fetch = mockedFetch as unknown as typeof globalThis.fetch;
}

/**
 * Creates a mock response for successful requests
 *
 * @template T The type of data being returned
 * @param {T} data - The response data to return
 * @param {number} status - HTTP status code (default: 200)
 * @returns {Promise<Response>} Mock response object
 */
export function createMockSuccessResponse<T = unknown>(data: T, status = 200): Promise<Response> {
  return Promise.resolve({
    ok: true,
    status,
    json: () => Promise.resolve(data)
  } as globalThis.Response);
}

/**
 * Creates a mock response for error requests
 *
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @returns {Promise<Response>} Mock error response object
 */
export function createMockErrorResponse(status: number, message?: string): Promise<Response> {
  return Promise.resolve({
    ok: false,
    status,
    statusText: message || 'Error',
    json: () => Promise.resolve({ message: message || 'Error' })
  } as globalThis.Response);
}

/**
 * Creates a mock response with failed JSON parsing
 *
 * @param {number} status - HTTP status code
 * @param {string} statusText - HTTP status text
 * @returns {Promise<Response>} Mock response with failed JSON parsing
 */
export function createMockFailedJsonResponse(
  status: number,
  statusText: string
): Promise<Response> {
  return Promise.resolve({
    ok: false,
    status,
    statusText,
    json: () => Promise.reject(new Error('Invalid JSON'))
  } as globalThis.Response);
}

/**
 * Creates a mock network error
 *
 * @param {string} message - Error message (default: 'Network error')
 * @returns {Promise<never>} Rejected promise with network error
 */
export function createMockNetworkError(message = 'Network error'): Promise<never> {
  return Promise.reject(new Error(message));
}
