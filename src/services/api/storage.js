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
            resolve(JSON.parse(dataStr));
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

  saveAll: async (dataObj) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(DB_KEY, JSON.stringify(dataObj));
        notifyListeners('*');
        resolve(true);
      }, 0);
    });
  },

  saveCollection: async (collectionName, newCollectionArray) => {
    const data = await StorageService.getAll();
    data[collectionName] = newCollectionArray;
    localStorage.setItem(DB_KEY, JSON.stringify(data));
    notifyListeners(collectionName);
    return newCollectionArray;
  },

  notifyAll: () => notifyListeners('*'),

  generateId: (prefix) => prefix + Math.random().toString(36).substr(2, 5).toUpperCase()
};
