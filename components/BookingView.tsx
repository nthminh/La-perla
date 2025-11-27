
import React, { useState, useMemo } from 'react';
import { Translation } from '../translations';
// Remove direct import
// import { PRICING_DATA } from '../constants';
import { generateBookingRequest } from '../gemini';
import { SparklesIcon } from './Icons';
import { ServiceCategory } from '../types';

interface BookingViewProps {
  t: Translation;
  languageCode: string;
  // Dynamic Pricing Data
  pricingData: ServiceCategory[];
}

const today = new Date().toISOString().split('T')[0];

// NOTE: Replace this with the actual salon's email address.
const SALON_EMAIL_ADDRESS = 'nthminh2804@gmail.com,vivian.dinh191@gmail.com,jd@doav.com.au';

export const BookingView: React.FC<BookingViewProps> = ({ t, languageCode, pricingData }) => {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Record<string, boolean>>({});
  const [date, setDate] = useState(today);
  const [timeSlot, setTimeSlot] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);

  const selectedServiceKeys = useMemo(() => Object.keys(selectedServices).filter(key => selectedServices[key]), [selectedServices]);

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
      
      let timeSlotLabel = timeSlot;
      if (timeSlot === 'Morning') timeSlotLabel = t.timeMorning;
      if (timeSlot === 'Afternoon') timeSlotLabel = t.timeAfternoon;
      if (timeSlot === 'Evening') timeSlotLabel = t.timeEvening;

      const subject = `New Booking Request from La Perla App - ${name}`;
      
      const bodyParts = [
        `Hi La Perla Team,`,
        ``,
        `I would like to request an appointment with the following details:`,
        ``,
        `Services:`,
        ...serviceNames.map(s => `- ${s}`),
        ``,
        `Preferred Date: ${date}`,
        `Preferred Time: ${timeSlotLabel}`,
        ``,
        `My Details:`,
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Notes: ${notes.trim() || 'N/A'}`,
        ``,
        `Thank you!`,
      ];
      const body = bodyParts.join('\n');
      
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      
      const mailtoUrl = `mailto:${SALON_EMAIL_ADDRESS}?subject=${encodedSubject}&body=${encodedBody}`;

      window.location.href = mailtoUrl;
      
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
            <h3 className="text-2xl font-serif text-charcoal mb-4">{t.step1Title}</h3>
            {pricingData.map(category => (
              <div key={category.categoryKey} className="mb-4">
                 <details className="bg-pearl-white/50 rounded-lg p-3">
                    <summary className="font-serif text-lg text-charcoal cursor-pointer list-item">{t.serviceCategories[category.categoryKey] || category.categoryKey}</summary>
                    <div className="mt-2 pl-4 border-l-2 border-gold-leaf/50">
                        {category.services.map(service => (
                        <label key={service.nameKey} className="flex items-center p-2 hover:bg-blush-pink/50 rounded-md cursor-pointer">
                            <input
                            type="checkbox"
                            checked={!!selectedServices[service.nameKey]}
                            onChange={() => handleServiceToggle(service.nameKey)}
                            className="h-5 w-5 rounded border-dusty-rose text-gold-leaf focus:ring-gold-leaf"
                            />
                            <span className="ml-3 text-charcoal/90">{service.displayName || t.serviceNames[service.nameKey] || service.nameKey}</span>
                            <span className="ml-auto font-medium text-gold-leaf">{service.price}</span>
                        </label>
                        ))}
                    </div>
                 </details>
              </div>
            ))}
            {errors.services && <p className="text-red-600 mt-2">{errors.services}</p>}
          </div>
        );
      case 2: // Date & Time
        const timeSlots = [
            { key: 'Morning', label: t.timeMorning },
            { key: 'Afternoon', label: t.timeAfternoon },
            { key: 'Evening', label: t.timeEvening },
        ]
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
                    className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-pearl-white/80 focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf transition-shadow duration-300 shadow-inner font-sans"
                />
                {errors.date && <p className="text-red-600 mt-1 text-sm">{errors.date}</p>}
            </div>
            <div>
                <label className="block text-charcoal/90 font-sans font-medium mb-2">{t.selectTime}</label>
                <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(slot => (
                        <button
                            key={slot.key}
                            onClick={() => setTimeSlot(slot.key)}
                            className={`p-3 rounded-lg font-sans font-medium transition-colors duration-200 ${timeSlot === slot.key ? 'bg-gold-leaf text-white shadow-md' : 'bg-pearl-white/80 hover:bg-dusty-rose/50'}`}
                        >
                            {slot.label}
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
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-charcoal/90 font-sans font-medium mb-1">{t.yourName}</label>
                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-pearl-white/80 focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf transition-shadow duration-300 shadow-inner font-sans" />
                    {errors.name && <p className="text-red-600 mt-1 text-sm">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="phone" className="block text-charcoal/90 font-sans font-medium mb-1">{t.yourPhone}</label>
                    <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-pearl-white/80 focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf transition-shadow duration-300 shadow-inner font-sans" />
                    {errors.phone && <p className="text-red-600 mt-1 text-sm">{errors.phone}</p>}
                </div>
                <div>
                    <label htmlFor="notes" className="block text-charcoal/90 font-sans font-medium mb-1">{t.specialRequests}</label>
                    <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder={t.specialRequestsPlaceholder} rows={4} className="w-full p-3 border-2 border-dusty-rose/50 rounded-xl bg-pearl-white/80 focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf transition-shadow duration-300 shadow-inner font-sans resize-none"></textarea>
                    <button onClick={handleGenerateNote} disabled={isGeneratingNote} className="mt-2 flex items-center gap-2 text-sm font-sans text-gold-leaf hover:underline disabled:opacity-50 disabled:cursor-wait">
                      <SparklesIcon className="w-4 h-4"/>
                      {isGeneratingNote ? t.aiAssistLoading : t.aiAssist}
                    </button>
                </div>
            </div>
          </div>
        );
       case 4: // Confirmation
        return (
            <div className="text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-3xl font-serif text-charcoal mb-2">{t.bookingSuccessTitle}</h3>
                <p className="text-charcoal/80 mb-6">{t.bookingSuccessMessage.replace('{phone}', phone)}</p>
                <button onClick={resetForm} className="bg-dusty-rose text-white font-sans font-medium py-3 px-8 rounded-full shadow-lg hover:bg-gold-leaf transition-transform transform hover:scale-105 duration-300">
                    {t.bookAnother}
                </button>
            </div>
        );
      default:
        return null;
    }
  };

  const ProgressDots = () => (
      <div className="flex justify-center items-center gap-3 mb-6">
          {[1,2,3].map(num => (
              <React.Fragment key={num}>
                  <div className={`w-3 h-3 rounded-full transition-colors ${step >= num ? 'bg-gold-leaf' : 'bg-dusty-rose/50'}`}></div>
                  {num < 3 && <div className={`h-0.5 w-12 transition-colors ${step > num ? 'bg-gold-leaf' : 'bg-dusty-rose/50'}`}></div>}
              </React.Fragment>
          ))}
      </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 text-center">
      <h2 className="text-4xl font-serif text-charcoal mb-2">{t.bookingTitle}</h2>
      <p className="text-charcoal/80 mb-8 max-w-xl mx-auto font-sans">
        {t.bookingSubtitle}
      </p>

      <div className="bg-pearl-white/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-lg border border-gold-leaf/20 text-left">
        {step < 4 && <ProgressDots />}
        {renderStepContent()}
        
        {step < 4 && (
            <div className={`mt-8 flex ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && (
                <button onClick={handleBack} className="bg-pearl-white text-charcoal font-sans font-medium py-2 px-6 rounded-full shadow-md hover:bg-dusty-rose/30 transition-colors border border-dusty-rose/50">
                {t.prevStepButton}
                </button>
            )}
            <button
                onClick={step === 3 ? handleSubmitBooking : handleNext}
                className="bg-gold-leaf text-white font-sans font-medium py-2 px-6 rounded-full shadow-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
            >
                {step === 3 ? t.requestBookingButton : t.nextStepButton}
            </button>
            </div>
        )}
      </div>
    </div>
  );
};
