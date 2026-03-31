import { StorageService } from './storage';

export const OrderApi = {
  getAll: async () => {
    return await StorageService.getCollection('posOrders');
  },
  
  add: async (order) => {
    const list = await OrderApi.getAll();
    const newDoc = { 
      ...order, 
      id: StorageService.generateId('ORD-')
    };
    list.unshift(newDoc);
    await StorageService.saveCollection('posOrders', list);

    // ===================================
    // 1. TỰ ĐỘNG TRỪ KHO NGUYÊN LIỆU (ĐỆ QUY)
    // ===================================
    if (order.status !== 'Cancelled') {
      const products = await StorageService.getCollection('products');
      const ingredients = await StorageService.getCollection('ingredients');
      let inventoryChanged = false;

      const adjustInventory = (recipe, quantityMultiplier) => {
        if (!recipe) return;
        recipe.forEach(recItem => {
          const subProduct = products.find(p => p.id === recItem.ingredientId);
          if (subProduct) {
            const subQty = recItem.unitMode === 'divide' ? (1 / recItem.qty) : recItem.qty;
            adjustInventory(subProduct.recipe, quantityMultiplier * subQty);
          } else {
            const ingIndex = ingredients.findIndex(i => i.id === recItem.ingredientId);
            if (ingIndex !== -1) {
              const ing = ingredients[ingIndex];
              let baseQty = recItem.qty;
              if (recItem.unitMode === 'buy') baseQty = recItem.qty * (ing.conversionRate || 1);
              if (recItem.unitMode === 'divide') baseQty = 1 / recItem.qty;

              const consumedBuyUnits = (baseQty * quantityMultiplier) / (ing.conversionRate || 1);
              ingredients[ingIndex] = { ...ing, stock: Math.max(0, ing.stock - consumedBuyUnits) };
              inventoryChanged = true;
            }
          }
        });
      };

      order.items?.forEach(cartItem => {
        adjustInventory(cartItem.product?.recipe, cartItem.quantity);
      });

      if (inventoryChanged) {
        await StorageService.saveCollection('ingredients', ingredients);
      }
    }

    // ===================================
    // 2. GHI NHẬN DOANH THU & CỘNG TIỀN VÍ
    // ===================================
    if (order.status !== 'Cancelled') {
      const txList = await StorageService.getCollection('transactions');
      const accounts = await StorageService.getCollection('accounts');
      
      // Map paymentMethodId or channelId to target account (Fallback: ACC1 = Tiền mặt)
      let targetAccountId = order.paymentMethodId || 'ACC1';
      if (!order.paymentMethodId) {
          if (order.channelName === 'ShopeeFood') targetAccountId = 'ACC3'; // Giả sử ACC3 là Shopee
          if (order.channelName === 'GrabFood') targetAccountId = 'ACC4'; // Giả sử ACC4 là Grab
      }
      
      txList.unshift({
          id: StorageService.generateId('TX-'),
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
      await StorageService.saveCollection('transactions', txList);

      const accIdx = accounts.findIndex(a => a.id === targetAccountId);
      if (accIdx !== -1) {
          accounts[accIdx].balance = (Number(accounts[accIdx].balance) || 0) + Number(order.netAmount || 0) + (Number(order.extraFee) || 0);
          await StorageService.saveCollection('accounts', accounts);
      }
    }

    return newDoc;
  },

  update: async (order) => {
    const list = await OrderApi.getAll();
    const i = list.findIndex(o => o.id === order.id);
    if (i !== -1) {
      list[i] = order;
      await StorageService.saveCollection('posOrders', list);
    }
  },

  cancel: async (id) => {
    const list = await OrderApi.getAll();
    const i = list.findIndex(o => o.id === id);
    if (i !== -1 && list[i].status !== 'Cancelled') {
      list[i] = { ...list[i], status: 'Cancelled' };
      await StorageService.saveCollection('posOrders', list);

      // ===================================
      // 1. TỰ ĐỘNG HOÀN KHO NGUYÊN LIỆU (ĐỆ QUY)
      // ===================================
      const products = await StorageService.getCollection('products');
      const ingredients = await StorageService.getCollection('ingredients');
      let inventoryChanged = false;

      const adjustInventory = (recipe, quantityMultiplier) => {
        if (!recipe) return;
        recipe.forEach(recItem => {
          const subProduct = products.find(p => p.id === recItem.ingredientId);
          if (subProduct) {
            const subQty = recItem.unitMode === 'divide' ? (1 / recItem.qty) : recItem.qty;
            adjustInventory(subProduct.recipe, quantityMultiplier * subQty);
          } else {
            const ingIndex = ingredients.findIndex(j => j.id === recItem.ingredientId);
            if (ingIndex !== -1) {
              const ing = ingredients[ingIndex];
              let baseQty = recItem.qty;
              if (recItem.unitMode === 'buy') baseQty = recItem.qty * (ing.conversionRate || 1);
              if (recItem.unitMode === 'divide') baseQty = 1 / recItem.qty;

              const returnBuyUnits = (baseQty * quantityMultiplier) / (ing.conversionRate || 1);
              ingredients[ingIndex] = { ...ing, stock: ing.stock + returnBuyUnits };
              inventoryChanged = true;
            }
          }
        });
      };

      list[i].items?.forEach(cartItem => {
        adjustInventory(cartItem.product?.recipe, cartItem.quantity);
      });

      if (inventoryChanged) {
        await StorageService.saveCollection('ingredients', ingredients);
      }

      // Sinh phiếu CHI hoàn tiền
      const txList = await StorageService.getCollection('transactions');
      const accounts = await StorageService.getCollection('accounts');
      
      const originalTx = txList.find(t => t.relatedId === id && t.type === 'Thu');

      if (originalTx) {
          txList.unshift({
              id: StorageService.generateId('TX-'),
              type: 'Chi',
              amount: Number(list[i].netAmount || 0),
              accountId: originalTx.accountId,
              categoryId: 'FC10',
              categoryName: 'Điều chỉnh số dư',
              date: new Date().toISOString(),
              note: `Hoàn tiền khách hủy đơn ${id}`,
              relatedId: id,
              status: 'Completed'
          });
          await StorageService.saveCollection('transactions', txList);

          const accIdx = accounts.findIndex(a => a.id === originalTx.accountId);
          if (accIdx !== -1) {
              accounts[accIdx].balance = (Number(accounts[accIdx].balance) || 0) - Number(list[i].netAmount || 0);
              await StorageService.saveCollection('accounts', accounts);
          }
      }
    }
  },

  delete: async (id) => {
    const list = await OrderApi.getAll();
    const updated = list.filter(o => o.id !== id);
    await StorageService.saveCollection('posOrders', updated);
  }
};
