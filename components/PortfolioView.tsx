import React from 'react';
import { Translation } from '../translations';
import { CameraIcon, GooglePhotosIcon } from './Icons';

interface PortfolioViewProps {
  t: Translation;
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ t }) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 text-center">
      <div className="w-full mt-8 pt-8 border-t border-gold-leaf/20">
        <h2 className="text-4xl font-serif text-charcoal mb-2">{t.portfolioTitle}</h2>
        <p className="text-charcoal/70 mb-6 max-w-xl mx-auto font-sans">
          {t.portfolioSubtitle}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
                href="https://www.facebook.com/p/La-Perla-Nails-and-Beauty-100063901061637/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-dusty-rose text-white font-sans font-medium py-3 px-8 rounded-full shadow-lg hover:bg-gold-leaf transition-transform transform hover:scale-105 duration-300 flex items-center justify-center gap-3"
            >
                <CameraIcon className="w-6 h-6"/>
                {t.portfolioButtonText}
            </a>
            <a
                href="https://photos.app.goo.gl/c7GZTD7CiRF9sfrS7"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-pearl-white text-charcoal font-sans font-medium py-3 px-8 rounded-full shadow-lg hover:bg-gold-leaf hover:text-white transition-all transform hover:scale-105 duration-300 flex items-center justify-center gap-3 border border-dusty-rose/50"
            >
                <GooglePhotosIcon className="w-6 h-6" />
                {t.portfolioButtonTextGoogle}
            </a>
        </div>
      </div>
    </div>
  );
};
