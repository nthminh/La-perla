
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    StaffProfile, 
    Transaction, 
    ActiveBill, 
    CustomerProfile, 
    CartItem, 
    ServiceCategory, 
    WaitlistEntry, 
    TransactionItem,
    GlobalPayrollSettings,
    BookingRequest
} from '../types';
import { Translation } from '../translations';
import { 
    GridIcon, 
    ListBulletIcon, 
    PencilIcon, 
    XMarkIcon, 
    PlusIcon, 
    SearchIcon, 
    ReceiptIcon, 
    ClockIcon, 
    SparklesIcon, 
    ChevronDownIcon, 
    MinusIcon, 
    LaPerlaLogo, 
    UserIcon, 
    DownloadIcon, 
    PhoneIcon, 
    BriefcaseIcon, 
    ChatIcon, 
    ArrowRightIcon, 
    StarIcon, 
    InfoIcon, 
    TrashIcon, 
    WalletIcon, 
    UsersIcon,
    LockIcon,
    PrinterIcon,
    CalculatorIcon,
    CalendarIcon
} from './Icons';
import { ArtistProfileModal } from './ArtistProfileModal';
import { 
    saveTransactionToFirebase, 
    fetchTransactionsOnce, 
    upsertActiveBill, 
    deleteActiveBill, 
    deleteWaitlistEntry, 
    upsertWaitlistEntry, 
    getNextTicketNumber,
    checkActiveBillExists 
} from '../services/firebaseService';
import { saveTransaction, searchCustomers, getTransactions } from '../services/storageService';
import { SoundManager } from '../utils/sound';
import { SHOP_LOCATION } from '../constants';
import { openCashDrawer } from '../utils/cashDrawer';

export interface PricingViewProps {
  t: Translation;
  activeBills: ActiveBill[];
  setActiveBills: React.Dispatch<React.SetStateAction<ActiveBill[]>>;
  currentBillId: string;
  setCurrentBillId: React.Dispatch<React.SetStateAction<string>>;
  isBillOpen: boolean;
  setIsBillOpen: (isOpen: boolean) => void;
  openCategories: Record<string, boolean>;
  setOpenCategories: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  autoDownloadTrigger: boolean;
  onAutoDownloadComplete: () => void;
  currentUser: StaffProfile | null;
  onLogin: (user: StaffProfile) => void;
  onLogout: () => void;
  waitlist: WaitlistEntry[];
  setWaitlist: (list: WaitlistEntry[]) => void;
  staffList: StaffProfile[];
  pricingData: ServiceCategory[];
  activeStaffIds: string[];
  onStaffReview?: (staffId: string, review: any) => void;
  isReceiptMode?: boolean;
  globalPayroll?: GlobalPayrollSettings;
  pastTransactions?: Transaction[];
  bookings?: BookingRequest[];
  onUpdateBookingStatus?: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => void;
  onDeleteBooking?: (id: string) => void;
}

interface GroupedCartItem extends CartItem {
    originalIds: string[];
}

const generateUniqueId = () => Math.random().toString(36).substr(2, 9);

const formatTimeAgo = (dateString: string) => {
    const diff = (new Date().getTime() - new Date(dateString).getTime()) / 1000 / 60; // minutes
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return Math.floor(hours / 24) + 'd ago';
};

// Force Sydney Timezone Display
const formatDateSydney = (dateString: string) => {
    try {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: date.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour: '2-digit', minute: '2-digit', hour12: false }) 
        };
    } catch (e) {
        return { date: '', time: '' };
    }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres
    return d;
}

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
  currentUser,
  onLogin,
  onLogout,
  waitlist = [],
  setWaitlist,
  staffList,
  pricingData,
  activeStaffIds = [],
  onStaffReview,
  isReceiptMode = false,
  globalPayroll,
  pastTransactions = [],
  bookings = [],
  onUpdateBookingStatus,
  onDeleteBooking
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'mine' | 'all'>('mine');
  
  const [negotiatedPrices, setNegotiatedPrices] = useState<Record<string, string>>({});
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [pendingService, setPendingService] = useState<{nameKey: string, price: string, displayName?: string} | null>(null);
  
  const [cashTendered, setCashTendered] = useState<string>('');
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Memoize pending bookings count for performance
  const pendingBookingsCount = useMemo(() => {
    return bookings.filter(b => b.status === 'pending').length;
  }, [bookings]);

  const [isSplitMode, setIsSplitMode] = useState(false);
  const [splitStaff1, setSplitStaff1] = useState<StaffProfile | null>(null);
  const [splitStaff2, setSplitStaff2] = useState<StaffProfile | null>(null);
  const [splitAmount1, setSplitAmount1] = useState<string>('');
  const [splitAmount2, setSplitAmount2] = useState<string>('');
  const [activeSplitSlot, setActiveSplitSlot] = useState<1 | 2>(1);

  const [viewingArtist, setViewingArtist] = useState<StaffProfile | null>(null);
  const [showCustomerEntry, setShowCustomerEntry] = useState(false);
  const [entryMode, setEntryMode] = useState<'new' | 'edit'>('new');
  const [tempCustomerName, setTempCustomerName] = useState("");
  const [tempCustomerPhone, setTempCustomerPhone] = useState("");
  const [tempCustomerNotes, setTempCustomerNotes] = useState("");
  const [tempIsVip, setTempIsVip] = useState(false);
  const [tempVipDays, setTempVipDays] = useState<number | null>(null);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [showWaitlistAddModal, setShowWaitlistAddModal] = useState(false);
  const [tempReturnTime, setTempReturnTime] = useState("");
  const [tempSelectedServices, setTempSelectedServices] = useState<string[]>([]);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [viewingHistoryBill, setViewingHistoryBill] = useState<ActiveBill | null>(null);
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerProfile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const entryModalRef = useRef<HTMLDivElement>(null);
  const [editingIds, setEditingIds] = useState<string[]>([]); 
  const receiptRef = useRef<HTMLDivElement>(null);

  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState("");
  
  // Ticket printing state
  const [generatedTicket, setGeneratedTicket] = useState<string>('');
  const ticketRef = useRef<HTMLDivElement>(null);

  const longPressTimer = useRef<any>(null);
  const isLongPress = useRef(false);

  const isStaffMode = !!currentUser; 
  const isAdmin = currentUser?.id === 'admin_master';
  const isManager = currentUser?.id === 'shop_manager';

  useEffect(() => {
      if (showStaffModal && pendingService) {
          setIsSplitMode(false);
          setSplitStaff1(null);
          setSplitStaff2(null);
          setSplitAmount1('');
          setSplitAmount2('');
          setActiveSplitSlot(1);
          const total = parsePrice(pendingService.price);
          setSplitAmount1((total / 2).toFixed(2));
          setSplitAmount2((total / 2).toFixed(2));
      }
  }, [showStaffModal, pendingService]);

  const handleSplitAmountChange = (val: string, slot: 1 | 2) => {
      if (!pendingService) return;
      const total = parsePrice(pendingService.price);
      const numVal = parseFloat(val);
      if (slot === 1) {
          setSplitAmount1(val);
          if (!isNaN(numVal)) setSplitAmount2((total - numVal).toFixed(2));
      } else {
          setSplitAmount2(val);
          if (!isNaN(numVal)) setSplitAmount1((total - numVal).toFixed(2));
      }
  };

  useEffect(() => {
      if (isStaffMode) {
          if (isAdmin || isManager) setViewMode('all');
          else setViewMode('mine');
      } else {
          setViewMode('all');
      }
  }, [isStaffMode, isAdmin, isManager]);

  const displayedBills = useMemo(() => {
      if (!isStaffMode) return activeBills;
      if (viewMode === 'mine' && currentUser) {
          return activeBills.filter(bill => {
              if (!bill) return false;
              if (bill.id === currentBillId) return true;
              if (bill.createdByStaffId === currentUser.id) return true;
              const items = bill.items || [];
              if (items.some(item => item.staffId === currentUser.id || (item.staffName && item.staffName === currentUser.name))) return true;
              if (bill.customerName && bill.customerName.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
              return false;
          });
      }
      return activeBills;
  }, [activeBills, viewMode, currentUser, isStaffMode, currentBillId]); 

  useEffect(() => {
      if (viewMode === 'mine') {
          if (displayedBills.length === 0) {
              if (currentBillId) setCurrentBillId('');
          } 
          else if (currentBillId && !displayedBills.some(b => b.id === currentBillId)) {
              setCurrentBillId('');
          }
      }
  }, [viewMode, displayedBills, currentBillId, setCurrentBillId]);


  const currentBill = useMemo(() => {
      if (!activeBills || !Array.isArray(activeBills) || activeBills.length === 0) return null;
      if (currentBillId) return activeBills.find(b => b && b.id === currentBillId) || null;
      return null; 
  }, [activeBills, currentBillId]);

  const targetBill = viewingHistoryBill || currentBill;
  const cartItems = targetBill?.items || [];
  const customerName = targetBill?.customerName || '';
  const customerPhone = targetBill?.customerPhone || '';
  const customerNotes = targetBill?.customerNotes || '';
  const discountPercentage = targetBill?.discountPercentage || 0;
  const isVip = targetBill?.isVip || false;
  
  const cartTotal = useMemo(() => {
      return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
      return cartTotal * (discountPercentage / 100);
  }, [cartTotal, discountPercentage]);

  const finalTotal = useMemo(() => {
      return cartTotal - discountAmount;
  }, [cartTotal, discountAmount]);

  const handleAddCash = (amount: number) => {
      SoundManager.playTap();
      const current = parseFloat(cashTendered) || 0;
      const next = (Math.round(current * 100) + Math.round(amount * 100)) / 100;
      setCashTendered(next.toFixed(2));
  };

  const changeDue = useMemo(() => {
      const tendered = parseFloat(cashTendered) || 0;
      return tendered - finalTotal;
  }, [cashTendered, finalTotal]);

  const cartItemCount = useMemo(() => {
      return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const showFloatingBar = cartItemCount > 0 && !isBillOpen && isStaffMode;

  const filteredPricingData = useMemo(() => {
      if (!searchTerm) return pricingData;
      const lowerTerm = searchTerm.toLowerCase();
      return pricingData.map(category => {
          const filteredServices = category.services.filter(service => {
              const name = service.displayName || t.serviceNames[service.nameKey] || service.nameKey;
              const price = service.price.toLowerCase();
              return name.toLowerCase().includes(lowerTerm) || price.includes(lowerTerm);
          });
          if (filteredServices.length > 0) return { ...category, services: filteredServices };
          return null;
      }).filter(Boolean) as ServiceCategory[];
  }, [searchTerm, pricingData, t.serviceNames]);

  const billDisplayDate = useMemo(() => {
      if (targetBill?.date) return new Date(targetBill.date);
      return new Date();
  }, [targetBill?.date]);

  const billDateString = billDisplayDate.toLocaleDateString('en-AU', { 
      timeZone: 'Australia/Sydney', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
  });

  const parsePrice = (priceStr: string): number => {
    const match = priceStr.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[0]) : 0;
  };

  const toggleCategory = (key: string) => {
      SoundManager.playTap();
      setOpenCategories(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNegotiatedPriceChange = (nameKey: string, val: string) => {
      setNegotiatedPrices(prev => ({ ...prev, [nameKey]: val }));
  };

  const getQrCodeUrl = () => {
        const receiptData = JSON.stringify({
            c: customerName,
            d: discountPercentage,
            i: cartItems.map(i => ({ k: i.nameKey, p: i.price, q: i.quantity, s: i.staffName }))
        });
        const encodedData = btoa(unescape(encodeURIComponent(receiptData)));
        const appUrl = `${window.location.origin}${window.location.pathname}?receipt=${encodedData}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(appUrl)}`;
  };

  const handlePrint = async () => {
      SoundManager.playTap();
      
      // Open cash drawer before printing
      const drawerOpened = await openCashDrawer();
      if (drawerOpened) {
          console.log('Cash drawer opened successfully');
          // Wait a bit for the drawer command to be processed before printing invoice
          await new Promise(resolve => setTimeout(resolve, 500));
      } else {
          console.warn('Failed to open cash drawer, continuing with print');
      }
      
      window.print();
  };

  const handleDownloadBill = async () => {
      SoundManager.playTap();
      const safeName = (customerName || 'Guest').replace(/[^a-zA-Z0-9_-]/g, '_');
      const sydneyTime = new Date().toLocaleString('en-AU', { 
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const [dateStr, timeStr] = sydneyTime.split(', ');
      const [d, m, y] = dateStr.split('/');
      const [h, min] = timeStr.split(':');
      
      const fileName = `${safeName}_Receipt_${d}-${m}-${y}_${h}-${min}.png`;

      const element = receiptRef.current;
      if (!element) return;

      element.style.display = 'block';
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '-9999px'; 
      element.style.zIndex = '9999';
      element.style.width = '500px'; 
      element.style.minHeight = 'auto';
      element.style.padding = '40px';
      element.style.backgroundColor = '#ffffff';
      
      const html2canvas = (window as any).html2canvas;
      if (html2canvas) {
          try {
              const canvas = await html2canvas(element, {
                  scale: 3, 
                  backgroundColor: '#ffffff',
                  useCORS: true,
                  logging: false
              });
              const imgData = canvas.toDataURL('image/png');
              const link = document.createElement('a');
              link.href = imgData;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              if (isReceiptMode) setTimeout(() => { try { window.close(); } catch (e) {} }, 1000);
          } catch (error: any) {
              console.error("Image Generation Error:", error);
              alert("Failed to save receipt. Please try Print instead.");
          } finally {
              element.style.display = 'none';
              element.style.position = '';
              element.style.left = '';
          }
      } else {
          alert("Image generation library not loaded. Please refresh.");
      }
  };

  const handleTempNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setTempCustomerName(val);
      if (val.length > 1 && entryMode === 'new') {
          const matches = searchCustomers(val);
          setCustomerSuggestions(matches);
          setShowSuggestions(matches.length > 0);
      } else setShowSuggestions(false);
  };

  const handleSelectCustomerSuggestion = (customer: CustomerProfile) => {
      SoundManager.playTap();
      setTempCustomerName(customer.name);
      setTempCustomerPhone(customer.phone);
      setTempCustomerNotes(customer.notes);
      
      // Update VIP from suggestion
      if (customer.membershipExpiry) {
          const expiry = new Date(customer.membershipExpiry);
          const diff = expiry.getTime() - new Date().getTime();
          const days = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
          if (days > 0) {
              setTempIsVip(true);
              setTempVipDays(days);
          } else {
              setTempIsVip(false);
              setTempVipDays(null);
          }
      } else {
          setTempIsVip(false);
          setTempVipDays(null);
      }
      
      setShowSuggestions(false);
  };

  const handleTempPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setTempCustomerPhone(val);
      const cleanInput = val.replace(/[^0-9]/g, '');
      
      if (cleanInput.length < 8) {
          setTempCustomerName("");
          setTempIsVip(false);
          setTempVipDays(null);
          return;
      }

      // THUẬT TOÁN JOIN WAITLIST: TÌM KIẾM CHÍNH XÁC TỪ pastTransactions
      const customerTransactions = pastTransactions?.filter(tx => {
          const txPhone = tx.customerPhone?.replace(/[^0-9]/g, '') || '';
          return txPhone === cleanInput;
      });

      if (customerTransactions && customerTransactions.length > 0) {
          const latestTx = customerTransactions[0];
          setTempCustomerName(latestTx.customerName || "");
          setTempCustomerNotes(latestTx.customerNotes || "");
          
          const latestMembershipTx = customerTransactions.find(tx => tx.items.some(i => 
              (i.nameKey || '').toLowerCase() === 'yearlymembership' || 
              (i.displayName || '').toLowerCase() === 'yearly membership'
          ));

          if (latestMembershipTx) {
              const purchaseDate = new Date(latestMembershipTx.date);
              const expiry = new Date(purchaseDate);
              expiry.setFullYear(expiry.getFullYear() + 1);
              const diff = expiry.getTime() - new Date().getTime();
              const days = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
              if (days > 0) {
                  setTempIsVip(true);
                  setTempVipDays(days);
              } else {
                  setTempIsVip(false);
                  setTempVipDays(null);
              }
          } else {
              setTempIsVip(false);
              setTempVipDays(null);
          }
      } else {
          setTempCustomerName("");
          setTempIsVip(false);
          setTempVipDays(null);
      }
  };

  const waitlistEstimatedTotal = useMemo(() => {
      let total = 0;
      tempSelectedServices.forEach(sName => {
          for (const cat of pricingData) {
              const found = cat.services.find(s => (s.displayName || t.serviceNames[s.nameKey] || s.nameKey) === sName);
              if (found) {
                  total += parseFloat(found.price.replace(/[^0-9.]/g, '') || '0');
                  break;
              }
          }
      });
      return total;
  }, [tempSelectedServices, pricingData, t.serviceNames]);

  const handleSendSMS = (entry: WaitlistEntry, type: 'ready' | 'custom') => {
      SoundManager.playTap();
      const senderName = currentUser ? currentUser.name : 'The Team';
      let messageBody = type === 'ready' 
          ? t.smsTemplateReady.replace('{name}', entry.customerName) 
          : t.smsTemplateSoon.replace('{name}', entry.customerName);
      messageBody += ` (Sent by ${senderName})`;
      const cleanPhone = entry.customerPhone.replace(/[^0-9+]/g, '');
      const updatedEntry: WaitlistEntry = { 
          ...entry, 
          status: 'notified',
          smsSentBy: senderName 
      };
      setWaitlist(waitlist.map(w => w.id === entry.id ? updatedEntry : w));
      upsertWaitlistEntry(updatedEntry);
      setTimeout(() => { window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(messageBody)}`; }, 100);
  };

  const handleCreateQuickOrder = async () => {
      SoundManager.playTap();
      const staffName = currentUser?.name || 'Staff';
      const newId = Date.now().toString();
      const ticketNum = await getNextTicketNumber('checkin');
      const newBill: ActiveBill = {
          id: newId,
          customerName: `${staffName}'s Guest`,
          customerPhone: '',
          customerNotes: '',
          items: [],
          discountPercentage: 0,
          createdByStaffId: currentUser?.id, 
          ticketNumber: ticketNum 
      };
      setActiveBills(prev => Array.isArray(prev) ? [...prev, newBill] : [newBill]);
      setCurrentBillId(newId);
      upsertActiveBill(newBill);
  };

  const updateCurrentBill = (updates: Partial<ActiveBill>) => {
      if (viewingHistoryBill || !currentBill) return;
      const updatedBill = { ...currentBill, ...updates };
      setActiveBills(prev => {
          if (!Array.isArray(prev)) return prev;
          return prev.map(bill => bill.id === currentBillId ? updatedBill : bill);
      });
      upsertActiveBill(updatedBill);
  };

  const handleOpenHistory = async () => {
      SoundManager.playTap();
      setCashTendered(''); 
      setShowHistoryModal(true); 
      setIsLoadingHistory(true); 
      try {
          let txs = await fetchTransactionsOnce();
          if (!txs || txs.length === 0) txs = getTransactions();
          const todayStr = new Date().toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' }); 
          const todayTxs = txs.filter(tx => {
              try {
                  const txDateStr = new Date(tx.date).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' });
                  return txDateStr === todayStr;
              } catch { return false; }
          });
          setRecentTransactions(todayTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) {
          const todayStr = new Date().toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' });
          const localTxs = getTransactions().filter(tx => {
               try {
                   const txDateStr = new Date(tx.date).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' });
                   return txDateStr === todayStr;
               } catch { return false; }
          });
          setRecentTransactions(localTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } finally { setIsLoadingHistory(false); }
  };

  const handleViewHistoryItem = (tx: Transaction) => {
      SoundManager.playTap();
      setCashTendered(''); 
      const bill: ActiveBill = {
          id: tx.id,
          customerName: tx.customerName || 'Guest',
          customerPhone: tx.customerPhone,
          customerNotes: tx.customerNotes,
          items: tx.items.map(i => ({ ...i, id: Math.random().toString(36).substr(2, 9) })),
          discountPercentage: tx.discountPercentage || 0,
          date: tx.date,
          isVip: tx.items.some(i => (i.nameKey || '').toLowerCase().includes('yearlymembership'))
      };
      setViewingHistoryBill(bill);
      setShowHistoryModal(false);
      setIsBillOpen(true); 
  };

  const handleCloseBillModal = () => {
      SoundManager.playTap();
      setIsBillOpen(false);
      setViewingHistoryBill(null);
      setCashTendered(''); 
      setIsCalculatorOpen(false);
  };

  const handleOpenNewCustomerModal = () => {
      SoundManager.playTap();
      setEntryMode('new');
      setTempCustomerName("");
      setTempCustomerPhone("");
      setTempCustomerNotes("");
      setTempIsVip(false);
      setTempVipDays(null);
      setTempReturnTime("");
      setTempSelectedServices([]);
      setShowCustomerEntry(true);
  };

  const handleEditCurrentCustomer = () => {
      if (viewingHistoryBill) return;
      setEntryMode('edit');
      setTempCustomerName(customerName);
      setTempCustomerPhone(customerPhone);
      setTempCustomerNotes(customerNotes);
      setTempIsVip(!!currentBill?.isVip);
      setTempVipDays(null);
      setShowCustomerEntry(true);
  };

  const closeBill = (idToClose: string) => {
      SoundManager.playError(); 
      deleteActiveBill(idToClose);
      const newBills = activeBills.filter(b => b.id !== idToClose);
      setActiveBills(newBills);
      if (currentBillId === idToClose) setCurrentBillId(newBills.length > 0 ? newBills[newBills.length - 1].id : '');
  };

  const handleAddClick = async (service: {nameKey: string, price: string, displayName?: string}) => {
      if (!isStaffMode || viewingHistoryBill) return;
      SoundManager.playAddToCart();
      if (currentUser && !isAdmin && !isManager) {
          const newItem: CartItem = {
              id: generateUniqueId(),
              nameKey: service.nameKey,
              price: parsePrice(service.price),
              quantity: 1,
              staffName: currentUser.name,
              staffId: currentUser.id,
              displayName: service.displayName
          };
          if (!currentBill) {
               const newId = Date.now().toString();
               const ticketNum = await getNextTicketNumber('checkin');
               const newBill: ActiveBill = { id: newId, customerName: `${currentUser.name}'s Guest`, customerPhone: '', customerNotes: '', items: [newItem], discountPercentage: 0, createdByStaffId: currentUser.id, ticketNumber: ticketNum };
               setActiveBills(prev => [...(prev || []), newBill]);
               setCurrentBillId(newId);
               upsertActiveBill(newBill);
          } else {
               let billUpdates: Partial<ActiveBill> = { items: [...cartItems, newItem] };
               if (currentBill.customerName === "Guest" && cartItems.length === 0) billUpdates.customerName = `${currentUser.name}'s Guest`;
               updateCurrentBill(billUpdates);
          }
      } else {
          setPendingService(service);
          setEditingIds([]);
          setShowStaffModal(true);
      }
  };

  const triggerStaffSelection = async (nameKey: string, price: string, displayName?: string) => {
      if (!isStaffMode || viewingHistoryBill) return;
      SoundManager.playTap();
      if (currentUser && !isAdmin && !isManager) {
          const newItem: CartItem = { id: generateUniqueId(), nameKey, price: parsePrice(price), quantity: 1, staffName: currentUser.name, staffId: currentUser.id, displayName };
          if (!currentBill) {
               const newId = Date.now().toString();
               const ticketNum = await getNextTicketNumber('checkin');
               const newBill: ActiveBill = { id: newId, customerName: `${currentUser.name}'s Guest`, customerPhone: '', customerNotes: '', items: [newItem], discountPercentage: 0, createdByStaffId: currentUser.id, ticketNumber: ticketNum };
               setActiveBills(prev => [...(prev || []), newBill]);
               setCurrentBillId(newId);
               upsertActiveBill(newBill);
          } else updateCurrentBill({ items: [...cartItems, newItem] });
          setNegotiatedPrices(prev => ({...prev, [nameKey]: ''}));
      } else {
          setPendingService({ nameKey, price, displayName });
          setEditingIds([]);
          setShowStaffModal(true);
          setNegotiatedPrices(prev => ({...prev, [nameKey]: ''}));
      }
  };

  const handleMinusClick = (nameKey: string) => {
      if (!isStaffMode || viewingHistoryBill) return;
      SoundManager.playError(); 
      const myItemIndex = currentUser && !isAdmin && !isManager ? cartItems.findIndex(item => item.nameKey === nameKey && item.staffId === currentUser.id) : -1;
      const indexToRemove = (isAdmin || isManager || myItemIndex === -1) ? cartItems.map(item => item.nameKey).lastIndexOf(nameKey) : myItemIndex; 
      if (indexToRemove !== -1) {
          const newItems = [...cartItems];
          newItems.splice(indexToRemove, 1);
          updateCurrentBill({ items: newItems });
          if (newItems.length === 0 && viewMode === 'all') setIsBillOpen(false);
      }
  };

  const handleEditChip = (item: CartItem) => {
      if (!isStaffMode || viewingHistoryBill) return;
      setPendingService({ nameKey: item.nameKey, price: item.price.toString(), displayName: item.displayName }); 
      setEditingIds([item.id]); 
      setShowStaffModal(true);
  };

  const handleEditItemStaff = (item: GroupedCartItem) => {
      if (!isStaffMode || viewingHistoryBill) return;
      setPendingService({ nameKey: item.nameKey, price: item.price.toString(), displayName: item.displayName });
      setEditingIds(item.originalIds); 
      setShowStaffModal(true);
  };

  const handleStaffSelect = async (staff: StaffProfile) => {
      if (!pendingService) return;
      SoundManager.playTap();
      if (isSplitMode) {
          if (activeSplitSlot === 1) setSplitStaff1(staff);
          else setSplitStaff2(staff);
          return;
      }
      const newItem: CartItem = { id: generateUniqueId(), nameKey: pendingService.nameKey, price: parsePrice(pendingService.price), quantity: 1, staffName: staff.name, staffId: staff.id, displayName: pendingService.displayName };
      if (!currentBill) {
           const newId = Date.now().toString();
           const hostName = (currentUser && !isAdmin && !isManager) ? currentUser.name : (isAdmin ? 'Admin' : (isManager ? 'Manager' : staff.name));
           const ticketNum = await getNextTicketNumber('checkin');
           const newBill: ActiveBill = { id: newId, customerName: `${hostName}'s Guest`, customerPhone: '', customerNotes: '', items: [newItem], discountPercentage: 0, createdByStaffId: currentUser?.id, ticketNumber: ticketNum };
           setActiveBills(prev => [...(prev || []), newBill]);
           setCurrentBillId(newId);
           upsertActiveBill(newBill);
      } else {
          if (editingIds.length > 0) {
              const updatedItems = cartItems.map(item => editingIds.includes(item.id) ? { ...item, staffName: staff.name, staffId: staff.id } : item);
              updateCurrentBill({ items: updatedItems });
          } else updateCurrentBill({ items: [...cartItems, newItem] });
      }
      setShowStaffModal(false); setPendingService(null); setEditingIds([]);
  };

  const handleConfirmSplit = async () => {
      if (!pendingService || !splitStaff1 || !splitStaff2) return;
      SoundManager.playSuccess();
      const price1 = parseFloat(splitAmount1) || 0;
      const price2 = parseFloat(splitAmount2) || 0;
      const baseName = pendingService.displayName || t.serviceNames[pendingService.nameKey] || pendingService.nameKey;
      const item1: CartItem = { id: generateUniqueId(), nameKey: pendingService.nameKey, displayName: `${baseName} (Part 1)`, price: price1, quantity: 1, staffName: splitStaff1.name, staffId: splitStaff1.id };
      const item2: CartItem = { id: generateUniqueId(), nameKey: pendingService.nameKey, displayName: `${baseName} (Part 2)`, price: price2, quantity: 1, staffName: splitStaff2.name, staffId: splitStaff2.id };
      if (!currentBill) {
           const newId = Date.now().toString();
           const ticketNum = await getNextTicketNumber('checkin');
           const newBill: ActiveBill = { id: newId, customerName: `Split Guest`, customerPhone: '', customerNotes: '', items: [item1, item2], discountPercentage: 0, createdByStaffId: currentUser?.id, ticketNumber: ticketNum };
           setActiveBills(prev => [...(prev || []), newBill]);
           setCurrentBillId(newId);
           upsertActiveBill(newBill);
      } else {
          const newItems = editingIds.length > 0 ? cartItems.flatMap(item => editingIds.includes(item.id) ? [item1, item2] : [item]) : [...cartItems, item1, item2];
          updateCurrentBill({ items: newItems });
      }
      setShowStaffModal(false); setPendingService(null); setEditingIds([]); setIsSplitMode(false);
  };

  const groupedCartItems = useMemo(() => {
      const groups: Record<string, GroupedCartItem> = {};
      if(!Array.isArray(cartItems)) return [];
      cartItems.forEach(item => {
          const key = `${item.nameKey}-${item.staffName || 'Unassigned'}-${item.displayName || ''}`;
          if (!groups[key]) groups[key] = { ...item, quantity: 0, originalIds: [] };
          groups[key].quantity += item.quantity;
          groups[key].originalIds.push(item.id);
      });
      return Object.values(groups);
  }, [cartItems]);

  const handleRemoveGroup = (originalIds: string[]) => {
      if (!isStaffMode || viewingHistoryBill) return;
      SoundManager.playError();
      const newItems = cartItems.filter(item => !originalIds.includes(item.id));
      updateCurrentBill({ items: newItems });
      if (newItems.length <= 0) setIsBillOpen(false);
  };

  const handleCompletePayment = async () => {
    if (!isStaffMode || viewingHistoryBill) return; 
    
    // Prevent duplicate submissions
    if (isSaving) {
        console.log("Payment already in progress, ignoring duplicate click");
        return;
    }
    
    // GPS validation
    if (globalPayroll?.gpsRequired) {
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => { navigator.geolocation.getCurrentPosition(resolve, (error) => reject(error), { enableHighAccuracy: true, timeout: 5000 }); });
            const distance = calculateDistance(position.coords.latitude, position.coords.longitude, SHOP_LOCATION.lat, SHOP_LOCATION.lng);
            if (distance > SHOP_LOCATION.allowedRadiusMeters) {
                alert(`Cannot complete payment.\n\nYou are too far from the shop (${Math.round(distance)}m). You must be at the salon to process payments.`);
                return; 
            }
        } catch (error: any) {
            alert("Payment Blocked: Location access check failed.");
            return; 
        }
    }
    
    setIsSaving(true);
    
    try {
        // Check if this bill still exists in Firebase before processing
        // This prevents duplicate transactions if another device already processed it
        const billExists = await checkActiveBillExists(currentBillId);
        if (!billExists) {
            alert("This bill has already been processed by another device.");
            // Clean up local state
            const newBills = activeBills.filter(b => b.id !== currentBillId);
            setActiveBills(newBills);
            setCurrentBillId(newBills.length > 0 ? newBills[newBills.length - 1].id : '');
            setIsBillOpen(false);
            setCashTendered('');
            setIsCalculatorOpen(false);
            return;
        }
        
        SoundManager.playSuccess(); 
        
        // Generate deterministic transaction ID using only the bill ID
        // This ensures the same bill always creates the same transaction ID across all devices
        // preventing duplicate transactions even if processed simultaneously
        const transactionId = `tx_${currentBillId}`;
        
        const items: TransactionItem[] = cartItems.map(({ id, ...rest }) => rest);
        const currentBill = activeBills.find(b => b.id === currentBillId);
        const transaction = { 
            id: transactionId, 
            date: new Date().toISOString(), 
            total: finalTotal, 
            items, 
            discountPercentage, 
            customerName, 
            customerPhone, 
            customerNotes, 
            lastUpdated: Date.now(),
            ticketNumber: currentBill?.ticketNumber
        };
        
        // Save locally first
        saveTransaction(transaction); 
        
        // Save to Firebase
        await saveTransactionToFirebase(transaction);
        
        // Delete the bill from Firebase (this will fail if another device already deleted it)
        if (currentBillId) deleteActiveBill(currentBillId).catch(() => {});
        
        // Update local state
        const newBills = activeBills.filter(b => b.id !== currentBillId);
        setActiveBills(newBills);
        setCurrentBillId(newBills.length > 0 ? newBills[newBills.length - 1].id : '');
        setIsBillOpen(false); 
        setCashTendered(''); 
        setIsCalculatorOpen(false);
    } catch (error) {
        alert("Payment saved LOCALLY. Syncing later.");
        setIsBillOpen(false);
    } finally { 
        setIsSaving(false); 
    }
  };

  const handleAddToWaitlist = () => {
      SoundManager.playSuccess();
      const newEntry: WaitlistEntry = { id: Date.now().toString(), customerName: tempCustomerName, customerPhone: tempCustomerPhone, notes: tempCustomerNotes || tempReturnTime, addedTime: new Date().toISOString(), estimatedReturnTime: tempReturnTime, status: 'waiting', selectedServices: tempSelectedServices, isVip: tempIsVip };
      setWaitlist([...(waitlist || []), newEntry]);
      upsertWaitlistEntry(newEntry);
      setShowWaitlistAddModal(false); setShowCustomerEntry(false); setShowWaitlistModal(true);
  };

  const handleRemoveFromWaitlist = (id: string) => {
      SoundManager.playError();
      setWaitlist(waitlist.filter(w => w.id !== id));
      deleteWaitlistEntry(id);
  };

  const handleCheckInFromWaitlist = (entry: WaitlistEntry) => {
      SoundManager.playSuccess();
      const newId = Date.now().toString();
      const initialItems: CartItem[] = (entry.selectedServices || []).map(serviceName => {
        let foundService = null;
        for (const cat of pricingData) {
            const s = cat.services.find(s => (s.displayName || t.serviceNames[s.nameKey] || s.nameKey) === serviceName);
            if(s) { foundService = s; break; }
        }
        return { id: generateUniqueId(), nameKey: foundService ? foundService.nameKey : serviceName, price: foundService ? parsePrice(foundService.price) : 0, quantity: 1, displayName: serviceName, staffName: (currentUser && !isAdmin && !isManager) ? currentUser.name : undefined, staffId: (currentUser && !isAdmin && !isManager) ? currentUser.id : undefined };
      });
      const newBill: ActiveBill = { id: newId, customerName: entry.customerName, customerPhone: entry.customerPhone, customerNotes: entry.notes + (entry.estimatedReturnTime ? ` (Return: ${entry.estimatedReturnTime})` : ''), items: initialItems, discountPercentage: 0, createdByStaffId: currentUser?.id, ticketNumber: entry.ticketNumber, isVip: entry.isVip };
      setActiveBills(prev => [...(prev || []), newBill]);
      setCurrentBillId(newId);
      upsertActiveBill(newBill);
      handleRemoveFromWaitlist(entry.id); 
      setShowWaitlistModal(false);
  };

  const handleCalcPress = (val: string) => {
      SoundManager.playTap();
      if (val === 'C') setCalcDisplay("");
      else if (val === 'DEL') setCalcDisplay(prev => prev.slice(0, -1));
      else if (val === '=') {
          try {
              const evalString = calcDisplay.replace(/x/g, '*').replace(/÷/g, '/');
              setCalcDisplay(String(new Function('return ' + evalString)()));
          } catch (e) { setCalcDisplay("Error"); }
      } else setCalcDisplay(prev => prev + val);
  };

  const handleLongPressStart = (billId: string) => {
      isLongPress.current = false;
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      longPressTimer.current = setTimeout(() => {
          isLongPress.current = true;
          if (window.confirm("Close this bill order?")) {
              closeBill(billId);
          }
      }, 700);
  };

  const handleLongPressEnd = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
  };

  const handleSaveCustomerEntry = async () => {
    SoundManager.playSuccess();
    if (entryMode === 'new') {
        const newId = Date.now().toString();
        const ticketNum = await getNextTicketNumber('checkin');
        const newBill: ActiveBill = {
            id: newId,
            customerName: tempCustomerName,
            customerPhone: tempCustomerPhone,
            customerNotes: tempCustomerNotes,
            items: [],
            discountPercentage: 0,
            createdByStaffId: currentUser?.id,
            ticketNumber: ticketNum,
            isVip: tempIsVip
        };
        setActiveBills(prev => Array.isArray(prev) ? [...prev, newBill] : [newBill]);
        setCurrentBillId(newId);
        upsertActiveBill(newBill);
    } else {
        updateCurrentBill({
            customerName: tempCustomerName,
            customerPhone: tempCustomerPhone,
            customerNotes: tempCustomerNotes,
            isVip: tempIsVip
        });
    }
    setShowCustomerEntry(false);
  };

  const handlePrintTicket = async () => {
    try {
        SoundManager.playSuccess();
        // Use existing ticket number from current bill, don't generate a new one
        const ticketNumber = currentBill?.ticketNumber || '';
        if (!ticketNumber) {
            SoundManager.playError();
            alert('No ticket number available. Please save customer first.');
            return;
        }
        setGeneratedTicket(ticketNumber);
        // Use requestAnimationFrame to ensure DOM has updated before printing
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.print();
            });
        });
    } catch (error) {
        console.error('Error printing ticket:', error);
        SoundManager.playError();
        alert('Failed to print ticket. Please try again.');
    }
  };

  const handleConfirmBooking = (bookingId: string) => {
      SoundManager.playSuccess();
      onUpdateBookingStatus?.(bookingId, 'confirmed');
  };

  const handleCancelBooking = (bookingId: string) => {
      SoundManager.playTap();
      onUpdateBookingStatus?.(bookingId, 'cancelled');
  };

  const handleRemoveBooking = (bookingId: string) => {
      SoundManager.playError();
      onDeleteBooking?.(bookingId);
  };

  if (!activeBills) return null;

  return (
    <>
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 pb-24 print:hidden">
      {isStaffMode && currentUser && (
        <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center">
                <div className="flex items-center gap-2 md:gap-4 bg-white rounded-2xl p-2 md:p-3 pr-4 shadow-sm border border-gray-200 flex-shrink-0 overflow-x-auto no-scrollbar w-full md:w-auto">
                        <button onClick={() => { if(window.confirm("Log out?")) onLogout(); }} className="flex items-center gap-2 md:gap-4 px-2 md:px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors flex-shrink-0">
                            <div className="relative">
                                {currentUser.avatar ? <img src={currentUser.avatar} alt="Staff" className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover border border-gray-200" /> : <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full ${isAdmin || isManager ? 'bg-charcoal' : 'bg-gold-leaf'} text-white flex items-center justify-center font-bold text-lg`}>{isAdmin ? <BriefcaseIcon className="w-6 h-6" /> : (isManager ? <LockIcon className="w-6 h-6" /> : currentUser.name?.substring(0, 2).toUpperCase())}</div>}
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <p className="text-sm md:text-lg font-bold text-charcoal leading-tight hidden sm:block max-w-[120px] truncate">{currentUser.name}</p>
                        </button>
                        <div className="w-px h-8 md:h-10 bg-gray-200 mx-1 md:mx-2"></div>
                        {!isManager ? (
                            <div className="flex bg-gray-100/50 p-1 rounded-xl flex-shrink-0">
                                {!isAdmin && <button onClick={() => { SoundManager.playTap(); setViewMode('mine'); }} className={`px-3 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-lg font-bold transition-all flex items-center gap-2 md:gap-3 ${viewMode === 'mine' ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}><UserIcon className="w-5 h-5 md:w-6 md:h-6" /><span className="hidden sm:inline">My Orders</span></button>}
                                <button onClick={() => { SoundManager.playTap(); setViewMode('all'); }} className={`px-3 py-2 md:px-6 md:py-3 rounded-lg text-sm md:text-lg font-bold transition-all flex items-center gap-2 md:gap-3 ${viewMode === 'all' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'}`}><WalletIcon className="w-5 h-5 md:w-6 md:h-6" /><span className="hidden sm:inline">All Bills</span></button>
                            </div>
                        ) : <div className="px-4 font-bold text-gray-500 text-sm md:text-base flex items-center gap-2"><WalletIcon className="w-5 h-5" /> All Shop Orders</div>}
                        <div className="w-px h-8 md:h-10 bg-gray-200 mx-1 md:mx-2"></div>
                        <div className="flex gap-2 flex-shrink-0">
                           <button onClick={handleOpenHistory} className="p-2 md:p-3 bg-gray-50 border border-gray-200 text-charcoal rounded-xl hover:text-gold-leaf hover:bg-white shadow-sm transition-all"><ReceiptIcon className="w-6 h-6 md:w-8 md:h-8" /></button>
                           <button onClick={() => { SoundManager.playTap(); setCalcDisplay(""); setShowCalculator(true); }} className="p-2 md:p-3 bg-gold-leaf border border-gold-leaf text-white rounded-xl hover:bg-charcoal shadow-sm transition-all"><CalculatorIcon className="w-6 h-6 md:w-8 md:h-8" /></button>
                           <button onClick={() => { SoundManager.playTap(); setShowWaitlistModal(true); }} className="relative p-2 md:p-3 bg-gray-50 border border-gray-200 text-charcoal rounded-xl hover:text-gold-leaf shadow-sm transition-all"><ClockIcon className="w-6 h-6 md:w-8 md:h-8" />{waitlist.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border border-white">{waitlist.length}</span>}</button>
                           <button onClick={() => { SoundManager.playTap(); setShowBookingsModal(true); }} className="relative p-2 md:p-3 bg-gray-50 border border-gray-200 text-charcoal rounded-xl hover:text-gold-leaf shadow-sm transition-all"><CalendarIcon className="w-6 h-6 md:w-8 md:h-8" />{pendingBookingsCount > 0 && <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border border-white">{pendingBookingsCount}</span>}</button>
                        </div>
                    </div>
            </div>
        </div>
      )}

      {(isStaffMode || (activeBills.length > 0 && isReceiptMode)) && (
          <div className="mb-4">
              <div className="flex justify-between items-center mb-2 px-1"><h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{viewMode === 'mine' ? `Active Orders (${displayedBills.length})` : 'All Shop Orders'}</h3></div>
              {viewMode === 'mine' && displayedBills.length === 0 && isStaffMode ? (
                  <button onClick={handleCreateQuickOrder} className="w-full bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm mb-4 animate-fade-in flex flex-col items-center justify-center gap-2 hover:border-gold-leaf transition-colors cursor-pointer"><div className="bg-gray-50 p-4 rounded-full mb-2"><PlusIcon className="w-8 h-8 opacity-50" /></div><p className="font-bold text-lg">Your workspace is empty</p><p className="text-xs opacity-70">Tap here to start a new order</p></button>
              ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {displayedBills.map((bill, index) => {
                          if (!bill) return null;
                          const isActive = bill.id === currentBillId;
                          const itemCount = (bill.items || []).reduce((s, i) => s + i.quantity, 0);
                          const label = bill.customerName || `Customer ${index + 1}`;
                          const isEmpty = !bill.customerName;
                          const rawTotal = (bill.items || []).reduce((sum, i) => sum + (i.price * i.quantity), 0);
                          const billTotal = rawTotal - (rawTotal * ((bill.discountPercentage || 0) / 100));
                          const isMine = currentUser && bill.customerName && bill.customerName.includes(currentUser.name);
                          return (
                              <div key={bill.id} className="relative group w-full">
                                  <button 
                                      onMouseDown={() => handleLongPressStart(bill.id)}
                                      onMouseUp={handleLongPressEnd}
                                      onMouseLeave={handleLongPressEnd}
                                      onTouchStart={() => handleLongPressStart(bill.id)}
                                      onTouchEnd={handleLongPressEnd}
                                      onClick={(e) => { 
                                          if (isLongPress.current) { 
                                              e.preventDefault(); 
                                              e.stopPropagation(); 
                                              isLongPress.current = false; 
                                              return; 
                                          } 
                                          SoundManager.playTap(); 
                                          setCurrentBillId(bill.id); 
                                          if (isActive && isStaffMode) handleEditCurrentCustomer(); 
                                      }} 
                                      className={`flex flex-col items-start px-4 py-3 rounded-xl border transition-all w-full relative overflow-hidden h-full min-h-[80px] ${isActive ? (isMine ? 'bg-green-600 text-white border-green-600 shadow-md' : 'bg-blue-600 text-white border-blue-600 shadow-md') : isMine ? 'bg-green-50 border-green-200 text-green-900 hover:bg-green-100' : 'bg-white text-charcoal border-gray-200 hover:bg-gray-50'}`}
                                  >
                                      <div className="flex items-center gap-2 w-full mb-1 relative z-20"><span className={`font-bold text-left text-2xl truncate flex-1 ${isEmpty ? 'italic opacity-70' : ''}`}>{bill.ticketNumber && <span className="font-mono bg-black text-white px-1.5 rounded mr-2 text-lg align-middle inline-block">{bill.ticketNumber}</span>}{bill.isVip && <StarIcon className="w-5 h-5 text-gold-leaf inline-block mr-1" filled />}{isEmpty ? 'Tap to Name' : label}</span></div>
                                      <div className="flex justify-between w-full mt-auto items-end relative z-20"><span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gold-leaf'}`}>${billTotal.toFixed(2)}</span><span className="text-[10px] opacity-80">{itemCount} items</span></div>
                                  </button>
                                  {isStaffMode && <button onClick={(e) => { e.stopPropagation(); closeBill(bill.id); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-30"><XMarkIcon className="w-3 h-3" /></button>}
                              </div>
                          );
                      })}
                      {isStaffMode && <button onClick={handleCreateQuickOrder} className="flex items-center justify-center bg-white text-gray-400 rounded-xl hover:bg-gold-leaf hover:text-white transition-colors shadow-sm border border-dashed border-gray-300 min-h-[80px]"><PlusIcon className="w-6 h-6" /></button>}
                  </div>
              )}
          </div>
      )}

      <div className="relative w-full mb-4">
          <input type="text" placeholder="Search service..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-gold-leaf outline-none shadow-sm text-charcoal text-sm" />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500"><XMarkIcon className="w-4 h-4" /></button>}
      </div>
      
      <div className="space-y-4">
        {filteredPricingData.map((category) => {
          const isOpen = openCategories[category.categoryKey];
          const itemsInCategory = cartItems.filter(item => category.services.some(s => s.nameKey === item.nameKey)).length;
          const categoryName = t.serviceCategories[category.categoryKey] || category.categoryKey;
          const Icon = category.icon || SparklesIcon;
          return (
            <div key={category.categoryKey} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-gold-leaf/20 overflow-hidden">
              <button onClick={() => toggleCategory(category.categoryKey)} className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-white/50 transition-colors outline-none">
                <div className="flex items-center">
                  <Icon className="w-8 h-8 text-gold-leaf mr-4" />
                  <h3 className="text-xl md:text-2xl font-serif text-charcoal text-left">{categoryName}{itemsInCategory > 0 && !isOpen && <span className="ml-3 text-sm bg-gold-leaf text-white px-2 py-0.5 rounded-full font-sans align-middle">{itemsInCategory}</span>}</h3>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-charcoal/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                  <div className="px-4 pb-4 md:px-6 md:pb-6 animate-fade-in border-t border-dusty-rose/20 pt-2">
                    <ul className="divide-y divide-dusty-rose/50">
                        {category.services.map((service, index) => {
                        const activeItemsForService = cartItems.filter(i => i.nameKey === service.nameKey);
                        const displayServiceName = service.displayName || t.serviceNames[service.nameKey] || service.nameKey;
                        const isContactPrice = service.price.toLowerCase().includes('contact');
                        return (
                            <li key={service.nameKey} className="py-3 font-sans">
                                <div className="flex justify-between items-center">
                                    <div className="flex-grow pr-4">
                                        <span className="text-charcoal/90 block md:inline">{index + 1}. {displayServiceName}</span>
                                        {activeItemsForService.length > 0 && (
                                            <div className="inline-flex items-center gap-1 ml-2 align-middle">
                                                {activeItemsForService.map((item, idx) => {
                                                    const staff = staffList.find(s => s.id === item.staffId || s.name === item.staffName);
                                                    return <div key={idx} className="w-5 h-5 rounded-full border border-white shadow-sm overflow-hidden" title={item.staffName}>{staff?.avatar ? <img src={staff.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-gold-leaf text-white flex items-center justify-center text-[8px] font-bold">{item.staffName ? item.staffName.substring(0, 1) : '?'}</div>}</div>;
                                                })}
                                            </div>
                                        )}
                                        {(!isContactPrice || !isStaffMode) && <span className="font-medium text-gold-leaf text-sm md:text-base block md:float-right md:ml-4">{service.price}</span>}
                                    </div>
                                    {isStaffMode && !viewingHistoryBill && (
                                        <div className="flex items-center gap-2">
                                            {isContactPrice ? (
                                                <div className="flex items-center gap-2 animate-fade-in">
                                                    <div className="relative group"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">$</span><input type="number" placeholder="Price" value={negotiatedPrices[service.nameKey] || ''} onChange={(e) => handleNegotiatedPriceChange(service.nameKey, e.target.value)} className="w-24 pl-5 pr-2 py-1.5 border-2 border-dusty-rose/30 rounded-lg text-sm outline-none focus:border-gold-leaf bg-white text-charcoal font-bold text-right transition-all" onKeyDown={(e) => { if (e.key === 'Enter' && negotiatedPrices[service.nameKey]) triggerStaffSelection(service.nameKey, `$${negotiatedPrices[service.nameKey]}`, displayServiceName); }} /></div>
                                                    {negotiatedPrices[service.nameKey] && <button onClick={() => triggerStaffSelection(service.nameKey, `$${negotiatedPrices[service.nameKey]}`, displayServiceName)} className="bg-gold-leaf text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-charcoal transition-colors">Add</button>}
                                                </div>
                                            ) : <>{activeItemsForService.length > 0 && <><button onClick={() => handleMinusClick(service.nameKey)} className="w-8 h-8 flex items-center justify-center bg-gray-100 border border-gray-200 text-charcoal rounded-full hover:bg-gray-200 transition-colors shadow-sm"><MinusIcon className="w-4 h-4" /></button><span className="font-bold text-charcoal w-6 text-center">{activeItemsForService.length}</span></>}<button onClick={() => handleAddClick(service)} className="w-8 h-8 flex items-center justify-center bg-gold-leaf text-white rounded-full hover:bg-gold-leaf/80 transition-colors shadow-sm"><PlusIcon className="w-4 h-4" /></button></>}
                                        </div>
                                    )}
                                </div>
                                {activeItemsForService.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {activeItemsForService.map(item => {
                                            const staffProf = staffList.find(s => s.name === item.staffName);
                                            return <div key={item.id} className="inline-flex items-center gap-1 bg-blush-pink/50 border border-dusty-rose/50 rounded-full px-2 py-1 text-sm text-charcoal animate-fade-in pl-1">{staffProf?.avatar ? <img src={staffProf.avatar} className="w-4 h-4 rounded-full object-cover" alt="" /> : <div className="w-4 h-4 rounded-full bg-gold-leaf/50"></div>}<button onClick={() => handleEditChip(item)} disabled={!isStaffMode || !!viewingHistoryBill} className={`font-semibold text-xs flex items-center gap-1 ${isStaffMode && !viewingHistoryBill ? 'hover:text-gold-leaf hover:underline cursor-pointer' : 'cursor-default'}`}>{item.staffName || 'No Staff'} {isContactPrice && <span className="text-gold-leaf ml-1 font-bold">${item.price}</span>}</button></div>;
                                        })}
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
        })}
      </div>

      {showFloatingBar && (
          <div className="fixed bottom-0 left-0 w-full p-4 z-40 animate-slide-up">
              <div className="max-w-3xl mx-auto bg-charcoal text-white rounded-full shadow-2xl p-3 flex justify-between items-center border border-gold-leaf/30 backdrop-blur-md bg-opacity-95">
                  <div className="flex flex-col px-4">
                      <div className="flex items-center gap-2">{isVip && <StarIcon className="w-3 h-3 text-gold-leaf" filled />}<span className="text-xs text-gold-leaf font-medium uppercase tracking-wider">{currentBill?.ticketNumber && <span className="font-mono bg-gold-leaf text-charcoal px-1.5 rounded mr-2 text-[10px] align-middle inline-block">{currentBill.ticketNumber}</span>}{customerName || 'Guest'} - {t.total}</span></div>
                      <span className="text-xl font-bold">${finalTotal.toFixed(2)}</span>
                  </div>
                  <button onClick={() => { SoundManager.playTap(); setIsBillOpen(true); }} className="bg-gold-leaf text-white font-sans font-bold py-2 px-6 rounded-full shadow-lg hover:bg-white hover:text-gold-leaf transition-all flex items-center gap-2"><ReceiptIcon className="w-5 h-5" />{t.viewBill} ({cartItemCount})</button>
              </div>
          </div>
      )}

      {showCalculator && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white w-full max-w-xs rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                  <div className="bg-gray-100 p-4 flex justify-between items-center"><h3 className="font-bold text-gray-500 uppercase text-xs tracking-wider">Quick Calc</h3><button onClick={() => setShowCalculator(false)} className="text-gray-400 hover:text-red-500"><XMarkIcon className="w-5 h-5" /></button></div>
                  <div className="p-4 bg-white pb-0"><div className="bg-gray-100 rounded-xl p-4 mb-2 text-right h-20 flex items-center justify-end overflow-hidden"><span className="text-4xl font-mono font-bold text-charcoal">{calcDisplay || "0"}</span></div></div>
                  <div className="p-4 grid grid-cols-4 gap-3">
                      <button onClick={() => handleCalcPress('C')} className="h-14 rounded-full bg-red-100 text-red-600 font-bold text-lg hover:bg-red-200">C</button>
                      <button onClick={() => handleCalcPress('DEL')} className="h-14 rounded-full bg-gray-100 text-charcoal font-bold text-lg hover:bg-gray-200">⌫</button>
                      <button onClick={() => handleCalcPress('/')} className="h-14 rounded-full bg-gray-100 text-gold-leaf font-bold text-xl hover:bg-gray-200">÷</button>
                      <button onClick={() => handleCalcPress('*')} className="h-14 rounded-full bg-gray-100 text-gold-leaf font-bold text-xl hover:bg-gray-200">×</button>
                      <button onClick={() => handleCalcPress('7')} className="h-14 rounded-full bg-white border border-gray-200 text-charcoal font-bold text-xl hover:bg-gray-50 shadow-sm">7</button>
                      <button onClick={() => handleCalcPress('8')} className="h-14 rounded-full bg-white border border-gray-200 text-charcoal font-bold text-xl hover:bg-gray-50 shadow-sm">8</button>
                      <button onClick={() => handleCalcPress('9')} className="h-14 rounded-full bg-white border border-gray-200 text-charcoal font-bold text-xl hover:bg-gray-50 shadow-sm">9</button>
                      <button onClick={() => handleCalcPress('-')} className="h-14 rounded-full bg-gray-100 text-gold-leaf font-bold text-xl hover:bg-gray-200">-</button>
                      <button onClick={() => handleCalcPress('4')} className="h-14 rounded-full bg-white border border-gray-200 text-charcoal font-bold text-xl hover:bg-gray-50 shadow-sm">4</button>
                      <button onClick={() => handleCalcPress('5')} className="h-14 rounded-full bg-white border border-gray-200 text-charcoal font-bold text-xl hover:bg-gray-50 shadow-sm">5</button>
                      <button onClick={() => handleCalcPress('6')} className="h-14 rounded-full bg-white border border-gray-200 text-charcoal font-bold text-xl hover:bg-gray-50 shadow-sm">6</button>
                      <button onClick={() => handleCalcPress('+')} className="h-14 rounded-full bg-gray-100 text-gold-leaf font-bold text-xl hover:bg-gray-200">+</button>
                      <button onClick={() => handleCalcPress('1')} className="h-14 rounded-full bg-white border border-gray-200 text-charcoal font-bold text-xl hover:bg-gray-50 shadow-sm">1</button>
                      <button onClick={() => handleCalcPress('2')} className="h-14 rounded-full bg-white border border-gray-200 text-charcoal font-bold text-xl hover:bg-gray-50 shadow-sm">2</button>
                      <button onClick={() => handleCalcPress('3')} className="h-14 rounded-full bg-white border border-gray-200 text-charcoal font-bold text-xl hover:bg-gray-50 shadow-sm">3</button>
                      <button onClick={() => handleCalcPress('=')} className="h-full rounded-2xl bg-gold-leaf text-white font-bold text-xl hover:bg-charcoal shadow-md row-span-2">=</button>
                      <button onClick={() => handleCalcPress('0')} className="h-14 rounded-full bg-white border border-gray-200 text-charcoal font-bold text-xl hover:bg-gray-50 shadow-sm col-span-2">0</button>
                      <button onClick={() => handleCalcPress('.')} className="h-14 rounded-full bg-white border border-gray-200 text-charcoal font-bold text-xl hover:bg-gray-50 shadow-sm">.</button>
                  </div>
              </div>
          </div>
      )}

      {showWaitlistModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 105 }}>
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center"><h3 className="text-xl font-serif font-bold text-charcoal flex items-center gap-2"><ClockIcon className="w-6 h-6 text-gold-leaf" />Waitlist ({waitlist.length})</h3><button onClick={() => setShowWaitlistModal(false)} className="text-gray-400 hover:text-charcoal"><XMarkIcon className="w-6 h-6" /></button></div>
                <div className="p-4 overflow-y-auto flex-grow bg-gray-50 custom-scrollbar space-y-3">
                    <button onClick={() => { SoundManager.playTap(); setShowWaitlistModal(false); setShowWaitlistAddModal(true); handleOpenNewCustomerModal(); }} className="w-full py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-gold-leaf hover:text-gold-leaf transition-colors flex items-center justify-center gap-2"><PlusIcon className="w-5 h-5" /> Add Customer to Waitlist</button>
                    {waitlist.length === 0 ? <div className="text-center py-8 opacity-50"><p>Waitlist is empty.</p></div> : waitlist.map(entry => (
                            <div key={entry.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                                <div className="flex justify-between items-start mb-2"><div><h4 className="font-bold text-charcoal text-lg">{entry.ticketNumber && <span className="font-mono bg-black text-white px-1.5 rounded mr-2 text-sm">{entry.ticketNumber}</span>}{entry.isVip && <StarIcon className="w-4 h-4 text-gold-leaf inline-block mr-1" filled />}{entry.customerName}</h4><p className="text-xs text-gray-500">{entry.customerPhone}</p></div><div className="text-right"><span className="text-xs font-bold text-gold-leaf bg-gold-leaf/10 px-2 py-1 rounded-full block mb-1">{formatTimeAgo(entry.addedTime)}</span>{entry.status === 'notified' && <span className="text-[10px] text-green-600 font-bold">SMS Sent {entry.smsSentBy ? `by ${entry.smsSentBy}` : ''}</span>}</div></div>
                                {entry.notes && <div className="bg-yellow-50 p-2 rounded-lg text-xs text-gray-600 mb-2 italic border-l-2 border-gold-leaf/50">Note: {entry.notes} {entry.estimatedReturnTime && `(Return: ${entry.estimatedReturnTime})`}</div>}
                                {entry.selectedServices && entry.selectedServices.length > 0 && <div className="flex flex-wrap gap-1 mb-3">{entry.selectedServices.map((s, i) => <span key={i} className="text-[10px] bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-gray-600">{s}</span>)}</div>}
                                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50"><button onClick={() => handleCheckInFromWaitlist(entry)} className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-green-700 shadow-sm">Check In (Create Bill)</button><button onClick={() => handleSendSMS(entry, 'ready')} className="px-3 bg-blue-500 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-600 shadow-sm" title="Send 'Ready' SMS"><ChatIcon className="w-4 h-4" /></button><button onClick={() => handleRemoveFromWaitlist(entry.id)} className="px-3 bg-red-50 text-red-500 border border-red-100 text-xs font-bold py-2 rounded-lg hover:bg-red-100"><TrashIcon className="w-4 h-4" /></button></div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
      )}

      {showBookingsModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 105 }}>
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="bg-white p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-serif font-bold text-charcoal flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-blue-600" />
                        Bookings ({bookings.length})
                    </h3>
                    <button onClick={() => setShowBookingsModal(false)} className="text-gray-400 hover:text-charcoal">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto flex-grow bg-gray-50 custom-scrollbar space-y-3">
                    {bookings.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                            <CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-400 font-medium">No booking requests yet.</p>
                        </div>
                    ) : (
                        bookings.map(booking => (
                            <div key={booking.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:border-gold-leaf/30 transition-colors">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                    booking.status === 'pending' ? 'bg-yellow-400' : 
                                    booking.status === 'confirmed' ? 'bg-green-500' : 
                                    'bg-red-400'
                                }`}></div>
                                <div className="flex-grow space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-serif font-bold text-xl text-charcoal">{booking.customerName}</h4>
                                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                <PhoneIcon className="w-4 h-4 text-gold-leaf" />
                                                <a href={`tel:${booking.customerPhone}`} className="hover:underline">{booking.customerPhone}</a>
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                                            booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm font-medium text-charcoal bg-gray-50 p-2 rounded-lg w-fit">
                                        <CalendarIcon className="w-4 h-4 text-gold-leaf" />
                                        <span>{new Date(booking.date).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })}</span>
                                        <span className="text-gray-300">|</span>
                                        <span>{booking.timeSlot}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Services Requested</p>
                                        <div className="flex flex-wrap gap-2">
                                            {booking.services.map((s, i) => (
                                                <span key={i} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-medium text-charcoal shadow-sm flex items-center gap-1">
                                                    <SparklesIcon className="w-3 h-3 text-gold-leaf" />
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    {booking.notes && (
                                        <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-sm text-yellow-800 italic">
                                            " {booking.notes} "
                                        </div>
                                    )}
                                    <p className="text-[10px] text-gray-300 pt-2">Request sent: {new Date(booking.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="flex flex-col gap-3 justify-center md:min-w-[150px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                                    {booking.status === 'pending' && (
                                        <button 
                                            onClick={() => handleConfirmBooking(booking.id)}
                                            className="w-full py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm shadow-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            Confirm
                                        </button>
                                    )}
                                    {booking.status !== 'cancelled' && (
                                        <button 
                                            onClick={() => handleCancelBooking(booking.id)}
                                            className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleRemoveBooking(booking.id)}
                                        className="w-full py-2 text-red-300 hover:text-red-500 text-xs font-bold transition-colors flex items-center justify-center gap-1 mt-auto"
                                    >
                                        <TrashIcon className="w-3 h-3" /> Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {isBillOpen && (
          <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 50 }}>
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="bg-white p-6 pb-4 text-center border-b border-gray-100 relative shadow-sm z-10">
                      <button onClick={handleCloseBillModal} className="absolute top-4 right-4 text-gray-400 hover:text-charcoal transition-colors"><XMarkIcon className="w-6 h-6" /></button>
                      <LaPerlaLogo className="w-32 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t.total}</p>
                      <div className="text-5xl font-serif font-bold text-charcoal mb-2">${finalTotal.toFixed(2)}</div>
                      <p className="text-xs text-gray-400 mb-4 font-mono">{billDateString}</p>
                      <div className="flex justify-center items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                          <span>Subtotal: ${cartTotal.toFixed(2)}</span>
                          <div className="flex items-center gap-1"><span>Discount:</span>{isStaffMode && !viewingHistoryBill ? <select value={discountPercentage} onChange={(e) => updateCurrentBill({ discountPercentage: Number(e.target.value) })} className="bg-gray-100 border border-gray-300 rounded px-1 py-0.5 text-xs outline-none focus:border-gold-leaf text-charcoal">{[0,5,10,15,20,25,30].map(v => <option key={v} value={v}>{v}%</option>)}</select> : <span className="text-red-500">{discountPercentage}% (-${discountAmount.toFixed(2)})</span>}</div>
                      </div>
                      {customerName ? <div className="inline-block bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600 flex items-center justify-center gap-2 mx-auto w-fit">{targetBill?.ticketNumber && <span className="font-mono bg-black text-white px-1.5 rounded mr-1 text-[10px]">{targetBill.ticketNumber}</span>}{isVip && <StarIcon className="w-3 h-3 text-gold-leaf" filled />}{customerName}</div> : <p className="text-xs text-gray-400 italic">Guest</p>}
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 custom-scrollbar">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                          {groupedCartItems.map((item, index) => (
                              <div key={`${item.nameKey}-${item.staffName}`} className="flex items-start p-4 border-b border-gray-50 last:border-0 group hover:bg-gray-50 transition-colors"><span className="text-gray-300 font-bold text-lg mr-4 w-6 text-center">{index + 1}</span><div className="flex-grow"><div className="flex justify-between items-start mb-1"><span className={`font-bold text-charcoal text-sm md:text-base ${isStaffMode && !viewingHistoryBill ? 'cursor-pointer group-hover:text-gold-leaf' : ''}`} onClick={() => isStaffMode && !viewingHistoryBill && handleEditItemStaff(item)}>{item.displayName || t.serviceNames[item.nameKey] || item.nameKey}</span><span className="font-bold text-charcoal text-sm">${(item.price * item.quantity).toFixed(2)}</span></div><div className="flex justify-between items-center text-xs text-gray-500"><div className="flex items-center gap-2">{item.quantity > 1 && <span className="bg-gray-200 text-charcoal px-1.5 py-0.5 rounded font-bold">x{item.quantity}</span>}{item.staffName && <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" /> {item.staffName}</span>}</div>{isStaffMode && !viewingHistoryBill && <button onClick={() => handleRemoveGroup(item.originalIds)} className="text-gray-300 hover:text-red-500 p-1">Remove</button>}</div></div></div>
                          ))}
                          {groupedCartItems.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">Empty Bill</div>}
                      </div>
                      {isStaffMode && !viewingHistoryBill && groupedCartItems.length > 0 && (
                          <div className="bg-gray-100 rounded-xl shadow-inner border border-gray-200 mb-4 overflow-hidden">
                              <button onClick={() => setIsCalculatorOpen(!isCalculatorOpen)} className="w-full flex justify-between items-center p-3 bg-gray-200 hover:bg-gray-300 transition-colors"><label className="block text-xs font-bold text-gray-600 uppercase">Cash Calculator</label><div className="flex items-center gap-2"><span className="text-sm font-bold text-charcoal">${cashTendered || '0.00'}</span><ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isCalculatorOpen ? 'rotate-180' : ''}`} /></div></button>
                              {isCalculatorOpen && (
                                  <div className="p-3 border-t border-gray-300 animate-fade-in">
                                      <div className="relative mb-3"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span><input type="number" value={cashTendered} onChange={(e) => setCashTendered(e.target.value)} placeholder="0.00" className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 text-lg font-bold text-charcoal focus:outline-none focus:border-gold-leaf" /></div>
                                      <div className="flex gap-2 mb-3"><button onClick={() => setCashTendered(finalTotal.toString())} className="flex-1 bg-white py-1.5 rounded border border-gray-300 text-xs font-bold hover:bg-gold-leaf hover:text-white transition-colors">Exact</button><button onClick={() => setCashTendered('')} className="w-12 bg-white py-1.5 rounded border border-gray-300 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors">C</button></div>
                                      <div className="grid grid-cols-5 gap-2 mb-2">{[100, 50, 20, 10, 5].map(note => <button key={note} onClick={() => handleAddCash(note)} className="bg-green-100 border border-green-200 py-2 rounded text-xs font-bold text-green-800 hover:bg-green-200 active:scale-95 transition-all">${note}</button>)}</div>
                                      <div className="grid grid-cols-6 gap-2">{[2, 1, 0.5, 0.2, 0.1, 0.05].map(coin => <button key={coin} onClick={() => handleAddCash(coin)} className="bg-gray-200 border border-gray-300 py-2 rounded text-[10px] font-bold text-gray-700 hover:bg-gray-300 active:scale-95 transition-all">{coin < 1 ? `${(coin * 100).toFixed(0)}c` : `$${coin}`}</button>)}</div>
                                  </div>
                              )}
                              <div className="flex justify-between items-center p-3 bg-gray-50 border-t border-gray-200"><span className="text-xs font-bold text-gray-500 uppercase">Change Due</span><span className={`text-lg font-bold ${changeDue >= 0 ? 'text-green-600' : 'text-red-500'}`}>${changeDue >= 0 ? changeDue.toFixed(2) : "0.00"}</span></div>
                          </div>
                      )}
                      {groupedCartItems.length > 0 && <div className="text-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center"><p className="text-[10px] uppercase font-bold text-gray-400 mb-2">Scan for Receipt</p><img src={getQrCodeUrl()} alt="Receipt QR" className="w-32 h-32" /></div>}
                  </div>
                  <div className="bg-white p-4 border-t border-gray-100 space-y-3"><div className="flex gap-2"><button onClick={() => handleDownloadBill()} className="flex-1 py-3 bg-gray-100 text-charcoal font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"><DownloadIcon className="w-5 h-5" />Save Receipt</button><button onClick={handlePrint} className="flex-1 py-3 bg-gray-100 text-charcoal font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm"><PrinterIcon className="w-5 h-5" />Open / Print</button></div>{isStaffMode && !viewingHistoryBill && <button onClick={handleCompletePayment} disabled={isSaving} className="w-full py-3 bg-charcoal text-white font-bold rounded-xl shadow-lg hover:bg-black transition-colors disabled:opacity-50">{isSaving ? "Processing..." : t.completePayment}</button>}</div>
              </div>
          </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 100 }}>
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                 <div className="bg-white p-4 flex justify-between items-center border-b border-gray-200">
                    <h3 className="text-xl font-serif font-bold text-charcoal flex items-center gap-2">
                        <ReceiptIcon className="w-6 h-6 text-gold-leaf" />
                        {t.recentTransactions}
                    </h3>
                    <button onClick={() => setShowHistoryModal(false)} className="text-charcoal/60 hover:text-charcoal">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                 <div className="p-4 overflow-y-auto flex-grow bg-white custom-scrollbar">
                    {isLoadingHistory ? (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-leaf mx-auto mb-4"></div>
                            <p className="text-sm text-gray-500">Syncing with Firebase...</p>
                        </div>
                    ) : recentTransactions.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <ReceiptIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                            <p>No recent transactions found today.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {recentTransactions.map((tx, index) => {
                                const sydneyDate = formatDateSydney(tx.date);
                                // Use actual ticket number if available, otherwise fallback to sequential order number (A01, A02, etc.)
                                const displayNumber = tx.ticketNumber || `A${String(index + 1).padStart(2, '0')}`;
                                return (
                                    <div 
                                        key={tx.id} 
                                        onClick={() => handleViewHistoryItem(tx)} 
                                        className="flex items-start gap-3 py-3 cursor-pointer group hover:bg-gray-50 px-2 rounded-lg transition-colors"
                                    >
                                        {/* Order Number */}
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold-leaf/10 flex items-center justify-center">
                                            <span className="text-xs font-bold text-gold-leaf">{displayNumber}</span>
                                        </div>
                                        
                                        {/* Transaction Details */}
                                        <div className="flex-grow">
                                            <p className="font-bold text-charcoal text-base group-hover:text-gold-leaf transition-colors">
                                                ${tx.total.toFixed(2)}
                                                {tx.customerName && (
                                                    <span className="ml-2 font-normal text-gray-500 text-sm">- {tx.customerName}</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-charcoal/50 mt-1">{sydneyDate.time}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">
                                                {tx.items.length} items {tx.discountPercentage ? `(-${tx.discountPercentage}%)` : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {showCustomerEntry && isStaffMode && (
         <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" style={{ zIndex: 110 }}>
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[90vh] relative" ref={entryModalRef}>
                  <button onClick={() => setShowCustomerEntry(false)} className="absolute top-4 right-4 text-charcoal/50 hover:text-charcoal z-20"><XMarkIcon className="w-6 h-6" /></button>
                  <div className="p-6 overflow-y-auto custom-scrollbar">
                      <div className="text-center mb-6 mt-2">
                        {tempIsVip && tempVipDays !== null && (
                            <div className="bg-gold-leaf text-white px-4 py-2 rounded-full text-[10px] font-bold mb-4 animate-pulse flex items-center justify-center gap-2 uppercase tracking-wider">
                                <StarIcon className="w-3 h-3" filled />
                                VIP MEMBER: {tempVipDays} DAYS LEFT
                            </div>
                        )}
                        <h3 className="text-2xl font-serif font-bold text-charcoal">{entryMode === 'new' ? (showWaitlistAddModal ? 'Join Waitlist' : 'New Customer') : 'Customer Info'}</h3>
                      </div>
                      <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-gold-leaf font-bold uppercase text-xs tracking-widest"><PhoneIcon className="w-4 h-4" /> Phone Number</label>
                                <input 
                                    type="tel" 
                                    value={tempCustomerPhone} 
                                    onChange={handleTempPhoneChange} 
                                    className="w-full bg-white border-b-2 border-dusty-rose/30 px-2 py-3 text-xl font-serif text-charcoal focus:outline-none focus:border-gold-leaf transition-colors placeholder:text-gray-300" 
                                    placeholder="04xx xxx xxx" 
                                    autoFocus 
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <label className="flex items-center gap-2 text-gold-leaf font-bold uppercase text-xs tracking-widest"><UserIcon className="w-4 h-4" /> Name</label>
                                <input 
                                    type="text" 
                                    value={tempCustomerName} 
                                    onChange={handleTempNameChange} 
                                    className="w-full bg-white border-b-2 border-dusty-rose/30 px-2 py-3 text-xl font-serif text-charcoal focus:outline-none focus:border-gold-leaf transition-colors placeholder:text-gray-300" 
                                    placeholder="Name..." 
                                />
                                {showSuggestions && <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gold-leaf/20 z-50 max-h-40 overflow-y-auto text-left" ref={suggestionsRef}>{customerSuggestions.map(cust => <button key={cust.id} onClick={() => handleSelectCustomerSuggestion(cust)} className="w-full px-4 py-3 text-sm text-charcoal hover:bg-gold-leaf/10 border-b border-gray-100 last:border-0 flex justify-between items-center group"><span className="font-bold group-hover:text-gold-leaf">{cust.name}</span><span className="text-xs text-gray-500">{cust.phone}</span></button>)}</div>}
                            </div>
                            <div className="space-y-2"><label className="flex items-center gap-2 text-gold-leaf font-bold uppercase text-xs tracking-widest"><BriefcaseIcon className="w-4 h-4" /> Notes</label><input type="text" value={tempCustomerNotes} onChange={(e) => setTempCustomerNotes(e.target.value)} className="w-full bg-white border-b-2 border-dusty-rose/30 px-2 py-3 text-lg font-serif text-charcoal focus:outline-none focus:border-gold-leaf transition-colors placeholder:text-gray-300" placeholder="Preferences..." /></div>
                            {showWaitlistAddModal && <><div className="space-y-2"><label className="flex items-center gap-2 text-gold-leaf font-bold uppercase text-xs tracking-widest"><ClockIcon className="w-4 h-4" /> Estimated Return Time</label><input type="text" value={tempReturnTime} onChange={(e) => setTempReturnTime(e.target.value)} className="w-full bg-white border-b-2 border-dusty-rose/30 px-2 py-3 text-xl font-serif text-charcoal focus:outline-none focus:border-gold-leaf transition-colors placeholder:text-gray-300" placeholder="e.g. 10 mins" /></div><div className="space-y-2"><label className="flex items-center gap-2 text-gold-leaf font-bold uppercase text-xs tracking-widest"><SparklesIcon className="w-4 h-4" /> What would you like to do?</label><button onClick={() => setShowServiceSelector(true)} className="w-full bg-white border-b-2 border-dusty-rose/30 px-2 py-3 text-left focus:outline-none focus:border-gold-leaf transition-colors flex justify-between items-center group"><span className={`text-lg font-serif ${tempSelectedServices.length > 0 ? 'text-charcoal' : 'text-gray-300'}`}>{tempSelectedServices.length > 0 ? `${tempSelectedServices.length} services selected` : 'Select Services...'}</span><span className="text-xs bg-gold-leaf/10 text-gold-leaf px-2 py-1 rounded-full group-hover:bg-gold-leaf group-hover:text-white transition-colors">{tempSelectedServices.length > 0 ? 'Edit' : 'Add'}</span></button>{tempSelectedServices.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{tempSelectedServices.map(s => <span key={s} className="bg-gold-leaf/10 text-charcoal text-xs px-2 py-1 rounded-full border border-gold-leaf/20 flex items-center gap-1">{s}<button onClick={() => setTempSelectedServices(prev => prev.filter(item => item !== s))} className="hover:text-red-500 ml-1"><XMarkIcon className="w-3 h-3"/></button></span>)}</div>}</div></>}
                      </div>
                      {!showWaitlistAddModal && (
                          <button 
                              onClick={handlePrintTicket} 
                              className="w-full mt-8 bg-white border-2 border-charcoal text-charcoal font-bold py-4 rounded-xl shadow-lg hover:bg-charcoal hover:text-white transition-colors text-lg flex items-center justify-center gap-2"
                          >
                              <ReceiptIcon className="w-5 h-5" /> Print Ticket
                          </button>
                      )}
                      <button onClick={showWaitlistAddModal ? handleAddToWaitlist : handleSaveCustomerEntry} className="w-full mt-4 bg-charcoal text-white font-bold py-4 rounded-xl shadow-lg hover:bg-black transition-colors text-lg">{showWaitlistAddModal ? 'Add to Waitlist' : 'Save Customer'}</button>
                  </div>
              </div>
         </div>
      )}

      {showServiceSelector && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl flex flex-col max-h-[70vh]">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-charcoal">Select Services</h3><div className="text-right"><p className="text-xs text-gray-500 uppercase font-bold">Total</p><p className="text-lg font-bold text-gold-leaf">${waitlistEstimatedTotal.toFixed(2)}</p></div></div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">{pricingData.map(cat => <div key={cat.categoryKey}><p className="text-xs font-bold text-gray-400 uppercase mb-2 mt-2">{t.serviceCategories[cat.categoryKey] || cat.categoryKey}</p><div className="space-y-1">{cat.services.map(svc => { const svcName = svc.displayName || t.serviceNames[svc.nameKey] || svc.nameKey; const isSelected = tempSelectedServices.includes(svcName); return <button key={svcName} onClick={() => setTempSelectedServices(prev => isSelected ? prev.filter(s => s !== svcName) : [...prev, svcName])} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center transition-colors ${isSelected ? 'bg-gold-leaf/10 text-charcoal font-bold border border-gold-leaf/30' : 'hover:bg-gray-50 text-gray-600 border border-transparent'}`}><span>{svcName}</span>{isSelected && <span className="text-gold-leaf font-bold">✓</span>}</button>; })}</div></div>)}</div>
                  <div className="p-4 border-t border-gray-100"><button onClick={() => setShowServiceSelector(false)} className="w-full bg-gold-leaf text-white font-bold py-3 rounded-xl shadow-md hover:bg-charcoal transition-colors">Done ({tempSelectedServices.length})</button></div>
              </div>
          </div>
      )}

      {showStaffModal && (
          <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 60 }}>
              <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto custom-scrollbar">
                  <button onClick={() => { setShowStaffModal(false); setPendingService(null); setEditingIds([]); setIsSplitMode(false); }} className="absolute top-4 right-4 text-gray-400 hover:text-charcoal"><XMarkIcon className="w-6 h-6" /></button>
                  <div className="flex justify-center mb-4"><button onClick={() => { SoundManager.playTap(); setIsSplitMode(!isSplitMode); }} className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${isSplitMode ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'}`}><UsersIcon className="w-4 h-4" />{isSplitMode ? 'Cancel Split' : 'Split / Share'}</button></div>
                  <h3 className="text-xl font-serif font-bold text-center mb-2 text-charcoal">{isSplitMode ? 'Split Service' : 'Who performed this?'}</h3>
                  {pendingService && <div className="bg-gray-50 p-3 rounded-xl mb-4 text-center border border-gray-100"><p className="text-charcoal font-bold">{pendingService.displayName || t.serviceNames[pendingService.nameKey] || pendingService.nameKey}</p><p className="text-sm text-gold-leaf font-bold">{pendingService.price}</p></div>}
                  {isSplitMode && (
                      <div className="space-y-4 mb-4">
                          <div className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${activeSplitSlot === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onClick={() => setActiveSplitSlot(1)}><div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-gray-500 uppercase">Staff 1</span>{splitStaff1 ? <div className="flex items-center gap-2"><span className="font-bold text-charcoal">{splitStaff1.name}</span>{splitStaff1.avatar && <img src={splitStaff1.avatar} className="w-6 h-6 rounded-full object-cover" />}</div> : <span className="text-xs text-red-400 italic">Select below</span>}</div><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span><input type="number" value={splitAmount1} onChange={(e) => handleSplitAmountChange(e.target.value, 1)} className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 font-bold text-right" placeholder="0.00" /></div></div>
                          <div className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${activeSplitSlot === 2 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onClick={() => setActiveSplitSlot(2)}><div className="flex justify-between items-center mb-2"><span className="text-xs font-bold text-gray-500 uppercase">Staff 2</span>{splitStaff2 ? <div className="flex items-center gap-2"><span className="font-bold text-charcoal">{splitStaff2.name}</span>{splitStaff2.avatar && <img src={splitStaff2.avatar} className="w-6 h-6 rounded-full object-cover" />}</div> : <span className="text-xs text-red-400 italic">Select below</span>}</div><div className="relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span><input type="number" value={splitAmount2} onChange={(e) => handleSplitAmountChange(e.target.value, 2)} className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 font-bold text-right" placeholder="0.00" /></div></div>
                          <button onClick={handleConfirmSplit} disabled={!splitStaff1 || !splitStaff2} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">Confirm Split</button>
                      </div>
                  )}
                  <div className="grid grid-cols-3 gap-3">{staffList.map((staff) => <button key={staff.id} onClick={() => handleStaffSelect(staff)} className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gold-leaf transition-all group"><div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 mb-2 group-hover:border-gold-leaf transition-colors bg-gray-100 relative">{staff.avatar ? <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><UserIcon className="w-6 h-6" /></div>}</div><span className="text-xs font-bold text-charcoal group-hover:text-gold-leaf text-center leading-tight">{staff.name}</span></button>)}</div>
              </div>
          </div>
      )}
    </div>

    {/* Printable Ticket Area (similar to KioskView) */}
    <div ref={ticketRef} className="printable-area hidden" style={{ width: '400px', margin: '0 auto', padding: '20px', backgroundColor: 'white', color: 'black' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px dashed black', paddingBottom: '15px', marginBottom: '20px' }}>
            <h1 style={{ fontSize: '28px', margin: '0', fontWeight: 'bold' }}>LA PERLA</h1>
            <p style={{ fontSize: '10px', margin: '5px 0', letterSpacing: '2px' }}>QUEUE TICKET</p>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontSize: '10px', fontWeight: 'bold', margin: '0' }}>YOUR NUMBER</p>
            <h2 style={{ fontSize: '80px', margin: '0', fontWeight: 'bold', fontFamily: 'monospace' }}>{generatedTicket || '---'}</h2>
        </div>

        <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '10px', marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '12px', margin: '0', fontWeight: 'bold' }}>Customer</p>
                <p style={{ fontSize: '18px', margin: '0' }}>{tempIsVip ? '★ ' : ''}{tempCustomerName || 'Guest'}</p>
            </div>
            <div style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '12px', margin: '0', fontWeight: 'bold' }}>Time</p>
                <p style={{ fontSize: '14px', margin: '0' }}>{new Date().toLocaleDateString('en-AU')} {new Date().toLocaleTimeString('en-AU', {hour: '2-digit', minute:'2-digit'})}</p>
            </div>
            {tempCustomerNotes && (
                <div style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '12px', margin: '0', fontWeight: 'bold' }}>Notes</p>
                    <p style={{ fontSize: '12px', margin: '0' }}>{tempCustomerNotes}</p>
                </div>
            )}
        </div>

        <div style={{ textAlign: 'center', borderTop: '2px dashed black', paddingTop: '15px', fontSize: '10px' }}>
            <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontStyle: 'italic', lineHeight: '1.4' }}>
                Please wait for your number to be called. Our staff will consult with you about services.
            </p>
            <p style={{ margin: '5px 0' }}>Thank you for visiting La Perla Nails & Beauty!</p>
            <p style={{ fontSize: '8px', color: '#999', marginTop: '10px' }}>Powered by La Perla Stylist AI</p>
        </div>
    </div>

    <div ref={receiptRef} className="printable-area hidden" style={{ width: '500px', padding: '40px', backgroundColor: 'white', color: 'black', fontFamily: 'serif', boxSizing: 'border-box' }}>
        <div className="text-center mb-8 border-b-2 border-black pb-4"><h1 className="text-4xl font-bold uppercase tracking-widest mb-2">LA PERLA</h1><p className="text-sm font-sans uppercase tracking-wider">Nails & Beauty</p><p className="text-xs mt-2 font-sans text-gray-600">Shop 10/260 Jersey Rd, Plumpton NSW 2761</p><p className="text-xs font-sans text-gray-600">(02) 9625 8194</p></div>
        <div className="flex justify-between items-end mb-8 font-sans"><div><p className="text-xs font-bold uppercase text-gray-500">Bill To:</p><p className="text-lg font-bold">{isVip ? '★ ' : ''}{customerName || 'Guest'}</p>{customerPhone && <p className="text-sm">{customerPhone}</p>}</div><div className="text-right"><p className="text-sm">Date: {billDateString}</p>{currentBillId && <p className="text-xs text-gray-400 mt-1">Ref: {currentBillId.slice(-6)}</p>}</div></div>
        <div className="mb-8"><table className="w-full text-left font-sans text-sm"><thead className="border-b-2 border-black"><tr><th className="py-2 w-12">Qty</th><th className="py-2">Description</th><th className="py-2 text-right w-24">Price</th><th className="py-2 text-right w-24">Amount</th></tr></thead><tbody className="divide-y divide-gray-200">{groupedCartItems.map((item, i) => <tr key={i}><td className="py-3 align-top">{item.quantity}</td><td className="py-3 align-top"><p className="font-bold">{item.displayName || t.serviceNames[item.nameKey] || item.nameKey}</p>{item.staffName && <p className="text-xs text-gray-500 italic">Stylist: {item.staffName}</p>}</td><td className="py-3 align-top text-right">${item.price.toFixed(2)}</td><td className="py-3 align-top text-right font-bold">${(item.price * item.quantity).toFixed(2)}</td></tr>)}</tbody></table></div>
        <div className="flex justify-end mb-12"><div className="w-1/2 border-t border-black pt-4 font-sans"><div className="flex justify-between text-sm mb-2"><span className="font-bold text-gray-600">Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>{discountPercentage > 0 && <div className="flex justify-between text-sm mb-2 text-gray-600"><span>Discount ({discountPercentage}%)</span><span>-${discountAmount.toFixed(2)}</span></div>}<div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t border-gray-300"><span>Total : </span><span>${finalTotal.toFixed(2)}</span></div>
                {parseFloat(cashTendered || '0') > 0 && <div className="mt-4 pt-2 border-t border-dashed border-gray-300 text-sm"><div className="flex justify-between mb-1"><span className="text-gray-600">Cash Tendered</span><span>${parseFloat(cashTendered).toFixed(2)}</span></div><div className="flex justify-between font-bold"><span>Change Due</span><span>${changeDue >= 0 ? changeDue.toFixed(2) : '0.00'}</span></div></div>}
            </div></div>
        <div className="text-center mt-8 pt-8 border-t border-gray-200 font-sans text-xs text-gray-500"><p className="mt-1">----------</p><p className="font-bold text-sm text-black mb-2">Thank you for visiting La Perla!</p><p>Please retain this invoice for your records.</p></div>
    </div>
    </>
  );
};
