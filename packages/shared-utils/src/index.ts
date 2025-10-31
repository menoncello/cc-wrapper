/**
 * Capitalizes the first letter of a string.
 * @param {string} str - The string to capitalize.
 * @returns {string} The capitalized string.
 */
export function capitalize(str: string): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

/**
 * Checks if a value is defined (not null or undefined).
 * @param {T | null | undefined} value - The value to check.
 * @returns {boolean} True if the value is defined, false otherwise.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
