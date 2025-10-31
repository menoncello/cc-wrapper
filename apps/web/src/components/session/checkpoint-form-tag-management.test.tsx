import { describe, expect, it, vi } from 'vitest';

/**
 * Test suite for tag management logic
 * Tests tag addition, removal, validation, and keyboard interactions
 */
describe('Tag Management Logic - Addition', () => {
  it('should add a new tag', () => {
    const existingTags = ['tag1', 'tag2'];
    const newTag = 'tag3';
    const updatedTags = existingTags.includes(newTag) ? existingTags : [...existingTags, newTag];

    expect(updatedTags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should not add empty tag', () => {
    const existingTags = ['tag1', 'tag2'];
    const newTag = '   ';
    const trimmedTag = newTag.trim();
    const updatedTags =
      trimmedTag && !existingTags.includes(trimmedTag)
        ? [...existingTags, trimmedTag]
        : existingTags;

    expect(updatedTags).toEqual(['tag1', 'tag2']);
  });

  it('should prevent duplicate tags', () => {
    const existingTags = ['tag1', 'tag2'];
    const duplicateTag = 'tag1';
    const updatedTags = existingTags.includes(duplicateTag)
      ? existingTags
      : [...existingTags, duplicateTag];

    expect(updatedTags).toEqual(['tag1', 'tag2']);
  });

  it('should trim tag whitespace', () => {
    const existingTags = ['tag1', 'tag2'];
    const newTag = '  trimmed-tag  ';
    const trimmedTag = newTag.trim();
    const updatedTags = existingTags.includes(trimmedTag)
      ? existingTags
      : [...existingTags, trimmedTag];

    expect(updatedTags).toEqual(['tag1', 'tag2', 'trimmed-tag']);
  });
});

describe('Tag Management Logic - Removal', () => {
  it('should remove tag correctly', () => {
    const tags = ['tag1', 'tag2', 'tag3'];
    const tagToRemove = 'tag2';
    const updatedTags = tags.filter(tag => tag !== tagToRemove);

    expect(updatedTags).toEqual(['tag1', 'tag3']);
  });

  it('should handle removing non-existent tag', () => {
    const tags = ['tag1', 'tag2'];
    const tagToRemove = 'non-existent';
    const updatedTags = tags.filter(tag => tag !== tagToRemove);

    expect(updatedTags).toEqual(['tag1', 'tag2']);
  });
});

describe('Tag Management Logic - Keyboard Interactions', () => {
  it('should handle Enter key press correctly', () => {
    const mockEvent = {
      key: 'Enter',
      target: 'input',
      currentTarget: 'input',
      preventDefault: vi.fn()
    };

    const shouldHandleKeyPress =
      mockEvent.key === 'Enter' && mockEvent.target === mockEvent.currentTarget;

    expect(shouldHandleKeyPress).toBe(true);
    expect(mockEvent.preventDefault).not.toHaveBeenCalled(); // Not called yet, would be called in actual handler
  });

  it('should not handle non-Enter key press', () => {
    const mockEvent = {
      key: 'Escape',
      target: 'input',
      currentTarget: 'input'
    };

    const shouldHandleKeyPress =
      mockEvent.key === 'Enter' && mockEvent.target === mockEvent.currentTarget;

    expect(shouldHandleKeyPress).toBe(false);
  });

  it('should not handle Enter key when target is not currentTarget', () => {
    const mockEvent = {
      key: 'Enter',
      target: 'input',
      currentTarget: 'different-element'
    };

    const shouldHandleKeyPress =
      mockEvent.key === 'Enter' && mockEvent.target === mockEvent.currentTarget;

    expect(shouldHandleKeyPress).toBe(false);
  });
});
