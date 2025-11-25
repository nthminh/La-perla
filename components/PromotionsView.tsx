
import React from 'react';
import { GiftIcon, PhoneIcon, MapPinIcon } from './Icons';
import { Translation } from '../translations';

const PromotionsView: React.FC<{ t: Translation }> = ({ t }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 text-charcoal font-sans animate-fade-in-up">
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-2">{t.promoTitle}</h2>
        <p className="text-xl md:text-2xl font-serif text-dusty-rose font-semibold">{t.promoSubtitle}</p>
      </div>

      {/* Offer 2: Pedicure Upgrade */}
      <div className="bg-pearl-white/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-lg border border-gold-leaf/20 mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-2xl font-serif text-gold-leaf mb-4 text-center font-bold">{t.promoOffer2Title}</h3>
        <p className="text-center mb-6" dangerouslySetInnerHTML={{ __html: t.promoOffer2Desc }}></p>
        <ul className="space-y-3 list-inside list-disc marker:text-gold-leaf pl-4">
            <li dangerouslySetInnerHTML={{ __html: t.promoUpgrade1 }}></li>
            <li dangerouslySetInnerHTML={{ __html: t.promoUpgrade2 }}></li>
            <li dangerouslySetInnerHTML={{ __html: t.promoUpgrade3 }}></li>
            <li dangerouslySetInnerHTML={{ __html: t.promoUpgrade4 }}></li>
        </ul>
        <p className="mt-6 text-center text-lg font-serif text-charcoal">{t.promoOffer2Closing}</p>
      </div>

      {/* Contact and Call to Action */}
       <div className="bg-pearl-white/80 backdrop-blur-sm p-6 md:p-8 rounded-2xl shadow-lg border border-gold-leaf/20 mb-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h3 className="text-2xl font-serif text-charcoal mb-4 text-center">{t.promoContactTitle}</h3>
        <div className="text-center space-y-2">
            <p className="font-bold text-lg">{t.promoSalonName}</p>
            <p><MapPinIcon className="inline w-5 h-5 mr-2"/> <span dangerouslySetInnerHTML={{__html: t.promoAddressLabel}}></span> <span dangerouslySetInnerHTML={{__html: t.promoAddressValue}}></span></p>
            <p><PhoneIcon className="inline w-5 h-5 mr-2"/> <span dangerouslySetInnerHTML={{__html: t.promoPhoneLabel}}></span> <a href="tel:0296258194" className="hover:underline">(02) 9625 8194</a> {t.promoPhonePurpose}</p>
            <p><PhoneIcon className="inline w-5 h-5 mr-2"/> <span dangerouslySetInnerHTML={{__html: t.promoVoucherHotlineLabel}}></span> <a href="tel:0450929388" className="hover:underline">0450 929 388</a> {t.promoVoucherHotlinePurpose}</p>
        </div>
      </div>

      <div className="text-center p-6 bg-blush-pink/80 border border-gold-leaf/30 rounded-2xl shadow-lg animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <h3 className="text-2xl font-serif font-bold mb-4 text-charcoal">{t.promoEmailVoucherTitle}</h3>
        <p className="mb-6 text-charcoal/80">
          {t.promoEmailVoucherDesc}
        </p>
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSdHawf_Dd9BkC-eBh9gV8PcyB_ftMPbb7q4SbCgrbjShSjQUg/viewform?usp=sharing&ouid=113531517325029049278"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center bg-gold-leaf text-white font-sans font-medium py-3 px-8 rounded-full shadow-lg hover:bg-opacity-90 transition-all transform hover:scale-105 duration-300"
        >
          <GiftIcon className="w-5 h-5 mr-2" />
          {t.promoEmailVoucherButton}
        </a>
      </div>
    </div>
  );
};

export default PromotionsView;
