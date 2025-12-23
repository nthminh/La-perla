
import React, { useState } from 'react';
import { StaffProfile } from '../types';
import { Translation } from '../translations';
import { UserIcon, StarIcon, SparklesIcon, InfoIcon, CameraIcon, LockIcon, XMarkIcon } from './Icons';
import { ArtistProfileModal } from './ArtistProfileModal';

interface ArtistsViewProps {
    t: Translation;
    staffList: StaffProfile[];
    onStaffReview: (staffId: string, review: { rating: number, badges: string[], comment: string, customerName: string }) => void;
    currentUser?: StaffProfile | null;
    onOpenPortal?: () => void;
}

export const ArtistsView: React.FC<ArtistsViewProps> = ({ t, staffList, onStaffReview, currentUser, onOpenPortal }) => {
    const [selectedArtist, setSelectedArtist] = useState<StaffProfile | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [error, setError] = useState("");

    const handleOpenPortalClick = () => {
        setShowPasswordModal(true);
        setPasswordInput("");
        setError("");
    };

    const handlePasswordSubmit = () => {
        if (!currentUser) return;
        
        if (passwordInput === currentUser.password) {
            setShowPasswordModal(false);
            if (onOpenPortal) onOpenPortal();
        } else {
            setError("Incorrect Password");
            setPasswordInput("");
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handlePasswordSubmit();
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 animate-fade-in relative">
            
            {/* PORTAL ACCESS BUTTON (STAFF MODE ONLY) */}
            {currentUser && onOpenPortal && (
                <div className="absolute top-4 right-4 md:right-6 z-10">
                    <button 
                        onClick={handleOpenPortalClick}
                        className="bg-charcoal text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-md hover:bg-black transition-colors transform hover:scale-105"
                    >
                        <CameraIcon className="w-4 h-4 text-gold-leaf" />
                        <span className="font-bold text-xs md:text-sm">My Portal</span>
                    </button>
                </div>
            )}

            <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-serif text-charcoal mb-2">{t.navTeam}</h2>
                <p className="text-charcoal/60 font-sans">Meet our talented stylists and see their masterpieces.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {staffList.map((staff) => (
                    <button 
                        key={staff.id}
                        onClick={() => setSelectedArtist(staff)}
                        className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gold-leaf/10 overflow-hidden transition-all duration-300 group flex flex-col h-full text-left"
                    >
                        <div className="aspect-square w-full bg-gray-100 relative overflow-hidden">
                            {staff.avatar ? (
                                <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                    <UserIcon className="w-20 h-20" />
                                </div>
                            )}
                            {/* Overlay Info */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                <span className="text-white text-sm font-bold flex items-center gap-2">
                                    <InfoIcon className="w-4 h-4" /> View Profile
                                </span>
                            </div>
                        </div>
                        
                        <div className="p-4 flex-grow flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-serif font-bold text-charcoal group-hover:text-gold-leaf transition-colors">{staff.name}</h3>
                                <div className="flex items-center gap-1 bg-gold-leaf/10 px-2 py-1 rounded-lg">
                                    <StarIcon className="w-3 h-3 text-gold-leaf" filled />
                                    <span className="text-xs font-bold text-charcoal">{staff.rating?.toFixed(1) || "5.0"}</span>
                                </div>
                            </div>
                            
                            {staff.specialties && staff.specialties.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-auto">
                                    {staff.specialties.slice(0, 3).map(spec => (
                                        <span key={spec} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full border border-gray-200">
                                            {spec}
                                        </span>
                                    ))}
                                    {staff.specialties.length > 3 && (
                                        <span className="text-[10px] text-gray-400 px-1">+{staff.specialties.length - 3}</span>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-auto text-xs text-gray-400 italic">Stylist</div>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {selectedArtist && (
                <ArtistProfileModal 
                    artist={selectedArtist} 
                    onClose={() => setSelectedArtist(null)} 
                    onReview={(review) => onStaffReview(selectedArtist.id, review)}
                />
            )}

            {/* PASSWORD MODAL FOR PORTAL ACCESS */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
                    <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl p-6 relative z-10 animate-fade-in-up border border-gold-leaf/20">
                        <button onClick={() => setShowPasswordModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-charcoal">
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                        
                        <div className="text-center">
                            <div className="w-12 h-12 bg-gold-leaf/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <LockIcon className="w-6 h-6 text-gold-leaf" />
                            </div>
                            <h3 className="text-lg font-bold text-charcoal mb-1">Verify Identity</h3>
                            <p className="text-xs text-gray-500 mb-4">Enter password for {currentUser?.name}</p>
                            
                            <input 
                                type="password" 
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full text-center text-xl p-2 border-b-2 border-gray-200 focus:border-gold-leaf outline-none mb-4 tracking-widest text-charcoal"
                                placeholder="****"
                                autoFocus
                            />
                            
                            {error && <p className="text-red-500 text-xs mb-3 font-bold animate-pulse">{error}</p>}
                            
                            <button 
                                onClick={handlePasswordSubmit}
                                className="w-full bg-charcoal text-white py-2 rounded-lg font-bold hover:bg-black transition-colors"
                            >
                                Enter Portal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
