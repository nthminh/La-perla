
import { Transaction, CustomerProfile, RecentServiceItem, WaitlistEntry, ActiveBill, StaffProfile, BookingRequest } from '../types';
import { logger } from '../utils/logger';

const STORAGE_KEY = 'la_perla_transactions';
const CUSTOMERS_KEY = 'la_perla_customers';
const WAITLIST_KEY = 'la_perla_waitlist';
const BOOKINGS_KEY = 'la_perla_bookings';
const ACTIVE_BILLS_KEY = 'la_perla_active_bills';
const CURRENT_BILL_ID_KEY = 'la_perla_current_bill_id';
const CURRENT_USER_KEY = 'la_perla_current_user';

export const saveTransaction = (transaction: Transaction): void => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    const transactions: Transaction[] = existingData ? JSON.parse(existingData) : [];
    
    // UPSERT: Check if transaction already exists and update it, otherwise add it
    const existingIndex = transactions.findIndex(t => t.id === transaction.id);
    if (existingIndex >= 0) {
      // Update existing transaction (keep the one with the latest timestamp)
      const existing = transactions[existingIndex];
      const existingTime = existing.lastUpdated || 0;
      const newTime = transaction.lastUpdated || 0;
      
      // Only update if the new transaction is newer or has the same timestamp
      if (newTime >= existingTime) {
        transactions[existingIndex] = transaction;
      }
    } else {
      // Add new transaction
      transactions.push(transaction);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    
    // Auto-update customer profile when a transaction is saved
    saveCustomerFromTransaction(transaction);
  } catch (error) {
    logger.error("Failed to save transaction", error);
  }
};

export const getTransactions = (): Transaction[] => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    if (!existingData) return [];
    
    const transactions: Transaction[] = JSON.parse(existingData);
    // Filter out soft-deleted transactions from local storage
    // This ensures deleted transactions are not returned for normal operations
    return transactions.filter(t => !t.deleted);
  } catch (error) {
    console.error("Failed to load transactions", error);
    return [];
  }
};

export const getAllTransactionsIncludingDeleted = (): Transaction[] => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    return existingData ? JSON.parse(existingData) : [];
  } catch (error) {
    console.error("Failed to load transactions", error);
    return [];
  }
};

export const deleteLocalTransaction = (id: string): void => {
    try {
        const existingData = localStorage.getItem(STORAGE_KEY);
        if (existingData) {
            const transactions: Transaction[] = JSON.parse(existingData);
            // Filter removes ALL instances with matching ID (handles duplicates)
            const updated = transactions.filter(t => t.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            
            // Log if duplicates were found (for debugging)
            const removedCount = transactions.length - updated.length;
            if (removedCount > 1) {
                console.warn(`Removed ${removedCount} duplicate instances of transaction ${id}`);
            }
        }
    } catch (error) {
        console.error("Failed to delete local transaction", error);
    }
};

export const clearTransactions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// NEW: Prune old transactions locally (Keep data NEWER than cutoffDate)
export const pruneOldLocalTransactions = (cutoffDate: Date): void => {
    try {
        const existingData = localStorage.getItem(STORAGE_KEY);
        if (existingData) {
            const transactions: Transaction[] = JSON.parse(existingData);
            // Keep transactions that are NEWER than the cutoff date
            const kept = transactions.filter(t => new Date(t.date) >= cutoffDate);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(kept));
        }
    } catch (error) {
        console.error("Failed to prune local transactions", error);
    }
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

// --- BOOKINGS FUNCTIONS ---

export const saveBookings = (bookings: BookingRequest[]): void => {
    try {
        localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
    } catch (error) {
        console.error("Failed to save bookings", error);
    }
};

export const getBookings = (): BookingRequest[] => {
    try {
        const data = localStorage.getItem(BOOKINGS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Failed to load bookings", error);
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

// --- SESSION / AUTH FUNCTIONS ---

export const saveCurrentUser = (user: StaffProfile): void => {
    try {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } catch (error) {
        console.error("Failed to save session", error);
    }
};

export const getCurrentUser = (): StaffProfile | null => {
    try {
        const data = localStorage.getItem(CURRENT_USER_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        return null;
    }
};

export const clearCurrentUser = (): void => {
    localStorage.removeItem(CURRENT_USER_KEY);
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

        // Detect Yearly Membership purchase to update VIP status
        const purchasedMembership = transaction.items.some(i => 
            i.nameKey.toLowerCase().includes('yearlymembership') || 
            (i.displayName && i.displayName.toLowerCase().includes('yearly membership'))
        );

        let membershipExpiry: string | undefined = undefined;
        if (purchasedMembership) {
            const expiry = new Date(transaction.date);
            expiry.setFullYear(expiry.getFullYear() + 1);
            membershipExpiry = expiry.toISOString();
        }

        if (existingIndex >= 0) {
            // Update existing
            const customer = customers[existingIndex];
            customer.visitCount += 1;
            customer.totalSpent += transaction.total;
            
            // Update membership if purchased
            if (membershipExpiry) {
                customer.membershipExpiry = membershipExpiry;
            }

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
                recentServices: newServiceItems.slice(0, 10),
                membershipExpiry: membershipExpiry
            };
            customers.push(newCustomer);
        }

        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));

    } catch (error) {
        console.error("Failed to save customer profile", error);
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
