import { StorageService } from './storage';

export const IngredientApi = {
  getAll: async () => {
    return await StorageService.getCollection('ingredients');
  },
  
  add: async (ingredient) => {
    const list = await IngredientApi.getAll();
    const newDoc = { 
      ...ingredient, 
      id: StorageService.generateId('ING-')
    };
    list.push(newDoc);
    await StorageService.saveCollection('ingredients', list);
    return newDoc;
  },

  update: async (ingredient) => {
    const list = await IngredientApi.getAll();
    const i = list.findIndex(ing => ing.id === ingredient.id);
    if (i !== -1) {
      list[i] = ingredient;
      await StorageService.saveCollection('ingredients', list);
    }
  },

  delete: async (id) => {
    const list = await IngredientApi.getAll();
    const updated = list.map(ing => ing.id === id ? { ...ing, deleted: true, deletedAt: new Date().toISOString() } : ing);
    await StorageService.saveCollection('ingredients', updated);
  },

  hardDelete: async (id) => {
    const list = await IngredientApi.getAll();
    const updated = list.filter(ing => ing.id !== id);
    await StorageService.saveCollection('ingredients', updated);
  }
};
