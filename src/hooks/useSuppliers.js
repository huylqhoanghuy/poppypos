import { useState, useEffect, useCallback } from 'react';
import { SupplierApi } from '../services/api/supplierService';
import { StorageService } from '../services/api/storage';

export const useSuppliers = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await SupplierApi.getAll();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = StorageService.subscribe((col) => {
      if (col === 'suppliers' || col === '*') fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const add = async (payload) => { await SupplierApi.add(payload); };
  const update = async (payload) => { await SupplierApi.update(payload); };
  const remove = async (id) => { await SupplierApi.delete(id); };

  return {
    suppliers: data,
    activeSuppliers: data.filter(s => !s.deleted),
    loading,
    addSupplier: add,
    updateSupplier: update,
    deleteSupplier: remove
  };
};
