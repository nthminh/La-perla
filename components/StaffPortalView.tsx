import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StaffProfile, Transaction, GlobalPayrollSettings, ServiceCategory } from '../types';
import { UserIcon, StarIcon, ChartIcon, ReceiptIcon, CloudSyncIcon, ListBulletIcon, XMarkIcon } from './Icons';
import { subscribeToTransactions } from '../services/firebaseService'; 
import { getTransactions } from '../services/storageService';
import { Translation } from '../translations';
import { SoundManager } from '../utils/sound';

interface StaffPortalViewProps {
    t: Translation; 
    currentUser: StaffProfile;
    onUpdateProfile: (updatedProfile: StaffProfile) => void;
    onExit: () => void;
    globalPayroll?: GlobalPayrollSettings; 
    pricingData?: ServiceCategory[]; 
}

// Get YYYY-MM-DD string in Sydney Time
const getSydneyDateStr = (isoDate: string) => {
    if (!isoDate) return "";
    try {
        // 'en-CA' format is consistently YYYY-MM-DD
        return new Date(isoDate).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    } catch (e) {
        return isoDate.split('T')[0] || ""; // Fallback
    }
};

// Get Day Name (e.g., "Monday") in Sydney Time
const getSydneyDayName = (isoDate: string) => {
    if (!isoDate) return "";
    try {
        return new Date(isoDate).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'long' });
    } catch (e) {
        return "";
    }
};

// Get date range start and end dates in Sydney Time
const getDateRange = (range: 'today' | 'week' | 'month') => {
    const now = new Date();
    const sydneyToday = getSydneyDateStr(now.toISOString());
    
    if (range === 'today') {
        return { start: sydneyToday, end: sydneyToday };
    }
    
    if (range === 'week') {
        // Last 7 days including today
        const weekAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        return { start: getSydneyDateStr(weekAgo.toISOString()), end: sydneyToday };
    }
    
    if (range === 'month') {
        // Last 30 days including today
        const monthAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        return { start: getSydneyDateStr(monthAgo.toISOString()), end: sydneyToday };
    }
    
    return { start: sydneyToday, end: sydneyToday };
};

// Get label for date range
const getDateRangeLabel = (range: 'today' | 'week' | 'month'): string => {
    switch (range) {
        case 'today': return 'Today';
        case 'week': return 'Last 7 Days';
        case 'month': return 'Last 30 Days';
        default: return 'Today';
    }
};

// Image compression utility
const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 70% quality
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedBase64);
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const StaffPortalView: React.FC<StaffPortalViewProps> = ({ t, currentUser, onUpdateProfile, onExit, globalPayroll, pricingData }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'portfolio' | 'earnings'>('profile');
    
    const [bio, setBio] = useState(currentUser.bio || "");
    const [specialties, setSpecialties] = useState<string[]>(currentUser.specialties || []);
    const [newTag, setNewTag] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    
    // Portfolio State
    const [portfolio, setPortfolio] = useState<string[]>(currentUser.portfolio || []);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Lightbox State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxScale, setLightboxScale] = useState(1);
    const [lightboxPosition, setLightboxPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Password Change State
    const [showPassForm, setShowPassForm] = useState(false);
    const [oldPass, setOldPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [passError, setPassError] = useState("");

    const [isLoadingEarnings, setIsLoadingEarnings] = useState(false);
    const [cloudTransactions, setCloudTransactions] = useState<Transaction[]>([]);
    
    // Date Range State
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
    
    // Subscribe to real-time data when in Earnings tab
    useEffect(() => {
        if (activeTab === 'earnings') {
            setIsLoadingEarnings(true);
            // Use subscription instead of fetchOnce to avoid race conditions and ensure data consistency with Admin
            const unsubscribe = subscribeToTransactions((txs) => {
                setCloudTransactions(txs || []);
                setIsLoadingEarnings(false);
            });
            return () => unsubscribe();
        }
    }, [activeTab]);

    // Process transactions whenever cloud data or local data changes
    const dailyTransactions = useMemo(() => {
        // 1. Get Local Data (Backup/Instant)
        const localTxs = getTransactions();

        // 2. Merge (Cloud wins)
        const txMap = new Map<string, Transaction>();
        
        // Add cloud first (Source of Truth)
        cloudTransactions.forEach(tx => txMap.set(tx.id, tx));
        
        // Add local if missing (e.g. offline created)
        localTxs.forEach(tx => {
            if (!txMap.has(tx.id)) {
                txMap.set(tx.id, tx);
            }
        });

        const allTransactions = Array.from(txMap.values());
        
        // 3. Calculate date range in Sydney Time
        const { start: startDate, end: endDate } = getDateRange(dateRange);

        const myItems: {
            displayTime: string;
            customerName: string;
            serviceName: string;
            grossPrice: number;
            netPrice: number;
            discountPercent: number;
            sortTime: number;
        }[] = [];
        
        allTransactions.forEach(tx => {
            // 4. Filter for date range using Sydney Time
            const txDateStr = getSydneyDateStr(tx.date);
            
            if (txDateStr >= startDate && txDateStr <= endDate) {
                if (tx.items && Array.isArray(tx.items)) {
                    tx.items.forEach(item => {
                        // --- STRICT ID MATCHING ---
                        let isMatch = false;
                        if (item.staffId) {
                            isMatch = item.staffId === currentUser.id;
                        } else {
                            // Fallback for old data or manual entry
                            isMatch = item.staffName === currentUser.name;
                        }

                        if (isMatch) {
                            const gross = item.price * item.quantity;
                            const discountFactor = tx.discountPercentage ? (1 - tx.discountPercentage / 100) : 1;
                            const net = gross * discountFactor;

                            const baseName = item.displayName || t.serviceNames[item.nameKey] || item.nameKey;

                            const txDate = new Date(tx.date);
                            
                            // Format time based on date range
                            let formattedTime: string;
                            if (dateRange === 'today') {
                                // Today tab: show only time
                                formattedTime = txDate.toLocaleTimeString('en-AU', {
                                    timeZone: 'Australia/Sydney',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            } else {
                                // Week and Month tabs: show date and time
                                formattedTime = txDate.toLocaleString('en-AU', {
                                    timeZone: 'Australia/Sydney',
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                });
                            }

                            myItems.push({
                                displayTime: formattedTime,
                                customerName: tx.customerName || 'Guest',
                                serviceName: `${baseName} ${item.quantity > 1 ? `(x${item.quantity})` : ''}`,
                                grossPrice: gross,
                                netPrice: net,
                                discountPercent: tx.discountPercentage || 0,
                                sortTime: txDate.getTime()
                            });
                        }
                    });
                }
            }
        });

        // Sort by Time Descending (Newest first)
        return myItems.sort((a, b) => b.sortTime - a.sortTime);

    }, [cloudTransactions, currentUser.id, currentUser.name, t.serviceNames, dateRange]);

    const handleAddTag = () => {
        const tag = newTag.trim();
        if (tag && !specialties.includes(tag)) {
            setSpecialties([...specialties, tag]);
            setNewTag("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setSpecialties(specialties.filter(s => s !== tagToRemove));
    };
    
    // Portfolio Handlers
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        
        const currentCount = portfolio.length;
        const MAX_PHOTOS = 50;
        
        if (currentCount >= MAX_PHOTOS) {
            alert(`You can only have ${MAX_PHOTOS} photos maximum.`);
            return;
        }
        
        const availableSlots = MAX_PHOTOS - currentCount;
        const filesToProcess = Array.from(files).slice(0, availableSlots);
        
        setIsUploading(true);
        try {
            const compressedImages: string[] = [];
            for (const file of filesToProcess) {
                if ((file as File).type.startsWith('image/')) {
                    const compressed = await compressImage(file as File);
                    compressedImages.push(compressed);
                }
            }
            
            setPortfolio([...portfolio, ...compressedImages]);
            if (filesToProcess.length < files.length) {
                alert(`Only ${filesToProcess.length} photos added due to ${MAX_PHOTOS} photo limit.`);
            }
        } catch (error) {
            alert("Error processing images. Please try again.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    const handleRemovePhoto = (index: number) => {
        const confirmed = confirm("Remove this photo from your portfolio?");
        if (confirmed) {
            setPortfolio(portfolio.filter((_, i) => i !== index));
        }
    };
    
    // Lightbox Handlers
    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
        setLightboxScale(1);
        setLightboxPosition({ x: 0, y: 0 });
    };
    
    const closeLightbox = () => {
        setLightboxOpen(false);
        setLightboxScale(1);
        setLightboxPosition({ x: 0, y: 0 });
    };
    
    const nextImage = () => {
        setLightboxIndex((prev) => (prev + 1) % portfolio.length);
        setLightboxScale(1);
        setLightboxPosition({ x: 0, y: 0 });
    };
    
    const prevImage = () => {
        setLightboxIndex((prev) => (prev - 1 + portfolio.length) % portfolio.length);
        setLightboxScale(1);
        setLightboxPosition({ x: 0, y: 0 });
    };
    
    const handleZoomIn = () => {
        setLightboxScale((prev) => Math.min(prev + 0.5, 4));
    };
    
    const handleZoomOut = () => {
        setLightboxScale((prev) => Math.max(prev - 0.5, 1));
        if (lightboxScale <= 1.5) {
            setLightboxPosition({ x: 0, y: 0 });
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent) => {
        if (lightboxScale > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - lightboxPosition.x, y: e.clientY - lightboxPosition.y });
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && lightboxScale > 1) {
            setLightboxPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };
    
    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && lightboxScale > 1) {
            setIsDragging(true);
            setDragStart({ 
                x: e.touches[0].clientX - lightboxPosition.x, 
                y: e.touches[0].clientY - lightboxPosition.y 
            });
        }
    };
    
    const handleTouchMove = (e: React.TouchEvent) => {
        if (isDragging && e.touches.length === 1 && lightboxScale > 1) {
            setLightboxPosition({
                x: e.touches[0].clientX - dragStart.x,
                y: e.touches[0].clientY - dragStart.y
            });
        }
    };
    
    const handleTouchEnd = () => {
        setIsDragging(false);
    };
    
    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!lightboxOpen) return;
            
            if (e.key === 'Escape') {
                closeLightbox();
            } else if (e.key === 'ArrowLeft' && portfolio.length > 1) {
                prevImage();
            } else if (e.key === 'ArrowRight' && portfolio.length > 1) {
                nextImage();
            } else if (e.key === '+' || e.key === '=') {
                handleZoomIn();
            } else if (e.key === '-' || e.key === '_') {
                handleZoomOut();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, portfolio.length, lightboxScale]);

    const handleChangePassword = async () => {
        setPassError("");
        if (!oldPass || !newPass || !confirmPass) {
            setPassError("Please fill in all password fields.");
            return;
        }
        if (oldPass !== currentUser.password) {
            setPassError("Incorrect current password.");
            return;
        }
        if (newPass !== confirmPass) {
            setPassError("New passwords do not match.");
            return;
        }
        if (newPass.length < 3) {
            setPassError("New password is too short.");
            return;
        }

        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const updatedProfile: StaffProfile = {
            ...currentUser,
            password: newPass
        };
        
        onUpdateProfile(updatedProfile);
        setIsSaving(false);
        
        setOldPass("");
        setNewPass("");
        setConfirmPass("");
        setShowPassForm(false);
        alert("Password updated successfully!");
    };

    const handleSave = async () => {
        setIsSaving(true);
        const updatedProfile: StaffProfile = {
            ...currentUser,
            bio: bio.trim(),
            specialties,
            portfolio: portfolio, 
            rating: currentUser.rating || 5.0,
            payroll: currentUser.payroll 
        };
        await new Promise(resolve => setTimeout(resolve, 500));
        onUpdateProfile(updatedProfile);
        setIsSaving(false);
        alert("Profile updated successfully!");
    };

    const totalRevenue = useMemo(() => dailyTransactions.reduce((sum, i) => sum + i.netPrice, 0), [dailyTransactions]);

    const payrollData = useMemo(() => {
        if (!currentUser.payroll || !currentUser.payroll.enabled) return null;

        const { baseSalary, bonusRate } = currentUser.payroll;
        const globalCustomTargets = globalPayroll?.customTargets || {};

        // Calculate Target based on Today Name (Sydney) - Use helper!
        const todayName = getSydneyDayName(new Date().toISOString());

        const todaysTarget = (globalCustomTargets[todayName] !== undefined) 
            ? globalCustomTargets[todayName] 
            : (globalPayroll?.defaultTarget || 0);

        const isTargetHit = totalRevenue > todaysTarget;
        const bonusAmount = isTargetHit ? (totalRevenue - todaysTarget) * (bonusRate / 100) : 0;
        const totalPay = baseSalary + bonusAmount;
        const progressPercent = todaysTarget === 0 ? 100 : Math.min(100, (totalRevenue / todaysTarget) * 100);

        return {
            baseSalary,
            todaysTarget,
            bonusRate,
            isTargetHit,
            bonusAmount,
            totalPay,
            progressPercent,
            dayName: todayName
        };
    }, [totalRevenue, currentUser.payroll, globalPayroll]);

    return (
        <div className="min-h-screen bg-pearl-white flex flex-col font-sans pb-24">
            <div className="bg-charcoal text-white p-4 sticky top-0 z-20 shadow-md flex justify-between items-center">
                <button onClick={onExit} className="text-gray-300 hover:text-white flex items-center gap-1">
                    ← Back
                </button>
                <span className="font-serif font-bold text-gold-leaf tracking-wider uppercase">
                    My Portal
                </span>
                <div className="w-8 flex items-center justify-center">
                    {/* Live Indicator */}
                    {activeTab === 'earnings' && (
                        <div className={`w-3 h-3 rounded-full ${isLoadingEarnings ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`} title="Live Data" />
                    )}
                </div>
            </div>

            <div className="flex p-4 gap-4 max-w-md mx-auto w-full">
                <button onClick={() => { SoundManager.playTap(); setActiveTab('profile'); }} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'profile' ? 'bg-gold-leaf text-white shadow-md' : 'bg-white text-charcoal border border-gray-200'}`}>
                    <UserIcon className="w-4 h-4" /> Profile
                </button>
                <button onClick={() => { SoundManager.playTap(); setActiveTab('portfolio'); }} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'portfolio' ? 'bg-gold-leaf text-white shadow-md' : 'bg-white text-charcoal border border-gray-200'}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Portfolio
                </button>
                <button onClick={() => { SoundManager.playTap(); setActiveTab('earnings'); }} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'earnings' ? 'bg-gold-leaf text-white shadow-md' : 'bg-white text-charcoal border border-gray-200'}`}>
                    <ChartIcon className="w-4 h-4" /> Earnings
                </button>
            </div>

            <div className="max-w-md mx-auto w-full px-6 pb-6 space-y-6 animate-fade-in flex-grow">
                {activeTab === 'profile' && (
                    <>
                        <div className="text-center relative">
                            <div className="w-28 h-28 mx-auto rounded-full border-4 border-gold-leaf shadow-lg overflow-hidden bg-gray-200 relative">
                                {currentUser.avatar ? (<img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" />) : (<div className="w-12 h-12 text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"><UserIcon className="w-12 h-12" /></div>)}
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-charcoal mt-4">{currentUser.name}</h2>
                            <div className="flex items-center justify-center gap-1 text-gold-leaf mt-1"><StarIcon className="w-5 h-5" filled /><span className="font-bold text-lg">{currentUser.rating?.toFixed(1) || "5.0"}</span></div>
                        </div>
                        
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gold-leaf/20">
                            <label className="block text-xs font-bold text-gold-leaf uppercase mb-2">My Bio</label>
                            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Introduce yourself..." className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-leaf outline-none text-charcoal bg-gray-50 min-h-[100px]"/>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gold-leaf/20">
                            <label className="block text-xs font-bold text-gold-leaf uppercase mb-3">Specialties</label>
                            <div className="flex gap-2 mb-4">
                                <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={handleKeyDown} placeholder="Add skill..." className="flex-1 p-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gold-leaf outline-none text-sm"/>
                                <button onClick={handleAddTag} disabled={!newTag.trim()} className="bg-charcoal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black disabled:opacity-50 transition-colors">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {specialties.map(spec => (<span key={spec} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-gold-leaf text-white shadow-sm animate-fade-in">{spec}<button onClick={() => handleRemoveTag(spec)} className="hover:text-red-200 transition-colors ml-1"><XMarkIcon className="w-3 h-3" /></button></span>))}
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gold-leaf/20">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-xs font-bold text-gold-leaf uppercase">Security</label>
                                <button onClick={() => setShowPassForm(!showPassForm)} className="text-xs text-charcoal underline hover:text-gold-leaf">{showPassForm ? "Cancel" : "Change Password"}</button>
                            </div>
                            {showPassForm && (
                                <div className="space-y-3 animate-fade-in bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} placeholder="Current Password" className="w-full p-2 border rounded-lg text-sm"/>
                                    <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New Password" className="w-full p-2 border rounded-lg text-sm"/>
                                    <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="Confirm New" className="w-full p-2 border rounded-lg text-sm"/>
                                    {passError && <p className="text-red-500 text-xs font-bold">{passError}</p>}
                                    <button onClick={handleChangePassword} disabled={isSaving} className="w-full bg-charcoal text-white py-2 rounded-lg text-sm font-bold">Update</button>
                                </div>
                            )}
                        </div>

                        <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-gold-leaf text-white font-bold rounded-xl shadow-lg hover:bg-charcoal transition-all disabled:opacity-50 text-lg sticky bottom-6">{isSaving ? "Saving..." : "Save Changes"}</button>
                    </>
                )}

                {activeTab === 'portfolio' && (
                    <>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gold-leaf/20">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-xs font-bold text-gold-leaf uppercase mb-1">My Portfolio</h3>
                                    <p className="text-xs text-gray-500">{portfolio.length} / 50 photos</p>
                                </div>
                                <button 
                                    onClick={() => fileInputRef.current?.click()} 
                                    disabled={portfolio.length >= 50 || isUploading}
                                    className="bg-charcoal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                            <span>Add Photo</span>
                                        </>
                                    )}
                                </button>
                                <input 
                                    ref={fileInputRef}
                                    type="file" 
                                    accept="image/*" 
                                    multiple
                                    className="hidden" 
                                    onChange={handleFileSelect}
                                />
                            </div>
                            
                            {portfolio.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm font-medium">No photos yet</p>
                                    <p className="text-xs mt-1">Upload photos of your nail art work</p>
                                    <p className="text-xs text-gray-300 mt-2">Images will be automatically compressed</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {portfolio.map((photo, index) => (
                                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-100 hover:border-gold-leaf transition-all shadow-sm">
                                            <img 
                                                src={photo} 
                                                alt={`Portfolio ${index + 1}`} 
                                                className="w-full h-full object-cover cursor-pointer"
                                                onClick={() => openLightbox(index)}
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemovePhoto(index); }}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10"
                                                title="Remove photo"
                                            >
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                <p className="text-white text-xs font-bold">#{index + 1}</p>
                                            </div>
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none flex items-center justify-center">
                                                <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                            <div className="flex items-start gap-2">
                                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="font-bold mb-1">Tips:</p>
                                    <ul className="text-xs space-y-1">
                                        <li>• Maximum 50 photos per portfolio</li>
                                        <li>• Images are automatically compressed to save space</li>
                                        <li>• Best quality: well-lit, focused nail photos</li>
                                        <li>• Click "Save Changes" to update your portfolio</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <button onClick={handleSave} disabled={isSaving} className="w-full py-4 bg-gold-leaf text-white font-bold rounded-xl shadow-lg hover:bg-charcoal transition-all disabled:opacity-50 text-lg sticky bottom-6">{isSaving ? "Saving..." : "Save Changes"}</button>
                    </>
                )}

                {activeTab === 'earnings' && (
                    <div className="space-y-4 animate-fade-in-up">
                        {/* Date Range Selector */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <label className="block text-xs font-bold text-gold-leaf uppercase mb-3">Period</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button 
                                    onClick={() => setDateRange('today')}
                                    className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                                        dateRange === 'today' 
                                            ? 'bg-gold-leaf text-white shadow-md' 
                                            : 'bg-gray-50 text-charcoal border border-gray-200 hover:border-gold-leaf'
                                    }`}
                                >
                                    Today
                                </button>
                                <button 
                                    onClick={() => setDateRange('week')}
                                    className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                                        dateRange === 'week' 
                                            ? 'bg-gold-leaf text-white shadow-md' 
                                            : 'bg-gray-50 text-charcoal border border-gray-200 hover:border-gold-leaf'
                                    }`}
                                >
                                    Last 7 Days
                                </button>
                                <button 
                                    onClick={() => setDateRange('month')}
                                    className={`py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                                        dateRange === 'month' 
                                            ? 'bg-gold-leaf text-white shadow-md' 
                                            : 'bg-gray-50 text-charcoal border border-gray-200 hover:border-gold-leaf'
                                    }`}
                                >
                                    Last 30 Days
                                </button>
                            </div>
                        </div>

                        {isLoadingEarnings && dailyTransactions.length === 0 ? (
                            <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-leaf mx-auto mb-4"></div><p className="text-sm text-gray-500">Syncing live data...</p></div>
                        ) : (
                            <>
                                {/* --- REVENUE SUMMARY CARD --- */}
                                {payrollData ? (
                                    <div className="bg-gradient-to-br from-charcoal to-gray-800 text-white p-6 rounded-3xl shadow-xl border border-gold-leaf/20 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-gold-leaf text-xs font-bold uppercase tracking-widest mb-1">
                                                        Total Revenue {getDateRangeLabel(dateRange)}
                                                    </p>
                                                    <h3 className="text-4xl font-serif font-bold text-white">${totalRevenue.toFixed(2)}</h3>
                                                </div>
                                                {dateRange === 'today' && (
                                                    <div className="text-right">
                                                        <p className="text-gray-400 text-xs font-bold uppercase">Estimated Pay</p>
                                                        <p className="text-2xl font-bold text-green-400">${payrollData.totalPay.toFixed(2)}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Progress Bar - only show for today */}
                                            {dateRange === 'today' && (
                                                <div className="mb-4">
                                                    <div className="flex justify-between text-xs text-gray-400 mb-1 font-bold">
                                                        <span>Goal: {payrollData.dayName}</span>
                                                        <span>${payrollData.todaysTarget}</span>
                                                    </div>
                                                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
                                                        <div 
                                                            className={`h-full transition-all duration-1000 ease-out relative ${payrollData.isTargetHit ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gold-leaf'}`} 
                                                            style={{ width: `${payrollData.progressPercent}%` }}
                                                        >
                                                            {payrollData.isTargetHit && <div className="absolute inset-0 bg-white/30 animate-pulse"></div>}
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between text-xs mt-1">
                                                        <span className="text-gray-500">{payrollData.progressPercent.toFixed(0)}%</span>
                                                        {payrollData.isTargetHit 
                                                            ? <span className="text-green-400 font-bold animate-pulse">Bonus Active! ({payrollData.bonusRate}%)</span> 
                                                            : <span className="text-gold-leaf font-bold">${Math.max(0, payrollData.todaysTarget - totalRevenue).toFixed(2)} to Bonus</span>
                                                        }
                                                    </div>
                                                </div>
                                            )}

                                            {/* Breakdown - only show for today */}
                                            {dateRange === 'today' && (
                                                <div className="grid grid-cols-2 gap-4 border-t border-gray-700 pt-3 text-sm">
                                                    <div>
                                                        <p className="text-gray-500 text-xs">Base Salary</p>
                                                        <p className="font-bold">${payrollData.baseSalary.toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-gray-500 text-xs">Commission</p>
                                                        <p className={`font-bold ${payrollData.bonusAmount > 0 ? 'text-green-400' : 'text-gray-400'}`}>+${payrollData.bonusAmount.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gradient-to-br from-charcoal to-gray-800 text-white p-6 rounded-3xl shadow-xl border border-gold-leaf/20 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">
                                                {getDateRangeLabel(dateRange)} Revenue
                                            </p>
                                            <h3 className="text-5xl font-serif font-bold text-gold-leaf mb-2">${totalRevenue.toFixed(2)}</h3>
                                            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm font-medium text-gray-300">
                                                <ReceiptIcon className="w-4 h-4" />
                                                <span>{dailyTransactions.length} services performed</span>
                                            </div>
                                        </div>
                                        <div className="absolute -right-6 -bottom-6 opacity-10">
                                            <ChartIcon className="w-40 h-40 text-white" />
                                        </div>
                                    </div>
                                )}

                                {/* --- TRANSACTION HISTORY --- */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                        <h4 className="font-bold text-charcoal flex items-center gap-2">
                                            <ListBulletIcon className="w-5 h-5 text-gold-leaf" /> Service History
                                        </h4>
                                        <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-1 rounded-full">{dailyTransactions.length} items</span>
                                    </div>
                                    <div className="divide-y divide-gray-50 max-h-[50vh] overflow-y-auto custom-scrollbar">
                                        {dailyTransactions.length === 0 ? (
                                            <div className="p-8 text-center flex flex-col items-center justify-center text-gray-400">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                    <ReceiptIcon className="w-6 h-6 text-gray-300" />
                                                </div>
                                                <p className="text-sm font-medium">
                                                    No services found for {getDateRangeLabel(dateRange).toLowerCase()}.
                                                </p>
                                                <p className="text-xs mt-1">Assignments will appear here automatically.</p>
                                            </div>
                                        ) : (
                                            <>
                                                {dailyTransactions.map((item, idx) => (
                                                    <div key={idx} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center group">
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="font-bold text-charcoal text-sm group-hover:text-gold-leaf transition-colors">{item.serviceName}</span>
                                                                {item.discountPercent > 0 && (
                                                                    <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-bold border border-red-100">-{item.discountPercent}%</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-2">
                                                                <span className="bg-gray-100 px-1.5 rounded text-[10px] font-bold text-gray-600">{item.displayTime}</span>
                                                                <span>• {item.customerName}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="block font-bold text-green-600 text-lg">${item.netPrice.toFixed(2)}</span>
                                                            {item.discountPercent > 0 && (
                                                                <span className="text-[10px] text-gray-400 line-through">${item.grossPrice.toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
            
            {/* Lightbox Modal */}
            {lightboxOpen && portfolio.length > 0 && (
                <div 
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
                    onClick={closeLightbox}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors backdrop-blur-sm"
                        title="Close (Esc)"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                    
                    {/* Image Counter */}
                    <div className="absolute top-4 left-4 z-50 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold">
                        {lightboxIndex + 1} / {portfolio.length}
                    </div>
                    
                    {/* Zoom Controls */}
                    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 flex gap-3 bg-white/10 backdrop-blur-sm rounded-full p-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors"
                            title="Zoom Out"
                            disabled={lightboxScale <= 1}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                            </svg>
                        </button>
                        <div className="flex items-center px-3 text-white text-sm font-bold">
                            {Math.round(lightboxScale * 100)}%
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors"
                            title="Zoom In"
                            disabled={lightboxScale >= 4}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setLightboxScale(1); setLightboxPosition({ x: 0, y: 0 }); }}
                            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-3 transition-colors ml-2"
                            title="Reset"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Navigation Buttons */}
                    {portfolio.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 transition-colors backdrop-blur-sm"
                                title="Previous (←)"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 transition-colors backdrop-blur-sm"
                                title="Next (→)"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </>
                    )}
                    
                    {/* Image Container */}
                    <div 
                        className="relative w-full h-full flex items-center justify-center overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{ cursor: lightboxScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                    >
                        <img
                            src={portfolio[lightboxIndex]}
                            alt={`Portfolio ${lightboxIndex + 1}`}
                            className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
                            style={{
                                transform: `scale(${lightboxScale}) translate(${lightboxPosition.x / lightboxScale}px, ${lightboxPosition.y / lightboxScale}px)`,
                                transformOrigin: 'center center'
                            }}
                            draggable={false}
                        />
                    </div>
                    
                    {/* Instructions */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40 text-white/60 text-xs text-center">
                        <p>Click outside or press ESC to close • Use +/- to zoom • Drag to pan when zoomed</p>
                    </div>
                </div>
            )}
        </div>
    );
};