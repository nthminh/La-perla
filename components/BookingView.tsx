
import React, { useState, useMemo, useEffect } from 'react';
import { Translation } from '../translations';
import { generateBookingRequest } from '../gemini';
import { SparklesIcon, ChevronDownIcon } from './Icons';
import { ServiceCategory, BookingRequest } from '../types';
import { SALON_EMAIL_ADDRESS } from '../constants';

interface BookingViewProps {
  t: Translation;
  languageCode: string;
  // Dynamic Pricing Data
  pricingData: ServiceCategory[];
  onSubmitBooking?: (booking: BookingRequest) => void;
}

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }); // YYYY-MM-DD in Sydney

export const BookingView: React.FC<BookingViewProps> = ({ t, languageCode, pricingData, onSubmitBooking }) => {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});
  const [date, setDate] = useState(today);
  const [timeSlot, setTimeSlot] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);

  // Reset time slot if date changes to avoid invalid states
  useEffect(() => {
      setTimeSlot('');
  }, [date]);

  const selectedServiceKeys = useMemo(() => Object.keys(selectedServices).filter(key => selectedServices[key]), [selectedServices]);

  // Calculate Estimated Total
  const estimatedTotal = useMemo(() => {
      let total = 0;
      selectedServiceKeys.forEach(key => {
          for (const cat of pricingData) {
              const svc = cat.services.find(s => s.nameKey === key);
              if (svc) {
                  // Parse price string like "$28" or "from $55" -> 28, 55
                  const priceMatch = svc.price.replace(/,/g, '').match(/(\d+(\.\d+)?)/);
                  if (priceMatch) {
                      total += parseFloat(priceMatch[0]);
                  }
                  break;
              }
          }
      });
      return total;
  }, [selectedServiceKeys, pricingData]);

  // Dynamic Time Slots based on Current Time in Sydney
  const availableTimeSlots = useMemo(() => {
      const allSlots = [
          { key: 'Morning', label: t.timeMorning, endHour: 12, disabled: false },
          { key: 'Afternoon', label: t.timeAfternoon, endHour: 16, disabled: false },
          { key: 'Evening', label: t.timeEvening, endHour: 19, disabled: false },
      ];

      // If selected date is NOT today, all slots are available
      if (date !== today) {
          return allSlots;
      }

      // If today, filter out passed times
      // Get Sydney hour
      const sydneyTime = new Date().toLocaleString("en-US", {timeZone: "Australia/Sydney"});
      const currentHour = new Date(sydneyTime).getHours();

      return allSlots.map(slot => ({
          ...slot,
          disabled: currentHour >= slot.endHour - 1 // Disable if less than 1 hour remains in slot
      }));
  }, [date, t]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (selectedServiceKeys.length === 0) {
        newErrors.services = t.selectServices;
      }
    }
    if (step === 2) {
      if (!date) newErrors.date = t.selectDate;
      if (!timeSlot) newErrors.timeSlot = t.selectTime;
    }
    if (step === 3) {
      if (!name.trim()) newErrors.name = t.fieldRequired;
      if (!phone.trim()) newErrors.phone = t.fieldRequired;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitBooking = () => {
    if (validateStep()) {
      const serviceNames = selectedServiceKeys.map(key => t.serviceNames[key as keyof typeof t.serviceNames] || key);
      
      // 1. Save to System (Admin Dashboard)
      if (onSubmitBooking) {
          const newBooking: BookingRequest = {
              id: Date.now().toString(),
              customerName: name,
              customerPhone: phone,
              services: serviceNames,
              date: date,
              timeSlot: timeSlot,
              notes: notes,
              status: 'pending',
              createdAt: new Date().toISOString()
          };
          onSubmitBooking(newBooking);
      }

      // 2. Open Email Client (Legacy/Backup Notification)
      const subject = `New Booking Request from La Perla App - ${name}`;
      const serviceListText = serviceNames.map(s => `- ${s}`).join('\n');
      
      const body = `Hi La Perla Team,

I would like to request an appointment.

Services:
${serviceListText}
Est. Total: $${estimatedTotal}

Preferred Date: ${date}
Preferred Time: ${timeSlot}

My Details:
Name: ${name}
Phone: ${phone}
Notes: ${notes}

Thank you!`;

      // Construct mailto link
      const mailtoUrl = `mailto:${SALON_EMAIL_ADDRESS}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Trigger email client
      window.location.href = mailtoUrl;

      // Move to success step
      setStep(4);
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    setStep(s => s - 1);
    setErrors({});
  };

  const handleServiceToggle = (nameKey: string) => {
    setSelectedServices(prev => ({ ...prev, [nameKey]: !prev[nameKey] }));
    if (errors.services) {
        setErrors(prev => {
            const newErrors = {...prev};
            delete newErrors.services;
            return newErrors;
        });
    }
  };

  const handleGenerateNote = async () => {
      if (selectedServiceKeys.length === 0 || !date || !timeSlot) {
          alert('Please select services, a date, and a time slot first.');
          return;
      }
      setIsGeneratingNote(true);
      const serviceNames = selectedServiceKeys.map(key => t.serviceNames[key as keyof typeof t.serviceNames] || key);
      try {
          const generatedText = await generateBookingRequest(serviceNames, date, timeSlot, languageCode);
          setNotes(generatedText);
      } catch (e) {
          console.error(e);
          // Simple fallback in case of error
          setNotes(`I'd like to book: ${serviceNames.join(', ')} on ${date} (${timeSlot}).`);
      } finally {
          setIsGeneratingNote(false);
      }
  };
  
  const resetForm = () => {
      setStep(1);
      setSelectedServices({});
      setDate(today);
      setTimeSlot('');
      setName('');
      setPhone('');
      setNotes('');
      setErrors({});
  }

  const renderStepContent = () => {
    switch (step) {
      case 1: // Service Selection
        return (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-serif text-charcoal">{t.step1Title}</h3>
                {estimatedTotal > 0 && (
                    <span className="text-lg font-bold text-gold-leaf bg-gold-leaf/10 px-3 py-1 rounded-full">
                        Est: ${estimatedTotal}
                    </span>
                )}
            </div>
            {pricingData.map(category => (
              <div key={category.categoryKey} className="mb-4">
                 <details className="bg-pearl-white/50 rounded-lg p-3 group">
                    <summary className="font-serif text-lg text-charcoal cursor-pointer flex justify-between items-center list-none">
                        <span>{t.serviceCategories[category.categoryKey] || category.categoryKey}</span>
                        <ChevronDownIcon className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-2 pl-2 md:pl-4 border-l-2 border-gold-leaf/50">
                        {category.services.map(service => (
                        <label key={service.nameKey} className="flex items-center p-2 hover:bg-blush-pink/50 rounded-md cursor-pointer transition-colors">
                            <input
                            type="checkbox"
                            checked={!!selectedServices[service.nameKey]}
                            onChange={() => handleServiceToggle(service.nameKey)}
                            className="h-5 w-5 rounded border-dusty-rose text-gold-leaf focus:ring-gold-leaf"
                            />
                            <span className="ml-3 text-charcoal/90">{service.displayName || t.serviceNames[service.nameKey] || service.nameKey}</span>
                            <span className="ml-auto font-medium text-gold-leaf text-sm">{service.price}</span>
                        </label>
                        ))}
                    </div>
                 </details>
              </div>
            ))}
            {errors.services && <p className="text-red-600 mt-2 font-bold animate-pulse">{errors.services}</p>}
          </div>
        );
      case 2: // Date & Time
        return (
          <div className="animate-fade-in">
            <h3 className="text-2xl font-serif text-charcoal mb-4">{t.step2Title}</h3>
            <div className="mb-6">
                <label htmlFor="date" className="block text-charcoal/90 font-sans font-medium mb-2">{t.selectDate}</label>
                <input
                    type="date"
                    id="date"
                    value={date}
                    min={today}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-white focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf transition-shadow duration-300 shadow-inner font-sans text-charcoal text-lg"
                />
                {errors.date && <p className="text-red-600 mt-1 text-sm">{errors.date}</p>}
            </div>
            <div>
                <label className="block text-charcoal/90 font-sans font-medium mb-2">{t.selectTime}</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {availableTimeSlots.map(slot => (
                        <button
                            key={slot.key}
                            onClick={() => !slot.disabled && setTimeSlot(slot.key)}
                            disabled={slot.disabled}
                            className={`p-4 rounded-xl font-sans font-bold transition-all duration-200 border-2 ${
                                timeSlot === slot.key 
                                    ? 'bg-gold-leaf text-white border-gold-leaf shadow-md scale-105' 
                                    : slot.disabled
                                        ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed'
                                        : 'bg-white text-charcoal border-gray-100 hover:border-gold-leaf/50'
                            }`}
                        >
                            {slot.label}
                            {slot.disabled && <span className="block text-[10px] font-normal">(Unavailable)</span>}
                        </button>
                    ))}
                </div>
                 {errors.timeSlot && <p className="text-red-600 mt-1 text-sm">{errors.timeSlot}</p>}
            </div>
          </div>
        );
      case 3: // Personal Details
        return (
          <div className="animate-fade-in">
            <h3 className="text-2xl font-serif text-charcoal mb-4">{t.step3Title}</h3>
            
            <div className="bg-gray-50 p-4 rounded-xl mb-6 text-sm text-gray-600 border border-gray-200">
                <p><strong>Booking Summary:</strong></p>
                <p>Date: {date} ({timeSlot})</p>
                <p>Services: {selectedServiceKeys.length} selected</p>
                <p className="text-gold-leaf font-bold mt-1">Est. Total: ${estimatedTotal}</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-charcoal/90 font-sans font-medium mb-1">{t.yourName}</label>
                    <input 
                        type="text" 
                        id="name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-white focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf transition-shadow duration-300 shadow-inner font-sans text-charcoal" 
                        placeholder="Jane Doe"
                    />
                    {errors.name && <p className="text-red-600 mt-1 text-sm">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="phone" className="block text-charcoal/90 font-sans font-medium mb-1">{t.yourPhone}</label>
                    <input 
                        type="tel" 
                        id="phone" 
                        value={phone} 
                        onChange={e => setPhone(e.target.value)} 
                        className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-white focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf transition-shadow duration-300 shadow-inner font-sans text-charcoal" 
                        placeholder="04xx xxx xxx"
                    />
                    {errors.phone && <p className="text-red-600 mt-1 text-sm">{errors.phone}</p>}
                </div>
                <div>
                    <label htmlFor="notes" className="block text-charcoal/90 font-sans font-medium mb-1">{t.specialRequests}</label>
                    <div className="relative">
                        <textarea 
                            id="notes" 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            placeholder={t.specialRequestsPlaceholder} 
                            rows={4} 
                            className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-white focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf transition-shadow duration-300 shadow-inner font-sans resize-none text-charcoal"
                        ></textarea>
                        <button 
                            onClick={handleGenerateNote} 
                            disabled={isGeneratingNote} 
                            className="absolute bottom-3 right-3 flex items-center gap-1 text-xs font-bold text-white bg-gold-leaf px-3 py-1.5 rounded-full hover:bg-charcoal transition-colors disabled:opacity-50"
                        >
                            <SparklesIcon className="w-3 h-3"/>
                            {isGeneratingNote ? 'Thinking...' : 'AI Rewrite'}
                        </button>
                    </div>
                </div>
            </div>
          </div>
        );
       case 4: // Confirmation
        return (
            <div className="text-center animate-fade-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-3xl font-serif text-charcoal mb-4">{t.bookingSuccessTitle}</h3>
                <div className="bg-gray-50 p-6 rounded-2xl mb-8 max-w-sm mx-auto">
                    <p className="text-charcoal/80 leading-relaxed mb-4">{t.bookingSuccessMessage.replace('{phone}', phone)}</p>
                    <p className="text-xs text-gray-400">Please check your email client if a draft was created.</p>
                </div>
                <button onClick={resetForm} className="bg-dusty-rose text-white font-sans font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-gold-leaf transition-transform transform hover:scale-105 duration-300">
                    {t.bookAnother}
                </button>
            </div>
        );
      default:
        return null;
    }
  };

  const ProgressDots = () => (
      <div className="flex justify-center items-center gap-3 mb-8">
          {[1,2,3].map(num => (
              <React.Fragment key={num}>
                  <div className={`w-4 h-4 rounded-full transition-all duration-300 ${step >= num ? 'bg-gold-leaf scale-110 shadow-sm' : 'bg-gray-200'}`}></div>
                  {num < 3 && <div className={`h-1 w-16 transition-colors duration-300 ${step > num ? 'bg-gold-leaf' : 'bg-gray-200'}`}></div>}
              </React.Fragment>
          ))}
      </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto p-4 md:p-6 text-center">
      <h2 className="text-4xl font-serif text-charcoal mb-2">{t.bookingTitle}</h2>
      <p className="text-charcoal/80 mb-8 max-w-xl mx-auto font-sans">
        {t.bookingSubtitle}
      </p>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gold-leaf/10 text-left relative overflow-hidden">
        {step < 4 && <ProgressDots />}
        {renderStepContent()}
        
        {step < 4 && (
            <div className={`mt-10 flex ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && (
                <button onClick={handleBack} className="px-6 py-3 rounded-xl font-bold text-charcoal hover:bg-gray-100 transition-colors">
                {t.prevStepButton}
                </button>
            )}
            <button
                onClick={step === 3 ? handleSubmitBooking : handleNext}
                className="bg-gold-leaf text-white font-sans font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-charcoal transition-all transform active:scale-95"
            >
                {step === 3 ? t.requestBookingButton : t.nextStepButton}
            </button>
            </div>
        )}
      </div>
    </div>
  );
};
