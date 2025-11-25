
// FIX: Import React to use React.ComponentType
import React from 'react';

export interface Service {
  nameKey: string;
  price: string;
}

export interface ServiceCategory {
  categoryKey: string;
  icon: React.ComponentType<{ className?: string }>;
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
}
