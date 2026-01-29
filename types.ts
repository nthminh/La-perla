
// FIX: Import React to use React.ComponentType
import React from 'react';

export interface Service {
  nameKey: string;
  price: string;
  displayName?: string; // Optional: Allow overriding the translation key with a custom string
}

export interface ServiceCategory {
  categoryKey: string;
  icon?: React.ComponentType<{ className?: string }>; // Optional because JSON from Firebase won't have it
  services: Service[];
}

export interface GalleryItem {
  id: string; // Use string for ID to be more robust
  nameKey: string;
  src: string;
}

export interface Review {
  id: string;
  rating: number; // 1-5
  badges?: string[]; // e.g., "Creative", "Gentle"
  comment?: string; // New: Customer comment
  customerName?: string; // New: Customer name
  date: string;
}

// Global settings for targets (applies to all staff)
export interface GlobalPayrollSettings {
    defaultTarget: number;   // Standard Revenue Target
    customTargets: Record<string, number>; // Key: "Monday", "Tuesday", etc. Value: Target Amount
    gpsRequired?: boolean; // New: Require GPS check for payment completion
}

export interface PayrollConfig {
    enabled: boolean;
    baseSalary: number;      // Daily Base Salary (Guaranteed)
    bonusRate: number;       // % Bonus on revenue ABOVE target (e.g. 20 for 20%)
    // Targets are now removed from here and use GlobalPayrollSettings
}

export interface StaffProfile {
  id: string;
  name: string;
  password?: string; // Optional (e.g. for legacy or external data), but used for login
  avatar?: string; // Base64 image string
  
  // Artist Spotlight Fields
  bio?: string;
  specialties?: string[]; // e.g. ["3D Art", "Ombre", "Cuticle Care"]
  portfolio?: string[]; // Array of Base64 image strings
  reviews?: Review[];
  rating?: number; // Calculated average 0-5
  
  // New Payroll Config
  payroll?: PayrollConfig;
}

export interface TransactionItem {
  nameKey: string;
  price: number;
  quantity: number;
  staffName?: string; // Legacy support
  staffId?: string; // Added to link specifically to a staff profile
  displayName?: string; // Added displayName to support custom names and fixes PricingView error
}

export interface CartItem extends TransactionItem {
    id: string; // Internal ID for UI handling
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  total: number;
  items: TransactionItem[];
  discountPercentage?: number; // Added discount percentage tracking
  // New CRM fields
  customerName?: string;
  customerPhone?: string;
  customerNotes?: string;
  // Conflict Resolution
  lastUpdated?: number; // Epoch timestamp of the last edit
  deleted?: boolean; // Soft delete flag to prevent reappearing after deletion
  ticketNumber?: string; // Queue Ticket Number from ActiveBill (e.g. #A01)
}

export interface ActiveBill {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  items: CartItem[];
  discountPercentage: number;
  date?: string; // Optional: ISO string for historical bills
  createdByStaffId?: string; // New: Track who started the bill to prevent it disappearing on rename
  ticketNumber?: string; // New: Queue Ticket Number (e.g. #A01)
  isVip?: boolean; // New: Flag to identify VIP customers in real-time
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  addedTime: string; // ISO string
  estimatedReturnTime: string; // e.g. "14:30" or "30 mins"
  status?: 'waiting' | 'notified' | 'served'; // Track status
  selectedServices?: string[]; // List of service names selected by customer
  smsSentBy?: string; // Track which staff sent the SMS
  ticketNumber?: string; // New: Queue Ticket Number (e.g. #W05)
  isVip?: boolean; // New: Persist VIP status in waitlist
}

export interface BookingRequest {
  id: string;
  customerName: string;
  customerPhone: string;
  services: string[]; // List of service names
  date: string; // YYYY-MM-DD
  timeSlot: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface RecentServiceItem {
  nameKey: string;
  date: string;
  price: number;
}

export interface CustomerProfile {
  id: string;
  name: string;
  normalizedName: string; // Lowercase for searching
  phone: string;
  notes: string;
  lastVisit: string;
  visitCount: number;
  totalSpent: number;
  recentServices?: RecentServiceItem[]; // List of last ~10 service items details
  membershipExpiry?: string; // New: ISO date for Yearly Membership expiry
}

export interface AdminPasswords {
    master: string;  // Full access
    manager: string; // Shop Manager (Restricted)
}

export interface MarqueeSettings {
    message: string;
    speed: number; // Animation duration in seconds (e.g., 15, 25, 45)
}

export interface AppSettings {
    staffList: StaffProfile[]; 
    pricingData: ServiceCategory[];
    globalPayroll?: GlobalPayrollSettings; 
    knowledgeBase?: string;
    adminPasswords?: AdminPasswords; // New: Store passwords in settings
    marqueeSettings?: MarqueeSettings; // New: Kiosk marquee banner settings
}

export interface SettingsSnapshot {
    id: string;
    timestamp: number;
    data: AppSettings;
    restoredFrom?: string; // ID of the snapshot used if this was a restore
}

// Payroll Feature Types (Weekly Payroll - Australian Style: Thursday to Wednesday)
export interface PayrollSummary {
    staffId: string;
    staffName: string;
    weekStartDate: string; // YYYY-MM-DD (Thursday)
    weekEndDate: string; // YYYY-MM-DD (Wednesday)
    weekNumber: number; // Week number in year
    year: number;
    daysWorked: number;
    totalRevenue: number;
    baseSalaryTotal: number; // baseSalary * daysWorked
    bonusTotal: number;
    adjustment: number; // Manual adjustment (+/-)
    adjustmentNote: string;
    finalTotal: number; // baseSalaryTotal + bonusTotal + adjustment
}

export interface PayrollDailyBreakdown {
    date: string; // YYYY-MM-DD
    dayOfWeek: string;
    revenue: number;
    target: number;
    bonus: number;
}

// Attendance Tracking Types
export interface AttendanceRecord {
    id: string;
    staffId: string;
    staffName: string; // For easy display
    date: string; // YYYY-MM-DD
    lateMinutes: number; // Minutes late (0 if on time)
    earlyLeaveMinutes: number; // Minutes left early (0 if stayed full time)
    notes?: string; // Admin notes about the lateness/early leave
    recordedBy?: string; // Admin who recorded this
    recordedAt: string; // ISO timestamp when recorded
}
