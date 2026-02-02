
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Translation } from '../translations';
import { LaPerlaLogo, ClockIcon, PhoneIcon, UserIcon, SparklesIcon, ChevronDownIcon, GiftIcon, HeartIcon, CalendarIcon, XMarkIcon, BriefcaseIcon, ReceiptIcon, InfoIcon, StarIcon } from './Icons';
import { WaitlistEntry, ServiceCategory, BookingRequest, ActiveBill, CartItem, Transaction, CustomerProfile, MarqueeSettings } from '../types';
import { upsertWaitlistEntry, upsertActiveBill, upsertBooking, getNextTicketNumber, generateUniqueBillId, generateUniqueWaitlistId } from '../services/firebaseService';
import { SoundManager } from '../utils/sound';
import { generateSecureId } from '../utils/idGenerator';
import { parsePrice } from '../utils/priceParser';
import { isValidPhone, isValidName } from '../utils/validators';
import { useAsyncLoading } from '../utils/hooks';
import { DEFAULT_MARQUEE_SETTINGS } from '../constants';

interface KioskViewProps {
  t: Translation;
  waitlist: WaitlistEntry[];
  setWaitlist: (list: WaitlistEntry[]) => void;
  onExit: () => void;
  pricingData: ServiceCategory[];
  bookings?: BookingRequest[];
  activeBills?: ActiveBill[];
  pastTransactions?: Transaction[];
  marqueeSettings?: MarqueeSettings;
  setCurrentBillId?: (id: string) => void;
}

type KioskStep = 'welcome' | 'checkin_phone' | 'checkin_confirm' | 'checkin_create' | 'walkin_form' | 'success_seated' | 'success_waitlist';

export const KioskView: React.FC<KioskViewProps> = ({ t, waitlist, setWaitlist, onExit, pricingData, bookings = [], activeBills = [], pastTransactions = [], marqueeSettings, setCurrentBillId }) => {
  const [step, setStep] = useState<KioskStep>('welcome');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [foundBooking, setFoundBooking] = useState<BookingRequest | null>(null);
  
  // VIP STATE
  const [vipDaysRemaining, setVipDaysRemaining] = useState<number | null>(null);
  const [isVip, setIsVip] = useState(false);
  
  const [generatedTicket, setGeneratedTicket] = useState<string>('');
  const [isReturning, setIsReturning] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showReassuranceModal, setShowReassuranceModal] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const ticketRef = useRef<HTMLDivElement>(null);
  const [printMode, setPrintMode] = useState<'ticket' | null>(null);
  
  // Constants
  const PRINT_MODE_SET_DELAY = 50; // ms - delay to set print mode before printing
  const PRINT_MODE_RESET_DELAY = 100; // ms - delay to reset print mode after printing
  
  // Loading state for async operations
  const { isLoading, withLoading } = useAsyncLoading();

  useEffect(() => {
    const savedName = sessionStorage.getItem('kiosk_name');
    const savedPhone = sessionStorage.getItem('kiosk_phone');
    if (savedName) setName(savedName);
    if (savedPhone) setPhone(savedPhone);
  }, []);

  useEffect(() => {
    sessionStorage.setItem('kiosk_name', name);
    sessionStorage.setItem('kiosk_phone', phone);
  }, [name, phone]);

  const qrCodeUrl = useMemo(() => {
    const appUrl = `${window.location.origin}${window.location.pathname}?view=stylist&mode=guest`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl)}`;
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === 'success_seated' || step === 'success_waitlist') {
      timer = setTimeout(() => handleReset(), 15000);
    }
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (printMode) {
      document.body.setAttribute('data-print-mode', printMode);
    } else {
      document.body.removeAttribute('data-print-mode');
    }
  }, [printMode]);

  const handleReset = () => {
    setStep('welcome');
    setName('');
    setPhone('');
    setNotes('');
    setSelectedServices([]);
    setFoundBooking(null);
    setIsReturning(false);
    setGeneratedTicket('');
    setVipDaysRemaining(null);
    setIsVip(false);
    sessionStorage.removeItem('kiosk_name');
    sessionStorage.removeItem('kiosk_phone');
  };

  // --- LOGIC KIỂM TRA CHÍNH XÁC VÀ CẬP NHẬT TÊN ---
  const checkVipStatus = (customerPhone: string) => {
    const cleanInput = customerPhone.replace(/[^0-9]/g, '');
    
    // Nếu sđt quá ngắn, xóa trắng thông tin cũ
    if (cleanInput.length < 8) {
        setName('');
        setVipDaysRemaining(null);
        setIsVip(false);
        setIsReturning(false);
        return;
    }

    // TÌM KIẾM CHÍNH XÁC (EXACT MATCH)
    const customerTransactions = pastTransactions?.filter(tx => {
        const txPhone = tx.customerPhone?.replace(/[^0-9]/g, '') || '';
        return txPhone === cleanInput; // So sánh bằng tuyệt đối
    });

    if (customerTransactions && customerTransactions.length > 0) {
        // Lấy giao dịch gần nhất
        const latestTx = customerTransactions[0];
        
        // Cập nhật tên ngay khi tìm thấy sđt chính xác
        if (latestTx.customerName) {
            setName(latestTx.customerName);
            setIsReturning(true);
        }

        // Kiểm tra Membership trong toàn bộ lịch sử (Chính xác)
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
            setVipDaysRemaining(days); 
            setIsVip(true); 
          } else {
            setVipDaysRemaining(null);
            setIsVip(false);
          }
        } else {
          setVipDaysRemaining(null);
          setIsVip(false);
        }
    } else {
      // KHÔNG TÌM THẤY CHÍNH XÁC: Xóa tên và trạng thái VIP
      setName('');
      setVipDaysRemaining(null);
      setIsVip(false);
      setIsReturning(false);
    }
  };

  const handleCheckInSearch = () => {
    if (!phone.trim()) return;
    
    // Validate phone number
    if (!isValidPhone(phone)) {
      alert(t.kioskPhoneError || 'Please enter a valid phone number (8-15 digits)');
      return;
    }
    
    SoundManager.playTap();
    const searchPhone = phone.replace(/[^0-9]/g, '');
    
    // Gọi lại checkVipStatus để đảm bảo thông tin khớp chính xác trước khi chuyển bước
    checkVipStatus(phone);

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    
    // Tìm booking chính xác
    const booking = bookings.find(b => 
        b.date === todayStr && 
        b.customerPhone.replace(/[^0-9]/g, '') === searchPhone && // So sánh chính xác
        b.status === 'pending'
    );

    if (booking) { 
        setFoundBooking(booking); 
        setName(booking.customerName);
        setStep('checkin_confirm'); 
    } 
    else {
      setStep('checkin_create');
    }
  };

  const handleSkipPhone = () => {
    SoundManager.playTap();
    // Skip phone number entry and go directly to create walk-in
    setStep('checkin_create');
  };

  const convertServicesToCartItems = (serviceNames: string[]): CartItem[] => {
    return serviceNames.map(serviceName => {
      let foundService = null;
      for (const cat of pricingData) {
        const s = cat.services.find(s => (s.displayName || t.serviceNames[s.nameKey] || s.nameKey) === serviceName);
        if (s) { 
          foundService = s; 
          break; 
        }
      }
      
      return {
        id: generateSecureId(),
        nameKey: foundService ? foundService.nameKey : serviceName,
        price: foundService ? parsePrice(foundService.price) : 0,
        quantity: 1,
        displayName: serviceName
      };
    });
  };

  const confirmCheckIn = async () => {
    if (!foundBooking) return;
    
    await withLoading(async () => {
      SoundManager.playSuccess();
      const ticketNum = await getNextTicketNumber('checkin');
      setGeneratedTicket(ticketNum);
      const bookingServices = foundBooking.services || [];
      setSelectedServices(bookingServices); // Set selected services for ticket display
      const initialItems = convertServicesToCartItems(bookingServices);
      const newBillId = generateUniqueBillId();
      const newBill: ActiveBill = { id: newBillId, customerName: foundBooking.customerName, customerPhone: foundBooking.customerPhone, items: initialItems, discountPercentage: 0, ticketNumber: ticketNum, isVip: isVip };
      await upsertActiveBill(newBill);
      if (setCurrentBillId) {
        setCurrentBillId(newBillId);
      }
      await upsertBooking({ ...foundBooking, status: 'confirmed' });
      setStep('success_seated');
    });
  };

  const handleImmediateCheckIn = async () => {
    // Validate inputs
    if (!isValidName(name)) {
      alert(t.kioskNameError || 'Please enter a valid name (at least 2 characters)');
      return;
    }
    
    if (selectedServices.length === 0) {
      alert(t.kioskServiceError || 'Please select at least one service');
      return;
    }
    
    await withLoading(async () => {
      SoundManager.playSuccess();
      const ticketNum = await getNextTicketNumber('checkin');
      setGeneratedTicket(ticketNum);
      const initialItems = convertServicesToCartItems(selectedServices);
      const newBillId = generateUniqueBillId();
      const newBill: ActiveBill = { id: newBillId, customerName: name, customerPhone: phone, items: initialItems, discountPercentage: 0, ticketNumber: ticketNum, isVip: isVip };
      await upsertActiveBill(newBill);
      if (setCurrentBillId) {
        setCurrentBillId(newBillId);
      }
      setStep('success_seated');
    });
  };

  const handleWalkInSubmit = async () => {
    // Validate inputs
    if (!isValidPhone(phone)) {
      alert(t.kioskPhoneError || 'Please enter a valid phone number (8-15 digits)');
      return;
    }
    
    if (!isValidName(name)) {
      alert(t.kioskNameError || 'Please enter a valid name (at least 2 characters)');
      return;
    }
    
    await withLoading(async () => {
      SoundManager.playSuccess();
      const ticketNum = await getNextTicketNumber('waitlist');
      setGeneratedTicket(ticketNum);
      const newEntry: WaitlistEntry = { id: generateUniqueWaitlistId(), customerName: name, customerPhone: phone, notes: notes || 'Walk-in', addedTime: new Date().toISOString(), estimatedReturnTime: '', status: 'waiting', selectedServices, ticketNumber: ticketNum, isVip };
      setWaitlist([...waitlist, newEntry]);
      await upsertWaitlistEntry(newEntry);
      setStep('success_waitlist');
    });
  };

  const handlePrintTicket = () => {
    try {
      if (!generatedTicket) {
        SoundManager.playError();
        alert('No ticket number available.');
        return;
      }
      setPrintMode('ticket');
      // Wait for DOM to update before printing
      setTimeout(() => {
        window.print();
        setTimeout(() => setPrintMode(null), PRINT_MODE_RESET_DELAY);
      }, PRINT_MODE_SET_DELAY);
    } catch (error) {
      console.error('Error printing ticket:', error);
      SoundManager.playError();
      alert('Failed to print ticket. Please try again.');
    }
  };

  const estimatedTotal = useMemo(() => {
    let total = 0;
    selectedServices.forEach(sName => {
      for (const cat of pricingData) {
        const found = cat.services.find(s => (s.displayName || t.serviceNames[s.nameKey] || s.nameKey) === sName);
        if (found) {
            const priceMatch = found.price.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
            if (priceMatch) total += parseFloat(priceMatch[0]);
        }
      }
    });
    return total;
  }, [selectedServices, pricingData, t.serviceNames]);

  // Get marquee settings with fallback to defaults
  const currentMarqueeSettings = marqueeSettings || DEFAULT_MARQUEE_SETTINGS;

  return (
    <>
    <div className="min-h-screen bg-pearl-white flex flex-col items-center justify-center p-6 relative overflow-hidden print:hidden">
      
      {/* --- MARQUEE BANNER --- */}
      <div className="fixed top-0 left-0 w-full bg-charcoal text-white py-3 z-[60] overflow-hidden whitespace-nowrap shadow-lg border-b border-gold-leaf/30">
        <div 
          className="animate-marquee font-bold text-sm md:text-base uppercase tracking-widest text-gold-leaf"
          style={{ animationDuration: `${currentMarqueeSettings.speed}s` }}
        >
          <span>{currentMarqueeSettings.message} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span>{currentMarqueeSettings.message} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span>{currentMarqueeSettings.message} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
          <span>{currentMarqueeSettings.message} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        </div>
      </div>

      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gold-leaf rounded-full blur-[150px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blush-pink rounded-full blur-[150px]"></div>
      </div>

      <div className="w-full max-w-lg relative z-10 mt-12">
        <div className="text-center mb-8" onDoubleClick={onExit}>
          <LaPerlaLogo className="w-64 mx-auto mb-4 drop-shadow-lg cursor-pointer" />
          <p className="text-charcoal/60 font-serif italic text-lg tracking-wide uppercase">{t.kioskWelcome}</p>
        </div>

        {/* WELCOME */}
        {step === 'welcome' && (
            <div className="space-y-6 animate-fade-in-up">
                <button onClick={() => { SoundManager.playTap(); setStep('checkin_phone'); }} className="w-full bg-white/90 backdrop-blur border-2 border-green-100 hover:border-green-400 rounded-3xl p-8 shadow-xl flex items-center gap-6 transition-all transform hover:-translate-y-1">
                    <div className="bg-green-100 p-4 rounded-full"><CalendarIcon className="w-10 h-10 text-green-600" /></div>
                    <div className="text-left"><h3 className="text-2xl font-serif font-bold text-charcoal">Check In</h3><p className="text-gray-500">I have a Booking <span className="font-bold text-green-600">OR</span> I want service now</p></div>
                </button>
                <button onClick={() => { SoundManager.playTap(); setStep('walkin_form'); }} className="w-full bg-white/90 backdrop-blur border-2 border-gold-leaf/20 hover:border-gold-leaf/60 rounded-3xl p-8 shadow-xl flex items-center gap-6 transition-all transform hover:-translate-y-1">
                    <div className="bg-gold-leaf/10 p-4 rounded-full"><ClockIcon className="w-10 h-10 text-gold-leaf" /></div>
                    <div className="text-left"><h3 className="text-2xl font-serif font-bold text-charcoal">Join Waitlist</h3><p className="text-gray-500">Shop is busy, I will take a ticket and return</p></div>
                </button>
            </div>
        )}

        {/* STEP 2: PHONE */}
        {step === 'checkin_phone' && (
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/50 animate-fade-in">
                <button onClick={handleReset} className="mb-4 text-gray-400 hover:text-charcoal flex items-center gap-1">← Back</button>
                <h3 className="text-2xl font-serif text-charcoal font-bold mb-6 text-center">Enter Phone Number</h3>
                <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => {
                        setPhone(e.target.value);
                        checkVipStatus(e.target.value); // Cập nhật tên tức thì khi nhập
                    }} 
                    onKeyDown={(e) => e.key === 'Enter' && phone.length >= 8 && handleCheckInSearch()} 
                    placeholder="04..." 
                    className="w-full text-center text-3xl p-4 border-b-2 border-gray-300 focus:border-green-500 bg-transparent outline-none font-bold mb-8" 
                    autoFocus 
                />
                <div className="flex gap-4">
                    <button onClick={handleSkipPhone} className="flex-1 bg-gray-200 text-gray-700 font-bold py-4 rounded-xl shadow-lg hover:bg-gray-300 text-xl">Skip</button>
                    <button onClick={handleCheckInSearch} disabled={phone.length < 8} className="flex-1 bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 text-xl">Next</button>
                </div>
            </div>
        )}

        {/* STEP 3: CONFIRM BOOKING */}
        {step === 'checkin_confirm' && foundBooking && (
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-green-200 animate-fade-in text-center">
                {vipDaysRemaining !== null && (
                    <div className="bg-gold-leaf text-white px-4 py-2 rounded-full text-sm font-bold mb-4 animate-pulse flex items-center justify-center gap-2">
                        <StarIcon className="w-4 h-4" filled />
                        VIP MEMBER: {vipDaysRemaining} DAYS LEFT
                    </div>
                )}
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"><CalendarIcon className="w-10 h-10 text-green-600" /></div>
                <h3 className="text-2xl font-serif font-bold mb-2">Welcome, {name}!</h3>
                <div className="bg-gray-50 p-4 rounded-xl text-left mb-8 border border-gray-200">
                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Services</p><p className="text-lg font-medium">{foundBooking.services.join(', ')}</p>
                </div>
                <div className="flex gap-4"><button onClick={handleReset} className="flex-1 py-3 border rounded-xl font-bold text-gray-500" disabled={isLoading}>Cancel</button><button onClick={confirmCheckIn} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}>{isLoading ? 'Processing...' : 'Check In Now'}</button></div>
            </div>
        )}

        {/* STEP 4: CREATE WALK-IN */}
        {step === 'checkin_create' && (
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/50 animate-fade-in text-center">
                {vipDaysRemaining !== null && (
                    <div className="bg-gold-leaf text-white px-4 py-2 rounded-full text-sm font-bold mb-4 animate-pulse flex items-center justify-center gap-2">
                        <StarIcon className="w-4 h-4" filled />
                        VIP MEMBER: {vipDaysRemaining} DAYS LEFT
                    </div>
                )}
                <h3 className="text-2xl font-serif font-bold mb-1">{isReturning ? `Hi, ${name}!` : "Start Service Now?"}</h3>
                <div className="space-y-4 mb-8 text-left">
                    <div className="space-y-1"><label className="text-xs font-bold text-gold-leaf uppercase">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-50 border-2 rounded-xl px-4 py-3 text-lg outline-none" placeholder="Enter Name" /></div>
                    <div className="space-y-1"><label className="text-xs font-bold text-gold-leaf uppercase">Services</label><button onClick={() => setShowReassuranceModal(true)} className="w-full bg-white border-2 border-dashed rounded-xl p-4 flex justify-between items-center"><span className={selectedServices.length > 0 ? 'text-charcoal font-bold' : 'text-gray-400'}>{selectedServices.length > 0 ? `${selectedServices.length} selected` : 'Select Services...'}</span><SparklesIcon className="w-5 h-5 text-gold-leaf" /></button></div>
                </div>
                <div className="flex gap-4"><button onClick={() => setStep('checkin_phone')} className="flex-1 py-3 border rounded-xl font-bold text-gray-500" disabled={isLoading}>Back</button><button onClick={handleImmediateCheckIn} disabled={!name.trim() || selectedServices.length === 0 || isLoading} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? 'Processing...' : 'Check In'}</button></div>
            </div>
        )}

        {/* WAITLIST FORM */}
        {step === 'walkin_form' && (
            <div className="bg-white/90 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/50 animate-fade-in">
                <button onClick={handleReset} className="mb-4 text-gray-400 hover:text-charcoal flex items-center gap-1">← Back</button>
                <h2 className="text-2xl font-serif text-charcoal mb-6 text-center">Join Waitlist</h2>
                {vipDaysRemaining !== null && (
                    <div className="bg-gold-leaf text-white px-4 py-2 rounded-full text-sm font-bold mb-4 animate-pulse flex items-center justify-center gap-2">
                        <StarIcon className="w-4 h-4" filled />
                        VIP MEMBER: {vipDaysRemaining} DAYS LEFT
                    </div>
                )}
                <div className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gold-leaf uppercase">Phone Number</label>
                        <input 
                            type="tel" 
                            value={phone} 
                            onChange={(e) => { 
                                setPhone(e.target.value); 
                                checkVipStatus(e.target.value); // Cập nhật tên tức thì khi sđt thay đổi
                            }} 
                            className="w-full bg-gray-50 border-2 rounded-xl px-4 py-3 text-lg outline-none" 
                            placeholder="04..." 
                            autoFocus 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gold-leaf uppercase">Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="w-full bg-gray-50 border-2 rounded-xl px-4 py-3 text-lg outline-none" 
                            placeholder="Name" 
                        />
                    </div>
                    <button onClick={() => setShowReassuranceModal(true)} className="w-full bg-white border-2 border-dashed rounded-xl p-4 flex justify-between items-center"><span className={selectedServices.length > 0 ? 'text-charcoal font-bold' : 'text-gray-400'}>{selectedServices.length > 0 ? `${selectedServices.length} selected` : 'Select Services...'}</span><SparklesIcon className="w-5 h-5 text-gold-leaf" /></button>
                    <button onClick={handleWalkInSubmit} disabled={!name || !phone || isLoading} className="w-full bg-charcoal text-white font-bold py-4 rounded-xl shadow-lg mt-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed">{isLoading ? 'Processing...' : 'Join Waitlist'}</button>
                </div>
            </div>
        )}

        {/* SUCCESS TICKET */}
        {(step === 'success_seated' || step === 'success_waitlist') && (
            <div className="mx-auto bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-2xl border-4 border-gold-leaf/10 text-center animate-fade-in-up w-full max-w-sm relative">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-pearl-white rounded-full"></div>
                <div className="border-b-2 border-dashed border-gray-200 pb-6 mb-6"><LaPerlaLogo className="w-32 mx-auto mb-2 opacity-80" /><p className="text-[10px] text-gray-400 uppercase font-bold">Queue Ticket</p></div>
                <h1 className="text-6xl font-mono font-bold text-charcoal mb-2 tracking-tighter">{generatedTicket || "---"}</h1>
                <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 text-left">
                    <div className="text-center border-b border-gray-200 pb-2 mb-2"><p className="text-xl font-bold text-charcoal">{isVip && "★ "}{name}</p></div>
                    {selectedServices.length > 0 && <div className="mb-2"><p className="text-[10px] font-bold text-gray-400 uppercase">Services</p><ul className="text-sm text-charcoal font-medium list-none">{selectedServices.map(s => <li key={s}>• {s}</li>)}</ul></div>}
                    <div className="flex justify-center mb-2">{step === 'success_waitlist' && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold">Waitlist</span>}</div>
                </div>
                <div className="flex items-center gap-4 bg-blush-pink/30 p-3 rounded-xl mb-6 text-left"><div className="bg-white p-1 rounded-lg"><img src={qrCodeUrl} alt="Scan" className="w-12 h-12" /></div><div><p className="text-xs font-bold text-charcoal">Design while you wait</p><p className="text-[10px] text-gray-500">Scan to use AI Stylist</p></div></div>
                <div className="flex gap-2"><button onClick={handlePrintTicket} className="flex-1 bg-charcoal text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2"><ReceiptIcon className="w-4 h-4" /> Print Ticket</button><button onClick={handleReset} className="px-4 py-3 border rounded-xl font-bold text-gray-400">Close</button></div>
            </div>
        )}
      </div>

      {showServiceModal && (
          <div className="fixed inset-0 z-[70] bg-pearl-white flex flex-col animate-fade-in">
              <div className="p-4 bg-white shadow-sm flex justify-between items-center border-b border-gold-leaf/20"><h3 className="text-xl font-serif font-bold text-charcoal">Select Services</h3><div className="text-right"><p className="text-xs text-gray-500 uppercase font-bold">Est. Total</p><p className="text-lg font-bold text-gold-leaf">${estimatedTotal.toFixed(2)}</p></div></div>
              <div className="flex-1 overflow-y-auto p-4 pb-24"><div className="max-w-2xl mx-auto space-y-4">
                      {pricingData.map((category) => {
                           const isOpen = openCategories[category.categoryKey];
                           const selectedInCat = category.services.filter(s => selectedServices.includes(s.displayName || t.serviceNames[s.nameKey] || s.nameKey)).length;
                           return (
                               <div key={category.categoryKey} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                   <button onClick={() => setOpenCategories(prev => ({...prev, [category.categoryKey]: !prev[category.categoryKey]}))} className="w-full flex items-center justify-between p-4 bg-gray-50/50 active:bg-gray-100 transition-colors">
                                       <span className="text-lg font-serif font-bold text-charcoal flex items-center gap-2">{t.serviceCategories[category.categoryKey] || category.categoryKey} {selectedInCat > 0 && <span className="bg-gold-leaf text-white text-xs px-2 py-0.5 rounded-full">{selectedInCat}</span>}</span>
                                       <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                   </button>
                                   {isOpen && <div className="p-2 grid grid-cols-1 gap-2">
                                           {category.services.map(service => {
                                               const sName = service.displayName || t.serviceNames[service.nameKey] || service.nameKey;
                                               const isSelected = selectedServices.includes(sName);
                                               return <button key={sName} onClick={() => { SoundManager.playTap(); setSelectedServices(prev => isSelected ? prev.filter(s => s !== sName) : [...prev, sName]); }} className={`text-left p-3 rounded-xl border transition-all flex justify-between items-center ${isSelected ? 'bg-gold-leaf/10 border-gold-leaf shadow-sm' : 'bg-white border-gray-100 text-gray-600'}`}><span className="font-medium text-base flex-1">{sName}</span><span className="text-sm font-bold text-gold-leaf">{service.price}</span></button>
                                           })}
                                       </div>}
                               </div>
                           )
                      })}
                  </div></div>
              <div className="absolute bottom-0 left-0 w-full p-4 bg-white border-t border-gray-100 shadow-lg"><button onClick={() => setShowServiceModal(false)} className="w-full bg-gold-leaf text-white py-3 rounded-xl font-bold shadow-md active:scale-95 transition-transform text-lg">Done ({selectedServices.length})</button></div>
          </div>
      )}

      {showReassuranceModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center border border-gold-leaf/20 relative">
                <div className="w-16 h-16 bg-gold-leaf/10 rounded-full flex items-center justify-center mx-auto mb-4"><SparklesIcon className="w-8 h-8 text-gold-leaf" /></div>
                <h3 className="text-xl font-serif font-bold text-charcoal mb-2">Not sure what to book?</h3>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">Don't worry! Select services closest to your needs. <strong>Our technicians will consult with you</strong> and adjust the details at the shop.</p>
                <button onClick={() => { SoundManager.playTap(); setShowReassuranceModal(false); setShowServiceModal(true); }} className="w-full bg-charcoal text-white font-bold py-3 rounded-xl shadow-lg hover:bg-black">Continue to Selection</button>
            </div>
        </div>
      )}
    </div>

    {/* --- DEDICATED PRINT AREA (FIXED CONTENT) --- */}
    <div className="printable-area printable-ticket" style={{ position: 'absolute', left: '-9999px', width: '400px', margin: '0 auto', padding: '20px', backgroundColor: 'white', color: 'black' }}>
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
                <p style={{ fontSize: '18px', margin: '0' }}>{isVip ? '★ ' : ''}{name}</p>
            </div>
            {selectedServices.length > 0 && (
                <div style={{ marginBottom: '10px' }}>
                    <p style={{ fontSize: '12px', margin: '0', fontWeight: 'bold' }}>Requested Services</p>
                    <div style={{ fontSize: '12px', marginTop: '5px' }}>
                        {selectedServices.map(s => (
                            <div key={s} style={{ marginBottom: '2px' }}>• {s}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div style={{ padding: '12px', backgroundColor: '#fffbf0', border: '1px solid #e5d4a0', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ fontSize: '10px', margin: '0 0 8px 0', fontWeight: 'bold', color: '#8b7355', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Important Notice</p>
            <p style={{ fontSize: '10px', margin: '0', lineHeight: '1.6', color: '#333' }}>Please keep this ticket with you throughout your service. Your technician will continuously update pricing based on this ticket. Kindly present this ticket to our staff when proceeding to payment.</p>
        </div>

        <div style={{ textAlign: 'center', borderTop: '2px dashed black', paddingTop: '15px', fontSize: '10px' }}>
            <p style={{ margin: '5px 0' }}>Thank you for visiting La Perla Nails & Beauty!</p>
            <p style={{ fontSize: '8px', color: '#999', marginTop: '10px' }}>Powered by La Perla Stylist AI</p>
        </div>
    </div>
    </>
  );
};
