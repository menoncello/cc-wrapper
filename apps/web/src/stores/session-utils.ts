/**
 * Utility functions for session management
 * These functions handle common operations and business logic
 */

import type { CheckpointFilter, CheckpointPriority } from './session-types';

// Constants for magic numbers
export const MAX_CHECKPOINT_NAME_LENGTH = 100;
export const MAX_TAGS_PER_CHECKPOINT = 10;
export const MAX_TAG_LENGTH = 50;
export const BYTES_PER_KB = 1024;
export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTES_PER_HOUR = 60;
export const HOURS_PER_DAY = 24;
export const DAYS_PER_MONTH = 30;

/**
 * Validates that a checkpoint name is valid
 * @param {string} name - The checkpoint name to validate
 * @returns {boolean} true if valid, throws error if invalid
 */
export const validateCheckpointName = (name: string): boolean => {
  if (!name || name.trim().length === 0) {
    throw new Error('Checkpoint name cannot be empty');
  }

  if (name.length > MAX_CHECKPOINT_NAME_LENGTH) {
    throw new Error(`Checkpoint name cannot exceed ${MAX_CHECKPOINT_NAME_LENGTH} characters`);
  }

  return true;
};

/**
 * Validates checkpoint priority
 * @param {string} priority - The priority to validate
 * @returns {boolean} true if valid, throws error if invalid
 */
export const validateCheckpointPriority = (priority: string): priority is CheckpointPriority => {
  const validPriorities: CheckpointPriority[] = ['low', 'medium', 'high'];

  if (!validPriorities.includes(priority as CheckpointPriority)) {
    throw new Error(`Invalid priority: ${priority}. Must be one of: ${validPriorities.join(', ')}`);
  }

  return true;
};

/**
 * Validates checkpoint tags
 * @param {string[]} tags - Array of tags to validate
 * @returns {boolean} true if valid, throws error if invalid
 */
export const validateCheckpointTags = (tags: string[]): boolean => {
  if (!Array.isArray(tags)) {
    throw new TypeError('Tags must be an array');
  }

  if (tags.length > MAX_TAGS_PER_CHECKPOINT) {
    throw new Error(`Cannot have more than ${MAX_TAGS_PER_CHECKPOINT} tags per checkpoint`);
  }

  for (const tag of tags) {
    if (typeof tag !== 'string') {
      throw new TypeError('All tags must be strings');
    }

    if (tag.length > MAX_TAG_LENGTH) {
      throw new Error(`Tag cannot exceed ${MAX_TAG_LENGTH} characters`);
    }

    if (tag.includes(',')) {
      throw new Error('Tags cannot contain commas');
    }
  }

  return true;
};

/**
 * Creates a default checkpoint filter
 * @param {Partial<CheckpointFilter>} overrides - Optional filter properties to override defaults
 * @returns {CheckpointFilter} A complete checkpoint filter object
 */
export const createDefaultCheckpointFilter = (
  overrides: Partial<CheckpointFilter> = {}
): CheckpointFilter => ({
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  ...overrides
});

/**
 * Normalizes filter values for API requests
 * @param {CheckpointFilter} filter - The filter to normalize
 * @returns {URLSearchParams} A URLSearchParams object with normalized values
 */
export const normalizeFilterForApi = (filter: CheckpointFilter): URLSearchParams => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined || value === null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
      continue;
    }

    if (value instanceof Date) {
      params.append(key, value.toISOString());
      continue;
    }

    params.append(key, String(value));
  }

  return params;
};

/**
 * Checks if a checkpoint is expired
 * @param {{createdAt: string}} checkpoint - The checkpoint to check
 * @param {string} checkpoint.createdAt - The creation timestamp of the checkpoint
 * @param {number} [maxAge] - Maximum age in milliseconds (default: 30 days)
 * @returns {boolean} true if checkpoint is expired
 */
export const isCheckpointExpired = (
  checkpoint: { createdAt: string },
  maxAge: number = DAYS_PER_MONTH *
    HOURS_PER_DAY *
    MINUTES_PER_HOUR *
    SECONDS_PER_MINUTE *
    MILLISECONDS_PER_SECOND
): boolean => {
  const createdAt = new Date(checkpoint.createdAt);
  const now = new Date();
  const age = now.getTime() - createdAt.getTime();

  return age > maxAge;
};

/**
 * Formats checkpoint size for display
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export const formatCheckpointSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= BYTES_PER_KB && unitIndex < units.length - 1) {
    size /= BYTES_PER_KB;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

/**
 * Creates a checkpoint summary from checkpoint data
 * @param {{name: string, description?: string, tags: string[], createdAt: string, compressedSize: number, priority: CheckpointPriority}} checkpoint - The checkpoint to summarize
 * @param {string} checkpoint.name - The checkpoint name
 * @param {string} [checkpoint.description] - The checkpoint description
 * @param {string[]} checkpoint.tags - The checkpoint tags
 * @param {string} checkpoint.createdAt - The checkpoint creation timestamp
 * @param {number} checkpoint.compressedSize - The checkpoint compressed size in bytes
 * @param {CheckpointPriority} checkpoint.priority - The checkpoint priority level
 * @returns {string} A human-readable summary
 */
export const createCheckpointSummary = (checkpoint: {
  name: string;
  description?: string;
  tags: string[];
  createdAt: string;
  compressedSize: number;
  priority: CheckpointPriority;
}): string => {
  const parts: string[] = [];

  parts.push(checkpoint.name);

  if (checkpoint.description) {
    parts.push(`(${checkpoint.description})`);
  }

  if (checkpoint.tags.length > 0) {
    parts.push(`[${checkpoint.tags.join(', ')}]`);
  }

  parts.push(`- ${formatCheckpointSize(checkpoint.compressedSize)}`);
  parts.push(`(${checkpoint.priority} priority)`);

  const date = new Date(checkpoint.createdAt).toLocaleDateString();
  parts.push(`Created: ${date}`);

  return parts.join(' ');
};

// Priority order mapping for sorting
const PRIORITY_ORDER = { low: 0, medium: 1, high: 2 } as const;

/**
 * Gets the sort value for a checkpoint based on the sort field
 * @param {{createdAt: string, name: string, compressedSize: number, priority: CheckpointPriority}} checkpoint - The checkpoint to get value from
 * @param {string} checkpoint.createdAt - The checkpoint creation timestamp
 * @param {string} checkpoint.name - The checkpoint name
 * @param {number} checkpoint.compressedSize - The checkpoint compressed size
 * @param {CheckpointPriority} checkpoint.priority - The checkpoint priority level
 * @param {string} sortBy - The field to sort by
 * @returns {unknown} The value to sort by
 */
const getSortValue = (
  checkpoint: {
    createdAt: string;
    name: string;
    compressedSize: number;
    priority: CheckpointPriority;
  },
  sortBy: string
): unknown => {
  switch (sortBy) {
    case 'name':
      return checkpoint.name.toLowerCase();
    case 'size':
      return checkpoint.compressedSize;
    case 'priority':
      return PRIORITY_ORDER[checkpoint.priority];
    case 'createdAt':
    default:
      return new Date(checkpoint.createdAt);
  }
};

/**
 * Performs basic three-way comparison
 * @param {number} a - First value
 * @param {number} b - Second value
 * @returns {number} Comparison result (-1, 0, or 1)
 */
const basicCompare = (a: number, b: number): number => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

/**
 * Compares two string values
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Comparison result (-1, 0, or 1)
 */
const compareStrings = (a: string, b: string): number => {
  return basicCompare(a.localeCompare(b), 0);
};

/**
 * Compares two number values
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} Comparison result (-1, 0, or 1)
 */
const compareNumbers = (a: number, b: number): number => {
  return basicCompare(a, b);
};

/**
 * Compares two Date values
 * @param {Date} a - First date
 * @param {Date} b - Second date
 * @returns {number} Comparison result (-1, 0, or 1)
 */
const compareDates = (a: Date, b: Date): number => {
  return basicCompare(a.getTime(), b.getTime());
};

/**
 * Compares two values using standard comparison logic
 * @param {unknown} aValue - First value to compare
 * @param {unknown} bValue - Second value to compare
 * @returns {number} Comparison result (-1, 0, or 1)
 */
const standardCompare = (aValue: unknown, bValue: unknown): number => {
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return compareStrings(aValue, bValue);
  }

  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return compareNumbers(aValue, bValue);
  }

  if (aValue instanceof Date && bValue instanceof Date) {
    return compareDates(aValue, bValue);
  }

  return compareStrings(String(aValue), String(bValue));
};

/**
 * Compares two values of the same type safely for sorting
 * @param {unknown} aValue - First value to compare
 * @param {unknown} bValue - Second value to compare
 * @returns {number} Comparison result (-1, 0, or 1)
 */
const compareSameType = (aValue: unknown, bValue: unknown): number => {
  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return standardCompare(aValue, bValue);
  }

  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return standardCompare(aValue, bValue);
  }

  if (aValue instanceof Date && bValue instanceof Date) {
    return standardCompare(aValue.getTime(), bValue.getTime());
  }

  return 0;
};

/**
 * Compares two values safely for sorting
 * @param {unknown} aValue - First value to compare
 * @param {unknown} bValue - Second value to compare
 * @returns {number} Comparison result (-1, 0, or 1)
 */
const safeCompare = (aValue: unknown, bValue: unknown): number => {
  if (typeof aValue === typeof bValue) {
    return compareSameType(aValue, bValue);
  }

  // For different types, convert to string for comparison
  const aStr = String(aValue);
  const bStr = String(bValue);
  return standardCompare(aStr, bStr);
};

type SortableCheckpoint = {
  createdAt: string;
  name: string;
  compressedSize: number;
  priority: CheckpointPriority;
};

export type SortByField = 'createdAt' | 'name' | 'compressedSize' | 'size' | 'priority';
type SortOrder = 'asc' | 'desc';

/**
 * Sorts checkpoints by the specified criteria
 */
export const sortCheckpoints = (
  checkpoints: SortableCheckpoint[],
  sortBy: SortByField = 'createdAt',
  sortOrder: SortOrder = 'asc'
): SortableCheckpoint[] => {
  const sorted = [...checkpoints].sort((a, b) => {
    const aValue = getSortValue(a, sortBy);
    const bValue = getSortValue(b, sortBy);
    return safeCompare(aValue, bValue);
  });

  return sortOrder === 'desc' ? sorted.reverse() : sorted;
};

/**
 * Checks if a checkpoint matches the search query
 * @param {{name: string, description?: string}} checkpoint - The checkpoint to check
 * @param {string} checkpoint.name - The checkpoint name
 * @param {string} [checkpoint.description] - The checkpoint description
 * @param {string} query - The search query (already lowercased)
 * @returns {boolean} true if checkpoint matches the search query
 */
const matchesSearchQuery = (
  checkpoint: { name: string; description?: string },
  query: string
): boolean => {
  const nameMatch = checkpoint.name.toLowerCase().includes(query);
  const descriptionMatch = checkpoint.description?.toLowerCase().includes(query) || false;
  return nameMatch || descriptionMatch;
};

/**
 * Checks if a checkpoint has all required tags
 * @param {{tags: string[]}} checkpoint - The checkpoint to check
 * @param {string[]} checkpoint.tags - The checkpoint tags array
 * @param {string[]} requiredTags - The tags that must be present
 * @returns {boolean} true if checkpoint has all required tags
 */
const hasAllRequiredTags = (checkpoint: { tags: string[] }, requiredTags: string[]): boolean => {
  return requiredTags.every(tag => checkpoint.tags.includes(tag));
};

/**
 * Filters checkpoints by search criteria
 * @param {Array<object>} checkpoints - Array of checkpoints to filter
 * @param {string} [searchQuery] - Search query string
 * @param {string[]} [tags] - Tags to filter by
 * @returns {Array<object>} Filtered array of checkpoints
 */
export const filterCheckpoints = (
  checkpoints: Array<{
    name: string;
    description?: string;
    tags: string[];
  }>,
  searchQuery?: string,
  tags?: string[]
): Array<(typeof checkpoints)[0]> => {
  if (!searchQuery && (!tags || tags.length === 0)) {
    return checkpoints;
  }

  return checkpoints.filter(checkpoint => {
    if (searchQuery && !matchesSearchQuery(checkpoint, searchQuery.toLowerCase())) {
      return false;
    }

    if (tags && tags.length > 0 && !hasAllRequiredTags(checkpoint, tags)) {
      return false;
    }

    return true;
  });
};
