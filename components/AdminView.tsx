
import React, { useState, useEffect, useMemo } from 'react';
import { Translation } from '../translations';
import { getTransactions } from '../storage';
import { fetchGoogleSheetsData } from '../googleSheets';
import { Transaction } from '../types';
import { ChartIcon, LockIcon, ReceiptIcon, ClockIcon, CalendarIcon, XMarkIcon, DownloadIcon } from './Icons';
import { GOOGLE_SHEETS_WEBAPP_URL, PRICING_DATA, GOOGLE_SHEET_URL } from '../constants';

interface AdminViewProps {
  t: Translation;
  onLogout: () => void;
}

// SECURITY: Use Salted Base64 to obfuscate PIN in source code.
const HASHED_PIN = "TGFQZXJsYVNhbHQyODA0";

// Helper to get keys of services in the 'extras' category to filter them out later
const getExtraServiceKeys = () => {
    const extrasCategory = PRICING_DATA.find(c => c.categoryKey === 'extras');
    return new Set(extrasCategory ? extrasCategory.services.map(s => s.nameKey) : []);
};

const extraServiceKeys = getExtraServiceKeys();

// HELPER: Get local date string in YYYY-MM-DD format
// This ensures we filter based on the user's actual timezone, not UTC.
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

export const AdminView: React.FC<AdminViewProps> = ({ t, onLogout }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  
  // Data State
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [sheetTransactions, setSheetTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Drill-down State
  const [selectedStylist, setSelectedStylist] = useState<string | null>(null);

  // Date Filter State
  // FIX: Initialize with Local Date instead of UTC
  const [startDate, setStartDate] = useState(() => {
      const d = new Date();
      d.setDate(1); // Start of current month
      return getLocalISODate(d);
  });
  const [endDate, setEndDate] = useState(() => {
      return getLocalISODate(new Date()); // Today local
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

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

  // Combine data source
  const allTransactions = useMemo(() => {
     return sheetTransactions.length > 0 ? sheetTransactions : localTransactions;
  }, [sheetTransactions, localTransactions]);

  // Filtered Transactions based on Date Range
  const filteredTransactions = useMemo(() => {
      // FIX: Compare "YYYY-MM-DD" strings locally to avoid UTC offsets hiding today's data
      return allTransactions.filter(tr => {
          const trDate = new Date(tr.date);
          // Convert the transaction timestamp (which is UTC ISO) to the User's Local Date String
          const trLocalDateStr = getLocalISODate(trDate);
          
          // Compare strings: "2024-11-25" >= "2024-11-25"
          return trLocalDateStr >= startDate && trLocalDateStr <= endDate;
      });
  }, [allTransactions, startDate, endDate]);

  // Previous Period Transactions for Growth Comparison
  const previousPeriodStats = useMemo(() => {
      // 1. Calculate duration of current selection
      const daySpan = getDayDifference(startDate, endDate); // e.g., 1 day if start==end
      
      // 2. Calculate previous range dates
      // If Today is Nov 25. Prev range (1 day) is Nov 24.
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

    // Calculate Top Services (Quantity based)
    const serviceCounts: Record<string, number> = {};
    
    // UPDATED: Calculate Stylist based on REVENUE, not count
    const stylistRevenue: Record<string, number> = {};

    filteredTransactions.forEach(tr => {
        // Calculate discount factor (e.g. 10% discount = 0.9 factor)
        const discountFactor = tr.discountPercentage ? (1 - tr.discountPercentage / 100) : 1;

        tr.items.forEach(item => {
            // Filter out 'Extras' category items if needed
            if (!extraServiceKeys.has(item.nameKey)) {
                const name = t.serviceNames[item.nameKey] || item.nameKey;
                serviceCounts[name] = (serviceCounts[name] || 0) + item.quantity;
            }

            if (item.staffName) {
                // Gross revenue for this item
                const itemGrossRevenue = item.price * item.quantity;
                // Net revenue (after applying transaction discount)
                const itemNetRevenue = itemGrossRevenue * discountFactor;

                stylistRevenue[item.staffName] = (stylistRevenue[item.staffName] || 0) + itemNetRevenue;
            }
        });
    });

    const topServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    
    // Sort Stylists by Revenue
    const topStylists = Object.entries(stylistRevenue)
        .sort((a, b) => b[1] - a[1]);

    return {
        totalRevenue,
        totalOrders,
        topServices,
        topStylists
    };
  }, [filteredTransactions, t.serviceNames]);

  // Handle drill down filter
  const displayTransactions = useMemo(() => {
      if (!selectedStylist) return filteredTransactions;
      
      return filteredTransactions.filter(tr => 
          tr.items.some(item => item.staffName === selectedStylist)
      );
  }, [filteredTransactions, selectedStylist]);
  
  // Calculate total for the selected stylist in the current view
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
        <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
                <ChartIcon className="w-6 h-6 text-gold-leaf" />
                <h1 className="text-xl font-serif font-bold tracking-wide">{t.dashboard}</h1>
            </div>
            <div className="flex gap-3">
                 <button 
                    onClick={handleViewSheet}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
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
                    <ul className="space-y-3">
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
                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
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
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {displayTransactions.slice().reverse().map(tr => {
                            // Logic to filter visible items if a stylist is selected
                            const visibleItems = selectedStylist 
                                ? tr.items.filter(item => item.staffName === selectedStylist)
                                : tr.items;
                            
                            // Calculate display total based on visible items
                            // Note: We show the gross price for the item in the list row, 
                            // even though the total stats calculation accounted for discount.
                            const displayTotal = visibleItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                            
                            // If a discount exists, we can show the discounted total for accuracy in the list too
                             const discountFactor = tr.discountPercentage ? (1 - tr.discountPercentage / 100) : 1;
                             const finalDisplayTotal = selectedStylist ? displayTotal * discountFactor : tr.total;

                            return (
                                <div key={tr.id} className="flex justify-between items-start border-b border-gray-50 pb-3 last:border-0">
                                    <div>
                                        <p className="font-bold text-charcoal text-sm">${finalDisplayTotal.toFixed(2)}</p>
                                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                            <CalendarIcon className="w-3 h-3"/> {new Date(tr.date).toLocaleDateString()}
                                            <ClockIcon className="w-3 h-3 ml-1"/> {new Date(tr.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                            {/* If specific stylist selected, show Service Names. If Global view, show Stylist Names */}
                                            {visibleItems.map(i => {
                                                if (selectedStylist) {
                                                     return t.serviceNames[i.nameKey] || i.nameKey;
                                                }
                                                return i.staffName ? `${i.staffName}` : 'Unassigned';
                                            }).join(', ')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                            {visibleItems.reduce((s, i) => s + i.quantity, 0)} items
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>

      </main>
    </div>
  );
};
