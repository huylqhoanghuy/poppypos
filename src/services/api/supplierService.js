import { StorageService } from './storage';

export const SupplierApi = {
  getAll: async () => {
    return await StorageService.getCollection('suppliers');
  },
  
  add: async (supplier) => {
    const list = await SupplierApi.getAll();
    const newDoc = { 
      ...supplier, 
      id: StorageService.generateId('SUP-'),
      debt: Number(supplier.debt || 0)
    };
    list.push(newDoc);
    await StorageService.saveCollection('suppliers', list);
    return newDoc;
  },

  update: async (supplier) => {
    const list = await SupplierApi.getAll();
    const i = list.findIndex(s => s.id === supplier.id);
    if (i !== -1) {
      list[i] = { ...list[i], ...supplier, debt: Number(supplier.debt || 0) };
      await StorageService.saveCollection('suppliers', list);
    }
  },

  delete: async (id) => {
    const list = await SupplierApi.getAll();
    const updated = list.map(s => s.id === id ? { ...s, deleted: true, deletedAt: new Date().toISOString() } : s);
    await StorageService.saveCollection('suppliers', updated);
  },

  hardDelete: async (id) => {
    const list = await SupplierApi.getAll();
    const updated = list.filter(s => s.id !== id);
    await StorageService.saveCollection('suppliers', updated);
  }
};
