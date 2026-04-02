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
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect
    const unsubscribe = StorageService.subscribe((col) => {
      if (col === 'posOrders' || col === '*') fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const add = async (payload) => { await OrderApi.add(payload); };
  const update = async (payload) => { await OrderApi.update(payload); };
  const cancel = async (id) => { await OrderApi.cancel(id); };
  const remove = async (id) => { await OrderApi.delete(id); };
  const restore = async (id) => { await OrderApi.restore(id); };
  const hardDelete = async (id) => { await OrderApi.hardDelete(id); };
  const bulkDelete = async (ids) => { await OrderApi.bulkDelete(ids); };
  const bulkRestore = async (ids) => { await OrderApi.bulkRestore(ids); };
  const bulkHardDelete = async (ids) => { await OrderApi.bulkHardDelete(ids); };

  return {
    orders: data,
    loading,
    addOrder: add,
    updateOrder: update,
    cancelOrder: cancel,
    deleteOrder: remove,
    restoreOrder: restore,
    hardDeleteOrder: hardDelete,
    bulkDeleteOrder: bulkDelete,
    bulkRestoreOrder: bulkRestore,
    bulkHardDeleteOrder: bulkHardDelete
  };
};
