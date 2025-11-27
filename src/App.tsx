import React, { Component, useState, useRef, useEffect, ErrorInfo, ReactNode } from 'react';
import { generateNailArt } from './gemini';
import { PricingView } from './components/PricingView';
import { GalleryView } from './components/GalleryView';
import { PortfolioView } from './components/PortfolioView';
import { BookingView } from './components/BookingView';
import { AdminView } from './components/AdminView';
import { KioskView } from './components/KioskView';
import PromotionsView from './components/PromotionsView';
import { UploadIcon, SparklesIcon, PriceTagIcon, GalleryIcon, CameraIcon, DownloadIcon, BriefcaseIcon, CalendarIcon, GiftIcon, LaPerlaLogo, LockIcon } from './components/Icons';
import { TRANSLATIONS, Translation } from './translations';
import { CartItem, ActiveBill, WaitlistEntry, ServiceCategory } from './types';
import { PRICING_DATA as DEFAULT_PRICING, STAFF_LIST as DEFAULT_STAFF } from './constants';
import { fetchGoogleSheetsData } from './services/googleSheetsService';
import { 
    syncCustomersFromHistory, 
    getWaitlist, 
    saveWaitlist,
    getActiveBills,
    saveActiveBills,
    getCurrentBillId,
    saveCurrentBillId
} from './services/storageService';
import { subscribeToSystemState, saveSystemStateToFirebase, subscribeToSettings } from './services/firebaseService';
import { clearFirebaseConfigLocally } from './services/firebaseConfig';

type View = 'stylist' | 'pricing' | 'gallery' | 'portfolio' | 'booking' | 'promotions' | 'admin' | 'kiosk';

const DAILY_LIMIT = 10;

// --- ERROR BOUNDARY COMPONENT ---
interface ErrorBoundaryProps {
    children?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = {
        hasError: false,
        error: null
    };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReset = () => {
        // Clear everything that might cause a crash loop
        clearFirebaseConfigLocally();
        localStorage.removeItem('la_perla_active_bills');
        localStorage.removeItem('la_perla_current_bill_id');
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

        return this.props.children || null;
    }
}

// Moved component outside of App to prevent re-mounting on every render
const NavButton: React.FC<{
  view: View;
  icon: React.ReactNode;
  label: string;
  currentView: View;
  onClick: (view: View) => void;
}> = ({ view, icon, label, currentView, onClick }) => (
  <button
    onClick={() => onClick(view)}
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

const StylistView: React.FC<any> = (props) => {
    // Simplified wrapper for cleaner App file, imports handled above
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
                          className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-pearl-white/80 focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf transition-shadow duration-300 shadow-inner resize-none font-sans"
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

// Extracted Main App Logic to keep code clean
const MainApp: React.FC = () => {
  const [view, setView] = useState<View>('stylist');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stylePrompt, setStylePrompt] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [generationsToday, setGenerationsToday] = useState(0);

  // --- DYNAMIC SETTINGS STATE ---
  const [staffList, setStaffList] = useState<string[]>(DEFAULT_STAFF);
  const [pricingData, setPricingData] = useState<ServiceCategory[]>(DEFAULT_PRICING);

  // --- REFACTORED STATE FOR MULTIPLE BILLS ---
  // Initialize from LocalStorage first to survive refreshes
  const [activeBills, setActiveBills] = useState<ActiveBill[]>(() => {
    try {
        const saved = getActiveBills();
        return Array.isArray(saved) && saved.length > 0 
            ? saved 
            : [{ id: '1', customerName: '', items: [], discountPercentage: 0 }];
    } catch {
        return [{ id: '1', customerName: '', items: [], discountPercentage: 0 }];
    }
  });

  const [currentBillId, setCurrentBillId] = useState<string>(() => {
      try {
        const savedId = getCurrentBillId();
        const savedBills = getActiveBills();
        if (savedId && Array.isArray(savedBills) && savedBills.some(b => b.id === savedId)) {
            return savedId;
        }
        return Array.isArray(savedBills) && savedBills.length > 0 ? savedBills[0].id : '1';
      } catch {
        return '1';
      }
  });

  const [isBillOpen, setIsBillOpen] = useState(false);
  
  // Waitlist State
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);

  // Real-time Sync Logic
  const lastSyncedState = useRef<string>("");
  const [isConnected, setIsConnected] = useState(false); // Connection Indicator

  // Also lift accordion state so it doesn't reset when switching tabs
  // Using ref or re-calc logic for default pricing
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
      [DEFAULT_PRICING[0].categoryKey]: true
  });

  // State to trigger immediate download without showing bill UI
  const [autoDownloadTrigger, setAutoDownloadTrigger] = useState(false);

  // --- STAFF MODE STATE ---
  // Default is FALSE (Customer/View Only Mode)
  const [isStaffMode, setIsStaffMode] = useState(false);

  // Force English Translation
  const t = TRANSLATIONS.en;

  // --- INITIAL DATA LOAD & SYNC ---
  useEffect(() => {
     // 1. Sync Customers from Google Sheets (Background Process - keep this for history)
     const syncData = async () => {
         try {
             const transactions = await fetchGoogleSheetsData();
             syncCustomersFromHistory(transactions);
         } catch (e) {
             console.error("Background sync failed", e);
         }
     };
     syncData();

     // 2. Load Usage Limits
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

    // 3. Load Local Waitlist (Fallback)
    try {
        const savedWaitlist = getWaitlist();
        if (Array.isArray(savedWaitlist) && savedWaitlist.length > 0) {
            setWaitlist(savedWaitlist);
        }
    } catch {}
  }, []);

  // --- FIREBASE REAL-TIME SUBSCRIPTIONS ---
  useEffect(() => {
      // Don't subscribe if guest
      if (isGuest) return;

      // 1. Subscribe to System State (Bills/Waitlist)
      const unsubState = subscribeToSystemState((cloudState) => {
          setIsConnected(true);
          
          const cloudJson = JSON.stringify({ activeBills: cloudState.activeBills, waitlist: cloudState.waitlist });
          // Check against current state in ref to avoid loops
          if (cloudJson !== lastSyncedState.current) {
               lastSyncedState.current = cloudJson;
               
               // If cloud has data, update local state
               if (cloudState.activeBills && Array.isArray(cloudState.activeBills) && cloudState.activeBills.length > 0) {
                   setActiveBills(cloudState.activeBills);
                   
                   // Ensure we have a valid selected ID
                   const currentExists = cloudState.activeBills.find(b => b.id === currentBillId);
                   if (!currentExists) {
                       setCurrentBillId(cloudState.activeBills[0].id);
                   }
               }
               
               if (cloudState.waitlist && Array.isArray(cloudState.waitlist)) {
                   setWaitlist(cloudState.waitlist);
               }
          }
      });

      // 2. Subscribe to Settings (Staff/Menu)
      const unsubSettings = subscribeToSettings((settings) => {
           if (settings) {
                // Update Staff List
                if (settings.staffList && settings.staffList.length > 0) {
                    setStaffList(settings.staffList);
                }

                // Update Pricing Data (Merge with Icons)
                if (settings.pricingData && settings.pricingData.length > 0) {
                    const mergedPricing = settings.pricingData.map(cloudCat => {
                        // Find original default category to get the correct Icon Component
                        const defaultCat = DEFAULT_PRICING.find(d => d.categoryKey === cloudCat.categoryKey);
                        return {
                            ...cloudCat,
                            // Fallback to SparklesIcon if category not found or icon missing
                            icon: defaultCat ? defaultCat.icon : SparklesIcon 
                        };
                    });
                    setPricingData(mergedPricing);
                }
           }
      });
      
      return () => {
          unsubState();
          unsubSettings();
      };
  }, [currentBillId, isGuest]); 


  // --- AUTO-SAVE SYSTEM STATE (FIREBASE & LOCAL) ---
  useEffect(() => {
      const currentJson = JSON.stringify({ activeBills, waitlist });

      // LOCAL PERSISTENCE
      saveActiveBills(activeBills);
      saveCurrentBillId(currentBillId);
      saveWaitlist(waitlist);
      
      // CLOUD PERSISTENCE
      if (currentJson !== lastSyncedState.current && !isGuest) {
          const handler = setTimeout(() => {
              saveSystemStateToFirebase(activeBills, waitlist).then(success => {
                  if(success) setIsConnected(true);
              });
              lastSyncedState.current = currentJson;
          }, 500); 

          return () => clearTimeout(handler);
      }
  }, [activeBills, waitlist, currentBillId, isGuest]);


  useEffect(() => {
    // Check URL for receipt data
    const params = new URLSearchParams(window.location.search);
    const receiptData = params.get('receipt');

    if (receiptData) {
        setIsGuest(true); // Enable Guest Mode
        setView('pricing');
        setIsStaffMode(false);
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
                    }))
                    : [];

                const newBill: ActiveBill = {
                    id: `receipt-${Date.now()}`,
                    customerName: data.c || '',
                    items: restoredItems,
                    discountPercentage: data.d ? Number(data.d) : 0
                };

                setActiveBills(prev => [...prev, newBill]);
                setCurrentBillId(newBill.id);
                // Trigger auto download prompt logic, but maybe we just want to show the bill
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

  // If Kiosk View is active, render it exclusively
  if (view === 'kiosk') {
      return (
          <KioskView 
            t={t}
            waitlist={waitlist}
            setWaitlist={updateWaitlist}
            onExit={() => setView('pricing')} // Return to main app
          />
      );
  }

  return (
    <div className="min-h-screen bg-pearl-white flex flex-col font-sans">
      
      {/* HEADER: Hide if Guest (Optional, usually we want to keep header for branding) */}
      {!isGuest && (
      <header className="w-full bg-pearl-white shadow-sm border-b border-gold-leaf/20 sticky top-0 z-50">
        {/* Removed 'flex justify-center' to avoid constraining mobile width */}
        <div className="max-w-7xl mx-auto py-3 md:py-4 relative">
            
             {/* Desktop Navigation - Centered with Absolute Right Admin Button */}
            <div className="hidden md:flex justify-center items-center px-4 relative">
                <div className="flex gap-3">
                    <NavButton view="stylist" icon={<SparklesIcon className="w-5 h-5"/>} label={t.navAiStylist} currentView={view} onClick={setView} />
                    <NavButton view="gallery" icon={<GalleryIcon className="w-5 h-5"/>} label={t.navGallery} currentView={view} onClick={setView} />
                    <NavButton view="pricing" icon={<PriceTagIcon className="w-5 h-5"/>} label={t.navPriceList} currentView={view} onClick={setView} />
                    <NavButton view="portfolio" icon={<CameraIcon className="w-5 h-5"/>} label={t.navPortfolio} currentView={view} onClick={setView} />
                    <NavButton view="booking" icon={<CalendarIcon className="w-5 h-5"/>} label={t.navBooking} currentView={view} onClick={setView} />
                    <NavButton view="promotions" icon={<GiftIcon className="w-5 h-5 text-red-400"/>} label={t.navPromotions} currentView={view} onClick={setView} />
                </div>
                
                {/* Admin Lock Button (Desktop) - Positioned Absolute Right */}
                <div className="absolute right-0 flex gap-2">
                    {/* Only show Kiosk button if already in staff mode to avoid clutter, or let Admin access it */}
                    <button 
                        onClick={() => setView('kiosk')}
                        className="p-2 text-gray-400 hover:text-gold-leaf transition-colors rounded-full hover:bg-gray-50"
                        title={t.enterKioskMode}
                    >
                        <span className="font-serif font-bold text-xs border border-current px-2 py-0.5 rounded">Kiosk</span>
                    </button>
                    <button 
                        onClick={() => setView('admin')}
                        className="p-2 text-gray-400 hover:text-gold-leaf transition-colors rounded-full hover:bg-gray-50"
                        title={t.adminLogin}
                    >
                        <LockIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

             {/* Mobile Navigation Toggle - Full Menu with Horizontal Scroll */}
             {/* Added w-full and removed constraint to ensure scrolling works */}
            <div className="md:hidden flex items-center gap-3 overflow-x-auto pb-2 pt-1 w-full no-scrollbar px-4">
                 <button onClick={() => setView('stylist')} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'stylist' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <SparklesIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navAiStylist}</span>
                 </button>
                 
                 <button onClick={() => setView('gallery')} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'gallery' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <GalleryIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navGallery}</span>
                 </button>

                 <button onClick={() => setView('pricing')} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'pricing' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <PriceTagIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navPriceList}</span>
                 </button>

                 <button onClick={() => setView('portfolio')} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'portfolio' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <CameraIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navPortfolio}</span>
                 </button>

                 <button onClick={() => setView('booking')} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'booking' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <CalendarIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navBooking}</span>
                 </button>

                 <button onClick={() => setView('promotions')} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'promotions' ? 'bg-gold-leaf text-white' : 'bg-white text-charcoal border border-dusty-rose/30'}`}>
                    <GiftIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.navPromotions}</span>
                 </button>

                 <button onClick={() => setView('kiosk')} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all bg-white text-charcoal border border-dusty-rose/30`}>
                    <span className="font-serif font-bold">Kiosk</span>
                 </button>

                 {/* Admin Button (Mobile) - Added to end of list */}
                 <button onClick={() => setView('admin')} className={`flex items-center gap-2 px-4 py-2 rounded-full flex-shrink-0 shadow-sm transition-all ${view === 'admin' ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                    <LockIcon className="w-5 h-5"/>
                    <span className="text-sm font-medium whitespace-nowrap">{t.adminLogin}</span>
                 </button>
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
                isStaffMode={isStaffMode}
                setIsStaffMode={setIsStaffMode}
                waitlist={waitlist}
                setWaitlist={updateWaitlist}
                // DYNAMIC DATA PROPS
                staffList={staffList}
                pricingData={pricingData}
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
            />
        )}
        {view === 'promotions' && <PromotionsView t={t} />}
        {view === 'admin' && (
             <AdminView 
                t={t} 
                onLogout={() => {
                    // When logging out from admin, just switch view
                    setView('stylist'); 
                }}
                staffList={staffList}
                pricingData={pricingData}
            />
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-pearl-white text-center p-6 border-t border-gold-leaf/20 mt-auto">
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