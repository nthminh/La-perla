
import { Transaction, ServiceCategory, ActiveBill, WaitlistEntry } from '../types';

/**
 * DEPRECATED: Google Sheets integration has been removed in favor of Firebase.
 * This file is kept to prevent build errors if imports were missed, but functions are now no-ops.
 */

export const saveToGoogleSheets = async (transaction: Transaction): Promise<boolean> => {
  console.warn("saveToGoogleSheets is deprecated. Using Firebase.");
  return false;
};

export const fetchGoogleSheetsData = async (currentPricingData?: ServiceCategory[]): Promise<Transaction[]> => {
    console.warn("fetchGoogleSheetsData is deprecated. Using Firebase.");
    return [];
};

export const saveSystemState = async (activeBills: ActiveBill[], waitlist: WaitlistEntry[]): Promise<boolean> => {
    console.warn("saveSystemState (Google Sheets) is deprecated. Using Firebase.");
    return false;
};

export const fetchSystemState = async (): Promise<{activeBills: ActiveBill[], waitlist: WaitlistEntry[]} | null> => {
    console.warn("fetchSystemState (Google Sheets) is deprecated. Using Firebase.");
    return null;
};
