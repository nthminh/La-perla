
import { ref, onValue, set, Unsubscribe } from "firebase/database";
import { db } from "./firebaseConfig";
import { ActiveBill, WaitlistEntry, AppSettings, ServiceCategory } from "../types";

// Đường dẫn lưu trữ trong database
const BILLS_REF = "systemState/activeBills";
const WAITLIST_REF = "systemState/waitlist";
const SETTINGS_REF = "settings";

export interface SystemState {
  activeBills: ActiveBill[];
  waitlist: WaitlistEntry[];
}

/**
 * Lắng nghe thay đổi dữ liệu hóa đơn/hàng chờ
 */
export const subscribeToSystemState = (
  onUpdate: (data: SystemState) => void
): Unsubscribe => {
  if (!db) {
    return () => {}; 
  }

  const systemRef = ref(db, "systemState");

  const unsubscribe = onValue(systemRef, (snapshot) => {
    const data = snapshot.val();
    
    if (data) {
      const bills = data.activeBills ? (Array.isArray(data.activeBills) ? data.activeBills : Object.values(data.activeBills)) : [];
      const wl = data.waitlist ? (Array.isArray(data.waitlist) ? data.waitlist : Object.values(data.waitlist)) : [];

      onUpdate({
        activeBills: bills,
        waitlist: wl
      });
    } else {
      onUpdate({
        activeBills: [],
        waitlist: []
      });
    }
  }, (error) => {
    console.error("Firebase Read Error:", error);
  });

  return unsubscribe;
};

/**
 * Lưu hóa đơn/hàng chờ
 */
export const saveSystemStateToFirebase = async (
  activeBills: ActiveBill[],
  waitlist: WaitlistEntry[]
): Promise<boolean> => {
  if (!db) return false;

  try {
    await set(ref(db, "systemState"), {
      activeBills,
      waitlist,
      lastUpdated: Date.now()
    });
    return true;
  } catch (error) {
    console.error("Firebase Write Error:", error);
    return false;
  }
};

/**
 * Lắng nghe thay đổi Cài đặt (Menu, Staff)
 */
export const subscribeToSettings = (
    onUpdate: (settings: AppSettings | null) => void
): Unsubscribe => {
    if (!db) return () => {};

    const settingsRef = ref(db, SETTINGS_REF);

    const unsubscribe = onValue(settingsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Ensure lists are arrays
            const staffList = data.staffList ? (Array.isArray(data.staffList) ? data.staffList : Object.values(data.staffList)) : [];
            // Pricing data structure is complex, ensure it's an array of categories
            const pricingData = data.pricingData && Array.isArray(data.pricingData) ? data.pricingData : [];
            
            onUpdate({ staffList, pricingData });
        } else {
            onUpdate(null); // Return null to indicate "no custom settings yet"
        }
    }, (error) => {
        console.error("Firebase Settings Read Error:", error);
    });

    return unsubscribe;
};

/**
 * Lưu Cài đặt (Menu, Staff)
 */
export const saveSettingsToFirebase = async (
    staffList: string[],
    pricingData: ServiceCategory[]
): Promise<boolean> => {
    if (!db) return false;

    // We must strip React Components (Icons) from pricingData before saving to JSON
    // The UI handles re-attaching icons based on categoryKey
    const cleanPricingData = pricingData.map(cat => ({
        categoryKey: cat.categoryKey,
        // icon: cat.icon, // DO NOT SAVE COMPONENT
        services: cat.services
    }));

    try {
        await set(ref(db, SETTINGS_REF), {
            staffList,
            pricingData: cleanPricingData,
            lastUpdated: Date.now()
        });
        return true;
    } catch (error) {
        console.error("Firebase Settings Write Error:", error);
        return false;
    }
};
