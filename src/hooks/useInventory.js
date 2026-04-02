import { useState, useEffect, useCallback } from 'react';
import { IngredientApi } from '../services/api/ingredientService';
import { StorageService } from '../services/api/storage';

export const useInventory = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await IngredientApi.getAll();
    setData(result);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect
    const unsubscribe = StorageService.subscribe((col) => {
      if (col === 'ingredients' || col === '*') fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  const add = async (payload) => { await IngredientApi.add(payload); };
  const update = async (payload) => { await IngredientApi.update(payload); };
  const remove = async (id) => { await IngredientApi.delete(id); };

  return {
    ingredients: data,
    activeIngredients: data.filter(i => !i.deleted),
    loading,
    addIngredient: add,
    updateIngredient: update,
    deleteIngredient: remove
  };
};
