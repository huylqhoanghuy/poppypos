import React, { createContext, useContext, useReducer, useEffect } from 'react';

const DataContext = createContext();

const generateId = (prefix) => prefix + Math.random().toString(36).substr(2, 5).toUpperCase();

const initialState = {
  balance: 50000000,
  categories: [
    { id: 'C1', name: 'Gà Nguyên Con', type: 'menu' },
    { id: 'C2', name: 'Combo Đóng Hộp', type: 'menu' },
    { id: 'C3', name: 'Gia vị tẩm ướp', type: 'inventory' },
    { id: 'C4', name: 'Đồ Nhựa Hộp Túi', type: 'inventory' }
  ],
  salesChannels: [
    { id: 'CH1', name: 'Biên Lai Tiệm (Trực Tiếp)', discountRate: 0 },
    { id: 'CH2', name: 'ShopeeFood', discountRate: 25 },
    { id: 'CH3', name: 'GrabFood', discountRate: 30 }
  ],
  ingredients: [
    { id: 'NL1', name: 'Gà Ta Làm Sạch', category: 'Gia vị tẩm ướp', unit: 'Con', buyUnit: 'Lồng', conversionRate: 15, stock: 120, cost: 75000 },
    { id: 'NL2', name: 'Túi Tráng Bạc', category: 'Đồ Nhựa Hộp Túi', unit: 'Cái', buyUnit: 'Kg', conversionRate: 100, stock: 500, cost: 300 },
    { id: 'NL3', name: 'Chai Nước Chấm Khối', category: 'Gia vị tẩm ướp', unit: 'Chai', buyUnit: 'Thùng', conversionRate: 20, stock: 50, cost: 20000 },
    { id: 'NL4', name: 'Hộp Nhựa Chấm Con', category: 'Đồ Nhựa Hộp Túi', unit: 'Cái', buyUnit: 'Cây', conversionRate: 50, stock: 400, cost: 500 }
  ],
  products: [
    { id: 'P1', name: 'Nước Chấm Cốc Nhỏ (Thành phẩm)', category: 'Gia vị tẩm ướp', price: 0, image: '', recipe: [
      { ingredientId: 'NL3', qty: 0.1, unitMode: 'base' },
      { ingredientId: 'NL4', qty: 1, unitMode: 'base' }
    ]},
    { id: 'P2', name: 'Gà Nguyên Con Ủ Muối', category: 'Gà Nguyên Con', price: 165000, image: '', recipe: [
      { ingredientId: 'NL1', qty: 1, unitMode: 'base' },
      { ingredientId: 'NL2', qty: 1, unitMode: 'base' },
      { ingredientId: 'P1', qty: 2, unitMode: 'base' } // Đệ quy: 2 phần nước chấm
    ]}
  ],
  suppliers: [
    { id: 'SUP1', name: 'Lò Mổ Anh Tuấn', phone: '0987654321', email: 'Lấy gà tươi sống rạng sáng' },
    { id: 'SUP2', name: 'Đại Lý Bao Bì Kim Ngân', phone: '0909090909', email: 'Ship túi bóng, hộp giấy' }
  ],
  purchaseOrders: [],
  posOrders: [],
  transactions: []
};

const reducer = (state, action) => {
  switch (action.type) {
    // Categories
    case 'ADD_CATEGORY': return { ...state, categories: [...state.categories, { ...action.payload, id: generateId('CAT-') }] };
    case 'UPDATE_CATEGORY': return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CATEGORY': return { ...state, categories: state.categories.filter(c => c.id !== action.payload) };

    // Sales Channels
    case 'ADD_CHANNEL': return { ...state, salesChannels: [...(state.salesChannels||[]), { ...action.payload, id: generateId('CH-') }] };
    case 'UPDATE_CHANNEL': return { ...state, salesChannels: (state.salesChannels||[]).map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CHANNEL': return { ...state, salesChannels: (state.salesChannels||[]).filter(c => c.id !== action.payload) };

    // Ingredients & Products
    case 'ADD_INGREDIENT': return { ...state, ingredients: [...state.ingredients, { ...action.payload, id: generateId('NL-') }] };
    case 'UPDATE_INGREDIENT': return { ...state, ingredients: state.ingredients.map(i => i.id === action.payload.id ? action.payload : i) };
    case 'DELETE_INGREDIENT': return { ...state, ingredients: state.ingredients.filter(i => i.id !== action.payload) };

    case 'ADD_PRODUCT': return { ...state, products: [...state.products, { ...action.payload, id: generateId('SP-') }] };
    case 'UPDATE_PRODUCT': return { ...state, products: state.products.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DELETE_PRODUCT': return { ...state, products: state.products.filter(p => p.id !== action.payload) };

    // Suppliers
    case 'ADD_SUPPLIER': return { ...state, suppliers: [...state.suppliers, { ...action.payload, id: generateId('SUP-') }] };
    case 'UPDATE_SUPPLIER': return { ...state, suppliers: state.suppliers.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SUPPLIER': return { ...state, suppliers: state.suppliers.filter(s => s.id !== action.payload) };

    // Purchase Orders (Kho & Công Nợ)
    case 'ADD_PURCHASE_ORDER': {
      const order = action.payload; 
      const newPO = { ...order, id: generateId('NK-'), date: new Date().toISOString() };
      
      let updatedIngredients = [...state.ingredients];
      order.items.forEach(poItem => {
        const ingIndex = updatedIngredients.findIndex(i => i.id === poItem.ingredientId);
        if (ingIndex !== -1) {
          const ing = updatedIngredients[ingIndex];
          const newStock = ing.stock + poItem.baseQty;
          
          const oldTotalCost = ing.stock * ing.cost;
          const newTotalCost = oldTotalCost + poItem.itemTotal;
          const avgCost = newTotalCost / newStock;

          updatedIngredients[ingIndex] = { ...ing, stock: newStock, cost: avgCost };
        }
      });

      const newState = { ...state, purchaseOrders: [...state.purchaseOrders, newPO], ingredients: updatedIngredients };
      
      if (newPO.status === 'Paid') {
        const transaction = {
          id: generateId('GD-'),
          date: newPO.date,
          type: 'Chi',
          amount: newPO.totalAmount,
          note: `XUẤT QUỸ: Nhập hàng trả luôn (${newPO.id})`,
          balanceAfter: state.balance - newPO.totalAmount
        };
        newState.transactions = [transaction, ...state.transactions];
        newState.balance = transaction.balanceAfter;
      }
      return newState;
    }

    case 'UPDATE_PURCHASE_ORDER_STATUS': {
      const { id, status } = action.payload;
      const po = state.purchaseOrders.find(p => p.id === id);
      if (!po || po.status === status) return state;

      const updatedPOs = state.purchaseOrders.map(p => p.id === id ? { ...p, status } : p);
      let newState = { ...state, purchaseOrders: updatedPOs };

      if (status === 'Paid') {
        const transaction = {
          id: generateId('GD-'),
          date: new Date().toISOString(),
          type: 'Chi',
          amount: po.totalAmount,
          note: `XUẤT QUỸ BÙ NỢ: Thanh toán công nợ hóa đơn nhập (${po.id})`,
          balanceAfter: state.balance - po.totalAmount
        };
        newState.transactions = [transaction, ...state.transactions];
        newState.balance = transaction.balanceAfter;
      }
      return newState;
    }

    case 'DELETE_PURCHASE_ORDER': {
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
          date: new Date().toISOString(),
          type: 'Thu',
          amount: po.totalAmount,
          note: `HOÀN QUỸ KHO: Xóa phiếu nhập/Khử trả hàng (${po.id})`,
          balanceAfter: state.balance + po.totalAmount
        };
        newState.transactions = [transaction, ...state.transactions];
        newState.balance = transaction.balanceAfter;
      }
      return newState;
    }

    // POS & Transactions (WITH SUB-RECIPE RECURSION)
    case 'ADD_POS_ORDER': {
      const order = action.payload; // Contains channelName, discountRate, total, netAmount
      const newOrder = { id: generateId('DH-'), ...order, date: new Date().toISOString() };
      
      let updatedIngredients = [...state.ingredients];
      
      // HÀM ĐỆ QUY TÌM RỄ KHỬ TỒN KHO NGUYÊN LIỆU (TRỪ MÓN PHỤ TRONG MÓN CHÍNH)
      const deductIngredients = (recipe, quantityMultiplier) => {
         if (!recipe) return;
         recipe.forEach(recItem => {
           const subProduct = state.products.find(p => p.id === recItem.ingredientId);
           if (subProduct) {
             const subQty = recItem.unitMode === 'divide' ? (1 / recItem.qty) : recItem.qty;
             deductIngredients(subProduct.recipe, quantityMultiplier * subQty);
           } else {
             const ingIndex = updatedIngredients.findIndex(i => i.id === recItem.ingredientId);
             if (ingIndex !== -1) {
               const ing = updatedIngredients[ingIndex];
               let deductBaseQty = recItem.qty;
               if (recItem.unitMode === 'buy') deductBaseQty = recItem.qty * (ing.conversionRate || 1);
               if (recItem.unitMode === 'divide') deductBaseQty = 1 / recItem.qty;
               
               updatedIngredients[ingIndex] = { ...ing, stock: Math.max(0, ing.stock - (deductBaseQty * quantityMultiplier)) };
             }
           }
         });
      };

      order.items.forEach(cartItem => {
         deductIngredients(cartItem.product.recipe, cartItem.quantity);
      });

      // LẬP PHIẾU THU TÀI CHÍNH THEO "SỐ THỰC NHẬN" (NET AMOUNT) KHÔNG CHO GRAB/SHOPEE CẮT MÁU
      const transaction = {
        id: generateId('GD-'),
        date: newOrder.date,
        type: 'Thu',
        amount: newOrder.netAmount, 
        note: `Doanh thu POS Cắt Cầu (${newOrder.id}) Cổng: ${newOrder.channelName}`,
        balanceAfter: state.balance + newOrder.netAmount
      };
      
      return { 
        ...state, 
        posOrders: [...state.posOrders, newOrder],
        ingredients: updatedIngredients,
        transactions: [transaction, ...state.transactions],
        balance: transaction.balanceAfter
      };
    }

    case 'UPDATE_ORDER_STATUS': {
      const { orderId, status } = action.payload;
      return {
        ...state,
        posOrders: (state.posOrders || []).map(o => o.id === orderId ? { ...o, status } : o)
      };
    }

    case 'ADD_TRANSACTION': {
      const transaction = { 
        ...action.payload, 
        id: generateId('GD-'), 
        date: new Date().toISOString(),
        balanceAfter: action.payload.type === 'Thu' ? state.balance + action.payload.amount : state.balance - action.payload.amount
      };
      return {
        ...state,
        transactions: [transaction, ...state.transactions],
        balance: transaction.balanceAfter
      };
    }
    
    default: return state;
  }
};

export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState, (initial) => {
    try {
      const local = localStorage.getItem('omnipos_gaumuoi_v3');
      const parsed = local ? JSON.parse(local) : initial;
      return { ...initial, ...parsed };
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem('omnipos_gaumuoi_v3', JSON.stringify(state));
  }, [state]);

  return <DataContext.Provider value={{ state, dispatch }}>{children}</DataContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => useContext(DataContext);
