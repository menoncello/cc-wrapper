// Constants for file size calculations
export const BYTES_PER_KB = 1024;
export const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;

// Constants for styling
export const STROKE_WIDTH_DEFAULT = 2;
export const STROKE_WIDTH_THIN = 1;

// Priority color mapping
export const PRIORITY_COLORS = {
  high: 'text-red-600 bg-red-100',
  medium: 'text-yellow-600 bg-yellow-100',
  low: 'text-green-600 bg-green-100',
  default: 'text-gray-600 bg-gray-100'
} as const;

/**
 * Formats file size in bytes to human-readable string
 * @param {number} bytes - The file size in bytes to format
 * @returns {string} The formatted file size string with appropriate unit (B, KB, or MB)
 */
export const formatSize = (bytes: number): string => {
  if (bytes < BYTES_PER_KB) {
    return `${bytes} B`;
  }
  if (bytes < BYTES_PER_MB) {
    return `${(bytes / BYTES_PER_KB).toFixed(1)} KB`;
  }
  return `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;
};

/**
 * Formats date string to localized string
 * @param {string} dateString - The ISO date string to format
 * @returns {string} The formatted date string in the user's locale
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

/**
 * Gets priority color class based on priority level
 * @param {string} priority - The priority level ('high', 'medium', 'low', or other)
 * @returns {string} The CSS class string for the priority color styling
 */
export const getPriorityColor = (priority: string): string => {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.default;
};
