import { useState, useEffect, useCallback } from 'react';
import { TransactionApi } from '../services/api/transactionService';
import { StorageService } from '../services/api/storage';

export const useTransactions = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await TransactionApi.getAll();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = StorageService.subscribe((col) => {
      if (col === 'transactions' || col === '*') fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const add = async (payload) => { await TransactionApi.add(payload); };
  const update = async (payload) => { await TransactionApi.update(payload); };
  const remove = async (id) => { await TransactionApi.delete(id); };

  return {
    transactions: data,
    loading,
    addTransaction: add,
    updateTransaction: update,
    deleteTransaction: remove
  };
};
