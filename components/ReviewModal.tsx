
import React, { useState } from 'react';
import { StarIcon, XMarkIcon, HeartIcon } from './Icons';

interface ReviewModalProps {
    artistName: string;
    onClose: () => void;
    onSubmit: (rating: number, badges: string[], comment: string, customerName: string) => void;
}

const BADGES = [
    "Friendly 😊", 
    "Gentle ☁️", 
    "Fast ⚡", 
    "Creative 🎨", 
    "Meticulous 🔍", 
    "Clean ✨", 
    "Professional 💼", 
    "Good Listener 👂"
];

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];

export const ReviewModal: React.FC<ReviewModalProps> = ({ artistName, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
    const [comment, setComment] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [hoverRating, setHoverRating] = useState(0);

    const toggleBadge = (badge: string) => {
        setSelectedBadges(prev => 
            prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
        );
    };

    const handleSubmit = () => {
        if (rating === 0) return;
        onSubmit(rating, selectedBadges, comment, customerName);
    };

    const currentDisplayRating = hoverRating || rating;

    return (
        // Z-INDEX 130 TO BE ABOVE PROFILE MODAL (120)
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-fade-in-up border border-gold-leaf/20 flex flex-col max-h-[90vh]">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-charcoal bg-gray-100 rounded-full p-1 z-20"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="p-6 text-center overflow-y-auto custom-scrollbar">
                    <div className="w-16 h-16 bg-gold-leaf/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-leaf/30">
                        <HeartIcon className="w-8 h-8 text-gold-leaf" filled />
                    </div>
                    
                    <h3 className="text-2xl font-serif font-bold text-charcoal mb-1">Rate {artistName}</h3>
                    <p className="text-gray-500 text-sm mb-6">How was your experience?</p>

                    {/* Star Rating */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className="transition-transform hover:scale-125 focus:outline-none p-1"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <div className={star <= currentDisplayRating ? "text-gold-leaf drop-shadow-sm" : "text-gray-200"}>
                                        <StarIcon 
                                            className="w-10 h-10" 
                                            filled={true} 
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>
                        <p className={`h-6 mt-2 font-bold text-lg transition-all ${currentDisplayRating > 0 ? 'text-gold-leaf' : 'opacity-0'}`}>
                            {RATING_LABELS[currentDisplayRating]}
                        </p>
                    </div>

                    {/* Badges */}
                    <div className="mb-6">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Give a Compliment</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {BADGES.map(badge => (
                                <button
                                    key={badge}
                                    onClick={() => toggleBadge(badge)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                        selectedBadges.includes(badge)
                                            ? 'bg-gold-leaf text-white border-gold-leaf shadow-md scale-105'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gold-leaf hover:text-gold-leaf'
                                    }`}
                                >
                                    {badge}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-3 mb-6 text-left">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Your Name (Optional)</label>
                            <input 
                                type="text"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                placeholder="e.g. Sarah"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gold-leaf outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Comment</label>
                            <textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience..."
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-gold-leaf outline-none resize-none h-20"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0}
                        className="w-full py-4 bg-charcoal text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                    >
                        Submit Review
                    </button>
                </div>
            </div>
        </div>
    );
};
