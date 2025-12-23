
import React, { useState } from 'react';
import { StaffProfile, Review } from '../types';
import { XMarkIcon, UserIcon, StarIcon, HeartIcon, SparklesIcon, ChatIcon } from './Icons';
import { ReviewModal } from './ReviewModal';

interface ArtistProfileModalProps {
    artist: StaffProfile;
    onClose: () => void;
    onReview?: (review: { rating: number, badges: string[], comment: string, customerName: string }) => void;
}

export const ArtistProfileModal: React.FC<ArtistProfileModalProps> = ({ artist, onClose, onReview }) => {
    const [showReviewModal, setShowReviewModal] = useState(false);

    const handleReviewSubmit = (rating: number, badges: string[], comment: string, customerName: string) => {
        if (onReview) {
            onReview({ rating, badges, comment, customerName });
        }
        setShowReviewModal(false);
    };

    // Sort reviews by date (newest first)
    const sortedReviews = artist.reviews 
        ? [...artist.reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        : [];

    return (
        <>
            {/* Z-INDEX INCREASED TO 120 TO SIT ABOVE SELECTION MODAL (100) */}
            <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center pointer-events-none">
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
                
                {/* Modal Content */}
                <div className="bg-pearl-white w-full md:max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto animate-slide-up relative">
                    
                    {/* Header Image / Pattern */}
                    <div className="h-32 bg-gradient-to-r from-gold-leaf/20 to-blush-pink/50 relative">
                        <button 
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-white/50 hover:bg-white p-2 rounded-full text-charcoal transition-colors backdrop-blur-sm z-10"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Profile Content */}
                    <div className="px-6 pb-6 -mt-16 flex-1 overflow-y-auto custom-scrollbar bg-pearl-white">
                        {/* Avatar & Name */}
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden relative">
                                {artist.avatar ? (
                                    <img src={artist.avatar} alt={artist.name} className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-12 h-12 text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                )}
                            </div>
                            <h2 className="text-3xl font-serif font-bold text-charcoal mt-3">{artist.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex text-gold-leaf">
                                    {[1,2,3,4,5].map(star => (
                                        <React.Fragment key={star}>
                                            <StarIcon className="w-5 h-5" filled={star <= Math.round(artist.rating || 5)} />
                                        </React.Fragment>
                                    ))}
                                </div>
                                <span className="text-gray-500 text-sm font-bold">({artist.rating?.toFixed(1) || "5.0"})</span>
                                <span className="text-gray-400 text-xs">• {artist.reviews?.length || 0} reviews</span>
                            </div>
                        </div>

                        {/* Bio */}
                        {artist.bio && (
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gold-leaf/10 mb-6 text-center">
                                <p className="text-charcoal/80 italic font-serif">"{artist.bio}"</p>
                            </div>
                        )}

                        {/* Specialties */}
                        {artist.specialties && artist.specialties.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-charcoal uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <SparklesIcon className="w-4 h-4 text-gold-leaf" /> Expert In
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {artist.specialties.map(spec => (
                                        <span key={spec} className="px-3 py-1 bg-gold-leaf/10 text-charcoal text-xs font-bold rounded-full border border-gold-leaf/20">
                                            {spec}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Badges */}
                        {sortedReviews.length > 0 && (
                             <div className="mb-6">
                                <h3 className="text-xs font-bold text-charcoal uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <HeartIcon className="w-4 h-4 text-gold-leaf" /> Compliments
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {Array.from(new Set(sortedReviews.flatMap(r => r.badges || []))).slice(0, 6).map(badge => (
                                        <span key={badge} className="px-3 py-1 bg-gray-50 text-gray-600 text-xs font-medium rounded-full border border-gray-100">
                                            {badge}
                                        </span>
                                    ))}
                                </div>
                             </div>
                        )}

                        {/* RECENT REVIEWS SECTION (NEW) */}
                        <div className="mb-6">
                            <h3 className="text-xs font-bold text-charcoal uppercase tracking-widest mb-3 flex items-center gap-2">
                                <ChatIcon className="w-4 h-4 text-gold-leaf" /> Client Love
                            </h3>
                            {sortedReviews.length > 0 ? (
                                <div className="space-y-3">
                                    {sortedReviews.slice(0, 5).map((review) => (
                                        <div key={review.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-charcoal">
                                                        {review.customerName || "Anonymous"}
                                                    </span>
                                                    <div className="flex text-gold-leaf text-xs">
                                                        {[...Array(review.rating)].map((_, i) => (
                                                            <React.Fragment key={i}>
                                                                <StarIcon className="w-3 h-3" filled />
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-gray-400">
                                                    {new Date(review.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {review.comment && (
                                                <p className="text-sm text-gray-600 italic">"{review.comment}"</p>
                                            )}
                                            {review.badges && review.badges.length > 0 && (
                                                <div className="flex gap-1 mt-2 flex-wrap">
                                                    {review.badges.map(b => (
                                                        <span key={b} className="text-[10px] bg-white border border-gray-200 px-1.5 rounded text-gray-500">
                                                            {b}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {sortedReviews.length > 5 && (
                                        <p className="text-center text-xs text-gray-400 mt-2">
                                            And {sortedReviews.length - 5} more reviews...
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-sm">No reviews yet. Be the first!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="p-4 border-t border-gray-100 bg-white grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setShowReviewModal(true)}
                            className="w-full py-3 bg-white text-gold-leaf border-2 border-gold-leaf font-bold rounded-xl hover:bg-gold-leaf hover:text-white transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <StarIcon className="w-5 h-5" filled />
                            Rate Stylist
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full py-3 bg-charcoal text-white font-bold rounded-xl shadow-lg hover:bg-black transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

            {showReviewModal && (
                <ReviewModal 
                    artistName={artist.name} 
                    onClose={() => setShowReviewModal(false)}
                    onSubmit={handleReviewSubmit}
                />
            )}
        </>
    );
};