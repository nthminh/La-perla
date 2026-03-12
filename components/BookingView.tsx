
import React, { useState, useMemo } from 'react';
import { Translation } from '../translations';
import { ChevronDownIcon, XMarkIcon, TrashIcon, PencilIcon, PhoneIcon, ClockIcon, PlusIcon } from './Icons';
import { ServiceCategory, BookingRequest } from '../types';

interface BookingViewProps {
  t: Translation;
  languageCode: string;
  pricingData: ServiceCategory[];
  onSubmitBooking?: (booking: BookingRequest) => void;
  bookings?: BookingRequest[];
  onUpdateBookingStatus?: (id: string, status: 'pending' | 'confirmed' | 'cancelled') => void;
  onDeleteBooking?: (id: string) => void;
  onEditBooking?: (booking: BookingRequest) => void;
}

const getTodaySydney = () =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }); // YYYY-MM-DD

// Parse a YYYY-MM-DD string into a local Date at noon to avoid timezone shifts
const parseDateStr = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
};

// Generate time slots from 9:00 to 21:00 in 30-min increments
const ALL_TIME_SLOTS: string[] = (() => {
    const slots: string[] = [];
    for (let h = 9; h <= 21; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`);
        if (h < 21) slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
})();

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// --- Mini Calendar Component ---
export const MonthCalendar: React.FC<{
    selectedDate: string;
    onSelect: (date: string) => void;
    bookings?: BookingRequest[];
}> = ({ selectedDate, onSelect, bookings = [] }) => {
    const today = getTodaySydney();
    const [viewYear, setViewYear] = useState(() => parseInt(today.slice(0, 4)));
    const [viewMonth, setViewMonth] = useState(() => parseInt(today.slice(5, 7)) - 1); // 0-indexed
    const [tooltipDate, setTooltipDate] = useState<string | null>(null);

    // Group non-cancelled bookings by date
    const bookingsByDate = useMemo(() => {
        const map: Record<string, BookingRequest[]> = {};
        bookings.forEach(b => {
            if (b.status !== 'cancelled') {
                if (!map[b.date]) map[b.date] = [];
                map[b.date].push(b);
            }
        });
        return map;
    }, [bookings]);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun

    const goToPrev = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const goToNext = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const cells: (number | null)[] = [
        ...Array(firstDayOfWeek).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="w-full">
            {/* Month / Year Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={goToPrev}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-charcoal font-bold text-lg"
                    aria-label="Previous month"
                >
                    ‹
                </button>
                <span className="font-serif text-lg font-bold text-charcoal">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <button
                    onClick={goToNext}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-charcoal font-bold text-lg"
                    aria-label="Next month"
                >
                    ›
                </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS_OF_WEEK.map(d => (
                    <div key={d} className="text-center text-xs font-bold text-gray-400 py-1">{d}</div>
                ))}
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7 gap-y-1">
                {cells.map((day, idx) => {
                    if (!day) return <div key={idx} />;
                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isPast = dateStr < today;
                    const isToday = dateStr === today;
                    const isSelected = dateStr === selectedDate;
                    const dayBookings = bookingsByDate[dateStr] || [];
                    const hasBookings = dayBookings.length > 0;

                    return (
                        <div key={idx} className="relative flex justify-center">
                            <div className="relative">
                                <button
                                    onClick={() => !isPast && onSelect(dateStr)}
                                    disabled={isPast}
                                    onMouseEnter={() => hasBookings ? setTooltipDate(dateStr) : undefined}
                                    onMouseLeave={() => setTooltipDate(null)}
                                    className={`
                                        w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-150
                                        ${isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-gold-leaf/20'}
                                        ${isSelected ? 'bg-gold-leaf text-white shadow-md font-bold' : ''}
                                        ${isToday && !isSelected ? 'border-2 border-gold-leaf text-gold-leaf font-bold' : ''}
                                        ${!isPast && !isSelected && !isToday ? 'text-charcoal' : ''}
                                    `}
                                >
                                    {day}
                                </button>
                                {/* Booking count badge */}
                                {hasBookings && (
                                    <span className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center pointer-events-none
                                        ${isPast ? 'bg-gray-200 text-gray-400' : 'bg-rose-500 text-white'}`}>
                                        {dayBookings.length}
                                    </span>
                                )}
                            </div>
                            {/* Hover tooltip showing booking details */}
                            {tooltipDate === dateStr && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-3 text-left pointer-events-none">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2">
                                        {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                                    </p>
                                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                        {dayBookings.map((b, i) => (
                                            <div key={i} className="flex items-start gap-1.5">
                                                <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${b.status === 'confirmed' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                                                <div>
                                                    <p className="text-xs font-bold text-charcoal leading-tight">{b.customerName}</p>
                                                    <p className="text-[10px] text-gray-400">{b.timeSlot} · {b.services.slice(0, 2).join(', ')}{b.services.length > 2 ? '…' : ''}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Tooltip arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- Main BookingView ---
export const BookingView: React.FC<BookingViewProps> = ({ t, pricingData, onSubmitBooking, bookings = [], onUpdateBookingStatus, onDeleteBooking, onEditBooking }) => {
    const today = getTodaySydney();
    const [step, setStep] = useState(1);
    const [date, setDate] = useState('');
    const [timeSlot, setTimeSlot] = useState('');
    const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Day popup state
    const [dayPopup, setDayPopup] = useState<string | null>(null);
    const [editingBooking, setEditingBooking] = useState<BookingRequest | null>(null);
    const [editBkName, setEditBkName] = useState('');
    const [editBkPhone, setEditBkPhone] = useState('');
    const [editBkDate, setEditBkDate] = useState('');
    const [editBkTimeSlot, setEditBkTimeSlot] = useState('');
    const [editBkNotes, setEditBkNotes] = useState('');
    const [editBkServices, setEditBkServices] = useState('');

    const openEditBooking = (booking: BookingRequest) => {
        setEditingBooking(booking);
        setEditBkName(booking.customerName);
        setEditBkPhone(booking.customerPhone);
        setEditBkDate(booking.date);
        setEditBkTimeSlot(booking.timeSlot);
        setEditBkNotes(booking.notes || '');
        setEditBkServices(booking.services.join(', '));
    };

    const handleSaveEditBooking = () => {
        if (!editingBooking) return;
        const updated: BookingRequest = {
            ...editingBooking,
            customerName: editBkName,
            customerPhone: editBkPhone,
            date: editBkDate,
            timeSlot: editBkTimeSlot,
            notes: editBkNotes,
            services: editBkServices.split(',').map(s => s.trim()).filter(Boolean),
        };
        onEditBooking && onEditBooking(updated);
        setEditingBooking(null);
    };

    const selectedServiceKeys = useMemo(
        () => Object.keys(selectedServices).filter(k => selectedServices[k]),
        [selectedServices]
    );

    // Estimated total
    const estimatedTotal = useMemo(() => {
        let total = 0;
        selectedServiceKeys.forEach(key => {
            for (const cat of pricingData) {
                const svc = cat.services.find(s => s.nameKey === key);
                if (svc) {
                    const m = svc.price.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
                    if (m) total += parseFloat(m[0]);
                    break;
                }
            }
        });
        return total;
    }, [selectedServiceKeys, pricingData]);

    // Filter out past times if today is selected
    const availableTimeSlots = useMemo(() => {
        if (date !== today) return ALL_TIME_SLOTS;
        const sydneyTime = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
        const now = new Date(sydneyTime);
        const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return ALL_TIME_SLOTS.filter(s => s > currentHHMM);
    }, [date, today]);

    const validateStep = () => {
        const newErrors: Record<string, string> = {};
        if (step === 1 && !date) newErrors.date = t.selectDate;
        if (step === 2 && !timeSlot) newErrors.timeSlot = t.selectTime;
        if (step === 3 && selectedServiceKeys.length === 0) newErrors.services = t.selectServices;
        if (step === 4) {
            if (!name.trim()) newErrors.name = t.fieldRequired;
            if (!phone.trim()) newErrors.phone = t.fieldRequired;
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
    const handleBack = () => { setStep(s => s - 1); setErrors({}); };

    const handleServiceToggle = (nameKey: string) => {
        setSelectedServices(prev => ({ ...prev, [nameKey]: !prev[nameKey] }));
        if (errors.services) setErrors(prev => { const e = {...prev}; delete e.services; return e; });
    };

    const handleSubmit = () => {
        if (!validateStep()) return;
        const serviceNames = selectedServiceKeys.map(
            key => t.serviceNames[key as keyof typeof t.serviceNames] || key
        );
        if (onSubmitBooking) {
            const newBooking: BookingRequest = {
                id: Date.now().toString(),
                customerName: name,
                customerPhone: phone,
                services: serviceNames,
                date,
                timeSlot,
                notes,
                status: 'pending',
                createdAt: new Date().toISOString(),
            };
            onSubmitBooking(newBooking);
        }
        setStep(5);
    };

    const resetForm = () => {
        setStep(1);
        setDate('');
        setTimeSlot('');
        setSelectedServices({});
        setName('');
        setPhone('');
        setNotes('');
        setErrors({});
    };

    const TOTAL_STEPS = 4;
    const ProgressBar = () => (
        <div className="flex items-center justify-center gap-2 mb-8">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(num => (
                <React.Fragment key={num}>
                    <div className={`w-4 h-4 rounded-full transition-all duration-300 ${step >= num ? 'bg-gold-leaf scale-110 shadow-sm' : 'bg-gray-200'}`} />
                    {num < TOTAL_STEPS && (
                        <div className={`h-1 w-10 transition-colors duration-300 ${step > num ? 'bg-gold-leaf' : 'bg-gray-200'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const renderStep = () => {
        switch (step) {
            case 1: // Date picker - Google Calendar style
                return (
                    <div className="animate-fade-in">
                        <h3 className="text-2xl font-serif text-charcoal mb-6">{t.step1Title}</h3>
                        <MonthCalendar selectedDate={date} onSelect={(d) => {
                            setDate(d);
                            setErrors({});
                            const dayBookings = bookings.filter(b => b.date === d);
                            if (dayBookings.length > 0) setDayPopup(d);
                        }} bookings={bookings} />
                        {date && (
                            <div className="mt-4 text-center">
                                <span className="inline-block bg-gold-leaf/10 text-gold-leaf font-bold px-4 py-2 rounded-full text-sm">
                                    Selected: {parseDateStr(date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        )}
                        {errors.date && <p className="text-red-600 mt-3 text-sm text-center">{errors.date}</p>}
                    </div>
                );

            case 2: // Time slot picker
                return (
                    <div className="animate-fade-in">
                        <h3 className="text-2xl font-serif text-charcoal mb-2">{t.step2Title}</h3>
                        <p className="text-sm text-charcoal/60 mb-5">
                            {parseDateStr(date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        {availableTimeSlots.length === 0 ? (
                            <p className="text-center text-gray-400 py-8">No available time slots for today. Please select another date.</p>
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                                {availableTimeSlots.map(slot => (
                                    <button
                                        key={slot}
                                        onClick={() => { setTimeSlot(slot); setErrors({}); }}
                                        className={`py-2.5 px-2 rounded-xl text-sm font-bold transition-all border-2 ${
                                            timeSlot === slot
                                                ? 'bg-gold-leaf text-white border-gold-leaf shadow-md'
                                                : 'bg-white text-charcoal border-gray-100 hover:border-gold-leaf/50'
                                        }`}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        )}
                        {errors.timeSlot && <p className="text-red-600 mt-3 text-sm">{errors.timeSlot}</p>}
                    </div>
                );

            case 3: // Service selection
                return (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-serif text-charcoal">{t.step3Title}</h3>
                            {estimatedTotal > 0 && (
                                <span className="text-sm font-bold text-gold-leaf bg-gold-leaf/10 px-3 py-1 rounded-full">
                                    Est: ${estimatedTotal}
                                </span>
                            )}
                        </div>
                        {pricingData.map(category => (
                            <div key={category.categoryKey} className="mb-3">
                                <details className="bg-pearl-white/50 rounded-lg p-3 group">
                                    <summary className="font-serif text-base text-charcoal cursor-pointer flex justify-between items-center list-none">
                                        <span>{t.serviceCategories[category.categoryKey] || category.categoryKey}</span>
                                        <ChevronDownIcon className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                                    </summary>
                                    <div className="mt-2 pl-2 border-l-2 border-gold-leaf/50">
                                        {category.services.map(service => (
                                            <label key={service.nameKey} className="flex items-center p-2 hover:bg-blush-pink/50 rounded-md cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedServices[service.nameKey]}
                                                    onChange={() => handleServiceToggle(service.nameKey)}
                                                    className="h-4 w-4 rounded border-dusty-rose text-gold-leaf focus:ring-gold-leaf"
                                                />
                                                <span className="ml-3 text-charcoal/90 text-sm">{service.displayName || t.serviceNames[service.nameKey] || service.nameKey}</span>
                                                <span className="ml-auto font-medium text-gold-leaf text-xs">{service.price}</span>
                                            </label>
                                        ))}
                                    </div>
                                </details>
                            </div>
                        ))}
                        {errors.services && <p className="text-red-600 mt-2 text-sm font-bold">{errors.services}</p>}
                    </div>
                );

            case 4: // Customer details
                return (
                    <div className="animate-fade-in">
                        <h3 className="text-2xl font-serif text-charcoal mb-4">{t.step4Title}</h3>

                        <div className="bg-gray-50 p-3 rounded-xl mb-5 text-sm text-gray-600 border border-gray-200">
                            <p><strong>{date}</strong> at <strong>{timeSlot}</strong></p>
                            <p className="mt-1">{selectedServiceKeys.length} service(s){estimatedTotal > 0 ? ` — Est. $${estimatedTotal}` : ''}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-charcoal/90 font-medium mb-1 text-sm">{t.yourName}</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Customer name"
                                    className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-white focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf outline-none text-charcoal"
                                />
                                {errors.name && <p className="text-red-600 mt-1 text-xs">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-charcoal/90 font-medium mb-1 text-sm">{t.yourPhone}</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="04xx xxx xxx"
                                    className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-white focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf outline-none text-charcoal"
                                />
                                {errors.phone && <p className="text-red-600 mt-1 text-xs">{errors.phone}</p>}
                            </div>
                            <div>
                                <label className="block text-charcoal/90 font-medium mb-1 text-sm">{t.specialRequests}</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder={t.specialRequestsPlaceholder}
                                    rows={3}
                                    className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-white focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf outline-none resize-none text-charcoal"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 5: // Success
                return (
                    <div className="text-center animate-fade-in py-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-3xl font-serif text-charcoal mb-4">{t.bookingSuccessTitle}</h3>
                        <div className="bg-gray-50 p-6 rounded-2xl mb-8 max-w-sm mx-auto text-left space-y-1">
                            <p className="text-sm text-gray-600"><strong>Date:</strong> {date} at {timeSlot}</p>
                            <p className="text-sm text-gray-600"><strong>Customer:</strong> {name}</p>
                            <p className="text-sm text-gray-600"><strong>Phone:</strong> {phone}</p>
                            {notes && <p className="text-sm text-gray-600"><strong>Notes:</strong> {notes}</p>}
                            {selectedServiceKeys.length > 0 && (
                                <p className="text-sm text-gray-600"><strong>Services:</strong> {selectedServiceKeys.length} selected{estimatedTotal > 0 ? ` (Est. $${estimatedTotal})` : ''}</p>
                            )}
                        </div>
                        <button
                            onClick={resetForm}
                            className="bg-gold-leaf text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-charcoal transition-colors"
                        >
                            {t.bookAnother}
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-serif text-charcoal mb-2">{t.bookingTitle}</h2>
                <p className="text-charcoal/70 text-sm font-sans max-w-lg mx-auto">{t.bookingSubtitle}</p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gold-leaf/10 text-left">
                {step < 5 && <ProgressBar />}
                {renderStep()}

                {step < 5 && (
                    <div className={`mt-8 flex ${step > 1 ? 'justify-between' : 'justify-end'}`}>
                        {step > 1 && (
                            <button onClick={handleBack} className="px-6 py-3 rounded-xl font-bold text-charcoal hover:bg-gray-100 transition-colors">
                                {t.prevStepButton}
                            </button>
                        )}
                        <button
                            onClick={step === 4 ? handleSubmit : handleNext}
                            className="bg-gold-leaf text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-charcoal transition-all"
                        >
                            {step === 4 ? t.requestBookingButton : t.nextStepButton}
                        </button>
                    </div>
                )}
            </div>

            {/* Day Bookings Popup */}
            {dayPopup && (() => {
                const popupBookings = bookings
                    .filter(b => b.date === dayPopup)
                    .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
                const activeCount = popupBookings.filter(b => b.status !== 'cancelled').length;
                const [popY, popM, popD] = dayPopup.split('-').map(Number);
                const popupDateLabel = new Date(popY, popM - 1, popD).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                return (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setDayPopup(null); setEditingBooking(null); }}>
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-5 border-b border-gray-100 flex-shrink-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-serif text-xl font-bold text-charcoal">{popupDateLabel}</h3>
                                        <p className="text-sm text-gray-500 mt-0.5">{activeCount} booking{activeCount !== 1 ? 's' : ''} scheduled</p>
                                    </div>
                                    <button onClick={() => { setDayPopup(null); setEditingBooking(null); }} className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
                                        <XMarkIcon className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Bookings list */}
                            <div className="overflow-y-auto p-5 space-y-3 flex-1">
                                {popupBookings.map(booking => (
                                    <div key={booking.id} className={`rounded-xl border relative overflow-hidden ${booking.status === 'cancelled' ? 'border-gray-100 bg-gray-50 opacity-60' : 'border-gray-100 bg-gray-50'}`}>
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${booking.status === 'confirmed' ? 'bg-green-500' : booking.status === 'cancelled' ? 'bg-red-300' : 'bg-yellow-400'}`} />

                                        {editingBooking?.id === booking.id ? (
                                            /* Inline edit form */
                                            <div className="pl-4 pr-3 py-3 space-y-2">
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Editing Booking</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                        value={editBkName}
                                                        onChange={e => setEditBkName(e.target.value)}
                                                        placeholder="Customer name"
                                                        className="col-span-2 text-sm p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gold-leaf outline-none"
                                                    />
                                                    <input
                                                        value={editBkPhone}
                                                        onChange={e => setEditBkPhone(e.target.value)}
                                                        placeholder="Phone"
                                                        className="text-sm p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gold-leaf outline-none"
                                                    />
                                                    <select
                                                        value={editBkTimeSlot}
                                                        onChange={e => setEditBkTimeSlot(e.target.value)}
                                                        className="text-sm p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gold-leaf outline-none bg-white"
                                                    >
                                                        {ALL_TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                    <input
                                                        value={editBkServices}
                                                        onChange={e => setEditBkServices(e.target.value)}
                                                        placeholder="Services (comma separated)"
                                                        className="col-span-2 text-sm p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gold-leaf outline-none"
                                                    />
                                                    <input
                                                        value={editBkNotes}
                                                        onChange={e => setEditBkNotes(e.target.value)}
                                                        placeholder="Notes"
                                                        className="col-span-2 text-sm p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gold-leaf outline-none"
                                                    />
                                                </div>
                                                <div className="flex gap-2 pt-1">
                                                    <button onClick={handleSaveEditBooking} className="flex-1 py-1.5 bg-gold-leaf text-white rounded-lg font-bold text-xs hover:bg-charcoal transition-colors">Save</button>
                                                    <button onClick={() => setEditingBooking(null)} className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg font-bold text-xs hover:bg-gray-200 transition-colors">Cancel</button>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Booking info */
                                            <div className="pl-4 pr-3 py-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-bold text-charcoal text-sm">{booking.customerName}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <PhoneIcon className="w-3 h-3 text-gold-leaf" />
                                                            <a href={`tel:${booking.customerPhone}`} className="hover:underline">{booking.customerPhone}</a>
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : booking.status === 'cancelled' ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-gold-leaf mt-1.5 flex items-center gap-1">
                                                    <ClockIcon className="w-3 h-3" />{booking.timeSlot}
                                                </p>
                                                {booking.services.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {booking.services.map((s, i) => (
                                                            <span key={i} className="bg-white border border-gray-200 px-2 py-0.5 rounded-full text-xs text-charcoal">{s}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {booking.notes && <p className="text-xs italic text-gray-400 mt-1">"{booking.notes}"</p>}
                                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                                    {booking.status === 'pending' && (
                                                        <button
                                                            onClick={() => onUpdateBookingStatus && onUpdateBookingStatus(booking.id, 'confirmed')}
                                                            className="flex-1 py-1.5 bg-green-500 text-white rounded-lg font-bold text-xs hover:bg-green-600 transition-colors"
                                                        >
                                                            Confirm
                                                        </button>
                                                    )}
                                                    {booking.status === 'confirmed' && (
                                                        <button
                                                            onClick={() => onUpdateBookingStatus && onUpdateBookingStatus(booking.id, 'pending')}
                                                            className="flex-1 py-1.5 bg-yellow-400 text-white rounded-lg font-bold text-xs hover:bg-yellow-500 transition-colors"
                                                        >
                                                            Unconfirm
                                                        </button>
                                                    )}
                                                    {booking.status === 'cancelled' ? (
                                                        <button
                                                            onClick={() => onUpdateBookingStatus && onUpdateBookingStatus(booking.id, 'pending')}
                                                            className="flex-1 py-1.5 bg-yellow-400 text-white rounded-lg font-bold text-xs hover:bg-yellow-500 transition-colors"
                                                        >
                                                            Restore
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => onUpdateBookingStatus && onUpdateBookingStatus(booking.id, 'cancelled')}
                                                            className="flex-1 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg font-bold text-xs hover:bg-gray-50 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openEditBooking(booking)}
                                                        className="py-1.5 px-3 text-blue-400 hover:text-blue-600 text-xs font-bold transition-colors flex items-center gap-1 border border-blue-100 rounded-lg hover:bg-blue-50"
                                                    >
                                                        <PencilIcon className="w-3 h-3" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => { onDeleteBooking && onDeleteBooking(booking.id); }}
                                                        className="py-1.5 px-3 text-red-400 hover:text-red-600 text-xs font-bold transition-colors flex items-center gap-1 border border-red-100 rounded-lg hover:bg-red-50"
                                                    >
                                                        <TrashIcon className="w-3 h-3" /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-gray-100 flex gap-2 flex-shrink-0">
                                <button
                                    onClick={() => {
                                        setDayPopup(null);
                                        setEditingBooking(null);
                                        setDate(dayPopup!);
                                        setTimeSlot('');
                                        setSelectedServices({});
                                        setName('');
                                        setPhone('');
                                        setNotes('');
                                        setErrors({});
                                        setStep(2);
                                    }}
                                    className="flex-1 py-2.5 bg-gold-leaf text-white font-bold rounded-xl hover:bg-charcoal transition-colors text-sm flex items-center justify-center gap-1.5"
                                >
                                    <PlusIcon className="w-4 h-4" /> Add New Booking
                                </button>
                                <button
                                    onClick={() => { setDayPopup(null); setEditingBooking(null); }}
                                    className="py-2.5 px-4 bg-gray-100 text-charcoal font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
