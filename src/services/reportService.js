export const ReportService = {
  generateBusinessReport: (state, filterDate) => {
    if (!state) return null;
    try {
      const start = filterDate.start ? new Date(filterDate.start).setHours(0,0,0,0) : 0;
      const end = filterDate.end ? new Date(filterDate.end).setHours(23,59,59,999) : Infinity;

      const posOrders = state.posOrders || [];
      const transactions = state.transactions || [];
      const salesChannels = state.salesChannels || [];
      const products = state.products || [];
      const ingredients = state.ingredients || [];

      const dailyTrend = {}; 
      const productsByChannel = {}; 
      const ingredientsByChannel = {}; 

      let totalSuccessOrders = 0;
      let totalCancelledOrders = 0;

      const channelStats = {};
      salesChannels.forEach(c => {
         channelStats[c.name] = { 
            name: c.name, orders: 0, revenue: 0, cogs: 0, fee: 0, tax: 0, opex: 0, dailyLogs: {} 
         };
      }); 
      
      const getDateStr = (d) => {
        const date = new Date(d);
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
      };

      const getProductCost = (recipe) => {
        if (!recipe || !Array.isArray(recipe)) return 0;
        return recipe.reduce((sum, item) => {
          const sub = products.find(p => p.id === item.ingredientId);
          if (sub) {
            const subQty = item.unitMode === 'divide' ? (1/item.qty) : item.qty;
            return sum + (getProductCost(sub.recipe) * subQty);
          }
          const ing = ingredients.find(i => i.id === item.ingredientId);
          if (ing) {
            let bQty = item.qty || 0;
            if (item.unitMode === 'buy') bQty = (item.qty || 0) * (ing.conversionRate || 1);
            if (item.unitMode === 'divide') bQty = 1 / (item.qty || 1);
            return sum + (bQty * (ing.cost || 0));
          }
          return sum;
        }, 0);
      };

      // Đệ quy phá vỡ công thức (Tính Doanh thu & Phí phân bổ cho KHỐI LƯỢNG MÓN CHÍNH = qty)
      const explodeIngredients = (recipe, portionsNeeded, productRevPerPortion, totalRecipeCost, ch, feePerPortion, dateStr) => {
        if (!recipe || totalRecipeCost <= 0) return;
        recipe.forEach(item => {
            const sub = products.find(p => p.id === item.ingredientId);
            if (sub) {
                const subQty = item.unitMode === 'divide' ? (1/item.qty) : item.qty;
                explodeIngredients(sub.recipe, portionsNeeded * subQty, productRevPerPortion, totalRecipeCost, ch, feePerPortion, dateStr);
                return;
            }
            const ing = ingredients.find(i => i.id === item.ingredientId);
            if (ing) {
                let bQty = item.qty || 0;
                if (item.unitMode === 'buy') bQty = (item.qty || 0) * (ing.conversionRate || 1);
                if (item.unitMode === 'divide') bQty = 1 / (item.qty || 1);
                
                const ingCostInRecipe = (bQty * (ing.cost || 0));
                
                const costWeight = (ingCostInRecipe / totalRecipeCost) || 0;
                let revAttribution = productRevPerPortion * costWeight;
                const feeAttribution = feePerPortion * costWeight;
                
                const actualCost = ingCostInRecipe * portionsNeeded;
                const actualBaseQty = bQty * portionsNeeded;
                const itemAttributedRevenue = revAttribution * portionsNeeded;
                const itemFee = feeAttribution * portionsNeeded;

                if (!ingredientsByChannel[ch]) ingredientsByChannel[ch] = {};
                if (!ingredientsByChannel[ch][ing.id]) {
                    ingredientsByChannel[ch][ing.id] = { id: ing.id, category: ing.category || 'Khác', name: ing.name, attributedRevenue: 0, totalCost: 0, qty: 0, unit: ing.unit, fee: 0, tax: 0, dailyLogs: {} };
                }
                const ingObj = ingredientsByChannel[ch][ing.id];
                ingObj.attributedRevenue += itemAttributedRevenue;
                ingObj.totalCost += actualCost;
                ingObj.qty += actualBaseQty;
                ingObj.fee += itemFee;
                // Currently ingredients do not track tax distribution deeply since it's just a top-level deduction, but initializing to avoid NaN.

                if (!ingObj.dailyLogs[dateStr]) ingObj.dailyLogs[dateStr] = { date: dateStr, qty: 0, attributedRevenue: 0, totalCost: 0, fee: 0, tax: 0, opex: 0 };
                ingObj.dailyLogs[dateStr].qty += actualBaseQty;
                ingObj.dailyLogs[dateStr].attributedRevenue += itemAttributedRevenue;
                ingObj.dailyLogs[dateStr].totalCost += actualCost;
                ingObj.dailyLogs[dateStr].fee += itemFee;
            }
        });
      };

      posOrders.forEach(o => {
        const tTime = new Date(o.date).getTime();
        if (tTime >= start && tTime <= end) {
            if (o.status === 'Cancelled') {
                totalCancelledOrders += 1;
            } else {
                totalSuccessOrders += 1;
                const ch = o.channelName;
                const matchedChannelObj = salesChannels.find(c => c.name === ch);
                if (!matchedChannelObj) return;

                const dateStr = getDateStr(o.date);
                const net = Number(o.netAmount) || 0;
                const gross = Number(o.totalAmount) || net;
                const isImported = o.paymentMethod === 'Imported';
                const commissionRate = Number(matchedChannelObj.commission ?? matchedChannelObj.discountRate ?? 0);
                
                // FIX: Doanh thu luôn là Gross (Không dùng net làm doanh thu nữa để tránh trừ 2 lần)
                const effectiveRev = gross; 
                
                let orderCommissionCost = 0;
                let orderTaxCost = 0;

                if (gross > net && net > 0) {
                    // Lấy phí sàn trừ thẳng từ khác biệt giữa Giá bán và Tiền nhận về
                    orderCommissionCost = gross - net;
                } else {
                    // Nếu đơn POS tạo tay (gross = net), trích phí sàn theo cài đặt
                    orderCommissionCost = gross * (commissionRate / 100);
                }

                channelStats[ch].revenue += effectiveRev;
                channelStats[ch].orders += 1;
                channelStats[ch].fee += orderCommissionCost;
                channelStats[ch].tax += orderTaxCost;

                if (!channelStats[ch].dailyLogs[dateStr]) channelStats[ch].dailyLogs[dateStr] = { date: dateStr, revenue: 0, orders: 0, fee: 0, tax: 0, cogs: 0, opex: 0 };
                channelStats[ch].dailyLogs[dateStr].revenue += effectiveRev;
                channelStats[ch].dailyLogs[dateStr].orders += 1;
                channelStats[ch].dailyLogs[dateStr].fee += orderCommissionCost;
                channelStats[ch].dailyLogs[dateStr].tax += orderTaxCost;

                if (!dailyTrend[dateStr]) dailyTrend[dateStr] = { revenue: 0, profit: 0, orders: 0, tax: 0 };
                dailyTrend[dateStr].revenue += effectiveRev;
                dailyTrend[dateStr].orders += 1;
                dailyTrend[dateStr].tax = (dailyTrend[dateStr].tax || 0) + orderTaxCost;

                if (!productsByChannel[ch]) productsByChannel[ch] = {};

                let orderCOGS = 0;
                const orderItems = o.items || (o.cart ? o.cart.map(c => ({ product: c, quantity: c.qty })) : []);
                
                // Tính Trọng Số Đơn Hàng để Phân Bổ Tiền/ Phí Sàn chính xác theo Tỷ trọng Giá Trị Món Hàng:
                const orderBaseTotal = orderItems.reduce((sum, item) => sum + (item.itemTotal ?? ((item.product?.price || 0) * (item.quantity || item.qty || 1))), 0);

                orderItems.forEach(cartItem => {
                    if (!cartItem.product) return;
                    const pid = cartItem.product.id;
                    const qty = cartItem.quantity || cartItem.qty || 1;
                    
                    let latestProduct = products.find(p => p.id === pid);
                    if (!latestProduct && cartItem.product.name) {
                        latestProduct = products.find(p => p.name.trim().toLowerCase() === cartItem.product.name.trim().toLowerCase());
                    }

                    const recipeToUse = latestProduct ? latestProduct.recipe : (cartItem.product.recipe || []);
                    
                    const unitCost = getProductCost(recipeToUse);
                    const itemCOGS = unitCost * qty;
                    orderCOGS += itemCOGS;

                    const basePrice = cartItem.product.price || (latestProduct ? latestProduct.price : 0);
                    const itemValueGross = cartItem.itemTotal ?? (basePrice * qty);
                    const itemWeight = orderBaseTotal > 0 ? (itemValueGross / orderBaseTotal) : 0;
                    
                    const finalItemRev = effectiveRev * itemWeight;
                    const finalItemFee = orderCommissionCost * itemWeight;
                    const finalItemTax = orderTaxCost * itemWeight;
                    
                    const finalPid = latestProduct ? latestProduct.id : (pid || cartItem.product.name);
                    const finalName = latestProduct ? latestProduct.name : cartItem.product.name;

                    if (!productsByChannel[ch][finalPid]) {
                        productsByChannel[ch][finalPid] = { id: finalPid, name: finalName, qty: 0, revenue: 0, cogs: 0, fee: 0, tax: 0, unitCost, basePrice, dailyLogs: {} };
                    }
                    const pObj = productsByChannel[ch][finalPid];
                    pObj.qty += qty;
                    pObj.revenue += finalItemRev;
                    pObj.cogs += itemCOGS;
                    pObj.fee += finalItemFee;
                    pObj.tax = (pObj.tax || 0) + finalItemTax;

                    if (!pObj.dailyLogs[dateStr]) pObj.dailyLogs[dateStr] = { date: dateStr, qty: 0, revenue: 0, cogs: 0, fee: 0, tax: 0, opex: 0 };
                    pObj.dailyLogs[dateStr].qty += qty;
                    pObj.dailyLogs[dateStr].revenue += finalItemRev;
                    pObj.dailyLogs[dateStr].cogs += itemCOGS;
                    pObj.dailyLogs[dateStr].fee += finalItemFee;
                    pObj.dailyLogs[dateStr].tax = (pObj.dailyLogs[dateStr].tax || 0) + finalItemTax;

                    const feePerPortion = qty > 0 ? (finalItemFee / qty) : 0;
                    explodeIngredients(recipeToUse, qty, finalItemRev / qty, unitCost, ch, feePerPortion, dateStr);
                });

                channelStats[ch].cogs += orderCOGS;
                channelStats[ch].dailyLogs[dateStr].cogs += orderCOGS;
                dailyTrend[dateStr].profit += (net - orderCOGS - orderCommissionCost - orderTaxCost); 
            }
        }
      });

      transactions.forEach(t => {
        const tTime = new Date(t.date).getTime();
        if (tTime >= start && tTime <= end && !t.note?.includes('[LUÂN CHUYỂN]')) {
            let matchedChannel = null;
            salesChannels.forEach(sc => {
                if (t.note?.includes(sc.name) || t.relatedId?.includes(sc.name)) matchedChannel = sc.name;
            });
            
            if (matchedChannel && channelStats[matchedChannel]) {
                const amt = Number(t.amount) || 0;
                const dateStr = getDateStr(t.date);
                if (!channelStats[matchedChannel].dailyLogs[dateStr]) channelStats[matchedChannel].dailyLogs[dateStr] = { date: dateStr, revenue: 0, orders: 0, fee: 0, tax: 0, cogs: 0, opex: 0 };

                if (t.type === 'Thu' && t.categoryId !== 'FC1') {
                    channelStats[matchedChannel].revenue += amt;
                    channelStats[matchedChannel].dailyLogs[dateStr].revenue += amt;
                    if (!dailyTrend[dateStr]) dailyTrend[dateStr] = { revenue: 0, profit: 0, orders: 0, tax: 0 };
                    dailyTrend[dateStr].revenue += amt;
                    dailyTrend[dateStr].profit += amt;
                } 
                else if (t.type === 'Chi' && t.categoryId !== 'FC4') {
                    channelStats[matchedChannel].opex += amt;
                    channelStats[matchedChannel].dailyLogs[dateStr].opex += amt;
                    if (!dailyTrend[dateStr]) dailyTrend[dateStr] = { revenue: 0, profit: 0, orders: 0, tax: 0 };
                    dailyTrend[dateStr].profit -= amt;
                }
            }
        }
      });

      let totalRevenue = 0, totalCOGS = 0, totalFee = 0, totalTax = 0, totalOPEX = 0;
      const channelArray = [];
      Object.values(channelStats).forEach(ch => {
          if (ch.revenue > 0 || ch.cogs > 0 || ch.opex > 0 || ch.fee > 0 || ch.tax > 0 || ch.orders > 0) {
              const profit = ch.revenue - ch.cogs - ch.fee - ch.tax - ch.opex;
              ch.profit = profit;
              ch.margin = ch.revenue > 0 ? (profit / ch.revenue) * 100 : 0;
              channelArray.push(ch);
              
              totalRevenue += ch.revenue;
              totalCOGS += ch.cogs;
              totalFee += ch.fee;
              totalTax += ch.tax;
              totalOPEX += ch.opex;
          }
      });

      const totalProfit = totalRevenue - totalCOGS - totalFee - totalTax - totalOPEX;
      
      const sortedTrendLabels = Object.keys(dailyTrend).sort((a,b) => a.localeCompare(b));

      const totalProductsMap = {};
      Object.keys(productsByChannel).forEach(ch => {
          if (Object.keys(productsByChannel[ch]).length > 0) {
              const items = Object.values(productsByChannel[ch]);
              const chStat = channelArray.find(c => c.name === ch);
              const chRev = chStat ? chStat.revenue : 0;
              const chOpex = chStat ? chStat.opex : 0;

              items.forEach(p => {
                  p.opex = chRev > 0 ? (p.revenue / chRev) * chOpex : 0;
                  
                  if (!totalProductsMap[p.id]) totalProductsMap[p.id] = { ...p, qty: 0, revenue: 0, cogs: 0, fee: 0, opex: 0, dailyLogs: {} };
                  const mapP = totalProductsMap[p.id];
                  mapP.qty += p.qty;
                  mapP.revenue += p.revenue;
                  mapP.cogs += p.cogs;
                  mapP.fee += p.fee;
                  mapP.opex += p.opex;

                  Object.keys(p.dailyLogs || {}).forEach(ds => {
                      if (!mapP.dailyLogs[ds]) mapP.dailyLogs[ds] = { date: ds, qty: 0, revenue: 0, cogs: 0, fee: 0, opex: 0 };
                      mapP.dailyLogs[ds].qty += p.dailyLogs[ds].qty;
                      mapP.dailyLogs[ds].revenue += p.dailyLogs[ds].revenue;
                      mapP.dailyLogs[ds].cogs += p.dailyLogs[ds].cogs;
                      mapP.dailyLogs[ds].fee += p.dailyLogs[ds].fee;
                      const dailyOpex = chRev > 0 ? (p.dailyLogs[ds].revenue / chRev) * chOpex : 0;
                      mapP.dailyLogs[ds].opex += dailyOpex;
                  });
              });
          }
      });

      const totalIngredientsMap = {};
      Object.keys(ingredientsByChannel).forEach(ch => {
          if (Object.keys(ingredientsByChannel[ch]).length > 0) {
              const items = Object.values(ingredientsByChannel[ch]);
              const chStat = channelArray.find(c => c.name === ch);
              const chRev = chStat ? chStat.revenue : 0;
              const chOpex = chStat ? chStat.opex : 0;

              items.forEach(ing => {
                  ing.opex = chRev > 0 ? (ing.attributedRevenue / chRev) * chOpex : 0;

                  if (!totalIngredientsMap[ing.id]) totalIngredientsMap[ing.id] = { ...ing, qty: 0, attributedRevenue: 0, totalCost: 0, fee: 0, opex: 0, dailyLogs: {} };
                  const mapIng = totalIngredientsMap[ing.id];
                  mapIng.qty += ing.qty;
                  mapIng.attributedRevenue += ing.attributedRevenue;
                  mapIng.totalCost += ing.totalCost;
                  mapIng.fee += ing.fee;
                  mapIng.opex += ing.opex;

                  Object.keys(ing.dailyLogs || {}).forEach(ds => {
                      if (!mapIng.dailyLogs[ds]) mapIng.dailyLogs[ds] = { date: ds, qty: 0, attributedRevenue: 0, totalCost: 0, fee: 0, opex: 0 };
                      mapIng.dailyLogs[ds].qty += ing.dailyLogs[ds].qty;
                      mapIng.dailyLogs[ds].attributedRevenue += ing.dailyLogs[ds].attributedRevenue;
                      mapIng.dailyLogs[ds].totalCost += ing.dailyLogs[ds].totalCost;
                      mapIng.dailyLogs[ds].fee += ing.dailyLogs[ds].fee;
                      const dailyOpex = chRev > 0 ? (ing.dailyLogs[ds].attributedRevenue / chRev) * chOpex : 0;
                      mapIng.dailyLogs[ds].opex += dailyOpex;
                  });
              });
          }
      });

      return {
          totalRevenue, totalCOGS, totalFee, totalOPEX, totalProfit,
          totalSuccessOrders, totalCancelledOrders,
          totalMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
          channels: channelArray.sort((a,b) => b.revenue - a.revenue),
          dailyTrend: {
              labels: sortedTrendLabels,
              revenue: sortedTrendLabels.map(d => dailyTrend[d].revenue),
              profit: sortedTrendLabels.map(d => dailyTrend[d].profit),
              orders: sortedTrendLabels.map(d => dailyTrend[d].orders)
          },
          totalProductsList: Object.values(totalProductsMap).sort((a,b) => b.qty - a.qty),
          totalIngredientsList: Object.values(totalIngredientsMap).sort((a,b) => b.qty - a.qty)
      };

    } catch (err) {
      console.error(err);
      return null;
    }
  }
};
