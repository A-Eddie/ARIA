import { formatDistanceToNow } from 'date-fns';

/**
 * Format a date as relative time (e.g., "2 hours ago")
 * @param {Date|number} date - The date to format
 * @returns {string} Relative time string
 */
export const ago = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date.seconds ? date.seconds * 1000 : date);
  return formatDistanceToNow(d, { addSuffix: true });
};

/**
 * Format a date as a readable string (e.g., "Jan 5, 2024")
 * @param {Date|number} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date.seconds ? date.seconds * 1000 : date);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Format a date as a readable time (e.g., "2:30 PM")
 * @param {Date|number} date - The date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date.seconds ? date.seconds * 1000 : date);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format datetime as "Jan 5, 2024 at 2:30 PM"
 * @param {Date|number} date - The date to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  return `${formatDate(date)} at ${formatTime(date)}`;
};

/**
 * Copy text to clipboard and return success/error
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

/**
 * Debounce a function
 * @param {Function} func - Function to debounce
 * @param {number} ms - Debounce delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, ms = 300) => {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), ms);
  };
};

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Convert status text to human-readable format (e.g., "phone-screen" → "Phone Screen")
 * @param {string} status - Status string
 * @returns {string} Human-readable status
 */
export const formatStatus = (status) => {
  if (!status) return '';
  return status
    .split('-')
    .map(word => capitalize(word))
    .join(' ');
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} length - Max length
 * @returns {string} Truncated text
 */
export const truncate = (text, length = 50) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Get initials from a full name
 * @param {string} name - Full name
 * @returns {string} Initials (e.g., "John Doe" → "JD")
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Generate a random color based on a string (for avatars)
 * @param {string} str - String to hash
 * @returns {string} Hex color code
 */
export const hashToColor = (str) => {
  if (!str) return '#3b82f6';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

/**
 * Format score with color interpretation
 * @param {number} score - Score (1-5)
 * @returns {object} { score, label, interpretation }
 */
export const formatScore = (score) => {
  const scoreMap = {
    5: { label: '5/5', interpretation: 'Excellent' },
    4: { label: '4/5', interpretation: 'Good' },
    3: { label: '3/5', interpretation: 'Fair' },
    2: { label: '2/5', interpretation: 'Poor' },
    1: { label: '1/5', interpretation: 'Very Poor' },
  };
  return scoreMap[score] || { label: '0/5', interpretation: 'Not rated' };
};
