import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/api/storage';
import { ReportService } from '../services/reportService';

export const useInventoryForecast = (filterDate, maxOrdersPerDay, forecastDays, topNLimit) => {
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rankedProducts, setRankedProducts] = useState([]);

  const generateForecast = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch all state
      const state = await StorageService.getAll();
      const products = state.products || [];
      const ingredients = state.ingredients || [];
      
      // 2. Run Business Report to get historical data
      const report = ReportService.generateBusinessReport(state, filterDate);
      if (!report || report.totalSuccessOrders === 0) {
        setForecastData([]);
        setRankedProducts([]);
        setLoading(false);
        return;
      }

      // 3. Rank all products by historical sales
      const ranked = (report.totalProductsList || [])
        .sort((a, b) => b.qty - a.qty);
      
      setRankedProducts(ranked);

      // 4. Explosion logic wrapper
      const accumulator = {};
      const explodeRecipe = (recipe, portionsNeeded, isTop10) => {
        if (!recipe || !Array.isArray(recipe)) return;
        recipe.forEach(item => {
            const sub = products.find(p => p.id === item.ingredientId);
            if (sub) {
                const subQty = item.unitMode === 'divide' ? (1/item.qty) : item.qty;
                explodeRecipe(sub.recipe, portionsNeeded * subQty, isTop10);
                return;
            }
            const ing = ingredients.find(i => i.id === item.ingredientId);
            if (ing) {
                let bQty = item.qty || 0;
                if (item.unitMode === 'buy') bQty = (item.qty || 0) * (ing.conversionRate || 1);
                if (item.unitMode === 'divide') bQty = 1 / (item.qty || 1);
                
                const actualBaseQty = bQty * portionsNeeded;
                if (!accumulator[ing.id]) {
                    accumulator[ing.id] = { 
                      ...ing, 
                      projectedRequiredQty: 0, 
                      isTop10Related: false,
                      relatedProducts: new Set()
                    };
                }
                accumulator[ing.id].projectedRequiredQty += actualBaseQty;
                if (isTop10) accumulator[ing.id].isTop10Related = true;
            }
        });
      };

      // 5. Calculate projection for SELECTED TOP N products
      const BUFFER_RATE = 1.03; // +3% Buffer

      // Find all products that fall within the Top N Selection
      let targetProducts = ranked;
      if (topNLimit && topNLimit !== 'all') {
          targetProducts = ranked.slice(0, Number(topNLimit));
      }

      targetProducts.forEach(p => {
        // Here we ensure the parent product is active
        const actualProduct = products.find(prod => prod.id === p.id && !prod.deleted);
        if (!actualProduct) return;

        // Find historical sold qty
        const qtySold = p.qty || 0;
        
        // Calculate the ratio based on Total Orders
        // If total orders = 0, rate is 0
        const rate = report.totalSuccessOrders > 0 ? (qtySold / report.totalSuccessOrders) : 0;
        
        // Projected portions for (X orders/day * Y days)
        let projectedSalesQty = rate * (maxOrdersPerDay * forecastDays) * BUFFER_RATE;
        
        // CRITICAL RULE: Minimum 1 portion/day must be prepared even for slow-moving items
        projectedSalesQty = Math.max(1 * forecastDays, projectedSalesQty);
        
        if (actualProduct.recipe) {
          const prevKeys = Object.keys(accumulator);
          explodeRecipe(actualProduct.recipe, projectedSalesQty, true); // True marks them as Focus (Ưu Tiên)
          const newKeys = Object.keys(accumulator);
          newKeys.forEach(k => {
             accumulator[k].relatedProducts.add(actualProduct.name);
          });
        }
      });

      // 6. Format Final Result against current whole inventory
      const finalForecast = ingredients.map(ing => {
        const accObj = accumulator[ing.id];
        const projectedQtyBase = accObj ? accObj.projectedRequiredQty : 0; // In base unit
        const currentBaseStock = ing.stock * (Number(ing.conversionRate) || 1);
        
        const shortfallBase = (projectedQtyBase > currentBaseStock) ? (projectedQtyBase - currentBaseStock) : 0;
        const buyQty = Math.ceil(shortfallBase / (Number(ing.conversionRate) || 1));
        const estimatedCost = buyQty * (ing.buyPrice || (ing.cost * (ing.conversionRate || 1)));

        return {
          ...ing,
          projectedRequiredQty: projectedQtyBase,
          currentBaseStock,
          isTop10Related: !!accObj,
          relatedProductsArr: accObj ? Array.from(accObj.relatedProducts) : [],
          shortfall: shortfallBase,
          shortageBase: shortfallBase, // for backward compatibility with older radar logic
          buyQty,
          estimatedCost
        };
      });

      // Sort: First Top 10 Related (shortfall first), then others.
      finalForecast.sort((a,b) => {
         if (a.isTop10Related !== b.isTop10Related) return a.isTop10Related ? -1 : 1;
         if (a.shortfall > 0 && b.shortfall === 0) return -1;
         if (b.shortfall > 0 && a.shortfall === 0) return 1;
         return b.projectedRequiredQty - a.projectedRequiredQty;
      });

      setForecastData(finalForecast);
    } catch (e) {
      console.error("Forecast error", e);
    }
    setLoading(false);
  }, [filterDate, maxOrdersPerDay, forecastDays, topNLimit]);

  useEffect(() => {
    generateForecast();
  }, [generateForecast]);

  return {
    forecastData,
    rankedProducts,
    loading,
    refreshForecast: generateForecast
  };
};
