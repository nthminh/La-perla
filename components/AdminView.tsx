
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Translation } from '../translations';
import { getTransactions, clearTransactions, deleteLocalTransaction } from '../services/storageService';
import { 
    subscribeToTransactions, 
    updateTransactionInFirebase, 
    deleteTransactionFromFirebase, 
    pruneOldTransactionsFromFirebase, 
    saveTransactionToFirebase, 
    fetchTransactionsOnce,
    triggerClientUpdate,
    fetchTransactionsByDateRange,
    deleteOldIncompleteBills
} from '../services/firebaseService';
import { Transaction, ServiceCategory, StaffProfile, BookingRequest, PayrollConfig, GlobalPayrollSettings, AdminPasswords, MarqueeSettings } from '../types';
import { 
    ChartIcon, LockIcon, ReceiptIcon, DownloadIcon, LaPerlaLogo, PlusIcon, XMarkIcon, 
    ChevronDownIcon, CameraIcon, UploadIcon, UserIcon, PencilIcon, CalendarIcon, 
    PhoneIcon, ClockIcon, TrashIcon, StarIcon, ListBulletIcon, CloudSyncIcon, UsersIcon, BriefcaseIcon, SparklesIcon, MapPinIcon, SearchIcon, GiftIcon, ChatIcon, PriceTagIcon
} from './Icons'; 
import { 
    isFirebaseConfigured, 
    validateConnection, 
    saveFirebaseConfigLocally, 
    parseConfigString, 
    ParsedConfig 
} from '../services/firebaseConfig';
import { CustomerCRMView } from './CustomerCRMView';
import { MarketingView } from './MarketingView'; // New Component
import { PayrollView } from './PayrollView'; // Payroll Feature
import { DEFAULT_ADMIN_PASSWORDS, DEFAULT_MARQUEE_SETTINGS } from '../constants';
import { compressImage } from '../utils/imageCompression'; 

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// --- CRITICAL: SYDNEY TIMEZONE HELPERS ---
const getSydneyDateStr = (isoDate: string) => {
    try {
        return new Date(isoDate).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    } catch (e) {
        return isoDate.split('T')[0]; 
    }
};

const getSydneyDayName = (isoDate: string) => {
    try {
        return new Date(isoDate).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'long' });
    } catch (e) {
        return "";
    }
};

const getSydneyToday = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
};

interface AdminViewProps {
    t: Translation;
    onLogout: () => void;
    staffList: StaffProfile[];
    pricingData: ServiceCategory[];
    bookings?: BookingRequest[];
    onUpdateBookingStatus?: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => void;
    onDeleteBooking?: (id: string) => void;
    globalPayroll?: GlobalPayrollSettings;
    onUpdateGlobalPayroll?: (settings: GlobalPayrollSettings) => void;
    onSaveSettings?: (staff: StaffProfile[], pricing: ServiceCategory[], payroll: GlobalPayrollSettings, knowledgeBase: string, adminPasswords: AdminPasswords, marqueeSettings: MarqueeSettings) => Promise<void>;
    knowledgeBase?: string;
    adminRole?: 'master' | 'manager' | null;
    adminPasswords?: AdminPasswords;
    marqueeSettings?: MarqueeSettings;
}

export const AdminView: React.FC<AdminViewProps> = ({ 
    t, onLogout, staffList, pricingData, bookings = [], onUpdateBookingStatus, onDeleteBooking,
    globalPayroll = { defaultTarget: 0, customTargets: {}, gpsRequired: false }, onUpdateGlobalPayroll, onSaveSettings,
    knowledgeBase = "", adminRole, adminPasswords = DEFAULT_ADMIN_PASSWORDS, marqueeSettings
}) => {
    // Data State
    const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
    const [sheetTransactions, setSheetTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCloudConnected, setIsCloudConnected] = useState(false);
    const [syncMessage, setSyncMessage] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Mode State: 'live' listens to recent 500, 'history' means user loaded a custom range
    const [dataMode, setDataMode] = useState<'live' | 'history'>('live');

    // View State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'customers' | 'marketing' | 'payroll' | 'settings' | 'menu'>('dashboard');

    // Filter State
    const [startDate, setStartDate] = useState(getSydneyToday());
    const [endDate, setEndDate] = useState(getSydneyToday());
    const [selectedStylistId, setSelectedStylistId] = useState<string>('all');
    const [selectedDiscountFilter, setSelectedDiscountFilter] = useState<string>('all');

    // ... Setup State ...
    const [pasteInput, setPasteInput] = useState('');
    const [config, setConfig] = useState<ParsedConfig>({ apiKey: '', projectId: '', databaseURL: '' });
    const [setupError, setSetupError] = useState('');
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'fail'>('idle');
    const [testMessage, setTestMessage] = useState('');

    // ... Menu & Staff Editing State ...
    const [editStaffList, setEditStaffList] = useState<StaffProfile[]>([]);
    const [editPricingData, setEditPricingData] = useState<ServiceCategory[]>([]);
    const [editGlobalPayroll, setEditGlobalPayroll] = useState<GlobalPayrollSettings>(globalPayroll);
    const [editKnowledgeBase, setEditKnowledgeBase] = useState(knowledgeBase);
    const [editMarqueeSettings, setEditMarqueeSettings] = useState<MarqueeSettings>(marqueeSettings || DEFAULT_MARQUEE_SETTINGS);
    const [editingStaffId, setEditingStaffId] = useState<string | null>(null); 
    const [newStaffName, setNewStaffName] = useState("");
    const [newStaffPassword, setNewStaffPassword] = useState("");
    const [newStaffAvatar, setNewStaffAvatar] = useState<string | undefined>(undefined);
    const [payrollEnabled, setPayrollEnabled] = useState(false);
    const [baseSalary, setBaseSalary] = useState<string>("");
    const [bonusRate, setBonusRate] = useState<string>("");
    const [staffFormError, setStaffFormError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [openEditCategories, setOpenEditCategories] = useState<Record<string, boolean>>({});

    // ... Password Management State ...
    const [editAdminPasswords, setEditAdminPasswords] = useState<AdminPasswords>(adminPasswords);
    const [showPasswordSection, setShowPasswordSection] = useState(false);

    // ... Transaction Editing State ...
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [editTxName, setEditTxName] = useState("");
    const [editTxPhone, setEditTxPhone] = useState("");
    const [editTxTotal, setEditTxTotal] = useState("");
    const [editTxDiscount, setEditTxDiscount] = useState("");

    // --- EFFECT: DATA LOADING ---
    useEffect(() => {
        if (!isFirebaseConfigured()) {
            setActiveTab('settings');
        }
        
        if (dataMode === 'live') {
            setIsLoading(true);
            const unsubscribe = subscribeToTransactions((txs) => {
                setSheetTransactions(Array.isArray(txs) ? txs : []);
                setIsLoading(false);
                if (Array.isArray(txs) && txs.length > 0) setIsCloudConnected(true);
            });
            return () => unsubscribe();
        }
    }, [dataMode]);

    useEffect(() => {
        setLocalTransactions(getTransactions());
        setEditStaffList(JSON.parse(JSON.stringify(staffList)));
        setEditPricingData(JSON.parse(JSON.stringify(pricingData))); 
        setEditGlobalPayroll(globalPayroll);
        setEditKnowledgeBase(knowledgeBase);
        setEditAdminPasswords(adminPasswords);
        setEditMarqueeSettings(marqueeSettings || DEFAULT_MARQUEE_SETTINGS);
    }, [staffList, pricingData, globalPayroll, knowledgeBase, adminPasswords, marqueeSettings]);

    const todayName = getSydneyDayName(new Date().toISOString());

    const quickDates = useMemo(() => {
        const dates = [];
        for (let i = 0; i < 10; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const iso = d.toISOString();
            dates.push({
                label: i === 0 ? 'Today' : i === 1 ? 'Yesterday' : d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Australia/Sydney' }),
                value: getSydneyDateStr(iso)
            });
        }
        return dates;
    }, []);

    const allTransactionsForCRM = useMemo(() => {
        return sheetTransactions.length > 0 ? sheetTransactions : localTransactions;
    }, [sheetTransactions, localTransactions]);

    const filteredTransactions = useMemo(() => {
        const source = sheetTransactions.length > 0 ? sheetTransactions : localTransactions;
        const filtered = source.filter(tx => {
            const dateStr = getSydneyDateStr(tx.date);
            if (dateStr < startDate || dateStr > endDate) return false;
            if (selectedStylistId !== 'all') {
                const staff = staffList.find(s => s.id === selectedStylistId);
                const isOwner = tx.customerName && staff && tx.customerName.includes(staff.name);
                const hasItem = tx.items.some(item => item.staffId === selectedStylistId || (staff && item.staffName === staff.name));
                if (!isOwner && !hasItem) return false;
            }
            
            // Apply discount filter
            if (selectedDiscountFilter !== 'all') {
                const discount = tx.discountPercentage || 0;
                if (selectedDiscountFilter === 'no-discount' && discount > 0) return false;
                if (selectedDiscountFilter === 'with-discount' && discount === 0) return false;
                if (selectedDiscountFilter.startsWith('discount-')) {
                    const targetDiscount = parseFloat(selectedDiscountFilter.replace('discount-', ''));
                    // Use epsilon comparison to handle floating point precision issues
                    if (Math.abs(discount - targetDiscount) > 0.001) return false;
                }
            }
            
            return true;
        });
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sheetTransactions, localTransactions, startDate, endDate, selectedStylistId, staffList, selectedDiscountFilter]);

    // Get unique discount percentages used in transactions
    const uniqueDiscounts = useMemo(() => {
        const source = sheetTransactions.length > 0 ? sheetTransactions : localTransactions;
        const discountSet = new Set<number>();
        source.forEach(tx => {
            const discount = tx.discountPercentage || 0;
            if (discount > 0) discountSet.add(discount);
        });
        return Array.from(discountSet).sort((a, b) => a - b);
    }, [sheetTransactions, localTransactions]);


    const unsyncedTransactions = useMemo(() => {
        return localTransactions.filter(localTx => 
            !sheetTransactions.some(sheetTx => sheetTx.id === localTx.id)
        );
    }, [localTransactions, sheetTransactions]);

    const stats = useMemo(() => {
        let revenue = 0;
        const orders = filteredTransactions.length;
        const serviceCounts: Record<string, number> = {};
        filteredTransactions.forEach(tx => {
            let txRevenue = 0;
            tx.items.forEach(item => {
                if (selectedStylistId !== 'all') {
                    const staff = staffList.find(s => s.id === selectedStylistId);
                    const isMyItem = item.staffId === selectedStylistId || (staff && item.staffName === staff.name);
                    if (!isMyItem) return;
                }
                const name = item.displayName || t.serviceNames[item.nameKey] || item.nameKey;
                serviceCounts[name] = (serviceCounts[name] || 0) + item.quantity;
                const gross = item.price * item.quantity;
                const discountFactor = tx.discountPercentage ? (1 - tx.discountPercentage / 100) : 1;
                txRevenue += (gross * discountFactor);
            });
            revenue += txRevenue;
        });
        const topServices = Object.entries(serviceCounts).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count }));
        const stylistStats: Record<string, { revenue: number, bonus: number, daysActive: number, bonusDays: number }> = {};
        const txByDate: Record<string, Transaction[]> = {};
        filteredTransactions.forEach(tx => {
            const dateStr = getSydneyDateStr(tx.date);
            if (!txByDate[dateStr]) txByDate[dateStr] = [];
            txByDate[dateStr].push(tx);
        });
        Object.entries(txByDate).forEach(([dateStr, dailyTxs]) => {
            const dayOfWeek = getSydneyDayName(dailyTxs[0].date); 
            const dailyTarget = editGlobalPayroll.customTargets?.[dayOfWeek] ?? editGlobalPayroll.defaultTarget ?? 0;
            const dailyStylistRev: Record<string, number> = {};
            dailyTxs.forEach(tx => {
                tx.items.forEach(item => {
                    const staffName = item.staffName;
                    if (staffName) {
                        const amount = item.price * item.quantity;
                        const discountFactor = tx.discountPercentage ? (1 - tx.discountPercentage / 100) : 1;
                        const netAmount = amount * discountFactor;
                        dailyStylistRev[staffName] = (dailyStylistRev[staffName] || 0) + netAmount;
                    }
                });
            });
            Object.entries(dailyStylistRev).forEach(([name, dailyRev]) => {
                if (selectedStylistId !== 'all') {
                    const selectedStaff = staffList.find(s => s.id === selectedStylistId);
                    if (selectedStaff && selectedStaff.name !== name) return;
                }
                if (!stylistStats[name]) stylistStats[name] = { revenue: 0, bonus: 0, daysActive: 0, bonusDays: 0 };
                const stats = stylistStats[name];
                stats.revenue += dailyRev;
                const staffProfile = staffList.find(s => s.name === name);
                if (staffProfile?.payroll?.enabled) {
                    stats.daysActive += 1;
                    if (dailyRev > dailyTarget) {
                        const dailyBonus = (dailyRev - dailyTarget) * (staffProfile.payroll.bonusRate / 100);
                        stats.bonus += dailyBonus;
                        stats.bonusDays += 1;
                    }
                }
            });
        });
        const topStylists = Object.entries(stylistStats).map(([name, stat]) => ({ name, ...stat })).sort((a, b) => b.revenue - a.revenue);
        
        // Calculate daily revenue for chart
        const dailyRevenueData: Array<{ date: string, revenue: number }> = Object.entries(txByDate).map(([dateStr, dailyTxs]) => {
            let dailyRevenue = 0;
            dailyTxs.forEach(tx => {
                tx.items.forEach(item => {
                    if (selectedStylistId !== 'all') {
                        const staff = staffList.find(s => s.id === selectedStylistId);
                        const isMyItem = item.staffId === selectedStylistId || (staff && item.staffName === staff.name);
                        if (!isMyItem) return;
                    }
                    const amount = item.price * item.quantity;
                    const discountFactor = tx.discountPercentage ? (1 - tx.discountPercentage / 100) : 1;
                    dailyRevenue += (amount * discountFactor);
                });
            });
            return { date: dateStr, revenue: dailyRevenue };
        }).sort((a, b) => a.date.localeCompare(b.date));
        
        return { revenue, orders, topServices, topStylists, dailyRevenueData };
    }, [filteredTransactions, staffList, editGlobalPayroll, selectedStylistId, t.serviceNames]);

    const handleManualRefresh = async () => {
        setIsLoading(true);
        const txs = await fetchTransactionsOnce();
        setSheetTransactions(txs);
        setDataMode('live');
        setIsLoading(false);
        setSyncMessage("Refreshed!");
        setTimeout(() => setSyncMessage(""), 2000);
    };

    const handleLoadDateRange = async () => {
        setIsLoading(true);
        try {
            const txs = await fetchTransactionsByDateRange(startDate, endDate);
            setDataMode('history');
            setSheetTransactions(txs);
            if (txs.length === 0) setSyncMessage("No records found for range.");
            else setSyncMessage(`Loaded ${txs.length} records.`);
        } catch (e) {
            alert("Error loading history. Please try again.");
        } finally {
            setIsLoading(false);
            setTimeout(() => setSyncMessage(""), 3000);
        }
    };

    const handleSyncLocalToCloud = async () => {
        setIsSyncing(true);
        let successCount = 0;
        for (const tx of unsyncedTransactions) {
            const result = await saveTransactionToFirebase(tx);
            if (result.success) successCount++;
        }
        setIsSyncing(false);
        if (successCount > 0) {
            setSyncMessage(`Synced ${successCount} transactions!`);
            handleManualRefresh();
        } else {
            alert("Sync failed. The data might be invalid or server unreachable.");
        }
    };

    const handleDiscardUnsynced = () => {
        if (!window.confirm("Delete stuck transactions from THIS device? \n\nWarning: These transactions have NOT been saved to the Cloud. This action cannot be undone.")) return;
        unsyncedTransactions.forEach(tx => deleteLocalTransaction(tx.id));
        setLocalTransactions(getTransactions());
        alert("Local stuck data cleared.");
    };

    const handleForceSyncAll = async () => {
        if (!window.confirm("This will overwrite Cloud data with all Local data. Continue?")) return;
        setIsSyncing(true);
        let successCount = 0;
        for (const tx of localTransactions) {
            const result = await saveTransactionToFirebase(tx);
            if (result.success) successCount++;
        }
        setIsSyncing(false);
        alert(`Forced sync complete. ${successCount} processed.`);
        handleManualRefresh();
    };

    const exportToCSV = (transactions: Transaction[]) => {
        const headers = ["ID", "Date (Sydney)", "Customer", "Phone", "Items", "Total", "Discount %", "Net Total"];
        const rows = transactions.map(tx => {
            const itemsStr = tx.items.map(i => {
                const name = i.displayName || t.serviceNames[i.nameKey] || i.nameKey;
                const staffPart = i.staffName ? ` [${i.staffName}]` : '';
                return `${i.quantity}x ${name}${staffPart} ($${i.price})`;
            }).join("; ");
            const discountFactor = tx.discountPercentage ? (1 - tx.discountPercentage/100) : 1;
            return [tx.id, getSydneyDateStr(tx.date) + " " + new Date(tx.date).toLocaleTimeString('en-AU', {timeZone: 'Australia/Sydney'}), `"${tx.customerName || ''}"`, `"${tx.customerPhone || ''}"`, `"${itemsStr}"`, (tx.total / discountFactor).toFixed(2), tx.discountPercentage || 0, tx.total.toFixed(2)].join(",");
        });
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `laperla_export_${getSydneyDateStr(new Date().toISOString())}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePasteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setPasteInput(val);
        const parsed = parseConfigString(val);
        if (parsed.apiKey || parsed.projectId) {
            setConfig(prev => ({...prev, apiKey: parsed.apiKey || prev.apiKey, projectId: parsed.projectId || prev.projectId, databaseURL: parsed.databaseURL || prev.databaseURL}));
            setSetupError('');
            setTestStatus('idle');
        }
    };
    const handleTestConnection = async () => {
        setTestStatus('testing');
        setTestMessage("Checking connection...");
        const result = await validateConnection(config);
        if (result.success) { setTestStatus('success'); setTestMessage("Connection successful!"); } else { setTestStatus('fail'); setTestMessage(result.error || "Connection failed."); }
    };
    const handleSaveConfig = () => {
        const result = saveFirebaseConfigLocally(config);
        if (result.success) { alert("Configuration saved! The app will reload."); window.location.reload(); } else { setSetupError(result.error || "Invalid configuration."); }
    };
    
    const handleClearHistory = async () => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const dateStr = sixMonthsAgo.toLocaleDateString();
        if (window.confirm(`XÁC NHẬN: Bạn sắp xóa dữ liệu giao dịch cũ hơn 6 tháng (trước ngày ${dateStr}).\n\n- Dữ liệu 6 tháng gần nhất sẽ được GIỮ LẠI.\n- Danh sách Nhân viên và Bảng giá sẽ KHÔNG bị mất.\n\nBạn có chắc chắn muốn xóa không?`)) {
            const result = await pruneOldTransactionsFromFirebase(sixMonthsAgo);
            setLocalTransactions(getTransactions());
            if (result.success) {
                const txs = await fetchTransactionsOnce();
                setSheetTransactions(txs);
                alert(`Đã xóa sạch ${result.count} giao dịch cũ hơn ${dateStr}.`);
            } else {
                alert("Lỗi khi xóa dữ liệu trên Cloud. Vui lòng kiểm tra kết nối.");
            }
        }
    };

    const handleDeleteOldIncompleteBills = async () => {
        if (window.confirm(`XÁC NHẬN: Bạn sắp xóa tất cả các đơn hàng CHƯA THANH TOÁN được tạo từ hôm qua trở về trước.\n\n- Các đơn hàng chưa thanh toán từ hôm qua trở về trước sẽ bị XÓA.\n- Các đơn hàng hôm nay sẽ được GIỮ LẠI.\n- Các giao dịch đã hoàn tất sẽ KHÔNG bị ảnh hưởng.\n\nBạn có chắc chắn muốn xóa không?`)) {
            const result = await deleteOldIncompleteBills();
            if (result.success) {
                alert(`Đã xóa sạch ${result.count} đơn hàng chưa thanh toán cũ.`);
            } else {
                alert(`Lỗi khi xóa đơn hàng: ${result.error || "Vui lòng kiểm tra kết nối."}`);
            }
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const compressedBlob = await compressImage(file, 0.7, 300);
                const reader = new FileReader();
                reader.onloadend = () => { setNewStaffAvatar(reader.result as string); setStaffFormError(""); };
                reader.readAsDataURL(compressedBlob);
            } catch (err) {
                setStaffFormError("Image processing failed. Try a smaller image.");
            }
        }
    };

    const handleSelectStaffForEdit = (staff: StaffProfile) => {
        setEditingStaffId(staff.id); setNewStaffName(staff.name); setNewStaffPassword(staff.password || ""); setNewStaffAvatar(staff.avatar);
        if (staff.payroll) { setPayrollEnabled(staff.payroll.enabled); setBaseSalary(staff.payroll.baseSalary.toString()); setBonusRate(staff.payroll.bonusRate.toString()); } 
        else { setPayrollEnabled(false); setBaseSalary("150"); setBonusRate("20"); }
        setStaffFormError(""); window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleCancelEdit = () => {
        setEditingStaffId(null); setNewStaffName(""); setNewStaffPassword(""); setNewStaffAvatar(undefined);
        setPayrollEnabled(false); setBaseSalary(""); setBonusRate(""); setStaffFormError(""); if(fileInputRef.current) fileInputRef.current.value = "";
    };
    const handleSaveStaff = async () => {
        if (!newStaffName.trim()) { setStaffFormError("Name is required"); return; }
        if (!newStaffPassword.trim()) { setStaffFormError("Password is required for login"); return; }
        const payrollConfig: PayrollConfig | undefined = payrollEnabled ? { enabled: true, baseSalary: parseFloat(baseSalary) || 0, bonusRate: parseFloat(bonusRate) || 0, } : undefined;
        
        // Calculate the new staff list
        let updatedStaffList: StaffProfile[];
        if (editingStaffId && editingStaffId !== 'new') { 
            updatedStaffList = editStaffList.map(s => s.id === editingStaffId ? { ...s, name: newStaffName.trim(), password: newStaffPassword.trim(), avatar: newStaffAvatar, payroll: payrollConfig } : s);
        } else { 
            const newStaff: StaffProfile = { id: Date.now().toString(), name: newStaffName.trim(), password: newStaffPassword.trim(), avatar: newStaffAvatar, payroll: payrollConfig };
            updatedStaffList = [...editStaffList, newStaff];
        }
        
        // Update local state
        setEditStaffList(updatedStaffList);
        
        // Save to Firebase immediately
        if (onSaveSettings) {
            setIsSavingSettings(true);
            try {
                await onSaveSettings(updatedStaffList, editPricingData, editGlobalPayroll, editKnowledgeBase, editAdminPasswords, editMarqueeSettings);
                // Only clear the form if save was successful
                handleCancelEdit();
            } catch (error) {
                console.error("Error saving staff settings:", error);
                setStaffFormError("Failed to save. Please try again.");
                // Revert local state on error
                setEditStaffList(structuredClone(staffList));
            } finally {
                setIsSavingSettings(false);
            }
        } else {
            // If no onSaveSettings callback, just clear the form
            handleCancelEdit();
        }
    };
    const handleRemoveStaff = async (id: string) => { 
        if (window.confirm("Are you sure you want to remove this staff member?")) { 
            const updatedStaffList = editStaffList.filter(s => s.id !== id);
            setEditStaffList(updatedStaffList);
            
            // Save to Firebase immediately
            if (onSaveSettings) {
                setIsSavingSettings(true);
                try {
                    await onSaveSettings(updatedStaffList, editPricingData, editGlobalPayroll, editKnowledgeBase, editAdminPasswords, editMarqueeSettings);
                    // Only clear the form if save was successful and we're editing this staff
                    if (editingStaffId === id) handleCancelEdit();
                } catch (error) {
                    console.error("Error removing staff:", error);
                    alert("Failed to remove staff. Please try again.");
                    // Revert local state on error
                    setEditStaffList(structuredClone(staffList));
                } finally {
                    setIsSavingSettings(false);
                }
            } else {
                if (editingStaffId === id) handleCancelEdit();
            }
        } 
    };
    
    // --- SERVICE & CATEGORY HANDLERS ---
    const handleUpdateService = (catIndex: number, srvIndex: number, field: 'displayName' | 'price', value: string) => { const newPricing = [...editPricingData]; newPricing[catIndex].services[srvIndex] = { ...newPricing[catIndex].services[srvIndex], [field]: value }; setEditPricingData(newPricing); };
    const handleAddService = (catIndex: number) => { const newPricing = [...editPricingData]; newPricing[catIndex].services.push({ nameKey: `custom_${Date.now()}`, price: '$0', displayName: 'New Service' }); setEditPricingData(newPricing); };
    const handleRemoveService = (catIndex: number, srvIndex: number) => { if (window.confirm("Are you sure you want to delete this service?")) { const newPricing = [...editPricingData]; newPricing[catIndex].services.splice(srvIndex, 1); setEditPricingData(newPricing); } };
    
    const handleMoveService = (catIndex: number, srvIndex: number, direction: 'up' | 'down') => {
        const newPricing = [...editPricingData];
        const services = [...newPricing[catIndex].services];
        if (direction === 'up' && srvIndex > 0) {
            [services[srvIndex], services[srvIndex - 1]] = [services[srvIndex - 1], services[srvIndex]];
        } else if (direction === 'down' && srvIndex < services.length - 1) {
            [services[srvIndex], services[srvIndex + 1]] = [services[srvIndex + 1], services[srvIndex]];
        }
        newPricing[catIndex] = { ...newPricing[catIndex], services };
        setEditPricingData(newPricing);
    };

    const handleUpdateCategoryName = (index: number, newName: string) => {
        const newPricing = [...editPricingData];
        newPricing[index] = { ...newPricing[index], categoryKey: newName };
        setEditPricingData(newPricing);
    };
    const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
        const newPricing = [...editPricingData];
        if (direction === 'up' && index > 0) {
            [newPricing[index], newPricing[index - 1]] = [newPricing[index - 1], newPricing[index]];
        } else if (direction === 'down' && index < newPricing.length - 1) {
            [newPricing[index], newPricing[index + 1]] = [newPricing[index + 1], newPricing[index]];
        }
        setEditPricingData(newPricing);
    };
    const handleAddCategory = () => {
        const newPricing = [...editPricingData];
        newPricing.push({
            categoryKey: `New Group ${Date.now()}`,
            services: []
        });
        setEditPricingData(newPricing);
    };
    const handleRemoveCategory = (index: number) => {
        if (window.confirm("Delete this entire service group?")) {
            const newPricing = [...editPricingData];
            newPricing.splice(index, 1);
            setEditPricingData(newPricing);
        }
    };
    
    const toggleEditCategory = (key: string) => { setOpenEditCategories(prev => ({ ...prev, [key]: !prev[key] })); };
    
    const handleSaveAllSettings = async () => { 
        if (!isFirebaseConfigured()) { alert("Please connect to Firebase before saving."); return; } 
        setIsSavingSettings(true); 
        try {
            if (onSaveSettings) { 
                await onSaveSettings(editStaffList, editPricingData, editGlobalPayroll, editKnowledgeBase, editAdminPasswords, editMarqueeSettings); 
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            // Error alert is already shown by onSaveSettings
        } finally {
            setIsSavingSettings(false); 
        }
    };

    const handleEditTransactionClick = (tx: Transaction) => {
        setEditingTransaction(tx);
        setEditTxName(tx.customerName || '');
        setEditTxPhone(tx.customerPhone || '');
        setEditTxTotal(tx.total.toString());
        setEditTxDiscount(tx.discountPercentage ? tx.discountPercentage.toString() : '0');
    };

    const handleSaveTransaction = async () => {
        if (!editingTransaction) return;
        const updatedTx: Transaction = { ...editingTransaction, customerName: editTxName, customerPhone: editTxPhone, total: parseFloat(editTxTotal) || 0, discountPercentage: parseFloat(editTxDiscount) || 0, lastUpdated: Date.now() };
        const success = await updateTransactionInFirebase(updatedTx);
        if (success) setEditingTransaction(null);
        else alert("Failed to update transaction on Cloud.");
    };

    const handleDeleteTransaction = async () => {
        if (!editingTransaction) return;
        if (window.confirm("Delete this transaction permanently?")) {
            await deleteTransactionFromFirebase(editingTransaction.id);
            setEditingTransaction(null);
            setSheetTransactions(prev => prev.filter(t => t.id !== editingTransaction.id));
            setLocalTransactions(prev => prev.filter(t => t.id !== editingTransaction.id));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <header className="bg-charcoal text-white p-4 sticky top-0 z-30 shadow-md">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 overflow-x-hidden">
                  <div className="flex items-center gap-2">
                      <LaPerlaLogo className="w-32 brightness-0 invert" />
                      <div className="flex flex-col">
                          <span className="text-gray-400 text-sm border-l border-gray-600 pl-3 ml-1">Admin Dashboard</span>
                          <span className="text-gold-leaf text-[10px] pl-3 ml-1 uppercase font-bold tracking-wider">{adminRole === 'master' ? 'Master Access' : 'Store Manager'}</span>
                      </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                      <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-gold-leaf text-white' : 'hover:bg-white/10'}`}>Dashboard</button>
                      <button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'bookings' ? 'bg-gold-leaf text-white' : 'hover:bg-white/10'}`}>Bookings ({bookings.filter(b=>b.status==='pending').length})</button>
                      <button onClick={() => setActiveTab('customers')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'customers' ? 'bg-gold-leaf text-white' : 'hover:bg-white/10'}`}>Customers</button>
                      <button onClick={() => setActiveTab('marketing')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'marketing' ? 'bg-gold-leaf text-white' : 'hover:bg-white/10'}`}>Marketing 🎁</button>
                      <button onClick={() => setActiveTab('payroll')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'payroll' ? 'bg-gold-leaf text-white' : 'hover:bg-white/10'}`}>💰 Payroll</button>
                      <button onClick={() => setActiveTab('menu')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'menu' ? 'bg-gold-leaf text-white' : 'hover:bg-white/10'}`}>Menu & Staff</button>
                      <button onClick={() => setActiveTab('settings')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'bg-gold-leaf text-white' : 'hover:bg-white/10'}`}>Settings</button>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-center">
                      <button onClick={() => exportToCSV(filteredTransactions)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                          <DownloadIcon className="w-4 h-4" /> Export CSV
                      </button>
                      <button onClick={onLogout} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-bold transition-colors">
                          {t.logout}
                      </button>
                  </div>
              </div>
            </header>

            <main className="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full">
                {activeTab === 'dashboard' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className={`w-3 h-3 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : (sheetTransactions.length > 0 ? 'bg-green-500' : 'bg-red-500')}`}></div>
                                        <span className="text-sm font-bold text-gray-700">{isLoading ? 'Syncing...' : (sheetTransactions.length > 0 ? 'Cloud Data Loaded' : 'Waiting for Cloud...')}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">{sheetTransactions.length} records found in Cloud. {dataMode === 'history' && (<span className="ml-2 font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">HISTORICAL VIEW (Not Live)</span>)}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleManualRefresh} className="text-xs bg-gray-100 text-charcoal border border-gray-200 px-3 py-2 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center gap-1">↻ Refresh / Reset Live</button>
                                </div>
                            </div>
                            {unsyncedTransactions.length > 0 && (
                                <div className="flex items-center justify-between bg-orange-50 border border-orange-200 p-3 rounded-lg animate-fade-in shadow-sm">
                                    <div className="flex items-center gap-3"><div className="bg-orange-100 p-2 rounded-full text-orange-600"><UploadIcon className="w-5 h-5" /></div><div><p className="text-sm font-bold text-orange-800">Local Data Mismatch</p><p className="text-xs text-orange-700">{unsyncedTransactions.length} transactions are on THIS device but not the Cloud.</p></div></div>
                                    <div className="flex gap-2"><button onClick={handleDiscardUnsynced} className="bg-white border border-orange-200 text-orange-600 hover:bg-red-50 text-xs font-bold px-3 py-2 rounded-lg shadow-sm transition-colors">Discard (Xóa)</button><button onClick={handleSyncLocalToCloud} disabled={isSyncing} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2">{isSyncing ? "Uploading..." : `Sync Now`}</button></div>
                                </div>
                            )}
                            {sheetTransactions.length === 0 && localTransactions.length > 0 && (<div className="text-right"><button onClick={handleForceSyncAll} className="text-xs text-gray-400 hover:text-red-500 underline">Force Push All {localTransactions.length} Local Items</button></div>)}
                            {syncMessage && <p className="text-center text-xs font-bold text-green-600">{syncMessage}</p>}
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {quickDates.map((d, i) => (<button key={i} onClick={() => { setStartDate(d.value); setEndDate(d.value); }} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${startDate === d.value && endDate === d.value ? 'bg-gold-leaf text-white border-gold-leaf' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>{d.label}</button>))}
                            </div>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase px-1">FILTER DATE RANGE</span>
                                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-gold-leaf font-bold text-charcoal" />
                                    <span className="text-gray-400">-</span>
                                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white border border-gray-200 rounded px-2 py-1.5 text-sm outline-none focus:border-gold-leaf font-bold text-charcoal" />
                                    <button onClick={handleLoadDateRange} className="bg-gold-leaf text-white p-1.5 rounded hover:bg-charcoal transition-colors ml-1" title="Load Full History for Range"><SearchIcon className="w-4 h-4" /></button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative"><select value={selectedStylistId} onChange={(e) => setSelectedStylistId(e.target.value)} className="appearance-none bg-white pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm font-bold text-charcoal focus:outline-none focus:border-gold-leaf shadow-sm cursor-pointer"><option value="all">All Stylists</option>{staffList.map(staff => (<option key={staff.id} value={staff.id}>{staff.name}</option>))}</select><UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /><ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div>
                                    <div className="relative"><select value={selectedDiscountFilter} onChange={(e) => setSelectedDiscountFilter(e.target.value)} className="appearance-none bg-white pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm font-bold text-charcoal focus:outline-none focus:border-gold-leaf shadow-sm cursor-pointer"><option value="all">{t.allDiscounts}</option><option value="no-discount">{t.noDiscount}</option><option value="with-discount">{t.withDiscount}</option>{uniqueDiscounts.map(discount => (<option key={discount} value={`discount-${discount}`}>{discount}% {t.discountLabel}</option>))}</select><PriceTagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /><ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div>
                                </div>
                                <div className="flex items-center gap-2 border-l border-gray-200 pl-4"><div className="bg-gold-leaf/10 p-1.5 rounded-full"><LockIcon className="w-3 h-3 text-gold-leaf" /></div><div><div className="flex items-baseline gap-1"><span className="text-[10px] font-bold text-gray-400 uppercase">TARGET ({todayName})</span><input type="number" value={editGlobalPayroll.customTargets?.[todayName] ?? ''} placeholder="0" onChange={(e) => { const val = parseFloat(e.target.value); const newTargets = { ...editGlobalPayroll.customTargets }; if (isNaN(val)) delete newTargets[todayName]; else newTargets[todayName] = val; const newPayroll = {...editGlobalPayroll, customTargets: newTargets}; setEditGlobalPayroll(newPayroll); if (onUpdateGlobalPayroll) onUpdateGlobalPayroll(newPayroll); if (onSaveSettings) onSaveSettings(editStaffList, editPricingData, newPayroll, editKnowledgeBase, editAdminPasswords, editMarqueeSettings); }} className="font-bold text-charcoal w-16 border-b border-gray-300 focus:border-gold-leaf outline-none text-sm bg-transparent" /></div></div></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{t.revenue}</p><div className="flex items-end justify-between"><h3 className="text-3xl font-serif font-bold text-charcoal">${stats.revenue.toFixed(2)}</h3><ChartIcon className="w-8 h-8 text-gold-leaf opacity-20" /></div></div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{t.orders}</p><div className="flex items-end justify-between"><h3 className="text-3xl font-serif font-bold text-charcoal">{stats.orders}</h3><ReceiptIcon className="w-8 h-8 text-gold-leaf opacity-20" /></div></div>
                            <div className="bg-charcoal text-white p-6 rounded-2xl shadow-md col-span-2 relative overflow-hidden"><div className="relative z-10"><p className="text-gold-leaf text-xs font-bold uppercase tracking-wider mb-2">TOP STYLIST (REVENUE)</p>{stats.topStylists.length > 0 ? (<><h3 className="text-3xl font-serif font-bold">{stats.topStylists[0].name}</h3><p className="text-gray-400 text-sm mt-1">${stats.topStylists[0].revenue.toFixed(2)} generated</p></>) : <p className="text-gray-500 italic">No data</p>}</div></div>
                        </div>

                        {/* Daily Revenue Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-xl font-serif font-bold text-charcoal mb-4 flex items-center gap-2">
                                <ChartIcon className="w-6 h-6 text-gold-leaf" />
                                Daily Revenue Breakdown
                            </h3>
                            {stats.dailyRevenueData.length > 0 ? (
                                <div className="space-y-3">
                                    {(() => {
                                        const maxRevenue = Math.max(...stats.dailyRevenueData.map(d => d.revenue), 1);
                                        return stats.dailyRevenueData.map((day, idx) => {
                                            const percentage = (day.revenue / maxRevenue) * 100;
                                            const formattedDate = new Date(day.date).toLocaleDateString('en-AU', {
                                                timeZone: 'Australia/Sydney',
                                                month: 'short',
                                                day: 'numeric',
                                                weekday: 'short'
                                            });
                                            return (
                                                <div key={idx} className="group">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-bold text-gray-600 min-w-[120px]">{formattedDate}</span>
                                                        <span className="text-sm font-bold text-charcoal">${day.revenue.toFixed(2)}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden relative">
                                                        <div 
                                                            className="h-full bg-gradient-to-r from-gold-leaf to-yellow-400 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
                                                            style={{ width: `${Math.max(percentage, 2)}%` }}
                                                        >
                                                            {percentage > 15 && (
                                                                <span className="text-xs font-bold text-white drop-shadow">
                                                                    ${day.revenue.toFixed(0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <ChartIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm italic">No revenue data for selected period</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="text-xl font-serif font-bold text-charcoal mb-4">{t.topServices}</h3><div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">{stats.topServices.map((svc, i) => (<div key={i} className="flex justify-between items-center"><div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-gold-leaf/10 text-gold-leaf text-xs font-bold flex items-center justify-center">{i + 1}</span><span className="text-charcoal font-medium">{svc.name}</span></div><span className="font-bold text-charcoal">{svc.count}</span></div>))}</div></div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="flex justify-between items-center mb-4"><h3 className="text-xl font-serif font-bold text-charcoal">Stylist Performance</h3><div className="flex gap-2 text-[10px] font-bold uppercase"><span className="text-green-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Revenue</span><span className="text-purple-600 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Bonus</span></div></div><div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">{stats.topStylists.map((stylist, i) => { const staffProfile = staffList.find(s => s.name === stylist.name); const hasPayroll = staffProfile?.payroll?.enabled; const isSelected = selectedStylistId !== 'all' && selectedStylistId === staffProfile?.id; return (<div key={i} className={`flex justify-between items-center py-2 border-b border-gray-50 last:border-0 group relative ${isSelected ? 'bg-gold-leaf/5 -mx-2 px-2 rounded-lg' : ''}`}><span className="text-charcoal font-medium flex items-center gap-2">{stylist.name}{hasPayroll && <span className="text-green-500 text-[10px] bg-green-50 px-1 rounded border border-green-100" title="Payroll Active">$</span>}</span><div className="text-right"><span className="block font-bold text-green-600">${stylist.revenue.toFixed(2)}</span>{stylist.bonus > 0 && (<span className="block text-xs font-bold text-purple-600 cursor-help border-b border-dashed border-purple-200">+${stylist.bonus.toFixed(2)} Bonus</span>)}</div></div>)})}</div></div>
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="text-xl font-serif font-bold text-charcoal mb-4">{t.recentTransactions}</h3><div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">{filteredTransactions.map((tx, i) => (<div key={tx.id} onClick={() => handleEditTransactionClick(tx)} className="pb-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors group"><div className="flex justify-between items-start"><div><p className="font-bold text-charcoal text-lg group-hover:text-gold-leaf transition-colors">${tx.total.toFixed(2)}{tx.customerName && <span className="text-sm font-normal text-gray-500 ml-2">- {tx.customerName}</span>}</p><p className="text-xs text-gray-400 mt-1">{getSydneyDateStr(tx.date)} {new Date(tx.date).toLocaleTimeString('en-AU', {timeZone: 'Australia/Sydney', hour: '2-digit', minute:'2-digit'})}</p><p className="text-[10px] text-gray-400 mt-0.5">{tx.items.length} items {tx.discountPercentage ? `(-${tx.discountPercentage}%)` : ''}</p></div><PencilIcon className="w-4 h-4 text-gray-300 group-hover:text-gold-leaf" /></div></div>))}{filteredTransactions.length === 0 && <p className="text-center text-gray-400 italic text-sm py-4">No data available.</p>}</div></div>
                        </div>
                    </div>
                )}

                {activeTab === 'bookings' && (
                    <div className="space-y-4 animate-fade-in">
                        {bookings.length === 0 ? (<div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm"><CalendarIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-400 font-medium">No booking requests yet.</p></div>) : (<div className="grid grid-cols-1 gap-4">{bookings.map(booking => (<div key={booking.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 relative overflow-hidden group hover:border-gold-leaf/30 transition-colors"><div className={`absolute left-0 top-0 bottom-0 w-1.5 ${booking.status === 'pending' ? 'bg-yellow-400' : booking.status === 'confirmed' ? 'bg-green-500' : 'bg-red-400'}`}></div><div className="flex-grow space-y-3"><div className="flex justify-between items-start"><div><h3 className="font-serif font-bold text-xl text-charcoal">{booking.customerName}</h3><p className="text-sm text-gray-500 flex items-center gap-2 mt-1"><PhoneIcon className="w-4 h-4 text-gold-leaf" /><a href={`tel:${booking.customerPhone}`} className="hover:underline">{booking.customerPhone}</a></p></div><span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{booking.status}</span></div><div className="flex items-center gap-2 text-sm font-medium text-charcoal bg-gray-50 p-2 rounded-lg w-fit"><CalendarIcon className="w-4 h-4 text-gold-leaf" /><span>{new Date(booking.date).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })}</span><span className="text-gray-300">|</span><span>{booking.timeSlot}</span></div><div><p className="text-xs font-bold text-gray-400 uppercase mb-2">Services Requested</p><div className="flex flex-wrap gap-2">{booking.services.map((s, i) => (<span key={i} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-medium text-charcoal shadow-sm flex items-center gap-1"><SparklesIcon className="w-3 h-3 text-gold-leaf" />{s}</span>))}</div></div>{booking.notes && (<div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100 text-sm text-yellow-800 italic">" {booking.notes} "</div>)}<p className="text-[10px] text-gray-300 pt-2">Request sent: {new Date(booking.createdAt).toLocaleString()}</p></div><div className="flex flex-col gap-3 justify-center md:min-w-[150px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">{booking.status === 'pending' && (<button onClick={() => onUpdateBookingStatus && onUpdateBookingStatus(booking.id, 'confirmed')} className="w-full py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm shadow-md hover:bg-green-600 transition-colors flex items-center justify-center gap-2">Confirm</button>)}{booking.status !== 'cancelled' && (<button onClick={() => onUpdateBookingStatus && onUpdateBookingStatus(booking.id, 'cancelled')} className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">Cancel</button>)}<button onClick={() => onDeleteBooking && onDeleteBooking(booking.id)} className="w-full py-2 text-red-300 hover:text-red-500 text-xs font-bold transition-colors flex items-center justify-center gap-1 mt-auto"><TrashIcon className="w-3 h-3" /> Remove</button></div></div>))}</div>)}
                    </div>
                )}

                {activeTab === 'customers' && (
                    <CustomerCRMView t={t} transactions={allTransactionsForCRM} staffList={staffList} pricingData={pricingData} />
                )}

                {activeTab === 'marketing' && (
                    <MarketingView t={t} transactions={allTransactionsForCRM} />
                )}

                {activeTab === 'payroll' && (
                    <PayrollView 
                        t={t}
                        staffList={editStaffList}
                        transactions={allTransactionsForCRM}
                        globalPayroll={editGlobalPayroll}
                    />
                )}

                {activeTab === 'settings' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                        {adminRole === 'master' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                <h3 className="text-xl font-serif font-bold text-charcoal mb-4 flex items-center gap-2"><LockIcon className="w-6 h-6 text-gold-leaf" /> Connection Setup</h3>
                                <div className="space-y-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Paste Firebase JSON Config</label><textarea className="w-full p-3 border border-gray-200 rounded-xl text-xs font-mono bg-gray-50 focus:border-gold-leaf outline-none" rows={6} placeholder='{ "apiKey": "...", "projectId": "..." }' value={pasteInput} onChange={handlePasteChange}></textarea></div><div className="bg-gray-50 p-4 rounded-xl space-y-2"><p className="text-xs text-gray-500 font-bold">Preview:</p><p className="text-xs text-charcoal truncate">Project ID: {config.projectId || 'Not detected'}</p><p className="text-xs text-charcoal truncate">Database: {config.databaseURL || 'Auto-detected'}</p></div><div className="flex gap-2"><button onClick={handleTestConnection} disabled={!config.projectId || testStatus === 'testing'} className="flex-1 py-2 bg-gray-200 text-charcoal rounded-lg font-bold text-sm hover:bg-gray-300 disabled:opacity-50">{testStatus === 'testing' ? "Testing..." : "Test Connection"}</button><button onClick={handleSaveConfig} disabled={testStatus !== 'success'} className="flex-1 py-2 bg-gold-leaf text-white rounded-lg font-bold text-sm hover:bg-charcoal disabled:opacity-50 transition-colors">Save & Reload</button></div>{testMessage && (<p className={`text-center text-xs font-bold ${testStatus === 'success' ? 'text-green-600' : testStatus === 'fail' ? 'text-red-500' : 'text-gray-500'}`}>{testMessage}</p>)}{setupError && <p className="text-center text-xs text-red-500 font-bold">{setupError}</p>}</div>
                            </div>
                        )}
                        <div className="flex flex-col gap-6">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><div className="flex justify-between items-center mb-2"><div><h3 className="text-xl font-serif font-bold text-charcoal flex items-center gap-2"><MapPinIcon className="w-6 h-6 text-gold-leaf" /> Location Security</h3><p className="text-xs text-gray-500 mt-1">Prevent fake orders by requiring staff to be at the shop.</p></div><div className="flex items-center gap-2"><span className="text-xs font-bold uppercase text-gray-400">{editGlobalPayroll.gpsRequired ? 'Enabled' : 'Disabled'}</span><button onClick={() => { const newSettings = { ...editGlobalPayroll, gpsRequired: !editGlobalPayroll.gpsRequired }; setEditGlobalPayroll(newSettings); if (onUpdateGlobalPayroll) onUpdateGlobalPayroll(newSettings); if (onSaveSettings) onSaveSettings(editStaffList, editPricingData, newSettings, editKnowledgeBase, editAdminPasswords, editMarqueeSettings); }} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 focus:outline-none ${editGlobalPayroll.gpsRequired ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${editGlobalPayroll.gpsRequired ? 'translate-x-6' : 'translate-x-0'}`}></div></button></div></div><div className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded-lg border border-gray-100">Note: Staff must allow location access on their devices for this to work.</div></div>
                            
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gold-leaf/20">
                                <h3 className="text-xl font-serif font-bold text-charcoal mb-4 flex items-center gap-2">
                                    <SparklesIcon className="w-6 h-6 text-gold-leaf" /> Kiosk Marquee Banner
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">Customize the scrolling message at the top of the kiosk screen.</p>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Message Text</label>
                                        <textarea 
                                            value={editMarqueeSettings.message} 
                                            onChange={(e) => setEditMarqueeSettings({ ...editMarqueeSettings, message: e.target.value })} 
                                            className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:border-gold-leaf outline-none" 
                                            rows={3} 
                                            placeholder="e.g. 💎 Join our 1-year Membership to choose ANY color you like without paying extra! 💎"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Animation Speed</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button 
                                                onClick={() => setEditMarqueeSettings({ ...editMarqueeSettings, speed: 15 })}
                                                className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${editMarqueeSettings.speed === 15 ? 'bg-gold-leaf text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                Fast (15s)
                                            </button>
                                            <button 
                                                onClick={() => setEditMarqueeSettings({ ...editMarqueeSettings, speed: 25 })}
                                                className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${editMarqueeSettings.speed === 25 ? 'bg-gold-leaf text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                Medium (25s)
                                            </button>
                                            <button 
                                                onClick={() => setEditMarqueeSettings({ ...editMarqueeSettings, speed: 45 })}
                                                className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${editMarqueeSettings.speed === 45 ? 'bg-gold-leaf text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                Slow (45s)
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-charcoal text-white p-4 rounded-xl overflow-hidden">
                                        <p className="text-[10px] font-bold uppercase mb-2 text-gold-leaf">Preview:</p>
                                        <div className="overflow-hidden whitespace-nowrap">
                                            <div 
                                                className="inline-block animate-marquee text-sm font-bold text-gold-leaf"
                                                style={{ animationDuration: `${editMarqueeSettings.speed}s` }}
                                            >
                                                <span>{editMarqueeSettings.message} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                                <span>{editMarqueeSettings.message} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={handleSaveAllSettings} 
                                        disabled={isSavingSettings} 
                                        className="w-full py-3 bg-gold-leaf text-white font-bold rounded-xl hover:bg-charcoal transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {isSavingSettings ? "Saving..." : "Save Marquee Settings"}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-200"><h3 className="text-xl font-serif font-bold text-blue-700 mb-4 flex items-center gap-2"><SparklesIcon className="w-6 h-6" /> AI Knowledge Base</h3><p className="text-sm text-gray-600 mb-2">Teach the AI about your shop rules, policies, parking, etc. This text is added to the AI's instructions.</p><textarea value={editKnowledgeBase} onChange={(e) => setEditKnowledgeBase(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:border-blue-500 outline-none mb-4" rows={5} placeholder="e.g. Parking is available behind the building. We offer a 3-day guarantee on Shellac. Cash payments get 5% off." /><button onClick={handleSaveAllSettings} disabled={isSavingSettings} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">{isSavingSettings ? "Saving..." : "Save Knowledge Base"}</button></div>
                            {adminRole === 'master' && (
                                <><div className="bg-white p-6 rounded-2xl shadow-sm border border-charcoal/20"><h3 className="text-xl font-serif font-bold text-charcoal mb-4 flex items-center gap-2"><LockIcon className="w-6 h-6" /> Security & Access Control</h3>{!showPasswordSection ? (<button onClick={() => setShowPasswordSection(true)} className="w-full py-3 bg-gray-100 text-charcoal font-bold rounded-xl hover:bg-gray-200 transition-colors">Change Admin Passwords</button>) : (<div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Master Admin Password</label><input type="text" value={editAdminPasswords.master} onChange={(e) => setEditAdminPasswords(prev => ({...prev, master: e.target.value}))} className="w-full p-2 border rounded-lg text-sm" /></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Shop Manager Password</label><input type="text" value={editAdminPasswords.manager} onChange={(e) => setEditAdminPasswords(prev => ({...prev, manager: e.target.value}))} className="w-full p-2 border rounded-lg text-sm" /></div><div className="flex gap-2"><button onClick={() => setShowPasswordSection(false)} className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-500">Cancel</button><button onClick={handleSaveAllSettings} disabled={isSavingSettings} className="flex-1 py-2 bg-charcoal text-white rounded-lg text-sm font-bold hover:bg-black transition-colors">Update Passwords</button></div></div>)}</div><div className="bg-white p-6 rounded-2xl shadow-sm border border-red-200"><h3 className="text-xl font-serif font-bold text-red-600 mb-4 flex items-center gap-2"><TrashIcon className="w-6 h-6" /> System Data</h3><p className="text-sm text-gray-600 mb-4">Clean up old transaction history to keep the app fast. <br/><strong>Keeps the last 6 months of data safe.</strong></p><div className="space-y-3"><button onClick={handleClearHistory} className="w-full py-3 bg-red-50 text-red-600 border border-red-200 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2"><TrashIcon className="w-5 h-5" /> Clean Up Old Data ({'>'}6 Months)</button><button onClick={handleDeleteOldIncompleteBills} className="w-full py-3 bg-orange-50 text-orange-600 border border-orange-200 font-bold rounded-xl hover:bg-orange-600 hover:text-white transition-colors flex items-center justify-center gap-2"><TrashIcon className="w-5 h-5" /> Delete Old Incomplete Orders</button></div></div></>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'menu' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-end"><button onClick={handleSaveAllSettings} disabled={isSavingSettings} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-green-700 transition-colors disabled:opacity-50">{isSavingSettings ? "Saving to Cloud..." : "Save All Changes"}</button></div>
                        
                        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4"><h3 className="text-xl font-serif font-bold text-charcoal">Staff & Payroll</h3><button onClick={() => { handleCancelEdit(); setEditingStaffId("new"); window.scrollTo({top:0, behavior:'smooth'}); }} className="bg-charcoal text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-black whitespace-nowrap"><PlusIcon className="w-4 h-4" /> Add Staff</button></div>
                            {editingStaffId && (
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6 animate-fade-in">
                                    <h4 className="font-bold text-lg mb-4">{editingStaffId === 'new' ? 'New Staff Member' : 'Edit Staff'}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-4"><div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Name</label><input type="text" value={newStaffName} onChange={e => setNewStaffName(e.target.value)} className="w-full p-2 border rounded-lg" /></div><div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Passcode (Login)</label><input type="text" value={newStaffPassword} onChange={e => setNewStaffPassword(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="e.g. 1234" /></div><div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Profile Picture</label><div className="flex items-center gap-3">{newStaffAvatar ? <img src={newStaffAvatar} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center"><UserIcon className="w-6 h-6 text-gray-400" /></div>}<button onClick={() => fileInputRef.current?.click()} className="text-xs bg-white border px-3 py-1.5 rounded-lg font-bold hover:bg-gray-50">Upload</button><input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" /></div></div></div><div className="space-y-4 bg-white p-4 rounded-xl border border-gray-200"><div className="flex items-center justify-between"><label className="font-bold text-sm text-charcoal">Payroll & Commission</label><button onClick={() => setPayrollEnabled(!payrollEnabled)} className={`w-10 h-5 rounded-full p-1 transition-colors ${payrollEnabled ? 'bg-green-500' : 'bg-gray-300'}`}><div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${payrollEnabled ? 'translate-x-5' : ''}`}></div></button></div>{payrollEnabled && (<div className="grid grid-cols-2 gap-4 animate-fade-in"><div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Base Salary ($)</label><input type="number" value={baseSalary} onChange={e => setBaseSalary(e.target.value)} className="w-full p-2 border rounded-lg" /></div><div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Bonus Rate (%)</label><input type="number" value={bonusRate} onChange={e => setBonusRate(e.target.value)} className="w-full p-2 border rounded-lg" /></div></div>)}</div></div>
                                    <div className="flex gap-3 mt-6"><button onClick={handleSaveStaff} disabled={isSavingSettings} className="bg-gold-leaf text-white px-6 py-2 rounded-lg font-bold hover:bg-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSavingSettings ? "Saving to Cloud..." : "Save Profile"}</button><button onClick={handleCancelEdit} className="bg-gray-200 text-charcoal px-6 py-2 rounded-lg font-bold hover:bg-gray-300">Cancel</button>{editingStaffId !== 'new' && <button onClick={() => handleRemoveStaff(editingStaffId!)} disabled={isSavingSettings} className="ml-auto text-red-500 font-bold hover:underline disabled:opacity-50 disabled:cursor-not-allowed">Remove Staff</button>}</div>{staffFormError && <p className="text-red-500 text-sm mt-3 font-bold">{staffFormError}</p>}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{editStaffList.map(staff => (<div key={staff.id} onClick={() => handleSelectStaffForEdit(staff)} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gold-leaf cursor-pointer group bg-gray-50/50 hover:bg-white transition-all"><div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">{staff.avatar ? <img src={staff.avatar} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-gray-400 m-2.5" />}</div><div className="flex-grow"><p className="font-bold text-sm text-charcoal group-hover:text-gold-leaf">{staff.name}</p><p className="text-xs text-gray-400">{staff.payroll?.enabled ? `${staff.payroll.bonusRate}% Comm` : 'No Payroll'}</p></div><PencilIcon className="w-4 h-4 text-gray-300 group-hover:text-gold-leaf" /></div>))}</div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-serif font-bold text-charcoal">Daily Revenue Targets</h3><span className="text-xs text-gray-400">Bonus triggers above this amount. Set to 0 for bonus on all sales.</span></div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 bg-gray-50 p-4 rounded-xl">{DAYS_OF_WEEK.map((day, idx) => (<div key={day} className={`p-2 rounded-lg ${day === todayName ? 'bg-white shadow-sm ring-1 ring-gold-leaf' : ''}`}><label className={`block text-[10px] font-bold uppercase mb-1 ${day === todayName ? 'text-gold-leaf' : 'text-gray-400'}`}>{day} {day === todayName && '(Today)'}</label><input type="number" placeholder="0" value={editGlobalPayroll.customTargets?.[day] ?? ''} onChange={(e) => { const val = e.target.value === '' ? undefined : parseFloat(e.target.value); const newTargets = { ...editGlobalPayroll.customTargets }; if (val === undefined) delete newTargets[day]; else newTargets[day] = val; setEditGlobalPayroll({ ...editGlobalPayroll, customTargets: newTargets }); }} className="w-full p-2 border border-gray-200 rounded text-sm text-center font-bold focus:border-gold-leaf outline-none" /></div>))}</div>
                        </div>

                        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                                <h3 className="text-xl font-serif font-bold text-charcoal">Service Menu Pricing</h3>
                                <button 
                                    onClick={handleAddCategory}
                                    className="bg-charcoal text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-black transition-colors whitespace-nowrap"
                                >
                                    <PlusIcon className="w-4 h-4" /> Add New Group
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                {editPricingData.map((cat, catIndex) => { 
                                    const isOpen = openEditCategories[cat.categoryKey]; 
                                    return (
                                        <div key={catIndex} className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-gold-leaf/30 transition-colors">
                                            <div className="w-full flex items-center p-3 bg-gray-50 gap-2 sm:gap-3 border-b border-gray-200">
                                                {/* REORDER CONTROLS */}
                                                <div className="flex flex-col gap-1 flex-shrink-0">
                                                    <button 
                                                        onClick={() => handleMoveCategory(catIndex, 'up')}
                                                        disabled={catIndex === 0}
                                                        className="p-1 text-gray-400 hover:text-gold-leaf disabled:opacity-20"
                                                        title="Move Up"
                                                    >
                                                        <ChevronDownIcon className="w-4 h-4 rotate-180" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleMoveCategory(catIndex, 'down')}
                                                        disabled={catIndex === editPricingData.length - 1}
                                                        className="p-1 text-gray-400 hover:text-gold-leaf disabled:opacity-20"
                                                        title="Move Down"
                                                    >
                                                        <ChevronDownIcon className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* GROUP NAME INPUT */}
                                                <div className="flex-1 flex items-center gap-2 min-w-0">
                                                    <input 
                                                        type="text" 
                                                        value={cat.categoryKey}
                                                        onChange={(e) => handleUpdateCategoryName(catIndex, e.target.value)}
                                                        className="bg-white border border-gray-200 rounded-lg px-2 sm:px-3 py-1.5 text-sm font-bold text-charcoal focus:border-gold-leaf outline-none w-full min-w-0"
                                                        placeholder="Group Name"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button onClick={() => toggleEditCategory(cat.categoryKey)} className="p-1.5 sm:p-2 text-gray-400 hover:text-charcoal transition-colors">
                                                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    <button onClick={() => handleRemoveCategory(catIndex)} className="p-1.5 sm:p-2 text-gray-300 hover:text-red-500 transition-colors" title="Delete Group">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {isOpen && (
                                                <div className="p-3 bg-white space-y-2 animate-fade-in">
                                                    {cat.services.map((svc, srvIndex) => (
                                                        <div key={srvIndex} className="flex gap-2 items-center">
                                                            {/* SERVICE REORDER CONTROLS */}
                                                            <div className="flex flex-col gap-0.5 flex-shrink-0">
                                                                <button 
                                                                    onClick={() => handleMoveService(catIndex, srvIndex, 'up')}
                                                                    disabled={srvIndex === 0}
                                                                    className="p-0.5 text-gray-300 hover:text-gold-leaf disabled:opacity-10"
                                                                >
                                                                    <ChevronDownIcon className="w-3 h-3 rotate-180" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleMoveService(catIndex, srvIndex, 'down')}
                                                                    disabled={srvIndex === cat.services.length - 1}
                                                                    className="p-0.5 text-gray-300 hover:text-gold-leaf disabled:opacity-10"
                                                                >
                                                                    <ChevronDownIcon className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <input type="text" value={svc.displayName || t.serviceNames[svc.nameKey] || svc.nameKey} onChange={(e) => handleUpdateService(catIndex, srvIndex, 'displayName', e.target.value)} className="flex-1 px-2 sm:px-3 py-2 border rounded-lg text-sm min-w-0" placeholder="Service Name" />
                                                            <input type="text" value={svc.price} onChange={(e) => handleUpdateService(catIndex, srvIndex, 'price', e.target.value)} className="w-20 sm:w-24 px-2 sm:px-3 py-2 border rounded-lg text-sm text-right font-bold text-gold-leaf flex-shrink-0" />
                                                            <button onClick={() => handleRemoveService(catIndex, srvIndex)} className="p-2 text-gray-300 hover:text-red-500 flex-shrink-0"><XMarkIcon className="w-4 h-4" /></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={() => handleAddService(catIndex)} className="w-full py-2.5 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-400 hover:text-gold-leaf hover:border-gold-leaf transition-colors mt-2">
                                                        + Add Service to this Group
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ); 
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {editingTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center"><h3 className="font-serif font-bold text-lg">Edit Transaction</h3><button onClick={() => setEditingTransaction(null)}><XMarkIcon className="w-5 h-5 text-gray-400 hover:text-charcoal" /></button></div>
                        <div className="p-6 space-y-4">
                            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Customer Name</label><input type="text" value={editTxName} onChange={e => setEditTxName(e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone</label><input type="text" value={editTxPhone} onChange={e => setEditTxPhone(e.target.value)} className="w-full p-2 border rounded-lg" /></div>
                            <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Total ($)</label><input type="number" value={editTxTotal} onChange={e => setEditTxTotal(e.target.value)} className="w-full p-2 border rounded-lg font-bold" /></div><div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Discount (%)</label><input type="number" value={editTxDiscount} onChange={e => setEditTxDiscount(e.target.value)} className="w-full p-2 border rounded-lg" /></div></div>
                            <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-500 max-h-32 overflow-y-auto"><p className="font-bold mb-1">Items:</p><ul className="list-disc list-inside space-y-0.5">{editingTransaction.items.map((item, idx) => (<li key={idx}>{item.quantity}x {item.displayName || t.serviceNames[item.nameKey] || item.nameKey} {item.staffName && ` (${item.staffName})`}<span className="ml-1 text-gray-400">(${item.price})</span></li>))}</ul><p className="mt-2 italic text-[10px] text-red-400">Note: Changing total here overrides calculated item total.</p></div>
                            <div className="flex gap-3 pt-2"><button onClick={handleDeleteTransaction} className="px-4 py-2 border border-red-200 text-red-500 rounded-lg font-bold hover:bg-red-50 flex items-center gap-2"><TrashIcon className="w-4 h-4" /> Delete</button><button onClick={handleSaveTransaction} className="flex-1 py-2 bg-gold-leaf text-white rounded-lg font-bold hover:bg-charcoal shadow-md">Save Changes</button></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
