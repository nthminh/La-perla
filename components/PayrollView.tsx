
import React, { useState, useMemo } from 'react';
import { Translation } from '../translations';
import { Transaction, StaffProfile, GlobalPayrollSettings, PayrollSummary } from '../types';
import { DownloadIcon, XMarkIcon, ChevronDownIcon, UserIcon } from './Icons';

// Month names for display
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];

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

// Get Thursday of current week (Australian payroll week starts Thursday)
const getThursdayOfWeek = (date: Date): Date => {
    const day = date.getDay(); // 0 = Sunday, 4 = Thursday
    const diff = day >= 4 ? day - 4 : day + 3; // Days since last Thursday
    const thursday = new Date(date);
    thursday.setDate(date.getDate() - diff);
    thursday.setHours(0, 0, 0, 0);
    return thursday;
};

// Get week ranges for a year (Thursday to Wednesday)
const getWeekRanges = (year: number) => {
    const weeks: Array<{ start: string; end: string; label: string; weekNumber: number }> = [];
    
    // Start from first Thursday of the year
    let currentDate = new Date(year, 0, 1);
    let firstThursday = getThursdayOfWeek(currentDate);
    
    // If first Thursday is in previous year, start from next Thursday
    if (firstThursday.getFullYear() < year) {
        firstThursday = new Date(firstThursday);
        firstThursday.setDate(firstThursday.getDate() + 7);
    }
    
    let weekNum = 1;
    let thursday = new Date(firstThursday);
    
    // Generate weeks until we reach next year
    while (thursday.getFullYear() === year) {
        const wednesday = new Date(thursday);
        wednesday.setDate(wednesday.getDate() + 6); // Thursday + 6 days = Wednesday
        
        const startStr = thursday.toISOString().split('T')[0];
        const endStr = wednesday.toISOString().split('T')[0];
        
        // Format label: "Week 1: Dec 28 - Jan 3"
        const startMonth = thursday.toLocaleDateString('en-US', { month: 'short', timeZone: 'Australia/Sydney' });
        const startDay = thursday.getDate();
        const endMonth = wednesday.toLocaleDateString('en-US', { month: 'short', timeZone: 'Australia/Sydney' });
        const endDay = wednesday.getDate();
        
        const label = `Week ${weekNum}: ${startMonth} ${startDay} - ${endMonth} ${endDay}`;
        
        weeks.push({
            start: startStr,
            end: endStr,
            label,
            weekNumber: weekNum
        });
        
        // Move to next Thursday
        thursday = new Date(thursday);
        thursday.setDate(thursday.getDate() + 7);
        weekNum++;
    }
    
    return weeks;
};

// Get current week (Thursday to Wednesday)
const getCurrentWeekIndex = (weeks: Array<{ start: string; end: string }>) => {
    const today = new Date().toISOString().split('T')[0];
    const idx = weeks.findIndex(w => today >= w.start && today <= w.end);
    return idx >= 0 ? idx : weeks.length - 1;
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
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    
    const weekRanges = useMemo(() => getWeekRanges(selectedYear), [selectedYear]);
    const currentWeekIdx = useMemo(() => getCurrentWeekIndex(weekRanges), [weekRanges]);
    
    const [selectedWeekIndex, setSelectedWeekIndex] = useState(currentWeekIdx);
    const [detailStaffId, setDetailStaffId] = useState<string | null>(null);
    
    // State for adjustments (temporary, not saved to database in Phase 1)
    const [adjustments, setAdjustments] = useState<Record<string, { amount: number; note: string }>>({});

    // Period type: 'week', 'month', or 'custom'
    const [periodType, setPeriodType] = useState<'week' | 'month' | 'custom'>('week');
    
    // Month selection (1-12)
    const currentMonth = new Date().getMonth() + 1;
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    
    // Custom date range
    const today = new Date().toISOString().split('T')[0];
    const [customStartDate, setCustomStartDate] = useState(today);
    const [customEndDate, setCustomEndDate] = useState(today);

    const selectedWeek = weekRanges[selectedWeekIndex] || weekRanges[0];

    // Get the date range based on period type
    const getDateRange = useMemo(() => {
        if (periodType === 'week') {
            return {
                start: selectedWeek?.start || '',
                end: selectedWeek?.end || '',
                label: selectedWeek?.label || '',
                weekNumber: selectedWeek?.weekNumber || 0
            };
        } else if (periodType === 'month') {
            // Calculate first and last day of selected month
            const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
            const lastDay = new Date(selectedYear, selectedMonth, 0);
            const start = firstDay.toISOString().split('T')[0];
            const end = lastDay.toISOString().split('T')[0];
            const label = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
            return { start, end, label, weekNumber: undefined };
        } else { // custom
            // Validate that end date is not before start date
            const isValid = customEndDate >= customStartDate;
            return {
                start: customStartDate,
                end: isValid ? customEndDate : customStartDate,
                label: `${customStartDate} to ${isValid ? customEndDate : customStartDate}`,
                weekNumber: undefined
            };
        }
    }, [periodType, selectedWeek, selectedYear, selectedMonth, customStartDate, customEndDate]);

    // Calculate payroll for all staff for the selected period
    const payrollData = useMemo(() => {
        if (!getDateRange.start || !getDateRange.end) return [];
        
        const summaries: PayrollSummary[] = [];
        
        // Filter transactions for selected period
        const periodTransactions = transactions.filter(tx => {
            const txDate = getSydneyDateStr(tx.date);
            return txDate >= getDateRange.start && txDate <= getDateRange.end;
        });

        // Calculate for each staff member
        staffList.forEach(staff => {
            // Track days worked and revenue
            const dailyRevenue: Record<string, number> = {};
            
            periodTransactions.forEach(tx => {
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
                    const tx = periodTransactions.find(t => getSydneyDateStr(t.date) === dateStr);
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
                weekStartDate: getDateRange.start,
                weekEndDate: getDateRange.end,
                weekNumber: getDateRange.weekNumber || 0,
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
    }, [staffList, transactions, getDateRange, selectedWeek, selectedYear, globalPayroll, adjustments]);

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
            "Staff",
            "Days Worked",
            "Revenue",
            "Base Salary",
            "Bonus",
            "Adjustment",
            "Total",
            "Period Type",
            "Period"
        ];
        
        const getPeriodTypeLabel = () => {
            if (periodType === 'week') return 'Week';
            if (periodType === 'month') return 'Month';
            return 'Custom Range';
        };
        
        const rows = payrollData.map(p => [
            p.staffName,
            p.daysWorked,
            p.totalRevenue.toFixed(2),
            p.baseSalaryTotal.toFixed(2),
            p.bonusTotal.toFixed(2),
            p.adjustment.toFixed(2),
            p.finalTotal.toFixed(2),
            getPeriodTypeLabel(),
            getDateRange.label
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const filename = periodType === 'week' 
            ? `payroll_week${getDateRange.weekNumber}_${selectedYear}.csv`
            : periodType === 'month'
            ? `payroll_month${selectedMonth}_${selectedYear}.csv`
            : `payroll_${customStartDate}_to_${customEndDate}.csv`;
        link.setAttribute("download", filename);
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
        
        const periodLabel = periodType === 'week' 
            ? `Week ${summary.weekNumber}, ${summary.year}`
            : periodType === 'month'
            ? getDateRange.label
            : getDateRange.label; // Show the full date range for custom periods
        
        printWindow.document.write(`
            <html>
            <head>
                <title>Payslip - ${summary.staffName}</title>
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
                    <p>Payslip</p>
                    <p>${periodLabel}</p>
                    <p>${summary.weekStartDate} to ${summary.weekEndDate}</p>
                </div>
                
                <div class="section">
                    <h2>Staff Details</h2>
                    <div class="row">
                        <span class="label">Staff Name:</span>
                        <span class="value">${summary.staffName}</span>
                    </div>
                    <div class="row">
                        <span class="label">Days Worked:</span>
                        <span class="value">${summary.daysWorked} days</span>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Revenue & Bonus</h2>
                    <div class="row">
                        <span class="label">Total Revenue:</span>
                        <span class="value">$${summary.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div class="row">
                        <span class="label">Daily Target:</span>
                        <span class="value">$${globalPayroll.defaultTarget || 0}/day</span>
                    </div>
                    <div class="row">
                        <span class="label">Bonus Rate:</span>
                        <span class="value">${staff.payroll?.bonusRate || 0}%</span>
                    </div>
                    <div class="row">
                        <span class="label">Bonus Earned:</span>
                        <span class="value">$${summary.bonusTotal.toFixed(2)}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h2>Total Calculation</h2>
                    <div class="row">
                        <span class="label">Base Salary ($${staff.payroll?.baseSalary || 0}/day × ${summary.daysWorked}):</span>
                        <span class="value">$${summary.baseSalaryTotal.toFixed(2)}</span>
                    </div>
                    <div class="row">
                        <span class="label">Bonus:</span>
                        <span class="value">$${summary.bonusTotal.toFixed(2)}</span>
                    </div>
                    ${summary.adjustment !== 0 ? `
                    <div class="row">
                        <span class="label">Adjustment:</span>
                        <span class="value" style="color: ${summary.adjustment > 0 ? '#27AE60' : '#E74C3C'}">
                            ${summary.adjustment > 0 ? '+' : ''}$${summary.adjustment.toFixed(2)}
                        </span>
                    </div>
                    ${summary.adjustmentNote ? `<div class="row"><span class="label">Note:</span><span class="value">${summary.adjustmentNote}</span></div>` : ''}
                    ` : ''}
                    <div class="row total">
                        <span class="label">TOTAL WEEKLY SALARY:</span>
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

    const detailStaff = detailStaffId ? payrollData.find(p => p.staffId === detailStaffId) : null;

    return (
        <div className="min-h-screen bg-pearl-white">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-6 py-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-serif font-bold text-charcoal flex items-center gap-2">
                            💰 Payroll Calculator
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Calculate and manage staff salaries by week, month, or custom period</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-charcoal hover:bg-gray-50 transition-colors"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Period Type & Date Selector */}
            <div className="px-6 py-4 bg-white border-b border-gray-100">
                <div className="flex items-center gap-4 flex-wrap">
                    {/* Period Type Selector */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-gray-500 uppercase">Calculate By:</label>
                        <div className="relative">
                            <select
                                value={periodType}
                                onChange={(e) => setPeriodType(e.target.value as 'week' | 'month' | 'custom')}
                                className="appearance-none bg-white pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm font-bold text-charcoal focus:outline-none focus:border-gold-leaf shadow-sm cursor-pointer"
                            >
                                <option value="week">Week</option>
                                <option value="month">Month</option>
                                <option value="custom">Custom Range</option>
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Week Selector - only shown when periodType is 'week' */}
                    {periodType === 'week' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-gray-500 uppercase">Week:</label>
                            <div className="relative">
                                <select
                                    value={selectedWeekIndex}
                                    onChange={(e) => setSelectedWeekIndex(parseInt(e.target.value))}
                                    className="appearance-none bg-white pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm font-bold text-charcoal focus:outline-none focus:border-gold-leaf shadow-sm cursor-pointer"
                                >
                                    {weekRanges.map((week, idx) => (
                                        <option key={idx} value={idx}>
                                            {week.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {/* Month Selector - only shown when periodType is 'month' */}
                    {periodType === 'month' && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-gray-500 uppercase">Month:</label>
                            <div className="relative">
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="appearance-none bg-white pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm font-bold text-charcoal focus:outline-none focus:border-gold-leaf shadow-sm cursor-pointer"
                                >
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </select>
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    )}

                    {/* Custom Date Range - only shown when periodType is 'custom' */}
                    {periodType === 'custom' && (
                        <>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-bold text-gray-500 uppercase">From:</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    max={today}
                                    required
                                    className="bg-white pl-3 pr-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-charcoal focus:outline-none focus:border-gold-leaf shadow-sm"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-bold text-gray-500 uppercase">To:</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    min={customStartDate}
                                    max={today}
                                    required
                                    className="bg-white pl-3 pr-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-charcoal focus:outline-none focus:border-gold-leaf shadow-sm"
                                />
                            </div>
                        </>
                    )}
                    
                    {/* Year Selector - shown for week and month */}
                    {(periodType === 'week' || periodType === 'month') && (
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-bold text-gray-500 uppercase">Year:</label>
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
                    )}

                    <div className="ml-auto flex items-center gap-2 border-l border-gray-200 pl-4">
                        <span className="text-xs font-bold text-gray-400 uppercase">Total Payroll Cost:</span>
                        <span className="text-2xl font-bold text-gold-leaf">${totalPayrollCost.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Payroll Summary Table */}
            <div className="p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {payrollData.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-400 italic">No payroll data available for this period</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Staff</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Days Worked</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Revenue</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Base Salary</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Bonus</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Adjustment</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total</th>
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
                                                        👁️ View Details
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
                                    💼 {detailStaff.staffName} - Weekly Payroll Detail
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Week {detailStaff.weekNumber}, {detailStaff.year} ({detailStaff.weekStartDate} to {detailStaff.weekEndDate})
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
                                                Base Salary (${staffList.find(s => s.id === detailStaff.staffId)?.payroll?.baseSalary || 0}/day × {detailStaff.daysWorked})
                                            </span>
                                            <span className="font-bold text-charcoal">${detailStaff.baseSalaryTotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                            <span className="text-gray-600">
                                                Bonus ({staffList.find(s => s.id === detailStaff.staffId)?.payroll?.bonusRate || 0}% on revenue above target)
                                            </span>
                                            <span className="font-bold text-purple-600">${detailStaff.bonusTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Adjustment */}
                                <div className="bg-blue-50 p-4 rounded-xl">
                                    <h4 className="font-bold text-sm text-gray-500 uppercase mb-3">Adjustment</h4>
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
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Note</label>
                                            <textarea
                                                value={adjustments[detailStaff.staffId]?.note || ''}
                                                onChange={(e) => handleNoteChange(detailStaff.staffId, e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-charcoal focus:border-gold-leaf outline-none"
                                                rows={2}
                                                placeholder="e.g., Performance bonus, deduction reason..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Final Total */}
                                <div className="bg-gold-leaf/10 p-4 rounded-xl border-2 border-gold-leaf">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-charcoal">Total Weekly Salary</span>
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
                                🖨️ Print Payslip
                            </button>
                            <button
                                onClick={() => setDetailStaffId(null)}
                                className="px-6 py-3 bg-gray-200 text-charcoal font-bold rounded-xl hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};