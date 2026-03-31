import { useState, useEffect, useCallback } from 'react';
import { AccountApi } from '../services/api/accountService';
import { StorageService } from '../services/api/storage';

export const useAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AccountApi.getAll();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
    // Subscribe to storage changes in case other tabs/hooks update the same collection
    const unsubscribe = StorageService.subscribe((col) => {
      if (col === 'accounts' || col === '*') fetchAccounts();
    });
    return () => unsubscribe();
  }, [fetchAccounts]);

  const addAccount = async (payload) => {
    await AccountApi.add(payload);
    await fetchAccounts();
  };

  const updateAccount = async (payload) => {
    await AccountApi.update(payload);
    await fetchAccounts();
  };

  const deleteAccount = async (id) => {
    await AccountApi.delete(id);
    await fetchAccounts();
  };

  const getTransactionsByAccount = async (accountId) => {
    const tx = await StorageService.getCollection('transactions');
    return tx.filter(t => t.accountId === accountId).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  return {
    accounts,
    activeAccounts: accounts.filter(a => !a.deleted),
    loading,
    error,
    addAccount,
    updateAccount,
    deleteAccount,
    getTransactionsByAccount
  };
};
