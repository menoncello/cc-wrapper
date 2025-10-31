import type { SessionState } from './session-types';

/**
 * Type alias for timer management
 */
type TimerId = ReturnType<typeof setInterval> | undefined;

/**
 * Type declarations for global scope interval management
 */
declare global {
  var __sessionAutoSaveInterval: TimerId;
}

/**
 * Auto-save management utilities
 */
export const autoSaveUtils = {
  /**
   * Starts auto-save interval
   * @param {() => SessionState} get - Zustand get function to access current state
   * @returns {void}
   */
  start: (get: () => SessionState): void => {
    const { autoSaveInterval } = get();

    // Clear any existing interval
    autoSaveUtils.stop();

    const interval = setInterval(async () => {
      const { saveSession } = get();
      await saveSession();
    }, autoSaveInterval);

    // Store interval ID in global scope for cleanup
    globalThis.__sessionAutoSaveInterval = interval;
  },

  /**
   * Stops auto-save interval
   * @returns {void}
   */
  stop: (): void => {
    const interval = globalThis.__sessionAutoSaveInterval;
    if (interval) {
      clearInterval(interval);
      delete globalThis.__sessionAutoSaveInterval;
    }
  }
};
