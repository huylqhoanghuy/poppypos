import { StorageService } from './storage';

export const FinanceCategoryApi = {
  getAll: async () => {
    return await StorageService.getCollection('financeCategories');
  },
  
  add: async (category) => {
    const list = await FinanceCategoryApi.getAll();
    const newDoc = { 
      ...category, 
      id: StorageService.generateId('FC-')
    };
    list.push(newDoc);
    await StorageService.saveCollection('financeCategories', list);
    return newDoc;
  },

  update: async (category) => {
    const list = await FinanceCategoryApi.getAll();
    const i = list.findIndex(c => c.id === category.id);
    if (i !== -1) {
      list[i] = category;
      await StorageService.saveCollection('financeCategories', list);
    }
  },

  delete: async (id) => {
    const list = await FinanceCategoryApi.getAll();
    const updated = list.map(c => c.id === id ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c);
    await StorageService.saveCollection('financeCategories', updated);
  },

  hardDelete: async (id) => {
    const list = await FinanceCategoryApi.getAll();
    const updated = list.filter(c => c.id !== id);
    await StorageService.saveCollection('financeCategories', updated);
  }
};
