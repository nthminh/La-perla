
import React, { useState, useMemo } from 'react';
import { Translation } from '../translations';
import { Transaction, StaffProfile, GlobalPayrollSettings, PayrollSummary } from '../types';
import { DownloadIcon, XMarkIcon, ChevronDownIcon, UserIcon } from './Icons';

// Sydney timezone helper (same as AdminView)
const getSydneyDateStr = (isoDate: string) => {
    try {
        return new Date(isoDate).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    } catch (e) {
        return isoDate.split('T')[0]; 
    }
};

const getSydneyDayName = (isoDate: string) => {
    try {
        return new Date(isoDate).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'long' });
    } catch (e) {
        return "";
    }
};

interface PayrollViewProps {
    t: Translation;
    staffList: StaffProfile[];
    transactions: Transaction[];
    globalPayroll: GlobalPayrollSettings;
}

export const PayrollView: React.FC<PayrollViewProps> = ({ 
    t, staffList, transactions, globalPayroll 
}) => {
    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [detailStaffId, setDetailStaffId] = useState<string | null>(null);
    
    // State for adjustments (temporary, not saved to database in Phase 1)
    const [adjustments, setAdjustments] = useState<Record<string, { amount: number; note: string }>>({});

    // Calculate payroll for all staff for the selected month
    const payrollData = useMemo(() => {
        const summaries: PayrollSummary[] = [];
        
        // Filter transactions for selected month/year
        const monthTransactions = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            const txMonth = txDate.getMonth() + 1;
            const txYear = txDate.getFullYear();
            return txMonth === selectedMonth && txYear === selectedYear;
        });

        // Calculate for each staff member
        staffList.forEach(staff => {
            // Track days worked and revenue
            const dailyRevenue: Record<string, number> = {};
            
            monthTransactions.forEach(tx => {
                const dateStr = getSydneyDateStr(tx.date);
                const dayOfWeek = getSydneyDayName(tx.date);
                
                tx.items.forEach(item => {
                    // Check if this item belongs to this staff
                    const isStaffItem = item.staffId === staff.id || item.staffName === staff.name;
                    if (!isStaffItem) return;
                    
                    // Calculate revenue for this item
                    const itemRevenue = item.price * item.quantity;
                    const discountFactor = tx.discountPercentage ? (1 - tx.discountPercentage / 100) : 1;
                    const netRevenue = itemRevenue * discountFactor;
                    
                    // Add to daily revenue
                    if (!dailyRevenue[dateStr]) {
                        dailyRevenue[dateStr] = 0;
                    }
                    dailyRevenue[dateStr] += netRevenue;
                });
            });

            // Count days worked
            const daysWorked = Object.keys(dailyRevenue).length;
            
            // Calculate total revenue
            const totalRevenue = Object.values(dailyRevenue).reduce((sum, rev) => sum + rev, 0);
            
            // Calculate base salary
            const baseSalaryPerDay = staff.payroll?.baseSalary || 0;
            const baseSalaryTotal = baseSalaryPerDay * daysWorked;
            
            // Calculate bonus
            let bonusTotal = 0;
            if (staff.payroll?.enabled) {
                Object.entries(dailyRevenue).forEach(([dateStr, dailyRev]) => {
                    // Find the transaction to get day of week
                    const tx = monthTransactions.find(t => getSydneyDateStr(t.date) === dateStr);
                    if (!tx) return;
                    
                    const dayOfWeek = getSydneyDayName(tx.date);
                    const dailyTarget = globalPayroll.customTargets?.[dayOfWeek] ?? globalPayroll.defaultTarget ?? 0;
                    
                    if (dailyRev > dailyTarget) {
                        const bonusRate = staff.payroll?.bonusRate || 0;
                        const dailyBonus = (dailyRev - dailyTarget) * (bonusRate / 100);
                        bonusTotal += dailyBonus;
                    }
                });
            }
            
            // Get adjustment
            const adjustment = adjustments[staff.id] || { amount: 0, note: '' };
            
            // Calculate final total
            const finalTotal = baseSalaryTotal + bonusTotal + adjustment.amount;
            
            summaries.push({
                staffId: staff.id,
                staffName: staff.name,
                month: selectedMonth,
                year: selectedYear,
                daysWorked,
                totalRevenue,
                baseSalaryTotal,
                bonusTotal,
                adjustment: adjustment.amount,
                adjustmentNote: adjustment.note,
                finalTotal,
            });
        });
        
        return summaries.sort((a, b) => b.finalTotal - a.finalTotal);
    }, [staffList, transactions, selectedMonth, selectedYear, globalPayroll, adjustments]);

    // Calculate total payroll cost
    const totalPayrollCost = payrollData.reduce((sum, p) => sum + p.finalTotal, 0);

    // Handle adjustment change
    const handleAdjustmentChange = (staffId: string, amount: string) => {
        const numAmount = parseFloat(amount) || 0;
        setAdjustments(prev => ({
            ...prev,
            [staffId]: { amount: numAmount, note: prev[staffId]?.note || '' }
        }));
    };

    const handleNoteChange = (staffId: string, note: string) => {
        setAdjustments(prev => ({
            ...prev,
            [staffId]: { amount: prev[staffId]?.amount || 0, note }
        }));
    };

    // Export to CSV
    const handleExportCSV = () => {
        const headers = [
            t.payrollStaff,
            t.payrollDaysWorked,
            t.payrollRevenue,
            t.payrollBaseSalary,
            t.payrollBonus,
            t.payrollAdjustment,
            t.payrollTotal
        ];
        
        const rows = payrollData.map(p => [
            p.staffName,
            p.daysWorked,
            p.totalRevenue.toFixed(2),
            p.baseSalaryTotal.toFixed(2),
            p.bonusTotal.toFixed(2),
            p.adjustment.toFixed(2),
            p.finalTotal.toFixed(2)
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `payroll_${selectedYear}_${selectedMonth.toString().padStart(2, '0')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Print payslip for individual staff
    const handlePrintPayslip = (summary: PayrollSummary) => {
        const staff = staffList.find(s => s.id === summary.staffId);
        if (!staff) return;
        
        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) return;
        
        printWindow.document.write(`
            <html>
            <head>
                <title>${t.payrollPrintPayslip} - ${summary.staffName}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #D4AF37; padding-bottom: 20px; }
                    .header h1 { color: #2C3E50; margin: 0; }
                    .header p { color: #7F8C8D; margin: 5px 0; }
                    .section { margin: 20px 0; }
                    .section h2 { color: #D4AF37; font-size: 16px; border-bottom: 1px solid #ECF0F1; padding-bottom: 5px; }
                    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ECF0F1; }
                    .row.total { font-weight: bold; font-size: 18px; color: #27AE60; border-top: 2px solid #D4AF37; margin-top: 10px; }
                    .label { color: #7F8C8D; }
                    .value { font-weight: bold; color: #2C3E50; }
                    .footer { margin-top: 40px; text-align: center; color: #95A5A6; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>💎 La Perla Nails & Beauty</h1>
                    <p>${t.payrollPrintPayslip}</p>
                    <p>${t.payrollMonth}: ${selectedMonth}/${selectedYear}</p>
                </div>
                
                <div class="section">
                    <h2>${t.payrollStaff} ${t.payrollDetailTitle}</h2>
                    <div class="row">
                        <span class="label">${t.payrollStaff}:</span>
                        <span class="value">${summary.staffName}</span>
                    </div>
                    <div class="row">
                        <span class="label">${t.payrollDaysWorked}:</span>
                        <span class="value">${summary.daysWorked} days</span>
                    </div>
                </div>
                
                <div class="section">
                    <h2>${t.payrollRevenue} & ${t.payrollBonus}</h2>
                    <div class="row">
                        <span class="label">${t.payrollRevenue}:</span>
                        <span class="value">$${summary.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div class="row">
                        <span class="label">${t.payrollTarget}:</span>
                        <span class="value">${globalPayroll.defaultTarget || 0}/day</span>
                    </div>
                    <div class="row">
                        <span class="label">${t.payrollBonusRate}:</span>
                        <span class="value">${staff.payroll?.bonusRate || 0}%</span>
                    </div>
                    <div class="row">
                        <span class="label">${t.payrollBonus}:</span>
                        <span class="value">$${summary.bonusTotal.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h2>${t.payrollTotal} Calculation</h2>
                    <div class="row">
                        <span class="label">${t.payrollBaseSalary} (${staff.payroll?.baseSalary || 0}/day × ${summary.daysWorked}):</span>
                        <span class="value">$${summary.baseSalaryTotal.toFixed(2)}</span>
                    </div>
                    <div class="row">
                        <span class="label">${t.payrollBonus}:</span>
                        <span class="value">$${summary.bonusTotal.toFixed(2)}</span>
                    </div>
                    ${summary.adjustment !== 0 ? `
                    <div class="row">
                        <span class="label">${t.payrollAdjustment}:</span>
                        <span class="value ${summary.adjustment > 0 ? 'text-green-600' : 'text-red-600'}">
                            ${summary.adjustment > 0 ? '+' : ''}$${summary.adjustment.toFixed(2)}
                        </span>
                    </div>
                    ${summary.adjustmentNote ? `<div class="row"><span class="label">Note:</span><span class="value">${summary.adjustmentNote}</span></div>` : ''}
                    ` : ''}
                    <div class="row total">
                        <span class="label">${t.payrollFinalTotal}:</span>
                        <span class="value">$${summary.finalTotal.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <p>La Perla Nails & Beauty</p>
                    <p>Shop 10/260 Jersey Rd, Plumpton NSW 2761</p>
                    <p>Generated: ${new Date().toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' })}</p>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const detailStaff = detailStaffId ? payrollData.find(p => p.staffId === detailStaffId) : null;

    return (
        <div className="min-h-screen bg-pearl-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-charcoal flex items-center gap-2">
                            💰 {t.payrollTitle}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">{t.payrollSubtitle}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-charcoal hover:bg-gray-50 transition-colors"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            {t.payrollExportCSV}
                        </button>
                    </div>
                </div>
            </div>

            {/* Month/Year Selector */}
            <div className="px-6 py-4 bg-white border-b border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-gray-500 uppercase">{t.payrollMonth}:</label>
                        <div className="relative">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="appearance-none bg-white pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm font-bold text-charcoal focus:outline-none focus:border-gold-leaf shadow-sm cursor-pointer"
                            >
                                {monthNames.map((name, idx) => (
                                    <option key={idx + 1} value={idx + 1}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-gray-500 uppercase">{t.payrollYear}:</label>
                        <div className="relative">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="appearance-none bg-white pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm font-bold text-charcoal focus:outline-none focus:border-gold-leaf shadow-sm cursor-pointer"
                            >
                                {[2023, 2024, 2025, 2026].map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="ml-auto flex items-center gap-2 border-l border-gray-200 pl-4">
                        <span className="text-xs font-bold text-gray-400 uppercase">{t.payrollTotalPayrollCost}:</span>
                        <span className="text-2xl font-bold text-gold-leaf">${totalPayrollCost.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Payroll Summary Table */}
            <div className="p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {payrollData.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-400 italic">{t.payrollNoData}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">{t.payrollStaff}</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">{t.payrollDaysWorked}</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t.payrollRevenue}</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t.payrollBaseSalary}</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t.payrollBonus}</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">{t.payrollAdjustment}</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">{t.payrollTotal}</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {payrollData.map((summary) => {
                                        const staff = staffList.find(s => s.id === summary.staffId);
                                        return (
                                            <tr key={summary.staffId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                                            {staff?.avatar ? (
                                                                <img src={staff.avatar} className="w-full h-full object-cover" alt={summary.staffName} />
                                                            ) : (
                                                                <UserIcon className="w-5 h-5 text-gray-400 m-2.5" />
                                                            )}
                                                        </div>
                                                        <span className="font-bold text-charcoal">{summary.staffName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-charcoal">{summary.daysWorked}</td>
                                                <td className="px-6 py-4 text-right font-bold text-green-600">${summary.totalRevenue.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-charcoal">${summary.baseSalaryTotal.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right font-bold text-purple-600">${summary.bonusTotal.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={adjustments[summary.staffId]?.amount || 0}
                                                        onChange={(e) => handleAdjustmentChange(summary.staffId, e.target.value)}
                                                        className="w-24 px-2 py-1 text-center border border-gray-200 rounded text-sm font-bold focus:border-gold-leaf outline-none"
                                                        placeholder="0"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right text-xl font-bold text-gold-leaf">${summary.finalTotal.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => setDetailStaffId(summary.staffId)}
                                                        className="text-xs font-bold text-gold-leaf hover:text-charcoal px-3 py-1 rounded-lg hover:bg-gold-leaf/10 transition-colors"
                                                    >
                                                        👁️ {t.payrollViewDetails}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {detailStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-serif font-bold text-xl text-charcoal">
                                    💼 {detailStaff.staffName} - {t.payrollDetailTitle}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    {monthNames[selectedMonth - 1]} {selectedYear}
                                </p>
                            </div>
                            <button
                                onClick={() => setDetailStaffId(null)}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <XMarkIcon className="w-5 h-5 text-gray-400 hover:text-charcoal" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="space-y-6">
                                {/* Work Summary */}
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <h4 className="font-bold text-sm text-gray-500 uppercase mb-3">Work Summary</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-xs text-gray-400">Days Worked</span>
                                            <p className="text-2xl font-bold text-charcoal">{detailStaff.daysWorked}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400">Total Revenue</span>
                                            <p className="text-2xl font-bold text-green-600">${detailStaff.totalRevenue.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Salary Breakdown */}
                                <div>
                                    <h4 className="font-bold text-sm text-gray-500 uppercase mb-3">Salary Breakdown</h4>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                            <span className="text-gray-600">
                                                {t.payrollBaseSalary} ({staffList.find(s => s.id === detailStaff.staffId)?.payroll?.baseSalary || 0}/day × {detailStaff.daysWorked})
                                            </span>
                                            <span className="font-bold text-charcoal">${detailStaff.baseSalaryTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                            <span className="text-gray-600">
                                                {t.payrollBonus} ({staffList.find(s => s.id === detailStaff.staffId)?.payroll?.bonusRate || 0}% on revenue above target)
                                            </span>
                                            <span className="font-bold text-purple-600">${detailStaff.bonusTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Adjustment */}
                                <div className="bg-blue-50 p-4 rounded-xl">
                                    <h4 className="font-bold text-sm text-gray-500 uppercase mb-3">{t.payrollAdjustment}</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Amount ($)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={adjustments[detailStaff.staffId]?.amount || 0}
                                                onChange={(e) => handleAdjustmentChange(detailStaff.staffId, e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg font-bold text-charcoal focus:border-gold-leaf outline-none"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">{t.payrollAdjustmentNote}</label>
                                            <textarea
                                                value={adjustments[detailStaff.staffId]?.note || ''}
                                                onChange={(e) => handleNoteChange(detailStaff.staffId, e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-charcoal focus:border-gold-leaf outline-none"
                                                rows={2}
                                                placeholder={t.payrollAdjustmentPlaceholder}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Final Total */}
                                <div className="bg-gold-leaf/10 p-4 rounded-xl border-2 border-gold-leaf">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-charcoal">{t.payrollFinalTotal}</span>
                                        <span className="text-3xl font-bold text-gold-leaf">${detailStaff.finalTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-gray-50 p-4 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={() => handlePrintPayslip(detailStaff)}
                                className="flex-1 py-3 bg-gold-leaf text-white font-bold rounded-xl hover:bg-charcoal transition-colors shadow-md flex items-center justify-center gap-2"
                            >
                                🖨️ {t.payrollPrintPayslip}
                            </button>
                            <button
                                onClick={() => setDetailStaffId(null)}
                                className="px-6 py-3 bg-gray-200 text-charcoal font-bold rounded-xl hover:bg-gray-300 transition-colors"
                            >
                                {t.payrollClose}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};