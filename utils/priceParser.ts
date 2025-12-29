/**
 * Price parsing and validation utilities
 */

/**
 * Parse a price string to a number with validation
 * @param priceStr - The price string to parse (e.g., "$50", "50.00", "1,234.56")
 * @returns A valid price number with 2 decimal places, or 0 if invalid
 */
export const parsePrice = (priceStr: string): number => {
  // Remove all non-numeric characters except decimal point
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  
  // Parse to float
  const price = parseFloat(cleaned);
  
  // Validate: must be a number, non-negative, and within reasonable bounds
  if (isNaN(price) || price < 0 || price > 999999) {
    return 0;
  }
  
  // Round to 2 decimal places
  return Math.round(price * 100) / 100;
};

/**
 * Format a number as a price string
 * @param price - The price number
 * @returns Formatted price string (e.g., "50.00")
 */
export const formatPrice = (price: number): string => {
  return price.toFixed(2);
};

/**
 * Format a number as a currency string with symbol
 * @param price - The price number
 * @param symbol - Currency symbol (default: "$")
 * @returns Formatted currency string (e.g., "$50.00")
 */
export const formatCurrency = (price: number, symbol: string = '$'): string => {
  return `${symbol}${formatPrice(price)}`;
};
