
import React, { useState, useEffect } from 'react';
import { Translation } from '../translations';
import { LaPerlaLogo, ClockIcon, PhoneIcon, UserIcon } from './Icons';
import { WaitlistEntry } from '../types';

interface KioskViewProps {
  t: Translation;
  waitlist: WaitlistEntry[];
  setWaitlist: (list: WaitlistEntry[]) => void;
  onExit: () => void;
}

export const KioskView: React.FC<KioskViewProps> = ({ t, waitlist, setWaitlist, onExit }) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [exitClicks, setExitClicks] = useState(0); // Secret way to exit kiosk

  // Auto reset after success
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === 'success') {
      timer = setTimeout(() => {
        setStep('form');
        setName('');
        setPhone('');
        setReturnTime('');
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [step]);

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) return;

    const newEntry: WaitlistEntry = {
      id: Date.now().toString(),
      customerName: name,
      customerPhone: phone,
      notes: '',
      addedTime: new Date().toISOString(),
      estimatedReturnTime: returnTime,
      status: 'waiting'
    };

    setWaitlist([...waitlist, newEntry]);
    setStep('success');
  };

  // Secret exit: tap logo 5 times
  const handleLogoClick = () => {
    setExitClicks(prev => {
        const next = prev + 1;
        if (next >= 5) {
            onExit();
            return 0;
        }
        return next;
    });
  };

  return (
    <div className="min-h-screen bg-pearl-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-gold-leaf to-transparent opacity-50"></div>
      <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gold-leaf/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12" onClick={handleLogoClick}>
          <LaPerlaLogo className="w-64 mx-auto mb-4 drop-shadow-md cursor-pointer" />
          <p className="text-charcoal/60 font-serif italic text-lg">{t.kioskWelcome}</p>
        </div>

        {step === 'form' ? (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/50 animate-fade-in">
            <h2 className="text-2xl font-serif text-charcoal mb-6 text-center leading-relaxed">
              {t.kioskSubtitle}
            </h2>

            <div className="space-y-6">
              {/* NAME */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gold-leaf font-bold uppercase text-xs tracking-widest">
                  <UserIcon className="w-4 h-4" /> {t.kioskNameLabel}
                </label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-pearl-white border-b-2 border-dusty-rose/30 px-4 py-3 text-xl font-serif text-charcoal focus:outline-none focus:border-gold-leaf transition-colors placeholder:text-gray-300"
                  placeholder="Name..."
                />
              </div>

              {/* PHONE */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gold-leaf font-bold uppercase text-xs tracking-widest">
                  <PhoneIcon className="w-4 h-4" /> {t.kioskPhoneLabel}
                </label>
                <input 
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-pearl-white border-b-2 border-dusty-rose/30 px-4 py-3 text-xl font-serif text-charcoal focus:outline-none focus:border-gold-leaf transition-colors placeholder:text-gray-300"
                  placeholder="04xx xxx xxx"
                />
              </div>

              {/* RETURN TIME */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gold-leaf font-bold uppercase text-xs tracking-widest">
                  <ClockIcon className="w-4 h-4" /> {t.kioskReturnTimeLabel}
                </label>
                <input 
                  type="text"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full bg-pearl-white border-b-2 border-dusty-rose/30 px-4 py-3 text-xl font-serif text-charcoal focus:outline-none focus:border-gold-leaf transition-colors placeholder:text-gray-300"
                  placeholder={t.kioskReturnTimePlaceholder}
                />
              </div>

              <button 
                onClick={handleSubmit}
                disabled={!name || !phone}
                className="w-full mt-8 bg-gold-leaf text-white font-sans font-bold py-4 rounded-xl shadow-lg hover:bg-charcoal hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 active:scale-95 text-lg"
              >
                {t.kioskJoinButton}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/50 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">✨</span>
            </div>
            <h3 className="text-3xl font-serif text-charcoal mb-4">{t.kioskSuccessTitle}</h3>
            <p className="text-charcoal/70 text-lg">
              {t.kioskSuccessMessage.replace('{name}', name)}
            </p>
          </div>
        )}
      </div>
      
      <div className="absolute bottom-4 text-center w-full opacity-20 text-xs">
          Tap logo 5 times to exit
      </div>
    </div>
  );
};
