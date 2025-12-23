import React, { useState, useMemo, useRef } from 'react';
import { Transaction, StaffProfile, ServiceCategory } from '../types';
import { Translation } from '../translations';
import { 
    SearchIcon, 
    UserIcon, 
    ChevronDownIcon, 
    XMarkIcon, 
    BriefcaseIcon,
    StarIcon,
    EyeIcon,
    ClockIcon,
    PlusIcon,
    UploadIcon,
    DownloadIcon,
    PencilIcon
} from './Icons';
import { saveTransactionToFirebase, updateTransactionInFirebase } from '../services/firebaseService';

interface CustomerCRMViewProps {
    t: Translation;
    transactions: Transaction[];
    staffList: StaffProfile[];
    pricingData: ServiceCategory[];
}

interface CustomerSummary {
    id: string; // Phone or Name as key
    name: string;
    phone: string;
    notes: string;
    totalSpent: number;
    visitCount: number;
    lastVisitDate: string;
    firstVisitDate: string;
    favoriteStaff: string; // Staff ID with most interactions
    favoriteService: string; // Most common service category
    history: Transaction[];
    status: 'new' | 'regular' | 'vip' | 'lost';
    membershipExpiry?: string;
}

export const CustomerCRMView: React.FC<CustomerCRMViewProps> = ({ t, transactions, staffList, pricingData }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStaffId, setFilterStaffId] = useState("all");
    const [filterService, setFilterService] = useState("");
    const [filterStartDate, setFilterStartDate] = useState("");
    const [filterEndDate, setFilterEndDate] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

    // Edit State
    const [isEditMode, setIsEditMode] = useState(false);
    const [tempName, setTempName] = useState("");
    const [tempPhone, setTempPhone] = useState("");
    const [tempNotes, setTempNotes] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [manualName, setManualName] = useState("");
    const [manualPhone, setManualPhone] = useState("");
    const [manualSpent, setManualSpent] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const customerList = useMemo(() => {
        const customers: Record<string, CustomerSummary> = {};

        // THUẬT TOÁN MỚI: Quét tất cả giao dịch để tìm Membership
        transactions.forEach(tx => {
            if (!tx.customerName) return; 

            const custId = tx.customerPhone ? tx.customerPhone.replace(/\s/g, '') : tx.customerName.toLowerCase().trim();
            
            if (!customers[custId]) {
                customers[custId] = {
                    id: custId,
                    name: tx.customerName,
                    phone: tx.customerPhone || "",
                    notes: tx.customerNotes || "",
                    totalSpent: 0,
                    visitCount: 0,
                    lastVisitDate: tx.date,
                    firstVisitDate: tx.date,
                    favoriteStaff: "",
                    favoriteService: "",
                    history: [],
                    status: 'new'
                };
            }

            const c = customers[custId];
            c.totalSpent += tx.total;
            c.visitCount += 1;
            c.history.push(tx);
            
            // Kiểm tra xem giao dịch này có mua Membership không
            const hasMembershipItem = tx.items.some(i => 
                (i.nameKey && i.nameKey.toLowerCase().includes('yearlymembership')) || 
                (i.displayName && i.displayName.toLowerCase().includes('yearly membership'))
            );

            if (hasMembershipItem) {
                const purchaseDate = new Date(tx.date);
                const expiryDate = new Date(purchaseDate);
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                const expiryISO = expiryDate.toISOString();
                
                // Cập nhật nếu ngày hết hạn mới xa hơn ngày cũ
                if (!c.membershipExpiry || new Date(expiryISO) > new Date(c.membershipExpiry)) {
                    c.membershipExpiry = expiryISO;
                }
            }

            if (new Date(tx.date) > new Date(c.lastVisitDate)) {
                c.lastVisitDate = tx.date;
                if (tx.customerPhone) c.phone = tx.customerPhone;
                if (tx.customerNotes) c.notes = tx.customerNotes;
            }
            if (new Date(tx.date) < new Date(c.firstVisitDate)) c.firstVisitDate = tx.date;
        });

        return Object.values(customers).map(c => {
            const staffCounts: Record<string, number> = {};
            const serviceCounts: Record<string, number> = {};

            c.history.forEach(tx => {
                tx.items.forEach(item => {
                    if (item.staffName) staffCounts[item.staffName] = (staffCounts[item.staffName] || 0) + 1;
                    serviceCounts[item.nameKey] = (serviceCounts[item.nameKey] || 0) + 1;
                });
            });

            const sortedStaff = Object.entries(staffCounts).sort((a,b) => b[1] - a[1]);
            c.favoriteStaff = sortedStaff.length > 0 ? sortedStaff[0][0] : "Various";

            const sortedServices = Object.entries(serviceCounts).sort((a,b) => b[1] - a[1]);
            c.favoriteService = sortedServices.length > 0 ? sortedServices[0][0] : "Various";

            const daysSinceLastVisit = (new Date().getTime() - new Date(c.lastVisitDate).getTime()) / (1000 * 3600 * 24);
            
            // XÁC ĐỊNH VIP TRÊN MỌI THIẾT BỊ DỰA VÀO EXPIRY VỪA TÍNH
            const isVipActive = c.membershipExpiry && new Date(c.membershipExpiry) > new Date();
            
            if (isVipActive) c.status = 'vip';
            else if (daysSinceLastVisit > 90) c.status = 'lost';
            else if (c.visitCount > 1) c.status = 'regular';
            else c.status = 'new';

            c.history.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return c;
        });
    }, [transactions, t.serviceNames]);

    const filteredCustomers = useMemo(() => {
        return customerList.filter(c => {
            const searchLower = searchTerm.toLowerCase();
            const matchName = c.name.toLowerCase().includes(searchLower) || c.phone.includes(searchLower);
            if (!matchName) return false;

            if (filterStaffId !== "all") {
                const staff = staffList.find(s => s.id === filterStaffId);
                const staffName = staff ? staff.name : "";
                const usedStaff = c.history.some(tx => 
                    tx.items.some(i => i.staffId === filterStaffId || i.staffName === staffName)
                );
                if (!usedStaff) return false;
            }

            if (filterService) {
                const usedService = c.history.some(tx => 
                    tx.items.some(i => (i.displayName || i.nameKey).toLowerCase().includes(filterService.toLowerCase()))
                );
                if (!usedService) return false;
            }

            if (filterStartDate && filterEndDate) {
                const visitedInRange = c.history.some(tx => {
                    const d = tx.date.split('T')[0];
                    return d >= filterStartDate && d <= filterEndDate;
                });
                if (!visitedInRange) return false;
            }
            return true;
        }).sort((a,b) => new Date(b.lastVisitDate).getTime() - new Date(a.lastVisitDate).getTime());
    }, [customerList, searchTerm, filterStaffId, filterService, filterStartDate, filterEndDate, staffList]);

    const formatDate = (iso: string) => {
        return new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const handleStartEdit = (customer: CustomerSummary) => {
        setTempName(customer.name);
        setTempPhone(customer.phone);
        setTempNotes(customer.notes);
        setIsEditMode(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedCustomer) return;
        if (!tempName.trim()) { alert("Name is required"); return; }
        
        setIsUpdating(true);
        try {
            // Update all historical transactions for this customer to maintain global consistency
            const updates = selectedCustomer.history.map(tx => {
                const updatedTx: Transaction = {
                    ...tx,
                    customerName: tempName.trim(),
                    customerPhone: tempPhone.trim(),
                    customerNotes: tempNotes.trim(),
                    lastUpdated: Date.now()
                };
                return updateTransactionInFirebase(updatedTx);
            });

            await Promise.all(updates);
            
            setIsEditMode(false);
            // Detail view will auto-update via Firebase subscription in parent AdminView
            // but we need to close or reset local summary view
            const updatedSummary = { ...selectedCustomer, name: tempName, phone: tempPhone, notes: tempNotes };
            setSelectedCustomer(updatedSummary);
            alert("Customer information updated successfully!");
        } catch (e) {
            console.error("Update failed", e);
            alert("Failed to update some records. Please check connection.");
        } finally {
            setIsUpdating(false);
        }
    };

    const createLegacyTransaction = (name: string, phone: string, spent: number): Transaction => {
        return {
            id: `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            date: new Date().toISOString(), 
            customerName: name,
            customerPhone: phone,
            customerNotes: "Imported / Legacy Data",
            total: spent,
            discountPercentage: 0,
            items: [{
                nameKey: 'legacy_import',
                displayName: 'Historical Data Import',
                price: spent,
                quantity: 1,
                staffName: 'System'
            }],
            lastUpdated: Date.now()
        };
    };

    const handleManualSubmit = async () => {
        if (!manualName.trim()) { alert("Name is required"); return; }
        setIsImporting(true);
        const spent = parseFloat(manualSpent) || 0;
        const tx = createLegacyTransaction(manualName, manualPhone, spent);
        const result = await saveTransactionToFirebase(tx);
        setIsImporting(false);
        if (result.success) {
            setShowManualAdd(false);
            setManualName(""); setManualPhone(""); setManualSpent("");
            alert("Customer added successfully!");
        } else alert("Error adding customer. Check connection.");
    };

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        setImportProgress(0);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n');
            const totalLines = lines.length;
            let successCount = 0;
            const startIndex = lines[0].toLowerCase().includes('name') ? 1 : 0;
            for (let i = startIndex; i < totalLines; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
                if (parts.length < 1) continue;
                const name = parts[0];
                const phone = parts[1] || "";
                const spent = parseFloat(parts[2]) || 0;
                if (name) {
                    const tx = createLegacyTransaction(name, phone, spent);
                    await saveTransactionToFirebase(tx);
                    successCount++;
                }
                setImportProgress(Math.round(((i + 1) / totalLines) * 100));
                if (i % 50 === 0) await new Promise(r => setTimeout(r, 10));
            }
            setIsImporting(false);
            setImportProgress(0);
            alert(`Import Complete! Processed ${successCount} customers.`);
            if (fileInputRef.current) fileInputRef.current.value = "";
        };
        reader.readAsText(file);
    };

    const handleDownloadTemplate = () => {
        const csvContent = "data:text/csv;charset=utf-8,Name,Phone,TotalSpent\nJohn Doe,0412345678,150\nJane Smith,0498765432,300";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "customer_import_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <input type="text" placeholder="Search Customer Name or Phone..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-gold-leaf outline-none transition-all" />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowManualAdd(true)} className="bg-gold-leaf hover:bg-charcoal text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center gap-2 whitespace-nowrap"><PlusIcon className="w-4 h-4" /> Add Customer</button>
                        <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-white border border-gray-300 text-charcoal hover:border-gold-leaf px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 whitespace-nowrap">{isImporting ? `Importing ${importProgress}%...` : <><UploadIcon className="w-4 h-4" /> Import CSV</>}</button>
                        <input type="file" ref={fileInputRef} onChange={handleCSVUpload} accept=".csv" className="hidden" />
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 pt-2 border-t border-gray-100">
                    <div className="md:w-48 relative">
                        <select value={filterStaffId} onChange={(e) => setFilterStaffId(e.target.value)} className="w-full appearance-none pl-8 pr-8 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-charcoal focus:ring-1 focus:ring-gold-leaf outline-none"><option value="all">All Staff</option>{staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                        <UserIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                    <div className="flex items-center gap-2 flex-grow">
                        <span className="text-xs font-bold text-gray-400 uppercase">Last Visit:</span>
                        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-gold-leaf" />
                        <span className="text-gray-400">-</span>
                        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-gold-leaf" />
                        {(filterStartDate || filterEndDate || filterStaffId !== 'all' || filterService) && (<button onClick={() => { setFilterStartDate(""); setFilterEndDate(""); setFilterStaffId("all"); setFilterService(""); setSearchTerm(""); }} className="ml-auto text-xs text-red-500 font-bold hover:underline">Clear</button>)}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-200">
                            <tr>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Last Visit</th>
                                <th className="p-4">Favorite Staff</th>
                                <th className="p-4 text-right">Total Spent</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCustomers.length === 0 ? (<tr><td colSpan={6} className="p-10 text-center text-gray-400 italic">No customers match your filters.</td></tr>) : (
                                filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                                        <td className="p-4"><p className="font-bold text-charcoal text-base">{customer.name}</p><p className="text-xs text-gray-400">{customer.phone}</p></td>
                                        <td className="p-4">
                                            {customer.status === 'vip' && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold border border-purple-200">VIP</span>}
                                            {customer.status === 'lost' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">Lost</span>}
                                            {customer.status === 'regular' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">Regular</span>}
                                            {customer.status === 'new' && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">New</span>}
                                        </td>
                                        <td className="p-4"><p className="text-sm text-charcoal">{formatDate(customer.lastVisitDate)}</p><p className="text-xs text-gray-400">{customer.visitCount} visits total</p></td>
                                        <td className="p-4 text-sm text-charcoal">{customer.favoriteStaff}</td>
                                        <td className="p-4 text-right font-bold text-gold-leaf">${customer.totalSpent.toFixed(2)}</td>
                                        <td className="p-4 text-center"><button className="p-2 text-gray-300 hover:text-charcoal transition-colors"><EyeIcon className="w-5 h-5" /></button></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-pearl-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-white p-6 border-b border-gray-100 flex justify-between items-start">
                            <div className="flex-1">
                                {isEditMode ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                                            <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} className="w-full text-xl font-serif font-bold text-charcoal border-b-2 border-gold-leaf outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
                                            <input type="text" value={tempPhone} onChange={e => setTempPhone(e.target.value)} className="w-full text-sm text-gray-500 border-b border-gray-200 outline-none" />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-2xl font-serif font-bold text-charcoal flex items-center gap-2">
                                            {selectedCustomer.status === 'vip' && <StarIcon className="w-6 h-6 text-gold-leaf" filled />}
                                            {selectedCustomer.name}
                                            <button onClick={() => handleStartEdit(selectedCustomer)} className="ml-2 p-1 text-gray-300 hover:text-gold-leaf transition-colors"><PencilIcon className="w-4 h-4" /></button>
                                        </h3>
                                        <p className="text-gray-500 text-sm mt-1">{selectedCustomer.phone}</p>
                                    </>
                                )}
                                {selectedCustomer.membershipExpiry && (
                                    <p className="text-xs font-bold text-gold-leaf mt-1">Hội viên đến: {formatDate(selectedCustomer.membershipExpiry)}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {isEditMode ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditMode(false)} className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold">Cancel</button>
                                        <button onClick={handleSaveEdit} disabled={isUpdating} className="px-4 py-1.5 bg-gold-leaf text-white rounded-lg text-sm font-bold shadow-sm">{isUpdating ? "Saving..." : "Save"}</button>
                                    </div>
                                ) : (
                                    <button onClick={() => { setIsEditMode(false); setSelectedCustomer(null); }} className="text-gray-400 hover:text-charcoal bg-gray-100 p-1.5 rounded-full"><XMarkIcon className="w-6 h-6" /></button>
                                )}
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center"><p className="text-xs text-gray-400 font-bold uppercase mb-1">Total Spent</p><p className="text-xl font-bold text-gold-leaf">${selectedCustomer.totalSpent.toFixed(2)}</p></div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center"><p className="text-xs text-gray-400 font-bold uppercase mb-1">Visits</p><p className="text-xl font-bold text-charcoal">{selectedCustomer.visitCount}</p></div>
                                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center"><p className="text-xs text-gray-400 font-bold uppercase mb-1">Fav Staff</p><p className="text-lg font-bold text-charcoal truncate px-2">{selectedCustomer.favoriteStaff}</p></div>
                            </div>
                            
                            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold text-yellow-800 flex items-center gap-2"><BriefcaseIcon className="w-4 h-4" /> Customer Notes</h4>
                                    {!isEditMode && <button onClick={() => handleStartEdit(selectedCustomer)} className="text-xs text-yellow-600 font-bold underline">Edit Notes</button>}
                                </div>
                                {isEditMode ? (
                                    <textarea value={tempNotes} onChange={e => setTempNotes(e.target.value)} className="w-full bg-white border border-yellow-200 rounded-lg p-2 text-sm text-yellow-900 outline-none focus:ring-1 focus:ring-gold-leaf" rows={3} placeholder="Customer preferences, allergies, etc..." />
                                ) : (
                                    <p className="text-sm text-yellow-900 italic">{selectedCustomer.notes || "No specific notes available for this customer."}</p>
                                )}
                            </div>

                            <h4 className="font-bold text-charcoal mb-4 flex items-center gap-2"><ClockIcon className="w-5 h-5 text-gray-400" /> Recent History</h4>
                            <div className="space-y-3">
                                {selectedCustomer.history.map(tx => (
                                    <div key={tx.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:border-gold-leaf transition-colors">
                                        <div className="flex justify-between items-start mb-2"><span className="text-sm font-bold text-charcoal">{formatDate(tx.date)}</span><span className="text-sm font-bold text-green-600">${tx.total.toFixed(2)}</span></div>
                                        <div className="text-xs text-gray-500 space-y-1">{tx.items.map((item, i) => (<div key={i} className="flex justify-between"><span>• {item.displayName || t.serviceNames[item.nameKey] || item.nameKey}</span><span className="italic">{item.staffName}</span></div>))}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {!isEditMode && (
                            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center"><button onClick={() => setSelectedCustomer(null)} className="text-gray-500 hover:text-charcoal font-bold text-sm">Close Details</button></div>
                        )}
                    </div>
                </div>
            )}

            {showManualAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-charcoal">Add Customer</h3><button onClick={() => setShowManualAdd(false)} className="text-gray-400 hover:text-charcoal"><XMarkIcon className="w-6 h-6" /></button></div>
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Customer Name</label><input type="text" value={manualName} onChange={e => setManualName(e.target.value)} className="w-full p-2 border rounded-lg" autoFocus /></div>
                            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Phone Number</label><input type="text" value={manualPhone} onChange={e => setManualPhone(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="04..." /></div>
                            <div><label className="block text-xs font-bold text-gray-400 uppercase mb-1">Estimated Total Spent ($)</label><input type="number" value={manualSpent} onChange={e => setManualSpent(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="0" /></div>
                            <div className="pt-2"><button onClick={handleManualSubmit} disabled={isImporting} className="w-full bg-gold-leaf text-white font-bold py-3 rounded-xl hover:bg-charcoal transition-colors disabled:opacity-50">{isImporting ? "Saving..." : "Create Customer Record"}</button></div>
                            <div className="border-t border-gray-100 pt-4 mt-2">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Or Import Bulk Data</p>
                                <div className="flex gap-2">
                                    <button onClick={handleDownloadTemplate} className="flex-1 text-xs border border-gray-300 py-2 rounded-lg text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-1"><DownloadIcon className="w-3 h-3"/> Template</button>
                                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 text-xs bg-gray-100 py-2 rounded-lg text-charcoal font-bold hover:bg-gray-200 flex items-center justify-center gap-1"><UploadIcon className="w-3 h-3"/> Select CSV</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};