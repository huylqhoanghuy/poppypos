import React, { createContext, useContext, useReducer, useEffect, useState, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { db } from '../firebase';
import logoPoppy from '../assets/logo-poppy.png';

import { StorageService } from '../services/api/storage';
import { CloudSyncService } from '../services/api/cloudSyncService';
import { 
  generateId, 
  processTransferFunds,
  processAddPurchaseOrder, 
  processUpdatePurchaseOrderStatus, 
  processDeletePurchaseOrder, 
  processAddPosOrder,
  processUpdateOrderStatus, 
  processHardDeletePosOrder, 
  processConfirmImportOrders,
  processDeleteTransaction
} from '../services/coreServices';

const DataContext = createContext();

const initialState = {
  categories: [
    { id: 'C1', name: 'Gà Nguyên Con', type: 'menu' },
    { id: 'C2', name: 'Combo Đóng Hộp', type: 'menu' },
    { id: 'C3', name: 'Gia vị tẩm ướp', type: 'inventory' },
    { id: 'C4', name: 'Đồ Nhựa Hộp Túi', type: 'inventory' }
  ],
  salesChannels: [
    { id: 'CH1', name: 'Biên Lai Tiệm (Trực Tiếp)', commission: 0, platform: 'foodapp', allowImport: false },
    { id: 'CH2', name: 'ShopeeFood', commission: 25, platform: 'foodapp', allowImport: true },
    { id: 'CH3', name: 'GrabFood', commission: 30, platform: 'foodapp', allowImport: true }
  ],
  ingredients: [],
  products: [],
  suppliers: [],
  purchaseOrders: [],
  posOrders: [],
  accounts: [
    { id: 'ACC1', name: 'Tiền mặt tại quầy', balance: 0, type: 'cash', initialBalance: 0 },
    { id: 'ACC2', name: 'Tài Khoản Ngân Hàng', balance: 0, type: 'bank', initialBalance: 0 }
  ],
  financeCategories: [
    { id: 'FC1', name: 'Doanh thu bán hàng', type: 'income' },
    { id: 'FC2', name: 'Thu nợ khách hàng', type: 'income' },
    { id: 'FC3', name: 'Vốn chủ sở hữu', type: 'income' },
    { id: 'FC4', name: 'Nhập hàng nguyên liệu', type: 'expense' },
    { id: 'FC5', name: 'Lương nhân viên', type: 'expense' },
    { id: 'FC6', name: 'Tiền mặt bằng', type: 'expense' },
    { id: 'FC7', name: 'Điện nước internet', type: 'expense' },
    { id: 'FC8', name: 'Phí sàn (Grab/Shopee)', type: 'expense' },
    { id: 'FC9', name: 'Chi phí khác', type: 'expense' },
    { id: 'FC10', name: 'Điều chỉnh số dư', type: 'income' }
  ],
  transactions: [],
  settings: {
    syncMode: 'auto',
    storeName: 'Xóm Gà POPPY',
    branch: 'Trụ sở chính',
    address: 'Thái Văn Lung, Quận 1',
    phone: '1900 1234',
    logoUrl: '',
    faviconUrl: '',
    developerInfo: 'Phát triển bởi CuongDEV.com | Hotline Hỗ Trợ: 0909123456',
    loginFooter: 'Phần Mềm Quản Trị & Bán Hàng © 2026'
  },
  users: [
    { id: 'U1', username: 'admin', password: 'admin', name: 'Quản Trị Tối Cao', role: 'ADMIN', status: 'active' },
    { id: 'U2', username: 'quanly', password: '123', name: 'Quản Lý Cửa Hàng', role: 'MANAGER', status: 'active' },
    { id: 'U3', username: 'thungan', password: '123', name: 'Thu Ngân', role: 'CASHIER', status: 'active' }
  ],
  notifications: [],
  toast: null
};

const baseReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotif = {
        id: generateId('NOT_'),
        title: action.payload.title || 'Thông báo mới',
        message: action.payload.message || '',
        type: action.payload.type || 'info', // info, success, warning, error
        silent: action.payload.silent || false,
        timestamp: action.payload.timestamp || new Date().toISOString(),
        isRead: false
      };
      const currentList = state.notifications || [];
      const newList = [newNotif, ...currentList].slice(0, 20); // Lưu tối đa 20 thông báo gần nhất
      const newState = { ...state, notifications: newList };
      StorageService.saveCollection('notifications', newList);
      return newState;
    }
    
    case 'MARK_NOTIFICATION_READ': {
      const currentList = state.notifications || [];
      const newList = currentList.map(n => 
        n.id === action.payload ? { ...n, isRead: true } : n
      );
      const newState = { ...state, notifications: newList };
      StorageService.saveCollection('notifications', newList);
      return newState;
    }
    
    case 'MARK_ALL_NOTIFICATIONS_READ': {
      const currentList = state.notifications || [];
      const newList = currentList.map(n => ({ ...n, isRead: true }));
      const newState = { ...state, notifications: newList };
      StorageService.saveCollection('notifications', newList);
      return newState;
    }
    
    case 'DELETE_NOTIFICATION': {
      const currentList = state.notifications || [];
      const newList = currentList.map(n => n.id === action.payload ? { ...n, deleted: true, deletedAt: new Date().toISOString() } : n);
      const newState = { ...state, notifications: newList };
      StorageService.saveCollection('notifications', newList);
      return newState;
    }
    case 'RESTORE_NOTIFICATION': {
      const currentList = state.notifications || [];
      const newList = currentList.map(n => n.id === action.payload ? { ...n, deleted: false, deletedAt: null, hiddenFromStaff: false } : n);
      const newState = { ...state, notifications: newList };
      StorageService.saveCollection('notifications', newList);
      return newState;
    }
    case 'HARD_DELETE_NOTIFICATION': {
      const currentList = state.notifications || [];
      const newList = currentList.filter(n => n.id !== action.payload);
      const newState = { ...state, notifications: newList };
      StorageService.saveCollection('notifications', newList);
      return newState;
    }
    case 'BULK_RESTORE_NOTIFICATION': {
      const currentList = state.notifications || [];
      const newList = currentList.map(n => action.payload.includes(n.id) ? { ...n, deleted: false, deletedAt: null, hiddenFromStaff: false } : n);
      const newState = { ...state, notifications: newList };
      StorageService.saveCollection('notifications', newList);
      return newState;
    }
    case 'BULK_HARD_DELETE_NOTIFICATION': {
      const currentList = state.notifications || [];
      const newList = currentList.filter(n => !action.payload.includes(n.id));
      const newState = { ...state, notifications: newList };
      StorageService.saveCollection('notifications', newList);
      return newState;
    }
    
    case 'HIDE_FROM_STAFF': {
        const { entityKey, ids } = action.payload;
        if (!state[entityKey]) return state;
        const newList = state[entityKey].map(item => 
             ids.includes(item.id) ? { ...item, hiddenFromStaff: true } : item
        );
        const newState = { ...state, [entityKey]: newList };
        StorageService.saveCollection(entityKey, newList);
        return newState;
    }

    // MIGRATE_LEGACY_ORDERS has been completely removed to prevent data loss.
    case 'HYDRATE_STATE': {
      const incoming = action.payload;
      return { ...state, ...incoming, _skipSave: true };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'UPDATE_USER_PREFERENCES': {
      const { userId, preferences } = action.payload;
      const newUsers = state.users.map(u => 
        u.id === userId ? { ...u, preferences: { ...(u.preferences || {}), ...preferences } } : u
      );
      // DataContext's auto-save hook will handle pushing this to localStorage and cloud
      return { ...state, users: newUsers };
    }

    case 'SHOW_TOAST':
      return { ...state, toast: { message: action.payload.message, type: action.payload.type || 'success', id: Date.now() }, _skipSave: true };
    case 'HIDE_TOAST':
      return { ...state, toast: null, _skipSave: true };

    // Categories
    case 'ADD_CATEGORY': return { ...state, categories: [...state.categories, { ...action.payload, id: generateId('CAT-') }] };
    case 'UPDATE_CATEGORY': return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY': return { ...state, categories: state.categories.map(c => c.id === action.payload ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c) };
    case 'RESTORE_CATEGORY': return { ...state, categories: state.categories.map(c => c.id === action.payload ? { ...c, deleted: false, deletedAt: null, hiddenFromStaff: false } : c) };
    case 'HARD_DELETE_CATEGORY': return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    case 'BULK_DELETE_CATEGORY': return { ...state, categories: state.categories.map(c => action.payload.includes(c.id) ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c) };
    case 'BULK_RESTORE_CATEGORY': return { ...state, categories: state.categories.map(c => action.payload.includes(c.id) ? { ...c, deleted: false, deletedAt: null, hiddenFromStaff: false } : c) };
    case 'BULK_HARD_DELETE_CATEGORY': return { ...state, categories: state.categories.filter(c => !action.payload.includes(c.id)) };

    // Sales Channels
    case 'ADD_CHANNEL': return { ...state, salesChannels: [...(state.salesChannels || []), { ...action.payload, id: generateId('CH-') }] };
    case 'UPDATE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).map(c => c.id === action.payload ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c) };
    case 'RESTORE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).map(c => c.id === action.payload ? { ...c, deleted: false, deletedAt: null, hiddenFromStaff: false } : c) };
    case 'HARD_DELETE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).filter(c => c.id !== action.payload) };
    case 'BULK_DELETE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).map(c => action.payload.includes(c.id) ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c) };
    case 'BULK_RESTORE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).map(c => action.payload.includes(c.id) ? { ...c, deleted: false, deletedAt: null, hiddenFromStaff: false } : c) };
    case 'BULK_HARD_DELETE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).filter(c => !action.payload.includes(c.id)) };

    // Users (Auth V2)
    case 'ADD_USER': return { ...state, users: [...(state.users || []), { ...action.payload, id: generateId('USR-') }] };
    case 'UPDATE_USER': return { ...state, users: (state.users || []).map(u => u.id === action.payload.id ? action.payload : u) };
    case 'DELETE_USER': return { ...state, users: (state.users || []).map(u => u.id === action.payload ? { ...u, deleted: true, deletedAt: new Date().toISOString() } : u) };
    case 'RESTORE_USER': return { ...state, users: (state.users || []).map(u => u.id === action.payload ? { ...u, deleted: false, deletedAt: null, hiddenFromStaff: false } : u) };
    case 'HARD_DELETE_USER': return { ...state, users: (state.users || []).filter(u => u.id !== action.payload) };

    // Accounts (NEW V8)
    case 'ADD_ACCOUNT': return { ...state, accounts: [...state.accounts, { ...action.payload, id: generateId('ACC-'), balance: Number(action.payload.initialBalance || 0), initialBalance: Number(action.payload.initialBalance || 0) }] };
    case 'UPDATE_ACCOUNT': return { ...state, accounts: state.accounts.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ACCOUNT': return { ...state, accounts: state.accounts.map(a => a.id === action.payload ? { ...a, deleted: true, deletedAt: new Date().toISOString() } : a) };
    case 'RESTORE_ACCOUNT': return { ...state, accounts: state.accounts.map(a => a.id === action.payload ? { ...a, deleted: false, deletedAt: null, hiddenFromStaff: false } : a) };
    case 'HARD_DELETE_ACCOUNT': return { ...state, accounts: state.accounts.filter(a => a.id !== action.payload) };
    case 'BULK_DELETE_ACCOUNT': return { ...state, accounts: state.accounts.map(a => action.payload.includes(a.id) ? { ...a, deleted: true, deletedAt: new Date().toISOString() } : a) };
    case 'BULK_RESTORE_ACCOUNT': return { ...state, accounts: state.accounts.map(a => action.payload.includes(a.id) ? { ...a, deleted: false, deletedAt: null, hiddenFromStaff: false } : a) };
    case 'BULK_HARD_DELETE_ACCOUNT': return { ...state, accounts: state.accounts.filter(a => !action.payload.includes(a.id)) };

    // Finance Categories (NEW V8)
    case 'ADD_FINANCE_CATEGORY': return { ...state, financeCategories: [...state.financeCategories, { ...action.payload, id: generateId('FCAT-') }] };
    case 'UPDATE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.map(c => c.id === action.payload ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c) };
    case 'RESTORE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.map(c => c.id === action.payload ? { ...c, deleted: false, deletedAt: null, hiddenFromStaff: false } : c) };
    case 'HARD_DELETE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.filter(c => c.id !== action.payload) };
    case 'BULK_DELETE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.map(c => action.payload.includes(c.id) ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c) };
    case 'BULK_RESTORE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.map(c => action.payload.includes(c.id) ? { ...c, deleted: false, deletedAt: null, hiddenFromStaff: false } : c) };
    case 'BULK_HARD_DELETE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.filter(c => !action.payload.includes(c.id)) };

    // Money Transfer (NEW V8)
    case 'TRANSFER_FUNDS': return processTransferFunds(state, action);

    case 'DELETE_TRANSACTION': return processDeleteTransaction(state, action);

    case 'RESTORE_TRANSACTION': {
      const transaction = state.transactions.find(t => t.id === action.payload);
      if (!transaction || !transaction.deleted) return state;

      let updatedPOs = [...state.purchaseOrders];
      let updatedSuppliers = [...state.suppliers];
      let updatedPosOrders = [...state.posOrders];

      if (transaction.relatedId) {
          if (transaction.relatedId.startsWith('PO-') || transaction.relatedId.startsWith('NK-')) {
              const poIdx = updatedPOs.findIndex(p => p.id === transaction.relatedId);
              if (poIdx !== -1 && (updatedPOs[poIdx].status === 'Pending' || updatedPOs[poIdx].status === 'Debt')) {
                  updatedPOs[poIdx] = { ...updatedPOs[poIdx], status: 'Paid' }; // Trả lại status Paid
                  const supplierId = updatedPOs[poIdx].supplierId;
                  if (supplierId) {
                     const sIdx = updatedSuppliers.findIndex(s => s.id === supplierId);
                     if (sIdx !== -1) {
                        updatedSuppliers[sIdx] = { ...updatedSuppliers[sIdx], debt: Math.max(0, (updatedSuppliers[sIdx].debt || 0) - transaction.amount) };
                     }
                  }
              }
          } else if (transaction.relatedId.startsWith('ORD-') || transaction.relatedId.startsWith('POS-') || transaction.relatedId.startsWith('DH-')) {
              const oIdx = updatedPosOrders.findIndex(o => o.id === transaction.relatedId);
              if (oIdx !== -1 && (updatedPosOrders[oIdx].paymentStatus === 'Debt' || updatedPosOrders[oIdx].paymentStatus === 'Unpaid')) {
                  updatedPosOrders[oIdx] = { ...updatedPosOrders[oIdx], paymentStatus: 'Paid' };
              }
          }
      }

      return {
        ...state,
        purchaseOrders: updatedPOs,
        suppliers: updatedSuppliers,
        posOrders: updatedPosOrders,
        transactions: state.transactions.map(t => t.id === action.payload ? { ...t, deleted: false, deletedAt: null, hiddenFromStaff: false } : t),
        accounts: state.accounts.map(acc => {
          if (acc.id === transaction.accountId) {
             // Restore: Thu -> Cộng tiền, Chi -> Trừ tiền
            const adjustment = transaction.type === 'Thu' ? transaction.amount : -transaction.amount;
            return { ...acc, balance: acc.balance + adjustment };
          }
          return acc;
        })
      };
    }

    case 'HARD_DELETE_TRANSACTION': {
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload)
      };
    }

    case 'BULK_DELETE_TRANSACTION': {
      let tempState = state;
      action.payload.forEach(id => { tempState = baseReducer(tempState, { type: 'DELETE_TRANSACTION', payload: id }); });
      return tempState;
    }

    case 'BULK_RESTORE_TRANSACTION': {
      let tempState = state;
      action.payload.forEach(id => { tempState = baseReducer(tempState, { type: 'RESTORE_TRANSACTION', payload: id }); });
      return tempState;
    }

    case 'BULK_HARD_DELETE_TRANSACTION': {
      let tempState = state;
      action.payload.forEach(id => { tempState = baseReducer(tempState, { type: 'HARD_DELETE_TRANSACTION', payload: id }); });
      return tempState;
    }

    case 'UPDATE_TRANSACTION': {
      const { id, ...updates } = action.payload;
      const oldT = state.transactions.find(t => t.id === id);
      if (!oldT) return state;

      return {
        ...state,
        transactions: state.transactions.map(t => t.id === id ? { ...t, ...updates } : t),
        accounts: state.accounts.map(acc => {
          if (acc.id === oldT.accountId) {
            // Revert old, apply new
            const oldAdj = oldT.type === 'Thu' ? -oldT.amount : oldT.amount;
            const newAdj = updates.type === 'Thu' ? updates.amount : -updates.amount;
            return { ...acc, balance: acc.balance + oldAdj + newAdj };
          }
          return acc;
        })
      };
    }

    // Adjust Account Balance (Actual vs Virtual)
    case 'ADJUST_BALANCE': {
      const { accountId, actualBalance, note } = action.payload;
      const acc = state.accounts.find(a => a.id === accountId);
      if (!acc) return state;

      const diff = actualBalance - acc.balance;
      if (diff === 0) return state;

      const adjustmentTransaction = {
        id: generateId('GD-'),
        voucherCode: diff > 0 ? `PT-${Date.now().toString().slice(-6)}` : `PC-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        type: diff > 0 ? 'Thu' : 'Chi',
        categoryId: 'FC10',
        accountId: accountId,
        amount: Math.abs(diff),
        note: `[ĐIỀU CHỈNH SỐ DƯ] ${note || 'Khớp số dư thực tế.'}`,
        collector: 'Hệ thống',
        payer: 'Admin'
      };

      return {
        ...state,
        transactions: [adjustmentTransaction, ...state.transactions],
        accounts: state.accounts.map(a => a.id === accountId ? { ...a, balance: actualBalance } : a)
      };
    }

    // Ingredients & Products
    case 'ADD_INGREDIENT': {
      const newIng = { ...action.payload, id: generateId('NL-') };
      // Xóm Gà POPPY v10 - Auto-heal lost recipe references
      const healedProducts = (state.products || []).map(p => {
         if (!p.recipe) return p;
         let changed = false;
         const newRecipe = p.recipe.map(r => {
             const existIng = state.ingredients.find(i => i.id === r.ingredientId);
             if (!existIng && r.name && typeof r.name === 'string' && r.name.trim().toLowerCase() === newIng.name.trim().toLowerCase()) {
                 changed = true;
                 return { ...r, ingredientId: newIng.id };
             }
             return r;
         });
         return changed ? { ...p, recipe: newRecipe } : p;
      });
      return { ...state, ingredients: [...state.ingredients, newIng], products: healedProducts };
    }
    case 'UPDATE_INGREDIENT': {
      const updatedIng = action.payload;
      const oldIng = state.ingredients.find(i => i.id === updatedIng.id);
      
      let newTransactions = [...state.transactions];
      let newAccounts = [...state.accounts];
      
      // Bút toán hao hụt / dư thừa kho (Chỉ tạo khi số lượng stock thực sự thay đổi thủ công)
      // Lưu ý: Các thao tác từ PO hay POS không dùng UPDATE_INGREDIENT (mà dùng ADD_POS_ORDER, etc)
      if (oldIng && oldIng.stock !== updatedIng.stock) {
          const stockDiff = updatedIng.stock - oldIng.stock;
          const costDiff = stockDiff * (updatedIng.cost || oldIng.cost || 0);
          
          if (Math.abs(costDiff) > 1) { // Chỉ ghi lại nếu giá trị chênh lệch đáng kể (> 1 đồng)
             const varianceTx = {
                 id: generateId('GD-'),
                 voucherCode: generateId('HT-'),
                 date: new Date().toISOString(),
                 type: 'Hạch Toán',
                 categoryId: 'FC10', // Tạm gắn Khác, xử lý ở P&L
                 accountId: 'ACC1', // Không tác động tiền mặt, chỉ mượn trường
                 amount: Math.abs(costDiff),
                 note: stockDiff < 0 
                     ? `[KIỂM KÊ KHO] Khấu trừ hao hụt tồn kho (${Math.abs(stockDiff).toFixed(2)} ${updatedIng.buyUnit || updatedIng.unit}) - Nguyên liệu: ${updatedIng.name}`
                     : `[KIỂM KÊ KHO] Ghi nhận dư thừa tồn kho (${Math.abs(stockDiff).toFixed(2)} ${updatedIng.buyUnit || updatedIng.unit}) - Nguyên liệu: ${updatedIng.name}`,
                 collector: 'Hệ thống',
                 payer: 'Kiểm kê',
                 relatedId: updatedIng.id,
                 isNonCash: true, // Cờ khóa dòng tiền thực
                 stockDiffInfo: { diff: stockDiff, cost: updatedIng.cost } // Dùng cho P&L
             };
             newTransactions = [varianceTx, ...newTransactions];
          }
      }

      const healedProducts = (state.products || []).map(p => {
         if (!p.recipe) return p;
         let changed = false;
         const newRecipe = p.recipe.map(r => {
             const existIng = state.ingredients.find(i => i.id === r.ingredientId);
             // Tự động rà soát những recipe hỏng (thiếu UUID) xem tên có khớp với tên mới Update không
             if (!existIng && r.name && typeof r.name === 'string' && r.name.trim().toLowerCase() === updatedIng.name.trim().toLowerCase()) {
                 changed = true;
                 return { ...r, ingredientId: updatedIng.id };
             }
             return r;
         });
         return changed ? { ...p, recipe: newRecipe } : p;
      });
      return { 
          ...state, 
          ingredients: state.ingredients.map(i => i.id === updatedIng.id ? updatedIng : i), 
          products: healedProducts,
          transactions: newTransactions,
          accounts: newAccounts
      };
    }
    case 'DELETE_INGREDIENT': return { ...state, ingredients: state.ingredients.map(i => i.id === action.payload ? { ...i, deleted: true, deletedAt: new Date().toISOString() } : i) };
    case 'RESTORE_INGREDIENT': return { ...state, ingredients: state.ingredients.map(i => i.id === action.payload ? { ...i, deleted: false, deletedAt: null, hiddenFromStaff: false } : i) };
    case 'HARD_DELETE_INGREDIENT': return { ...state, ingredients: state.ingredients.filter(i => i.id !== action.payload) };
    case 'BULK_DELETE_INGREDIENT': return { ...state, ingredients: state.ingredients.map(i => action.payload.includes(i.id) ? { ...i, deleted: true, deletedAt: new Date().toISOString() } : i) };
    case 'BULK_RESTORE_INGREDIENT': return { ...state, ingredients: state.ingredients.map(i => action.payload.includes(i.id) ? { ...i, deleted: false, deletedAt: null, hiddenFromStaff: false } : i) };
    case 'BULK_HARD_DELETE_INGREDIENT': return { ...state, ingredients: state.ingredients.filter(i => !action.payload.includes(i.id)) };
    case 'ADJUST_STOCK': return {
      ...state,
      ingredients: state.ingredients.map(i => i.id === action.payload.id ? { ...i, stock: action.payload.newStock } : i)
    };

    case 'ADD_PRODUCT': return { ...state, products: [...state.products, { ...action.payload, id: generateId('SP-'), status: action.payload.status || 'active' }] };
    case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
    case 'DELETE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload ? { ...p, deleted: true, deletedAt: new Date().toISOString() } : p) };
    case 'RESTORE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload ? { ...p, deleted: false, deletedAt: null, hiddenFromStaff: false } : p) };
    case 'HARD_DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'BULK_DELETE_PRODUCT': return { ...state, products: state.products.map(p => action.payload.includes(p.id) ? { ...p, deleted: true, deletedAt: new Date().toISOString() } : p) };
    case 'BULK_RESTORE_PRODUCT': return { ...state, products: state.products.map(p => action.payload.includes(p.id) ? { ...p, deleted: false, deletedAt: null, hiddenFromStaff: false } : p) };
    case 'BULK_HARD_DELETE_PRODUCT': return { ...state, products: state.products.filter(p => !action.payload.includes(p.id)) };

    // Suppliers
    case 'ADD_SUPPLIER': return { ...state, suppliers: [...state.suppliers, { ...action.payload, id: generateId('SUP-') }] };
    case 'UPDATE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload ? { ...s, deleted: true, deletedAt: new Date().toISOString() } : s) };
    case 'RESTORE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload ? { ...s, deleted: false, deletedAt: null, hiddenFromStaff: false } : s) };
    case 'HARD_DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };
    case 'BULK_DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => action.payload.includes(s.id) ? { ...s, deleted: true, deletedAt: new Date().toISOString() } : s) };
    case 'BULK_RESTORE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => action.payload.includes(s.id) ? { ...s, deleted: false, deletedAt: null, hiddenFromStaff: false } : s) };
    case 'BULK_HARD_DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => !action.payload.includes(s.id)) };

    case 'BULK_DELETE_POS_ORDER': return { ...state, posOrders: state.posOrders.map(o => action.payload.includes(o.id) ? { ...o, deleted: true, deletedAt: new Date().toISOString() } : o) };
    case 'BULK_RESTORE_POS_ORDER': return { ...state, posOrders: state.posOrders.map(o => action.payload.includes(o.id) ? { ...o, deleted: false, deletedAt: null, hiddenFromStaff: false } : o) };
    case 'BULK_HARD_DELETE_POS_ORDER': return { ...state, posOrders: state.posOrders.filter(o => !action.payload.includes(o.id)) };

    // Purchase Orders (Kho & Công Nợ)
    case 'UPDATE_POS_ORDER_STATUS': {
      const { id, paymentStatus } = action.payload;
      return {
        ...state,
        posOrders: state.posOrders.map(o => o.id === id ? { ...o, paymentStatus } : o)
      };
    }

    case 'ADD_PURCHASE_ORDER': return processAddPurchaseOrder(state, action);

    case 'UPDATE_PURCHASE_ORDER_STATUS': return processUpdatePurchaseOrderStatus(state, action);

    case 'DELETE_PURCHASE_ORDER': return processDeletePurchaseOrder(state, action);

    // POS & Transactions (WITH SUB-RECIPE RECURSION)
    case 'ADD_POS_ORDER': return processAddPosOrder(state, action);

    case 'UPDATE_POS_ORDER': {
      const updatedOrder = action.payload;
      const oldOrder = state.posOrders.find(o => o.id === updatedOrder.id);
      if (!oldOrder) return state;

      let newAccounts = [...state.accounts];
      let newTransactions = [...state.transactions];

      // Sửa liên thông dòng tiền nếu Đơn chưa Hủy
      if (oldOrder.status !== 'Cancelled') {
         const txIndex = newTransactions.findIndex(t => t.relatedId === oldOrder.id && t.type === 'Thu');
         if (txIndex !== -1) {
            const oldTx = newTransactions[txIndex];
            const oldMoney = oldOrder.netAmount + (Number(oldOrder.extraFee) || 0);
            const newMoney = updatedOrder.netAmount + (Number(updatedOrder.extraFee) || 0);
            
            let newAccountId = 'ACC1';
            if (updatedOrder.channelName === 'ShopeeFood') newAccountId = 'ACC3';
            if (updatedOrder.channelName === 'GrabFood') newAccountId = 'ACC4';
            if (!newAccounts.find(a => a.id === newAccountId)) {
                newAccountId = newAccounts.length > 0 ? newAccounts[0].id : 'ACC1';
            }

            // Hoàn trả balance cũ
            newAccounts = newAccounts.map(acc => acc.id === oldTx.accountId ? { ...acc, balance: acc.balance - oldMoney } : acc);
            // Cộng balance mới
            newAccounts = newAccounts.map(acc => acc.id === newAccountId ? { ...acc, balance: acc.balance + newMoney } : acc);

            // Cập nhật record giao dịch
            newTransactions[txIndex] = {
              ...oldTx,
              amount: newMoney,
              accountId: newAccountId,
              date: updatedOrder.date,
              payer: updatedOrder.customerName || 'Khách vãng lai',
              note: `Doanh thu POS - Kênh: ${updatedOrder.channelName || 'Trực tiếp'}`
            };
         }
      }

      return {
        ...state,
        posOrders: state.posOrders.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o),
        accounts: newAccounts,
        transactions: newTransactions
      };
    }

    case 'UPDATE_ORDER_STATUS': return processUpdateOrderStatus(state, action);

    case 'DELETE_POS_ORDER': {
      const orderId = action.payload;
      return {
        ...state,
        posOrders: state.posOrders.map(o => o.id === orderId ? { ...o, deleted: true, deletedAt: new Date().toISOString() } : o)
      };
    }

    case 'HARD_DELETE_POS_ORDER': return processHardDeletePosOrder(state, action);

    case 'ADD_TRANSACTION': {
      const amount = Number(action.payload.amount) || 0;
      const type = action.payload.type || 'Thu';
      const t = {
        ...action.payload,
        id: generateId('GD-'),
        voucherCode: action.payload.voucherCode || (type === 'Thu' ? `PT-${Date.now().toString().slice(-6)}` : `PC-${Date.now().toString().slice(-6)}`),
        date: action.payload.date || new Date().toISOString(),
        amount
      };
      return {
        ...state,
        transactions: [t, ...state.transactions],
        accounts: state.accounts.map(acc => {
          if (acc.id === t.accountId) {
            return { ...acc, balance: acc.balance + (t.type === 'Thu' ? amount : -amount) };
          }
          return acc;
        })
      };
    }

    case 'CONFIRM_IMPORT_ORDERS': return processConfirmImportOrders(state, action);

    // Removed duplicate UPDATE_ORDER_STATUS and DELETE_POS_ORDER

    case 'CLEAN_LEGACY_DATA': {
      const cleanNote = (note) => {
        if (!note) return note;
        return note
          .replace(/\[Import Shopee\] Order /g, 'Shopee Order: ')
          .replace(/\[Import Grab\] Order /g, 'Grab Order: ')
          .replace(/\[Import Shopee\] /g, 'Shopee Order: ')
          .replace(/\[Import Grab\] /g, 'Grab Order: ');
      };
      const cleanName = (name) => {
        if (!name) return name;
        return name.replace('Đơn ShopeeFood', 'Đơn hàng ShopeeFood').replace('Đơn GrabFood', 'Đơn hàng GrabFood');
      };

      return {
        ...state,
        transactions: state.transactions.map(t => ({ ...t, note: cleanNote(t.note) })),
        posOrders: state.posOrders.map(o => ({
          ...o,
          id: o.id.startsWith('IMP-') ? o.id.replace('IMP-', '') : o.id,
          items: o.items.map(item => ({
            ...item,
            product: { ...item.product, name: cleanName(item.product.name) }
          }))
        }))
      };
    }

    default: return state;
  }
};

const reducer = (state, action) => {
  const newState = baseReducer(state, action);
  
  // Xóa cờ _skipSave nếu action không phải là Hydrate hoặc Toast
  // Giúp các thao tác như DELETE_POS_ORDER được MỞ KHÓA lưu xuống localStorage!
  if (
    action.type !== 'HYDRATE_STATE' &&
    action.type !== 'HYDRATE_STATE_SILENT' &&
    action.type !== 'SHOW_TOAST' &&
    action.type !== 'HIDE_TOAST' &&
    action.type !== 'CLEAN_LEGACY_DATA' && 
    action.type !== 'MIGRATE_LEGACY_ORDERS'
  ) {
    if (newState._skipSave) {
      return { ...newState, _skipSave: false };
    }
  }
  return newState;
};

export const DataProvider = ({ children }) => {
  const [state, rawDispatch] = useReducer(reducer, initialState, (initial) => {
    try {
      const local = localStorage.getItem('omnipos_gaumuoi_v3');
      const parsed = local ? JSON.parse(local) : initial;
      
      // Migration: Cập nhật cứng pass '123' của admin (nếu bị kẹt cache local storage cũ) thành 'admin'
      if (parsed && parsed.users) {
         const adminObj = parsed.users.find(u => u.username === 'admin');
         if (adminObj && adminObj.password === '123') {
             adminObj.password = 'admin';
         }
      }
      
      return { ...initial, ...parsed };
    } catch {
      return initial;
    }
  });
  const dispatch = (action) => {
    rawDispatch(action);

    if (action.type === 'SHOW_TOAST' || action.type === 'HIDE_TOAST' || action.type === 'HYDRATE_STATE' || action.type === 'CLEAN_LEGACY_DATA') {
      return;
    }

    const showToast = (message) => {
      setTimeout(() => rawDispatch({ type: 'SHOW_TOAST', payload: { message } }), 50);
    };

    if (action.type.startsWith('ADD_')) {
      showToast('Dữ liệu đã được lưu thành công!');
    } else if (action.type.startsWith('UPDATE_')) {
      showToast('Cập nhật thay đổi thành công!');
    } else if (action.type.startsWith('DELETE_')) {
      showToast('Đã đưa dữ liệu vào Thùng rác!');
    } else if (action.type.startsWith('RESTORE_')) {
      showToast('Đã khôi phục dữ liệu từ Thùng rác!');
    } else if (action.type.startsWith('HARD_DELETE_')) {
      showToast('Đã xóa vĩnh viễn khỏi hệ thống!');
    } else if (action.type === 'PROCESS_POS_ORDER' || action.type === 'PROCESS_IMPORT_ORDER') {
      showToast('Thanh toán & Xuất kho thành công!');
    } else if (action.type === 'UPDATE_ORDER_STATUS') {
      showToast('Đã đổi trạng thái đơn hàng!');
    } else if (action.type === 'TRANSFER_FUNDS') {
      showToast('Đã ghi nhận giao dịch luân chuyển!');
    }
  };

  const [loading, setLoading] = useState(true);

  // Realtime Cloud Listener (Online-first Architecture)
  useEffect(() => {
    console.log("[DataContext] Khởi động Kiến trúc Realtime...");
    
    // 1. Phục hồi khung dữ liệu Local lập tức để hiển thị khung nền (chưa cho thao tác)
    const hasLocalData = !!localStorage.getItem('omnipos_gaumuoi_v3');
    if (hasLocalData) {
      StorageService.getAll().then(data => {
        rawDispatch({ type: 'HYDRATE_STATE', payload: data });
      });
    }

    if (import.meta.env.DEV) {
       console.log("[DEV SANDBOX] Đã ngắt kết nối Cloud tự động. Trạng thái thuần Local.");
       setLoading(false);
       return;
    }

    // --- CHỈ CHẠY TRÊN PROD ONLINE ---
    // 2. Chặn đứng giao diện, ép kéo Data mới nhất từ Mây đè xuống Local trước khi làm việc! (Đồng bộ đầu ca)
    CloudSyncService.pullFromCloud().then(res => {
        if (res.success && res.newState) {
           rawDispatch({ type: 'HYDRATE_STATE', payload: res.newState });
        }
        
        // 3. Kết nối Firebase Realtime Listener sau khi đã làm sạch nền Local
        const unsubscribeCloud = CloudSyncService.startRealtimeListener((mergedState) => {
            rawDispatch({ type: 'HYDRATE_STATE', payload: mergedState });
        });
        
        window.__poppyUnsubscribeCloud = unsubscribeCloud;
        setLoading(false); // Chính thức gỡ Block UI cho nhân viên thao tác
    }).catch(err => {
        console.error(err);
        setLoading(false); // Lỗi mạng thì đành mở khóa offline
    });

    // Timeout 4.5 giây đếm ngược quá tải mạng
    const networkTimeoutId = setTimeout(() => {
       console.warn("[Network] Quá thời gian chờ Cloud (4.5s). Khởi động chế độ Offline!");
       setLoading(false);
    }, 4500);

    return () => {
       clearTimeout(networkTimeoutId);
       if (typeof window.__poppyUnsubscribeCloud === 'function') {
           window.__poppyUnsubscribeCloud();
       }
    };
  }, []);

  // Sync DataContext state when StorageService (CHS) modifies localStorage directly
  useEffect(() => {
    const unsubscribe = StorageService.subscribe(() => {
       StorageService.getAll().then(data => {
          rawDispatch({ type: 'HYDRATE_STATE', payload: data });
       });
    });
    return () => unsubscribe();
  }, [rawDispatch]);

  // Cleanup legacy data once (Migration V30)
  const legacyCleanAttempted = useRef(false);
  useEffect(() => {
    if (loading || legacyCleanAttempted.current) return;
    const hasLegacy = state.transactions.some(t => t.note?.includes('[Import')) ||
      state.posOrders.some(o => o.id?.startsWith('IMP-'));
    if (hasLegacy) {
      console.log("[Migration] Cleaning legacy import labels...");
      dispatch({ type: 'CLEAN_LEGACY_DATA' });
    }
    legacyCleanAttempted.current = true;
  }, [loading, state.transactions, state.posOrders]);

    // Clean ghost items - REMOVED: This legacy script was too destructive and was deleting valid Grab/Shopee orders and normal items containing specific words.

  // Function to manually trigger Firebase sync
  const syncToCloud = async () => {
    rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Đang lưu trữ thay đổi lên Đám mây...', type: 'success' } });
    const res = await CloudSyncService.syncToCloud();
    if (!res.success) {
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: res.message, type: 'error' } });
    }
  };

  // Khởi động trình tự động sao lưu Local & Cloud
  // Đã gỡ useAutoBackup() khỏi đây để đưa ra ngoài AppContent (tránh chạy nền khi quản lý đăng nhập)

  // Function to manually pull from Firebase
  const pullFromCloud = async () => {
    rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Đang lấy dữ liệu định kì từ Đám mây...', type: 'success' } });
    const res = await CloudSyncService.pullFromCloud();
    if (res.success && res.newState) {
      // Bỏ qua chặn lưu đệm
      rawDispatch({ type: 'HYDRATE_STATE_SILENT', payload: { ...res.newState, _skipSave: true } });
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: res.message, type: 'success' } });
    } else {
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: res.message || 'Chưa có bản lưu nào trên máy chủ', type: 'error' } });
    }
  };

  const isMountedRef = useRef(false);
  const hasSuccessfullyHydrated = useRef(false);
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return; 
    }
    if (state._skipSave) {
      hasSuccessfullyHydrated.current = true;
      return; // Ngăn chặn đè dữ liệu của CHS khi chỉ hiện Toast
    }
    
    // Tuyệt đối không cho phép đẩy dữ liệu rỗng (của Initial State ảo) lên Cloud nếu chưa từng Hydrate thành công!
    if (!hasSuccessfullyHydrated.current) {
       console.warn("[CloudSync] Đã chặn một cú đẩy dữ liệu rỗng lên Firebase (Tránh thảm họa Wipe Data)!");
       return;
    }

    const stateToSave = { ...state };
    delete stateToSave.toast; // Không lưu toast
    delete stateToSave._skipSave;
    localStorage.setItem('omnipos_gaumuoi_v3', JSON.stringify(stateToSave));
    StorageService.notifyAll(); // FIX: Trigger CHS hooks whenever DataContext updates directly
    
    // Auto-sync realtime!
    if (!import.meta.env.DEV) {
        CloudSyncService.debouncedSyncToCloud();
    }
  }, [state]);

  if (loading) {
    let logoToUse = logoPoppy;
    try {
        const rawLocalStr = localStorage.getItem('omnipos_gaumuoi_v3');
        if (rawLocalStr) {
            const parsed = JSON.parse(rawLocalStr);
            if (parsed?.settings?.logoUrl) logoToUse = parsed.settings.logoUrl;
        }
    // eslint-disable-next-line no-empty
    } catch {}

    return (
      <div style={{ padding: '60px', textAlign: 'center', fontFamily: 'system-ui, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-color)' }}>
        <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
           <img src={logoToUse} alt="POPPY Logo" style={{ width: '80px', height: '80px', objectFit: 'contain', zIndex: 2, borderRadius: '50%', filter: 'drop-shadow(0 4px 16px rgba(255,100,0,0.5))' }} />
           
           {/* Vòng sáng chính quay nhanh - Màu chủ đạo cam */}
           <div style={{ position: 'absolute', inset: 0, border: '5px solid transparent', borderTopColor: '#ff7000', borderLeftColor: 'rgba(255, 112, 0, 0.2)', borderRadius: '50%', animation: 'spin 1s linear infinite', zIndex: 1, boxShadow: '0 0 20px rgba(255, 112, 0, 0.6), inset 0 0 15px rgba(255, 112, 0, 0.4)' }}></div>
           
           {/* Vòng bao ngoài đứt khúc - Quay ngược chiều */}
           <div style={{ position: 'absolute', inset: -10, border: '3px dashed transparent', borderBottomColor: '#f97316', borderRightColor: 'rgba(249, 115, 22, 0.4)', borderRadius: '50%', animation: 'spin 3s linear infinite reverse', zIndex: 1 }}></div>
           
           {/* Hào quang nền toả nhiệt */}
           <div style={{ position: 'absolute', inset: -25, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,112,0,0.15) 0%, transparent 70%)', animation: 'subtlePulse 2s ease-in-out infinite', zIndex: 0 }}></div>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Đang nạp hệ thống lõi...</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px', maxWidth: '320px' }}>
          Đang kết nối siêu tốc và đồng bộ hóa bảo mật.<br/>
          Vui lòng đợi trong giây lát...
        </p>
      </div>
    );
  }

  return <DataContext.Provider value={{ state, dispatch, syncToCloud, pullFromCloud }}>{children}</DataContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => useContext(DataContext);
