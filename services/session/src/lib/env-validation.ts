/**
 * Environment variable validation utilities
 */

/**
 * Validates and sanitizes environment variables
 */
export class EnvValidator {
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private static isValidEndpoint(endpoint: string): boolean {
    // Allow http/https URLs and ws/wss WebSocket URLs
    return /^https?:\/\/|^wss?:\/\//.test(endpoint) && this.isValidUrl(endpoint.replace(/^(wss?):\/\//, 'http$1://'));
  }

  /**
   * Get a required environment variable or throw error
   */
  static required(key: string, validator?: (value: string) => boolean): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    if (validator && !validator(value)) {
      throw new Error(`Environment variable ${key} has invalid value: ${value}`);
    }
    return value;
  }

  /**
   * Get an optional environment variable with default value
   */
  static optional(key: string, defaultValue: string, validator?: (value: string) => boolean): string {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    if (validator && !validator(value)) {
      console.warn(`Environment variable ${key} has invalid value, using default: ${defaultValue}`);
      return defaultValue;
    }
    return value;
  }

  /**
   * Get endpoint URL with validation
   */
  static endpoint(key: string, defaultValue: string): string {
    return this.optional(key, defaultValue, this.isValidEndpoint);
  }

  /**
   * Get API key with basic validation
   */
  static apiKey(key: string, defaultValue?: string): string {
    const validator = (value: string) => value.length >= 8 && /^[a-zA-Z0-9._-]+$/.test(value);
    if (defaultValue) {
      return this.optional(key, defaultValue, validator);
    }
    return this.required(key, validator);
  }

  /**
   * Get numeric value
   */
  static number(key: string, defaultValue: number, min?: number, max?: number): number {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      console.warn(`Environment variable ${key} is not a number, using default: ${defaultValue}`);
      return defaultValue;
    }
    if (min !== undefined && num < min) {
      console.warn(`Environment variable ${key} is below minimum ${min}, using minimum`);
      return min;
    }
    if (max !== undefined && num > max) {
      console.warn(`Environment variable ${key} is above maximum ${max}, using maximum`);
      return max;
    }
    return num;
  }

  /**
   * Get boolean value
   */
  static boolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (!value) {
      return defaultValue;
    }
    return value.toLowerCase() === 'true';
  }
}