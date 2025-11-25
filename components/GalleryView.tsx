import React from 'react';
import { GALLERY_ITEMS } from '../constants';
import { Translation } from '../translations';
import { GalleryItem } from '../types';

interface GalleryViewProps {
  t: Translation;
  onTryStyle: (styleName: string) => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({ 
  t, 
  onTryStyle, 
}) => {
  // Directly handle the style selection on click, removing the modal step.
  const handleImageClick = (image: GalleryItem) => {
    const styleName = t.galleryImageNames[image.nameKey as keyof typeof t.galleryImageNames];
    onTryStyle(styleName);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 text-center">
      <h2 className="text-4xl font-serif text-charcoal mb-2">{t.galleryTitle}</h2>
      <p className="text-charcoal/80 mb-8 max-w-xl mx-auto font-sans">
        {t.gallerySubtitle}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {GALLERY_ITEMS.map((item, index) => {
          const styleName = t.galleryImageNames[item.nameKey as keyof typeof t.galleryImageNames];
          return (
          <button
            key={item.id}
            onClick={() => handleImageClick(item)}
            className="group relative aspect-square bg-blush-pink rounded-2xl overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-gold-leaf focus:ring-opacity-50 opacity-0 animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
            aria-label={`${t.tryThisStyleButton}: ${styleName}`}
          >
            <img
              src={item.src}
              alt={styleName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-charcoal/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2">
              <p className="text-pearl-white text-center font-serif font-bold tracking-wider">
                {styleName}
              </p>
            </div>
          </button>
        )})}
      </div>
    </div>
  );
};
