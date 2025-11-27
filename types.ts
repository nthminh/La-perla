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

export interface TransactionItem {
  nameKey: string;
  price: number;
  quantity: number;
  staffName?: string; // Added staffName property
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
}

export interface ActiveBill {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerNotes?: string;
  items: CartItem[];
  discountPercentage: number;
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  notes: string;
  addedTime: string; // ISO string
  estimatedReturnTime: string; // e.g. "14:30" or "30 mins"
  status?: 'waiting' | 'notified' | 'served'; // Track status
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
}

export interface AppSettings {
    staffList: string[];
    pricingData: ServiceCategory[];
}