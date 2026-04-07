import { CloudSyncService } from './cloudSyncService';

const getInitialState = () => {
  return {
    categories: [
      { id: 'C1', name: 'Gà Nguyên Con', type: 'menu' },
      { id: 'C2', name: 'Combo Đóng Hộp', type: 'menu' },
      { id: 'C3', name: 'Gia vị tẩm ướp', type: 'inventory' },
      { id: 'C4', name: 'Đồ Nhựa Hộp Túi', type: 'inventory' }
    ],
    salesChannels: [
      { id: 'CH1', name: 'Biên Lai Tiệm (Trực Tiếp)', commission: 0, platform: 'foodapp', allowImport: false },
      { id: 'CH2', name: 'ShopeeFood', commission: 29, platform: 'foodapp', allowImport: true },
      { id: 'CH3', name: 'GrabFood', commission: 29, platform: 'foodapp', allowImport: true }
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
    notifications: [],
    settings: {
      syncMode: 'auto'
    }
  };
};

const DB_KEY = 'omnipos_gaumuoi_v3'; // Unified LocalStorage key for cross-architecture compatibility

// Pub/Sub system for reactive hook syncing
const listeners = new Set();
const notifyListeners = (collection) => {
  listeners.forEach(l => l(collection));
};

export const StorageService = {
  subscribe: (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  getAll: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const dataStr = localStorage.getItem(DB_KEY);
        if (dataStr) {
          try {
            const data = JSON.parse(dataStr);
            
            // --- HỆ THỐNG GỠ LỖI TRÙNG LẶP ID ---
            // Phát hiện các ID bị trùng lặp do lỗi thao tác dồn dập hoặc copy đè mây.
            let hasDuplicates = false;
            if (typeof data === 'object' && data !== null) {
              for (const key of Object.keys(data)) {
                 if (Array.isArray(data[key])) {
                    const ids = new Set();
                    const uniqueArray = [];
                    for (let i = 0; i < data[key].length; i++) {
                       const item = data[key][i];
                       if (item && item.id) {
                          if (ids.has(item.id)) {
                             // Phát hiện nhân bản: BỎ QUA không đẩy vào mảng mới để triệt tiêu bản sao
                             hasDuplicates = true;
                          } else {
                             ids.add(item.id);
                             uniqueArray.push(item);
                          }
                       } else {
                          uniqueArray.push(item);
                       }
                    }
                    if (data[key].length !== uniqueArray.length) {
                        data[key] = uniqueArray;
                    }
                 }
              }
            }
            if (hasDuplicates) {
               // Lưu lại liền để tự fix ngầm trong cơ sở dữ liệu.
               localStorage.setItem(DB_KEY, JSON.stringify(data));
               console.warn('[Auto-Heal] Đã dọn dẹp triệt để các ID bị nhân bản (triệt tiêu sự bành trướng dữ liệu).');
            }
            // -------------------------------------------------------------
            
            // --- HỆ THỐNG GỠ LỖI NẠP SỐ LIỆU RÁC (GLOBAL NUMERIC SANITIZER) ---
            let hasDirtyCommas = false;
            
            const numericFields = new Set([
              'stock', 'minStock', 'cost', 'buyPrice', 'conversionRate', 'qty', 'price', 
              'amount', 'totalAmount', 'netAmount', 'discount', 'extraFee', 
              'balance', 'initialBalance', 'commission', 'discountRate', 'actual'
            ]);

            const sanitizeNumericFields = (obj) => {
              if (Array.isArray(obj)) {
                obj.forEach(item => sanitizeNumericFields(item));
              } else if (obj !== null && typeof obj === 'object') {
                Object.keys(obj).forEach(key => {
                  if (numericFields.has(key)) {
                    if (typeof obj[key] === 'string' && obj[key].includes(',')) {
                       const cleanVal = Number(obj[key].replace(/,/g, '.'));
                       obj[key] = isNaN(cleanVal) ? 0 : cleanVal;
                       hasDirtyCommas = true;
                    }
                  }
                  if (typeof obj[key] === 'object') {
                    sanitizeNumericFields(obj[key]);
                  }
                });
              }
            };

            sanitizeNumericFields(data);
            
            if (hasDirtyCommas) {
               localStorage.setItem(DB_KEY, JSON.stringify(data));
               console.warn('[Auto-Heal] Toàn Hệ Thống: Đã quyét và thay thế TẤT CẢ rác dữ liệu dấu phẩy (,) thành dấu chấm chuẩn quốc tế (.).');
            }
            // -------------------------------------------------------------
            
            resolve(data);
          } catch {
            resolve(getInitialState());
          }
        } else {
          resolve(getInitialState());
        }
      }, 0); // Độ trễ bằng 0ms cho Production
    });
  },

  getCollection: async (collectionName) => {
    const data = await StorageService.getAll();
    return data[collectionName] || [];
  },

  saveAll: async (dataObj, triggerSync = true) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(DB_KEY, JSON.stringify(dataObj));
        notifyListeners('*');
        if (triggerSync) {
           CloudSyncService.debouncedSyncToCloud();
        }
        resolve(true);
      }, 0);
    });
  },

  saveCollection: async (collectionName, newCollectionArray, triggerSync = true) => {
    const data = await StorageService.getAll();
    data[collectionName] = newCollectionArray;
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    notifyListeners(collectionName);
    if (triggerSync) {
       CloudSyncService.debouncedSyncToCloud();
    }
    return newCollectionArray;
  },

  notifyAll: () => notifyListeners('*'),

  generateId: (prefix) => {
    if (typeof window !== 'undefined') {
      window._idCounter = ((window._idCounter || 0) + 1) % 1296; 
      const dt = Date.now().toString(36).toUpperCase().slice(-4); 
      const rnd = Math.random().toString(36).substring(2, 4).toUpperCase(); 
      const cnt = window._idCounter.toString(36).toUpperCase().padStart(2, '0'); 
      return prefix + dt + rnd + cnt;
    }
    return prefix + Date.now().toString(36).toUpperCase().slice(-4) + Math.random().toString(36).substring(2, 6).toUpperCase();
  }
};
