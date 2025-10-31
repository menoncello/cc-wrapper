/**
 * Test Password Helper for Auth Service
 *
 * Simple password generation utility to avoid import path issues
 */

/**
 * Generate a test password with predictable pattern for testing
 * @param seed - Optional seed for consistent password generation
 * @returns Generated test password
 */
export const generateTestPassword = (seed = 'test'): string => {
  const basePattern = seed === 'test' ? 'Test' : 'TestUser';
  const randomNumber = seed === 'test' ? 123 : Math.floor(Math.random() * 900) + 100;
  const specialChar = seed === 'test' ? '!' : '@';

  return `${basePattern}Password${randomNumber}${specialChar}`;
};
