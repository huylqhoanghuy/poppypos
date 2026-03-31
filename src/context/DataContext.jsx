import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAutoBackup } from '../hooks/useAutoBackup';
import { inferItemsFromPrice } from '../utils/csvParser';
import { 
  generateId, 
  processTransferFunds, 
  processAddPurchaseOrder, 
  processUpdatePurchaseOrderStatus, 
  processDeletePurchaseOrder, 
  processAddPosOrder, 
  processUpdateOrderStatus, 
  processHardDeletePosOrder, 
  processConfirmImportOrders 
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
  toast: null
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'MIGRATE_LEGACY_ORDERS': {
        let hasChanges = false;
        const migratedOrders = [];
        
        state.posOrders?.forEach(order => {
             const isGrab = order.channelName?.toLowerCase().includes('grab');
             const isShopee = order.channelName?.toLowerCase().includes('shopee');
             let newCustomerName = order.customerName;
             
             if (isGrab && newCustomerName !== 'Khách Grab') newCustomerName = 'Khách Grab';
             else if (isShopee && newCustomerName !== 'Khách Shopee') newCustomerName = 'Khách Shopee';
             
             let updatedItems = [];
             let itemsChanged = false;
             
             order.items?.forEach(item => {
                 const n = item.product?.name?.toLowerCase() || '';
                 if (n.includes('xóm gà ủ muối') || n === 'đơn hàng shopeefood' || n.includes('tổng cộng') || n.includes('thành tiền') || n.includes('tổng đơn')) {
                     itemsChanged = true;
                     return;
                 }

                 if (item.product?.name?.startsWith('Đơn hàng') || item.product?.name?.startsWith('Món giá')) {
                      const basePrice = item.quantity > 0 ? (item.itemTotal / item.quantity) : item.itemTotal;
                      const inferred = inferItemsFromPrice(basePrice, state.products);
                      if (inferred && inferred.length > 0) {
                          updatedItems.push(...inferred.map(i => ({...i, quantity: i.quantity * item.quantity, itemTotal: i.itemTotal * item.quantity})));
                          itemsChanged = true;
                      } else {
                          updatedItems.push(item);
                      }
                 } else {
                      updatedItems.push(item);
                 }
             });
             
             if (itemsChanged || newCustomerName !== order.customerName || order.customerPhone) {
                 hasChanges = true;
                 if (updatedItems.length > 0) {
                     migratedOrders.push({ ...order, customerName: newCustomerName, customerPhone: '', items: updatedItems });
                 }
             } else {
                 if (order.items && order.items.length > 0) {
                     migratedOrders.push(order);
                 }
             }
        });
        
        if (hasChanges) {
             console.log("[Migration] CSDL cũ đã được dọn rác và nội suy món ăn thành công!");
             return { ...state, posOrders: migratedOrders };
        }
        return state;
    }
    case 'HYDRATE_STATE': {
      const incoming = action.payload;
      return { ...state, ...incoming };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'SHOW_TOAST':
      return { ...state, toast: { message: action.payload.message, type: action.payload.type || 'success', id: Date.now() } };
    case 'HIDE_TOAST':
      return { ...state, toast: null };

    // Categories
    case 'ADD_CATEGORY': return { ...state, categories: [...state.categories, { ...action.payload, id: generateId('CAT-') }] };
    case 'UPDATE_CATEGORY': return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY': return { ...state, categories: state.categories.map(c => c.id === action.payload ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c) };
    case 'RESTORE_CATEGORY': return { ...state, categories: state.categories.map(c => c.id === action.payload ? { ...c, deleted: false, deletedAt: null } : c) };
    case 'HARD_DELETE_CATEGORY': return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };
    case 'BULK_DELETE_CATEGORY': return { ...state, categories: state.categories.map(c => action.payload.includes(c.id) ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c) };
    case 'BULK_RESTORE_CATEGORY': return { ...state, categories: state.categories.map(c => action.payload.includes(c.id) ? { ...c, deleted: false, deletedAt: null } : c) };
    case 'BULK_HARD_DELETE_CATEGORY': return { ...state, categories: state.categories.filter(c => !action.payload.includes(c.id)) };

    // Sales Channels
    case 'ADD_CHANNEL': return { ...state, salesChannels: [...(state.salesChannels || []), { ...action.payload, id: generateId('CH-') }] };
    case 'UPDATE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).map(c => c.id === action.payload ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c) };
    case 'RESTORE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).map(c => c.id === action.payload ? { ...c, deleted: false, deletedAt: null } : c) };
    case 'HARD_DELETE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).filter(c => c.id !== action.payload) };
    case 'BULK_DELETE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).map(c => action.payload.includes(c.id) ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c) };
    case 'BULK_RESTORE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).map(c => action.payload.includes(c.id) ? { ...c, deleted: false, deletedAt: null } : c) };
    case 'BULK_HARD_DELETE_CHANNEL': return { ...state, salesChannels: (state.salesChannels || []).filter(c => !action.payload.includes(c.id)) };

    // Users (Auth V2)
    case 'ADD_USER': return { ...state, users: [...(state.users || []), { ...action.payload, id: generateId('USR-') }] };
    case 'UPDATE_USER': return { ...state, users: (state.users || []).map(u => u.id === action.payload.id ? action.payload : u) };
    case 'DELETE_USER': return { ...state, users: (state.users || []).map(u => u.id === action.payload ? { ...u, deleted: true, deletedAt: new Date().toISOString() } : u) };
    case 'RESTORE_USER': return { ...state, users: (state.users || []).map(u => u.id === action.payload ? { ...u, deleted: false, deletedAt: null } : u) };
    case 'HARD_DELETE_USER': return { ...state, users: (state.users || []).filter(u => u.id !== action.payload) };

    // Accounts (NEW V8)
    case 'ADD_ACCOUNT': return { ...state, accounts: [...state.accounts, { ...action.payload, id: generateId('ACC-'), balance: Number(action.payload.initialBalance || 0), initialBalance: Number(action.payload.initialBalance || 0) }] };
    case 'UPDATE_ACCOUNT': return { ...state, accounts: state.accounts.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_ACCOUNT': return { ...state, accounts: state.accounts.map(a => a.id === action.payload ? { ...a, deleted: true, deletedAt: new Date().toISOString() } : a) };
    case 'RESTORE_ACCOUNT': return { ...state, accounts: state.accounts.map(a => a.id === action.payload ? { ...a, deleted: false, deletedAt: null } : a) };
    case 'HARD_DELETE_ACCOUNT': return { ...state, accounts: state.accounts.filter(a => a.id !== action.payload) };
    case 'BULK_DELETE_ACCOUNT': return { ...state, accounts: state.accounts.map(a => action.payload.includes(a.id) ? { ...a, deleted: true, deletedAt: new Date().toISOString() } : a) };
    case 'BULK_RESTORE_ACCOUNT': return { ...state, accounts: state.accounts.map(a => action.payload.includes(a.id) ? { ...a, deleted: false, deletedAt: null } : a) };
    case 'BULK_HARD_DELETE_ACCOUNT': return { ...state, accounts: state.accounts.filter(a => !action.payload.includes(a.id)) };

    // Finance Categories (NEW V8)
    case 'ADD_FINANCE_CATEGORY': return { ...state, financeCategories: [...state.financeCategories, { ...action.payload, id: generateId('FCAT-') }] };
    case 'UPDATE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.map(c => c.id === action.payload ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c) };
    case 'RESTORE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.map(c => c.id === action.payload ? { ...c, deleted: false, deletedAt: null } : c) };
    case 'HARD_DELETE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.filter(c => c.id !== action.payload) };
    case 'BULK_DELETE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.map(c => action.payload.includes(c.id) ? { ...c, deleted: true, deletedAt: new Date().toISOString() } : c) };
    case 'BULK_RESTORE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.map(c => action.payload.includes(c.id) ? { ...c, deleted: false, deletedAt: null } : c) };
    case 'BULK_HARD_DELETE_FINANCE_CATEGORY': return { ...state, financeCategories: state.financeCategories.filter(c => !action.payload.includes(c.id)) };

    // Money Transfer (NEW V8)
    case 'TRANSFER_FUNDS': return processTransferFunds(state, action);

    case 'DELETE_TRANSACTION': {
      const transaction = state.transactions.find(t => t.id === action.payload);
      if (!transaction) return state;

      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
        accounts: state.accounts.map(acc => {
          if (acc.id === transaction.accountId) {
            const adjustment = transaction.type === 'Thu' ? -transaction.amount : transaction.amount;
            return { ...acc, balance: acc.balance + adjustment };
          }
          return acc;
        })
      };
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
      return { ...state, ingredients: state.ingredients.map(i => i.id === updatedIng.id ? updatedIng : i), products: healedProducts };
    }
    case 'DELETE_INGREDIENT': return { ...state, ingredients: state.ingredients.map(i => i.id === action.payload ? { ...i, deleted: true, deletedAt: new Date().toISOString() } : i) };
    case 'RESTORE_INGREDIENT': return { ...state, ingredients: state.ingredients.map(i => i.id === action.payload ? { ...i, deleted: false, deletedAt: null } : i) };
    case 'HARD_DELETE_INGREDIENT': return { ...state, ingredients: state.ingredients.filter(i => i.id !== action.payload) };
    case 'BULK_DELETE_INGREDIENT': return { ...state, ingredients: state.ingredients.map(i => action.payload.includes(i.id) ? { ...i, deleted: true, deletedAt: new Date().toISOString() } : i) };
    case 'BULK_RESTORE_INGREDIENT': return { ...state, ingredients: state.ingredients.map(i => action.payload.includes(i.id) ? { ...i, deleted: false, deletedAt: null } : i) };
    case 'BULK_HARD_DELETE_INGREDIENT': return { ...state, ingredients: state.ingredients.filter(i => !action.payload.includes(i.id)) };
    case 'ADJUST_STOCK': return {
      ...state,
      ingredients: state.ingredients.map(i => i.id === action.payload.id ? { ...i, stock: action.payload.newStock } : i)
    };

    case 'ADD_PRODUCT': return { ...state, products: [...state.products, { ...action.payload, id: generateId('SP-'), status: action.payload.status || 'active' }] };
    case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
    case 'DELETE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload ? { ...p, deleted: true, deletedAt: new Date().toISOString() } : p) };
    case 'RESTORE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload ? { ...p, deleted: false, deletedAt: null } : p) };
    case 'HARD_DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload) };
    case 'BULK_DELETE_PRODUCT': return { ...state, products: state.products.map(p => action.payload.includes(p.id) ? { ...p, deleted: true, deletedAt: new Date().toISOString() } : p) };
    case 'BULK_RESTORE_PRODUCT': return { ...state, products: state.products.map(p => action.payload.includes(p.id) ? { ...p, deleted: false, deletedAt: null } : p) };
    case 'BULK_HARD_DELETE_PRODUCT': return { ...state, products: state.products.filter(p => !action.payload.includes(p.id)) };

    // Suppliers
    case 'ADD_SUPPLIER': return { ...state, suppliers: [...state.suppliers, { ...action.payload, id: generateId('SUP-') }] };
    case 'UPDATE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload ? { ...s, deleted: true, deletedAt: new Date().toISOString() } : s) };
    case 'RESTORE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload ? { ...s, deleted: false, deletedAt: null } : s) };
    case 'HARD_DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };
    case 'BULK_DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => action.payload.includes(s.id) ? { ...s, deleted: true, deletedAt: new Date().toISOString() } : s) };
    case 'BULK_RESTORE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => action.payload.includes(s.id) ? { ...s, deleted: false, deletedAt: null } : s) };
    case 'BULK_HARD_DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => !action.payload.includes(s.id)) };

    case 'BULK_DELETE_POS_ORDER': return { ...state, posOrders: state.posOrders.map(o => action.payload.includes(o.id) ? { ...o, deleted: true, deletedAt: new Date().toISOString() } : o) };
    case 'BULK_RESTORE_POS_ORDER': return { ...state, posOrders: state.posOrders.map(o => action.payload.includes(o.id) ? { ...o, deleted: false, deletedAt: null } : o) };
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

    if (action.type.startsWith('ADD_')) {
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Dữ liệu đã được lưu thành công!' } });
    } else if (action.type.startsWith('UPDATE_')) {
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Cập nhật thay đổi thành công!' } });
    } else if (action.type.startsWith('DELETE_')) {
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Đã đưa dữ liệu vào Thùng rác!' } });
    } else if (action.type.startsWith('RESTORE_')) {
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Đã khôi phục dữ liệu từ Thùng rác!' } });
    } else if (action.type.startsWith('HARD_DELETE_')) {
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Đã xóa vĩnh viễn khỏi hệ thống!' } });
    } else if (action.type === 'PROCESS_POS_ORDER' || action.type === 'PROCESS_IMPORT_ORDER') {
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Thanh toán & Xuất kho thành công!' } });
    } else if (action.type === 'UPDATE_ORDER_STATUS') {
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Đã đổi trạng thái đơn hàng!' } });
    } else if (action.type === 'TRANSFER_FUNDS') {
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Đã ghi nhận giao dịch luân chuyển!' } });
    }
  };

  const [loading, setLoading] = useState(true);

  // Fetch from Firebase on initial load (ONLY if no local data)
  useEffect(() => {

    const fetchFromFirebase = async () => {
      try {
        const keys = Object.keys(initialState);
        const newState = {};
        for (const key of keys) {
          const docRef = doc(db, 'store_data', key);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            newState[key] = docSnap.data().data;
          }
        }
        if (Object.keys(newState).length > 0) {
          dispatch({ type: 'HYDRATE_STATE', payload: newState });
        }
      } catch (error) {
        console.error("Firebase fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    const hasLocalData = !!localStorage.getItem('omnipos_gaumuoi_v3');
    if (!hasLocalData) {
      // Auto-recover data from Firebase if local storage was wiped
      fetchFromFirebase(); 
    } else {
      setLoading(false);
    }
  }, []);

  // Cleanup legacy data once (Migration V30)
  useEffect(() => {
    if (loading) return;
    const hasLegacy = state.transactions.some(t => t.note?.includes('[Import')) ||
      state.posOrders.some(o => o.id?.startsWith('IMP-'));
    if (hasLegacy) {
      console.log("[Migration] Cleaning legacy import labels...");
      dispatch({ type: 'CLEAN_LEGACY_DATA' });
    }
  }, [loading, state.transactions, state.posOrders]);

  // Clean ghost items (Store names parsed as products) from legacy imports
  useEffect(() => {
    if (loading) return;
    const needsMigration = state.posOrders.some(order => {
        if (order.channelName?.toLowerCase().includes('grab') && order.customerName !== 'Khách Grab') return true;
        if (order.channelName?.toLowerCase().includes('shopee') && order.customerName !== 'Khách Shopee') return true;
        return order.items?.some(i => {
           const n = i.product?.name?.toLowerCase() || '';
           return n.includes('xóm gà ủ muối') || n === 'đơn hàng shopeefood' || n.includes('tổng cộng') || n.includes('thành tiền') || n.includes('tổng đơn') || n.startsWith('đơn hàng') || n.startsWith('món giá');
        });
    });
    
    if (needsMigration) {
       console.log("[Migration] CSDL có chứa rác dư thừa từ các nhóm Header Report Grab/Shopee. Đang khởi chạy quy trình tự khắc phục...");
       dispatch({ type: 'MIGRATE_LEGACY_ORDERS' });
    }
  }, [loading, state.posOrders]);

  // Function to manually trigger Firebase sync
  const syncToCloud = async () => {
    try {
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Đang đẩy cập nhật lên Đám mây...', type: 'success' } });
      const keys = Object.keys(state);
      for (const key of keys) {
        if (key !== 'toast' && key !== 'settings') {
          await setDoc(doc(db, 'store_data', key), { data: state[key] });
        }
      }
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Đã đẩy dữ liệu lên Đám mây an toàn!', type: 'success' } });
    } catch (err) {
      console.error("Firebase sync error:", err);
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Lỗi đẩy dữ liệu. Vui lòng kiểm tra kết nối mạng.', type: 'error' } });
    }
  };

  // Khởi động trình tự động sao lưu Local & Cloud
  useAutoBackup(state, rawDispatch, syncToCloud);

  // Function to manually pull from Firebase
  const pullFromCloud = async () => {
    try {
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Đang lấy dữ liệu mới nhất từ Đám mây...', type: 'success' } });
      const keys = Object.keys(initialState);
      const newState = {};
      for (const key of keys) {
        const docRef = doc(db, 'store_data', key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          newState[key] = docSnap.data().data;
        }
      }
      if (Object.keys(newState).length > 0) {
        rawDispatch({ type: 'HYDRATE_STATE', payload: newState });
        rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Đã tải và cập nhật dữ liệu từ Đám mây!', type: 'success' } });
      } else {
        rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Chưa có bản lưu nào trên Đám mây!', type: 'error' } });
      }
    } catch (err) {
      console.error("Firebase pull error:", err);
      rawDispatch({ type: 'SHOW_TOAST', payload: { message: 'Lỗi tải dữ liệu. Vui lòng kiểm tra mạng.', type: 'error' } });
    }
  };

  // Sync locally instantly, Cloud sync is manual
  useEffect(() => {
    const stateToSave = { ...state };
    delete stateToSave.toast; // Không lưu toast
    localStorage.setItem('omnipos_gaumuoi_v3', JSON.stringify(stateToSave));
  }, [state]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', color: 'var(--primary)' }}>
        <h2>Đang lấy dữ liệu từ Đám Mây Mới Nhất...</h2>
      </div>
    );
  }

  return <DataContext.Provider value={{ state, dispatch, syncToCloud, pullFromCloud }}>{children}</DataContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => useContext(DataContext);
