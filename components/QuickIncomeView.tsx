
import React, { useState, useEffect, useRef } from 'react';
import { StaffProfile, Transaction, TransactionItem } from '../types';
import { Translation } from '../translations';
import { WalletIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon, ClockIcon, UserIcon } from './Icons';
import {
    saveTransactionToFirebase,
    updateTransactionInFirebase,
    deleteTransactionFromFirebase,
    subscribeToTransactions,
} from '../services/firebaseService';
import { SoundManager } from '../utils/sound';

interface QuickIncomeViewProps {
    t: Translation;
    currentUser: StaffProfile | null;
    staffList: StaffProfile[];
}

const QUICK_INCOME_SOURCE = 'quick-income';

const generateId = () =>
    `qi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const formatDate = (iso: string) => {
    try {
        return new Date(iso).toLocaleString('en-AU', {
            timeZone: 'Australia/Sydney',
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return iso;
    }
};

export const QuickIncomeView: React.FC<QuickIncomeViewProps> = ({
    t,
    currentUser,
    staffList,
}) => {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [selectedStaffId, setSelectedStaffId] = useState(currentUser?.id ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const [entries, setEntries] = useState<Transaction[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState('');
    const [editNote, setEditNote] = useState('');
    const [editStaffId, setEditStaffId] = useState('');

    const amountRef = useRef<HTMLInputElement>(null);

    // Keep selected staff in sync when currentUser changes
    useEffect(() => {
        if (currentUser && !selectedStaffId) {
            setSelectedStaffId(currentUser.id);
        }
    }, [currentUser, selectedStaffId]);

    // Subscribe to quick-income transactions from Firebase
    useEffect(() => {
        const unsubscribe = subscribeToTransactions((txs) => {
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }); // YYYY-MM-DD
            const quickEntries = txs
                .filter(
                    (tx) =>
                        !tx.deleted &&
                        tx.items.some((item) => item.nameKey === QUICK_INCOME_SOURCE) &&
                        new Date(tx.date).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' }) === todayStr
                )
                .sort(
                    (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                );
            setEntries(quickEntries);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const parsed = parseFloat(amount);
        if (!parsed || parsed <= 0) {
            setErrorMsg(t.quickIncomeInvalidAmount);
            return;
        }
        if (!selectedStaffId) {
            setErrorMsg(t.quickIncomeSelectStaffError);
            return;
        }
        setErrorMsg('');
        setIsSaving(true);
        SoundManager.playTap();

        const staffMember = staffList.find((s) => s.id === selectedStaffId);
        const item: TransactionItem = {
            nameKey: QUICK_INCOME_SOURCE,
            displayName: note.trim() || 'Quick Income',
            price: parsed,
            quantity: 1,
            staffId: selectedStaffId,
            staffName: staffMember?.name ?? '',
        };
        const tx: Transaction = {
            id: generateId(),
            date: new Date().toISOString(),
            total: parsed,
            items: [item],
        };
        const result = await saveTransactionToFirebase(tx);
        setIsSaving(false);
        if (result.success) {
            setSuccessMsg(t.quickIncomeSuccess);
            setAmount('');
            setNote('');
            setTimeout(() => setSuccessMsg(''), 3000);
            amountRef.current?.focus();
        } else {
            setErrorMsg(result.error ?? t.quickIncomeSaveError);
        }
    };

    const startEdit = (tx: Transaction) => {
        setEditingId(tx.id);
        setEditAmount(String(tx.total));
        const item = tx.items[0];
        setEditNote(item?.displayName === 'Quick Income' ? '' : item?.displayName ?? '');
        setEditStaffId(item?.staffId ?? '');
    };

    const cancelEdit = () => {
        setEditingId(null);
    };

    const saveEdit = async (tx: Transaction) => {
        const parsed = parseFloat(editAmount);
        if (!parsed || parsed <= 0) return;
        const staffMember = staffList.find((s) => s.id === editStaffId);
        const updated: Transaction = {
            ...tx,
            total: parsed,
            lastUpdated: Date.now(),
            items: [
                {
                    nameKey: QUICK_INCOME_SOURCE,
                    displayName: editNote.trim() || 'Quick Income',
                    price: parsed,
                    quantity: 1,
                    staffId: editStaffId,
                    staffName: staffMember?.name ?? tx.items[0]?.staffName ?? '',
                },
            ],
        };
        await updateTransactionInFirebase(updated);
        setEditingId(null);
    };

    const handleDelete = async (txId: string) => {
        if (!window.confirm(t.quickIncomeDeleteConfirm)) return;
        await deleteTransactionFromFirebase(txId);
    };

    if (!currentUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
                <WalletIcon className="w-16 h-16 text-gold-leaf mb-4 opacity-50" />
                <p className="text-charcoal/70 font-sans text-lg">
                    {t.quickIncomeLoginRequired}
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-serif text-charcoal mb-2 flex items-center justify-center gap-3">
                    <WalletIcon className="w-8 h-8 text-gold-leaf" />
                    {t.quickIncomeTitle}
                </h1>
                <p className="text-charcoal/60 font-sans text-sm">
                    {t.quickIncomeSubtitle}
                </p>
            </div>

            {/* Entry Form */}
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-md border border-gold-leaf/20 p-6 mb-8"
            >
                {/* Staff Selector */}
                <div className="mb-5">
                    <label className="block text-sm font-medium text-charcoal mb-1 flex items-center gap-1">
                        <UserIcon className="w-4 h-4" />
                        {t.quickIncomeStaffLabel}
                    </label>
                    <select
                        value={selectedStaffId}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                        className="w-full border border-dusty-rose/40 rounded-xl px-4 py-3 text-charcoal bg-pearl-white focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf outline-none font-sans"
                        required
                    >
                        <option value="">{t.quickIncomeSelectStaff}</option>
                        {staffList
                            .filter((s) => s.id !== 'admin_master' && s.id !== 'shop_manager')
                            .map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                    </select>
                </div>

                {/* Amount */}
                <div className="mb-5">
                    <label className="block text-sm font-medium text-charcoal mb-1">
                        {t.quickIncomeAmountLabel}
                    </label>
                    <input
                        ref={amountRef}
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={t.quickIncomeAmountPlaceholder}
                        className="w-full border border-dusty-rose/40 rounded-xl px-4 py-3 text-charcoal text-2xl font-bold bg-pearl-white focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf outline-none"
                        required
                        autoFocus
                    />
                </div>

                {/* Note */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-charcoal mb-1">
                        {t.quickIncomeNoteLabel}
                    </label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t.quickIncomeNotePlaceholder}
                        className="w-full border border-dusty-rose/40 rounded-xl px-4 py-3 text-charcoal bg-pearl-white focus:ring-2 focus:ring-gold-leaf focus:border-gold-leaf outline-none font-sans"
                    />
                </div>

                {errorMsg && (
                    <p className="text-red-500 text-sm mb-4">{errorMsg}</p>
                )}
                {successMsg && (
                    <p className="text-green-600 text-sm mb-4 flex items-center gap-1">
                        <CheckIcon className="w-4 h-4" />
                        {successMsg}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-gold-leaf text-white font-bold rounded-xl hover:bg-dusty-rose transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
                >
                    <WalletIcon className="w-5 h-5" />
                    {isSaving ? '...' : t.quickIncomeSubmit}
                </button>
            </form>

            {/* Recent Entries */}
            <div>
                <h2 className="text-xl font-serif text-charcoal mb-4 flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-gold-leaf" />
                    {t.quickIncomeRecentTitle}
                </h2>

                {entries.length === 0 ? (
                    <div className="text-center py-12 text-charcoal/40 font-sans text-sm">
                        {t.quickIncomeNoEntries}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {entries.map((tx) => {
                            const item = tx.items[0];
                            const staffMember = staffList.find(
                                (s) => s.id === item?.staffId
                            );
                            const isEditing = editingId === tx.id;

                            return (
                                <div
                                    key={tx.id}
                                    className="bg-white rounded-xl border border-gold-leaf/20 shadow-sm p-4"
                                >
                                    {isEditing ? (
                                        <div className="space-y-3">
                                            {/* Edit Staff */}
                                            <select
                                                value={editStaffId}
                                                onChange={(e) =>
                                                    setEditStaffId(e.target.value)
                                                }
                                                className="w-full border border-dusty-rose/40 rounded-lg px-3 py-2 text-charcoal bg-pearl-white text-sm outline-none focus:ring-2 focus:ring-gold-leaf"
                                            >
                                                <option value="">{t.quickIncomeSelectStaff}</option>
                                                {staffList
                                                    .filter(
                                                        (s) =>
                                                            s.id !== 'admin_master' &&
                                                            s.id !== 'shop_manager'
                                                    )
                                                    .map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {s.name}
                                                        </option>
                                                    ))}
                                            </select>
                                            {/* Edit Amount */}
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                min="0"
                                                step="0.01"
                                                value={editAmount}
                                                onChange={(e) =>
                                                    setEditAmount(e.target.value)
                                                }
                                                className="w-full border border-dusty-rose/40 rounded-lg px-3 py-2 text-charcoal font-bold text-lg outline-none focus:ring-2 focus:ring-gold-leaf"
                                            />
                                            {/* Edit Note */}
                                            <input
                                                type="text"
                                                value={editNote}
                                                onChange={(e) =>
                                                    setEditNote(e.target.value)
                                                }
                                                placeholder={t.quickIncomeNotePlaceholder}
                                                className="w-full border border-dusty-rose/40 rounded-lg px-3 py-2 text-charcoal text-sm outline-none focus:ring-2 focus:ring-gold-leaf"
                                            />
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => saveEdit(tx)}
                                                    className="flex-1 py-2 bg-gold-leaf text-white text-sm font-semibold rounded-lg hover:bg-dusty-rose transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <CheckIcon className="w-4 h-4" />
                                                    {t.quickIncomeSaveEdit}
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="flex-1 py-2 bg-gray-100 text-charcoal text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <XMarkIcon className="w-4 h-4" />
                                                    {t.quickIncomeCancelEdit}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-2xl font-bold text-gold-leaf">
                                                        ${tx.total.toFixed(2)}
                                                    </span>
                                                    {item?.displayName &&
                                                        item.displayName !== 'Quick Income' && (
                                                            <span className="text-sm text-charcoal/60 truncate">
                                                                — {item.displayName}
                                                            </span>
                                                        )}
                                                </div>
                                                <div className="text-xs text-charcoal/50 mt-0.5 flex items-center gap-2">
                                                    <span>
                                                        {staffMember?.name ?? item?.staffName ?? ''}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{formatDate(tx.date)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => startEdit(tx)}
                                                    className="p-2 rounded-lg text-charcoal/60 hover:text-gold-leaf hover:bg-gold-leaf/10 transition-colors"
                                                    title={t.quickIncomeEdit}
                                                >
                                                    <PencilIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tx.id)}
                                                    className="p-2 rounded-lg text-charcoal/60 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    title={t.quickIncomeDelete}
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickIncomeView;
