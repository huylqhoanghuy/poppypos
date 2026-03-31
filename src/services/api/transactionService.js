import { StorageService } from './storage';

export const TransactionApi = {
  getAll: async () => {
    return await StorageService.getCollection('transactions');
  },
  
  add: async (transaction) => {
    const list = await TransactionApi.getAll();
    const newDoc = { 
      ...transaction, 
      id: StorageService.generateId('TX-'),
      amount: Number(transaction.amount || 0)
    };
    list.push(newDoc);
    await StorageService.saveCollection('transactions', list);

    // Xử lý tự động trừ/Cộng Tài Khoản kế thừa từ legacy reducer
    if (transaction.status === 'Completed' || transaction.status === undefined) {
      if (transaction.accountId) {
         const accounts = await StorageService.getCollection('accounts');
         const accIdx = accounts.findIndex(a => a.id === transaction.accountId);
         if (accIdx !== -1) {
             const amt = transaction.type === 'Thu' ? Number(transaction.amount) : -Number(transaction.amount);
             accounts[accIdx].balance = (Number(accounts[accIdx].balance) || 0) + amt;
             await StorageService.saveCollection('accounts', accounts);
         }
      }
    }

    return newDoc;
  },

  update: async (transaction) => {
    const list = await TransactionApi.getAll();
    const i = list.findIndex(t => t.id === transaction.id);
    if (i !== -1) {
      const oldTx = list[i];
      // Hoàn tiền cũ
      if (oldTx.accountId) {
          const accounts = await StorageService.getCollection('accounts');
          const accIdx = accounts.findIndex(a => a.id === oldTx.accountId);
          if (accIdx !== -1) {
              const revertAmt = oldTx.type === 'Thu' ? -Number(oldTx.amount) : Number(oldTx.amount);
              accounts[accIdx].balance = (Number(accounts[accIdx].balance) || 0) + revertAmt;
              // Áp dụng tiền mới
              if (transaction.accountId === oldTx.accountId) {
                  const newAmt = transaction.type === 'Thu' ? Number(transaction.amount) : -Number(transaction.amount);
                  accounts[accIdx].balance += newAmt;
              }
              await StorageService.saveCollection('accounts', accounts);
          }
      }

      list[i] = { ...oldTx, ...transaction };
      await StorageService.saveCollection('transactions', list);
    }
  },

  delete: async (id) => {
    const list = await TransactionApi.getAll();
    const tx = list.find(t => t.id === id);
    if (!tx) return;

    // Hoàn tiền nếu xóa giao dịch
    if (tx.accountId) {
       const accounts = await StorageService.getCollection('accounts');
       const accIdx = accounts.findIndex(a => a.id === tx.accountId);
       if (accIdx !== -1) {
           const revertAmt = tx.type === 'Thu' ? -Number(tx.amount) : Number(tx.amount);
           accounts[accIdx].balance = (Number(accounts[accIdx].balance) || 0) + revertAmt;
           await StorageService.saveCollection('accounts', accounts);
       }
    }

    const updated = list.filter(t => t.id !== id);
    await StorageService.saveCollection('transactions', updated);
  }
};
