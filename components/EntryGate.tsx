
import React, { useState } from 'react';
import { LaPerlaLogo, UserIcon, XMarkIcon, SparklesIcon, LockIcon, BriefcaseIcon } from './Icons';
import { StaffProfile, AdminPasswords } from '../types';
import { DEFAULT_ADMIN_PASSWORDS } from '../constants';

interface EntryGateProps {
    onClientEnter: () => void;
    onStaffLogin: (user: StaffProfile, role?: 'master' | 'manager') => void;
    staffList: StaffProfile[];
    adminPasswords?: AdminPasswords;
}

// SECURITY: Use Salted Base64 to obfuscate PIN in source code (Legacy recovery).
const HASHED_PIN = "TGFQZXJsYVNhbHQyODA0";

export const EntryGate: React.FC<EntryGateProps> = ({ onClientEnter, onStaffLogin, staffList, adminPasswords = DEFAULT_ADMIN_PASSWORDS }) => {
    const [view, setView] = useState<'selection' | 'staff_login' | 'admin_login' | 'admin_recovery'>('selection');
    const [selectedStaff, setSelectedStaff] = useState<StaffProfile | null>(null);
    const [pinInput, setPinInput] = useState("");
    const [error, setError] = useState("");

    const handlePinSubmit = () => {
        if (!selectedStaff) return;
        if (pinInput === selectedStaff.password) {
            onStaffLogin(selectedStaff);
        } else {
            setError("Incorrect Password");
            setPinInput("");
        }
    };

    const handleAdminLogin = () => {
        // Check Master Password
        if (pinInput === adminPasswords.master) {
             onStaffLogin({ 
                id: 'admin_master', 
                name: 'Administrator', 
                password: '', 
                avatar: '' 
            }, 'master');
            return;
        }

        // Check Shop Manager Password
        if (pinInput === adminPasswords.manager) {
             onStaffLogin({ 
                id: 'shop_manager', 
                name: 'Shop Manager', 
                password: '', 
                avatar: '' 
            }, 'manager');
            return;
        }

        // Legacy Fallback (Hardcoded)
        try {
            const hashedInput = btoa(`LaPerlaSalt${pinInput}`);
            if (hashedInput === HASHED_PIN) {
                onStaffLogin({ 
                    id: 'admin_master', 
                    name: 'Administrator', 
                    password: '', 
                    avatar: '' 
                }, 'master');
                return;
            }
        } catch (e) {}

        setError("Incorrect PIN");
        setPinInput("");
    };

    const handleAdminRecovery = () => {
        try {
            const hashedInput = btoa(`LaPerlaSalt${pinInput}`);
            if (hashedInput === HASHED_PIN) {
                // Log in as a temporary Admin user for recovery
                onStaffLogin({ id: 'admin_recovery', name: 'System Admin', password: '', avatar: '' }, 'master');
            } else {
                setError("Incorrect PIN");
                setPinInput("");
            }
        } catch (e) {
            setError("System Error");
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (view === 'staff_login') handlePinSubmit();
            if (view === 'admin_login') handleAdminLogin();
            if (view === 'admin_recovery') handleAdminRecovery();
        }
    };

    // Auto-detect empty staff list problem and offer recovery
    const showRecoveryOption = staffList.length === 0 && view === 'staff_login';

    return (
        <div className="min-h-screen bg-pearl-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
                 <div className="absolute top-10 left-10 w-64 h-64 bg-blush-pink rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                 <div className="absolute top-10 right-10 w-64 h-64 bg-gold-leaf/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                 <div className="absolute bottom-10 left-1/2 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
             </div>

             <div className="relative z-10 w-full max-w-md text-center">
                 <div className="mb-10 animate-fade-in-up">
                    <LaPerlaLogo className="w-64 mx-auto drop-shadow-sm" />
                    <p className="mt-4 text-charcoal/60 font-serif italic">Nails & Beauty • AI Stylist</p>
                 </div>

                 {view === 'selection' && (
                     <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                         <button 
                            onClick={onClientEnter}
                            className="w-full group bg-white hover:bg-gold-leaf border border-gold-leaf/20 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-4"
                         >
                             <div className="w-12 h-12 rounded-full bg-blush-pink flex items-center justify-center group-hover:bg-white/20">
                                 <SparklesIcon className="w-6 h-6 text-charcoal group-hover:text-white" />
                             </div>
                             <div className="text-left flex-1">
                                 <h3 className="text-xl font-serif font-bold text-charcoal group-hover:text-white">I am a Client</h3>
                                 <p className="text-sm text-gray-500 group-hover:text-white/80">View Menu & Try AI Styles</p>
                             </div>
                         </button>

                         <button 
                            onClick={() => setView('staff_login')}
                            className="w-full group bg-white/50 hover:bg-charcoal border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-4"
                         >
                             <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center group-hover:bg-gray-600">
                                 <UserIcon className="w-6 h-6 text-charcoal group-hover:text-white" />
                             </div>
                             <div className="text-left flex-1">
                                 <h3 className="text-xl font-serif font-bold text-charcoal group-hover:text-white">Staff Login</h3>
                                 <p className="text-sm text-gray-500 group-hover:text-gray-400">Access POS & Orders</p>
                             </div>
                         </button>

                         <button 
                            onClick={() => setView('admin_login')}
                            className="w-full group bg-charcoal hover:bg-black border border-gray-700 rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-4"
                         >
                             <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center group-hover:bg-gray-800 border border-gray-600">
                                 <BriefcaseIcon className="w-6 h-6 text-gold-leaf" />
                             </div>
                             <div className="text-left flex-1">
                                 <h3 className="text-xl font-serif font-bold text-white">Admin Access</h3>
                                 <p className="text-sm text-gray-400 group-hover:text-gray-300">Manager Controls</p>
                             </div>
                         </button>
                     </div>
                 )}

                 {view === 'staff_login' && (
                     <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-white/50 animate-fade-in">
                         <div className="flex justify-between items-center mb-6">
                             <button onClick={() => { setView('selection'); setSelectedStaff(null); setError(""); }} className="text-gray-400 hover:text-charcoal">
                                 Back
                             </button>
                             <h3 className="font-serif font-bold text-lg">Select Profile</h3>
                             <div className="w-8">
                                 {showRecoveryOption && (
                                     <button onClick={() => setView('admin_recovery')} title="Admin Recovery" className="text-red-300 hover:text-red-500">
                                         <LockIcon className="w-5 h-5" />
                                     </button>
                                 )}
                             </div> 
                         </div>

                         {!selectedStaff ? (
                             <div className="grid grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto custom-scrollbar p-1">
                                 {staffList.map(staff => (
                                     <button 
                                        key={staff.id}
                                        onClick={() => setSelectedStaff(staff)}
                                        className="flex flex-col items-center group"
                                     >
                                         <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-100 group-hover:border-gold-leaf transition-colors mb-2 bg-gray-200 shadow-sm relative">
                                             {staff.avatar ? (
                                                 <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                                             ) : (
                                                 <UserIcon className="w-8 h-8 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                             )}
                                         </div>
                                         <span className="text-xs font-bold text-charcoal group-hover:text-gold-leaf">{staff.name}</span>
                                     </button>
                                 ))}
                                 {staffList.length === 0 && (
                                     <div className="col-span-3 text-center py-8 text-gray-400">
                                         <p>No profiles found.</p>
                                         <p className="text-xs mt-2">Click the Lock icon above to fix.</p>
                                     </div>
                                 )}
                             </div>
                         ) : (
                             <div className="text-center">
                                 <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-4 border-gold-leaf shadow-md bg-gray-200 relative">
                                    {selectedStaff.avatar ? (
                                        <img src={selectedStaff.avatar} alt={selectedStaff.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-10 h-10 text-gray-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                                    )}
                                 </div>
                                 <h3 className="text-xl font-bold text-charcoal mb-6">Hello, {selectedStaff.name}</h3>
                                 
                                 <input 
                                    type="password" 
                                    placeholder="Enter Password" 
                                    value={pinInput}
                                    onChange={(e) => setPinInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full p-4 text-center text-2xl tracking-widest border-2 border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf outline-none bg-white text-charcoal transition-all"
                                    autoFocus
                                 />
                                 
                                 {error && <p className="text-red-500 text-sm mb-4 font-bold animate-pulse">{error}</p>}
                                 
                                 <button 
                                    onClick={handlePinSubmit}
                                    className="w-full py-3 bg-gold-leaf text-white rounded-xl font-bold hover:bg-charcoal transition-colors shadow-lg"
                                 >
                                     Login
                                 </button>
                             </div>
                         )}
                     </div>
                 )}

                 {view === 'admin_login' && (
                     <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-charcoal/20 animate-fade-in border-2">
                         <div className="text-center">
                             <div className="w-16 h-16 rounded-full bg-charcoal flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-gold-leaf">
                                 <LockIcon className="w-8 h-8 text-gold-leaf" />
                             </div>
                             <h3 className="text-xl font-bold text-charcoal mb-2">Admin Login</h3>
                             <p className="text-xs text-gray-500 mb-6">Enter Shop Manager or Master PIN</p>
                             
                             <input 
                                type="password" 
                                placeholder="PIN" 
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full p-4 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-charcoal outline-none bg-white text-charcoal transition-all"
                                autoFocus
                             />
                             
                             {error && <p className="text-red-500 text-sm mb-4 font-bold animate-pulse">{error}</p>}
                             
                             <div className="flex gap-2">
                                 <button 
                                    onClick={() => { setView('selection'); setError(""); setPinInput(""); }}
                                    className="flex-1 py-3 bg-gray-200 text-charcoal rounded-xl font-bold hover:bg-gray-300"
                                 >
                                     Cancel
                                 </button>
                                 <button 
                                    onClick={handleAdminLogin}
                                    className="flex-1 py-3 bg-gold-leaf text-white rounded-xl font-bold hover:bg-charcoal shadow-lg"
                                 >
                                     Enter
                                 </button>
                             </div>
                         </div>
                     </div>
                 )}

                 {view === 'admin_recovery' && (
                     <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-red-200 animate-fade-in border-2">
                         <div className="text-center">
                             <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                 <LockIcon className="w-8 h-8 text-red-500" />
                             </div>
                             <h3 className="text-xl font-bold text-red-600 mb-2">System Recovery</h3>
                             <p className="text-xs text-gray-500 mb-6">Enter Admin PIN to restore staff access.</p>
                             
                             <input 
                                type="password" 
                                placeholder="Admin PIN" 
                                value={pinInput}
                                onChange={(e) => setPinInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full p-4 text-center text-2xl tracking-widest border-2 border-red-100 rounded-xl mb-4 focus:ring-2 focus:ring-red-500 outline-none bg-white text-charcoal transition-all"
                                autoFocus
                             />
                             
                             {error && <p className="text-red-500 text-sm mb-4 font-bold animate-pulse">{error}</p>}
                             
                             <div className="flex gap-2">
                                 <button 
                                    onClick={() => { setView('staff_login'); setError(""); setPinInput(""); }}
                                    className="flex-1 py-3 bg-gray-200 text-charcoal rounded-xl font-bold hover:bg-gray-300"
                                 >
                                     Cancel
                                 </button>
                                 <button 
                                    onClick={handleAdminRecovery}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg"
                                 >
                                     Unlock
                                 </button>
                             </div>
                         </div>
                     </div>
                 )}
             </div>
        </div>
    );
};