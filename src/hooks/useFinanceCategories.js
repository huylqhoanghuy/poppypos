import { useState, useEffect, useCallback } from 'react';
import { FinanceCategoryApi } from '../services/api/financeCategoryService';
import { StorageService } from '../services/api/storage';

export const useFinanceCategories = (typeFilter) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await FinanceCategoryApi.getAll();
    if (typeFilter) {
      setData(result.filter(c => c.type === typeFilter));
    } else {
      setData(result);
    }
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect
    const unsubscribe = StorageService.subscribe((col) => {
      if (col === 'financeCategories' || col === '*') fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const add = async (payload) => { await FinanceCategoryApi.add(payload); };
  const update = async (payload) => { await FinanceCategoryApi.update(payload); };
  const remove = async (id) => { await FinanceCategoryApi.delete(id); };

  return {
    financeCategories: data,
    activeFinanceCategories: data.filter(c => !c.deleted),
    loading,
    addFinanceCategory: add,
    updateFinanceCategory: update,
    deleteFinanceCategory: remove
  };
};
