
import React, { useState, useRef, useEffect } from 'react';
import { generateNailArt } from './gemini';
import { PricingView } from './components/PricingView';
import { GalleryView } from './components/GalleryView';
import { PortfolioView } from './components/PortfolioView';
import { BookingView } from './components/BookingView';
import { AdminView } from './components/AdminView';
import PromotionsView from './components/PromotionsView';
import { UploadIcon, SparklesIcon, PriceTagIcon, GalleryIcon, CameraIcon, DownloadIcon, BriefcaseIcon, CalendarIcon, GiftIcon, LaPerlaLogo, LockIcon } from './components/Icons';
import { TRANSLATIONS, Translation } from './translations';
import { CartItem, ActiveBill } from './types';
import { PRICING_DATA } from './constants';

type View = 'stylist' | 'pricing' | 'gallery' | 'portfolio' | 'booking' | 'promotions' | 'admin';

const DAILY_LIMIT = 10;

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
    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-sans text-sm md:text-base ${
      currentView === view
        ? 'bg-gold-leaf text-white shadow-md'
        : 'bg-pearl-white/60 text-charcoal hover:bg-pearl-white'
    }`}
  >
    {icon}
    {label}
  </button>
);

// Moved component outside of App to prevent re-mounting on every render
interface StylistViewProps {
  t: Translation;
  stylePrompt: string;
  setStylePrompt: (prompt: string) => void;
  userImage: string | null;
  generatedImage: string | null;
  isLoading: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  cameraInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFileSelect: () => void;
  triggerCameraSelect: () => void;
  reset: () => void;
  handleDownload: () => void;
  generationsToday: number;
  dailyLimit: number;
}

const StylistView: React.FC<StylistViewProps> = ({
  t,
  stylePrompt,
  setStylePrompt,
  userImage,
  generatedImage,
  isLoading,
  error,
  fileInputRef,
  cameraInputRef,
  handleFileChange,
  triggerFileSelect,
  triggerCameraSelect,
  reset,
  handleDownload,
  generationsToday,
  dailyLimit,
}) => {
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
                    
                    {/* Hidden Inputs for File/Camera */}
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

            {/* NEW COMPARE MODE VIEW */}
            {generatedImage && userImage && (
                 <div className="w-full flex flex-col items-center animate-fade-in-up">
                    <h3 className="font-serif text-2xl md:text-3xl text-gold-leaf mb-6 flex items-center gap-2">
                        {isHoldingCompare ? t.yourPhotoTitle : t.aiSuggestionTitle}
                    </h3>
                    
                    {/* Image Container with Compare Logic */}
                    <div 
                        className="relative w-full max-w-lg aspect-square rounded-3xl shadow-2xl overflow-hidden cursor-pointer touch-none select-none border-4 border-white/50 ring-1 ring-gold-leaf/30"
                        onMouseDown={() => setIsHoldingCompare(true)}
                        onMouseUp={() => setIsHoldingCompare(false)}
                        onMouseLeave={() => setIsHoldingCompare(false)}
                        onTouchStart={() => setIsHoldingCompare(true)}
                        onTouchEnd={() => setIsHoldingCompare(false)}
                        onTouchCancel={() => setIsHoldingCompare(false)}
                        onContextMenu={(e) => e.preventDefault()} // Prevent context menu on right click
                    >
                        {/* Display Image - Switches based on hold state */}
                        <img 
                            src={isHoldingCompare ? userImage : generatedImage} 
                            alt="Nail Design" 
                            className="w-full h-full object-cover transition-opacity duration-200" 
                            draggable={false}
                        />

                        {/* Floating Badge */}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/20 shadow-lg pointer-events-none">
                            {isHoldingCompare ? "ORIGINAL" : "AI DESIGN"}
                        </div>

                        {/* Instruction Overlay (Bottom) */}
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


const App: React.FC = () => {
  const [view, setView] = useState<View>('stylist');
  const [userImage, setUserImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stylePrompt, setStylePrompt] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [generationsToday, setGenerationsToday] = useState(0);

  // --- REFACTORED STATE FOR MULTIPLE BILLS ---
  const [activeBills, setActiveBills] = useState<ActiveBill[]>([
    { id: '1', customerName: '', items: [], discountPercentage: 0 }
  ]);
  const [currentBillId, setCurrentBillId] = useState<string>('1');

  const [isBillOpen, setIsBillOpen] = useState(false);
  
  // Also lift accordion state so it doesn't reset when switching tabs
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
      [PRICING_DATA[0].categoryKey]: true
  });

  // State to trigger immediate download without showing bill UI
  const [autoDownloadTrigger, setAutoDownloadTrigger] = useState(false);

  // --- STAFF MODE STATE ---
  // Default is FALSE (Customer/View Only Mode)
  const [isStaffMode, setIsStaffMode] = useState(false);

  // Force English Translation
  const t = TRANSLATIONS.en;

  useEffect(() => {
    // Check URL for receipt data to switch view AND populate data
    const params = new URLSearchParams(window.location.search);
    const receiptData = params.get('receipt');

    if (receiptData) {
        setView('pricing');
        // Ensure Staff Mode is OFF when viewing a shared receipt
        setIsStaffMode(false);
        try {
            // Decode: Base64 -> URI Component -> JSON
            const json = decodeURIComponent(escape(atob(receiptData)));
            const data = JSON.parse(json);
            
            if (data) {
                // When restoring from URL, we create a new standalone bill for it
                // We do NOT overwrite existing bills
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

                // Trigger auto download
                setAutoDownloadTrigger(true);
            }
        } catch (e) {
            console.error("Error parsing receipt data from URL", e);
        }
    }

    const savedData = localStorage.getItem('laPerlaUsage');
    if (savedData) {
      const { date, count } = JSON.parse(savedData);
      const today = new Date().toISOString().slice(0, 10);
      if (date === today) {
        setGenerationsToday(count);
      } else {
        localStorage.removeItem('laPerlaUsage');
      }
    }
  }, []);

  const incrementGenerationCount = () => {
    const today = new Date().toISOString().slice(0, 10);
    const newCount = generationsToday + 1;
    setGenerationsToday(newCount);
    localStorage.setItem('laPerlaUsage', JSON.stringify({ date: today, count: newCount }));
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
  
  const handleTryStyle = (styleName: string) => {
    setStylePrompt(styleName);
    setView('stylist');
    window.scrollTo(0, 0);
  };

  // Admin View is full screen, handles its own layout mostly
  if (view === 'admin') {
    return <AdminView t={t} onLogout={() => setView('pricing')} />;
  }

  const navItems: { view: View; icon: React.ReactNode; label: string }[] = [
    { view: 'stylist', icon: <SparklesIcon className="w-5 h-5" />, label: t.navAiStylist },
    { view: 'gallery', icon: <GalleryIcon className="w-5 h-5" />, label: t.navGallery },
    { view: 'pricing', icon: <PriceTagIcon className="w-5 h-5" />, label: t.navPriceList },
    { view: 'portfolio', icon: <BriefcaseIcon className="w-5 h-5" />, label: t.navPortfolio },
    { view: 'booking', icon: <CalendarIcon className="w-5 h-5" />, label: t.navBooking },
    { view: 'promotions', icon: <GiftIcon className="w-5 h-5" />, label: t.navPromotions },
  ];

  return (
    <div className="bg-blush-pink min-h-screen font-sans text-charcoal relative">
        <div className="absolute inset-0 bg-pearl-white/50" style={{
            backgroundImage: 'radial-gradient(#D8B6C1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            opacity: '0.3',
        }}></div>

      <div className="relative min-h-screen flex flex-col items-center">
        {/* Header */}
        <header className="w-full p-4 text-center sticky top-0 z-20 bg-pearl-white/80 backdrop-blur-md shadow-sm">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-serif text-charcoal">{t.headerTitle}</h1>
            <p className="text-sm text-charcoal/70">{t.headerSubtitle}</p>
            {/* Navigation */}
            <nav className="mt-4 flex flex-wrap justify-center gap-2">
               {navItems.map(item => (
                <NavButton
                  key={item.view}
                  view={item.view}
                  icon={item.icon}
                  label={item.label}
                  currentView={view}
                  onClick={setView}
                />
              ))}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full flex-grow pt-8 pb-16 px-2">
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
              />
            )}
            {view === 'gallery' && <GalleryView t={t} onTryStyle={handleTryStyle} />}
            {view === 'portfolio' && <PortfolioView t={t} />}
            {view === 'booking' && <BookingView t={t} languageCode="en" />}
            {view === 'promotions' && <PromotionsView t={t} />}
        </main>
        
        {/* Footer */}
        <footer className="w-full p-4 text-center bg-pearl-white/80 backdrop-blur-sm mt-auto relative group">
             <p className="text-sm text-charcoal/70 mb-2">{t.footerText.replace('{year}', new Date().getFullYear().toString())}</p>
             {/* Secret Admin Access */}
             <button 
                onClick={() => setView('admin')}
                className="opacity-50 hover:opacity-100 transition-opacity duration-500 p-2 rounded-full hover:bg-gray-200"
                aria-label="Admin Login"
             >
               <LockIcon className="w-4 h-4 text-charcoal" />
             </button>
        </footer>
      </div>
    </div>
  );
};

export default App;
