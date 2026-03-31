import { StorageService } from './storage';

export const AccountApi = {
  getAll: async () => {
    return await StorageService.getCollection('accounts');
  },
  
  add: async (account) => {
    const list = await AccountApi.getAll();
    const newDoc = { 
      ...account, 
      id: StorageService.generateId('ACC-'),
      balance: Number(account.initialBalance || 0), 
      initialBalance: Number(account.initialBalance || 0) 
    };
    list.push(newDoc);
    await StorageService.saveCollection('accounts', list);
    return newDoc;
  },

  update: async (account) => {
    const list = await AccountApi.getAll();
    const i = list.findIndex(a => a.id === account.id);
    if (i !== -1) {
      list[i] = { ...list[i], ...account };
      await StorageService.saveCollection('accounts', list);
    }
  },

  delete: async (id) => {
    const list = await AccountApi.getAll();
    const updated = list.map(a => a.id === id ? { ...a, deleted: true, deletedAt: new Date().toISOString() } : a);
    await StorageService.saveCollection('accounts', updated);
  },

  hardDelete: async (id) => {
    const list = await AccountApi.getAll();
    const updated = list.filter(a => a.id !== id);
    await StorageService.saveCollection('accounts', updated);
  },

  bulkDelete: async (ids) => {
    const list = await AccountApi.getAll();
    const updated = list.map(a => ids.includes(a.id) ? { ...a, deleted: true, deletedAt: new Date().toISOString() } : a);
    await StorageService.saveCollection('accounts', updated);
  },

  bulkHardDelete: async (ids) => {
    const list = await AccountApi.getAll();
    const updated = list.filter(a => !ids.includes(a.id));
    await StorageService.saveCollection('accounts', updated);
  }
};
