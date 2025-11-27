
import React, { useState, useEffect, useMemo } from 'react';
import { Translation } from '../translations';
import { getTransactions } from '../services/storageService';
import { fetchGoogleSheetsData } from '../services/googleSheetsService';
import { Transaction, ServiceCategory } from '../types';
import { ChartIcon, LockIcon, ReceiptIcon, DownloadIcon, LaPerlaLogo, PlusIcon, XMarkIcon, ChevronDownIcon } from './Icons';
import { GOOGLE_SHEETS_WEBAPP_URL, GOOGLE_SHEET_URL } from '../constants'; 
import { isFirebaseConfigured, validateConnection, saveFirebaseConfigLocally, parseConfigString, ParsedConfig, clearFirebaseConfigLocally, DEFAULT_CONFIG } from '../services/firebaseConfig';
import { saveSettingsToFirebase } from '../services/firebaseService';

interface AdminViewProps {
  t: Translation;
  onLogout: () => void;
  // DYNAMIC DATA
  staffList: string[];
  pricingData: ServiceCategory[];
}

// SECURITY: Use Salted Base64 to obfuscate PIN in source code.
const HASHED_PIN = "TGFQZXJsYVNhbHQyODA0";

// HELPER: Get local date string in YYYY-MM-DD format
const getLocalISODate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// HELPER: Subtract days from a date string (YYYY-MM-DD)
const subtractDays = (dateStr: string, days: number): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - days);
    return getLocalISODate(date);
};

// HELPER: Calculate day difference between two YYYY-MM-DD strings
const getDayDifference = (start: string, end: string): number => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays === 0 ? 1 : diffDays + 1; // Inclusive count (e.g., Today to Today is 1 day span)
};

export const AdminView: React.FC<AdminViewProps> = ({ t, onLogout, staffList, pricingData }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  
  // Data State
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [sheetTransactions, setSheetTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // View State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'menu'>('dashboard');

  // Drill-down State
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null);

  // Date Filter State
  const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      d.setDate(1); // Start of current month
      return getLocalISODate(d);
  });
  const [endDate, setEndDate] = useState(() => {
      return getLocalISODate(new Date()); // Today local
  });

  // --- SETUP STATE ---
  const [pasteInput, setPasteInput] = useState('');
  const [config, setConfig] = useState<ParsedConfig>({ apiKey: '', projectId: '', databaseURL: '' });
  const [setupError, setSetupError] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // --- MENU & STAFF EDITING STATE ---
  const [editStaffList, setEditStaffList] = useState<string[]>([]);
  const [editPricingData, setEditPricingData] = useState<ServiceCategory[]>([]);
  const [newStaffName, setNewStaffName] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  // Accordion state for menu editing
  const [openEditCategories, setOpenEditCategories] = useState<Record<string, boolean>>({});

  // Helper to get keys of services in the 'extras' category to filter them out later
  const getExtraServiceKeys = () => {
      const extrasCategory = pricingData.find(c => c.categoryKey === 'extras');
      return new Set(extrasCategory ? extrasCategory.services.map(s => s.nameKey) : []);
  };
  const extraServiceKeys = useMemo(() => getExtraServiceKeys(), [pricingData]);


  useEffect(() => {
    if (isAuthenticated) {
        if (!isFirebaseConfigured()) {
            setActiveTab('settings');
        }
        loadData();
        
        // Init edit state
        setEditStaffList([...staffList]);
        setEditPricingData(JSON.parse(JSON.stringify(pricingData))); // Deep copy
    }
  }, [isAuthenticated]);

  // Sync props to edit state if they change externally (and we aren't editing)
  useEffect(() => {
      if (!isSavingSettings && activeTab !== 'menu') {
          setEditStaffList([...staffList]);
          setEditPricingData(JSON.parse(JSON.stringify(pricingData)));
      }
  }, [staffList, pricingData, isSavingSettings, activeTab]);

  const loadData = async () => {
      setIsLoading(true);
      // 1. Load Local
      const local = getTransactions();
      setLocalTransactions(local);

      // 2. Load Cloud
      if (GOOGLE_SHEETS_WEBAPP_URL) {
          const cloud = await fetchGoogleSheetsData();
          setSheetTransactions(cloud);
      }
      setIsLoading(false);
  };

  const handleLogin = () => {
    setIsChecking(true);
    try {
        const hashedInput = btoa(`LaPerlaSalt${pin}`);
        if (hashedInput === HASHED_PIN) {
          setIsAuthenticated(true);
          setError('');
        } else {
          setError(t.wrongPin);
          setPin('');
        }
    } catch (e) {
        console.error("Login error", e);
        setError("System Error");
    } finally {
        setIsChecking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          handleLogin();
      }
  }

  // --- SETUP HANDLERS ---
  const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setPasteInput(val);
        const parsed = parseConfigString(val);
        
        if (parsed.apiKey || parsed.projectId) {
            setConfig(prev => ({
                ...prev,
                apiKey: parsed.apiKey || prev.apiKey,
                projectId: parsed.projectId || prev.projectId,
                databaseURL: parsed.databaseURL || prev.databaseURL
            }));
            setSetupError('');
            setTestStatus('idle');
        }
    };

    const handleTestConnection = async () => {
        setTestStatus('testing');
        setTestMessage("Checking connection...");
        
        const result = await validateConnection(config);
        if (result.success) {
            setTestStatus('success');
            setTestMessage("Connection successful! You can save now.");
        } else {
            setTestStatus('fail');
            setTestMessage(result.error || "Connection failed.");
        }
    };

    const handleSaveConfig = () => {
        const result = saveFirebaseConfigLocally(config);
        if (result.success) {
            alert("Configuration saved! The app will reload.");
            window.location.reload();
        } else {
            setSetupError(result.error || "Invalid configuration.");
        }
    };

    // --- MENU & STAFF HANDLERS ---
    const handleAddStaff = () => {
        if (!newStaffName.trim()) return;
        setEditStaffList(prev => [...prev, newStaffName.trim()]);
        setNewStaffName("");
    };

    const handleRemoveStaff = (index: number) => {
        const newList = [...editStaffList];
        newList.splice(index, 1);
        setEditStaffList(newList);
    };

    const handleUpdateService = (catIndex: number, srvIndex: number, field: 'displayName' | 'price', value: string) => {
        const newPricing = [...editPricingData];
        newPricing[catIndex].services[srvIndex] = {
            ...newPricing[catIndex].services[srvIndex],
            [field]: value
        };
        setEditPricingData(newPricing);
    };

    const handleAddService = (catIndex: number) => {
        const newPricing = [...editPricingData];
        newPricing[catIndex].services.push({
            nameKey: `custom_${Date.now()}`,
            price: '$0',
            displayName: 'New Service'
        });
        setEditPricingData(newPricing);
    };

    const handleRemoveService = (catIndex: number, srvIndex: number) => {
        if (window.confirm("Are you sure you want to delete this service?")) {
            const newPricing = [...editPricingData];
            newPricing[catIndex].services.splice(srvIndex, 1);
            setEditPricingData(newPricing);
        }
    };

    const toggleEditCategory = (key: string) => {
        setOpenEditCategories(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveSettings = async () => {
        if (!isFirebaseConfigured()) {
            alert("Please connect to Firebase before saving.");
            return;
        }

        setIsSavingSettings(true);
        const success = await saveSettingsToFirebase(editStaffList, editPricingData);
        setIsSavingSettings(false);

        if (success) {
            alert("Settings saved successfully!");
        } else {
            alert("Failed to save. Please check your internet connection.");
        }
    };
  
  // --- DASHBOARD LOGIC ---

  // Combine data source
  const allTransactions = useMemo(() => {
     return sheetTransactions.length > 0 ? sheetTransactions : localTransactions;
  }, [sheetTransactions, localTransactions]);

  // Filtered Transactions based on Date Range
  const filteredTransactions = useMemo(() => {
      // FIX: Compare "YYYY-MM-DD" strings locally to avoid UTC offsets hiding today's data
      return allTransactions.filter(tr => {
          const trDate = new Date(tr.date);
          const trLocalDateStr = getLocalISODate(trDate);
          return trLocalDateStr >= startDate && trLocalDateStr <= endDate;
      });
  }, [allTransactions, startDate, endDate]);

  // Previous Period Transactions for Growth Comparison
  const previousPeriodStats = useMemo(() => {
      const daySpan = getDayDifference(startDate, endDate); 
      const prevEndDateStr = subtractDays(startDate, 1);
      const prevStartDateStr = subtractDays(startDate, daySpan);

      const prevTrans = allTransactions.filter(tr => {
          const trDate = new Date(tr.date);
          const trLocalDateStr = getLocalISODate(trDate);
          return trLocalDateStr >= prevStartDateStr && trLocalDateStr <= prevEndDateStr;
      });

      let revenue = 0;
      prevTrans.forEach(t => revenue += t.total);
      
      return {
          revenue,
          count: prevTrans.length,
          startDate: prevStartDateStr,
          endDate: prevEndDateStr
      };
  }, [allTransactions, startDate, endDate]);


  const handleViewSheet = () => {
      window.open(GOOGLE_SHEET_URL, '_blank');
  };

  // Calculate Dashboard Stats
  const stats = useMemo(() => {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalOrders = filteredTransactions.length;

    const serviceCounts: Record<string, number> = {};
    const stylistRevenue: Record<string, number> = {};

    filteredTransactions.forEach(tr => {
        const discountFactor = tr.discountPercentage ? (1 - tr.discountPercentage / 100) : 1;

        tr.items.forEach(item => {
            if (!extraServiceKeys.has(item.nameKey)) {
                // Use props pricingData to resolve name if possible, else translation
                const name = t.serviceNames[item.nameKey] || item.nameKey;
                serviceCounts[name] = (serviceCounts[name] || 0) + item.quantity;
            }

            if (item.staffName) {
                const itemGrossRevenue = item.price * item.quantity;
                const itemNetRevenue = itemGrossRevenue * discountFactor;
                stylistRevenue[item.staffName] = (stylistRevenue[item.staffName] || 0) + itemNetRevenue;
            }
        });
    });

    const topServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1]);
        // REMOVED .slice(0, 5) to show all services per user request
    
    const topStylists = Object.entries(stylistRevenue)
        .sort((a, b) => b[1] - a[1]);

    return {
        totalRevenue,
        totalOrders,
        topServices,
        topStylists
    };
  }, [filteredTransactions, t.serviceNames, extraServiceKeys]);

  // Handle drill down filter
  const displayTransactions = useMemo(() => {
      if (!selectedStylist) return filteredTransactions;
      return filteredTransactions.filter(tr => 
          tr.items.some(item => item.staffName === selectedStylist)
      );
  }, [filteredTransactions, selectedStylist]);
  
  const selectedStylistTotal = useMemo(() => {
      if (!selectedStylist) return 0;
      return stats.topStylists.find(s => s[0] === selectedStylist)?.[1] || 0;
  }, [selectedStylist, stats.topStylists]);


  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-blush-pink flex items-center justify-center z-50 p-4">
        <div className="bg-pearl-white p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-gold-leaf/20">
          <div className="mx-auto w-16 h-16 bg-gold-leaf/10 rounded-full flex items-center justify-center mb-4">
              <LockIcon className="w-8 h-8 text-gold-leaf" />
          </div>
          <h2 className="text-2xl font-serif text-charcoal mb-6">{t.adminLogin}</h2>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.enterPin}
            className="w-full text-center text-2xl p-3 border-2 border-dusty-rose/30 rounded-xl mb-4 focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf outline-none"
            autoFocus
          />
          {error && <p className="text-red-500 mb-4 animate-pulse">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
              <button
                onClick={onLogout}
                className="w-full bg-gray-200 text-charcoal py-3 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                {t.cancelButton}
              </button>
              <button
                onClick={handleLogin}
                disabled={isChecking}
                className="w-full bg-gold-leaf text-white py-3 rounded-xl font-medium hover:bg-charcoal transition-colors disabled:opacity-50"
              >
                {isChecking ? "Checking..." : "Login"}
              </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pearl-white text-charcoal font-sans pb-20">
        {/* Admin Header */}
      <header className="bg-charcoal text-pearl-white p-4 shadow-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
                <ChartIcon className="w-6 h-6 text-gold-leaf" />
                <h1 className="text-xl font-serif font-bold tracking-wide">{t.dashboard}</h1>
            </div>
            
            {/* TABS */}
            <div className="flex bg-gray-700 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-gold-leaf text-white shadow' : 'text-gray-300 hover:text-white'}`}
                >
                    Dashboard
                </button>
                <button 
                    onClick={() => setActiveTab('menu')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'menu' ? 'bg-gold-leaf text-white shadow' : 'text-gray-300 hover:text-white'}`}
                >
                    Menu & Staff
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'settings' ? 'bg-gold-leaf text-white shadow' : 'text-gray-300 hover:text-white'}`}
                >
                    System Connection
                </button>
            </div>

            <div className="flex gap-3">
                 <button 
                    onClick={handleViewSheet}
                    className="hidden md:flex text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors items-center gap-1"
                >
                    <DownloadIcon className="w-3 h-3" />
                    {t.viewGoogleSheet}
                </button>
                <button 
                    onClick={onLogout}
                    className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                    {t.logout}
                </button>
            </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gold-leaf/20">
                 <div className="text-center mb-6">
                     <LaPerlaLogo className="w-40 mx-auto mb-2" />
                     <h3 className="text-2xl font-serif font-bold text-charcoal">Firebase Configuration</h3>
                     <p className="text-sm text-gray-500">Connect to sync bills and data across devices.</p>
                 </div>

                 {isFirebaseConfigured() && (
                     <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg mb-6 text-sm flex justify-between items-center">
                         <span className="font-medium">✅ Connected to: {DEFAULT_CONFIG.projectId === config.projectId || config.projectId === '' ? 'Default (La Perla)' : config.projectId}</span>
                         <div className="flex gap-2">
                             <button 
                                onClick={() => {
                                    if(window.confirm("Are you sure you want to restore default?")) {
                                        clearFirebaseConfigLocally();
                                    }
                                }}
                                className="text-xs text-blue-600 hover:underline"
                             >
                                 Restore Default
                             </button>
                             <button 
                                onClick={() => {
                                    if(window.confirm("Are you sure you want to disconnect?")) {
                                        localStorage.setItem('la_perla_firebase_settings', JSON.stringify({apiKey: 'DISCONNECTED', projectId: 'DISCONNECTED'}));
                                        window.location.reload();
                                    }
                                }}
                                className="text-xs text-red-500 underline font-bold"
                             >
                                 Disconnect
                             </button>
                         </div>
                     </div>
                 )}

                 {/* CODE SNIPPET DISPLAY */}
                 <div className="bg-charcoal text-gray-300 p-4 rounded-xl text-xs font-mono mb-6 overflow-x-auto relative group">
                     <p className="text-gold-leaf font-bold mb-2 uppercase">Configuration Code (La Perla)</p>
                     <pre className="whitespace-pre-wrap break-all">
{`const firebaseConfig = {
  apiKey: "${DEFAULT_CONFIG.apiKey}",
  authDomain: "${DEFAULT_CONFIG.authDomain}",
  databaseURL: "${DEFAULT_CONFIG.databaseURL}",
  projectId: "${DEFAULT_CONFIG.projectId}",
  storageBucket: "${DEFAULT_CONFIG.storageBucket}",
  messagingSenderId: "${DEFAULT_CONFIG.messagingSenderId}",
  appId: "${DEFAULT_CONFIG.appId}",
  measurementId: "${DEFAULT_CONFIG.measurementId}"
};`}
                     </pre>
                     <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-[10px] bg-gray-600 px-2 py-1 rounded text-white">Default</span>
                     </div>
                 </div>

                <div className="text-left bg-gray-50 p-4 rounded-xl mb-4 text-sm text-gray-700 space-y-2 border border-gray-100">
                    <p className="font-bold text-gold-leaf">Step 1: Custom Configuration (Optional)</p>
                    <p>If you want to use a different project, paste the Firebase config code here. Leave blank to use default.</p>
                </div>
                
                <textarea 
                    value={pasteInput}
                    onChange={handlePasteChange}
                    placeholder='Paste new Firebase Config code here (if you want to change)...'
                    className="w-full h-20 p-3 border border-dusty-rose rounded-xl font-mono text-xs bg-gray-50 mb-4 focus:ring-2 focus:ring-gold-leaf outline-none resize-none"
                />

                <div className="text-left bg-white p-4 rounded-xl border border-gold-leaf/30 space-y-3 mb-6 relative">
                    <div className="absolute -top-3 left-3 bg-white px-2 text-xs font-bold text-gold-leaf">Step 2: Verify Information</div>
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">API Key</label>
                        <input 
                            type="text" 
                            value={config.apiKey}
                            onChange={(e) => setConfig({...config, apiKey: e.target.value})}
                            className="w-full p-2 border-b border-gray-200 focus:border-gold-leaf outline-none font-mono text-sm"
                            placeholder="Default"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Project ID</label>
                        <input 
                            type="text" 
                            value={config.projectId}
                            onChange={(e) => setConfig({...config, projectId: e.target.value})}
                            className="w-full p-2 border-b border-gray-200 focus:border-gold-leaf outline-none font-mono text-sm"
                            placeholder="Default"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Database URL</label>
                        <input 
                            type="text" 
                            value={config.databaseURL}
                            onChange={(e) => setConfig({...config, databaseURL: e.target.value})}
                            className="w-full p-2 border-b border-gray-200 focus:border-gold-leaf outline-none font-mono text-sm text-gray-600"
                            placeholder="Default"
                        />
                    </div>
                </div>

                {/* TEST CONNECTION SECTION */}
                <div className="mb-4">
                    <button 
                        onClick={handleTestConnection}
                        disabled={testStatus === 'testing' || (!config.apiKey && !pasteInput)} // Enable if pasted or manually entered, otherwise assuming default handles it
                        className={`w-full py-2 rounded-lg font-bold text-sm transition-colors mb-2 ${
                            testStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-charcoal hover:bg-gray-300'
                        }`}
                    >
                        {testStatus === 'testing' ? 'Testing...' : 'Step 3: Test Connection'}
                    </button>
                    
                    {testMessage && (
                        <div className={`text-xs p-2 rounded text-left ${testStatus === 'success' ? 'text-green-600' : 'text-red-600 bg-red-50'}`}>
                            {testStatus === 'success' ? '✅ ' : '❌ '} {testMessage}
                        </div>
                    )}
                </div>
                
                {setupError && <p className="text-red-500 text-sm mb-4 font-bold bg-red-50 p-2 rounded border border-red-200">{setupError}</p>}

                <div className="flex gap-3">
                    <button 
                        onClick={clearFirebaseConfigLocally}
                        className="flex-1 py-3 bg-gray-100 text-charcoal font-bold rounded-xl hover:bg-gray-200 transition-colors"
                        title="Use Default Config (La Perla)"
                    >
                        Use Default
                    </button>
                    <button 
                        onClick={handleSaveConfig}
                        disabled={!config.apiKey && !pasteInput}
                        className="flex-1 py-3 bg-gold-leaf text-white font-bold rounded-xl hover:bg-charcoal transition-colors shadow-md disabled:opacity-50"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        )}

        {/* --- MENU & STAFF TAB --- */}
        {activeTab === 'menu' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* STAFF MANAGEMENT */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold-leaf/20 lg:col-span-1 h-fit">
                     <h3 className="text-xl font-serif font-bold text-charcoal mb-4 flex items-center gap-2">
                         Staff Management
                     </h3>
                     <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                         {editStaffList.map((staff, index) => (
                             <div key={index} className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded-lg group hover:bg-white hover:shadow-sm border border-transparent hover:border-dusty-rose/30 transition-all">
                                 <span className="font-medium text-charcoal">{staff}</span>
                                 <button 
                                    onClick={() => handleRemoveStaff(index)}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                 >
                                     <XMarkIcon className="w-4 h-4" />
                                 </button>
                             </div>
                         ))}
                     </div>
                     <div className="flex gap-2">
                         <input 
                            type="text" 
                            placeholder="New Staff Name..." 
                            value={newStaffName}
                            onChange={(e) => setNewStaffName(e.target.value)}
                            className="flex-1 border border-dusty-rose/50 rounded-lg px-3 py-2 outline-none focus:border-gold-leaf"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddStaff()}
                         />
                         <button 
                            onClick={handleAddStaff}
                            className="bg-gold-leaf text-white px-4 rounded-lg hover:bg-charcoal transition-colors"
                         >
                             <PlusIcon className="w-5 h-5" />
                         </button>
                     </div>
                 </div>

                 {/* MENU MANAGEMENT */}
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold-leaf/20 lg:col-span-2">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-serif font-bold text-charcoal">
                             Menu Management
                        </h3>
                        <button 
                            onClick={handleSaveSettings}
                            disabled={isSavingSettings}
                            className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSavingSettings ? 'Saving...' : 'Save Changes'}
                        </button>
                     </div>
                     <p className="text-xs text-gray-400 mb-6">Edit service names and prices directly. Click "Save Changes" to update all devices.</p>

                     <div className="space-y-4">
                         {editPricingData.map((category, catIndex) => {
                             const isOpen = openEditCategories[category.categoryKey];
                             return (
                                 <div key={category.categoryKey} className="border border-gray-100 rounded-xl overflow-hidden">
                                     <button 
                                        onClick={() => toggleEditCategory(category.categoryKey)}
                                        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                                     >
                                         <span className="font-bold text-charcoal">
                                             {t.serviceCategories[category.categoryKey] || category.categoryKey}
                                         </span>
                                         <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                     </button>

                                     {isOpen && (
                                         <div className="p-4 bg-white space-y-3">
                                             {category.services.map((service, srvIndex) => (
                                                 <div key={srvIndex} className="flex gap-3 items-center group">
                                                     <div className="flex-1">
                                                         <label className="text-[10px] text-gray-400 uppercase font-bold">Service Name</label>
                                                         <input 
                                                            type="text"
                                                            value={service.displayName || t.serviceNames[service.nameKey] || service.nameKey}
                                                            onChange={(e) => handleUpdateService(catIndex, srvIndex, 'displayName', e.target.value)}
                                                            className="w-full border-b border-gray-200 py-1 text-sm font-medium focus:border-gold-leaf outline-none"
                                                         />
                                                     </div>
                                                     <div className="w-24">
                                                         <label className="text-[10px] text-gray-400 uppercase font-bold">Price</label>
                                                         <input 
                                                            type="text"
                                                            value={service.price}
                                                            onChange={(e) => handleUpdateService(catIndex, srvIndex, 'price', e.target.value)}
                                                            className="w-full border-b border-gray-200 py-1 text-sm font-medium focus:border-gold-leaf outline-none text-right"
                                                         />
                                                     </div>
                                                     <div className="pt-4">
                                                         <button 
                                                            onClick={() => handleRemoveService(catIndex, srvIndex)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors"
                                                            title="Remove Service"
                                                         >
                                                             <XMarkIcon className="w-4 h-4" />
                                                         </button>
                                                     </div>
                                                 </div>
                                             ))}
                                             
                                             <div className="pt-2">
                                                 <button 
                                                    onClick={() => handleAddService(catIndex)}
                                                    className="flex items-center gap-2 text-sm text-gold-leaf hover:underline font-bold"
                                                 >
                                                     <PlusIcon className="w-4 h-4" /> Add Service
                                                 </button>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             )
                         })}
                     </div>
                 </div>
             </div>
        )}

        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dashboard' && (
        <>
            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    {isLoading ? (
                        <span className="animate-pulse text-gold-leaf">{t.loadingData}</span>
                    ) : (
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                            <div className="w-2 h-2 rounded-full bg-green-600"></div>
                            {t.sourceGoogleSheets}
                        </span>
                    )}
                    <button onClick={loadData} className="ml-2 text-blue-500 hover:underline text-xs">{t.refreshData}</button>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg">
                    <div className="flex items-center gap-2 px-2">
                        <span className="text-xs font-bold text-gray-400 uppercase">{t.filterDateRange}</span>
                    </div>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:border-gold-leaf outline-none"
                    />
                    <span className="text-gray-400">-</span>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:border-gold-leaf outline-none"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold-leaf/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ChartIcon className="w-16 h-16 text-gold-leaf" />
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">{t.revenue}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-charcoal">${stats.totalRevenue.toFixed(2)}</span>
                    </div>
                    {previousPeriodStats.revenue > 0 && (
                        <div className={`text-xs mt-2 flex items-center gap-1 ${stats.totalRevenue >= previousPeriodStats.revenue ? 'text-green-500' : 'text-red-500'}`}>
                            {stats.totalRevenue >= previousPeriodStats.revenue ? '↑' : '↓'} 
                            {Math.abs(((stats.totalRevenue - previousPeriodStats.revenue) / previousPeriodStats.revenue) * 100).toFixed(0)}% {t.vsPrevious}
                        </div>
                    )}
                </div>

                {/* Orders Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold-leaf/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ReceiptIcon className="w-16 h-16 text-charcoal" />
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">{t.orders}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-charcoal">{stats.totalOrders}</span>
                    </div>
                    {previousPeriodStats.count > 0 && (
                        <div className={`text-xs mt-2 flex items-center gap-1 ${stats.totalOrders >= previousPeriodStats.count ? 'text-green-500' : 'text-red-500'}`}>
                            {stats.totalOrders >= previousPeriodStats.count ? '↑' : '↓'} 
                            {Math.abs(((stats.totalOrders - previousPeriodStats.count) / previousPeriodStats.count) * 100).toFixed(0)}% {t.vsPrevious}
                        </div>
                    )}
                </div>
                
                {/* Top Stylist Card */}
                <div className="bg-gradient-to-br from-charcoal to-gray-800 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
                    <h3 className="text-gold-leaf text-sm font-medium uppercase tracking-wider mb-3">Top Stylist (Revenue)</h3>
                    {stats.topStylists.length > 0 ? (
                        <div>
                            <div className="text-2xl font-bold">{stats.topStylists[0][0]}</div>
                            <div className="text-sm opacity-70">${stats.topStylists[0][1].toFixed(2)} generated</div>
                        </div>
                    ) : (
                        <div className="text-sm opacity-50">No data</div>
                    )}
                </div>

                {/* Top Service Card */}
                <div className="bg-gradient-to-br from-gold-leaf to-yellow-600 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
                    <h3 className="text-white/80 text-sm font-medium uppercase tracking-wider mb-3">Top Service</h3>
                    {stats.topServices.length > 0 ? (
                        <div>
                            <div className="text-xl font-bold leading-tight">{stats.topServices[0][0]}</div>
                            <div className="text-sm opacity-80 mt-1">{stats.topServices[0][1]} times booked</div>
                        </div>
                    ) : (
                        <div className="text-sm opacity-50">No data</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Services List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-serif font-bold text-charcoal mb-4 border-b pb-2">{t.topServices}</h3>
                    {stats.topServices.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">{t.noData}</p>
                    ) : (
                        <ul className="space-y-3 h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {stats.topServices.map(([name, count], idx) => (
                                <li key={name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-gold-leaf text-white' : 'bg-gray-100 text-gray-500'}`}>
                                            {idx + 1}
                                        </span>
                                        <span className="text-gray-700 truncate max-w-[150px]">{name}</span>
                                    </div>
                                    <span className="font-semibold text-charcoal">{count}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                
                {/* Staff Performance */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center border-b pb-2 mb-4">
                        <h3 className="text-lg font-serif font-bold text-charcoal">Stylist Revenue</h3>
                        {selectedStylist && (
                            <button 
                                onClick={() => setSelectedStylist(null)}
                                className="text-xs text-red-500 hover:underline"
                            >
                                Clear Filter
                            </button>
                        )}
                    </div>
                
                    {stats.topStylists.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">{t.noData}</p>
                    ) : (
                        <div className="space-y-3 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {stats.topStylists.map(([name, revenue]) => (
                                <button 
                                    key={name} 
                                    onClick={() => setSelectedStylist(selectedStylist === name ? null : name)}
                                    className={`w-full flex items-center justify-between text-sm p-2 rounded-lg transition-colors ${selectedStylist === name ? 'bg-gold-leaf text-white' : 'hover:bg-gray-50'}`}
                                >
                                    <span className="font-medium">{name}</span>
                                    <span className={selectedStylist === name ? 'text-white font-bold' : 'text-green-600 font-semibold'}>
                                        ${revenue.toFixed(2)}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Transactions List */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
                    <h3 className="text-lg font-serif font-bold text-charcoal mb-4 border-b pb-2">
                        {selectedStylist 
                            ? <span>History: {selectedStylist} <span className="text-green-600 ml-1 font-sans">(Total: ${selectedStylistTotal.toFixed(2)})</span></span>
                            : t.recentTransactions
                        }
                    </h3>
                    {displayTransactions.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">{t.noData}</p>
                    ) : (
                        <div className="space-y-4 h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                            {displayTransactions.slice().reverse().map(tr => {
                                // Logic to filter visible items if a stylist is selected
                                const visibleItems = selectedStylist 
                                    ? tr.items.filter(item => item.staffName === selectedStylist)
                                    : tr.items;
                                
                                // Calculate display total based on visible items
                                const displayTotal = visibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                                
                                const discountFactor = tr.discountPercentage ? (1 - tr.discountPercentage / 100) : 1;
                                const finalDisplayTotal = selectedStylist ? displayTotal * discountFactor : tr.total;

                                return (
                                    <div key={tr.id} className="flex justify-between items-start border-b border-gray-50 pb-3 last:border-0">
                                        <div>
                                            <p className="font-bold text-charcoal text-sm">${finalDisplayTotal.toFixed(2)}
                                                {tr.customerName && <span className="ml-2 font-normal text-gray-500">- {tr.customerName}</span>}
                                            </p>
                                            <p className="text-xs text-charcoal/60">
                                                {new Date(tr.date).toLocaleDateString()} {new Date(tr.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                            <p className="text-xs text-charcoal/50 mt-1">
                                                {tr.items.length} items {tr.discountPercentage ? `(-${tr.discountPercentage}%)` : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
        )}
      </main>
    </div>
  );
};
