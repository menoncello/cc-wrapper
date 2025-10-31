import { afterAll, afterEach, beforeAll } from 'bun:test';
import { type DOMWindow, JSDOM } from 'jsdom';

// Vitest global types
declare global {
  var vi:
    | {
        clearAllMocks: () => void;
      }
    | undefined;

  // DOM type declarations for JSDOM window extension
  interface JSDOMWindow extends Window {
    HTMLElement: typeof globalThis.HTMLElement;
    HTMLDivElement: typeof globalThis.HTMLDivElement;
    HTMLButtonElement: typeof globalThis.HTMLButtonElement;
    HTMLSpanElement: typeof globalThis.HTMLSpanElement;
    HTMLAnchorElement: typeof globalThis.HTMLAnchorElement;
    HTMLImageElement: typeof globalThis.HTMLImageElement;
    HTMLInputElement: typeof globalThis.HTMLInputElement;
    HTMLTextAreaElement: typeof globalThis.HTMLTextAreaElement;
    HTMLSelectElement: typeof globalThis.HTMLSelectElement;
    HTMLOptionElement: typeof globalThis.HTMLOptionElement;
    HTMLFormElement: typeof globalThis.HTMLFormElement;
    HTMLStyleElement: typeof globalThis.HTMLStyleElement;
    HTMLScriptElement: typeof globalThis.HTMLScriptElement;
    HTMLHeadElement: typeof globalThis.HTMLHeadElement;
    HTMLBodyElement: typeof globalThis.HTMLBodyElement;
    HTMLHtmlElement: typeof globalThis.HTMLHtmlElement;
    Element: typeof globalThis.Element;
    Node: typeof globalThis.Node;
    NodeList: typeof globalThis.NodeList;
    HTMLCollection: typeof globalThis.HTMLCollection;
    Event: typeof globalThis.Event;
    MouseEvent: typeof globalThis.MouseEvent;
    KeyboardEvent: typeof globalThis.KeyboardEvent;
    FocusEvent: typeof globalThis.FocusEvent;
    EventTarget: typeof globalThis.EventTarget;
    Storage: typeof globalThis.Storage;
    URL: typeof globalThis.URL;
    URLSearchParams: typeof globalThis.URLSearchParams;
  }
}

/**
 * Creates a DOM environment using JSDOM for testing
 * @returns {JSDOM} JSDOM instance
 */
function createDomEnvironment(): JSDOM {
  return new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost:3000',
    pretendToBeVisual: true,
    resources: 'usable'
  });
}

/**
 * Sets up basic HTML element globals
 * @param {DOMWindow} window - The JSDOM window object
 */
function setupBasicHTMLElements(window: DOMWindow): void {
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.HTMLDivElement = window.HTMLDivElement;
  globalThis.HTMLButtonElement = window.HTMLButtonElement;
  globalThis.HTMLSpanElement = window.HTMLSpanElement;
  globalThis.HTMLAnchorElement = window.HTMLAnchorElement;
  globalThis.HTMLImageElement = window.HTMLImageElement;
  globalThis.HTMLInputElement = window.HTMLInputElement;
  globalThis.HTMLTextAreaElement = window.HTMLTextAreaElement;
  globalThis.HTMLSelectElement = window.HTMLSelectElement;
}

/**
 * Sets up form and structure element globals
 * @param {DOMWindow} window - The JSDOM window object
 */
function setupFormAndStructuralElements(window: DOMWindow): void {
  globalThis.HTMLOptionElement = window.HTMLOptionElement;
  globalThis.HTMLFormElement = window.HTMLFormElement;
  globalThis.HTMLStyleElement = window.HTMLStyleElement;
  globalThis.HTMLScriptElement = window.HTMLScriptElement;
  globalThis.HTMLHeadElement = window.HTMLHeadElement;
  globalThis.HTMLBodyElement = window.HTMLBodyElement;
  globalThis.HTMLHtmlElement = window.HTMLHtmlElement;
}

/**
 * Sets up DOM element globals on globalThis
 * @param {DOMWindow} window - The JSDOM window object
 */
function setupDomElementGlobals(window: DOMWindow): void {
  setupBasicHTMLElements(window);
  setupFormAndStructuralElements(window);
}

/**
 * Sets up DOM core globals on globalThis
 * @param {DOMWindow} window - The JSDOM window object
 */
function setupDomCoreGlobals(window: DOMWindow): void {
  globalThis.document = window.document;
  globalThis.window = window as unknown as Window & typeof globalThis;
  globalThis.navigator = window.navigator;
  globalThis.Element = window.Element;
  globalThis.Node = window.Node;
  globalThis.NodeList = window.NodeList;
  globalThis.HTMLCollection = window.HTMLCollection;
}

/**
 * Sets up DOM event globals on globalThis
 * @param {DOMWindow} window - The JSDOM window object
 */
function setupDomEventGlobals(window: DOMWindow): void {
  globalThis.Event = window.Event;
  globalThis.MouseEvent = window.MouseEvent;
  globalThis.KeyboardEvent = window.KeyboardEvent;
  globalThis.FocusEvent = window.FocusEvent;
  globalThis.EventTarget = window.EventTarget;
}

/**
 * Sets up DOM storage and navigation globals on globalThis
 * @param {DOMWindow} window - The JSDOM window object
 */
function setupDomStorageGlobals(window: DOMWindow): void {
  globalThis.Storage = window.Storage;
  globalThis.localStorage = window.localStorage;
  globalThis.sessionStorage = window.sessionStorage;
  globalThis.URL = window.URL;
  globalThis.URLSearchParams = window.URLSearchParams;
  globalThis.history = window.history;
  globalThis.location = window.location;
  globalThis.console = window.console;
}

/**
 * Sets up complete DOM environment for testing
 */
function setupDomEnvironment(): void {
  if (typeof globalThis.document !== 'undefined') {
    return; // DOM already set up
  }

  const dom = createDomEnvironment();
  const { window } = dom;

  setupDomCoreGlobals(window);
  setupDomElementGlobals(window);
  setupDomEventGlobals(window);
  setupDomStorageGlobals(window);
}

// Set up DOM environment
beforeAll((): void => {
  setupDomEnvironment();
});

// Clean up after each test
afterEach((): void => {
  // Clear any mocks
  if (vi?.clearAllMocks) {
    vi.clearAllMocks();
  }
});

// Clean up DOM after all tests
afterAll((): void => {
  // Reset DOM if needed
  if (globalThis.document?.body) {
    globalThis.document.body.innerHTML = '';
  }
});
