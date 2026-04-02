import { useState, useEffect, useCallback } from 'react';
import { SalesChannelApi } from '../services/api/salesChannelService';
import { StorageService } from '../services/api/storage';

export const useSalesChannels = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await SalesChannelApi.getAll();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect
    const unsubscribe = StorageService.subscribe((col) => {
      if (col === 'salesChannels' || col === '*') fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const add = async (payload) => { await SalesChannelApi.add(payload); };
  const update = async (payload) => { await SalesChannelApi.update(payload); };
  const remove = async (id) => { await SalesChannelApi.delete(id); };

  return {
    salesChannels: data,
    activeSalesChannels: data.filter(c => !c.deleted),
    loading,
    addSalesChannel: add,
    updateSalesChannel: update,
    deleteSalesChannel: remove
  };
};
