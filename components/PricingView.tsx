import React, { useState, useMemo, useEffect, useRef } from 'react';
// Remove direct import of constants
// import { PRICING_DATA, STAFF_LIST } from '../constants';
import { Translation } from '../translations';
import { PlusIcon, MinusIcon, ReceiptIcon, XMarkIcon, LaPerlaLogo, ChevronDownIcon, DownloadIcon, LockIcon, PhoneIcon, BriefcaseIcon, ClockIcon, SparklesIcon, ChatIcon, UserIcon, GridIcon, ListBulletIcon } from './Icons';
import { saveTransaction, searchCustomers, getTransactions } from '../services/storageService';
import { saveToGoogleSheets } from '../services/googleSheetsService';
import { TransactionItem, CartItem, ActiveBill, CustomerProfile, RecentServiceItem, WaitlistEntry, ServiceCategory, Transaction } from '../types';

interface PricingViewProps {
  t: Translation;
  // New Props for Multiple Bill Support
  activeBills: ActiveBill[];
  setActiveBills: React.Dispatch<React.SetStateAction<ActiveBill[]>>;
  currentBillId: string;
  setCurrentBillId: (id: string) => void;
  
  isBillOpen: boolean;
  setIsBillOpen: (isOpen: boolean) => void;
  openCategories: Record<string, boolean>;
  setOpenCategories: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  autoDownloadTrigger: boolean;
  onAutoDownloadComplete: () => void;
  isStaffMode: boolean;
  setIsStaffMode: (isStaff: boolean) => void;

  // Waitlist Props
  waitlist: WaitlistEntry[];
  setWaitlist: (list: WaitlistEntry[]) => void;

  // DYNAMIC DATA
  staffList: string[];
  pricingData: ServiceCategory[];
}

// Helper to generate unique ID for cart items
const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

// Helper interface for grouped display in Bill
interface GroupedCartItem extends CartItem {
    originalIds: string[]; // Track original IDs for removal/editing
}

const STAFF_PIN = "999";

// Search Icon Component locally to avoid extra file changes just for one icon if not present, 
// though we usually import icons. Let's reuse existing if possible or define inline.
const SearchIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const PencilIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);

const ArrowRightIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);

const HistoryIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 0110 10v.5a.5.5 0 01-1 0V12a9 9 0 10-9 9 .5.5 0 010 1A10 10 0 1112 2z" />
    </svg>
);

// Helper to calculate time ago
const formatTimeAgo = (isoDate: string) => {
    const diff = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
    return new Date(isoDate).toLocaleDateString();
};

export const PricingView: React.FC<PricingViewProps> = ({ 
  t,
  activeBills = [],
  setActiveBills,
  currentBillId,
  setCurrentBillId,
  isBillOpen,
  setIsBillOpen,
  openCategories,
  setOpenCategories,
  autoDownloadTrigger,
  onAutoDownloadComplete,
  isStaffMode,
  setIsStaffMode,
  waitlist = [],
  setWaitlist,
  // Props for data
  staffList,
  pricingData
}) => {
  // Local UI state
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeBillsViewMode, setActiveBillsViewMode] = useState<'row' | 'grid'>('row');
  
  // Staff Selection Modal State
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [pendingService, setPendingService] = useState<{nameKey: string, price: string, displayName?: string} | null>(null);
  
  // Staff Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  // Customer Entry Modal State
  const [showCustomerEntry, setShowCustomerEntry] = useState(false);
  const [entryMode, setEntryMode] = useState<'new' | 'edit'>('new');
  const [tempCustomerName, setTempCustomerName] = useState("");
  const [tempCustomerPhone, setTempCustomerPhone] = useState("");
  const [tempCustomerNotes, setTempCustomerNotes] = useState("");
  
  // Waitlist Modal State
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showWaitlistAddModal, setShowWaitlistAddModal] = useState(false);
  const [tempReturnTime, setTempReturnTime] = useState(""); // For waitlist

  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [viewingHistoryBill, setViewingHistoryBill] = useState<ActiveBill | null>(null);

  // CRM / Autocomplete State
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerProfile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState<RecentServiceItem[]>([]);
  
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const entryModalRef = useRef<HTMLDivElement>(null);

  // Changed from single ID to array of IDs to support bulk editing from Bill view
  const [editingIds, setEditingIds] = useState<string[]>([]); 

  // --- DERIVED STATE: CURRENT BILL ---
  const currentBill = useMemo(() => {
      // Safety check: if activeBills is somehow not an array or empty or null
      if (!activeBills || !Array.isArray(activeBills) || activeBills.length === 0) {
          return { id: 'fallback', customerName: '', items: [], discountPercentage: 0 };
      }
      return activeBills.find(b => b && b.id === currentBillId) || activeBills[0] || { id: 'fallback', customerName: '', items: [], discountPercentage: 0 };
  }, [activeBills, currentBillId]);

  // Use convenience variables for the current bill's data
  // If we are viewing a history bill, use that instead of currentBill
  const targetBill = viewingHistoryBill || currentBill;

  const cartItems = targetBill?.items || [];
  const customerName = targetBill?.customerName || '';
  const customerPhone = targetBill?.customerPhone || '';
  const customerNotes = targetBill?.customerNotes || '';
  const discountPercentage = targetBill?.discountPercentage || 0;

  // --- HELPER TO UPDATE CURRENT BILL ---
  const updateCurrentBill = (updates: Partial<ActiveBill>) => {
      if (viewingHistoryBill) return; // Cannot edit history
      setActiveBills(prev => {
          if (!Array.isArray(prev)) return prev;
          return prev.map(bill => bill.id === currentBillId ? { ...bill, ...updates } : bill);
      });
  };

  // --- HISTORY LOGIC ---
  const handleOpenHistory = () => {
      const txs = getTransactions();
      // Sort newest first and take last 30
      const sorted = txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 30);
      setRecentTransactions(sorted);
      setShowHistoryModal(true);
  };

  const handleViewHistoryItem = (tx: Transaction) => {
      // Convert Transaction back to ActiveBill format for display
      const bill: ActiveBill = {
          id: tx.id,
          customerName: tx.customerName || 'Guest',
          customerPhone: tx.customerPhone,
          customerNotes: tx.customerNotes,
          // Map transaction items back to CartItems (needs fake IDs for UI keying)
          items: tx.items.map(i => ({ ...i, id: Math.random().toString(36).substr(2, 9) })),
          discountPercentage: tx.discountPercentage || 0
      };
      setViewingHistoryBill(bill);
      setIsBillOpen(true); // Re-use the main bill modal
      setShowHistoryModal(false);
  };

  const handleCloseBillModal = () => {
      setIsBillOpen(false);
      setViewingHistoryBill(null); // Reset history view mode
  };

  // --- NEW BILL MANAGEMENT ---
  const handleOpenNewCustomerModal = () => {
      setEntryMode('new');
      setTempCustomerName("");
      setTempCustomerPhone("");
      setTempCustomerNotes("");
      setSelectedCustomerHistory([]);
      setShowCustomerEntry(true);
  };

  const handleEditCurrentCustomer = () => {
      if (viewingHistoryBill) return; // Read only
      setEntryMode('edit');
      setTempCustomerName(customerName);
      setTempCustomerPhone(customerPhone);
      setTempCustomerNotes(customerNotes);
      // Try to find history for current customer if editing
      if (customerName) {
         const matches = searchCustomers(customerName);
         // Exact match check
         const exact = matches.find(c => c.normalizedName === customerName.toLowerCase().trim());
         if (exact && exact.recentServices) {
             setSelectedCustomerHistory(exact.recentServices);
         } else {
             setSelectedCustomerHistory([]);
         }
      } else {
          setSelectedCustomerHistory([]);
      }
      setShowCustomerEntry(true);
  };

  const handleSaveCustomerEntry = () => {
      if (entryMode === 'new') {
          // SMART LOGIC: Check if this new customer is in the Waitlist
          // If so, remove them from waitlist to avoid duplicates
          const matchingWaitlistEntry = Array.isArray(waitlist) ? waitlist.find(w => 
              w.customerName.toLowerCase() === tempCustomerName.toLowerCase().trim() ||
              (tempCustomerPhone && w.customerPhone === tempCustomerPhone)
          ) : undefined;
          
          if (matchingWaitlistEntry) {
              const updatedList = waitlist.filter(w => w.id !== matchingWaitlistEntry.id);
              setWaitlist(updatedList);
          }

          const newId = Date.now().toString();
          const newBill: ActiveBill = {
              id: newId,
              customerName: tempCustomerName,
              customerPhone: tempCustomerPhone,
              customerNotes: tempCustomerNotes,
              items: [],
              discountPercentage: 0
          };
          setActiveBills(prev => Array.isArray(prev) ? [...prev, newBill] : [newBill]);
          setCurrentBillId(newId);
      } else {
          // Edit mode
          updateCurrentBill({
              customerName: tempCustomerName,
              customerPhone: tempCustomerPhone,
              customerNotes: tempCustomerNotes
          });
      }
      setShowCustomerEntry(false);
  };

  const closeBill = (idToClose: string) => {
      // Don't close if it's the last one, just clear it
      if (activeBills.length <= 1) {
          updateCurrentBill({ items: [], customerName: '', customerPhone: '', customerNotes: '', discountPercentage: 0 });
          return;
      }

      const newBills = activeBills.filter(b => b.id !== idToClose);
      setActiveBills(newBills);
      
      // If we closed the currently selected bill, select the last available one
      if (currentBillId === idToClose && newBills.length > 0) {
          setCurrentBillId(newBills[newBills.length - 1].id);
      }
  };


  // Function to extract a numeric price from string (e.g. "from $55" -> 55, "$10" -> 10)
  const parsePrice = (priceStr: string): number => {
    // Remove commas if any, then look for the first number
    const match = priceStr.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
  };

  const handleAddClick = (service: {nameKey: string, price: string, displayName?: string}) => {
      if (!isStaffMode || viewingHistoryBill) return;
      setPendingService(service);
      setEditingIds([]); // Mode: New Item (No IDs being edited)
      setShowStaffModal(true);
  };

  // Remove the LAST added instance of this service (Undo/Minus behavior)
  const handleMinusClick = (nameKey: string) => {
      if (!isStaffMode || viewingHistoryBill) return;
      // Find the index of the last item with this nameKey
      const lastIndex = cartItems.map(item => item.nameKey).lastIndexOf(nameKey);
      
      if (lastIndex !== -1) {
          const newItems = [...cartItems];
          newItems.splice(lastIndex, 1);
          updateCurrentBill({ items: newItems });
          
          if (newItems.length === 0) {
              setIsBillOpen(false);
          }
      }
  };

  // 1. Edit from Main List (Single Item via Chip)
  const handleEditChip = (item: CartItem) => {
      if (!isStaffMode || viewingHistoryBill) return;
      setPendingService({ nameKey: item.nameKey, price: item.price.toString(), displayName: item.displayName }); 
      setEditingIds([item.id]); // Edit specific single item
      setShowStaffModal(true);
  };

  // 2. Edit from Bill (Grouped Items)
  const handleEditItemStaff = (item: GroupedCartItem) => {
      if (!isStaffMode || viewingHistoryBill) return;
      setPendingService({ nameKey: item.nameKey, price: item.price.toString(), displayName: item.displayName });
      setEditingIds(item.originalIds); // Edit ALL items in this group
      setShowStaffModal(true);
  };

  const handleStaffSelect = (staffName: string) => {
      if (!pendingService) return;

      if (editingIds.length > 0) {
          // EDIT MODE: Update all items that match the IDs being edited
          const updatedItems = cartItems.map(item => 
              editingIds.includes(item.id) 
                  ? { ...item, staffName: staffName } 
                  : item
          );
          updateCurrentBill({ items: updatedItems });
      } else {
          // ADD MODE: Add new item
          const newItem: CartItem = {
              id: generateUniqueId(),
              nameKey: pendingService.nameKey,
              price: parsePrice(pendingService.price),
              quantity: 1, 
              staffName: staffName,
              displayName: pendingService.displayName
          };
          updateCurrentBill({ items: [...cartItems, newItem] });
      }

      setShowStaffModal(false);
      setPendingService(null);
      setEditingIds([]);
  };

  // Group items for display in the Bill (aggregate same service + same staff)
  const groupedCartItems = useMemo(() => {
      const groups: Record<string, GroupedCartItem> = {};
      
      if(!Array.isArray(cartItems)) return [];

      cartItems.forEach(item => {
          // Key by ServiceName + StaffName
          const key = `${item.nameKey}-${item.staffName || 'Unassigned'}`;
          
          if (!groups[key]) {
              groups[key] = {
                  ...item, // This copies properties from the first item found
                  quantity: 0,
                  originalIds: []
              };
          }
          groups[key].quantity += item.quantity;
          groups[key].originalIds.push(item.id);
      });

      return Object.values(groups);
  }, [cartItems]);

  const handleRemoveGroup = (originalIds: string[]) => {
      if (!isStaffMode || viewingHistoryBill) return;
      const newItems = cartItems.filter(item => !originalIds.includes(item.id));
      updateCurrentBill({ items: newItems });
      if (newItems.length <= 0) {
          setIsBillOpen(false);
      }
  };

  const toggleCategory = (key: string) => {
    setOpenCategories(prev => ({
        ...prev,
        [key]: !prev[key]
    }));
  };

  const cartTotal = useMemo(() => {
    if(!Array.isArray(cartItems)) return 0;
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  const discountAmount = (cartTotal * discountPercentage) / 100;
  const finalTotal = cartTotal - discountAmount;

  const cartItemCount = useMemo(() => {
      if(!Array.isArray(cartItems)) return 0;
      return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // STAFF LOGIN HANDLER
  const handlePinSubmit = () => {
    if (pinInput === STAFF_PIN) {
        setIsStaffMode(true);
        setShowLoginModal(false);
        setPinInput("");
        setPinError("");
        
        // Auto trigger customer entry if current bill is empty
        if (!customerName) {
            handleEditCurrentCustomer(); // "Edit" the empty current one effectively acts as "fill details"
        }
    } else {
        setPinError("Incorrect PIN");
        setPinInput("");
    }
  };
  
  // --- SEARCH FILTER LOGIC ---
  const filteredPricingData = useMemo(() => {
      if (!searchTerm) return pricingData;
      
      const lowerTerm = searchTerm.toLowerCase();
      
      return pricingData.map(category => {
          // Check if category name matches
          const categoryName = t.serviceCategories[category.categoryKey].toLowerCase();
          const isCategoryMatch = categoryName.includes(lowerTerm);
          
          // Filter services within category
          const filteredServices = category.services.filter(service => {
              // Priority: Display Name (custom) -> Translation -> Key
              const serviceName = service.displayName?.toLowerCase() || t.serviceNames[service.nameKey]?.toLowerCase() || service.nameKey.toLowerCase();
              return serviceName.includes(lowerTerm);
          });
          
          // Return the category if it matches OR if it has matching services
          if (isCategoryMatch || filteredServices.length > 0) {
              return {
                  ...category,
                  services: isCategoryMatch ? category.services : filteredServices
              };
          }
          return null;
      }).filter(Boolean) as ServiceCategory[];
  }, [searchTerm, t, pricingData]);

  // Auto-open categories when searching
  useEffect(() => {
      if (searchTerm) {
          const newOpenState: Record<string, boolean> = {};
          filteredPricingData.forEach(c => {
              newOpenState[c.categoryKey] = true;
          });
          setOpenCategories(newOpenState);
      }
  }, [searchTerm, filteredPricingData]);

  // Auto-open Customer Entry if in Staff Mode and unnamed (Immediate Prompt)
  useEffect(() => {
      if (isStaffMode && !customerName && Array.isArray(activeBills) && activeBills.length === 1 && cartItems.length === 0 && !showCustomerEntry) {
         // Use a small timeout to allow render to settle, mostly for UX smoothness
         const timer = setTimeout(() => {
            // handleEditCurrentCustomer(); // Disabled default auto-popup to avoid annoyance, user can click name or +
            // Re-enable based on user request "hỏi ngay tên"
            if (!showLoginModal) { // Don't pop over login
                 handleEditCurrentCustomer();
            }
         }, 500);
         return () => clearTimeout(timer);
      }
  }, [isStaffMode]);


  // GENERATE DYNAMIC SHARE LINK & QR CODE
  const getQrCodeUrl = () => {
      const minifiedItems = groupedCartItems.map(item => ({
          k: item.nameKey,
          p: item.price,
          q: item.quantity,
          s: item.staffName
      }));

      const data = {
          c: customerName,
          d: discountPercentage,
          i: minifiedItems
      };

      const json = JSON.stringify(data);
      const encoded = btoa(unescape(encodeURIComponent(json)));
      
      const baseUrl = window.location.origin + window.location.pathname;
      const shareUrl = `${baseUrl}?receipt=${encoded}`;

      return `https://quickchart.io/qr?text=${encodeURIComponent(shareUrl)}&size=250&margin=1&ecLevel=L`;
  };

  // REFACTORED DOWNLOAD FUNCTION TO SUPPORT HISTORY REPRINT
  const handleDownloadBill = async (billDataOverride?: ActiveBill) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Determine which data to use: Override (History), Current State, or Fallback
      const targetBill = billDataOverride || (viewingHistoryBill ? viewingHistoryBill : currentBill);
      
      // Calculate derived data for the target bill
      const targetItems = targetBill.items || [];
      
      // Group items logic (replicated for target bill)
      const groups: Record<string, GroupedCartItem> = {};
      targetItems.forEach(item => {
          const key = `${item.nameKey}-${item.staffName || 'Unassigned'}`;
          if (!groups[key]) {
              groups[key] = { ...item, quantity: 0, originalIds: [] };
          }
          groups[key].quantity += item.quantity;
      });
      const items = Object.values(groups);

      const targetTotal = targetItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const targetDiscount = targetBill.discountPercentage || 0;
      const targetDiscountAmount = (targetTotal * targetDiscount) / 100;
      const targetFinalTotal = targetTotal - targetDiscountAmount;
      const now = new Date();
      
      const width = 1240; 
      const height = 1754; 
      const padding = 80;

      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // --- HEADER SECTION ---
      ctx.textAlign = 'right';
      ctx.fillStyle = '#555555';
      ctx.font = '22px "Poppins", sans-serif';
      const dateY = padding + 50;
      
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      ctx.fillText(`Date: ${dateStr} ${timeStr}`, width - padding, dateY);

      try {
          const qrUrl = getQrCodeUrl();
          const qrImg = new Image();
          qrImg.crossOrigin = "Anonymous";
          
          await new Promise((resolve, reject) => {
              qrImg.onload = resolve;
              qrImg.onerror = reject;
              qrImg.src = qrUrl;
          });

          const qrSize = 120;
          const qrX = width - padding - qrSize;
          const qrY = dateY + 15;

          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          
          ctx.font = '10px "Poppins", sans-serif';
          ctx.fillStyle = '#999999';
          ctx.textAlign = 'center';
          ctx.fillText("Scan to View", qrX + (qrSize/2), qrY + qrSize + 15);

      } catch (e) {
          console.error("Could not load QR code onto receipt", e);
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 70px "Playfair Display", serif';
      ctx.fillText("LA PERLA", padding, padding + 50);
      
      ctx.font = '28px "Poppins", sans-serif';
      ctx.fillStyle = '#666666';
      ctx.fillText("Nails & Beauty", padding, padding + 90);

      const infoStartY = padding + 150;
      const infoLineHeight = 35;
      ctx.fillStyle = '#333333';
      ctx.font = '24px "Poppins", sans-serif';
      ctx.fillText("Shop 10/260 Jersey Rd,", padding, infoStartY);
      ctx.fillText("Plumpton NSW 2761", padding, infoStartY + infoLineHeight);
      ctx.fillText("Tel: (02) 9625 8194", padding, infoStartY + (infoLineHeight * 2));

      if (targetBill.customerName) {
          ctx.textAlign = 'center';
          ctx.font = 'bold 36px "Poppins", sans-serif';
          ctx.fillStyle = '#333333';
          ctx.fillText(targetBill.customerName.toUpperCase(), width / 2, 335);
      }

      let currentY = 360; 

      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(width - padding, currentY);
      ctx.stroke();

      currentY += 50;

      ctx.font = 'bold 24px "Poppins", sans-serif';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';
      ctx.fillText("DESCRIPTION", padding, currentY);
      ctx.textAlign = 'right';
      ctx.fillText("AMOUNT", width - padding, currentY);
      
      currentY += 30;

      ctx.font = '24px "Poppins", sans-serif';
      const rowHeight = 60;
      
      items.forEach((item, index) => {
          if (index % 2 !== 0) {
              ctx.fillStyle = '#f7f7f7';
              ctx.fillRect(padding - 10, currentY, width - (padding * 2) + 20, rowHeight);
          }

          ctx.textAlign = 'left';
          const serviceName = item.displayName || t.serviceNames[item.nameKey] || item.nameKey;
          const staffText = item.staffName ? ` (${item.staffName})` : '';
          const quantityText = item.quantity > 1 ? ` x${item.quantity}` : '';
          
          let displayName = `${serviceName}${staffText}${quantityText}`;
          if (displayName.length > 70) displayName = displayName.substring(0, 67) + '...';

          ctx.fillStyle = '#333333';
          ctx.fillText(displayName, padding, currentY + 40);
          
          ctx.textAlign = 'right';
          const totalItemPrice = (item.price * item.quantity).toFixed(2);
          ctx.fillText(`$${totalItemPrice}`, width - padding, currentY + 40);
          
          currentY += rowHeight;
      });

      currentY += 20;
      
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(width - padding, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      currentY += 60;

      ctx.font = '24px "Poppins", sans-serif';
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'left';
      ctx.fillText("Subtotal", width - 650, currentY); 
      ctx.textAlign = 'right';
      ctx.fillText(`$${targetTotal.toFixed(2)}`, width - padding, currentY);

      if (targetDiscountAmount > 0) {
          currentY += 50;
          ctx.font = 'bold 26px "Poppins", sans-serif';
          ctx.fillStyle = '#DC2626';
          ctx.textAlign = 'left';
          ctx.fillText(`Discount (${targetDiscount}%)`, width - 650, currentY);
          ctx.textAlign = 'right';
          ctx.fillText(`-$${targetDiscountAmount.toFixed(2)}`, width - padding, currentY);
      }

      currentY += 50; 
      
      const totalBoxHeight = 100;
      ctx.fillStyle = '#F8F6F2';
      ctx.fillRect(width - 500, currentY, 500, totalBoxHeight);

      const textY = currentY + (totalBoxHeight / 2) + 12;

      ctx.font = 'bold 40px "Poppins", sans-serif'; 
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';
      ctx.fillText("Total", width - 460, textY);
      
      ctx.textAlign = 'right';
      ctx.fillStyle = '#000000';
      ctx.fillText(`$${targetFinalTotal.toFixed(2)}`, width - padding - 20, textY);

      const footerY = height - 100;
      ctx.font = 'italic 20px "Poppins", sans-serif';
      ctx.fillStyle = '#888888';
      ctx.textAlign = 'center';
      ctx.fillText("Thank you for visiting La Perla!", width / 2, footerY);

      const safeName = (targetBill.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
      const filename = `${safeName}_${timestamp}.png`;

      const imageUrl = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  useEffect(() => {
    if (autoDownloadTrigger) {
        const runDownload = async () => {
             await handleDownloadBill();
             onAutoDownloadComplete();
        };
        runDownload();
    }
  }, [autoDownloadTrigger]);

  const handleCompletePayment = async () => {
    if (!isStaffMode || viewingHistoryBill) return; 
    setIsSaving(true);
    
    const items: TransactionItem[] = cartItems.map(({ id, ...rest }) => rest);

    const transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      total: finalTotal,
      items: items,
      discountPercentage: discountPercentage,
      customerName: customerName,
      customerPhone: customerPhone,
      customerNotes: customerNotes
    };

    saveTransaction(transaction);
    await saveToGoogleSheets(transaction);

    setIsSaving(false);
    
    // Close this bill (remove from tabs)
    closeBill(currentBillId);
    
    // Ensure bill modal is closed
    setIsBillOpen(false);
  };

  // --- CRM / AUTOCOMPLETE LOGIC FOR MODAL ---
  const handleTempNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setTempCustomerName(val);
      
      // Auto-populate on Exact Match (Case-Insensitive)
      const matches = searchCustomers(val);
      const exactMatch = matches.find(c => c.normalizedName === val.toLowerCase().trim());
      
      if (exactMatch) {
          setTempCustomerPhone(exactMatch.phone);
          setTempCustomerNotes(exactMatch.notes);
          if (exactMatch.recentServices && exactMatch.recentServices.length > 0) {
              setSelectedCustomerHistory(exactMatch.recentServices);
          } else {
              setSelectedCustomerHistory([]);
          }
      } else if (val.length >= 2) {
          setCustomerSuggestions(matches);
          setShowSuggestions(matches.length > 0);
          // Only clear if we are definitely typing a new name and not just a substring of existing
          if (!exactMatch) setSelectedCustomerHistory([]);
      } else {
          setShowSuggestions(false);
          setSelectedCustomerHistory([]);
      }
  };

  const handleSelectCustomerSuggestion = (customer: CustomerProfile) => {
      setTempCustomerName(customer.name);
      setTempCustomerPhone(customer.phone);
      setTempCustomerNotes(customer.notes);
      
      // Load History
      if (customer.recentServices && customer.recentServices.length > 0) {
          setSelectedCustomerHistory(customer.recentServices);
      } else {
          setSelectedCustomerHistory([]);
      }

      setShowSuggestions(false);
  };

  // Click outside to close suggestions
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (entryModalRef.current && !entryModalRef.current.contains(event.target as Node)) {
              // Clicked outside modal content? No, this is for suggestions dropdown inside modal
          }
          if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
              setShowSuggestions(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
          document.removeEventListener("mousedown", handleClickOutside);
      };
  }, []);

  // --- WAITLIST LOGIC ---

  const handleAddToWaitlist = () => {
      const newEntry: WaitlistEntry = {
          id: Date.now().toString(),
          customerName: tempCustomerName,
          customerPhone: tempCustomerPhone,
          notes: tempCustomerNotes || tempReturnTime, // Store basic note or return time
          addedTime: new Date().toISOString(),
          estimatedReturnTime: tempReturnTime,
          status: 'waiting'
      };
      const updatedList = Array.isArray(waitlist) ? [...waitlist, newEntry] : [newEntry];
      setWaitlist(updatedList);
      
      // Close the entry modal fully
      setShowWaitlistAddModal(false);
      setShowCustomerEntry(false); 
      
      // Re-open the list modal so user sees the new entry
      setShowWaitlistModal(true);
  };

  const handleRemoveFromWaitlist = (id: string) => {
      const updatedList = Array.isArray(waitlist) ? waitlist.filter(w => w.id !== id) : [];
      setWaitlist(updatedList);
  };

  const handleCheckInFromWaitlist = (entry: WaitlistEntry) => {
      // 1. Create new Active Bill
      const newId = Date.now().toString();
      const newBill: ActiveBill = {
          id: newId,
          customerName: entry.customerName,
          customerPhone: entry.customerPhone,
          customerNotes: entry.notes + (entry.estimatedReturnTime ? ` (Return: ${entry.estimatedReturnTime})` : ''),
          items: [],
          discountPercentage: 0
      };
      setActiveBills(prev => Array.isArray(prev) ? [...prev, newBill] : [newBill]);
      setCurrentBillId(newId);

      // 2. Remove from Waitlist
      handleRemoveFromWaitlist(entry.id);
      
      // 3. Close Modal
      setShowWaitlistModal(false);
  };

  // SEND SMS LOGIC
  const handleSendSMS = (entry: WaitlistEntry, type: 'ready' | 'soon') => {
      if (!entry.customerPhone) return;
      
      // Use ready template for both, or distinct if needed. 
      // User requested specific text which is in smsTemplateReady
      const template = t.smsTemplateReady; 
      const body = template.replace('{name}', entry.customerName);
      
      // Standard SMS URI Scheme
      const smsUrl = `sms:${entry.customerPhone}?body=${encodeURIComponent(body)}`;
      window.location.href = smsUrl;
      
      // Update status to notified
      const updatedList = waitlist.map(w => w.id === entry.id ? { ...w, status: 'notified' as const } : w);
      setWaitlist(updatedList);
  };

  // If activeBills is dangerously empty or malformed, render safe fallback
  if (!activeBills || !Array.isArray(activeBills) || activeBills.length === 0) {
      return (
          <div className="w-full max-w-4xl mx-auto p-4 md:p-6 pb-24 text-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-leaf mx-auto mb-4"></div>
               <p className="text-gray-500">Loading billing data...</p>
               {/* Add a safety button if stuck */}
               <button 
                  onClick={() => setActiveBills([{ id: '1', customerName: '', items: [], discountPercentage: 0 }])}
                  className="mt-4 text-xs text-blue-500 underline"
               >
                   Force Reset Bill
               </button>
          </div>
      );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 pb-24">
      
      {/* --- MULTIPLE CUSTOMER TABS (Only visible in Staff Mode or if multiple bills exist) --- */}
      {(isStaffMode || (Array.isArray(activeBills) && activeBills.length > 1)) && (
          <div className="mb-4">
              <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                      Active Orders ({activeBills.length})
                  </span>
                  <button 
                    onClick={() => setActiveBillsViewMode(prev => prev === 'row' ? 'grid' : 'row')}
                    className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors"
                    title="Toggle View"
                  >
                      {activeBillsViewMode === 'row' ? <GridIcon className="w-5 h-5" /> : <ListBulletIcon className="w-5 h-5" />}
                  </button>
              </div>

              <div className={`
                  ${activeBillsViewMode === 'row' 
                      ? 'flex items-center overflow-x-auto gap-2 pb-2 custom-scrollbar' // Removed no-scrollbar
                      : 'grid grid-cols-2 md:grid-cols-4 gap-3'
                  }
              `}>
                  {Array.isArray(activeBills) && activeBills.map((bill, index) => {
                      if (!bill) return null;
                      const isActive = bill.id === currentBillId;
                      // Calculate item count for this specific bill
                      const itemCount = (bill.items || []).reduce((s, i) => s + i.quantity, 0);
                      const label = bill.customerName || `Customer ${index + 1}`;
                      const isEmpty = !bill.customerName;

                      return (
                          <div key={bill.id} className={`relative group ${activeBillsViewMode === 'grid' ? 'w-full' : ''}`}>
                              <button
                                onClick={() => {
                                    setCurrentBillId(bill.id);
                                    if (isActive && isStaffMode) {
                                        handleEditCurrentCustomer(); // Click active tab to edit info
                                    }
                                }}
                                className={`flex flex-col items-start px-4 py-2 rounded-xl border transition-all w-full ${
                                    activeBillsViewMode === 'row' ? 'min-w-[120px]' : ''
                                } ${
                                    isActive 
                                        ? 'bg-gold-leaf text-white border-gold-leaf shadow-md'
                                        : 'bg-white text-charcoal border-dusty-rose/30 hover:bg-gray-50'
                                }`}
                              >
                                  <div className="flex items-center gap-2 w-full">
                                      {/* Remove truncate from active tab so name shows fully */}
                                      <span className={`font-bold text-left ${isActive && activeBillsViewMode === 'row' ? 'text-base whitespace-nowrap' : 'text-sm truncate flex-1'} ${isEmpty ? 'italic opacity-70' : ''}`}>
                                          {isEmpty ? 'Tap to Name' : label}
                                      </span>
                                      {isStaffMode && isActive && <PencilIcon className="opacity-50 flex-shrink-0 w-4 h-4" />}
                                  </div>
                                  <span className="text-xs opacity-80">{itemCount} items</span>
                              </button>
                              
                              {/* Close Tab Button (Only for Staff) */}
                              {isStaffMode && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); closeBill(bill.id); }}
                                    className={`absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10`}
                                    title="Close Bill"
                                  >
                                      <XMarkIcon className="w-3 h-3" />
                                  </button>
                              )}
                          </div>
                      );
                  })}
                  
                  {/* Add New Customer Button */}
                  {isStaffMode && (
                      <button
                        onClick={handleOpenNewCustomerModal}
                        className={`flex-shrink-0 flex items-center justify-center bg-dusty-rose text-white rounded-full hover:bg-gold-leaf transition-colors shadow-sm ${
                            activeBillsViewMode === 'row' ? 'w-10 h-10 ml-2' : 'w-full h-12 rounded-xl'
                        }`}
                        title="New Customer"
                      >
                          <PlusIcon className="w-6 h-6" />
                      </button>
                  )}
              </div>
          </div>
      )}

      <div className="flex justify-between items-center mb-4 gap-4">
          {/* SEARCH BAR */}
          <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Search service..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-dusty-rose/30 bg-white/80 focus:ring-2 focus:ring-gold-leaf focus:outline-none shadow-sm text-charcoal"
              />
              <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-red-500"
                  >
                      <XMarkIcon className="w-4 h-4" />
                  </button>
              )}
          </div>

          {/* HISTORY BUTTON (Staff Only) */}
          {isStaffMode && (
             <button 
                onClick={handleOpenHistory}
                className="relative p-2 rounded-full transition-colors flex-shrink-0 bg-white border border-dusty-rose/30 text-charcoal hover:text-gold-leaf hover:border-gold-leaf shadow-sm"
                title="Recent Bills"
             >
                 <ReceiptIcon className="w-6 h-6" />
             </button>
          )}

          {/* WAITLIST BUTTON (Staff Only) */}
          {isStaffMode && (
             <button 
                onClick={() => setShowWaitlistModal(true)}
                className="relative p-2 rounded-full transition-colors flex-shrink-0 bg-white border border-dusty-rose/30 text-charcoal hover:text-gold-leaf hover:border-gold-leaf shadow-sm"
                title="Waitlist"
             >
                 <ClockIcon className="w-6 h-6" />
                 {Array.isArray(waitlist) && waitlist.length > 0 && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                         {waitlist.length}
                     </span>
                 )}
             </button>
          )}

          {/* STAFF MODE TOGGLE BUTTON */}
          <button 
            onClick={() => isStaffMode ? setIsStaffMode(false) : setShowLoginModal(true)}
            className={`p-2 rounded-full transition-colors flex-shrink-0 ${isStaffMode ? 'bg-gold-leaf text-white' : 'text-red-500 hover:text-red-600 bg-red-50'}`}
            title={isStaffMode ? "Exit Staff Mode" : "Staff Access"}
          >
              <LockIcon className="w-6 h-6" />
          </button>
      </div>
      
      <div className="space-y-4">
        {filteredPricingData.length === 0 ? (
            <div className="text-center py-10 opacity-60">
                <p className="text-xl">No services found for "{searchTerm}"</p>
                <button 
                    onClick={() => setSearchTerm("")}
                    className="mt-2 text-gold-leaf hover:underline font-bold"
                >
                    Clear Search
                </button>
            </div>
        ) : (
        filteredPricingData.map((category) => {
          const isOpen = openCategories[category.categoryKey];
          // Count items in this category currently in cart (of the ACTIVE bill)
          const itemsInCategory = Array.isArray(cartItems) ? cartItems.filter(item => 
              category.services.some(s => s.nameKey === item.nameKey)
          ).length : 0;
          
          // Use dynamic category name if stored, otherwise translation
          const categoryName = t.serviceCategories[category.categoryKey] || category.categoryKey;
          const Icon = category.icon || SparklesIcon;

          return (
            <div key={category.categoryKey} className="bg-pearl-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gold-leaf/20 overflow-hidden">
              {/* Accordion Header */}
              <button 
                onClick={() => toggleCategory(category.categoryKey)}
                className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-white/50 transition-colors outline-none"
              >
                <div className="flex items-center">
                  <Icon className="w-8 h-8 text-gold-leaf mr-4" />
                  <h3 className="text-xl md:text-2xl font-serif text-charcoal text-left">
                      {categoryName}
                      {itemsInCategory > 0 && !isOpen && (
                          <span className="ml-3 text-sm bg-gold-leaf text-white px-2 py-0.5 rounded-full font-sans align-middle">
                              {itemsInCategory}
                          </span>
                      )}
                  </h3>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-charcoal/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Accordion Content */}
              {isOpen && (
                  <div className="px-4 pb-4 md:px-6 md:pb-6 animate-fade-in border-t border-dusty-rose/20 pt-2">
                    <ul className="divide-y divide-dusty-rose/50">
                        {category.services.map((service, index) => {
                        const countInCart = Array.isArray(cartItems) ? cartItems.filter(i => i.nameKey === service.nameKey).length : 0;
                        
                        // Active items specifically for this service row to display chips
                        const activeItemsForService = Array.isArray(cartItems) ? cartItems.filter(i => i.nameKey === service.nameKey) : [];

                        // Use custom displayName if available, fallback to translation, fallback to key
                        const displayServiceName = service.displayName || t.serviceNames[service.nameKey] || service.nameKey;

                        return (
                            <li key={service.nameKey} className="py-3 font-sans">
                                <div className="flex justify-between items-center">
                                    <div className="flex-grow pr-4">
                                        <span className="text-charcoal/90 block md:inline">{index + 1}. {displayServiceName}</span>
                                        <span className="font-medium text-gold-leaf text-sm md:text-base block md:float-right md:ml-4">{service.price}</span>
                                    </div>
                                    
                                    {/* CONTROLS: Only show Add/Minus buttons if in STAFF MODE */}
                                    {isStaffMode && !viewingHistoryBill && (
                                        <div className="flex items-center gap-2">
                                            {countInCart > 0 && (
                                                <>
                                                    <button 
                                                        onClick={() => handleMinusClick(service.nameKey)}
                                                        className="w-8 h-8 flex items-center justify-center bg-gray-200 text-charcoal rounded-full hover:bg-gray-300 transition-colors shadow-sm"
                                                    >
                                                        <MinusIcon className="w-4 h-4" />
                                                    </button>
                                                    <span className="font-bold text-charcoal w-6 text-center">
                                                        {countInCart}
                                                    </span>
                                                </>
                                            )}
                                            <button 
                                                onClick={() => handleAddClick(service)}
                                                className="w-8 h-8 flex items-center justify-center bg-gold-leaf text-white rounded-full hover:bg-gold-leaf/80 transition-colors shadow-sm"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Active Selection Chips (Mini Detail View) */}
                                {activeItemsForService.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {activeItemsForService.map(item => (
                                            <div 
                                                key={item.id} 
                                                className="inline-flex items-center gap-1 bg-blush-pink/50 border border-dusty-rose/50 rounded-full px-3 py-1 text-sm text-charcoal animate-fade-in"
                                            >
                                                {/* Edit Chip: Only active in Staff Mode */}
                                                <button 
                                                    onClick={() => handleEditChip(item)}
                                                    disabled={!isStaffMode || !!viewingHistoryBill}
                                                    className={`font-semibold flex items-center gap-1 ${isStaffMode && !viewingHistoryBill ? 'hover:text-gold-leaf hover:underline cursor-pointer' : 'cursor-default'}`}
                                                >
                                                    {item.staffName || 'No Staff'} 
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                        })}
                    </ul>
                  </div>
              )}
            </div>
          );
        })
        )}
      </div>

      {/* Floating Bottom Bar - Show if items exist (Staff created or QR loaded) */}
      {cartItemCount > 0 && (
          <div className="fixed bottom-0 left-0 w-full p-4 z-40 animate-slide-up">
              <div className="max-w-3xl mx-auto bg-charcoal text-pearl-white rounded-full shadow-2xl p-3 flex justify-between items-center border border-gold-leaf/30 backdrop-blur-md bg-opacity-95">
                  <div className="flex flex-col px-4">
                      <span className="text-xs text-gold-leaf font-medium uppercase tracking-wider">{customerName || 'Guest'} - {t.total}</span>
                      <span className="text-xl font-bold">${finalTotal.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => setIsBillOpen(true)}
                    className="bg-gold-leaf text-white font-sans font-bold py-2 px-6 rounded-full shadow-lg hover:bg-white hover:text-gold-leaf transition-all flex items-center gap-2"
                  >
                      <ReceiptIcon className="w-5 h-5" />
                      {t.viewBill} ({cartItemCount})
                  </button>
              </div>
          </div>
      )}

      {/* Bill Modal */}
      {isBillOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 50 }}>
              <div className="bg-pearl-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  
                  {/* Receipt Header */}
                  <div className={`p-6 text-center border-b border-dusty-rose/30 relative ${viewingHistoryBill ? 'bg-gray-200' : 'bg-blush-pink'}`}>
                      {viewingHistoryBill && (
                          <div className="absolute top-0 left-0 right-0 bg-charcoal text-white text-[10px] uppercase font-bold py-1 tracking-widest">
                              Historical Receipt (Read Only)
                          </div>
                      )}
                      <button 
                        onClick={handleCloseBillModal}
                        className="absolute top-4 right-4 text-charcoal/60 hover:text-charcoal transition-colors"
                      >
                          <XMarkIcon className="w-6 h-6" />
                      </button>
                      <div className="w-40 mx-auto mb-2 text-charcoal">
                        <LaPerlaLogo className="w-full h-auto" />
                      </div>
                      <h3 className="text-xl font-serif text-charcoal font-bold uppercase tracking-widest">
                          {customerName ? `${customerName}'s Bill` : t.billTitle}
                      </h3>
                      <p className="text-sm text-charcoal/60 font-sans mt-2">{t.billDate}: {viewingHistoryBill ? new Date().toLocaleDateString() : new Date().toLocaleDateString()}</p>
                      
                      {/* Short Customer Info */}
                      {customerName && (
                          <div className="mt-2 text-sm text-charcoal/80 flex flex-col items-center">
                              <span className="font-bold">{customerName}</span>
                              {customerPhone && <span>{customerPhone}</span>}
                              {isStaffMode && !viewingHistoryBill && (
                                <button onClick={() => { setIsBillOpen(false); handleEditCurrentCustomer(); }} className="text-xs text-gold-leaf hover:underline mt-1">
                                    Edit Details
                                </button>
                              )}
                          </div>
                      )}
                  </div>

                  {/* Receipt Items */}
                  <div className="p-6 overflow-y-auto font-mono text-sm text-charcoal flex-grow bg-white">
                      <div className="border-b-2 border-dashed border-charcoal/20 pb-2 mb-4 flex font-bold text-xs uppercase tracking-wider">
                          <span className="flex-grow">{t.item}</span>
                          <span className="w-12 text-center">{t.qty}</span>
                          <span className="w-20 text-right">{t.price}</span>
                          {isStaffMode && !viewingHistoryBill && <span className="w-8"></span>}
                      </div>
                      
                      <ul className="space-y-3">
                          {groupedCartItems.map(item => (
                                  <li key={`${item.nameKey}-${item.staffName}`} className="flex items-start group">
                                      {/* Only allow edit click if Staff Mode */}
                                      <div 
                                        className={`flex-grow pr-2 ${isStaffMode && !viewingHistoryBill ? 'cursor-pointer' : 'cursor-default'}`} 
                                        onClick={() => isStaffMode && !viewingHistoryBill && handleEditItemStaff(item)}
                                      >
                                          <p className={`font-semibold ${isStaffMode && !viewingHistoryBill ? 'group-hover:text-gold-leaf' : ''} transition-colors`}>{item.displayName || t.serviceNames[item.nameKey] || item.nameKey}</p>
                                          {item.staffName && (
                                              <p className="text-xs text-charcoal/60 italic flex items-center gap-1">
                                                  Stylist: {item.staffName} 
                                                  {isStaffMode && !viewingHistoryBill && <span className="opacity-0 group-hover:opacity-100 text-gold-leaf text-[10px] bg-gold-leaf/10 px-1 rounded">EDIT</span>}
                                              </p>
                                          )}
                                      </div>
                                      <div className="w-12 text-center pt-1 font-bold">x{item.quantity}</div>
                                      <div className="w-20 text-right font-bold pt-1">${(item.price * item.quantity).toFixed(2)}</div>
                                      
                                      {/* Only show Remove button if Staff Mode */}
                                      {isStaffMode && !viewingHistoryBill && (
                                          <button 
                                            onClick={() => handleRemoveGroup(item.originalIds)}
                                            className="w-8 flex justify-end text-gray-400 hover:text-red-500 pt-1"
                                          >
                                              <XMarkIcon className="w-4 h-4" />
                                          </button>
                                      )}
                                  </li>
                              )
                          )}
                      </ul>

                      <div className="mt-6 pt-4 border-t border-gray-100">
                          <div className="flex justify-between items-center mb-2 text-charcoal/80">
                              <span>{t.subtotal}</span>
                              <span>${cartTotal.toFixed(2)}</span>
                          </div>
                          
                          {/* Discount: Editable in Staff Mode, Static in View Mode */}
                          <div className="flex justify-between items-center mb-4 text-charcoal/80">
                              <span className="flex items-center gap-2">
                                  {t.discountLabel}
                                  {isStaffMode && !viewingHistoryBill ? (
                                      <select 
                                          value={discountPercentage}
                                          onChange={(e) => updateCurrentBill({ discountPercentage: Number(e.target.value) })}
                                          className="ml-2 p-1 rounded border border-dusty-rose text-sm bg-white outline-none focus:border-gold-leaf"
                                      >
                                          <option value={0}>0%</option>
                                          <option value={5}>5%</option>
                                          <option value={10}>10%</option>
                                          <option value={15}>15%</option>
                                          <option value={20}>20%</option>
                                          <option value={25}>25%</option>
                                          <option value={30}>30%</option>
                                      </select>
                                  ) : (
                                     discountPercentage > 0 && <span className="ml-2 font-bold">({discountPercentage}%)</span>
                                  )}
                              </span>
                              <span className="text-red-500 font-bold">-${discountAmount.toFixed(2)}</span>
                          </div>
                          
                          <div className="border-t-2 border-dashed border-charcoal/20 pt-4">
                              <div className="flex justify-between items-center text-xl font-bold">
                                  <span>{t.total}</span>
                                  <span className="text-2xl">${finalTotal.toFixed(2)}</span>
                              </div>
                          </div>

                          {/* QR CODE SECTION */}
                          {!viewingHistoryBill && (
                              <div className="mt-6 flex flex-col items-center border-t border-gray-100 pt-4">
                                  <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-2">Scan to Download</p>
                                  <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                      <img 
                                          src={getQrCodeUrl()} 
                                          alt="Scan for Receipt" 
                                          className="w-32 h-32 object-contain"
                                          loading="lazy"
                                      />
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Receipt Footer */}
                  <div className="bg-pearl-white p-6 border-t border-dusty-rose/30 text-center">
                      {!viewingHistoryBill && <p className="text-sm text-gold-leaf font-bold mb-4">{t.showToCashier}</p>}
                      
                      <div className="grid grid-cols-1 gap-3">
                          <button 
                            onClick={() => handleDownloadBill()}
                            className="w-full py-3 rounded-xl border border-charcoal/20 text-charcoal font-medium hover:bg-charcoal hover:text-white transition-colors flex items-center justify-center gap-2"
                          >
                              <DownloadIcon className="w-5 h-5" />
                              {viewingHistoryBill ? 'Reprint / Download' : t.downloadBill}
                          </button>
                          
                          {/* COMPLETE PAYMENT: Only Show in Staff Mode */}
                          {isStaffMode && !viewingHistoryBill && (
                              <button 
                                onClick={handleCompletePayment}
                                disabled={isSaving}
                                className="w-full py-3 rounded-xl bg-gold-leaf text-white font-bold shadow-md hover:bg-charcoal transition-all disabled:opacity-50 disabled:cursor-wait"
                              >
                                  {isSaving ? "Saving..." : t.completePayment}
                              </button>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- HISTORY LIST MODAL --- */}
      {showHistoryModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 100 }}>
            <div className="bg-pearl-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                 <div className="bg-blush-pink p-4 flex justify-between items-center border-b border-dusty-rose/30">
                     <h3 className="text-xl font-serif font-bold text-charcoal flex items-center gap-2">
                        <ReceiptIcon className="w-6 h-6 text-gold-leaf" />
                        Recent Bills
                     </h3>
                     <button onClick={() => setShowHistoryModal(false)} className="text-charcoal/60 hover:text-charcoal">
                         <XMarkIcon className="w-6 h-6" />
                     </button>
                 </div>
                 
                 <div className="p-4 overflow-y-auto flex-grow bg-white custom-scrollbar">
                     {recentTransactions.length === 0 ? (
                         <div className="text-center py-10 opacity-50">
                             <ReceiptIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                             <p>No recent history found.</p>
                         </div>
                     ) : (
                         <ul className="space-y-3">
                             {recentTransactions.map((tx) => (
                                 <li 
                                    key={tx.id} 
                                    onClick={() => handleViewHistoryItem(tx)}
                                    className="bg-white border border-gray-100 hover:border-gold-leaf hover:bg-gray-50 rounded-xl p-3 shadow-sm transition-all cursor-pointer group"
                                 >
                                     <div className="flex justify-between items-start">
                                         <div>
                                             <span className="font-bold text-charcoal flex items-center gap-2">
                                                 {tx.customerName || 'Guest'}
                                             </span>
                                             <div className="text-xs text-gray-400 font-mono mt-1">
                                                {formatTimeAgo(tx.date)}
                                             </div>
                                             <div className="text-xs text-gray-500 mt-1">
                                                 {tx.items.length} items
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <span className="block font-bold text-green-600 text-lg">${tx.total.toFixed(2)}</span>
                                             <span className="text-xs text-gold-leaf opacity-0 group-hover:opacity-100 transition-opacity font-bold">REPRINT</span>
                                         </div>
                                     </div>
                                 </li>
                             ))}
                         </ul>
                     )}
                 </div>
            </div>
        </div>
      )}

      {/* --- CUSTOMER ENTRY MODAL --- */}
      {showCustomerEntry && isStaffMode && (
         <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" style={{ zIndex: 110 }}>
              <div className="bg-pearl-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[90vh] relative" ref={entryModalRef}>
                  {/* Close button positioned absolutely relative to the modal container */}
                  <button onClick={() => setShowCustomerEntry(false)} className="absolute top-4 right-4 text-charcoal/50 hover:text-charcoal z-20">
                      <XMarkIcon className="w-6 h-6" />
                  </button>

                  <div className="p-6 overflow-y-auto custom-scrollbar">
                      
                      <div className="text-center mb-6 mt-2">
                          <div className="mx-auto w-12 h-12 bg-blush-pink rounded-full flex items-center justify-center mb-3">
                              <UserIcon className="w-6 h-6 text-gold-leaf" />
                          </div>
                          <h3 className="text-xl font-serif font-bold text-charcoal">
                              {entryMode === 'new' ? 'New Customer' : 'Customer Info'}
                          </h3>
                          <p className="text-sm text-charcoal/60">Enter details to start the order</p>
                      </div>

                      <div className="space-y-4">
                            {/* NAME + AUTOCOMPLETE */}
                            <div className="relative">
                                <label className="block text-xs font-bold text-charcoal/70 mb-1 uppercase">Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Search or Enter Name" 
                                    value={tempCustomerName}
                                    onChange={handleTempNameChange}
                                    // Forced charcoal text color
                                    className="w-full p-3 border border-dusty-rose/50 rounded-xl bg-white text-charcoal focus:ring-2 focus:ring-gold-leaf outline-none font-bold text-lg placeholder:text-gray-400"
                                    autoFocus
                                />
                                {showSuggestions && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gold-leaf/20 z-50 max-h-40 overflow-y-auto text-left" ref={suggestionsRef}>
                                        {customerSuggestions.map(cust => (
                                            <button
                                                key={cust.id}
                                                onClick={() => handleSelectCustomerSuggestion(cust)}
                                                className="w-full px-4 py-3 text-sm text-charcoal hover:bg-gold-leaf/10 border-b border-gray-100 last:border-0 flex justify-between items-center group"
                                            >
                                                <span className="font-bold group-hover:text-gold-leaf">{cust.name}</span>
                                                <span className="text-xs text-gray-500">{cust.phone}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* PHONE */}
                            <div>
                                 <label className="block text-xs font-bold text-charcoal/70 mb-1 uppercase">Phone Number</label>
                                 <div className="relative">
                                    <PhoneIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input 
                                        type="tel" 
                                        placeholder="04xx xxx xxx" 
                                        value={tempCustomerPhone}
                                        onChange={(e) => setTempCustomerPhone(e.target.value)}
                                        // Forced charcoal text color
                                        className="w-full pl-10 pr-3 py-3 border border-dusty-rose/50 rounded-xl bg-white text-charcoal focus:ring-2 focus:ring-gold-leaf outline-none placeholder:text-gray-400"
                                    />
                                 </div>
                            </div>

                            {/* NOTES */}
                            <div>
                                 <label className="block text-xs font-bold text-charcoal/70 mb-1 uppercase">Notes</label>
                                 <div className="relative">
                                    <BriefcaseIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Preferences, allergies..." 
                                        value={tempCustomerNotes}
                                        onChange={(e) => setTempCustomerNotes(e.target.value)}
                                        // Forced charcoal text color
                                        className="w-full pl-10 pr-3 py-3 border border-dusty-rose/50 rounded-xl bg-white text-charcoal focus:ring-2 focus:ring-gold-leaf outline-none placeholder:text-gray-400"
                                    />
                                 </div>
                            </div>
                            
                            {/* WAITLIST SPECIAL INPUT (IF ADDING VIA WAITLIST BUTTON) */}
                            {showWaitlistAddModal && (
                                 <div>
                                     <label className="block text-xs font-bold text-charcoal/70 mb-1 uppercase text-gold-leaf">Return Time</label>
                                     <div className="relative">
                                        <ClockIcon className="absolute left-3 top-3.5 w-5 h-5 text-gold-leaf" />
                                        <input 
                                            type="text" 
                                            placeholder="e.g., 30 mins, 2:00 PM" 
                                            value={tempReturnTime}
                                            onChange={(e) => setTempReturnTime(e.target.value)}
                                            // Forced charcoal text color
                                            className="w-full pl-10 pr-3 py-3 border-2 border-gold-leaf/50 rounded-xl bg-white text-charcoal focus:ring-2 focus:ring-gold-leaf outline-none placeholder:text-gray-400"
                                        />
                                     </div>
                                 </div>
                            )}

                            {/* RECENT SERVICES HISTORY (NEW TABLE FORMAT) */}
                            {selectedCustomerHistory.length > 0 && (
                                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                    <label className="flex items-center text-xs font-bold text-charcoal/70 mb-2 uppercase gap-1">
                                        <ClockIcon className="w-3 h-3" /> Recent Services
                                    </label>
                                    <div className="max-h-32 overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="text-[10px] text-gray-500 uppercase tracking-wide bg-gray-100 sticky top-0">
                                                <tr>
                                                    <th className="p-2 font-semibold">Date</th>
                                                    <th className="p-2 font-semibold">Service</th>
                                                    <th className="p-2 font-semibold text-right">Price</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs text-charcoal">
                                                {selectedCustomerHistory.map((item, idx) => (
                                                    <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                                                        <td className="p-2 whitespace-nowrap text-gray-500">
                                                            {new Date(item.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                                        </td>
                                                        <td className="p-2 font-medium">
                                                            {t.serviceNames[item.nameKey] || item.nameKey}
                                                        </td>
                                                        <td className="p-2 text-right">
                                                            ${item.price}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                      </div>

                      <div className="mt-6">
                          <button 
                            onClick={showWaitlistAddModal ? handleAddToWaitlist : handleSaveCustomerEntry}
                            className="w-full py-3 bg-gold-leaf text-white font-bold rounded-xl shadow-md hover:bg-charcoal transition-all transform active:scale-95"
                          >
                              {showWaitlistAddModal ? 'Add to Waitlist' : (entryMode === 'new' ? 'Start Order' : 'Update Info')}
                          </button>
                      </div>
                  </div>
              </div>
         </div>
      )}

      {/* --- WAITLIST LIST MODAL --- */}
      {showWaitlistModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 100 }}>
            <div className="bg-pearl-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                 <div className="bg-blush-pink p-4 flex justify-between items-center border-b border-dusty-rose/30">
                     <h3 className="text-xl font-serif font-bold text-charcoal flex items-center gap-2">
                        <ClockIcon className="w-6 h-6 text-gold-leaf" />
                        Waitlist ({Array.isArray(waitlist) ? waitlist.length : 0})
                     </h3>
                     <button onClick={() => setShowWaitlistModal(false)} className="text-charcoal/60 hover:text-charcoal">
                         <XMarkIcon className="w-6 h-6" />
                     </button>
                 </div>
                 
                 <div className="p-4 overflow-y-auto flex-grow bg-white">
                     {!Array.isArray(waitlist) || waitlist.length === 0 ? (
                         <div className="text-center py-10 opacity-50">
                             <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                             <p>No customers waiting.</p>
                         </div>
                     ) : (
                         <ul className="space-y-3">
                             {waitlist.map((entry, idx) => (
                                 <li key={entry.id} className={`bg-white border rounded-xl p-3 shadow-sm transition-colors ${entry.status === 'notified' ? 'border-green-200 bg-green-50' : 'border-gray-100 hover:border-gold-leaf/30'}`}>
                                     <div className="flex justify-between items-start mb-2">
                                         <div>
                                             <span className="font-bold text-lg text-charcoal flex items-center gap-2">
                                                 {entry.customerName}
                                                 {entry.status === 'notified' && <span className="text-[10px] bg-green-500 text-white px-2 rounded-full">NOTIFIED</span>}
                                             </span>
                                             <div className="flex gap-2 mt-1">
                                                <span className="text-xs text-gray-400 font-mono">
                                                    {formatTimeAgo(entry.addedTime)}
                                                </span>
                                                {entry.estimatedReturnTime && (
                                                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-bold">
                                                        Return: {entry.estimatedReturnTime}
                                                    </span>
                                                )}
                                             </div>
                                         </div>
                                         <button onClick={() => handleRemoveFromWaitlist(entry.id)} className="text-gray-400 hover:text-red-500">
                                             <XMarkIcon className="w-4 h-4" />
                                         </button>
                                     </div>
                                     
                                     <div className="flex items-center justify-between mt-3 gap-2">
                                         {/* SMS BUTTON - CONSOLIDATED */}
                                         <button 
                                            onClick={() => handleSendSMS(entry, 'ready')}
                                            className="px-4 py-2 bg-gold-leaf/10 text-gold-leaf border border-gold-leaf/30 rounded-lg hover:bg-gold-leaf hover:text-white transition-colors flex items-center gap-2 group"
                                            title="Send SMS to call back"
                                         >
                                             <ChatIcon className="w-4 h-4 group-hover:animate-pulse" />
                                             <span className="font-bold text-xs">SMS Customer</span>
                                         </button>

                                         <button 
                                            onClick={() => handleCheckInFromWaitlist(entry)}
                                            className="flex-1 py-2 bg-green-100 text-green-800 border border-green-200 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-green-200 transition-colors text-sm"
                                         >
                                             Start <ArrowRightIcon className="w-4 h-4" />
                                         </button>
                                     </div>
                                 </li>
                             ))}
                         </ul>
                     )}
                 </div>

                 <div className="p-4 bg-gray-50 border-t border-gray-200">
                     <button 
                        onClick={() => {
                            setEntryMode('new');
                            setTempCustomerName("");
                            setTempCustomerPhone("");
                            setTempCustomerNotes("");
                            setTempReturnTime("");
                            setShowWaitlistAddModal(true);
                            setShowCustomerEntry(true);
                            setShowWaitlistModal(false); // Close list to show add modal
                        }}
                        className="w-full py-3 bg-charcoal text-white font-bold rounded-xl shadow hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                     >
                         <PlusIcon className="w-5 h-5" />
                         Add Customer to Waitlist
                     </button>
                 </div>
            </div>
        </div>
      )}

      {/* Staff Selection Modal - Only accessible in Staff Mode anyway */}
      {showStaffModal && pendingService && isStaffMode && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 100 }}>
            <div className="bg-pearl-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                 <div className="bg-blush-pink p-4 text-center border-b border-dusty-rose/30 relative">
                     <button onClick={() => setShowStaffModal(false)} className="absolute top-4 right-4 text-charcoal/60">
                         <XMarkIcon className="w-6 h-6" />
                     </button>
                     <h3 className="text-lg font-serif font-bold text-charcoal">
                         {editingIds.length > 0 ? "Change Stylist" : "Select Stylist"}
                     </h3>
                     <p className="text-sm text-charcoal/70">{pendingService.displayName || t.serviceNames[pendingService.nameKey]}</p>
                 </div>
                 <div className="p-4 overflow-y-auto grid grid-cols-2 gap-3">
                     {staffList.map(staff => (
                         <button
                            key={staff}
                            onClick={() => handleStaffSelect(staff)}
                            className="bg-white border border-dusty-rose/30 py-3 px-2 rounded-xl text-charcoal font-medium hover:bg-gold-leaf hover:text-white transition-colors shadow-sm active:scale-95"
                         >
                             {staff}
                         </button>
                     ))}
                 </div>
            </div>
        </div>
      )}

      {/* STAFF PIN MODAL */}
      {showLoginModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 100 }}>
              <div className="bg-pearl-white w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden p-6 text-center">
                  <h3 className="text-xl font-serif font-bold text-charcoal mb-4">Staff Access</h3>
                  <input 
                      type="password" 
                      placeholder="Enter PIN" 
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      // Forced charcoal text color
                      className="w-full p-3 text-center text-xl tracking-widest border border-dusty-rose/50 rounded-xl mb-4 focus:ring-2 focus:ring-gold-leaf outline-none bg-white text-charcoal placeholder:text-gray-400"
                      autoFocus
                  />
                  {pinError && <p className="text-red-500 text-sm mb-4">{pinError}</p>}
                  <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => { setShowLoginModal(false); setPinInput(""); setPinError(""); }}
                        className="py-2 bg-gray-200 rounded-lg text-charcoal font-medium hover:bg-gray-300"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handlePinSubmit}
                        className="py-2 bg-gold-leaf text-white rounded-lg font-bold hover:bg-charcoal transition-colors"
                      >
                          Unlock
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};