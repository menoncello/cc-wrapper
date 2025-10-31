import React from 'react';

/**
 * Tag input component
 * @param {object} props - Component props
 * @param {string} props.tagInput - Tag input value
 * @param {(value: string) => void} props.onTagInputChange - Tag input change handler
 * @param {(e: React.KeyboardEvent) => void} props.onKeyPress - Key press handler
 * @returns {React.ReactElement} Tag input JSX element
 */
function TagInput({
  tagInput,
  onTagInputChange,
  onKeyPress
}: {
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}): React.ReactElement {
  return (
    <input
      type="text"
      id="checkpoint-tags"
      value={tagInput}
      onChange={e => onTagInputChange(e.target.value)}
      onKeyDown={onKeyPress}
      placeholder="Add a tag and press Enter"
      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    />
  );
}

/**
 * Add tag button component
 * @param {object} props - Component props
 * @param {() => void} props.onAddTag - Add tag handler
 * @returns {React.ReactElement} Add tag button JSX element
 */
function AddTagButton({ onAddTag }: { onAddTag: () => void }): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onAddTag}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      Add
    </button>
  );
}

/**
 * Individual tag component
 * @param {object} props - Component props
 * @param {string} props.tag - Tag value
 * @param {() => void} props.onRemove - Remove tag handler
 * @returns {React.ReactElement} Tag JSX element
 */
function TagItem({ tag, onRemove }: { tag: string; onRemove: () => void }): React.ReactElement {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 text-blue-700">
      {tag}
      <button type="button" onClick={onRemove} className="ml-1 text-blue-500 hover:text-blue-700">
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </span>
  );
}

/**
 * Tags display component
 * @param {object} props - Component props
 * @param {string[]} props.tags - Current tags
 * @param {(tag: string) => void} props.onRemoveTag - Remove tag handler
 * @returns {React.ReactElement} Tags display JSX element
 */
function TagsDisplay({
  tags,
  onRemoveTag
}: {
  tags: string[];
  onRemoveTag: (tag: string) => void;
}): React.ReactElement | null {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <TagItem key={index} tag={tag} onRemove={() => onRemoveTag(tag)} />
      ))}
    </div>
  );
}

/**
 * Tags label component
 * @returns {React.ReactElement} Tags label JSX element
 */
function TagsLabel(): React.ReactElement {
  return (
    <label htmlFor="checkpoint-tags" className="block text-sm font-medium text-gray-700 mb-1">
      Tags
    </label>
  );
}

/**
 * Tags input field component
 * @param {object} props - Component props
 * @param {string} props.tagInput - Tag input value
 * @param {(value: string) => void} props.onTagInputChange - Tag input change handler
 * @param {() => void} props.onAddTag - Add tag handler
 * @param {(e: React.KeyboardEvent) => void} props.onKeyPress - Key press handler
 * @param {string[]} props.tags - Current tags
 * @param {(tag: string) => void} props.onRemoveTag - Remove tag handler
 * @returns {React.ReactElement} Tags input field JSX element
 */
function TagsField({
  tagInput,
  onTagInputChange,
  onAddTag,
  onKeyPress,
  tags,
  onRemoveTag
}: {
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  tags: string[];
  onRemoveTag: (tag: string) => void;
}): React.ReactElement {
  return (
    <div>
      <TagsLabel />
      <div className="flex space-x-2">
        <TagInput tagInput={tagInput} onTagInputChange={onTagInputChange} onKeyPress={onKeyPress} />
        <AddTagButton onAddTag={onAddTag} />
      </div>

      <TagsDisplay tags={tags} onRemoveTag={onRemoveTag} />
    </div>
  );
}

export { AddTagButton, TagInput, TagItem, TagsDisplay, TagsField, TagsLabel };
