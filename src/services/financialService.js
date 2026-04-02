export const FinancialService = {
  filterByPeriod: (items, dateField, period) => {
    if (!items) return [];
    if (period === 'all') return items;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return items.filter(item => {
      const itemDate = new Date(item[dateField] || item.date);
      if (period === 'today') return itemDate >= today;
      if (period === 'month') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      if (period === 'year') return itemDate.getFullYear() === now.getFullYear();
      return true;
    });
  },

  calculateStatements: (state, period) => {
    const filteredOrders = FinancialService.filterByPeriod(state.posOrders, 'createdAt', period);
    const filteredTransactions = FinancialService.filterByPeriod(state.transactions, 'date', period);

    // ============================================
    // 1. TÍNH TOÁN (BALANCE SHEET - Bảng cân đối)
    // ============================================
    const totalCash = state.accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;
    
    const totalInventoryValue = state.ingredients?.reduce((sum, ing) => {
        return sum + ((ing.stock || 0) * (ing.cost || 0)); // Note: the original used ing.quantity, but the standard in this system is ing.stock. I'll use stock.
    }, 0) || 0;

    const totalAssets = totalCash + totalInventoryValue;

    const totalLiabilities = state.suppliers?.reduce((sum, sup) => sum + (sup.debt || 0), 0) || 0;
    
    const ownersEquity = totalAssets - totalLiabilities;

    // ============================================
    // 2. TÍNH TOÁN (INCOME STATEMENT - KQKD / P&L)
    // ============================================
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.netAmount, 0) || 0;
    
    const cogsByCategory = {};
    const totalCOGS = filteredOrders.reduce((sum, o) => {
      const orderItems = o.items || (o.cart ? o.cart.map(c => ({ product: c, quantity: c.qty })) : []);
      const orderCOGS = orderItems.reduce((cartSum, item) => {
          if (!item.product) return cartSum;
          const product = state.products?.find(p => p.id === item.product.id);
          let unitCost = 0;
          if (product && product.recipe) {
              product.recipe.forEach(r => {
                  const ing = state.ingredients?.find(i => i.id === r.ingredientId);
                  if (ing) {
                      let qty = r.qty;
                      if (r.unitMode === 'divide') qty = 1 / r.qty;
                      if (r.unitMode === 'buy') qty = r.qty * (ing.conversionRate || 1);
                      const cost = qty * ing.cost;
                      unitCost += cost;
                      
                      const cat = ing.category || 'Khác';
                      const itemCatCogs = cost * item.quantity;
                      cogsByCategory[cat] = (cogsByCategory[cat] || 0) + itemCatCogs;
                  }
              });
          }
          return cartSum + (unitCost * item.quantity);
      }, 0);
      return sum + orderCOGS;
    }, 0) || 0;

    const grossProfit = totalRevenue - totalCOGS;

    const operatingExpenses = filteredTransactions.filter(t => t.type === 'Chi' && !t.note?.toLowerCase().includes('nhập kho') && !t.note?.toLowerCase().includes('nợ')).reduce((sum, t) => sum + t.amount, 0) || 0;
    
    const ebitda = grossProfit - operatingExpenses;
    const netProfit = ebitda; 

    // ============================================
    // 3. TÍNH TOÁN (CASH FLOW - Dòng Tiền)
    // ============================================
    const cashInflows = filteredTransactions.filter(t => t.type === 'Thu').reduce((sum, t) => sum + t.amount, 0) || 0;
    const cashOutflows = filteredTransactions.filter(t => t.type === 'Chi').reduce((sum, t) => sum + t.amount, 0) || 0;
    const netCashFlow = cashInflows - cashOutflows;

    return {
      totalCash,
      totalInventoryValue,
      totalAssets,
      totalLiabilities,
      ownersEquity,
      totalRevenue,
      totalCOGS,
      cogsByCategory,
      grossProfit,
      operatingExpenses,
      ebitda,
      netProfit,
      cashInflows,
      cashOutflows,
      netCashFlow,
      filteredTransactions
    };
  }
};
