import { StorageService } from './storage';

export const CategoryApi = {
  getAll: async () => {
    return await StorageService.getCollection('categories');
  },
  
  add: async (category) => {
    const list = await CategoryApi.getAll();
    const newDoc = { 
      ...category, 
      id: StorageService.generateId('CAT-')
    };
    list.push(newDoc);
    await StorageService.saveCollection('categories', list);
    return newDoc;
  },

  update: async (category) => {
    const list = await CategoryApi.getAll();
    const i = list.findIndex(c => c.id === category.id);
    if (i !== -1) {
      list[i] = category;
      await StorageService.saveCollection('categories', list);
    }
  },

  delete: async (id) => {
    const list = await CategoryApi.getAll();
    const updated = list.map(c => c.id === id ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c);
    await StorageService.saveCollection('categories', updated);
  },

  hardDelete: async (id) => {
    const list = await CategoryApi.getAll();
    const updated = list.filter(c => c.id !== id);
    await StorageService.saveCollection('categories', updated);
  }
};
