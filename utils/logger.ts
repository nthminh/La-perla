/**
 * Centralized logging service
 * Allows control over logging in different environments
 */

// Check if we're in development mode
// @ts-ignore - Vite env variable
const isDevelopment = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

export const logger = {
  /**
   * Log informational messages
   * Only logs in development mode
   */
  info: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, data !== undefined ? data : '');
    }
  },

  /**
   * Log warning messages
   * Logs in both development and production
   */
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data !== undefined ? data : '');
  },

  /**
   * Log error messages
   * Always logs and could be extended to send to error tracking service
   */
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error !== undefined ? error : '');
    
    // In production, you could send to error tracking service like Sentry
    // if (!isDevelopment && typeof window !== 'undefined') {
    //   window.errorTracker?.captureException(error);
    // }
  },

  /**
   * Log debug messages
   * Only logs in development mode
   */
  debug: (message: string, data?: any) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data !== undefined ? data : '');
    }
  },
};
