import { useState, useEffect, useCallback } from 'react';
import { ProductApi } from '../services/api/productService';
import { StorageService } from '../services/api/storage';
import { useActivityLogger } from './useActivityLogger';

export const useProducts = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logAction } = useActivityLogger();

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

  const add = async (payload) => { await ProductApi.add(payload); logAction('CREATE_PRODUCT', `Tạo món mới: ${payload.name}`); };
  const update = async (payload) => { await ProductApi.update(payload); logAction('UPDATE_PRODUCT', `Cập nhật thông tin món: ${payload.name}`); };
  const remove = async (id) => { await ProductApi.delete(id); logAction('DELETE_PRODUCT', `Đưa vào thùng rác món ID: ${id}`); };
  const hardDelete = async (id) => { await ProductApi.hardDelete(id); logAction('DELETE_PRODUCT', `Xóa vĩnh viễn món ID: ${id}`); };
  const restore = async (id) => { await ProductApi.restore(id); };

  return {
    products: data,
    activeProducts: data.filter(p => !p.deleted),
    loading,
    addProduct: add,
    updateProduct: update,
    deleteProduct: remove,
    hardDeleteProduct: hardDelete,
    restoreProduct: restore
  };
};
