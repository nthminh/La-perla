
import { Transaction, TransactionItem, ActiveBill, WaitlistEntry } from '../types';
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
    customerName: transaction.customerName || '',
    customerPhone: transaction.customerPhone || '',
    customerNotes: transaction.customerNotes || ''
  };

  try {
    // We use mode: 'no-cors' because Google Apps Script Web Apps do not support CORS preflight requests 
    // in a way that is easily consumable by fetch in all environments without complex server-side headers.
    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'text/plain', // Changed to text/plain to avoid preflight issues, GAS handles it fine
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
        // Add cache buster
        const url = `${GOOGLE_SHEETS_WEBAPP_URL}?_t=${Date.now()}`;
        const response = await fetch(url);
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

        // rawData is an array of arrays: [[id, date, time, total, items, name, phone, notes], ...]
        
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
                const dateStr = String(row[1]); 
                let dateObj = new Date(dateStr);

                if (isNaN(dateObj.getTime()) || dateStr.includes('/')) {
                    const parts = dateStr.split(/[/-]/);
                    if (parts.length === 3) {
                        const d = parseInt(parts[0], 10);
                        const m = parseInt(parts[1], 10);
                        const y = parseInt(parts[2], 10);
                        
                        if (d > 12) {
                             dateObj = new Date(`${y}-${m}-${d}`);
                        } else {
                             if (isNaN(dateObj.getTime())) {
                                 dateObj = new Date(`${y}-${m}-${d}`);
                             }
                        }
                    }
                }

                if (isNaN(dateObj.getTime())) {
                    dateObj = new Date();
                }

                // Extract new CRM fields (columns 5, 6, 7)
                const customerName = row[5] ? String(row[5]) : '';
                const customerPhone = row[6] ? String(row[6]) : '';
                const customerNotes = row[7] ? String(row[7]) : '';
                
                return {
                    id: String(row[0]),
                    date: dateObj.toISOString(),
                    total: Number(row[3]) || 0,
                    items: items,
                    discountPercentage: discountPercentage,
                    customerName: customerName,
                    customerPhone: customerPhone,
                    customerNotes: customerNotes
                };
            });

        return transactions;
    } catch (error) {
        console.error("Failed to fetch from Google Sheets:", error);
        return [];
    }
};

/**
 * Saves the current system state (Active Bills & Waitlist) to Google Apps Script Properties.
 * This allows real-time syncing between devices.
 */
export const saveSystemState = async (activeBills: ActiveBill[], waitlist: WaitlistEntry[]): Promise<boolean> => {
    if (!GOOGLE_SHEETS_WEBAPP_URL) return false;

    // Append ?type=saveState to the URL
    const url = `${GOOGLE_SHEETS_WEBAPP_URL}?type=saveState`;

    const payload = {
        activeBills,
        waitlist,
        timestamp: Date.now()
    };

    try {
        await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain', // Use text/plain to avoid preflight OPTIONS requests issues
            },
            body: JSON.stringify(payload),
        });
        return true;
    } catch (error) {
        console.error("Error syncing state to cloud:", error);
        return false;
    }
};

/**
 * Fetches the current system state from Google Apps Script.
 */
export const fetchSystemState = async (): Promise<{activeBills: ActiveBill[], waitlist: WaitlistEntry[]} | null> => {
    if (!GOOGLE_SHEETS_WEBAPP_URL) return null;

    // IMPORTANT: Add cache buster timestamp to prevent browser from returning stale data
    const url = `${GOOGLE_SHEETS_WEBAPP_URL}?type=getState&_t=${Date.now()}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && (data.activeBills || data.waitlist)) {
            return {
                activeBills: data.activeBills || [],
                waitlist: data.waitlist || []
            };
        }
        return null;
    } catch (error) {
        // Suppress error log for polling to keep console clean
        return null;
    }
};
