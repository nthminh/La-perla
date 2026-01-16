
import React, { Component, useState, useRef, useEffect, ErrorInfo, ReactNode } from 'react';
import { generateNailArt } from './services/geminiService'; // Use standard service
import { PricingView } from './components/PricingView';
import { GalleryView } from './components/GalleryView';
import { PortfolioView } from './components/PortfolioView';
import { BookingView } from './components/BookingView';
import { AdminView } from './components/AdminView';
import { KioskView } from './components/KioskView';
import { EntryGate } from './components/EntryGate'; 
import { StaffPortalView } from './components/StaffPortalView'; 
import { ArtistsView } from './components/ArtistsView'; 
import PromotionsView from './components/PromotionsView';
import { ChatWidget } from './components/ChatWidget';
import { UploadIcon, SparklesIcon, PriceTagIcon, GalleryIcon, CameraIcon, DownloadIcon, BriefcaseIcon, CalendarIcon, GiftIcon, LaPerlaLogo, LockIcon, UsersIcon, CloudCheckIcon, CloudSyncIcon, CloudErrorIcon, XMarkIcon } from './components/Icons';
import { TRANSLATIONS, Translation } from './translations';
import { CartItem, ActiveBill, WaitlistEntry, ServiceCategory, StaffProfile, Review, BookingRequest, GlobalPayrollSettings, Transaction, AdminPasswords, MarqueeSettings } from './types';
import { PRICING_DATA as DEFAULT_PRICING, DEFAULT_STAFF_PROFILES, DEFAULT_GLOBAL_PAYROLL, DEFAULT_ADMIN_PASSWORDS, DEFAULT_MARQUEE_SETTINGS } from './constants';
import { logger } from './utils/logger';
// Removed redundant googleSheetsService imports
import { 
    getWaitlist, 
    saveWaitlist,
    getBookings,
    saveBookings,
    getActiveBills,
    saveActiveBills,
    getCurrentBillId,
    saveCurrentBillId,
    getCurrentUser,
    saveCurrentUser,
    clearCurrentUser,
    getTransactions
} from './services/storageService';
import { subscribeToSystemState, subscribeToSettings, updateStaffPresence, saveSettingsToFirebase, saveTransactionToFirebase, upsertBooking, deleteBooking, fetchTransactionsOnce, fetchTransactionsByDateRangeIncludingDeleted } from './services/firebaseService';
import { clearFirebaseConfigLocally } from './services/firebaseConfig';
import { SoundManager } from './utils/sound';

type View = 'stylist' | 'pricing' | 'gallery' | 'portfolio' | 'booking' | 'promotions' | 'admin' | 'kiosk' | 'portal' | 'team';
type AppMode = 'gate' | 'app'; 

const DAILY_LIMIT = 10;
const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 60 Minutes
const FIREBASE_CONNECTION_TIMEOUT_MS = 10000; // 10 seconds

// --- ERROR BOUNDARY COMPONENT ---
interface ErrorBoundaryProps {
    children?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false,
        error: null
    };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error("Uncaught error", { error, errorInfo });
    }

    handleReset = () => {
        clearFirebaseConfigLocally();
        localStorage.removeItem('la_perla_active_bills');
        localStorage.removeItem('la_perla_current_bill_id');
        localStorage.removeItem('la_perla_current_user');
        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-pearl-white p-6 text-center font-sans">
                    <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 max-w-md w-full">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h2 className="text-2xl font-bold text-charcoal mb-2">App Error</h2>
                        <p className="text-gray-500 mb-4 text-sm">
                            Don't worry, your connection is fine. Just a small data conflict.
                        </p>
                        <div className="bg-gray-50 p-3 rounded-lg text-xs text-left font-mono text-red-600 mb-6 overflow-auto max-h-32 border border-gray-200">
                            {this.state.error?.message || "Unknown Error"}
                        </div>
                        <button 
                            onClick={this.handleReset}
                            className="w-full py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-md flex items-center justify-center gap-2"
                        >
                            Reset Data & Try Again
                        </button>
                    </div>
                </div>
            );
        }

        // Use type assertion to avoid TS error 'Property props does not exist'
        return (this as any).props.children || null;
    }
}

// NavButton Component
const NavButton: React.FC<{
  view: View;
  icon: React.ReactNode;
  label: string;
  currentView: View;
  onClick: (view: View) => void;
}> = ({ view, icon, label, currentView, onClick }) => (
  <button
    onClick={() => {
        SoundManager.playTap();
        onClick(view);
    }}
    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-sans text-sm md:text-base flex-shrink-0 ${
      currentView === view
        ? 'bg-gold-leaf text-white shadow-md'
        : 'bg-pearl-white/60 text-charcoal hover:bg-pearl-white'
    }`}
  >
    {icon}
    {label}
  </button>
);

// Stylist View Component
const StylistView: React.FC<any> = (props) => {
    const { 
        t, stylePrompt, setStylePrompt, userImage, generatedImage, isLoading, error, 
        fileInputRef, cameraInputRef, handleFileChange, triggerFileSelect, triggerCameraSelect, 
        reset, handleDownload, generationsToday, dailyLimit 
    } = props;

    const limitReached = generationsToday >= dailyLimit;
    const [isHoldingCompare, setIsHoldingCompare] = useState(false);

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center p-4">
            {!userImage && (
                <div className="text-center w-full flex flex-col items-center">
                    <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-2">{t.stylistTitle}</h2>
                    <p className="text-charcoal/80 mb-6 max-w-xl font-sans">
                        {t.stylistSubtitle}
                    </p>

                    <div className="w-full max-w-lg mb-6">
                      <label htmlFor="style-prompt" className="block text-center text-charcoal/90 font-sans font-medium mb-2">
                          {t.customPromptLabel}
                      </label>
                      <textarea
                          id="style-prompt"
                          value={stylePrompt}
                          onChange={(e) => setStylePrompt(e.target.value)}
                          placeholder={t.customPromptPlaceholder}
                          className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-white text-charcoal focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf transition-shadow duration-300 shadow-inner resize-none font-sans"
                          rows={3}
                          disabled={limitReached}
                      />
                    </div>
                    
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} className="hidden" />
                    <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} onClick={(e) => { (e.target as HTMLInputElement).value = ''; }} className="hidden" />

                    {limitReached ? (
                        <div className="text-center p-6 bg-blush-pink/80 border border-dusty-rose text-charcoal rounded-2xl shadow-md w-full max-w-lg">
                            <p className="font-serif text-xl font-bold">{t.dailyLimitReachedTitle}</p>
                            <p className="font-sans mt-1">{t.dailyLimitReachedSubtitle}</p>
                        </div>
                    ) : (
                       <>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={triggerFileSelect} className="bg-dusty-rose text-white font-sans font-medium py-3 px-6 rounded-full shadow-lg hover:bg-gold-leaf transition-transform transform hover:scale-105 duration-300 flex items-center justify-center gap-3">
                                <UploadIcon className="w-6 h-6"/>
                                {t.uploadPhotoButton}
                            </button>
                            <button onClick={triggerCameraSelect} className="bg-pearl-white text-charcoal font-sans font-medium py-3 px-6 rounded-full shadow-lg hover:bg-gold-leaf hover:text-white transition-all transform hover:scale-105 duration-300 flex items-center justify-center gap-3 border border-dusty-rose/50">
                                <CameraIcon className="w-6 h-6"/>
                                {t.useCameraButton}
                            </button>
                        </div>
                         <p className="text-charcoal/70 mt-4 font-sans text-sm">
                            {t.generationsRemaining.replace('{count}', (dailyLimit - generationsToday).toString())}
                        </p>
                       </>
                    )}
                </div>
            )}

            {isLoading && (
                <div className="text-center p-8 bg-pearl-white/80 rounded-2xl shadow-lg">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gold-leaf mx-auto"></div>
                    <p className="mt-4 font-serif text-xl text-charcoal">{t.creatingTitle}</p>
                    <p className="font-sans text-charcoal/70">{t.creatingSubtitle}</p>
                </div>
            )}

            {error && (
                <div className="text-center p-6 bg-red-100 border border-red-400 text-red-700 rounded-2xl shadow-md">
                    <p className="font-bold">{t.errorTitle}</p>
                    <p>{error}</p>
                    <button onClick={reset} className="mt-4 bg-red-500 text-white font-sans py-2 px-6 rounded-full hover:bg-red-600 transition-colors">{t.tryAgainButton}</button>
                </div>
            )}

            {generatedImage && userImage && (
                 <div className="w-full flex flex-col items-center animate-fade-in-up">
                    <h3 className="font-serif text-2xl md:text-3xl text-gold-leaf mb-6 flex items-center gap-2">
                        {isHoldingCompare ? t.yourPhotoTitle : t.aiSuggestionTitle}
                    </h3>
                    
                    <div 
                        className="relative w-full max-w-lg aspect-square rounded-3xl shadow-2xl overflow-hidden cursor-pointer touch-none select-none border-4 border-white/50 ring-1 ring-gold-leaf/30"
                        onMouseDown={() => setIsHoldingCompare(true)}
                        onMouseUp={() => setIsHoldingCompare(false)}
                        onMouseLeave={() => setIsHoldingCompare(false)}
                        onTouchStart={() => setIsHoldingCompare(true)}
                        onTouchEnd={() => setIsHoldingCompare(false)}
                        onTouchCancel={() => setIsHoldingCompare(false)}
                        onContextMenu={(e) => e.preventDefault()} 
                    >
                        <img 
                            src={isHoldingCompare ? userImage : generatedImage} 
                            alt="Nail Design" 
                            className="w-full h-full object-cover transition-opacity duration-200" 
                            draggable={false}
                        />

                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/20 shadow-lg pointer-events-none">
                            {isHoldingCompare ? "ORIGINAL" : "AI DESIGN"}
                        </div>

                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none w-full text-center px-4">
                            <div className="bg-white/90 backdrop-blur text-charcoal px-6 py-2 rounded-full shadow-lg inline-flex items-center gap-2 text-sm font-bold tracking-wide animate-pulse">
                                <SparklesIcon className="w-4 h-4 text-gold-leaf" />
                                HOLD TO COMPARE
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-8 space-y-4">
                         <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button onClick={reset} className="bg-dusty-rose text-white font-sans font-medium py-3 px-8 rounded-full shadow-lg hover:bg-gold-leaf transition-transform transform hover:scale-105 duration-300 flex items-center gap-3 justify-center">
                                <UploadIcon className="w-6 h-6"/>
                                {t.tryAnotherPhotoButton}
                            </button>
                            <button onClick={handleDownload} className="bg-pearl-white text-charcoal font-sans font-medium py-3 px-8 rounded-full shadow-lg hover:bg-gold-leaf hover:text-white transition-all transform hover:scale-105 duration-300 flex items-center justify-center gap-3 border border-dusty-rose/50">
                               <DownloadIcon className="w-6 h-6" />
                               {t.downloadButton}
                           </button>
                        </div>
                         <p className="text-charcoal/70 font-sans text-sm">
                            {t.generationsRemaining.replace('{count}', (dailyLimit - generationsToday).toString())}
                        </p>
                    </div>
                 </div>
            )}
        </div>
    );
};

// Main App Logic
const MainApp: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('gate'); 
  // PERSISTENCE CHANGE: Init view from localStorage or default to 'pricing'
  const [view, setView] = useState<View>(() => {
      try {
          const saved = localStorage.getItem('la_perla_current_view');
          return (saved as View) || 'pricing';
      } catch {
          return 'pricing';
      }
  });

  const [userImage, setUserImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stylePrompt, setStylePrompt] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [generationsToday, setGenerationsToday] = useState(0);

  // Dynamic Settings
  const [staffList, setStaffList] = useState<StaffProfile[]>(DEFAULT_STAFF_PROFILES);
  const [pricingData, setPricingData] = useState<ServiceCategory[]>(DEFAULT_PRICING);
  const [globalPayroll, setGlobalPayroll] = useState<GlobalPayrollSettings>(DEFAULT_GLOBAL_PAYROLL);
  const [knowledgeBase, setKnowledgeBase] = useState<string>("");
  const [adminPasswords, setAdminPasswords] = useState<AdminPasswords>(DEFAULT_ADMIN_PASSWORDS);
  const [marqueeSettings, setMarqueeSettings] = useState<MarqueeSettings>(DEFAULT_MARQUEE_SETTINGS);

  // Active Bills State - Default to EMPTY ARRAY to fix "Tap to Name" issue
  const [activeBills, setActiveBills] = useState<ActiveBill[]>(() => {
    try {
        const saved = getActiveBills();
        return Array.isArray(saved) && saved.length > 0 
            ? saved 
            : []; 
    } catch {
        return []; 
    }
  });

  // Client-Side Customer Cache for Kiosk Recognition
  const [customerLookupData, setCustomerLookupData] = useState<Transaction[]>([]);

  const [currentBillId, setCurrentBillId] = useState<string>(() => {
      try {
        const savedId = getCurrentBillId();
        const savedBills = getActiveBills();
        if (savedId && Array.isArray(savedBills) && savedBills.some(b => b.id === savedId)) {
            return savedId;
        }
        return Array.isArray(savedBills) && savedBills.length > 0 ? savedBills[0].id : '';
      } catch {
        return '';
      }
  });

  const [isBillOpen, setIsBillOpen] = useState(false);
  
  // Waitlist State
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  
  // Booking State
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  
  // Active Staff State
  const [activeStaffIds, setActiveStaffIds] = useState<string[]>([]);

  // --- SAFETY LOCK STATE (CRITICAL) ---
  const [isSystemReady, setIsSystemReady] = useState(false);
  
  const lastSyncedState = useRef<string>("");
  const [isConnected, setIsConnected] = useState(false);

  // --- AUTO SYNC STATE ---
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
      [DEFAULT_PRICING[0].categoryKey]: true
  });

  const [autoDownloadTrigger, setAutoDownloadTrigger] = useState(false);

  // --- UPDATE MANAGEMENT ---
  const localAppVersion = useRef<number>(0);
  const lastInteractionTime = useRef<number>(Date.now());

  // Staff User State
  const [currentUser, setCurrentUser] = useState<StaffProfile | null>(() => {
      return getCurrentUser();
  });

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
        setAppMode('app');
        updateStaffPresence(user.id, true);
    }
  }, []);

  // PERSISTENCE CHANGE: Save View state on change
  useEffect(() => {
      localStorage.setItem('la_perla_current_view', view);
  }, [view]);

  // --- API KEY VERIFICATION LOG ---
  useEffect(() => {
      const key = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;
      if (key) {
          // Verify Key in Console (Safe Masking)
          console.log(`%c 🔑 GEMINI API KEY ACTIVE: ${key.substring(0, 8)}...${key.substring(key.length - 4)}`, 'background: #222; color: #bada55; font-size: 12px; padding: 4px; border-radius: 4px;');
      } else {
          console.error("%c ❌ GEMINI API KEY MISSING", 'background: #red; color: #white; font-size: 12px; padding: 4px;');
      }
  }, []);

  // --- IDLE TIMER (PERIODIC AUTO-REFRESH) ---
  useEffect(() => {
      const updateInteraction = () => {
          lastInteractionTime.current = Date.now();
      };

      // Listen for any user activity
      window.addEventListener('mousemove', updateInteraction);
      window.addEventListener('touchstart', updateInteraction);
      window.addEventListener('keydown', updateInteraction);
      window.addEventListener('click', updateInteraction);

      // Check for idleness every 60 seconds
      const idleCheckInterval = setInterval(() => {
          const timeSinceInteraction = Date.now() - lastInteractionTime.current;
          // If idle for more than 1 hour (IDLE_TIMEOUT_MS) and NOT waiting for payment
          if (timeSinceInteraction > IDLE_TIMEOUT_MS && !isBillOpen) {
              console.log("App idle for too long. Auto-refreshing for health check.");
              window.location.reload();
          }
      }, 60000);

      return () => {
          window.removeEventListener('mousemove', updateInteraction);
          window.removeEventListener('touchstart', updateInteraction);
          window.removeEventListener('keydown', updateInteraction);
          window.removeEventListener('click', updateInteraction);
          clearInterval(idleCheckInterval);
      };
  }, [isBillOpen]);

  // --- UPDATED: REFRESH DATA FOR KIOSK RECOGNITION ---
  useEffect(() => {
      const fetchLookup = async () => {
          // 1. Get Local Data (Fastest)
          const localTxs = getTransactions();
          setCustomerLookupData(localTxs);

          // 2. Fetch Cloud Data (Deep history for VIP check)
          // Fetch last 500 transactions instead of default 50 to ensure we find Yearly Membership purchases
          if (!isGuest) {
              const cloudTxs = await fetchTransactionsOnce(1000); 
              if (cloudTxs && cloudTxs.length > 0) {
                  setCustomerLookupData(cloudTxs);
              }
          }
      };

      // Refresh history data whenever we are in Kiosk mode or switcher views
      fetchLookup();
  }, [isGuest, view]);

  const handleLogin = (user: StaffProfile) => {
      SoundManager.playSuccess();
      setCurrentUser(user);
      saveCurrentUser(user);
      setAppMode('app');
      updateStaffPresence(user.id, true);
  };

  const handleLogout = () => {
      if (currentUser) {
          updateStaffPresence(currentUser.id, false);
      }
      setCurrentUser(null);
      clearCurrentUser();
      setAppMode('gate'); 
      // PERSISTENCE CHANGE: Reset view to pricing on logout
      setView('pricing'); 
      localStorage.removeItem('la_perla_current_view');
  };

  const handleClientEnter = () => {
      SoundManager.playTap();
      setCurrentUser(null);
      clearCurrentUser();
      setAppMode('app');
  };

  const handleUpdateStaffProfile = (updatedProfile: StaffProfile) => {
      const updatedList = staffList.map(s => s.id === updatedProfile.id ? updatedProfile : s);
      setStaffList(updatedList);
      
      if (currentUser && currentUser.id === updatedProfile.id) {
          setCurrentUser(updatedProfile);
          saveCurrentUser(updatedProfile);
      }
      saveSettingsToFirebase(updatedList, pricingData, globalPayroll, knowledgeBase, adminPasswords, marqueeSettings);
  };

  const handleStaffReview = (staffId: string, reviewData: { rating: number, badges: string[], comment?: string, customerName?: string }) => {
      const updatedList = staffList.map(staff => {
          if (staff.id === staffId) {
              const currentReviews = staff.reviews || [];
              const newReview: Review = {
                  id: Date.now().toString(),
                  rating: reviewData.rating,
                  badges: reviewData.badges,
                  comment: reviewData.comment,
                  customerName: reviewData.customerName,
                  date: new Date().toISOString()
              };
              const newReviews = [newReview, ...currentReviews];
              const sum = newReviews.reduce((acc, r) => acc + r.rating, 0);
              const avg = sum / newReviews.length;
              return { ...staff, reviews: newReviews, rating: avg };
          }
          return staff;
      });
      setStaffList(updatedList);
      saveSettingsToFirebase(updatedList, pricingData, globalPayroll, knowledgeBase, adminPasswords, marqueeSettings);
      alert("Thank you for your feedback!");
  };
  
  const handleSubmitBooking = (bookingData: BookingRequest) => {
      const newBookings = [bookingData, ...bookings];
      setBookings(newBookings);
      upsertBooking(bookingData);
  };
  
  const handleUpdateBookingStatus = (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
      const updatedBookings = bookings.map(b => {
          if (b.id === id) {
              const updated = { ...b, status };
              upsertBooking(updated);
              return updated;
          }
          return b;
      });
      setBookings(updatedBookings);
  };

  const handleDeleteBooking = (id: string) => {
      const newBookings = bookings.filter(b => b.id !== id);
      setBookings(newBookings);
      deleteBooking(id);
  };

  const t = TRANSLATIONS.en;

  // --- INITIAL LOAD & BACKGROUND SYNC ---
  useEffect(() => {
     // Load Daily Limit
     const savedData = localStorage.getItem('laPerlaUsage');
     if (savedData) {
        try {
            const { date, count } = JSON.parse(savedData);
            const today = new Date().toISOString().slice(0, 10);
            if (date === today) {
                setGenerationsToday(count);
            } else {
                localStorage.removeItem('laPerlaUsage');
            }
        } catch {
             localStorage.removeItem('laPerlaUsage');
        }
    }

    // Load Local Data (Fallback)
    try {
        const savedWaitlist = getWaitlist();
        if (Array.isArray(savedWaitlist) && savedWaitlist.length > 0) setWaitlist(savedWaitlist);
        const savedBookings = getBookings();
        if (Array.isArray(savedBookings) && savedBookings.length > 0) setBookings(savedBookings);
    } catch {}
  }, []);

  // --- BACKGROUND SYNC JOB ---
  useEffect(() => {
      if (isGuest) return;

      const runSync = async () => {
          setSyncStatus('syncing');
          try {
              const localTxs = getTransactions();
              
              // STEP 1: Push local transactions to Firebase (Upload sync)
              // Only sync transactions from last 48 hours to save bandwidth
              const twoDaysAgo = new Date();
              twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
              const recentTxs = localTxs.filter(tx => new Date(tx.date) > twoDaysAgo);

              let hasError = false;
              for (const tx of recentTxs) {
                  // Skip already-deleted transactions (don't re-sync them)
                  if (tx.deleted) continue;
                  
                  // Idempotent write: overwrites with same data if exists, harmless but safe
                  const result = await saveTransactionToFirebase(tx);
                  if (!result.success) hasError = true;
              }

              // STEP 2: Pull deletions from Firebase (Download sync)
              // Fetch recent transactions from Firebase to check for deletions
              try {
                  const todayStr = new Date().toISOString().split('T')[0];
                  twoDaysAgo.setHours(0, 0, 0, 0);
                  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];
                  
                  // Fetch recent transactions INCLUDING deleted ones for sync
                  const cloudTxs = await fetchTransactionsByDateRangeIncludingDeleted(twoDaysAgoStr, todayStr);
                  
                  // Check if any local transactions have been deleted in Firebase
                  const cloudTxMap = new Map(cloudTxs.map(tx => [tx.id, tx]));
                  
                  for (const localTx of recentTxs) {
                      const cloudTx = cloudTxMap.get(localTx.id);
                      
                      // If transaction exists in cloud and is marked as deleted
                      // AND the cloud version is newer (higher lastUpdated timestamp)
                      if (cloudTx && cloudTx.deleted) {
                          const cloudTime = cloudTx.lastUpdated || 0;
                          const localTime = localTx.lastUpdated || 0;
                          
                          if (cloudTime >= localTime) {
                              // Sync the deletion to local storage
                              // We use the storageService function to remove it locally
                              const { deleteLocalTransaction } = await import('./services/storageService');
                              deleteLocalTransaction(localTx.id);
                          }
                      }
                  }
              } catch (syncError) {
                  console.warn("Deletion sync failed (non-critical):", syncError);
                  // Don't set hasError for this, as upload sync may have succeeded
              }

              if (hasError) setSyncStatus('error');
              else setSyncStatus('synced');

          } catch (e) {
              console.error("Auto Sync Failed", e);
              setSyncStatus('error');
          }
      };

      // Run immediately on load (after system ready)
      if (isSystemReady) runSync();

      // Run every 5 minutes (300,000 ms)
      const intervalId = setInterval(runSync, 300000); 

      return () => clearInterval(intervalId);
  }, [isSystemReady, isGuest]);


  // --- FIREBASE SUBSCRIPTIONS (READ) ---
  useEffect(() => {
      if (isGuest) {
          setIsSystemReady(true);
          return;
      }

      // Set a timeout to prevent infinite loading if Firebase connection fails
      const connectionTimeout = setTimeout(() => {
          console.warn("Firebase connection timeout - continuing in offline mode");
          setIsSystemReady(true);
          setIsConnected(false);
      }, FIREBASE_CONNECTION_TIMEOUT_MS);

      // 1. Subscribe to System State
      const unsubState = subscribeToSystemState((cloudState) => {
          clearTimeout(connectionTimeout); // Clear timeout on successful connection
          setIsConnected(true);
          setIsSystemReady(true);
          
          // --- VERSION CONTROL CHECK ---
          if (cloudState.appVersion) {
              if (localAppVersion.current === 0) {
                  // Initialize local version on first load
                  localAppVersion.current = cloudState.appVersion;
              } else if (cloudState.appVersion > localAppVersion.current) {
                  // New version detected! Force reload.
                  console.log("New version detected from Firebase. Reloading...");
                  window.location.reload();
                  return; // Stop further processing
              }
          }

          const cloudJson = JSON.stringify({ activeBills: cloudState.activeBills, waitlist: cloudState.waitlist, bookings: cloudState.bookings });
          
          if (cloudJson !== lastSyncedState.current) {
               lastSyncedState.current = cloudJson;
               
               if (cloudState.activeBills && Array.isArray(cloudState.activeBills)) {
                   setActiveBills(cloudState.activeBills);
                   // If current ID is invalid/missing, set to first one or empty
                   const currentExists = cloudState.activeBills.find(b => b.id === currentBillId);
                   if (!currentExists) {
                       setCurrentBillId(cloudState.activeBills.length > 0 ? cloudState.activeBills[0].id : '');
                   }
               } else {
                   setActiveBills([]);
                   setCurrentBillId('');
               }

               if (cloudState.waitlist && Array.isArray(cloudState.waitlist)) setWaitlist(cloudState.waitlist);
               if (cloudState.bookings && Array.isArray(cloudState.bookings)) setBookings(cloudState.bookings);
          }
          if (cloudState.activeStaffIds) setActiveStaffIds(cloudState.activeStaffIds);
      });

      // 2. Subscribe to Settings
      const unsubSettings = subscribeToSettings((settings) => {
           if (settings) {
                // UPDATE STAFF LIST
                if (settings.staffList && settings.staffList.length > 0) {
                    setStaffList(settings.staffList);
                    
                    // --- AUTO SYNC CURRENT USER ---
                    if (currentUser) {
                        const updatedSelf = settings.staffList.find(s => s.id === currentUser.id);
                        if (updatedSelf) {
                            if (JSON.stringify(updatedSelf) !== JSON.stringify(currentUser)) {
                                console.log("Syncing updated user profile from cloud...");
                                setCurrentUser(updatedSelf);
                                saveCurrentUser(updatedSelf);
                            }
                        }
                    }
                } else {
                    setStaffList(DEFAULT_STAFF_PROFILES);
                }

                if (settings.pricingData && settings.pricingData.length > 0) {
                    const mergedPricing = settings.pricingData.map(cloudCat => {
                        const defaultCat = DEFAULT_PRICING.find(d => d.categoryKey === cloudCat.categoryKey);
                        return { ...cloudCat, icon: defaultCat ? defaultCat.icon : SparklesIcon };
                    });
                    setPricingData(mergedPricing);
                }
                
                if (settings.globalPayroll) {
                    setGlobalPayroll(settings.globalPayroll);
                }

                if (settings.knowledgeBase) setKnowledgeBase(settings.knowledgeBase);
                if (settings.adminPasswords) setAdminPasswords(settings.adminPasswords);
                if (settings.marqueeSettings) setMarqueeSettings(settings.marqueeSettings);
           }
      });
      
      return () => {
          clearTimeout(connectionTimeout);
          unsubState();
          unsubSettings();
      };
  }, [currentBillId, isGuest, currentUser]); 


  // --- FIREBASE WRITE (SAVE) ---
  useEffect(() => {
      // *** CRITICAL SAFETY CHECK ***
      if (!isSystemReady || isGuest) return;

      const currentJson = JSON.stringify({ activeBills, waitlist, bookings });

      saveActiveBills(activeBills);
      saveCurrentBillId(currentBillId);
      saveWaitlist(waitlist);
      saveBookings(bookings);
      
      if (currentJson !== lastSyncedState.current) {
          const handler = setTimeout(() => {
              lastSyncedState.current = currentJson;
          }, 500); 

          return () => clearTimeout(handler);
      }
  }, [activeBills, waitlist, bookings, currentBillId, isGuest, isSystemReady]);


  useEffect(() => {
    // Receipt Loading (Guest Mode) or View Param
    const params = new URLSearchParams(window.location.search);
    const receiptData = params.get('receipt');
    const viewParam = params.get('view') as View;

    // Handle Direct View Navigation (e.g. from Kiosk QR Code)
    if (viewParam === 'stylist') {
        setIsGuest(true); // Force Guest Mode for safety
        setCurrentUser(null);
        clearCurrentUser();
        setAppMode('app');
        setView('stylist');
        return;
    }

    if (receiptData) {
        setIsGuest(true);
        // Manual session clear to avoid calling handleLogout (which sets 'gate')
        const existingUser = getCurrentUser();
        if (existingUser) {
            updateStaffPresence(existingUser.id, false);
        }
        setCurrentUser(null);
        clearCurrentUser();
        
        // Force App mode (skip entry gate)
        setAppMode('app'); 
        setView('pricing');
        
        try {
            const json = decodeURIComponent(escape(atob(receiptData)));
            const data = JSON.parse(json);
            if (data) {
                const restoredItems: CartItem[] = Array.isArray(data.i) 
                    ? data.i.map((item: any) => ({
                         id: Math.random().toString(36).substr(2, 9),
                         nameKey: item.k,
                         price: Number(item.p),
                         quantity: Number(item.q),
                         staffName: item.s || undefined
                    })) : [];
                const newBill: ActiveBill = {
                    id: `receipt-${Date.now()}`,
                    customerName: data.c || '',
                    items: restoredItems,
                    discountPercentage: data.d ? Number(data.d) : 0
                };
                setActiveBills(prev => [...prev, newBill]);
                setCurrentBillId(newBill.id);
                setIsBillOpen(true); 
            }
        } catch (e) {
            console.error("Error parsing receipt data from URL", e);
        }
    }
  }, []);

  const incrementGenerationCount = () => {
    const today = new Date().toISOString().slice(0, 10);
    const newCount = generationsToday + 1;
    setGenerationsToday(newCount);
    localStorage.setItem('laPerlaUsage', JSON.stringify({ date: today, count: newCount }));
  };

  const updateWaitlist = (newList: WaitlistEntry[]) => {
      setWaitlist(newList);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && generationsToday < DAILY_LIMIT) {
      setUserImage(URL.createObjectURL(file));
      setGeneratedImage(null);
      setError(null);
      setIsLoading(true);
      try {
        const base64Image = await generateNailArt(file, stylePrompt);
        setGeneratedImage(`data:image/png;base64,${base64Image}`);
        incrementGenerationCount();
      } catch (e: any) {
        setError(e.message || 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const triggerFileSelect = () => fileInputRef.current?.click();
  const triggerCameraSelect = () => cameraInputRef.current?.click();

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'la-perla-nail-design.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const reset = () => {
    setUserImage(null);
    setGeneratedImage(null);
    setError(null);
    setStylePrompt('');
  };

  // --- LOADING SCREEN (SAFETY LOCK) ---
  if (!isSystemReady && !isGuest) {
      return (
          <div className="min-h-screen bg-pearl-white flex flex-col items-center justify-center p-6 text-center">
              <div className="animate-pulse">
                  <LaPerlaLogo className="w-64 mb-8" />
              </div>
              <div className="w-12 h-12 border-4 border-dusty-rose border-t-gold-leaf rounded-full animate-spin mb-4"></div>
              <h2 className="text-xl font-serif text-charcoal font-bold">Synchronizing System Data...</h2>
              <p className="text-sm text-gray-500 mt-2">Please wait while we secure your connection.</p>
          </div>
      );
  }

  // If Kiosk View is active
  if (view === 'kiosk') {
      return (
          <KioskView 
            t={t}
            waitlist={waitlist}
            setWaitlist={updateWaitlist}
            onExit={() => setView('pricing')} 
            pricingData={pricingData}
            bookings={bookings}
            activeBills={activeBills}
            pastTransactions={customerLookupData} // Pass history to Kiosk
            marqueeSettings={marqueeSettings}
          />
      );
  }

  if (view === 'portal' && currentUser) {
      return (
          <StaffPortalView 
            t={t}
            currentUser={currentUser}
            onUpdateProfile={handleUpdateStaffProfile}
            onExit={() => setView('pricing')}
            globalPayroll={globalPayroll}
            pricingData={pricingData}
          />
      );
  }

  if (appMode === 'gate') {
      return (
          <EntryGate 
            onClientEnter={handleClientEnter}
            onStaffLogin={handleLogin}
            staffList={staffList}
            adminPasswords={adminPasswords}
          />
      );
  }

  // DETERMINE ADMIN ACCESS
  const canAccessAdmin = currentUser?.id === 'admin_master';

  // Main App Render
  return (
    <div className="min-h-screen bg-pearl-white flex flex-col font-sans">
      {/* WINDOW CONTROLS - Added to simulate native app frame */}
      <div className="w-full h-8 flex justify-end items-center bg-pearl-white select-none print:hidden z-[1000]" style={{ WebkitAppRegion: 'drag' } as any}>
         <div className="flex h-full items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
            {/* KIOSK BUTTON (MOVED HERE) */}
            {currentUser && (
                <button 
                    onClick={() => { SoundManager.playTap(); setView('kiosk'); }}
                    className="h-full px-3 text-gray-400 hover:text-gold-leaf transition-colors focus:outline-none flex items-center"
                    title={t.enterKioskMode}
                >
                    <span className="font-serif font-bold text-xs border border-current px-2 py-0.5 rounded">Kiosk</span>
                </button>
            )}

            {/* Close */}
            <button 
                className="w-12 h-full flex items-center justify-center text-charcoal hover:bg-red-500 hover:text-white transition-colors focus:outline-none"
                onClick={() => { try { window.close() } catch(e){} }}
            >
                <XMarkIcon className="w-4 h-4" />
            </button>
         </div>
      </div>

      {!isGuest && (
      <header className="w-full bg-pearl-white shadow-sm border-b border-gold-leaf/20 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto py-3 md:py-4 relative">
            <div className="hidden md:flex justify-center items-center px-4 relative">
                <div className="flex gap-3">
                    <NavButton view="pricing" icon={<PriceTagIcon className="w-5 h-5"/>} label={t.navPriceList} currentView={view} onClick={setView} />
                    <NavButton view="team" icon={<UsersIcon className="w-5 h-5"/>} label={t.navTeam} currentView={view} onClick={setView} />
                    <NavButton view="stylist" icon={<SparklesIcon className="w-5 h-5"/>} label={t.navAiStylist} currentView={view} onClick={setView} />
                    <NavButton view="gallery" icon={<GalleryIcon className="w-5 h-5"/>} label={t.navGallery} currentView={view} onClick={setView} />
                    <NavButton view="portfolio" icon={<CameraIcon className="w-5 h-5"/>} label={t.navPortfolio} currentView={view} onClick={setView} />
                    <NavButton view="booking" icon={<CalendarIcon className="w-5 h-5"/>} label={t.navBooking} currentView={view} onClick={setView} />
                    <NavButton view="promotions" icon={<GiftIcon className="w-5 h-5 text-red-400"/>} label={t.navPromotions} currentView={view} onClick={setView} />
                </div>
                <div className="absolute right-0 flex gap-2 items-center">
                    {/* Cloud Status Indicator */}
                    <div className="mr-2" title={`Cloud Sync: ${syncStatus === 'synced' ? 'Online' : syncStatus === 'syncing' ? 'Syncing' : 'Error'}`}>
                        {syncStatus === 'synced' && <CloudCheckIcon className="w-6 h-6 text-green-500" />}
                        {syncStatus === 'syncing' && <CloudSyncIcon className="w-6 h-6 text-yellow-500 animate-spin" />}
                        {syncStatus === 'error' && <CloudErrorIcon className="w-6 h-6 text-red-500 animate-pulse" />}
                    </div>

                    {/* SHOW ADMIN LOCK IF USER IS ADMIN MASTER ONLY */}
                    {canAccessAdmin && (
                        <button 
                            onClick={() => { SoundManager.playTap(); setView('admin'); }}
                            className="p-2 text-gray-400 hover:text-gold-leaf transition-colors rounded-full hover:bg-gray-50"
                            title={t.adminLogin}
                        >
                            <LockIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="md:hidden flex items-center gap-3 overflow-x-auto pb-2 pt-1 w-full no-scrollbar px-4">
                 <button onClick={() => { SoundManager.playTap(); setView('pricing'); }} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'pricing' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <PriceTagIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navPriceList}</span>
                 </button>
                 <button onClick={() => { SoundManager.playTap(); setView('team'); }} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'team' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <UsersIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navTeam}</span>
                 </button>
                 <button onClick={() => { SoundManager.playTap(); setView('stylist'); }} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'stylist' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <SparklesIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navAiStylist}</span>
                 </button>
                 <button onClick={() => { SoundManager.playTap(); setView('gallery'); }} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'gallery' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <GalleryIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navGallery}</span>
                 </button>
                 <button onClick={() => { SoundManager.playTap(); setView('portfolio'); }} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'portfolio' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <CameraIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navPortfolio}</span>
                 </button>
                 <button onClick={() => { SoundManager.playTap(); setView('booking'); }} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'booking' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <CalendarIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navBooking}</span>
                 </button>
                 <button onClick={() => { SoundManager.playTap(); setView('promotions'); }} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'promotions' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <GiftIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navPromotions}</span>
                 </button>
                 {canAccessAdmin && (
                    <button onClick={() => { SoundManager.playTap(); setView('admin'); }} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'admin' ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                        <LockIcon className="w-5 h-5"/>
                        <span className="text-sm font-medium whitespace-nowrap">{t.adminLogin}</span>
                    </button>
                 )}
            </div>
        </div>
      </header>
      )}

      <main className="flex-grow">
        {view === 'stylist' && (
            <StylistView 
                t={t}
                stylePrompt={stylePrompt}
                setStylePrompt={setStylePrompt}
                userImage={userImage}
                generatedImage={generatedImage}
                isLoading={isLoading}
                error={error}
                fileInputRef={fileInputRef}
                cameraInputRef={cameraInputRef}
                handleFileChange={handleFileChange}
                triggerFileSelect={triggerFileSelect}
                triggerCameraSelect={triggerCameraSelect}
                reset={reset}
                handleDownload={handleDownload}
                generationsToday={generationsToday}
                dailyLimit={DAILY_LIMIT}
            />
        )}
        {view === 'team' && (
            <ArtistsView 
                t={t}
                staffList={staffList}
                onStaffReview={handleStaffReview}
                currentUser={currentUser}
                onOpenPortal={() => setView('portal')}
            />
        )}
        {view === 'pricing' && (
            <PricingView 
                t={t} 
                activeBills={activeBills}
                setActiveBills={setActiveBills}
                currentBillId={currentBillId}
                setCurrentBillId={setCurrentBillId}
                isBillOpen={isBillOpen}
                setIsBillOpen={setIsBillOpen}
                openCategories={openCategories}
                setOpenCategories={setOpenCategories}
                autoDownloadTrigger={autoDownloadTrigger}
                onAutoDownloadComplete={() => setAutoDownloadTrigger(false)}
                currentUser={currentUser}
                onLogin={handleLogin}
                onLogout={handleLogout}
                waitlist={waitlist}
                setWaitlist={updateWaitlist}
                staffList={staffList}
                pricingData={pricingData}
                activeStaffIds={activeStaffIds}
                onStaffReview={handleStaffReview}
                isReceiptMode={isGuest}
                globalPayroll={globalPayroll}
                pastTransactions={customerLookupData}
                bookings={bookings}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onDeleteBooking={handleDeleteBooking}
            />
        )}
        {view === 'gallery' && (
            <GalleryView 
                t={t} 
                onTryStyle={(style) => {
                    setStylePrompt(style);
                    setView('stylist');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
            />
        )}
        {view === 'portfolio' && <PortfolioView t={t} />}
        {view === 'booking' && (
            <BookingView 
                t={t} 
                languageCode="en"
                pricingData={pricingData}
                onSubmitBooking={handleSubmitBooking}
            />
        )}
        {view === 'promotions' && <PromotionsView t={t} />}
        {view === 'admin' && (
             <AdminView 
                t={t} 
                onLogout={() => {
                    setView('stylist'); 
                }}
                staffList={staffList}
                pricingData={pricingData}
                bookings={bookings}
                onUpdateBookingStatus={handleUpdateBookingStatus}
                onDeleteBooking={handleDeleteBooking}
                globalPayroll={globalPayroll}
                onUpdateGlobalPayroll={setGlobalPayroll}
                knowledgeBase={knowledgeBase}
                adminPasswords={adminPasswords}
                marqueeSettings={marqueeSettings}
                // Pass role to enable Master features
                adminRole={currentUser?.id === 'admin_master' ? 'master' : (currentUser?.id === 'shop_manager' ? 'manager' : undefined)}
                onSaveSettings={async (staff, pricing, payroll, kb, passwords, marquee) => {
                    // Update local state first to feel fast
                    setStaffList(staff);
                    setPricingData(pricing);
                    setGlobalPayroll(payroll);
                    setKnowledgeBase(kb);
                    setAdminPasswords(passwords);
                    setMarqueeSettings(marquee);
                    // Then save to cloud and return the result
                    const result = await saveSettingsToFirebase(staff, pricing, payroll, kb, passwords, marquee);
                    if(result.success) {
                        alert("Settings saved successfully!");
                    } else {
                        alert("Error saving settings. Check connection.");
                        throw new Error(result.error || "Failed to save settings");
                    }
                }}
            />
        )}
      </main>
      
      {/* Chat Widget */}
      {!isGuest && appMode === 'app' && view !== 'admin' && view !== 'portal' && (
          <div className="print:hidden">
            <ChatWidget 
                t={t}
                pricingData={pricingData}
                staffList={staffList}
                knowledgeBase={knowledgeBase}
            />
          </div>
      )}

      <footer className="bg-pearl-white text-center p-6 border-t border-gold-leaf/20 mt-auto print:hidden">
         <p className="text-charcoal/60 text-sm font-sans">
            {t.footerText.replace('{year}', new Date().getFullYear().toString())}
         </p>
         {isGuest && (
             <p className="text-xs text-gray-400 mt-2">Guest Mode • Receipt View</p>
         )}
      </footer>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <MainApp />
        </ErrorBoundary>
    );
};

export default App;
