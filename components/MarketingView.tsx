
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { Translation } from '../translations';
import { 
    PhoneIcon, 
    UserIcon, 
    ClockIcon, 
    StarIcon, 
    ChatIcon,
    GiftIcon
} from './Icons';

interface MarketingViewProps {
    t: Translation;
    transactions: Transaction[];
}

interface RetentionCustomer {
    id: string;
    name: string;
    phone: string;
    lastVisitDate: string;
    daysSinceLastVisit: number;
    visitCount: number;
    membershipExpiry?: string;
    isVip: boolean;
    type: 'red_alert' | 'expiring_vip';
}

export const MarketingView: React.FC<MarketingViewProps> = ({ t, transactions }) => {
    
    const customerAnalysis = useMemo(() => {
        const customers: Record<string, any> = {};
        const now = new Date();

        transactions.forEach(tx => {
            if (!tx.customerName || !tx.customerPhone) return;
            const phone = tx.customerPhone.replace(/\s/g, '');
            
            if (!customers[phone]) {
                customers[phone] = {
                    name: tx.customerName,
                    phone: tx.customerPhone,
                    lastVisit: tx.date,
                    visitCount: 0,
                    membershipExpiry: undefined
                };
            }
            
            customers[phone].visitCount += 1;
            if (new Date(tx.date) > new Date(customers[phone].lastVisit)) {
                customers[phone].lastVisit = tx.date;
            }

            // Detect Membership
            const hasVip = tx.items.some(i => 
                (i.nameKey && i.nameKey.toLowerCase().includes('yearlymembership')) || 
                (i.displayName && i.displayName.toLowerCase().includes('yearly membership'))
            );

            if (hasVip) {
                const expiry = new Date(tx.date);
                expiry.setFullYear(expiry.getFullYear() + 1);
                if (!customers[phone].membershipExpiry || expiry > new Date(customers[phone].membershipExpiry)) {
                    customers[phone].membershipExpiry = expiry.toISOString();
                }
            }
        });

        const redAlerts: RetentionCustomer[] = [];
        const expiringVips: RetentionCustomer[] = [];

        Object.values(customers).forEach(c => {
            const lastVisit = new Date(c.lastVisit);
            const daysSinceLast = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 3600 * 24));
            const isVip = c.membershipExpiry && new Date(c.membershipExpiry) > now;
            
            // Condition 1: Red Alert (> 60 days)
            if (daysSinceLast >= 60) {
                redAlerts.push({
                    id: c.phone,
                    name: c.name,
                    phone: c.phone,
                    lastVisitDate: c.lastVisit,
                    daysSinceLastVisit: daysSinceLast,
                    visitCount: c.visitCount,
                    isVip: !!isVip,
                    type: 'red_alert'
                });
            }

            // Condition 2: Expiring VIP (within next 10 days)
            if (c.membershipExpiry) {
                const expiry = new Date(c.membershipExpiry);
                const daysToExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
                if (daysToExpiry >= 0 && daysToExpiry <= 10) {
                    expiringVips.push({
                        id: c.phone,
                        name: c.name,
                        phone: c.phone,
                        lastVisitDate: c.lastVisit,
                        daysSinceLastVisit: daysSinceLast,
                        visitCount: c.visitCount,
                        membershipExpiry: c.membershipExpiry,
                        isVip: true,
                        type: 'expiring_vip'
                    });
                }
            }
        });

        return {
            redAlerts: redAlerts.sort((a,b) => b.daysSinceLastVisit - a.daysSinceLastVisit),
            expiringVips: expiringVips.sort((a,b) => new Date(a.membershipExpiry!).getTime() - new Date(b.membershipExpiry!).getTime())
        };
    }, [transactions]);

    const handleSendMessage = (customer: RetentionCustomer) => {
        const cleanPhone = customer.phone.replace(/[^0-9+]/g, '');
        let message = "";
        
        if (customer.type === 'red_alert') {
            message = `Hi ${customer.name}, it's been a while since your last visit to La Perla Nails! We miss you. Use code REFRESH for 10% off your next service. Book here: ${window.location.origin}`;
        } else {
            const expiryDate = new Date(customer.membershipExpiry!).toLocaleDateString('en-AU');
            message = `Hi ${customer.name}, your La Perla VIP Membership expires on ${expiryDate}. Renew this week to keep your 10% discount active! See you soon.`;
        }

        window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-red-600 font-bold text-xs uppercase tracking-wider mb-1">Red Alerts</p>
                            <h3 className="text-3xl font-serif font-bold text-red-800">{customerAnalysis.redAlerts.length}</h3>
                            <p className="text-red-500 text-sm mt-1">Customers gone for {'>'}60 days</p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-full text-red-600">
                            <ClockIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-6 rounded-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-purple-600 font-bold text-xs uppercase tracking-wider mb-1">Membership Renewals</p>
                            <h3 className="text-3xl font-serif font-bold text-purple-800">{customerAnalysis.expiringVips.length}</h3>
                            <p className="text-purple-500 text-sm mt-1">VIPs expiring within 10 days</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full text-purple-600">
                            <GiftIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Expiring VIPs Section */}
            {customerAnalysis.expiringVips.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-serif font-bold text-charcoal flex items-center gap-2 px-2">
                        <StarIcon className="w-5 h-5 text-gold-leaf" filled /> Critical VIP Renewals
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customerAnalysis.expiringVips.map(c => (
                            <div key={c.id} className="bg-white border-l-4 border-purple-400 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-bold text-charcoal">{c.name}</p>
                                        <p className="text-xs text-gray-500">{c.phone}</p>
                                    </div>
                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold uppercase">Expires Soon</span>
                                </div>
                                <div className="text-xs text-gray-600 mb-4 bg-purple-50 p-2 rounded-lg">
                                    Expiry: <span className="font-bold">{new Date(c.membershipExpiry!).toLocaleDateString('en-AU')}</span>
                                </div>
                                <button 
                                    onClick={() => handleSendMessage(c)}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <ChatIcon className="w-4 h-4" /> Send Reminder
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Retention List Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-serif font-bold text-charcoal flex items-center gap-2 px-2">
                    <ClockIcon className="w-5 h-5 text-red-500" /> Retention List (Missing Customers)
                </h3>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-200">
                            <tr>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Last Visit</th>
                                <th className="p-4">Days Absent</th>
                                <th className="p-4">Visits</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {customerAnalysis.redAlerts.length === 0 ? (
                                <tr><td colSpan={5} className="p-10 text-center text-gray-400 italic">Everyone is up to date! Great job.</td></tr>
                            ) : (
                                customerAnalysis.redAlerts.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-100 p-2 rounded-full">
                                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-charcoal text-sm">{c.name} {c.isVip && <StarIcon className="w-3 h-3 text-gold-leaf inline" filled />}</p>
                                                    <p className="text-xs text-gray-400">{c.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs text-gray-600">{new Date(c.lastVisitDate).toLocaleDateString('en-AU')}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${c.daysSinceLastVisit > 90 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                                {c.daysSinceLastVisit} days ago
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs font-bold text-charcoal">{c.visitCount}</td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleSendMessage(c)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 mx-auto transition-colors"
                                            >
                                                <ChatIcon className="w-3 h-3" /> Re-engage
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
