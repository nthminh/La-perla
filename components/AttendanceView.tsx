import React, { useState, useEffect, useMemo } from 'react';
import { Translation } from '../translations';
import { AttendanceRecord, StaffProfile } from '../types';
import { 
    subscribeToAttendance, 
    saveAttendanceRecord, 
    deleteAttendanceRecord 
} from '../services/firebaseService';
import { 
    ClockIcon, 
    UserIcon, 
    PlusIcon, 
    XMarkIcon, 
    TrashIcon, 
    ChevronDownIcon,
    PencilIcon
} from './Icons';

// Constants
const STANDARD_WORKING_MINUTES_PER_DAY = 510; // 8.5 hours per day

// Sydney timezone helper
const getSydneyDateStr = (isoDate: string) => {
    try {
        return new Date(isoDate).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    } catch (e) {
        return isoDate.split('T')[0];
    }
};

const getSydneyToday = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
};

interface AttendanceViewProps {
    t: Translation;
    staffList: StaffProfile[];
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({ t, staffList }) => {
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Filter state
    const [startDate, setStartDate] = useState(getSydneyToday());
    const [endDate, setEndDate] = useState(getSydneyToday());
    const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
    
    // Add/Edit modal state
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
    const [modalStaffId, setModalStaffId] = useState('');
    const [modalDate, setModalDate] = useState(getSydneyToday());
    const [modalLateMinutes, setModalLateMinutes] = useState('0');
    const [modalEarlyMinutes, setModalEarlyMinutes] = useState('0');
    const [modalNotes, setModalNotes] = useState('');
    
    // Create staff lookup map for better performance
    const staffMap = useMemo(() => {
        const map = new Map<string, StaffProfile>();
        staffList.forEach(staff => map.set(staff.id, staff));
        return map;
    }, [staffList]);
    
    // Subscribe to attendance records
    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = subscribeToAttendance(
            (records) => {
                setAttendanceRecords(records);
                setIsLoading(false);
            },
            startDate,
            endDate
        );
        
        return () => unsubscribe();
    }, [startDate, endDate]);
    
    // Filter records by selected staff
    const filteredRecords = useMemo(() => {
        if (selectedStaffId === 'all') {
            return attendanceRecords;
        }
        return attendanceRecords.filter(r => r.staffId === selectedStaffId);
    }, [attendanceRecords, selectedStaffId]);
    
    // Format minutes to hours and minutes
    const formatMinutes = (minutes: number): string => {
        if (minutes === 0) return '0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };
    
    // Calculate deduction for a single record
    const calculateRecordDeduction = (record: AttendanceRecord): number => {
        const staff = staffMap.get(record.staffId);
        if (!staff?.payroll?.baseSalary) return 0;
        
        const perMinuteRate = staff.payroll.baseSalary / STANDARD_WORKING_MINUTES_PER_DAY;
        const totalMinutes = record.lateMinutes + record.earlyLeaveMinutes;
        return perMinuteRate * totalMinutes;
    };
    
    // Format currency
    const formatCurrency = (amount: number): string => {
        return `$${amount.toFixed(2)}`;
    };
    
    // Calculate totals
    const totals = useMemo(() => {
        const totalLate = filteredRecords.reduce((sum, r) => sum + r.lateMinutes, 0);
        const totalEarly = filteredRecords.reduce((sum, r) => sum + r.earlyLeaveMinutes, 0);
        
        // Calculate monetary deduction using the same logic as calculateRecordDeduction
        const totalDeduction = filteredRecords.reduce((sum, record) => {
            return sum + calculateRecordDeduction(record);
        }, 0);
        
        return { totalLate, totalEarly, totalDeduction };
    }, [filteredRecords, staffMap]);
    
    // Open modal for adding new record
    const handleAddNew = () => {
        setEditingRecord(null);
        setModalStaffId('');
        setModalDate(getSydneyToday());
        setModalLateMinutes('0');
        setModalEarlyMinutes('0');
        setModalNotes('');
        setShowModal(true);
    };
    
    // Open modal for editing existing record
    const handleEdit = (record: AttendanceRecord) => {
        setEditingRecord(record);
        setModalStaffId(record.staffId);
        setModalDate(record.date);
        setModalLateMinutes(record.lateMinutes.toString());
        setModalEarlyMinutes(record.earlyLeaveMinutes.toString());
        setModalNotes(record.notes || '');
        setShowModal(true);
    };
    
    // Save record
    const handleSave = async () => {
        if (!modalStaffId) {
            alert('Please select a staff member');
            return;
        }
        
        const staff = staffList.find(s => s.id === modalStaffId);
        if (!staff) {
            alert('Staff not found');
            return;
        }
        
        const lateMinutes = parseInt(modalLateMinutes) || 0;
        const earlyMinutes = parseInt(modalEarlyMinutes) || 0;
        
        if (lateMinutes < 0 || earlyMinutes < 0) {
            alert('Minutes cannot be negative');
            return;
        }
        
        const record: AttendanceRecord = {
            id: editingRecord?.id || `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            staffId: staff.id,
            staffName: staff.name,
            date: modalDate,
            lateMinutes,
            earlyLeaveMinutes: earlyMinutes,
            notes: modalNotes.trim() || undefined,
            recordedBy: 'admin', // You can enhance this to track which admin
            recordedAt: new Date().toISOString()
        };
        
        const success = await saveAttendanceRecord(record);
        if (success) {
            setShowModal(false);
        } else {
            alert('Failed to save record. Please check Firebase connection.');
        }
    };
    
    // Delete record
    const handleDelete = async (recordId: string) => {
        if (!confirm('Are you sure you want to delete this attendance record?')) {
            return;
        }
        
        const success = await deleteAttendanceRecord(recordId);
        if (!success) {
            alert('Failed to delete record. Please check Firebase connection.');
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-pearl-white via-dusty-rose/5 to-pearl-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-serif font-bold text-charcoal mb-2 flex items-center gap-3">
                        <ClockIcon className="w-10 h-10 text-gold-leaf" />
                        Attendance Tracking
                    </h1>
                    <p className="text-gray-600">
                        Track employee late arrivals and early departures
                    </p>
                </div>
                
                {/* Filters */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Start Date */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                max={getSydneyToday()}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold-leaf"
                            />
                        </div>
                        
                        {/* End Date */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                max={getSydneyToday()}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold-leaf"
                            />
                        </div>
                        
                        {/* Staff Filter */}
                        <div>
                            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                                Staff Member
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedStaffId}
                                    onChange={(e) => setSelectedStaffId(e.target.value)}
                                    className="appearance-none w-full px-3 py-2 pl-9 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:border-gold-leaf cursor-pointer"
                                >
                                    <option value="all">All Staff</option>
                                    {staffList.map(staff => (
                                        <option key={staff.id} value={staff.id}>
                                            {staff.name}
                                        </option>
                                    ))}
                                </select>
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        
                        {/* Add Button */}
                        <div className="flex items-end">
                            <button
                                onClick={handleAddNew}
                                className="w-full bg-gold-leaf text-white px-4 py-2 rounded-lg font-bold hover:bg-gold-leaf/90 transition-colors flex items-center justify-center gap-2"
                            >
                                <PlusIcon className="w-5 h-5" />
                                Add Record
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="text-sm font-bold uppercase text-gray-500 mb-2">
                            Total Records
                        </div>
                        <div className="text-3xl font-bold text-charcoal">
                            {filteredRecords.length}
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6">
                        <div className="text-sm font-bold uppercase text-gray-500 mb-2">
                            Total Late Time
                        </div>
                        <div className="text-3xl font-bold text-red-600">
                            {formatMinutes(totals.totalLate)}
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
                        <div className="text-sm font-bold uppercase text-gray-500 mb-2">
                            Total Early Leave Time
                        </div>
                        <div className="text-3xl font-bold text-blue-600">
                            {formatMinutes(totals.totalEarly)}
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
                        <div className="text-sm font-bold uppercase text-gray-500 mb-2">
                            Total Deduction
                        </div>
                        <div className="text-3xl font-bold text-orange-600">
                            {formatCurrency(totals.totalDeduction)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Based on base salary ÷ {STANDARD_WORKING_MINUTES_PER_DAY} min
                        </div>
                    </div>
                </div>
                
                {/* Records Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">
                            Loading attendance records...
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No attendance records found for this period
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-600">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-600">
                                            Staff
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-600">
                                            Late
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-600">
                                            Early Leave
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-600">
                                            Deduction
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-600">
                                            Notes
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-bold uppercase text-gray-600">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredRecords
                                        .sort((a, b) => b.date.localeCompare(a.date)) // Most recent first
                                        .map((record) => (
                                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-charcoal">
                                                        {new Date(record.date).toLocaleDateString('en-AU', { 
                                                            timeZone: 'Australia/Sydney',
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {staffMap.get(record.staffId)?.avatar ? (
                                                            <img 
                                                                src={staffMap.get(record.staffId)?.avatar} 
                                                                className="w-8 h-8 rounded-full object-cover" 
                                                                alt={record.staffName}
                                                            />
                                                        ) : (
                                                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                                                <UserIcon className="w-4 h-4 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <span className="text-sm font-medium text-charcoal">
                                                            {record.staffName}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`text-sm font-bold ${record.lateMinutes > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                        {formatMinutes(record.lateMinutes)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`text-sm font-bold ${record.earlyLeaveMinutes > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                        {formatMinutes(record.earlyLeaveMinutes)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(() => {
                                                        const deduction = calculateRecordDeduction(record);
                                                        const staff = staffMap.get(record.staffId);
                                                        const totalMinutes = record.lateMinutes + record.earlyLeaveMinutes;
                                                        
                                                        if (!staff?.payroll?.baseSalary) {
                                                            return (
                                                                <div className="text-xs text-gray-400">
                                                                    No salary
                                                                </div>
                                                            );
                                                        }
                                                        
                                                        if (totalMinutes === 0) {
                                                            return (
                                                                <div className="text-xs text-gray-400">
                                                                    $0.00
                                                                </div>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <div className="text-sm font-bold text-orange-600">
                                                                {formatCurrency(deduction)}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600 max-w-md truncate">
                                                        {record.notes || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(record)}
                                                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                                            title="Edit"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(record.id)}
                                                            className="text-red-600 hover:text-red-800 transition-colors p-1"
                                                            title="Delete"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-2xl font-serif font-bold text-charcoal">
                                {editingRecord ? 'Edit Attendance' : 'Add Attendance Record'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Staff Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Staff Member *
                                </label>
                                <div className="relative">
                                    <select
                                        value={modalStaffId}
                                        onChange={(e) => setModalStaffId(e.target.value)}
                                        className="appearance-none w-full px-3 py-2 pl-9 pr-8 border border-gray-200 rounded-lg focus:outline-none focus:border-gold-leaf cursor-pointer"
                                        disabled={!!editingRecord}
                                    >
                                        <option value="">Select Staff</option>
                                        {staffList.map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name}
                                            </option>
                                        ))}
                                    </select>
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            
                            {/* Date */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    value={modalDate}
                                    onChange={(e) => setModalDate(e.target.value)}
                                    max={getSydneyToday()}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold-leaf"
                                />
                            </div>
                            
                            {/* Late Minutes */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Late (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={modalLateMinutes}
                                    onChange={(e) => setModalLateMinutes(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold-leaf"
                                    placeholder="0"
                                />
                            </div>
                            
                            {/* Early Leave Minutes */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Early Leave (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={modalEarlyMinutes}
                                    onChange={(e) => setModalEarlyMinutes(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold-leaf"
                                    placeholder="0"
                                />
                            </div>
                            
                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Notes
                                </label>
                                <textarea
                                    value={modalNotes}
                                    onChange={(e) => setModalNotes(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gold-leaf resize-none"
                                    rows={3}
                                    placeholder="Optional notes about the lateness or early leave..."
                                />
                            </div>
                        </div>
                        
                        <div className="p-6 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 bg-gold-leaf text-white rounded-lg font-bold hover:bg-gold-leaf/90 transition-colors"
                            >
                                {editingRecord ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
