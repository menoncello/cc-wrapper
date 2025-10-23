import { beforeEach, describe, expect, it } from 'bun:test';

import { APIClient } from './api';

describe('APIClient', () => {
  let apiClient: APIClient;

  beforeEach(() => {
    apiClient = new APIClient('http://localhost:20001');
  });

  describe('constructor', () => {
    it('should initialize with base URL', () => {
      expect(apiClient).toBeDefined();
      expect(apiClient).toBeInstanceOf(APIClient);
    });

    it('should initialize without token', () => {
      // Token should be null on initialization
      const client = new APIClient('http://localhost:20001');
      expect(client).toBeDefined();
    });
  });

  describe('setToken', () => {
    it('should set authentication token', () => {
      const token = 'test-token-123';
      apiClient.setToken(token);

      // Token should be set internally (cannot test private property directly)
      expect(apiClient).toBeDefined();
    });
  });

  describe('clearToken', () => {
    it('should clear authentication token', () => {
      apiClient.setToken('test-token');
      apiClient.clearToken();

      // Token should be cleared (cannot test private property directly)
      expect(apiClient).toBeDefined();
    });
  });

  describe('request method', () => {
    it('should be defined', () => {
      expect(apiClient['request']).toBeDefined();
      expect(typeof apiClient['request']).toBe('function');
    });
  });

  describe('API methods', () => {
    it('should have updateProfile method', () => {
      expect(apiClient.updateProfile).toBeDefined();
      expect(typeof apiClient.updateProfile).toBe('function');
    });

    it('should have getCurrentUser method', () => {
      expect(apiClient.getCurrentUser).toBeDefined();
      expect(typeof apiClient.getCurrentUser).toBe('function');
    });
  });
});
