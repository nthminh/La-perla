/**
 * Custom hooks for common operations
 * Helps reduce code duplication and improve maintainability
 */

import { useState, useCallback } from 'react';
import { logger } from './logger';

/**
 * Hook for managing loading states during async operations
 * @param initialState - Initial loading state (default: false)
 * @returns Object with loading state and wrapper function
 */
export const useAsyncLoading = (initialState: boolean = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Wraps an async function with loading state management
   * @param asyncFn - The async function to execute
   * @returns The result of the async function
   */
  const withLoading = useCallback(async <T,>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await asyncFn();
      setIsLoading(false);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsLoading(false);
      logger.error('Async operation failed', error);
      return null;
    }
  }, []);

  return { isLoading, error, withLoading, setIsLoading };
};

/**
 * Hook for debouncing a value
 * Useful for search inputs and other frequently changing values
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300)
 * @returns The debounced value
 */
export const useDebounce = <T,>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  });

  return debouncedValue;
};
