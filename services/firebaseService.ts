
import { ref, onValue, set, update, remove, Unsubscribe, push, query, limitToLast, get, orderByChild, startAt, endAt, runTransaction } from "firebase/database";
import { db, waitForAuth } from "./firebaseConfig";
import { ActiveBill, WaitlistEntry, AppSettings, ServiceCategory, StaffProfile, BookingRequest, GlobalPayrollSettings, Transaction, AdminPasswords, SettingsSnapshot, MarqueeSettings, AttendanceRecord } from "../types";
import { DEFAULT_GLOBAL_PAYROLL, DEFAULT_ADMIN_PASSWORDS, DEFAULT_MARQUEE_SETTINGS } from "../constants";
import { deleteLocalTransaction, clearTransactions, pruneOldLocalTransactions } from "./storageService";
import { logger } from "../utils/logger";

// Confirmation text required for dangerous operations
const DELETE_ALL_CONFIRMATION = "DELETE ALL TRANSACTIONS";

// Đường dẫn lưu trữ trong database
const BILLS_REF = "systemState/activeBills";
const WAITLIST_REF = "systemState/waitlist";
const BOOKINGS_REF = "systemState/bookings";
const APP_VERSION_REF = "systemState/appVersion";
const TICKET_COUNTERS_REF = "systemState/ticketCounters"; // New path for counters
const SETTINGS_REF = "settings";
const SETTINGS_HISTORY_REF = "settingsHistory";
const TRANSACTIONS_REF = "transactions";
const ATTENDANCE_REF = "attendance"; // New: Attendance records

export interface SystemState {
  activeBills: ActiveBill[];
  waitlist: WaitlistEntry[];
  bookings: BookingRequest[];
  activeStaffIds: string[]; // List of currently logged in staff IDs
  appVersion: number; // Timestamp of the latest deploy
}

// Empty system state for offline/error scenarios
const EMPTY_SYSTEM_STATE: SystemState = {
  activeBills: [],
  waitlist: [],
  bookings: [],
  activeStaffIds: [],
  appVersion: 0
};

// --- HELPER: Sanitize Data for Firebase ---
const sanitizeData = <T>(data: T): T => {
  return JSON.parse(JSON.stringify(data));
};

/**
 * Lắng nghe thay đổi dữ liệu hệ thống (Bills, Waitlist, Bookings)
 * REAL-TIME SYNC READ
 */
export const subscribeToSystemState = (
  onUpdate: (data: SystemState) => void
): Unsubscribe => {
  if (!db) {
    return () => {}; 
  }

  // Attempt auth in background to ensure connection permissions
  waitForAuth();

  const systemRef = ref(db, "systemState");

  const unsubscribe = onValue(systemRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
      // Firebase stores lists as Objects with keys, convert back to Arrays
      const bills = data.activeBills ? Object.values(data.activeBills) as ActiveBill[] : [];
      const wl = data.waitlist ? Object.values(data.waitlist) as WaitlistEntry[] : [];
      const bk = data.bookings ? Object.values(data.bookings) as BookingRequest[] : [];
      const activeIds = data.activeStaff ? Object.keys(data.activeStaff) : [];
      const ver = data.appVersion || 0;

      onUpdate({
        activeBills: bills,
        waitlist: wl,
        bookings: bk,
        activeStaffIds: activeIds,
        appVersion: ver
      });
    } else {
      onUpdate(EMPTY_SYSTEM_STATE);
    }
  }, (error) => {
    logger.warn("Firebase Read Error (SystemState) - check rules", error.message);
    // Call onUpdate with empty state to prevent app from hanging
    // Note: localStorage data is loaded independently in App.tsx, so this won't overwrite cached data
    // This empty state primarily ensures isSystemReady gets set to true so the app can continue
    onUpdate(EMPTY_SYSTEM_STATE);
  });

  return unsubscribe;
};

/**
 * --- TICKET GENERATION LOGIC (NEW) ---
 * Generates unique tickets (A01...A100) that reset daily.
 */
export const getNextTicketNumber = async (type: 'checkin' | 'waitlist'): Promise<string> => {
    await waitForAuth();
    if (!db) return type === 'checkin' ? "A--" : "W--"; // Fallback for offline

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }); // YYYY-MM-DD
    const counterRef = ref(db, TICKET_COUNTERS_REF);

    try {
        // Use Firebase transaction for atomic read-modify-write to prevent race conditions
        const result = await runTransaction(counterRef, (currentData) => {
            // Initialize data if null or undefined
            let data = currentData || { date: todayStr, checkIn: 0, waitlist: 0 };

            // Check if we need to reset for a new day
            if (data.date !== todayStr) {
                data = { date: todayStr, checkIn: 0, waitlist: 0 };
            }

            // Increment the specific counter atomically
            if (type === 'checkin') {
                data.checkIn = (data.checkIn || 0) + 1;
            } else {
                data.waitlist = (data.waitlist || 0) + 1;
            }

            // Return the updated data to be written atomically
            return data;
        });

        // Extract the new counter value from the transaction result
        const data = result.snapshot.val();
        const count = type === 'checkin' ? data.checkIn : data.waitlist;
        const prefix = type === 'checkin' ? 'A' : 'W';
        
        // Format: < 10 adds '0' (A01), >= 10 keeps number (A10, A100, A101)
        const numStr = count < 10 ? `0${count}` : `${count}`;
        
        return `${prefix}${numStr}`;

    } catch (error) {
        console.error("Error generating ticket number:", error);
        // Fallback: Random to prevent blocking flow
        const randomNum = Math.floor(Math.random() * 90) + 10;
        return `${type === 'checkin' ? 'A' : 'W'}${randomNum}?`;
    }
};

/**
 * --- FORCE CLIENT UPDATE ---
 * Call this when deploying a new version
 */
export const triggerClientUpdate = async (): Promise<void> => {
    await waitForAuth();
    if (!db) return;
    // Set version to current timestamp. Clients will detect this is > their stored version and reload.
    await set(ref(db, APP_VERSION_REF), Date.now());
};

/**
 * --- ATOMIC OPERATIONS (CRITICAL FOR MULTI-USER) ---
 * Updated with "Search and Destroy" logic to fix array/object mismatch bugs
 */

// 1. ACTIVE BILLS
export const upsertActiveBill = async (bill: ActiveBill): Promise<void> => {
    await waitForAuth();
    if (!db) return;
    const cleanBill = sanitizeData(bill);
    // Path: systemState/activeBills/{bill_id}
    await update(ref(db, `${BILLS_REF}/${bill.id}`), cleanBill);
};

/**
 * Check if an active bill exists in Firebase
 * Used to prevent duplicate payment processing
 * Only checks direct path for optimal performance
 */
export const checkActiveBillExists = async (billId: string): Promise<boolean> => {
    await waitForAuth();
    if (!db) return false;
    
    try {
        // Check direct path (standard bill storage location)
        const directSnapshot = await get(ref(db, `${BILLS_REF}/${billId}`));
        return directSnapshot.exists();
    } catch (e) {
        console.warn("Error checking bill existence:", e);
        return false;
    }
};

export const deleteActiveBill = async (billId: string): Promise<void> => {
    await waitForAuth();
    if (!db) return;
    
    // 1. Try standard delete (Path based)
    await remove(ref(db, `${BILLS_REF}/${billId}`));

    // 2. Robust Check: Scan for any key containing this ID (Fix for array/ghost items)
    // Sometimes data is saved as array indices "0", "1" etc.
    try {
        const snapshot = await get(ref(db, BILLS_REF));
        if (snapshot.exists()) {
            const data = snapshot.val();
            const keys = Object.keys(data);
            const updates: Record<string, null> = {};
            let found = false;
            
            for (const key of keys) {
                // Check if the object at this key has the matching ID
                if (data[key]?.id === billId) {
                    updates[key] = null; // Mark for deletion
                    found = true;
                }
            }
            
            if (found) {
                await update(ref(db, BILLS_REF), updates);
            }
        }
    } catch (e) {
        console.warn("Deep clean failed for bill:", e);
    }
};

/**
 * Delete all ActiveBills (incomplete orders) created before today (Sydney time)
 * Bill IDs use Date.now().toString() format, so we can identify old bills by their timestamp
 * @returns Object with success status and count of deleted bills
 */
export const deleteOldIncompleteBills = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    await waitForAuth();
    if (!db) return { success: false, count: 0, error: "Database not initialized" };

    try {
        // Get today's date in Sydney timezone (YYYY-MM-DD format)
        const todayInSydney = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });

        // Fetch all active bills
        const snapshot = await get(ref(db, BILLS_REF));
        if (!snapshot.exists()) {
            return { success: true, count: 0 };
        }

        const data = snapshot.val();
        const keys = Object.keys(data);
        const updates: Record<string, null> = {};
        let count = 0;

        for (const key of keys) {
            const bill = data[key];
            if (bill && bill.id) {
                // Bill ID is a timestamp string (created with Date.now().toString())
                const billTimestamp = parseInt(bill.id, 10);
                
                if (!isNaN(billTimestamp)) {
                    // Get the bill's creation date in Sydney timezone
                    const billDateInSydney = new Date(billTimestamp).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
                    
                    // Delete if bill was created before today (comparing date strings in YYYY-MM-DD format)
                    if (billDateInSydney < todayInSydney) {
                        updates[key] = null; // Mark for deletion
                        count++;
                        logger.info(`Marking old bill for deletion: ${bill.id} (created on ${billDateInSydney})`);
                    }
                }
            }
        }

        if (count > 0) {
            await update(ref(db, BILLS_REF), updates);
            logger.info(`Deleted ${count} old incomplete bills`);
        }

        return { success: true, count };
    } catch (error: any) {
        logger.error("Error deleting old incomplete bills:", error.message);
        return { success: false, count: 0, error: error.message || "Unknown error" };
    }
};

// 2. WAITLIST
export const upsertWaitlistEntry = async (entry: WaitlistEntry): Promise<void> => {
    await waitForAuth();
    if (!db) return;
    const cleanEntry = sanitizeData(entry);
    await update(ref(db, `${WAITLIST_REF}/${entry.id}`), cleanEntry);
};

export const deleteWaitlistEntry = async (entryId: string): Promise<void> => {
    await waitForAuth();
    if (!db) return;

    // 1. Try standard delete (Fastest)
    await remove(ref(db, `${WAITLIST_REF}/${entryId}`));

    // 2. Robust Check: Scan entire waitlist node to find this ID if it's hiding under a different key (like '0', '1')
    // This fixes the "Item comes back after delete" bug.
    try {
        const snapshot = await get(ref(db, WAITLIST_REF));
        if (snapshot.exists()) {
            const data = snapshot.val();
            const keys = Object.keys(data);
            const updates: Record<string, null> = {};
            let found = false;

            for (const key of keys) {
                if (data[key]?.id === entryId) {
                    updates[key] = null;
                    found = true;
                }
            }

            if (found) {
                await update(ref(db, WAITLIST_REF), updates);
            }
        }
    } catch (e) {
        console.warn("Deep clean failed for waitlist:", e);
    }
};

// 3. BOOKINGS
export const upsertBooking = async (booking: BookingRequest): Promise<void> => {
    await waitForAuth();
    if (!db) return;
    const cleanBooking = sanitizeData(booking);
    await update(ref(db, `${BOOKINGS_REF}/${booking.id}`), cleanBooking);
};

export const deleteBooking = async (bookingId: string): Promise<void> => {
    await waitForAuth();
    if (!db) return;
    
    await remove(ref(db, `${BOOKINGS_REF}/${bookingId}`));

    // Robust check
    try {
        const snapshot = await get(ref(db, BOOKINGS_REF));
        if (snapshot.exists()) {
            const data = snapshot.val();
            const keys = Object.keys(data);
            const updates: Record<string, null> = {};
            let found = false;

            for (const key of keys) {
                if (data[key]?.id === bookingId) {
                    updates[key] = null;
                    found = true;
                }
            }
            
            if (found) {
                await update(ref(db, BOOKINGS_REF), updates);
            }
        }
    } catch (e) {
        console.warn("Deep clean failed for booking:", e);
    }
};


/**
 * --- TRANSACTION HISTORY ---
 */

// 1. Save New Transaction
export const saveTransactionToFirebase = async (transaction: Transaction): Promise<{ success: boolean; error?: string }> => {
    await waitForAuth();
    if (!db) return { success: false, error: "Database not initialized" };
    try {
        const cleanTx = sanitizeData(transaction);
        // Ensure ID is a valid string for Firebase paths
        const safeId = transaction.id.replace(/[.#$/[\]]/g, "_");
        const txRef = ref(db, `${TRANSACTIONS_REF}/${safeId}`);

        // --- CONFLICT RESOLUTION: LAST WRITE WINS (with deletion protection) ---
        // 1. Fetch current data on server
        const snapshot = await get(txRef);
        
        if (snapshot.exists()) {
            const serverTx = snapshot.val();
            
            // 2. CRITICAL: Never overwrite a deletion marker
            // If server has deleted=true, refuse to sync (deletion wins)
            if (serverTx.deleted) {
                console.log(`Skipping sync for ${safeId}: Transaction is deleted on server`);
                return { success: true }; // Treat as success (respecting deletion)
            }
            
            // 3. Compare timestamps
            // If server has a timestamp AND local timestamp is older than server's, DO NOT OVERWRITE
            // Treat undefined/null timestamps as 0 (very old)
            const serverTime = serverTx.lastUpdated || 0;
            const localTime = transaction.lastUpdated || 0;

            if (serverTime > localTime) {
                console.log(`Skipping sync for ${safeId}: Server data is newer (${serverTime} > ${localTime})`);
                return { success: true }; // Treat as success (sync completed by doing nothing)
            }
        }

        // 4. Write if local is newer or same, or server doesn't exist
        // But NEVER write if the local transaction is marked as deleted (shouldn't happen, but safety check)
        if (transaction.deleted) {
            console.log(`Skipping sync for ${safeId}: Local transaction is marked as deleted`);
            return { success: true };
        }
        
        await set(txRef, cleanTx);
        return { success: true };
    } catch (error: any) {
        console.error("Error saving transaction to Firebase:", error);
        return { success: false, error: error.code || error.message };
    }
};

// 2. Fetch/Subscribe to Transactions (Real-time)
// OPTIMIZATION: Limit to last 500 transactions to save bandwidth
export const subscribeToTransactions = (onUpdate: (transactions: Transaction[]) => void): Unsubscribe => {
    if (!db) {
        onUpdate([]);
        return () => {};
    }

    waitForAuth();

    // OPTIMIZATION: Use Query with limitToLast(500)
    // Only downloads the most recent 500 orders.
    const txQuery = query(ref(db, TRANSACTIONS_REF), orderByChild('date'), limitToLast(500));

    const unsubscribe = onValue(txQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const txList: Transaction[] = Array.isArray(data) ? data : Object.values(data);
            // Filter out soft-deleted transactions
            const activeTxList = txList.filter(tx => !tx.deleted);
            // Sort by date descending
            activeTxList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            onUpdate(activeTxList);
        } else {
            onUpdate([]);
        }
    }, (error) => {
        console.warn("Error fetching transactions (Subscribe):", error.message);
        onUpdate([]);
    });

    return unsubscribe;
};

// 2b. Fetch Transactions Once (Promise-based)
// UPDATED: Now supports a custom limit (default 50)
export const fetchTransactionsOnce = async (limit: number = 50): Promise<Transaction[]> => {
    try {
        await waitForAuth();
        if (!db) {
            console.warn("Database not initialized for fetchTransactionsOnce");
            return [];
        }
        
        const txQuery = query(ref(db, TRANSACTIONS_REF), limitToLast(limit));
        const snapshot = await get(txQuery);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            const txList: Transaction[] = Array.isArray(data) ? data : Object.values(data);
            // Filter out soft-deleted transactions
            const activeTxList = txList.filter(tx => !tx.deleted);
            // Client-side sort: Newest first
            return activeTxList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return [];
    } catch (error: any) {
        console.warn("Firebase fetch failed:", error.code || error.message);
        return [];
    }
}

// 2c. Fetch Transactions By Date Range (Full History)
export const fetchTransactionsByDateRange = async (startDate: string, endDate: string): Promise<Transaction[]> => {
    await waitForAuth();
    if (!db) return [];

    // Construct query parameters
    // startDate and endDate are expected to be YYYY-MM-DD
    const startISO = startDate; 
    const endISO = endDate + "\uf8ff"; 

    try {
        const txQuery = query(
            ref(db, TRANSACTIONS_REF), 
            orderByChild('date'), 
            startAt(startISO), 
            endAt(endISO)
        );

        const snapshot = await get(txQuery);
        if (snapshot.exists()) {
            const data = snapshot.val();
            const txList: Transaction[] = Array.isArray(data) ? data : Object.values(data);
            // Filter out soft-deleted transactions
            const activeTxList = txList.filter(tx => !tx.deleted);
            return activeTxList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return [];
    } catch (error: any) {
        console.warn("Firebase date-range fetch failed:", error.code);
        return [];
    }
}

// 2d. Fetch Transactions By Date Range (INCLUDING DELETED - for sync purposes)
export const fetchTransactionsByDateRangeIncludingDeleted = async (startDate: string, endDate: string): Promise<Transaction[]> => {
    await waitForAuth();
    if (!db) return [];

    // Construct query parameters
    // startDate and endDate are expected to be YYYY-MM-DD
    const startISO = startDate; 
    const endISO = endDate + "\uf8ff"; 

    try {
        const txQuery = query(
            ref(db, TRANSACTIONS_REF), 
            orderByChild('date'), 
            startAt(startISO), 
            endAt(endISO)
        );

        const snapshot = await get(txQuery);
        if (snapshot.exists()) {
            const data = snapshot.val();
            const txList: Transaction[] = Array.isArray(data) ? data : Object.values(data);
            // Return ALL transactions including deleted ones (for sync purposes)
            return txList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return [];
    } catch (error: any) {
        console.warn("Firebase date-range fetch failed:", error.code);
        return [];
    }
}

// 3. Update Transaction (Edit)
export const updateTransactionInFirebase = async (transaction: Transaction): Promise<boolean> => {
    await waitForAuth();
    if (!db) return false;
    try {
        const cleanTx = sanitizeData(transaction);
        const safeId = transaction.id.replace(/[.#$/[\]]/g, "_");
        const txRef = ref(db, `${TRANSACTIONS_REF}/${safeId}`);
        await update(txRef, cleanTx);
        return true;
    } catch (error) {
        console.error("Error updating transaction:", error);
        return false;
    }
};

// 4. Delete Transaction (SOFT DELETE)
// Marks transaction as deleted instead of removing it.
// This prevents reappearing issues when worker devices sync their local copies.
export const deleteTransactionFromFirebase = async (transactionId: string): Promise<boolean> => {
    deleteLocalTransaction(transactionId);
    await waitForAuth();
    if (!db) return true; 

    try {
        const safeId = transactionId.replace(/[.#$/[\]]/g, "_");
        const txRef = ref(db, `${TRANSACTIONS_REF}/${safeId}`);
        
        // SOFT DELETE: Mark as deleted with timestamp instead of removing
        // This allows the deletion to sync across all devices
        const deletionMarker = {
            deleted: true,
            lastUpdated: Date.now() // Ensure this deletion has the latest timestamp
        };
        
        // 1. Try standard soft delete (Path based - Fastest)
        await update(txRef, deletionMarker);
        
        // 2. Robust Check: Find and mark ALL instances of this transaction as deleted
        // This fixes cases where the transaction is stored under different keys
        try {
            const snapshot = await get(ref(db, TRANSACTIONS_REF));
            if (snapshot.exists()) {
                const data = snapshot.val();
                const keys = Object.keys(data);
                const updates: Record<string, Transaction> = {};
                let found = false;

                for (const key of keys) {
                    // Check if the object at this key has the matching ID
                    // Need to check both the original ID and the safeId
                    if (data[key]?.id === transactionId || data[key]?.id === safeId) {
                        // Mark as deleted instead of null
                        updates[key] = { ...data[key], ...deletionMarker };
                        found = true;
                    }
                }

                if (found) {
                    await update(ref(db, TRANSACTIONS_REF), updates);
                }
            }
        } catch (e) {
            console.warn("Deep clean failed for transaction:", e);
        }
        
        return true;
    } catch (error: any) {
        console.warn("Error marking transaction as deleted in Cloud (Local copy deleted):", error.code || error.message);
        return true; 
    }
};

/**
 * ⚠️ DANGEROUS: Deletes ALL transactions from Firebase and local storage
 * This function should ONLY be called with explicit user confirmation
 * Use deleteTransactionFromFirebase() for individual transaction deletion
 * 
 * @param confirmationText - Must be DELETE_ALL_CONFIRMATION constant to proceed
 * @returns Promise<boolean> - true if successful, false if confirmation failed
 */
export const deleteAllTransactions = async (confirmationText: string): Promise<boolean> => {
    // SAFETY CHECK: Require explicit confirmation text
    if (confirmationText !== DELETE_ALL_CONFIRMATION) {
        logger.error("deleteAllTransactions() called without proper confirmation - BLOCKED");
        console.error(`❌ BLOCKED: deleteAllTransactions() requires confirmation text '${DELETE_ALL_CONFIRMATION}'`);
        return false;
    }

    // Log the dangerous operation
    logger.warn("⚠️ CRITICAL: Deleting ALL transactions from database");
    console.warn("⚠️ CRITICAL: Proceeding to delete ALL transactions...");

    clearTransactions();
    await waitForAuth();
    if (!db) return true;

    try {
        const txRef = ref(db, TRANSACTIONS_REF);
        await remove(txRef);
        logger.warn("✅ All transactions deleted from Firebase");
        console.warn("✅ All transactions deleted successfully");
        return true;
    } catch (error: any) {
        logger.error("Error deleting all transactions from Cloud:", error.message);
        console.error("Error deleting all transactions from Cloud:", error.message);
        return false;
    }
};

// 5. Prune Old Transactions (Keep Recent)
export const pruneOldTransactionsFromFirebase = async (cutoffDate: Date): Promise<{ success: boolean; count: number }> => {
    // Also prune local storage
    pruneOldLocalTransactions(cutoffDate);
    
    await waitForAuth();
    if (!db) return { success: true, count: 0 }; // If offline, we only pruned local

    try {
        // Use query to find items older than cutoff (endAt cutoffDate string)
        const cutoffISO = cutoffDate.toISOString();
        const oldDataQuery = query(ref(db, TRANSACTIONS_REF), orderByChild('date'), endAt(cutoffISO));
        
        const snapshot = await get(oldDataQuery);
        if (!snapshot.exists()) return { success: true, count: 0 };

        const updates: Record<string, null> = {};
        let count = 0;

        snapshot.forEach((childSnapshot) => {
            updates[childSnapshot.key!] = null; // Mark for deletion
            count++;
        });

        if (count > 0) {
            await update(ref(db, TRANSACTIONS_REF), updates);
        }

        return { success: true, count };
    } catch (error: any) {
        console.warn("Error pruning old transactions:", error.message);
        return { success: false, count: 0 };
    }
};

/**
 * Cập nhật trạng thái Online/Offline của nhân viên
 */
export const updateStaffPresence = async (staffId: string, isOnline: boolean): Promise<void> => {
    await waitForAuth();
    if (!db || !staffId) return;

    const presenceRef = ref(db, `systemState/activeStaff/${staffId}`);
    try {
        if (isOnline) {
            await set(presenceRef, true);
        } else {
            await remove(presenceRef);
        }
    } catch (error) {
        console.warn("Error updating presence:", error);
    }
};

/**
 * Settings & History
 */
export const subscribeToSettings = (
    onUpdate: (settings: AppSettings | null) => void
): Unsubscribe => {
    if (!db) return () => {};
    waitForAuth();
    const settingsRef = ref(db, SETTINGS_REF);
    const unsubscribe = onValue(settingsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            let staffList: StaffProfile[] = [];
            if (data.staffList) {
                const rawList = Array.isArray(data.staffList) ? data.staffList : Object.values(data.staffList);
                if (rawList.length > 0 && typeof rawList[0] === 'string') {
                    staffList = (rawList as string[]).map(name => ({
                        id: name.toLowerCase().replace(/\s/g, '_'),
                        name: name,
                        password: '999',
                        avatar: ''
                    }));
                } else {
                    staffList = rawList as StaffProfile[];
                }
            }
            const pricingData = data.pricingData && Array.isArray(data.pricingData) ? data.pricingData : [];
            const globalPayroll = data.globalPayroll || DEFAULT_GLOBAL_PAYROLL;
            const knowledgeBase = data.knowledgeBase || "";
            const adminPasswords = data.adminPasswords || DEFAULT_ADMIN_PASSWORDS;
            const marqueeSettings = data.marqueeSettings || DEFAULT_MARQUEE_SETTINGS;
            onUpdate({ staffList, pricingData, globalPayroll, knowledgeBase, adminPasswords, marqueeSettings });
        } else {
            onUpdate(null);
        }
    }, (error) => {
        console.warn("Firebase Settings Read Error:", error.message);
    });
    return unsubscribe;
};

// NEW: Subscribe to History
export const subscribeToSettingsHistory = (
    onUpdate: (history: SettingsSnapshot[]) => void
): Unsubscribe => {
    if (!db) return () => {};
    waitForAuth();
    
    // Get last 20 entries
    const historyQuery = query(ref(db, SETTINGS_HISTORY_REF), limitToLast(20));
    
    const unsubscribe = onValue(historyQuery, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Convert to array and sort descending (newest first)
            const list = Object.values(data) as SettingsSnapshot[];
            list.sort((a, b) => b.timestamp - a.timestamp);
            onUpdate(list);
        } else {
            onUpdate([]);
        }
    });
    return unsubscribe;
};

export const saveSettingsToFirebase = async (
    staffList: StaffProfile[],
    pricingData: ServiceCategory[],
    globalPayroll?: GlobalPayrollSettings,
    knowledgeBase?: string,
    adminPasswords?: AdminPasswords,
    marqueeSettings?: MarqueeSettings
): Promise<{ success: boolean; error?: string }> => {
    await waitForAuth();
    if (!db) return { success: false, error: "Database not initialized. Check your configuration." };
    
    const cleanPricingData = pricingData.map(cat => ({
        categoryKey: cat.categoryKey,
        services: cat.services
    }));
    
    const sanitizedStaffList = sanitizeData(staffList);
    const sanitizedPricingData = sanitizeData(cleanPricingData);
    const sanitizedGlobalPayroll = sanitizeData(globalPayroll || DEFAULT_GLOBAL_PAYROLL);
    const sanitizedAdminPasswords = sanitizeData(adminPasswords || DEFAULT_ADMIN_PASSWORDS);
    const sanitizedMarqueeSettings = sanitizeData(marqueeSettings || DEFAULT_MARQUEE_SETTINGS);
    const sanitizedKB = knowledgeBase || "";

    const newSettings: AppSettings = {
        staffList: sanitizedStaffList,
        pricingData: sanitizedPricingData,
        globalPayroll: sanitizedGlobalPayroll,
        knowledgeBase: sanitizedKB,
        adminPasswords: sanitizedAdminPasswords,
        marqueeSettings: sanitizedMarqueeSettings
    };

    try {
        // 1. Update Current Settings
        // This is the critical save.
        await set(ref(db, SETTINGS_REF), {
            ...newSettings,
            lastUpdated: Date.now()
        });

        // 2. Create History Snapshot with Auto-Cleanup
        try {
            const snapshotRef = push(ref(db, SETTINGS_HISTORY_REF));
            await set(snapshotRef, {
                id: snapshotRef.key,
                timestamp: Date.now(),
                data: newSettings
            });

            // 3. Auto-Cleanup: Keep only last 50
            // We perform this asynchronously to not block the UI response
            get(ref(db, SETTINGS_HISTORY_REF)).then(snapshot => {
                if (snapshot.exists()) {
                    const val = snapshot.val();
                    const keys = Object.keys(val);
                    const MAX_HISTORY = 50;
                    
                    if (keys.length > MAX_HISTORY) {
                        // Sort keys (Push IDs are chronological)
                        keys.sort();
                        
                        // Identify oldest keys to delete
                        const deleteCount = keys.length - MAX_HISTORY;
                        const keysToDelete = keys.slice(0, deleteCount);
                        
                        const updates: Record<string, null> = {};
                        keysToDelete.forEach(k => {
                            updates[k] = null;
                        });
                        
                        update(ref(db, SETTINGS_HISTORY_REF), updates).catch(err => 
                            console.warn("Cleanup error:", err)
                        );
                    }
                }
            });

        } catch (historyErr: any) {
            console.warn("History save failed (likely due to rules), but main settings saved.", historyErr.code);
        }

        return { success: true };
    } catch (error: any) {
        console.error("Firebase Settings Write Error:", error);
        return { success: false, error: error.message || "Unknown write error" };
    }
};

// NEW: Restore function
export const restoreSettingsFromHistory = async (snapshot: SettingsSnapshot): Promise<boolean> => {
    await waitForAuth();
    if (!db) return false;

    try {
        const settingsToRestore = snapshot.data;
        // Update current settings with historical data
        await set(ref(db, SETTINGS_REF), {
            ...settingsToRestore,
            lastUpdated: Date.now()
        });
        
        // Try to log restoration event
        try {
            const historyRef = push(ref(db, SETTINGS_HISTORY_REF));
            await set(historyRef, {
                id: historyRef.key,
                timestamp: Date.now(),
                data: settingsToRestore,
                restoredFrom: snapshot.id
            });
        } catch(e) {}

        return true;
    } catch (error) {
        console.error("Restore Error:", error);
        return false;
    }
};

// ============================================
// ATTENDANCE TRACKING FUNCTIONS
// ============================================

/**
 * Save or update an attendance record
 */
export const saveAttendanceRecord = async (record: AttendanceRecord): Promise<boolean> => {
    if (!db) {
        console.warn("Firebase not configured. Attendance not saved.");
        return false;
    }
    
    try {
        await waitForAuth();
        const recordRef = ref(db, `${ATTENDANCE_REF}/${record.id}`);
        await set(recordRef, sanitizeData(record));
        logger.info(`Attendance record saved: ${record.staffName} - ${record.date}`);
        return true;
    } catch (error) {
        console.error("Error saving attendance record:", error);
        return false;
    }
};

/**
 * Subscribe to attendance records with optional date filtering
 */
export const subscribeToAttendance = (
    onUpdate: (records: AttendanceRecord[]) => void,
    startDate?: string,
    endDate?: string
): Unsubscribe => {
    if (!db) {
        console.warn("Firebase not configured. Returning empty attendance.");
        onUpdate([]);
        return () => {};
    }
    
    let attendanceQuery;
    
    if (startDate && endDate) {
        // Query with date range filter
        // Add Unicode high character to endDate to ensure all records on that date are included
        const endDateWithSuffix = endDate + "\uf8ff";
        
        attendanceQuery = query(
            ref(db, ATTENDANCE_REF),
            orderByChild('date'),
            startAt(startDate),
            endAt(endDateWithSuffix)
        );
    } else {
        // Get all records
        attendanceQuery = ref(db, ATTENDANCE_REF);
    }
    
    return onValue(attendanceQuery, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            onUpdate([]);
            return;
        }
        
        const records = Object.values(data) as AttendanceRecord[];
        onUpdate(records);
    }, (error) => {
        console.error("Error subscribing to attendance:", error);
        onUpdate([]);
    });
};

/**
 * Fetch attendance records once for a date range
 */
export const fetchAttendanceByDateRange = async (
    startDate: string,
    endDate: string
): Promise<AttendanceRecord[]> => {
    if (!db) {
        console.warn("Firebase not configured.");
        return [];
    }
    
    try {
        await waitForAuth();
        
        // Add Unicode high character to endDate to ensure all records on that date are included
        const endDateWithSuffix = endDate + "\uf8ff";
        
        const attendanceQuery = query(
            ref(db, ATTENDANCE_REF),
            orderByChild('date'),
            startAt(startDate),
            endAt(endDateWithSuffix)
        );
        
        const snapshot = await get(attendanceQuery);
        if (!snapshot.exists()) {
            return [];
        }
        
        const data = snapshot.val();
        const records = Object.values(data) as AttendanceRecord[];
        return records;
    } catch (error) {
        console.error("Error fetching attendance:", error);
        return [];
    }
};

/**
 * Delete an attendance record
 */
export const deleteAttendanceRecord = async (recordId: string): Promise<boolean> => {
    if (!db) {
        console.warn("Firebase not configured.");
        return false;
    }
    
    try {
        await waitForAuth();
        const recordRef = ref(db, `${ATTENDANCE_REF}/${recordId}`);
        await remove(recordRef);
        logger.info(`Attendance record deleted: ${recordId}`);
        return true;
    } catch (error) {
        console.error("Error deleting attendance record:", error);
        return false;
    }
};
