import { StorageService } from './storage';
import { processUpdateOrderStatus, adjustInventoryQuantity } from '../coreServices';

export const OrderApi = {
  getAll: async () => {
    return await StorageService.getCollection('posOrders');
  },
  
  add: async (order) => {
    const state = await StorageService.getAll();
    const posOrders = state.posOrders || [];
    const products = state.products || [];
    const ingredients = state.ingredients || [];
    const transactions = state.transactions || [];
    const accounts = state.accounts || [];

    const newDoc = { 
      id: StorageService.generateId('ORD-'),
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      extraFee: order.extraFee || 0,
      extraFeeNote: order.extraFeeNote || '',
      paymentStatus: order.paymentStatus || 'Paid',
      status: order.status || 'Success',
      date: order.date || new Date().toISOString(),
      ...order
    };
    posOrders.unshift(newDoc);

    // ===================================
    // 1. TỰ ĐỘNG TRỪ KHO NGUYÊN LIỆU (ĐỆ QUY)
    // ===================================
    let inventoryChanged = false;
    if (order.status !== 'Cancelled') {
          const adjustInventory = (recipe, quantityMultiplier) => {
              const updatedIngredients = adjustInventoryQuantity(ingredients, products, recipe, quantityMultiplier, true); // true = deduct
              updatedIngredients.forEach((ing, idx) => { ingredients[idx] = ing; });
              inventoryChanged = true;
          };
          order.items?.forEach(cartItem => {
        adjustInventory(cartItem.product?.recipe, cartItem.quantity);
      });
    }

    // ===================================
    // 2. GHI NHẬN DOANH THU & CỘNG TIỀN VÍ
    // ===================================
    if (order.status !== 'Cancelled') {
      // Map paymentMethodId or channelId to target account (Fallback: ACC1 = Tiền mặt)
      let targetAccountId = order.paymentMethodId || 'ACC1';
      let targetAccountName = 'Tiền mặt tại quầy';
      if (!order.paymentMethodId) {
          if (order.channelName === 'ShopeeFood') { targetAccountId = 'ACC3'; targetAccountName = 'Ví Khách Nợ (ShopeeFood)'; }
          if (order.channelName === 'GrabFood') { targetAccountId = 'ACC4'; targetAccountName = 'Ví Khách Nợ (GrabFood)'; }
      }
      
      // Auto-create missing virtual accounts for online channels to prevent silent failures
      let accIdx = accounts.findIndex(a => a.id === targetAccountId);
      if (accIdx === -1) {
          accounts.push({ id: targetAccountId, name: targetAccountName, balance: 0, type: 'virtual', initialBalance: 0 });
          accIdx = accounts.length - 1;
      }

      transactions.unshift({
          id: StorageService.generateId('TX-'),
          voucherCode: StorageService.generateId('PT-'),
          type: 'Thu',
          amount: Number(order.netAmount || 0) + (Number(order.extraFee) || 0),
          accountId: targetAccountId,
          categoryId: 'FC1',
          categoryName: 'Doanh thu bán hàng',
          date: new Date().toISOString(),
          note: `Doanh thu đơn ${newDoc.id} (${order.channelName || 'POS'})`,
          relatedId: newDoc.id,
          status: 'Completed'
      });

      if (accIdx !== -1) {
          accounts[accIdx].balance = (Number(accounts[accIdx].balance) || 0) + Number(order.netAmount || 0) + (Number(order.extraFee) || 0);
      }
    }

    state.posOrders = posOrders;
    if (inventoryChanged) state.ingredients = ingredients;
    state.transactions = transactions;
    state.accounts = accounts;

    await StorageService.saveAll(state);
    return newDoc;
  },

  update: async (order) => {
    const list = await OrderApi.getAll();
    const i = list.findIndex(o => o.id === order.id);
    if (i !== -1) {
      const oldOrder = list[i];
      list[i] = order;
      await StorageService.saveCollection('posOrders', list);

      if (oldOrder.status !== 'Cancelled') {
         const txList = await StorageService.getCollection('transactions');
         const accounts = await StorageService.getCollection('accounts');
         
         const txIndex = txList.findIndex(t => t.relatedId === oldOrder.id && t.type === 'Thu');
         if (txIndex !== -1) {
            const oldTx = txList[txIndex];
            const oldMoney = (oldOrder.netAmount || 0) + (Number(oldOrder.extraFee) || 0);
            const newMoney = (order.netAmount || 0) + (Number(order.extraFee) || 0);
            
            let newAccountId = 'ACC1';
            let newAccountName = 'Tiền mặt tại quầy';
            if (order.channelName === 'ShopeeFood') { newAccountId = 'ACC3'; newAccountName = 'Ví Khách Nợ (ShopeeFood)'; }
            if (order.channelName === 'GrabFood') { newAccountId = 'ACC4'; newAccountName = 'Ví Khách Nợ (GrabFood)'; }

            let newAccIdx = accounts.findIndex(a => a.id === newAccountId);
            if (newAccIdx === -1) {
               accounts.push({ id: newAccountId, name: newAccountName, balance: 0, type: 'virtual', initialBalance: 0 });
               newAccIdx = accounts.length - 1;
            }

            const oldAccIdx = accounts.findIndex(a => a.id === oldTx.accountId);
            if (oldAccIdx !== -1) {
               accounts[oldAccIdx].balance = (Number(accounts[oldAccIdx].balance) || 0) - oldMoney;
            }
            
            accounts[newAccIdx].balance = (Number(accounts[newAccIdx].balance) || 0) + newMoney;
            await StorageService.saveCollection('accounts', accounts);

            txList[txIndex] = {
              ...oldTx,
              amount: newMoney,
              accountId: newAccountId,
              date: order.date || oldTx.date,
              payer: order.customerName || 'Khách vãng lai',
              note: `Doanh thu đơn ${order.id} (${order.channelName || 'POS'})`
            };
            await StorageService.saveCollection('transactions', txList);
         }
      }
    }
  },

  cancel: async (id, options = {}) => {
    let state = await StorageService.getAll();
    state = processUpdateOrderStatus(state, { payload: { orderId: id, status: 'Cancelled', skipTransaction: options.skipTransaction } });
    await StorageService.saveAll(state);
  },

  delete: async (id, options = {}) => {
    const list = await OrderApi.getAll();
    const i = list.findIndex(o => o.id === id);
    if (i !== -1 && !list[i].deleted) {
      const wasNotCancelled = list[i].status !== 'Cancelled';
      list[i] = { ...list[i], deleted: true, deletedAt: new Date().toISOString() };
      await StorageService.saveCollection('posOrders', list);

      if (wasNotCancelled) {
         // Auto-Refund Inventory
         const products = await StorageService.getCollection('products');
         const ingredients = await StorageService.getCollection('ingredients');
         let inventoryChanged = false;

         const adjustInventory = (recipe, quantityMultiplier) => {
             const updatedIngredients = adjustInventoryQuantity(ingredients, products, recipe, quantityMultiplier, false); // false = return to stock
             updatedIngredients.forEach((ing, idx) => { ingredients[idx] = ing; });
             inventoryChanged = true;
         };

         list[i].items?.forEach(cartItem => adjustInventory(cartItem.product?.recipe, cartItem.quantity));
         if (inventoryChanged) await StorageService.saveCollection('ingredients', ingredients);

         // Reverse transaction
         if (!options.skipTransaction) {
           const txList = await StorageService.getCollection('transactions');
           const accounts = await StorageService.getCollection('accounts');
           const originalTx = txList.find(t => 
               (t.relatedId === id || t.voucherCode === `PT-${id.slice(-6)}`) 
               && t.type === 'Thu'
           );

           if (originalTx) {
               txList.unshift({
                   id: StorageService.generateId('TX-'),
                   voucherCode: StorageService.generateId('PC-'),
                   type: 'Chi',
                   amount: Number(list[i].netAmount || 0) + (Number(list[i].extraFee) || 0),
                   accountId: originalTx.accountId,
                   categoryId: 'FC10',
                   categoryName: 'Điều chỉnh số dư',
                   date: new Date().toISOString(),
                   note: `Hoàn tiền xóa đơn hàng ${id}`,
                   relatedId: id,
                   status: 'Completed'
               });
               await StorageService.saveCollection('transactions', txList);

               const accIdx = accounts.findIndex(a => a.id === originalTx.accountId);
               if (accIdx !== -1) {
                   accounts[accIdx].balance = (Number(accounts[accIdx].balance) || 0) - (Number(list[i].netAmount || 0) + (Number(list[i].extraFee) || 0));
                   await StorageService.saveCollection('accounts', accounts);
               }
           }
         }
      }
    }
  },

  restore: async (id) => {
    const list = await OrderApi.getAll();
    const i = list.findIndex(o => o.id === id);
    if (i !== -1 && list[i].deleted) {
      const wasNotCancelled = list[i].status !== 'Cancelled';
      list[i] = { ...list[i], deleted: false, deletedAt: null, hiddenFromStaff: false };
      await StorageService.saveCollection('posOrders', list);

      if (wasNotCancelled) {
         // Re-deduct Inventory
         const products = await StorageService.getCollection('products');
         const ingredients = await StorageService.getCollection('ingredients');
         let inventoryChanged = false;

         const adjustInventory = (recipe, quantityMultiplier) => {
             const updatedIngredients = adjustInventoryQuantity(ingredients, products, recipe, quantityMultiplier, true); // true = deduct again
             updatedIngredients.forEach((ing, idx) => { ingredients[idx] = ing; });
             inventoryChanged = true;
         };

         list[i].items?.forEach(cartItem => adjustInventory(cartItem.product?.recipe, cartItem.quantity));
         if (inventoryChanged) await StorageService.saveCollection('ingredients', ingredients);

         // Re-apply transaction
         const txList = await StorageService.getCollection('transactions');
         const accounts = await StorageService.getCollection('accounts');
         
         // Find account based on channel/payment
         let targetAccountId = list[i].paymentMethodId || 'ACC1';
         if (!list[i].paymentMethodId) {
             if (list[i].channelName === 'ShopeeFood') targetAccountId = 'ACC3';
             if (list[i].channelName === 'GrabFood') targetAccountId = 'ACC4';
         }

         let accIdx = accounts.findIndex(a => a.id === targetAccountId);
         if (accIdx === -1) {
             accounts.push({ id: targetAccountId, name: 'Tài Khoản Phục Hồi', balance: 0, type: 'virtual', initialBalance: 0 });
             accIdx = accounts.length - 1;
         }

         txList.unshift({
             id: StorageService.generateId('TX-'),
             voucherCode: StorageService.generateId('PT-'),
             type: 'Thu',
             amount: Number(list[i].netAmount || 0) + (Number(list[i].extraFee) || 0),
             accountId: targetAccountId,
             categoryId: 'FC1',
             categoryName: 'Doanh thu bán hàng',
             date: new Date().toISOString(),
             note: `Phục hồi doanh thu đơn ${id}`,
             relatedId: id,
             status: 'Completed'
         });
         await StorageService.saveCollection('transactions', txList);

         accounts[accIdx].balance = (Number(accounts[accIdx].balance) || 0) + Number(list[i].netAmount || 0) + (Number(list[i].extraFee) || 0);
         await StorageService.saveCollection('accounts', accounts);
      }
    }
  },

  hardDelete: async (id) => {
    const list = await OrderApi.getAll();
    const updated = list.filter(o => o.id !== id);
    await StorageService.saveCollection('posOrders', updated);
    
    // Cleanup related transactions
    const txList = await StorageService.getCollection('transactions');
    const filteredTx = txList.filter(t => t.relatedId !== id);
    if (filteredTx.length !== txList.length) {
        await StorageService.saveCollection('transactions', filteredTx);
    }
  },

  bulkDelete: async (ids) => {
    for (const id of ids) await OrderApi.delete(id);
  },

  bulkRestore: async (ids) => {
    for (const id of ids) await OrderApi.restore(id);
  },

  bulkHardDelete: async (ids) => {
    const list = await OrderApi.getAll();
    const updated = list.filter(o => !ids.includes(o.id));
    await StorageService.saveCollection('posOrders', updated);
    
    const txList = await StorageService.getCollection('transactions');
    const filteredTx = txList.filter(t => !ids.includes(t.relatedId));
    if (filteredTx.length !== txList.length) {
        await StorageService.saveCollection('transactions', filteredTx);
    }
  }
};
