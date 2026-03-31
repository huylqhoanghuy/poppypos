import { StorageService } from './storage';

export const PurchaseApi = {
  getAll: async () => {
    return await StorageService.getCollection('purchaseOrders');
  },
  
  add: async (purchase) => {
    const list = await PurchaseApi.getAll();
    const newDoc = { 
      ...purchase, 
      id: StorageService.generateId('PO-')
    };
    list.unshift(newDoc);
    await StorageService.saveCollection('purchaseOrders', list);

    // Xử lý nợ Supplier
    if (purchase.supplierId && purchase.status === 'Pending') {
       const suppliers = await StorageService.getCollection('suppliers');
       const supIdx = suppliers.findIndex(s => s.id === purchase.supplierId);
       if (supIdx !== -1) {
           suppliers[supIdx].debt = (Number(suppliers[supIdx].debt) || 0) + Number(purchase.totalAmount);
           await StorageService.saveCollection('suppliers', suppliers);
       }
    }

    // Process payment -> Create Chi transaction
    if (purchase.status === 'Paid') {
        const txList = await StorageService.getCollection('transactions');
        const accounts = await StorageService.getCollection('accounts');
        
        // Find default cash account or use first available
        const cashAcc = accounts.find(a => a.type === 'cash') || accounts[0];
        
        if (cashAcc) {
            txList.unshift({
                id: StorageService.generateId('TX-'),
                type: 'Chi',
                amount: Number(purchase.totalAmount),
                accountId: cashAcc.id,
                categoryId: 'FC4',
                categoryName: 'Nhập hàng nguyên liệu',
                date: purchase.date,
                note: `Thanh toán phiếu nhập kho ${newDoc.id}`,
                relatedId: newDoc.id,
                status: 'Completed'
            });
            await StorageService.saveCollection('transactions', txList);
            cashAcc.balance = (Number(cashAcc.balance) || 0) - Number(purchase.totalAmount);
            await StorageService.saveCollection('accounts', accounts);
        }
    }

    return newDoc;
  },

  updateStatus: async (id, status) => {
    const list = await PurchaseApi.getAll();
    const i = list.findIndex(p => p.id === id);
    if (i !== -1) {
      const p = list[i];
      if (p.status === 'Pending' && status === 'Paid') {
          // Pay the debt
          const suppliers = await StorageService.getCollection('suppliers');
          const supIdx = suppliers.findIndex(s => s.id === p.supplierId);
          if (supIdx !== -1) {
              suppliers[supIdx].debt = Math.max(0, (Number(suppliers[supIdx].debt) || 0) - Number(p.totalAmount));
              await StorageService.saveCollection('suppliers', suppliers);
          }

          // Generate Tx
          const txList = await StorageService.getCollection('transactions');
          const accounts = await StorageService.getCollection('accounts');
          const cashAcc = accounts.find(a => a.type === 'cash') || accounts[0];
          
          if (cashAcc) {
              txList.unshift({
                  id: StorageService.generateId('TX-'),
                  type: 'Chi',
                  amount: Number(p.totalAmount),
                  accountId: cashAcc.id,
                  categoryId: 'FC4',
                  categoryName: 'Nhập hàng nguyên liệu',
                  date: new Date().toISOString(),
                  note: `Cấn trừ nợ phụ tùng/nguyên liệu phiếu ${p.id}`,
                  relatedId: p.id,
                  status: 'Completed'
              });
              await StorageService.saveCollection('transactions', txList);
              cashAcc.balance -= Number(p.totalAmount);
              await StorageService.saveCollection('accounts', accounts);
          }
      }
      p.status = status;
      await StorageService.saveCollection('purchaseOrders', list);
    }
  },

  delete: async (id) => {
    const list = await PurchaseApi.getAll();
    const po = list.find(p => p.id === id);
    if (!po) return;
    
    // Revert debt or revert payment depending on status
    if (po.status === 'Pending') {
        const suppliers = await StorageService.getCollection('suppliers');
        const supIdx = suppliers.findIndex(s => s.id === po.supplierId);
        if (supIdx !== -1) {
           suppliers[supIdx].debt = Math.max(0, (Number(suppliers[supIdx].debt) || 0) - Number(po.totalAmount));
           await StorageService.saveCollection('suppliers', suppliers);
        }
    } else if (po.status === 'Paid') {
        const txList = await StorageService.getCollection('transactions');
        const originalTx = txList.find(t => t.relatedId === po.id && t.type === 'Chi');
        if (originalTx) {
            txList.unshift({
                  id: StorageService.generateId('TX-'),
                  type: 'Thu',
                  amount: Number(po.totalAmount),
                  accountId: originalTx.accountId,
                  categoryId: 'FC10',
                  categoryName: 'Điều chỉnh số dư',
                  date: new Date().toISOString(),
                  note: `Hoàn tiền xóa phiếu nhập kho ${po.id}`,
                  relatedId: po.id,
                  status: 'Completed'
            });
            await StorageService.saveCollection('transactions', txList);

            const accounts = await StorageService.getCollection('accounts');
            const accIdx = accounts.findIndex(a => a.id === originalTx.accountId);
            if (accIdx !== -1) {
                accounts[accIdx].balance += Number(po.totalAmount);
                await StorageService.saveCollection('accounts', accounts);
            }
        }
    }

    const updated = list.filter(p => p.id !== id);
    await StorageService.saveCollection('purchaseOrders', updated);
  }
};
