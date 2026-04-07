import { inferItemsFromPrice } from '../utils/csvParser';

export const generateId = (prefix) => {
  if (typeof window !== 'undefined') {
    window._idCounter = ((window._idCounter || 0) + 1) % 1296; 
    const dt = Date.now().toString(36).toUpperCase().slice(-4); 
    const rnd = Math.random().toString(36).substring(2, 4).toUpperCase(); 
    const cnt = window._idCounter.toString(36).toUpperCase().padStart(2, '0'); 
    return prefix + dt + rnd + cnt;
  }
  return prefix + Date.now().toString(36).toUpperCase().slice(-4) + Math.random().toString(36).substring(2, 6).toUpperCase();
};

export const adjustInventoryQuantity = (ingredients, products, recipe, quantityMultiplier, isDeduct) => {
  let updatedIngredients = [...ingredients];
  if (!window._debugInvs) window._debugInvs = []; // Tracing logs for QA
  
  const parseSafeNumber = (val) => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const strVal = String(val).replace(/,/g, '.');
    const num = Number(strVal);
    return isNaN(num) ? 0 : num;
  };

  const processRecursion = (rec, mult) => {
    if (!rec) return;
    rec.forEach(recItem => {
      const subProduct = products?.find(p => p.id === recItem.ingredientId);
      if (subProduct) {
        const itemQty = parseSafeNumber(recItem.qty);
        const subQty = recItem.unitMode === 'divide' ? (itemQty ? 1 / itemQty : 0) : itemQty;
        window._debugInvs.push(`[Tracer] Xuyên thấu Bán Thành Phẩm: ${subProduct.name}. Hệ số: ${subQty}`);
        processRecursion(subProduct.recipe, mult * subQty);
      } else {
        const ingIndex = updatedIngredients.findIndex(i => i.id === recItem.ingredientId);
        if (ingIndex !== -1) {
          const ing = updatedIngredients[ingIndex];
          let baseQty = parseSafeNumber(recItem.qty);
          const convRate = parseSafeNumber(ing.conversionRate) || 1;
          
          if (recItem.unitMode === 'buy') baseQty = baseQty * convRate;
          if (recItem.unitMode === 'divide') baseQty = baseQty ? 1 / baseQty : 0;

          const changeUnits = (baseQty * mult) / convRate;
          const currentStock = parseSafeNumber(ing.stock);
          
          const newStock = isDeduct ? Math.max(0, currentStock - changeUnits) : (currentStock + changeUnits);
          window._debugInvs.push(`[Tracer] OK ${ing.name}: Kho cũ ${currentStock} -> Kho mới ${newStock} (+/- ${changeUnits})`);
          
          updatedIngredients[ingIndex] = {
            ...ing,
            stock: newStock
          };

        } else {
          window._debugInvs.push(`[Tracer] THẤT BẠI: Không tìm thấy Nguyên liệu gốc mang ID ${recItem.ingredientId}`);
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

  // eslint-disable-next-line no-unused-vars
  const wasPending = po.status === 'Pending';
  const updatedPOs = state.purchaseOrders.map(p => p.id === id ? { ...p, status } : p);
  let newState = { ...state, purchaseOrders: updatedPOs };

  if (status === 'Paid') {
    const tData = action.payload.transactionData || {};
    const transactionAmount = tData.amount || po.totalAmount;

    const transaction = {
      id: generateId('GD-'),
      voucherCode: tData.voucherCode || generateId('PC-'),
      date: tData.date || new Date().toISOString(),
      type: 'Chi',
      amount: transactionAmount,
      accountId: tData.accountId || 'ACC1',
      categoryId: tData.categoryId || 'FC4',
      note: tData.note || `XUẤT QUỸ BÙ NỢ: Thanh toán công nợ hóa đơn nhập (${po.id})`,
      collector: tData.collector || state.suppliers.find(s => s.id === po.supplierId)?.name || 'Nhà Cung Cấp',
      relatedId: po.id
    };
    newState.transactions = [transaction, ...state.transactions];
    newState.accounts = state.accounts.map(acc =>
      acc.id === transaction.accountId ? { ...acc, balance: acc.balance - transactionAmount } : acc
    );

    // Giảm trừ nợ nếu PO trước đó là nợ (Pending hoặc Debt đều đóng vai trò là ghi nợ với phiên bản mới)
    if (po.supplierId && (po.status === 'Debt' || po.status === 'Pending')) {
      newState.suppliers = state.suppliers.map(s =>
        s.id === po.supplierId ? { ...s, debt: Math.max(0, (s.debt || 0) - transactionAmount) } : s
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
    const originalTx = state.transactions.find(t => t.relatedId === poId && t.type === 'Chi');
    const targetAccountId = originalTx ? originalTx.accountId : 'ACC1';

    const transaction = {
      id: generateId('GD-'),
      voucherCode: generateId('PT-'),
      date: new Date().toISOString(),
      type: 'Thu',
      amount: po.totalAmount,
      accountId: targetAccountId,
      categoryId: 'FC10',
      note: `HOÀN QUỸ KHO: Xóa phiếu nhập/Khử trả hàng (${po.id})`,
      payer: state.suppliers.find(s => s.id === po.supplierId)?.name || 'Nhà Cung Cấp',
      relatedId: po.id
    };
    newState.transactions = [transaction, ...state.transactions];
    newState.accounts = state.accounts.map(acc =>
      acc.id === targetAccountId ? { ...acc, balance: acc.balance + po.totalAmount } : acc
    );
  }
  return newState;
};

export const processAddPosOrder = (state, action) => {
  const order = action.payload;
  const newOrder = {
    id: generateId('DH-'),
    customerName: order.customerName || '',
    customerPhone: order.customerPhone || '',
    extraFee: order.extraFee || 0,
    extraFeeNote: order.extraFeeNote || '',
    paymentStatus: order.paymentStatus || 'Paid',
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
  if (!state.accounts?.find(a => a.id === targetAccountId)) {
    targetAccountId = state.accounts && state.accounts.length > 0 ? state.accounts[0].id : 'ACC1';
  }

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

  const newState = {
    ...state,
    posOrders: [{ ...newOrder, accountId: targetAccountId }, ...state.posOrders],
    ingredients: updatedIngredients,
    transactions: state.transactions,
    accounts: state.accounts
  };

  // Chỉ thu tiền vào quỹ nếu không phải là Ghi Nợ
  if (newOrder.paymentStatus !== 'Debt') {
    newState.transactions = [transaction, ...state.transactions];
    newState.accounts = state.accounts.map(acc => {
      if (acc.id === targetAccountId) {
        return { ...acc, balance: acc.balance + transaction.amount };
      }
      return acc;
    });
  }

  return newState;
};

export const processUpdateOrderStatus = (state, action) => {
  const { orderId, status, skipTransaction } = action.payload;
  const order = state.posOrders.find(o => o.id === orderId);
  if (!order || order.status === status) return state;

  let updatedIngredients = [...state.ingredients];
  let newTransactions = [...state.transactions];
  let newAccounts = [...state.accounts];

  let targetAccountId = 'ACC1';
  if (order.channelName === 'ShopeeFood') targetAccountId = 'ACC3';
  if (order.channelName === 'GrabFood') targetAccountId = 'ACC4';
  if (!state.accounts?.find(a => a.id === targetAccountId)) {
    targetAccountId = state.accounts && state.accounts.length > 0 ? state.accounts[0].id : 'ACC1';
  }
  const orderTotalMoney = (order.netAmount || 0) + (Number(order.extraFee) || 0);

  if (status === 'Cancelled') {
    order.items.forEach(item => {
      updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, item.product.recipe, item.quantity, false);
    });

    if (order.paymentStatus !== 'Debt' && !skipTransaction) {
      const refundTx = {
        id: generateId('GD-'),
        voucherCode: generateId('PC-'),
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
  }
  else if (order.status === 'Cancelled') {
    order.items.forEach(item => {
      updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, item.product.recipe, item.quantity, true);
    });

    if (order.paymentStatus !== 'Debt' && !skipTransaction) {
      const rechargeTx = {
        id: generateId('GD-'),
        voucherCode: generateId('PT-'),
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

  // Find EXACTLY ONE order index
  const oIndex = state.posOrders.findIndex(o => o.id === orderId);
  if (oIndex === -1) return state;

  const order = state.posOrders[oIndex];

  let updatedIngredients = [...state.ingredients];
  if (order.status !== 'Cancelled') {
    order.items.forEach(item => {
      updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, item.product.recipe, item.quantity, false);
    });
  }

  // Find EXACTLY ONE related transaction
  const tIndex = state.transactions.findIndex(t =>
    (t.relatedId === orderId || t.voucherCode === `PT-${orderId.slice(-6)}`)
    && t.type === 'Thu'
  );

  let updatedTransactions = [...state.transactions];
  let updatedAccounts = state.accounts;

  if (tIndex !== -1) {
    const relatedTx = updatedTransactions[tIndex];
    updatedTransactions.splice(tIndex, 1);

    updatedAccounts = state.accounts.map(acc =>
      acc.id === relatedTx.accountId ? { ...acc, balance: acc.balance - relatedTx.amount } : acc
    );
  }

  const updatedOrders = [...state.posOrders];
  updatedOrders.splice(oIndex, 1);

  return {
    ...state,
    ingredients: updatedIngredients,
    posOrders: updatedOrders,
    transactions: updatedTransactions,
    accounts: updatedAccounts
  };
};

export const processConfirmImportOrders = (state, action) => {
  const { orders } = action.payload;
  let newTransactions = [];
  let updatedIngredients = [...(state.ingredients || [])];

  // Primary Key Isolation: Sinh mã an toàn cho từng đơn import, giữ nguyên mã gốc ở orderCode
  const mappedOrders = orders.map(ord => ({
    ...ord,
    id: generateId('ORD-IMP-')
  }));

  mappedOrders.forEach((ord, index) => {
    let accId = ord.accountId;
    if (!state.accounts?.find(a => a.id === accId)) {
      accId = state.accounts && state.accounts.length > 0 ? state.accounts[0].id : 'ACC1';
    }

    newTransactions.push({
      id: generateId('TX-IMP-'),
      date: ord.date,
      type: 'Thu',
      amount: ord.netAmount,
      accountId: accId,
      categoryId: 'FC1',
      note: `${ord.channelName} Order: ${ord.orderCode || ord.id}`,
      voucherCode: generateId('PT-'),
      collector: 'System',
      relatedId: ord.id
    });

    ord.items.forEach(item => {
      let latestProduct = null;
      if (item.product?.name) {
        latestProduct = state.products?.find(p => p.name?.toLowerCase() === item.product.name.toLowerCase());
      }
      if (latestProduct && latestProduct.recipe) {
        updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, latestProduct.recipe, item.quantity, true);
      } else if (item.product?.recipe) {
        updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, item.product.recipe, item.quantity, true);
      }
    });
  });

  return {
    ...state,
    _skipSave: false, // Bắt buộc lưu toàn bộ state sau khi Import thành công vì đụng chạm tới 4 bảng
    ingredients: updatedIngredients,
    posOrders: [...mappedOrders, ...state.posOrders],
    transactions: [...newTransactions, ...state.transactions],
    accounts: state.accounts.map(acc => {
      const income = newTransactions.filter(t => t.accountId === acc.id).reduce((sum, t) => sum + t.amount, 0);
      return income > 0 ? { ...acc, balance: acc.balance + income } : acc;
    })
  };
};

export const processDeleteTransaction = (state, action) => {
  const transaction = state.transactions.find(t => t.id === action.payload);
  if (!transaction || transaction.deleted) return state;

  let updatedPOs = [...state.purchaseOrders];
  let updatedSuppliers = [...state.suppliers];
  let updatedPosOrders = [...state.posOrders];
  let updatedIngredients = [...state.ingredients];

  // RULE 3: Xóa Phiếu Chi (Nhập Kho) -> Hủy Phiếu Nhập Kho, Trừ Dữ Liệu Nguyên Liệu & Công Nợ
  if (transaction.relatedId && (transaction.relatedId.startsWith('PO-') || transaction.relatedId.startsWith('NK-'))) {
    const poIdx = updatedPOs.findIndex(p => p.id === transaction.relatedId);
    if (poIdx !== -1) {
      const po = updatedPOs[poIdx];

      // Trừ lại hàng hóa trong kho (Xóa Phiếu Nhập = Hủy Nhập)
      po.items?.forEach(poItem => {
        const ingIndex = updatedIngredients.findIndex(i => i.id === poItem.ingredientId);
        if (ingIndex !== -1) {
          const ing = updatedIngredients[ingIndex];
          updatedIngredients[ingIndex] = { ...ing, stock: Math.max(0, (ing.stock || 0) - poItem.baseQty) };
        }
      });

      // Giảm công nợ Supplier nếu Phiếu Nhập là Debt/Pending
      const supplierId = po.supplierId;
      if (supplierId && (po.status === 'Debt' || po.status === 'Pending')) {
        const sIdx = updatedSuppliers.findIndex(s => s.id === supplierId);
        if (sIdx !== -1) {
          updatedSuppliers[sIdx] = { ...updatedSuppliers[sIdx], debt: Math.max(0, (updatedSuppliers[sIdx].debt || 0) - po.totalAmount) };
        }
      }

      // Xóa sổ (Hard Delete) Phiếu Nhập này
      updatedPOs.splice(poIdx, 1);
    }
  }
  // RULE 2: Xóa Phiếu Thu (Bán Hàng) -> Xử lý Đơn, Thực Đơn, Món, Nguyên Liệu Kho (Và cả dịch ngược bằng AI nếu mất đơn)
  else if (transaction.relatedId && (transaction.relatedId.startsWith('ORD-') || transaction.relatedId.startsWith('POS-') || transaction.relatedId.startsWith('DH-') || transaction.relatedId.startsWith('GF-') || transaction.relatedId.startsWith('SF-'))) {

    const oIdx = updatedPosOrders.findIndex(o => o.id === transaction.relatedId);

    // Xác thực tính toàn vẹn của Link: Số tiền phiếu thu phải KHỚP với số tiền đơn hàng (dung sai 100đ do làm tròn)
    let isCorrectLink = false;
    if (oIdx !== -1) {
       const orderNetAmount = updatedPosOrders[oIdx].netAmount || updatedPosOrders[oIdx].totalAmount || 0;
       if (Math.abs(transaction.amount - orderNetAmount) < 100) {
           isCorrectLink = true;
       }
    }

    if (isCorrectLink && updatedPosOrders[oIdx].status !== 'Cancelled') {
      // Trường hợp 1: Có đơn thật (Normal Flow) - Khớp cả ID và Số tiền
      updatedPosOrders[oIdx] = { ...updatedPosOrders[oIdx], status: 'Cancelled' };
      const orderItems = updatedPosOrders[oIdx].items || [];
      window._debugInvs = []; // Initialize tracer
      
      let restoredNames = orderItems.map(item => `${item.quantity || item.qty} ${item.product?.name || 'Món'}`).join(' + ');
      
      orderItems.forEach(item => {
        updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, item.product?.recipe, item.quantity || item.qty || 1, false);
      });
      
      setTimeout(() => alert(`--- SYSTEM REPORT: HỦY ĐƠN CHUẨN ---\nĐã hủy đơn ${transaction.relatedId}\nMón được trả lại: ${restoredNames}\nThay đổi Kho: \n${window._debugInvs.join('\n')}`), 500);

    } else if (!isCorrectLink || oIdx === -1) {
      // Trường hợp 2: PHIẾU THU "MA" hoặc LINK BỊ HỎNG (Có Ref ID nhưng sai lệch số tiền) -> Vớt Data Healer!
      let channelName = 'POS';
      if (transaction.note) {
        const match = transaction.note.match(/\((.*?)\)/);
        if (match) channelName = match[1];
      }
      let commission = 0;
      if (channelName && channelName !== 'POS') {
        const channels = state.salesChannels || [];
        const channel = channels.find(c => c.name === channelName || channelName.includes(c.name));
        if (channel) commission = channel.commission || channel.discountRate || 0;
      }

      const grossValue = transaction.amount / (1 - (commission / 100)); // Ví dụ: 114239 / 0.71 = 160900

      const matchedItems = inferItemsFromPrice(grossValue, state.products || []);

      if (matchedItems && matchedItems.length > 0) {
        window._debugInvs = [];
        let restoredNames = matchedItems.map(m => `${m.quantity} ${m.product?.name || 'Món'}`).join(' + ');
        matchedItems.forEach(itemInfo => {
          updatedIngredients = adjustInventoryQuantity(updatedIngredients, state.products, itemInfo.product?.recipe, itemInfo.quantity || 1, false);
        });
        
        const successNotif = {
            id: 'NOT_' + Date.now().toString(36) + Math.random().toString(36).substring(2,5),
            title: 'Phục hồi Kho: Data Healer',
            message: `Đã dịch ngược Phiếu Thu ${transaction.amount.toLocaleString()}đ thành: [${restoredNames}]. Tracer: ${window._debugInvs.join(' | ')}`,
            type: 'info',
            isRead: false,
            timestamp: new Date().toISOString()
        };
        // Ensure notifications array exists
        if (!state.notifications) state.notifications = [];
        state.notifications.unshift(successNotif);

        setTimeout(() => alert(`--- DATA HEALER REPORT ---\nMón được khớp: ${restoredNames}\nThay đổi Kho: \n${window._debugInvs.join('\n')}`), 500);

      } else {
         const newNotif = {
            id: 'NOT_' + Date.now().toString(36) + Math.random().toString(36).substring(2,5),
            title: 'Cảnh Báo Phục Hồi Kho',
            message: `Không thể trả tự động nguyên liệu do xóa phiếu thu (Thực nhận: ${transaction.amount.toLocaleString()}đ, Kênh: ${channelName}). Lý do: Tổng giá trị ước tính ${Math.round(grossValue).toLocaleString()}đ không khớp (kể cả với dung sai 5%) với bất kỳ Món/Combo nào trên Thực Đơn. Vui lòng hoàn nguyên liệu vào kho bằng tay!`,
            type: 'error',
            isRead: false,
            timestamp: new Date().toISOString()
         };
         state.notifications = [newNotif, ...(state.notifications || [])].slice(0, 20);
         setTimeout(() => alert('DATA HEALER FAILED:\n' + newNotif.message), 500);
      }
    }
  }

  return {
    ...state,
    purchaseOrders: updatedPOs,
    suppliers: updatedSuppliers,
    posOrders: updatedPosOrders,
    ingredients: updatedIngredients,
    transactions: state.transactions.map(t => t.id === action.payload ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t),
    accounts: state.accounts.map(acc => {
      if (acc.id === transaction.accountId) {
        const adjustment = transaction.type === 'Thu' ? -transaction.amount : transaction.amount;
        return { ...acc, balance: acc.balance + adjustment };
      }
      return acc;
    })
  };
};
