import { useState, useEffect, useCallback } from 'react';
import { OrderApi } from '../services/api/orderService';
import { StorageService } from '../services/api/storage';

export const useOrders = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await OrderApi.getAll();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const unsubscribe = StorageService.subscribe((col) => {
      if (col === 'posOrders' || col === '*') fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const add = async (payload) => { await OrderApi.add(payload); };
  const update = async (payload) => { await OrderApi.update(payload); };
  const cancel = async (id) => { await OrderApi.cancel(id); };
  const remove = async (id) => { await OrderApi.delete(id); };

  return {
    orders: data,
    loading,
    addOrder: add,
    updateOrder: update,
    cancelOrder: cancel,
    deleteOrder: remove
  };
};
