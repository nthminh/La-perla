import { Transaction } from '../types';

const STORAGE_KEY = 'la_perla_transactions';

export const saveTransaction = (transaction: Transaction): void => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    const transactions: Transaction[] = existingData ? JSON.parse(existingData) : [];
    transactions.push(transaction);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("Failed to save transaction", error);
  }
};

export const getTransactions = (): Transaction[] => {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    return existingData ? JSON.parse(existingData) : [];
  } catch (error) {
    console.error("Failed to load transactions", error);
    return [];
  }
};

export const clearTransactions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};