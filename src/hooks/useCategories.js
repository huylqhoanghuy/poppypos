import { useState, useEffect, useCallback } from 'react';
import { CategoryApi } from '../services/api/categoryService';
import { StorageService } from '../services/api/storage';

export const useCategories = (typeFilter) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await CategoryApi.getAll();
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
      if (col === 'categories' || col === '*') fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const add = async (payload) => { await CategoryApi.add(payload); };
  const update = async (payload) => { await CategoryApi.update(payload); };
  const remove = async (id) => { await CategoryApi.delete(id); };

  return {
    categories: data,
    activeCategories: data.filter(c => !c.deleted),
    loading,
    addCategory: add,
    updateCategory: update,
    deleteCategory: remove
  };
};
