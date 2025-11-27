
import { Transaction, CustomerProfile, RecentServiceItem, WaitlistEntry, ActiveBill } from '../types';

const STORAGE_KEY = 'la_perla_transactions';
const CUSTOMERS_KEY = 'la_perla_customers';
const WAITLIST_KEY = 'la_perla_waitlist';
const ACTIVE_BILLS_KEY = 'la_perla_active_bills';
const CURRENT_BILL_ID_KEY = 'la_perla_current_bill_id';

export const saveTransaction = (transaction: Transaction): void => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    const transactions: Transaction[] = existingData ? JSON.parse(existingData) : [];
    transactions.push(transaction);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    
    // Auto-update customer profile when a transaction is saved
    saveCustomerFromTransaction(transaction);
  } catch (error) {
    console.error("Failed to save transaction", error);
  }
};

export const getTransactions = (): Transaction[] => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    return existingData ? JSON.parse(existingData) : [];
  } catch (error) {
    console.error("Failed to load transactions", error);
    return [];
  }
};

export const clearTransactions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// --- WAITLIST FUNCTIONS ---

export const saveWaitlist = (waitlist: WaitlistEntry[]): void => {
    try {
        localStorage.setItem(WAITLIST_KEY, JSON.stringify(waitlist));
    } catch (error) {
        console.error("Failed to save waitlist", error);
    }
};

export const getWaitlist = (): WaitlistEntry[] => {
    try {
        const data = localStorage.getItem(WAITLIST_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to load waitlist", error);
        return [];
    }
};

// --- ACTIVE BILLS FUNCTIONS (NEW) ---

export const saveActiveBills = (bills: ActiveBill[]): void => {
    try {
        localStorage.setItem(ACTIVE_BILLS_KEY, JSON.stringify(bills));
    } catch (error) {
        console.error("Failed to save active bills", error);
    }
};

export const getActiveBills = (): ActiveBill[] => {
    try {
        const data = localStorage.getItem(ACTIVE_BILLS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to load active bills", error);
        return [];
    }
};

export const saveCurrentBillId = (id: string): void => {
    try {
        localStorage.setItem(CURRENT_BILL_ID_KEY, id);
    } catch (error) {
        console.error("Failed to save current bill ID", error);
    }
};

export const getCurrentBillId = (): string | null => {
    return localStorage.getItem(CURRENT_BILL_ID_KEY);
};

// --- CRM / CUSTOMER FUNCTIONS ---

/**
 * Updates or creates a customer profile based on a completed transaction.
 */
const saveCustomerFromTransaction = (transaction: Transaction): void => {
    if (!transaction.customerName) return; // Anonymous transaction

    try {
        const existingData = localStorage.getItem(CUSTOMERS_KEY);
        let customers: CustomerProfile[] = existingData ? JSON.parse(existingData) : [];
        
        const normalizedName = transaction.customerName.trim().toLowerCase();
        
        const existingIndex = customers.findIndex(c => c.normalizedName === normalizedName);

        // Extract new service items from this transaction
        const newServiceItems: RecentServiceItem[] = transaction.items.map(i => ({
            nameKey: i.nameKey,
            date: transaction.date,
            price: i.price
        }));

        if (existingIndex >= 0) {
            // Update existing
            const customer = customers[existingIndex];
            customer.visitCount += 1;
            customer.totalSpent += transaction.total;
            
            // Only update lastVisit if the new transaction is actually newer (or same date)
            if (new Date(transaction.date) >= new Date(customer.lastVisit)) {
                 customer.lastVisit = transaction.date;
                 // Update phone/notes from the most recent transaction
                 if (transaction.customerPhone) customer.phone = transaction.customerPhone;
                 if (transaction.customerNotes) customer.notes = transaction.customerNotes;
            }

            // Update Recent Services
            const currentRecent = customer.recentServices || [];
            const combined = [...newServiceItems, ...currentRecent];
            customer.recentServices = combined.slice(0, 10);
            
            customers[existingIndex] = customer;
        } else {
            // Create new
            const newCustomer: CustomerProfile = {
                id: Date.now().toString(),
                name: transaction.customerName.trim(), // Keep original casing
                normalizedName: normalizedName,
                phone: transaction.customerPhone || '',
                notes: transaction.customerNotes || '',
                lastVisit: transaction.date,
                visitCount: 1,
                totalSpent: transaction.total,
                recentServices: newServiceItems.slice(0, 10)
            };
            customers.push(newCustomer);
        }

        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));

    } catch (error) {
        console.error("Failed to save customer profile", error);
    }
};

/**
 * Batch processes a list of transactions (e.g., from Google Sheets) 
 * to build/update the local customer database.
 * This ensures data persistence across devices/sessions.
 */
export const syncCustomersFromHistory = (transactions: Transaction[]): void => {
    if (!transactions || transactions.length === 0) return;

    try {
        const existingData = localStorage.getItem(CUSTOMERS_KEY);
        // Load existing map
        const customers: CustomerProfile[] = existingData ? JSON.parse(existingData) : [];
        const customerMap = new Map<string, CustomerProfile>();
        customers.forEach(c => customerMap.set(c.normalizedName, c));

        // Group transactions by normalized customer name
        const transactionsByCustomer: Record<string, Transaction[]> = {};
        
        transactions.forEach(tr => {
            if (!tr.customerName) return;
            const norm = tr.customerName.trim().toLowerCase();
            if (!transactionsByCustomer[norm]) {
                transactionsByCustomer[norm] = [];
            }
            transactionsByCustomer[norm].push(tr);
        });

        let updatesMade = false;

        // Process each customer group
        Object.entries(transactionsByCustomer).forEach(([normName, userTrans]) => {
            // Sort user transactions: Newest First
            userTrans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Latest transaction determines basic info
            const latestTr = userTrans[0];
            
            // Calculate aggregations
            const visitCount = userTrans.length;
            const totalSpent = userTrans.reduce((sum, t) => sum + t.total, 0);

            // Aggregate recent services (flatten all items from newest to oldest)
            const allServices: RecentServiceItem[] = [];
            userTrans.forEach(tr => {
                tr.items.forEach(item => {
                    allServices.push({
                        nameKey: item.nameKey,
                        date: tr.date,
                        price: item.price
                    });
                });
            });
            const recentServices = allServices.slice(0, 10);

            let customer = customerMap.get(normName);

            if (!customer) {
                // New Customer from History
                customer = {
                    id: `imported-${Date.now()}-${Math.random()}`,
                    name: latestTr.customerName!.trim(),
                    normalizedName: normName,
                    phone: latestTr.customerPhone || '',
                    notes: latestTr.customerNotes || '',
                    lastVisit: latestTr.date,
                    visitCount,
                    totalSpent,
                    recentServices
                };
                customerMap.set(normName, customer);
                updatesMade = true;
            } else {
                // Existing Customer - Update metrics if history provides more data
                
                let changed = false;
                
                // Update Phone/Notes if the sheet has newer data or missing data
                if (new Date(latestTr.date) >= new Date(customer.lastVisit)) {
                    customer.lastVisit = latestTr.date;
                    if (latestTr.customerPhone) { customer.phone = latestTr.customerPhone; changed = true; }
                    if (latestTr.customerNotes) { customer.notes = latestTr.customerNotes; changed = true; }
                }

                // Merge/Overwrite recent services with the historical view
                if (recentServices.length > 0) {
                     // Check if actually different to avoid unnecessary writes
                     const oldJson = JSON.stringify(customer.recentServices);
                     const newJson = JSON.stringify(recentServices);
                     if (oldJson !== newJson) {
                         customer.recentServices = recentServices;
                         changed = true;
                     }
                }
                
                // Optional: Update visit counts if history seems larger
                if (visitCount > customer.visitCount) {
                    customer.visitCount = visitCount;
                    customer.totalSpent = totalSpent;
                    changed = true;
                }

                if (changed) updatesMade = true;
            }
        });

        if (updatesMade) {
            localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(Array.from(customerMap.values())));
            console.log("Customer database synced from Google Sheets history.");
        }

    } catch (error) {
        console.error("Failed to sync customers from history", error);
    }
};

/**
 * Search for customers by name or phone.
 * Returns top 5 matches.
 */
export const searchCustomers = (query: string): CustomerProfile[] => {
    if (!query || query.length < 2) return [];

    try {
        const existingData = localStorage.getItem(CUSTOMERS_KEY);
        const customers: CustomerProfile[] = existingData ? JSON.parse(existingData) : [];
        
        const lowerQuery = query.toLowerCase();

        return customers
            .filter(c => 
                c.normalizedName.includes(lowerQuery) || 
                c.phone.includes(lowerQuery)
            )
            .sort((a, b) => {
                // Sort by: Exact match first, then by visit count (most loyal customers first)
                if (a.normalizedName === lowerQuery) return -1;
                if (b.normalizedName === lowerQuery) return 1;
                return b.visitCount - a.visitCount;
            })
            .slice(0, 5); // Limit to 5 suggestions
    } catch (error) {
        console.error("Failed to search customers", error);
        return [];
    }
};
