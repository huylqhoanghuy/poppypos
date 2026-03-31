import { StorageService } from './storage';

export const SalesChannelApi = {
  getAll: async () => {
    return await StorageService.getCollection('salesChannels');
  },
  
  add: async (channel) => {
    const list = await SalesChannelApi.getAll();
    const newDoc = { 
      ...channel, 
      id: StorageService.generateId('CH-')
    };
    list.push(newDoc);
    await StorageService.saveCollection('salesChannels', list);
    return newDoc;
  },

  update: async (channel) => {
    const list = await SalesChannelApi.getAll();
    const i = list.findIndex(c => c.id === channel.id);
    if (i !== -1) {
      list[i] = channel;
      await StorageService.saveCollection('salesChannels', list);
    }
  },

  delete: async (id) => {
    const list = await SalesChannelApi.getAll();
    const updated = list.map(c => c.id === id ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c);
    await StorageService.saveCollection('salesChannels', updated);
  },

  hardDelete: async (id) => {
    const list = await SalesChannelApi.getAll();
    const updated = list.filter(c => c.id !== id);
    await StorageService.saveCollection('salesChannels', updated);
  }
};
