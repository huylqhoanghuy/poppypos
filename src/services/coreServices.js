export const generateId = (prefix) => prefix + Math.random().toString(36).substr(2, 5).toUpperCase();

export const adjustInventoryQuantity = (ingredients, products, recipe, quantityMultiplier, isDeduct) => {
  let updatedIngredients = [...ingredients];
  const processRecursion = (rec, mult) => {
    if (!rec) return;
    rec.forEach(recItem => {
      const subProduct = products?.find(p => p.id === recItem.ingredientId);
      if (subProduct) {
        const subQty = recItem.unitMode === 'divide' ? (1 / recItem.qty) : recItem.qty;
        processRecursion(subProduct.recipe, mult * subQty);
      } else {
        const ingIndex = updatedIngredients.findIndex(i => i.id === recItem.ingredientId);
        if (ingIndex !== -1) {
          const ing = updatedIngredients[ingIndex];
          let baseQty = recItem.qty;
          if (recItem.unitMode === 'buy') baseQty = recItem.qty * (ing.conversionRate || 1);
          if (recItem.unitMode === 'divide') baseQty = 1 / recItem.qty;

          const changeUnits = (baseQty * mult) / (ing.conversionRate || 1);
          updatedIngredients[ingIndex] = {
            ...ing,
            stock: isDeduct ? Math.max(0, ing.stock - changeUnits) : (ing.stock + changeUnits)
          };
        }
      }
    });
  };
  processRecursion(recipe, quantityMultiplier);
  return updatedIngredients;
};

export const processTransferFunds = (state, action) => {
  const { fromId, toId, amount, fee, note, date } = action.payload;
  const transferDate = date || new Date().toISOString();
  const transferAmount = Number(amount);
  const transferFee = Number(fee || 0);

  const outTransaction = {
    id: generateId('GD-'),
    voucherCode: generateId('PC-'),
    date: transferDate,
    type: 'Chi',
    categoryId: 'FC9',
    accountId: fromId,
    amount: transferAmount + transferFee,
    note: `[LUÂN CHUYỂN] Chuyển đến ví khác. ${note || ''}`,
    collector: 'Nội bộ',
    payer: 'Hệ thống'
  };

  const inTransaction = {
    id: generateId('GD-'),
    voucherCode: generateId('PT-'),
    date: transferDate,
    type: 'Thu',
    categoryId: 'FC9',
    accountId: toId,
    amount: transferAmount,
    note: `[LUÂN CHUYỂN] Nhận từ ví khác. ${note || ''}`,
    collector: 'Hệ thống',
    payer: 'Nội bộ'
  };

  return {
    ...state,
    transactions: [outTransaction, inTransaction, ...state.transactions],
    accounts: state.accounts.map(acc => {
      if (acc.id === fromId) return { ...acc, balance: acc.balance - (transferAmount + transferFee) };
      if (acc.id === toId) return { ...acc, balance: acc.balance + transferAmount };
      return acc;
    })
  };
};

export const processAddPurchaseOrder = (state, action) => {
  const order = action.payload;
  const newPO = { ...order, id: generateId('NK-'), date: new Date().toISOString() };

  let updatedIngredients = [...state.ingredients];
  if (newPO.status !== 'Pending') {
    order.items.forEach(poItem => {
      const ingIndex = updatedIngredients.findIndex(i => i.id === poItem.ingredientId);
      if (ingIndex !== -1) {
        const ing = updatedIngredients[ingIndex];
        const conv = Number(ing.conversionRate) || 1;
        const newStock = ing.stock + poItem.baseQty;
        const itemTotal = poItem.itemTotal || (poItem.cost * poItem.baseQty);

        const oldTotalCost = ing.stock * ((ing.cost || 0) * conv);
        const newTotalCost = oldTotalCost + itemTotal;
        const avgCostPerUsageUnit = newTotalCost / (newStock * conv || 1);

        updatedIngredients[ingIndex] = { ...ing, stock: newStock, cost: avgCostPerUsageUnit, buyPrice: avgCostPerUsageUnit * conv };
      }
    });
  }

  let updatedSuppliers = [...state.suppliers];
  if (newPO.status === 'Debt' && newPO.supplierId) {
    const sIdx = updatedSuppliers.findIndex(s => s.id === newPO.supplierId);
    if (sIdx !== -1) {
      updatedSuppliers[sIdx] = { ...updatedSuppliers[sIdx], debt: (updatedSuppliers[sIdx].debt || 0) + newPO.totalAmount };
    }
  }

  const newState = { ...state, purchaseOrders: [...state.purchaseOrders, newPO], ingredients: updatedIngredients, suppliers: updatedSuppliers };

  if (newPO.status === 'Paid') {
    const transaction = {
      id: generateId('GD-'),
      voucherCode: generateId('PC-'),
      date: newPO.date,
      type: 'Chi',
      amount: newPO.totalAmount,
      accountId: 'ACC1',
      categoryId: 'FC4',
      note: `XUẤT QUỸ: Nhập hàng trả luôn (${newPO.id})`,
      collector: state.suppliers.find(s => s.id === newPO.supplierId)?.name || 'Nhà Cung Cấp',
      relatedId: newPO.id
    };
    newState.transactions = [transaction, ...state.transactions];
    newState.accounts = state.accounts.map(acc =>
      acc.id === 'ACC1' ? { ...acc, balance: acc.balance - newPO.totalAmount } : acc
    );
  }
  return newState;
};

export const processUpdatePurchaseOrderStatus = (state, action) => {
  const { id, status } = action.payload;
  const po = state.purchaseOrders.find(p => p.id === id);
  if (!po || po.status === status) return state;

  const wasPending = po.status === 'Pending';
  const updatedPOs = state.purchaseOrders.map(p => p.id === id ? { ...p, status } : p);
  let newState = { ...state, purchaseOrders: updatedPOs };

  if (wasPending && (status === 'Paid' || status === 'Debt')) {
      let updatedIngredients = [...newState.ingredients];
      po.items.forEach(poItem => {
        const ingIndex = updatedIngredients.findIndex(i => i.id === poItem.ingredientId);
        if (ingIndex !== -1) {
          const ing = updatedIngredients[ingIndex];
          const conv = Number(ing.conversionRate) || 1;
          const newStock = ing.stock + poItem.baseQty;
          const itemTotal = poItem.itemTotal || (poItem.cost * poItem.baseQty);
          const oldTotalCost = ing.stock * ((ing.cost || 0) * conv);
          const newTotalCost = oldTotalCost + itemTotal;
          const avgCostPerUsageUnit = newTotalCost / (newStock * conv || 1);
          updatedIngredients[ingIndex] = { ...ing, stock: newStock, cost: avgCostPerUsageUnit, buyPrice: avgCostPerUsageUnit * conv };
        }
      });
      newState.ingredients = updatedIngredients;

      if (status === 'Debt' && po.supplierId) {
         let updatedSuppliers = [...newState.suppliers];
         const sIdx = updatedSuppliers.findIndex(s => s.id === po.supplierId);
         if (sIdx !== -1) {
           updatedSuppliers[sIdx] = { ...updatedSuppliers[sIdx], debt: (updatedSuppliers[sIdx].debt || 0) + po.totalAmount };
         }
         newState.suppliers = updatedSuppliers;
      }
  }

  if (status === 'Paid') {
    const tData = action.payload.transactionData || {};
    const transaction = {
      id: generateId('GD-'),
      voucherCode: tData.voucherCode || generateId('PC-'),
      date: tData.date || new Date().toISOString(),
      type: 'Chi',
      amount: tData.amount || po.totalAmount,
      accountId: tData.accountId || 'ACC1',
      categoryId: tData.categoryId || 'FC4',
      note: tData.note || `XUẤT QUỸ BÙ NỢ: Thanh toán công nợ hóa đơn nhập (${po.id})`,
      collector: tData.collector || state.suppliers.find(s => s.id === po.supplierId)?.name || 'Nhà Cung Cấp',
      relatedId: po.id
    };
    newState.transactions = [transaction, ...state.transactions];
    newState.accounts = state.accounts.map(acc =>
      acc.id === 'ACC1' ? { ...acc, balance: acc.balance - po.totalAmount } : acc
    );
    if (po.supplierId && po.status === 'Debt') {
      newState.suppliers = state.suppliers.map(s => 
        s.id === po.supplierId ? { ...s, debt: Math.max(0, (s.debt || 0) - po.totalAmount) } : s
      );
    }
  }
  return newState;
};

export const processDeletePurchaseOrder = (state, action) => {
  const poId = action.payload;
  const po = state.purchaseOrders.find(p => p.id === poId);
  if (!po) return state;

  let updatedIngredients = [...state.ingredients];
  po.items.forEach(poItem => {
    const ingIndex = updatedIngredients.findIndex(i => i.id === poItem.ingredientId);
    if (ingIndex !== -1) {
      const ing = updatedIngredients[ingIndex];
      updatedIngredients[ingIndex] = { ...ing, stock: Math.max(0, ing.stock - poItem.baseQty) };
    }
  });

  const remainingPOs = state.purchaseOrders.filter(p => p.id !== poId);
  const newState = { ...state, purchaseOrders: remainingPOs, ingredients: updatedIngredients };

  if (po.status === 'Paid') {
    const transaction = {
      id: generateId('GD-'),
      voucherCode: generateId('PT-'),
      date: new Date().toISOString(),
      type: 'Thu',
      amount: po.totalAmount,
      accountId: 'ACC1',
      categoryId: 'FC10',
      note: `HOÀN QUỸ KHO: Xóa phiếu nhập/Khử trả hàng (${po.id})`,
      payer: state.suppliers.find(s => s.id === po.supplierId)?.name || 'Nhà Cung Cấp',
      relatedId: po.id
    };
    newState.transactions = [transaction, ...state.transactions];
    newState.accounts = state.accounts.map(acc =>
      acc.id === 'ACC1' ? { ...acc, balance: acc.balance + po.totalAmount } : acc
    );
  }
  return newState;
};

export const processAddPosOrder = (state, action) => {
  const order = action.payload;
  const newOrder = {
    id: order.orderCode || generateId('DH-'),
    customerName: order.customerName || '',
    customerPhone: order.customerPhone || '',
    extraFee: order.extraFee || 0,
    extraFeeNote: order.extraFeeNote || '',
    ...order,
    date: new Date().toISOString(),
    status: order.status || 'Pending'
  };

  let updatedIngredients = [...state.ingredients];
  order.items.forEach(cartItem => {
    updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, cartItem.product.recipe, cartItem.quantity, true);
  });

  let targetAccountId = 'ACC1';
  if (newOrder.channelName === 'ShopeeFood') targetAccountId = 'ACC3';
  if (newOrder.channelName === 'GrabFood') targetAccountId = 'ACC4';

  const transaction = {
    id: generateId('GD-'),
    voucherCode: generateId('PT-'),
    date: newOrder.date,
    type: 'Thu',
    categoryId: 'FC1',
    accountId: targetAccountId,
    amount: newOrder.netAmount + (Number(newOrder.extraFee) || 0),
    note: `Doanh thu POS - Kênh: ${newOrder.channelName || 'Trực tiếp'}`,
    payer: newOrder.customerName || 'Khách vãng lai',
    relatedId: newOrder.id
  };

  return {
    ...state,
    posOrders: [{ ...newOrder, accountId: targetAccountId }, ...state.posOrders],
    ingredients: updatedIngredients,
    transactions: [transaction, ...state.transactions],
    accounts: state.accounts.map(acc => {
      if (acc.id === targetAccountId) {
        return { ...acc, balance: acc.balance + transaction.amount };
      }
      return acc;
    })
  };
};

export const processUpdateOrderStatus = (state, action) => {
  const { orderId, status } = action.payload;
  const order = state.posOrders.find(o => o.id === orderId);
  if (!order || order.status === status) return state;

  let updatedIngredients = [...state.ingredients];
  let newTransactions = [...state.transactions];
  let newAccounts = [...state.accounts];

  let targetAccountId = 'ACC1';
  if (order.channelName === 'ShopeeFood') targetAccountId = 'ACC3';
  if (order.channelName === 'GrabFood') targetAccountId = 'ACC4';
  const orderTotalMoney = (order.netAmount || 0) + (Number(order.extraFee) || 0);

  if (status === 'Cancelled') {
    order.items.forEach(item => {
       updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, item.product.recipe, item.quantity, false);
    });

    const refundTx = {
      id: generateId('GD-'),
      date: new Date().toISOString(),
      type: 'Chi',
      categoryId: 'FC1',
      accountId: targetAccountId,
      amount: orderTotalMoney,
      note: `HOÀN TIỀN: Khách hủy đơn POS (${order.id})`,
    };
    newTransactions = [refundTx, ...newTransactions];
    newAccounts = newAccounts.map(acc =>
      acc.id === targetAccountId ? { ...acc, balance: acc.balance - orderTotalMoney } : acc
    );
  }
  else if (order.status === 'Cancelled') {
    order.items.forEach(item => {
       updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, item.product.recipe, item.quantity, true);
    });

    const rechargeTx = {
      id: generateId('GD-'),
      date: new Date().toISOString(),
      type: 'Thu',
      categoryId: 'FC1',
      accountId: targetAccountId,
      amount: orderTotalMoney,
      note: `THU LẠI TIỀN: Phục hồi đơn POS (${order.id})`,
    };
    newTransactions = [rechargeTx, ...newTransactions];
    newAccounts = newAccounts.map(acc =>
      acc.id === targetAccountId ? { ...acc, balance: acc.balance + orderTotalMoney } : acc
    );
  }

  return {
    ...state,
    ingredients: updatedIngredients,
    posOrders: state.posOrders.map(o => o.id === orderId ? { ...o, status } : o),
    transactions: newTransactions,
    accounts: newAccounts
  };
};

export const processHardDeletePosOrder = (state, action) => {
  const orderId = action.payload;
  const order = state.posOrders.find(o => o.id === orderId);
  if (!order) return state;

  let updatedIngredients = [...state.ingredients];
  if (order.status !== 'Cancelled') {
    order.items.forEach(item => {
       updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, item.product.recipe, item.quantity, false);
    });
  }

  return {
    ...state,
    ingredients: updatedIngredients,
    posOrders: state.posOrders.filter(o => o.id !== orderId)
  };
};

export const processConfirmImportOrders = (state, action) => {
  const { orders } = action.payload;
  let newTransactions = [];
  let updatedIngredients = [...(state.ingredients || [])];
  const timestamp = new Date().getTime();

  orders.forEach((ord, index) => {
     newTransactions.push({
        id: `TX-IMP-${timestamp}-${ord.id.slice(-6)}-${index}`,
        date: ord.date,
        type: 'Thu',
        amount: ord.netAmount,
        accountId: ord.accountId,
        categoryId: 'FC1',
        note: `${ord.channelName} Order: ${ord.orderCode}`,
        voucherCode: `PT-${ord.id.slice(-6)}`,
        collector: 'System'
     });

     ord.items.forEach(item => {
         let latestProduct = state.products?.find(p => p.name.toLowerCase() === item.product?.name?.toLowerCase());
         if (latestProduct && latestProduct.recipe) {
             updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, latestProduct.recipe, item.quantity, true);
         } else if (item.product?.recipe) {
             updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, item.product.recipe, item.quantity, true);
         }
     });
  });

  return {
    ...state,
    ingredients: updatedIngredients,
    posOrders: [...orders, ...state.posOrders],
    transactions: [...newTransactions, ...state.transactions],
    accounts: state.accounts.map(acc => {
      const income = newTransactions.filter(t => t.accountId === acc.id).reduce((sum, t) => sum + t.amount, 0);
      return income > 0 ? { ...acc, balance: acc.balance + income } : acc;
    })
  };
};
