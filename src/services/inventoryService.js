export const InventoryService = {
  getRecipeItemCost: (r, ingredients = [], products = []) => {
    const ing = ingredients.find(i => i.id === r.ingredientId);
    if (ing) {
      if (r.unitMode === 'buy') return (ing.cost || 0) * (ing.conversionRate || 1) * (r.qty || 0);
      if (r.unitMode === 'divide') return (ing.cost || 0) / (r.qty || 1);
      return (ing.cost || 0) * (r.qty || 0);
    }
    const prod = products.find(p => p.id === r.ingredientId);
    if (prod) {
      const prodCost = InventoryService.calculateTotalCost(prod.recipe, ingredients, products);
      return r.unitMode === 'divide' ? (prodCost / (r.qty || 1)) : (prodCost * (r.qty || 0));
    }
    return 0;
  },

  calculateTotalCost: (recipe, ingredients, products) => {
    if (!recipe || recipe.length === 0) return 0;
    return recipe.reduce((acc, r) => acc + InventoryService.getRecipeItemCost(r, ingredients, products), 0);
  },

  getEntityMaxPortionsInfo: (entityId, requiredQty, unitMode = 'base', ingredients = [], products = []) => {
    if (requiredQty <= 0) return { max: Infinity, limitingName: null };
    const ing = ingredients.find(i => i.id === entityId);
    if (ing) {
      let requiredBaseQty = requiredQty;
      if (unitMode === 'buy') requiredBaseQty = requiredQty * (ing.conversionRate || 1);
      if (unitMode === 'divide') requiredBaseQty = 1 / requiredQty;
      const totalBaseStock = (ing.stock || 0) * (ing.conversionRate || 1);
      return { max: Math.floor(totalBaseStock / requiredBaseQty), name: ing.name };
    }
    const prod = products.find(p => p.id === entityId);
    if (prod) {
      let requiredProdQty = requiredQty;
      if (unitMode === 'divide') requiredProdQty = 1 / requiredQty;
      const prodMaxObj = InventoryService.getProductMaxCapacityInfo(prod.recipe, ingredients, products);
      return { max: Math.floor(prodMaxObj.max / requiredProdQty), name: prodMaxObj.limitingName };
    }
    return { max: 0, name: '[Nguyên liệu bị xóa/thiếu]' };
  },

  getProductMaxCapacityInfo: (recipe, ingredients, products) => {
    if (!recipe || recipe.length === 0) return { max: Infinity, limitingName: null };
    let max = Infinity;
    let limitingName = null;
    recipe.forEach(r => {
      const capObj = InventoryService.getEntityMaxPortionsInfo(r.ingredientId, r.qty, r.unitMode, ingredients, products);
      if (capObj.max < max) {
        max = capObj.max;
        limitingName = capObj.name;
      }
    });
    return { max, limitingName };
  },

  calculateMaxPortions: (recipe, ingredients, products) => {
    return InventoryService.getProductMaxCapacityInfo(recipe, ingredients, products).max;
  },

  getEntityDisplayDetails: (id, ingredients, products) => {
    const ing = ingredients.find(i => i.id === id);
    if (ing) return { type: 'ingredient', name: ing.name, category: ing.category, baseUnit: ing.unit, buyUnit: ing.buyUnit, stock: ing.stock, cost: ing.cost, deleted: ing.deleted };
    const prod = products.find(p => p.id === id);
    if (prod) return { type: 'product', name: prod.name, baseUnit: prod.unit || 'Suất', buyUnit: null, stock: InventoryService.calculateMaxPortions(prod.recipe, ingredients, products), cost: InventoryService.calculateTotalCost(prod.recipe, ingredients, products), deleted: prod.deleted };
    return null;
  }
};
