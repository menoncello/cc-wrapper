/**
 * Unit Test Example
 *
 * Unit tests focus on testing individual functions, classes, or modules in isolation.
 * They should be fast, deterministic, and independent of external dependencies.
 *
 * Best Practices:
 * - Test one thing at a time
 * - Use descriptive test names
 * - Follow AAA pattern: Arrange, Act, Assert
 * - Mock external dependencies
 * - Aim for high code coverage
 */

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

/**
 * Example function under test - String utilities
 */
class StringUtils {
  static capitalize(str: string): string {
    if (!str || str.length === 0) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) {
      return str;
    }
    return `${str.slice(0, maxLength - 3)}...`;
  }

  static slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\s\w-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

describe('StringUtils - Unit Tests', () => {
  describe('capitalize', () => {
    test('should capitalize first letter of lowercase string', () => {
      // Arrange
      const input = 'hello world';

      // Act
      const result = StringUtils.capitalize(input);

      // Assert
      expect(result).toBe('Hello world');
    });

    test('should handle uppercase strings', () => {
      const result = StringUtils.capitalize('HELLO');
      expect(result).toBe('Hello');
    });

    test('should handle empty strings', () => {
      const result = StringUtils.capitalize('');
      expect(result).toBe('');
    });

    test('should handle single character', () => {
      const result = StringUtils.capitalize('a');
      expect(result).toBe('A');
    });
  });

  describe('truncate', () => {
    test('should truncate long strings', () => {
      const input = 'This is a very long string that needs truncation';
      const result = StringUtils.truncate(input, 20);

      expect(result).toBe('This is a very lo...');
      expect(result.length).toBe(20);
    });

    test('should not truncate short strings', () => {
      const input = 'Short';
      const result = StringUtils.truncate(input, 10);

      expect(result).toBe('Short');
    });

    test('should handle exact length match', () => {
      const input = 'Exactly';
      const result = StringUtils.truncate(input, 7);

      expect(result).toBe('Exactly');
    });
  });

  describe('slugify', () => {
    test('should convert string to URL-friendly slug', () => {
      const input = 'Hello World!';
      const result = StringUtils.slugify(input);

      expect(result).toBe('hello-world');
    });

    test('should handle special characters', () => {
      const input = 'C++ Programming & Design';
      const result = StringUtils.slugify(input);

      expect(result).toBe('c-programming-design');
    });

    test('should handle multiple spaces', () => {
      const input = 'multiple   spaces    here';
      const result = StringUtils.slugify(input);

      expect(result).toBe('multiple-spaces-here');
    });

    test('should trim leading and trailing dashes', () => {
      const input = '  -trimmed-  ';
      const result = StringUtils.slugify(input);

      expect(result).toBe('trimmed');
    });
  });
});

/**
 * Example class with dependencies - demonstrates mocking
 */
class UserService {
  constructor(private _apiClient: ApiClient) {}

  async getUser(id: string): Promise<User> {
    return this._apiClient.fetch(`/users/${id}`);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return this._apiClient.post(`/users/${id}`, data);
  }
}

interface ApiClient {
  fetch: (_url: string) => Promise<User>;
  post: (_url: string, _data: unknown) => Promise<User>;
}

interface User {
  id: string;
  name: string;
  email: string;
}

describe('UserService - Mocking Example', () => {
  let mockApiClient: ApiClient;
  let userService: UserService;

  beforeEach(() => {
    // Create mock API client
    mockApiClient = {
      fetch: mock(
        async (_url: string): Promise<User> => ({
          id: '123',
          name: 'John Doe',
          email: 'john@example.com'
        })
      ),
      post: mock(
        async (_url: string, _data: unknown): Promise<User> => ({
          id: '123',
          name: 'John Updated',
          email: 'john@example.com'
        })
      )
    };

    userService = new UserService(mockApiClient);
  });

  afterEach(() => {
    // Clean up mocks
    mockApiClient.fetch = mock();
    mockApiClient.post = mock();
  });

  test('should fetch user by ID', async () => {
    const user = await userService.getUser('123');

    expect(user).toEqual({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com'
    });
  });

  test('should update user data', async () => {
    const updated = await userService.updateUser('123', { name: 'John Updated' });

    expect(updated.name).toBe('John Updated');
  });
});
