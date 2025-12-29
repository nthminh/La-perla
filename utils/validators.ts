/**
 * Input validation utilities
 */

/**
 * Validate a phone number
 * @param phone - The phone number string to validate
 * @returns true if valid, false otherwise
 */
export const isValidPhone = (phone: string): boolean => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Phone number should be between 8 and 15 digits
  return cleaned.length >= 8 && cleaned.length <= 15;
};

/**
 * Clean and format a phone number
 * @param phone - The phone number string to clean
 * @returns Cleaned phone number with only digits
 */
export const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Validate a customer name
 * @param name - The name string to validate
 * @returns true if valid, false otherwise
 */
export const isValidName = (name: string): boolean => {
  const trimmed = name.trim();
  // Name should be at least 2 characters and not just numbers
  return trimmed.length >= 2 && !/^\d+$/.test(trimmed);
};

/**
 * Sanitize a string for display (prevent XSS)
 * @param input - The string to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate an email address
 * @param email - The email string to validate
 * @returns true if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
