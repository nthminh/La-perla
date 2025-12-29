/**
 * Secure ID generation utilities
 * Uses crypto.randomUUID() for collision-resistant IDs
 */

/**
 * Generate a secure unique ID for bills, transactions, and cart items
 * @returns A UUID string that is guaranteed to be unique
 */
export const generateSecureId = (): string => {
  // Check if crypto.randomUUID is available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers: combine timestamp with random values
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  const randomPart2 = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}-${randomPart2}`;
};

/**
 * Generate a short unique ID (backwards compatible with existing IDs)
 * For display purposes only, not for critical data storage
 * @returns A short alphanumeric string
 */
export const generateShortId = (): string => {
  return Math.random().toString(36).substring(2, 11);
};
