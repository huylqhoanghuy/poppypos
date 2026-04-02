import { useState, useEffect, useCallback } from 'react';
import { ProductApi } from '../services/api/productService';
import { StorageService } from '../services/api/storage';

export const useProducts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await ProductApi.getAll();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect
    const unsubscribe = StorageService.subscribe((col) => {
      if (col === 'products' || col === '*') fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const add = async (payload) => { await ProductApi.add(payload); };
  const update = async (payload) => { await ProductApi.update(payload); };
  const remove = async (id) => { await ProductApi.delete(id); };

  return {
    products: data,
    activeProducts: data.filter(p => !p.deleted),
    loading,
    addProduct: add,
    updateProduct: update,
    deleteProduct: remove
  };
};
