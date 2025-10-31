// Session state serialization and compression utilities
// Handles workspace state capture, optimization, and incremental updates

import type { SessionConfig,WorkspaceState } from '../types/session.js';
import { compressData, decompressData, decryptData, encryptData, generateChecksum, verifyChecksum } from './encryption.js';

// Default configuration for state serialization
const DEFAULT_CONFIG: Required<Omit<SessionConfig, 'autoSaveInterval' | 'retentionDays' | 'checkpointRetention'>> = {
  maxSessionSize: 50 * 1024 * 1024, // 50MB
  compressionEnabled: true,
  encryptionEnabled: true
};

/**
 * Session state serializer class
 */
export class SessionStateSerializer {
  private config: Required<Omit<SessionConfig, 'autoSaveInterval' | 'retentionDays' | 'checkpointRetention'>>;
  private previousState: string | null = null;
  private previousChecksum: string | null = null;

  /**
   *
   * @param config
   */
  constructor(config?: Partial<SessionConfig>) {
    this.config = {
      maxSessionSize: config?.maxSessionSize || DEFAULT_CONFIG.maxSessionSize,
      compressionEnabled: config?.compressionEnabled ?? DEFAULT_CONFIG.compressionEnabled,
      encryptionEnabled: config?.encryptionEnabled ?? DEFAULT_CONFIG.encryptionEnabled
    };
  }

  /**
   * Serialize and optionally encrypt workspace state
   * @param workspaceState
   * @param encryptionKey
   */
  async serializeState(
    workspaceState: WorkspaceState,
    encryptionKey?: string
  ): Promise<{
    data: string;
    checksum: string;
    size: number;
    compressed: boolean;
    encrypted: boolean;
  }> {
    try {
      // Validate workspace state structure
      this.validateWorkspaceState(workspaceState);

      // Validate state size
      const serializedState = JSON.stringify(workspaceState);
      if (Buffer.byteLength(serializedState, 'utf8') > this.config.maxSessionSize) {
        throw new Error(`Session state exceeds maximum size of ${this.config.maxSessionSize} bytes`);
      }

      let processedData = serializedState;
      let compressed = false;
      let encrypted = false;

      // Apply compression if enabled
      if (this.config.compressionEnabled) {
        processedData = await compressData(processedData);
        compressed = true;
      }

      // Apply encryption if enabled and key provided
      if (this.config.encryptionEnabled && encryptionKey) {
        const encryptedResult = await encryptData(processedData, encryptionKey);
        processedData = JSON.stringify(encryptedResult);
        encrypted = true;
      }

      // Generate checksum for integrity verification
      const checksum = await generateChecksum(processedData);

      return {
        data: processedData,
        checksum,
        size: Buffer.byteLength(processedData, 'utf8'),
        compressed,
        encrypted
      };
    } catch (error) {
      throw new Error(`State serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deserialize and decrypt workspace state
   * @param data
   * @param checksum
   * @param encryptionKey
   */
  async deserializeState(
    data: string,
    checksum: string,
    encryptionKey?: string
  ): Promise<WorkspaceState> {
    try {
      // Verify data integrity
      const isValid = await verifyChecksum(data, checksum);
      if (!isValid) {
        throw new Error('Data integrity check failed - data may be corrupted');
      }

      let processedData = data;

      // Decrypt if needed
      if (encryptionKey && this.config.encryptionEnabled) {
        try {
          const encryptedData = JSON.parse(data);
          processedData = await decryptData(encryptedData, encryptionKey);
        } catch {
          throw new Error('Decryption failed - invalid key or corrupted data');
        }
      }

      // Decompress if needed
      if (this.config.compressionEnabled) {
        try {
          processedData = await decompressData(processedData);
        } catch {
          throw new Error('Decompression failed - data may be corrupted');
        }
      }

      // Parse and validate workspace state with date revival
      const workspaceState = JSON.parse(processedData, (key, value) => {
        // Check if the value is a string that looks like an ISO date
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)) {
          return new Date(value);
        }
        return value;
      }) as WorkspaceState;
      this.validateWorkspaceState(workspaceState);

      return workspaceState;
    } catch (error) {
      throw new Error(`State deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate delta between current and previous state
   * @param workspaceState
   * @param encryptionKey
   */
  async serializeIncrementalState(
    workspaceState: WorkspaceState,
    encryptionKey?: string
  ): Promise<{
    data: string;
    checksum: string;
    size: number;
    isFull: boolean;
    deltaSize?: number;
  }> {
    try {
      const currentState = JSON.stringify(workspaceState);

      // If no previous state, serialize full state
      if (!this.previousState) {
        const result = await this.serializeState(workspaceState, encryptionKey);
        this.previousState = currentState;
        this.previousChecksum = result.checksum;

        return {
          ...result,
          isFull: true
        };
      }

      // Check if previous state checksum matches
      if (this.previousChecksum && !(await verifyChecksum(this.previousState, this.previousChecksum))) {
        // Previous state is corrupted, serialize full state
        const result = await this.serializeState(workspaceState, encryptionKey);
        this.previousState = currentState;
        this.previousChecksum = result.checksum;

        return {
          ...result,
          isFull: true
        };
      }

      // Calculate delta
      const delta = this.calculateDelta(this.previousState, currentState);
      const deltaData = JSON.stringify(delta);

      // Serialize delta (much smaller than full state)
      const result = await this.serializeState({
        _delta: delta,
        _baseState: this.previousChecksum
      } as unknown as WorkspaceState, encryptionKey);

      // Update previous state
      this.previousState = currentState;
      this.previousChecksum = await generateChecksum(currentState);

      return {
        ...result,
        isFull: false,
        deltaSize: Buffer.byteLength(deltaData, 'utf8')
      };
    } catch (error) {
      throw new Error(`Incremental serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deserialize incremental state and apply to base state
   * @param data
   * @param checksum
   * @param baseState
   * @param encryptionKey
   */
  async deserializeIncrementalState(
    data: string,
    checksum: string,
    baseState: WorkspaceState,
    encryptionKey?: string
  ): Promise<WorkspaceState> {
    try {
      const deserializedData = await this.deserializeState(data, checksum, encryptionKey);

      // Check if this is a delta
      if ('_delta' in deserializedData && '_baseState' in deserializedData) {
        const deltaData = deserializedData as { _delta: StateDelta; _baseState: string };
        const baseStateSerialized = JSON.stringify(baseState);

        // Verify base state matches expected
        const baseChecksum = await generateChecksum(baseStateSerialized);
        if (baseChecksum !== deltaData._baseState) {
          throw new Error('Base state mismatch - cannot apply delta');
        }

        // Apply delta to base state
        const updatedState = this.applyDelta(baseStateSerialized, deltaData._delta);
        return JSON.parse(updatedState, (key, value) => {
        // Check if the value is a string that looks like an ISO date
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)) {
          return new Date(value);
        }
        return value;
      }) as WorkspaceState;
      }

      // This is a full state, return as-is
      return deserializedData;
    } catch (error) {
      throw new Error(`Incremental deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate workspace state structure
   * @param state
   */
  private validateWorkspaceState(state: WorkspaceState): void {
    if (!state || typeof state !== 'object') {
      throw new Error('Invalid workspace state: not an object');
    }

    const requiredFields = ['terminalState', 'browserTabs', 'aiConversations', 'openFiles'];
    for (const field of requiredFields) {
      if (!Array.isArray((state as any)[field])) {
        throw new TypeError(`Invalid workspace state: ${field} must be an array`);
      }
    }
  }

  /**
   * Calculate delta between two serialized states
   * @param oldState
   * @param newState
   */
  private calculateDelta(oldState: string, newState: string): StateDelta {
    // Simple string-based delta calculation
    // In a production environment, you might want a more sophisticated diff algorithm
    return {
      oldState: this.hashState(oldState),
      newState: this.hashState(newState),
      changes: this.detectChanges(oldState, newState)
    };
  }

  /**
   * Apply delta to base state
   * @param baseState
   * @param delta
   */
  private applyDelta(baseState: string, delta: StateDelta): string {
    // For now, return the new state as-is
    // In a production environment, you would apply the actual delta
    return baseState;
  }

  /**
   * Create a hash of state for comparison
   * @param state
   */
  private hashState(state: string): string {
    // Simple hash for demonstration - use crypto hash in production
    let hash = 0;
    for (let i = 0; i < state.length; i++) {
      const char = state.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Detect changes between states
   * @param oldState
   * @param newState
   */
  private detectChanges(oldState: string, newState: string): string[] {
    // Simple change detection - in production, use more sophisticated diff
    const changes: string[] = [];

    if (oldState !== newState) {
      changes.push('state_modified');
    }

    return changes;
  }

  /**
   * Reset internal state (useful for testing or error recovery)
   */
  reset(): void {
    this.previousState = null;
    this.previousChecksum = null;
  }

  /**
   * Get current configuration
   */
  getConfig(): typeof this.config {
    return { ...this.config };
  }
}

/**
 * State delta interface
 */
interface StateDelta {
  oldState: string;
  newState: string;
  changes: string[];
}

/**
 * Global serializer instance with default configuration
 */
export const defaultSerializer = new SessionStateSerializer();

/**
 * Create a new serializer instance with custom configuration
 * @param config
 */
export function createSerializer(config?: Partial<SessionConfig>): SessionStateSerializer {
  return new SessionStateSerializer(config);
}