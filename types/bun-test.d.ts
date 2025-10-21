/**
 * Type definitions for Bun test globals
 */

declare global {
  /**
   * Mock function for creating test mocks
   */
  function mock(_implementation?: (..._args: any[]) => any): {
    (..._args: any[]): any;
    mockImplementation(_fn: (..._args: any[]) => any): void;
    mockReturnValue(_value: any): void;
    mockResolvedValue(_value: any): void;
    mockRejectedValue(_error: any): void;
  };

  /**
   * Fail function for explicitly failing tests
   */
  function fail(_message?: string): never;
}

export {};
