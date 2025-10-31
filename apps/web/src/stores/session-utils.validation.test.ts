/**
 * Unit tests for session-utils validation functions
 * Tests for validateCheckpointName, validateCheckpointPriority, validateCheckpointTags
 */

import { describe, expect, test } from 'bun:test';

import type { CheckpointPriority } from './session-types';
import {
  validateCheckpointName,
  validateCheckpointPriority,
  validateCheckpointTags
} from './session-utils';

describe('validateCheckpointName', () => {
  test('should accept valid names', () => {
    expect(validateCheckpointName('Valid Name')).toBe(true);
    expect(validateCheckpointName('name-with-dashes')).toBe(true);
    expect(validateCheckpointName('name_with_underscores')).toBe(true);
    expect(validateCheckpointName('Name with numbers 123')).toBe(true);
    expect(validateCheckpointName('A'.repeat(100))).toBe(true);
  });

  test('should reject empty names', () => {
    expect(() => validateCheckpointName('')).toThrow('Checkpoint name cannot be empty');
    expect(() => validateCheckpointName('   ')).toThrow('Checkpoint name cannot be empty');
    expect(() => validateCheckpointName('\t\n')).toThrow('Checkpoint name cannot be empty');
  });

  test('should reject names that are too long', () => {
    const longName = 'A'.repeat(101);
    expect(() => validateCheckpointName(longName)).toThrow(
      'Checkpoint name cannot exceed 100 characters'
    );
  });

  test('should reject null or undefined names', () => {
    expect(() => validateCheckpointName(null as unknown as string)).toThrow();
    expect(() => validateCheckpointName(undefined as unknown as string)).toThrow();
  });
});

describe('validateCheckpointPriority', () => {
  test('should accept valid priorities', () => {
    expect(validateCheckpointPriority('low')).toBe(true);
    expect(validateCheckpointPriority('medium')).toBe(true);
    expect(validateCheckpointPriority('high')).toBe(true);
  });

  test('should reject invalid priorities', () => {
    expect(() => validateCheckpointPriority('invalid')).toThrow(
      'Invalid priority: invalid. Must be one of: low, medium, high'
    );
    expect(() => validateCheckpointPriority('LOW')).toThrow(
      'Invalid priority: LOW. Must be one of: low, medium, high'
    );
    expect(() => validateCheckpointPriority('')).toThrow(
      'Invalid priority: . Must be one of: low, medium, high'
    );
    expect(() => validateCheckpointPriority('critical')).toThrow(
      'Invalid priority: critical. Must be one of: low, medium, high'
    );
  });

  test('should act as type guard', () => {
    const validPriority = 'medium';
    if (validateCheckpointPriority(validPriority)) {
      // TypeScript should know this is CheckpointPriority
      const typed: CheckpointPriority = validPriority;
      expect(typed).toBe('medium');
    }
  });
});

describe('validateCheckpointTags - Basic Validation', () => {
  test('should accept valid tag arrays', () => {
    expect(validateCheckpointTags([])).toBe(true);
    expect(validateCheckpointTags(['tag1'])).toBe(true);
    expect(validateCheckpointTags(['tag1', 'tag2', 'tag3'])).toBe(true);
    expect(validateCheckpointTags(['valid-tag', 'valid_tag', 'Valid Tag'])).toBe(true);
  });

  test('should accept maximum allowed tags', () => {
    const maxTags = Array(10).fill('tag');
    expect(validateCheckpointTags(maxTags)).toBe(true);
  });

  test('should accept maximum length tags', () => {
    const maxLengthTag = 'A'.repeat(50);
    expect(validateCheckpointTags([maxLengthTag])).toBe(true);
  });
});

describe('validateCheckpointTags - Error Cases', () => {
  test('should reject non-array inputs', () => {
    expect(() => validateCheckpointTags(null as unknown as string[])).toThrow(
      'Tags must be an array'
    );
    expect(() => validateCheckpointTags('string' as unknown as string[])).toThrow(
      'Tags must be an array'
    );
    expect(() => validateCheckpointTags({} as unknown as string[])).toThrow(
      'Tags must be an array'
    );
  });

  test('should reject too many tags', () => {
    const tooManyTags = Array(11).fill('tag');
    expect(() => validateCheckpointTags(tooManyTags)).toThrow(
      'Cannot have more than 10 tags per checkpoint'
    );
  });
});

describe('validateCheckpointTags - Content Validation', () => {
  test('should reject non-string tags', () => {
    expect(() => validateCheckpointTags([1 as unknown as string])).toThrow(
      'All tags must be strings'
    );
    expect(() => validateCheckpointTags([null as unknown as string])).toThrow(
      'All tags must be strings'
    );
    expect(() => validateCheckpointTags([{} as unknown as string])).toThrow(
      'All tags must be strings'
    );
  });

  test('should reject tags that are too long', () => {
    const longTag = 'A'.repeat(51);
    expect(() => validateCheckpointTags([longTag])).toThrow('Tag cannot exceed 50 characters');
  });

  test('should reject tags with commas', () => {
    expect(() => validateCheckpointTags(['tag,with,commas'])).toThrow('Tags cannot contain commas');
    expect(() => validateCheckpointTags(['tag,'])).toThrow('Tags cannot contain commas');
    expect(() => validateCheckpointTags([',tag'])).toThrow('Tags cannot contain commas');
  });
});
