import { useState, useEffect, useCallback } from 'react';
import { PurchaseApi } from '../services/api/purchaseService';
import { StorageService } from '../services/api/storage';

export const usePurchases = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await PurchaseApi.getAll();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = StorageService.subscribe((col) => {
      if (col === 'purchaseOrders' || col === '*') fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const add = async (payload) => { await PurchaseApi.add(payload); };
  const updateStatus = async (id, status) => { await PurchaseApi.updateStatus(id, status); };
  const remove = async (id) => { await PurchaseApi.delete(id); };

  const getSuppliers = async () => {
    return await StorageService.getCollection('suppliers');
  };

  const getIngredients = async () => {
    return await StorageService.getCollection('ingredients');
  };

  return {
    purchases: data,
    loading,
    addPurchase: add,
    updatePurchaseStatus: updateStatus,
    deletePurchase: remove,
    getSuppliers,
    getIngredients
  };
};
