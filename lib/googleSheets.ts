import { Transaction, TransactionItem } from '../types';
import { GOOGLE_SHEETS_WEBAPP_URL, PRICING_DATA } from '../constants';

/**
 * Sends transaction data to a Google Sheet via a Google Apps Script Web App.
 * @param transaction The transaction object to save.
 * @returns Promise that resolves when the request is sent.
 */
export const saveToGoogleSheets = async (transaction: Transaction): Promise<boolean> => {
  if (!GOOGLE_SHEETS_WEBAPP_URL) {
    console.warn("Google Sheets Web App URL is not configured.");
    return false;
  }

  // Flatten items for the spreadsheet
  // Format: "Manicure [Vivian] (x1), Pedicure [Amy] (x1)"
  let itemsString = transaction.items
    .map(item => {
        const staffPart = item.staffName ? ` [${item.staffName}]` : '';
        return `${item.nameKey}${staffPart} (x${item.quantity})`;
    })
    .join(', ');

  if (transaction.discountPercentage && transaction.discountPercentage > 0) {
      itemsString += ` (Discount: ${transaction.discountPercentage}%)`;
  }

  const data = {
    id: transaction.id,
    date: new Date(transaction.date).toLocaleDateString(),
    time: new Date(transaction.date).toLocaleTimeString(),
    total: transaction.total,
    items: itemsString,
  };

  try {
    // We use mode: 'no-cors' because Google Apps Script Web Apps do not support CORS preflight requests 
    // in a way that is easily consumable by fetch in all environments without complex server-side headers.
    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return true;
  } catch (error) {
    console.error("Error saving to Google Sheets:", error);
    return false;
  }
};

/**
 * Fetches transactions directly from Google Sheets.
 * Requires the Google Apps Script to handle doGet() and return JSON.
 */
export const fetchGoogleSheetsData = async (): Promise<Transaction[]> => {
    if (!GOOGLE_SHEETS_WEBAPP_URL) return [];

    try {
        const response = await fetch(GOOGLE_SHEETS_WEBAPP_URL);
        const rawData = await response.json();

        // Pre-calculate a price lookup map from PRICING_DATA to fix the $0 issue
        const priceMap: Record<string, number> = {};
        PRICING_DATA.forEach(category => {
            category.services.forEach(service => {
                // Parse price string (e.g., "$28", "from $55") to number
                const match = service.price.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
                priceMap[service.nameKey] = match ? parseFloat(match[0]) : 0;
            });
        });

        // rawData is an array of arrays: [[id, date, time, total, items], ...]
        // We assume row 0 might be headers if user followed instructions, or data.
        // Let's filter out rows that don't look like data (e.g. headers string 'ID')
        
        const transactions: Transaction[] = rawData
            .filter((row: any[]) => row[0] !== 'ID' && row.length >= 5)
            .map((row: any[]) => {
                // Parse items string back to object: "manicure [Vivian] (x1), pedicure (x2)"
                const itemsStr = String(row[4] || '');
                const items: TransactionItem[] = [];
                
                // Regex to find "serviceName [Staff?] (xQty)"
                // Matches "service" optionally followed by " [Staff]" then " (x1)"
                const itemRegex = /([a-zA-Z0-9]+)(?:\s*\[(.*?)\])?\s*\(x(\d+)\)/g;
                let match;
                while ((match = itemRegex.exec(itemsStr)) !== null) {
                    const nameKey = match[1];
                    items.push({
                        nameKey: nameKey,
                        staffName: match[2] || undefined, // Capture staff name if present
                        // FIX: Look up price from the map instead of defaulting to 0
                        price: priceMap[nameKey] || 0, 
                        quantity: parseInt(match[3], 10)
                    });
                }

                // Extract discount if present in items string for display consistency
                let discountPercentage = 0;
                const discountMatch = itemsStr.match(/Discount: (\d+)%/);
                if (discountMatch) {
                    discountPercentage = parseInt(discountMatch[1], 10);
                }

                // Parse Date Robustly
                // Handle formats: MM/DD/YYYY (Sheet default in some locales) OR DD/MM/YYYY (Australian/Vietnam style)
                const dateStr = String(row[1]); 
                let dateObj = new Date(dateStr);

                // If date is invalid or likely parsed incorrectly (e.g. browser thinks 25/11 is MM/DD and fails), parse manually
                if (isNaN(dateObj.getTime()) || dateStr.includes('/')) {
                    const parts = dateStr.split(/[/-]/);
                    if (parts.length === 3) {
                        // Assume DD/MM/YYYY if first part > 12, otherwise ambiguous but prioritize standard ISO or local.
                        // Simple robust strategy: try parsing as DD/MM/YYYY if basic parsing fails
                        const d = parseInt(parts[0], 10);
                        const m = parseInt(parts[1], 10);
                        const y = parseInt(parts[2], 10);
                        
                        // Reconstruct as YYYY-MM-DD for safe parsing
                        if (d > 12) {
                             // Definitely DD/MM/YYYY
                             dateObj = new Date(`${y}-${m}-${d}`);
                        } else {
                             // Could be either, but if new Date(dateStr) failed earlier, try swapping
                             if (isNaN(dateObj.getTime())) {
                                 dateObj = new Date(`${y}-${m}-${d}`);
                             }
                        }
                    }
                }

                // Final fallback
                if (isNaN(dateObj.getTime())) {
                    dateObj = new Date();
                }
                
                return {
                    id: String(row[0]),
                    date: dateObj.toISOString(),
                    total: Number(row[3]) || 0,
                    items: items,
                    discountPercentage: discountPercentage
                };
            });

        return transactions;
    } catch (error) {
        console.error("Failed to fetch from Google Sheets:", error);
        return [];
    }
};