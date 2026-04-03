import { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';

export const useChannelReportsManager = () => {
  const { state } = useData();
  const [filterDate, setFilterDate] = useState({ start: '', end: '' });
  const [datePreset, setDatePreset] = useState('month'); 
  const [timeTab, setTimeTab] = useState('day');

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    let startObj = new Date(now);
    let endObj = new Date(now);
    
    if (preset === 'today') {
      // today
    } else if (preset === 'yesterday') {
      startObj.setDate(now.getDate() - 1);
      endObj.setDate(now.getDate() - 1);
    } else if (preset === '7days') {
      startObj.setDate(now.getDate() - 6);
    } else if (preset === '30days') {
      startObj.setDate(now.getDate() - 29);
    } else if (preset === 'this_month') {
      startObj.setDate(1);
    } else if (preset === 'last_month') {
      startObj.setMonth(now.getMonth() - 1, 1);
      endObj.setMonth(now.getMonth(), 0);
    } else if (preset === 'this_year') {
      startObj.setMonth(0, 1);
    } else if (preset === 'all') {
      startObj.setFullYear(2000, 0, 1);
    }

    if (preset !== 'custom') {
      const pad = n => n.toString().padStart(2, '0');
      setFilterDate({
        start: preset === 'all' ? '' : `${startObj.getFullYear()}-${pad(startObj.getMonth()+1)}-${pad(startObj.getDate())}`,
        end: preset === 'all' ? '' : `${endObj.getFullYear()}-${pad(endObj.getMonth()+1)}-${pad(endObj.getDate())}`
      });
    }
  };

  useEffect(() => {
    handlePresetChange('month'); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const reportData = useMemo(() => {
    if (!state) return null;
    try {
      const start = filterDate.start ? new Date(filterDate.start).setHours(0,0,0,0) : 0;
      const end = filterDate.end ? new Date(filterDate.end).setHours(23,59,59,999) : Infinity;

      const posOrders = state.posOrders || [];
      const transactions = state.transactions || [];
      const salesChannels = state.salesChannels || [];
      const products = state.products || [];
      const ingredients = state.ingredients || [];

      const channelStats = {};
      const productsByChannel = {}; 
      const ingredientsByChannel = {}; 

      salesChannels.forEach(c => { channelStats[c.name] = { name: c.name, revenue: 0, cogs: 0, fee: 0, tax: 0, opex: 0, orders: 0, configRate: Number(c.commission ?? c.discountRate ?? 0) }; });

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

      const explodeIngredients = (recipe, portionsNeeded = 1, productRevPerPortion = 0, totalRecipeCost = 0, ch = 'Tại Quầy', productFeePerPortion = 0, productTaxPerPortion = 0) => {
        if (!recipe || !Array.isArray(recipe) || totalRecipeCost === 0) return;
        recipe.forEach(item => {
            const sub = products.find(p => p.id === item.ingredientId);
            if (sub) {
                const subQty = item.unitMode === 'divide' ? (1/item.qty) : item.qty;
                explodeIngredients(sub.recipe, portionsNeeded * subQty, productRevPerPortion, totalRecipeCost, ch, productFeePerPortion, productTaxPerPortion);
                return;
            }
            const ing = ingredients.find(i => i.id === item.ingredientId);
            if (ing) {
                let bQty = item.qty || 0;
                if (item.unitMode === 'buy') bQty = (item.qty || 0) * (ing.conversionRate || 1);
                if (item.unitMode === 'divide') bQty = 1 / (item.qty || 1);
                
                const ingCostInRecipe = (bQty * (ing.cost || 0));
                const proportion = (ingCostInRecipe / totalRecipeCost) || 0;
                
                let revAttribution = productRevPerPortion * proportion;
                const actualCost = ingCostInRecipe * portionsNeeded;
                const actualBaseQty = bQty * portionsNeeded;
                const itemAttributedRevenue = revAttribution * portionsNeeded;
                
                // Fix: productFeePerPortion and productTaxPerPortion are absolute values in VNĐ, not percentages!
                const itemFee = (productFeePerPortion * portionsNeeded) * proportion;
                const itemTax = (productTaxPerPortion * portionsNeeded) * proportion;

                if (!ingredientsByChannel[ch]) ingredientsByChannel[ch] = {};
                if (!ingredientsByChannel[ch][ing.id]) {
                    ingredientsByChannel[ch][ing.id] = { id: ing.id, name: ing.name, attributedRevenue: 0, totalCost: 0, qty: 0, unit: ing.unit, fee: 0, tax: 0, opex: 0, category: ing.categoryId ? (state.categories?.find(c=>c.id === ing.categoryId)?.name || 'Khác') : 'Khác' };
                }
                ingredientsByChannel[ch][ing.id].attributedRevenue += itemAttributedRevenue;
                ingredientsByChannel[ch][ing.id].totalCost += actualCost;
                ingredientsByChannel[ch][ing.id].qty += actualBaseQty;
                ingredientsByChannel[ch][ing.id].fee += itemFee;
                ingredientsByChannel[ch][ing.id].tax += itemTax;
            }
        });
      };

      const timeSeries = { day: {}, week: {}, month: {}, year: {} };
      const getBucketKey = (dTime, type) => {
         const n = new Date(dTime);
         if (type === 'day') return `${n.getDate().toString().padStart(2,'0')}/${(n.getMonth()+1).toString().padStart(2,'0')}/${n.getFullYear()}`;
         if (type === 'month') return `Tháng ${(n.getMonth()+1).toString().padStart(2,'0')}/${n.getFullYear()}`;
         if (type === 'year') return `Năm ${n.getFullYear()}`;
         if (type === 'week') {
            const firstDayOfYear = new Date(n.getFullYear(), 0, 1);
            const pastDaysOfYear = (n - firstDayOfYear) / 86400000;
            const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
            return `Tuần ${weekNum} - ${n.getFullYear()}`;
         }
         return 'All';
      };

      posOrders.forEach(o => {
        const tTime = new Date(o.date).getTime();
        if (tTime >= start && tTime <= end && o.status !== 'Cancelled') {
            const ch = o.channelName;
            const matchedChannelObj = salesChannels.find(c => c.name === ch);
            if (!matchedChannelObj) return;

            const net = Number(o.netAmount) || 0;
            const gross = Number(o.totalAmount) || net;

            const commissionRate = Number(matchedChannelObj.commission ?? matchedChannelObj.discountRate ?? 0);
            const isImported = o.paymentMethod === 'Imported';
            
            // FIX: Revenue is ALWAYS Gross (tiền gốc của món ăn). 
            // This prevents double deduction where 'net' already had fee deducted in DB.
            const effectiveRev = gross; 
            
            let orderCommissionCost = 0;
            let orderTaxCost = 0;

            if (gross > net && net > 0) {
                orderCommissionCost = gross - net;
            } else {
                orderCommissionCost = gross * (commissionRate / 100);
            }

            channelStats[ch].revenue += effectiveRev;
            channelStats[ch].orders += 1;
            channelStats[ch].fee += orderCommissionCost;
            channelStats[ch].tax += orderTaxCost;

            ['day', 'week', 'month', 'year'].forEach(type => {
                 const key = getBucketKey(tTime, type);
                 if (!timeSeries[type][key]) {
                     timeSeries[type][key] = { label: key, total: { orders: 0, revenue: 0, cogs: 0, fee: 0, tax: 0, opex: 0, profit: 0 }, channels: {} };
                 }
                 if (!timeSeries[type][key].channels[ch]) {
                     timeSeries[type][key].channels[ch] = { orders: 0, revenue: 0, cogs: 0, fee: 0, tax: 0, opex: 0, profit: 0, configRate: commissionRate };
                 }
                 timeSeries[type][key].total.orders += 1;
                 timeSeries[type][key].total.revenue += effectiveRev;
                 timeSeries[type][key].total.fee += orderCommissionCost;
                 timeSeries[type][key].total.tax += orderTaxCost;
                 
                 timeSeries[type][key].channels[ch].orders += 1;
                 timeSeries[type][key].channels[ch].revenue += effectiveRev;
                 timeSeries[type][key].channels[ch].fee += orderCommissionCost;
                 timeSeries[type][key].channels[ch].tax += orderTaxCost;
            });

            if (!productsByChannel[ch]) productsByChannel[ch] = {};

            let orderCOGS = 0;
            const orderItems = o.items || (o.cart ? o.cart.map(c => ({ product: c, quantity: c.qty })) : []);
            const discountRatio = (gross > 0) ? (effectiveRev / gross) : 1;

            orderItems.forEach(cartItem => {
                if (!cartItem.product) return;
                const pid = cartItem.product.id;
                const qty = cartItem.quantity || 1;
                
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
                
                const orderBaseTotal = orderItems.reduce((sum, item) => sum + (item.itemTotal ?? ((item.product?.price || 0) * (item.quantity || item.qty || 1))), 0);
                const itemWeight = orderBaseTotal > 0 ? (itemValueGross / orderBaseTotal) : 0;
                
                const finalItemRev = effectiveRev * itemWeight;
                const finalItemFee = orderCommissionCost * itemWeight;
                const finalItemTax = orderTaxCost * itemWeight;

                const finalPid = latestProduct ? latestProduct.id : (pid || cartItem.product.name);
                const finalName = latestProduct ? latestProduct.name : cartItem.product.name;

                if (!productsByChannel[ch][finalPid]) {
                    productsByChannel[ch][finalPid] = { id: finalPid, name: finalName, qty: 0, revenue: 0, cogs: 0, fee: 0, tax: 0, unitCost, basePrice };
                }
                productsByChannel[ch][finalPid].qty += qty;
                productsByChannel[ch][finalPid].revenue += finalItemRev;
                productsByChannel[ch][finalPid].cogs += itemCOGS;
                productsByChannel[ch][finalPid].fee += finalItemFee;
                productsByChannel[ch][finalPid].tax += finalItemTax;

                const feePerPortion = qty > 0 ? (finalItemFee / qty) : 0;
                const taxPerPortion = qty > 0 ? (finalItemTax / qty) : 0;
                explodeIngredients(recipeToUse, qty, finalItemRev / qty, unitCost, ch, feePerPortion, taxPerPortion);
            });

            channelStats[ch].cogs += orderCOGS;
            
            ['day', 'week', 'month', 'year'].forEach(type => {
                 const key = getBucketKey(tTime, type);
                 timeSeries[type][key].total.cogs += orderCOGS;
                 timeSeries[type][key].channels[ch].cogs += orderCOGS;
            });
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
                if (t.type === 'Thu' && t.categoryId !== 'FC1') {
                    channelStats[matchedChannel].revenue += amt;
                } 
                else if (t.type === 'Chi' && t.categoryId !== 'FC4') {
                    channelStats[matchedChannel].opex += amt;
                }
            }
        }
      });

      ['day', 'week', 'month', 'year'].forEach(type => {
          Object.values(timeSeries[type]).forEach(bucket => {
              Object.keys(bucket.channels).forEach(ch => {
                  const chObj = channelStats[ch];
                  const chStatOpex = chObj ? chObj.opex : 0;
                  const chStatRev = chObj && chObj.revenue > 0 ? chObj.revenue : 1;
                  
                  const bucketChRev = bucket.channels[ch].revenue;
                  const distributedOpex = (bucketChRev / chStatRev) * chStatOpex;
                  
                  bucket.channels[ch].opex += distributedOpex;
                  bucket.channels[ch].profit = bucketChRev - bucket.channels[ch].cogs - bucket.channels[ch].fee - (bucket.channels[ch].tax || 0) - distributedOpex;
                  
                  bucket.total.opex += distributedOpex;
              });
              bucket.total.profit = bucket.total.revenue - bucket.total.cogs - bucket.total.fee - (bucket.total.tax || 0) - bucket.total.opex;
          });
      });

      const parseDateLabelToValue = (label, type) => {
         if (type === 'day') {
             const [d, m, y] = label.split('/');
             return new Date(y, m-1, d).getTime();
         }
         if (type === 'month') {
             const [m, y] = label.replace('Tháng ', '').split('/');
             return new Date(y, m-1, 1).getTime();
         }
         if (type === 'year') {
             const y = label.replace('Năm ', '');
             return new Date(y, 0, 1).getTime();
         }
         if (type === 'week') {
             const [wPart, y] = label.replace('Tuần ', '').split(' - ');
             return new Date(y, 0, wPart * 7).getTime();
         }
         return 0;
      };

      const finalTimeSeries = {
          day: Object.values(timeSeries.day).sort((a,b) => parseDateLabelToValue(b.label, 'day') - parseDateLabelToValue(a.label, 'day')),
          week: Object.values(timeSeries.week).sort((a,b) => parseDateLabelToValue(b.label, 'week') - parseDateLabelToValue(a.label, 'week')),
          month: Object.values(timeSeries.month).sort((a,b) => parseDateLabelToValue(b.label, 'month') - parseDateLabelToValue(a.label, 'month')),
          year: Object.values(timeSeries.year).sort((a,b) => parseDateLabelToValue(b.label, 'year') - parseDateLabelToValue(a.label, 'year')),
      };

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

      const finalProductsByChannel = {};
      const pivotProducts = {}; 

      Object.keys(productsByChannel).forEach(ch => {
          if (Object.keys(productsByChannel[ch]).length > 0) {
              const items = Object.values(productsByChannel[ch]);
              const chStat = channelArray.find(c => c.name === ch);
              const chRev = chStat ? chStat.revenue : 0;
              const chOpex = chStat ? chStat.opex : 0;

              items.forEach(p => {
                  p.opex = chRev > 0 ? (p.revenue / chRev) * chOpex : 0;
                  const itemProfit = p.revenue - p.cogs - p.fee - p.opex;
                  
                  if (!pivotProducts[p.id]) {
                      pivotProducts[p.id] = { id: p.id, name: p.name, basePrice: p.basePrice, unitCost: p.unitCost, total: { qty: 0, revenue: 0, cogs: 0, fee: 0, tax: 0, opex: 0, profit: 0 }, channels: {} };
                  }
                  if (!pivotProducts[p.id].channels[ch]) {
                      pivotProducts[p.id].channels[ch] = { qty: 0, revenue: 0, cogs: 0, fee: 0, tax: 0, opex: 0, profit: 0 };
                  }
                  
                  pivotProducts[p.id].total.qty += p.qty || 0;
                  pivotProducts[p.id].total.revenue += p.revenue || 0;
                  pivotProducts[p.id].total.cogs += p.cogs || 0;
                  pivotProducts[p.id].total.fee += p.fee || 0;
                  pivotProducts[p.id].total.tax += p.tax || 0;
                  pivotProducts[p.id].total.opex += p.opex || 0;
                  pivotProducts[p.id].total.profit += itemProfit || 0;
                  
                  pivotProducts[p.id].channels[ch].qty += p.qty || 0;
                  pivotProducts[p.id].channels[ch].revenue += p.revenue || 0;
                  pivotProducts[p.id].channels[ch].cogs += p.cogs || 0;
                  pivotProducts[p.id].channels[ch].fee += p.fee || 0;
                  pivotProducts[p.id].channels[ch].tax += p.tax || 0;
                  pivotProducts[p.id].channels[ch].opex += p.opex || 0;
                  pivotProducts[p.id].channels[ch].profit += itemProfit || 0;
              });

              finalProductsByChannel[ch] = items.sort((a,b) => b.qty - a.qty);
          }
      });
      const pivotProductsArray = Object.values(pivotProducts).sort((a, b) => b.total.qty - a.total.qty);

      const finalIngredientsByChannel = {};
      Object.keys(ingredientsByChannel).forEach(ch => {
          if (Object.keys(ingredientsByChannel[ch]).length > 0) {
              const items = Object.values(ingredientsByChannel[ch]);
              const chStat = channelArray.find(c => c.name === ch);
              const chRev = chStat ? chStat.revenue : 0;
              const chOpex = chStat ? chStat.opex : 0;

              items.forEach(ing => {
                  ing.opex = chRev > 0 ? (ing.attributedRevenue / chRev) * chOpex : 0;
              });

              finalIngredientsByChannel[ch] = items.sort((a,b) => b.qty - a.qty);
          }
      });

      return {
          totalRevenue, totalCOGS, totalFee, totalTax, totalOPEX,
          totalProfit: totalRevenue - totalCOGS - totalFee - totalTax - totalOPEX,
          channels: channelArray.sort((a,b) => b.revenue - a.revenue),
          pivotProductsArray,
          timeSeries: finalTimeSeries,
          productsByChannel: finalProductsByChannel,
          ingredientsByChannel: finalIngredientsByChannel
      };

    } catch (err) {
      console.error(err);
      return null;
    }
  }, [state, filterDate]);

  return {
    filterDate,
    setFilterDate,
    datePreset,
    handlePresetChange,
    timeTab,
    setTimeTab,
    reportData,
  };
};
