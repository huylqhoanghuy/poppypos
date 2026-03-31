import { StorageService } from './storage';

export const ProductApi = {
  getAll: async () => {
    return await StorageService.getCollection('products');
  },
  
  add: async (product) => {
    const list = await ProductApi.getAll();
    const newDoc = { 
      ...product, 
      id: StorageService.generateId('PRD-')
    };
    list.push(newDoc);
    await StorageService.saveCollection('products', list);
    return newDoc;
  },

  update: async (product) => {
    const list = await ProductApi.getAll();
    const i = list.findIndex(p => p.id === product.id);
    if (i !== -1) {
      list[i] = product;
      await StorageService.saveCollection('products', list);
    }
  },

  delete: async (id) => {
    const list = await ProductApi.getAll();
    const updated = list.map(p => p.id === id ? { ...p, deleted: true, deletedAt: new Date().toISOString() } : p);
    await StorageService.saveCollection('products', updated);
  },

  hardDelete: async (id) => {
    const list = await ProductApi.getAll();
    const updated = list.filter(p => p.id !== id);
    await StorageService.saveCollection('products', updated);
  }
};
