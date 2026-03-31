import { useMemo } from 'react';
import { InventoryService } from '../services/inventoryService';

export const useInventoryEngine = (state) => {
  const { ingredients = [], products = [] } = state;

  return useMemo(() => ({
    getRecipeItemCost: (r) => InventoryService.getRecipeItemCost(r, ingredients, products),
    calculateTotalCost: (recipe) => InventoryService.calculateTotalCost(recipe, ingredients, products),
    getEntityMaxPortionsInfo: (entityId, requiredQty, unitMode) => InventoryService.getEntityMaxPortionsInfo(entityId, requiredQty, unitMode, ingredients, products),
    getProductMaxCapacityInfo: (recipe) => InventoryService.getProductMaxCapacityInfo(recipe, ingredients, products),
    calculateMaxPortions: (recipe) => InventoryService.calculateMaxPortions(recipe, ingredients, products),
    getEntityDisplayDetails: (id) => InventoryService.getEntityDisplayDetails(id, ingredients, products)
  }), [ingredients, products]);
};
