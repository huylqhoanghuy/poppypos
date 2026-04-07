import React from 'react';
import { Package } from 'lucide-react';
import InventoryUI from '../components/InventoryUI';
import { useInventory } from '../hooks/useInventory';
import { useSuppliers } from '../hooks/useSuppliers';
import { usePurchases } from '../hooks/usePurchases';
import { useCategories } from '../hooks/useCategories';
import { useOrders } from '../hooks/useOrders';
import { useProducts } from '../hooks/useProducts';

const Inventory = () => {
  const { 
    activeIngredients: inventory, 
    loading: ingLoading, 
    addIngredient, 
    updateIngredient, 
    deleteIngredient 
  } = useInventory();
  
  const { 
    activeSuppliers, 
    loading: supLoading, 
    addSupplier, 
    updateSupplier, 
    deleteSupplier 
  } = useSuppliers();

  const { purchases, loading: purLoading } = usePurchases();
  const { categories, loading: catLoading } = useCategories();
  const { orders: activeOrders, loading: orderLoading } = useOrders();
  const { activeProducts, loading: prodLoading } = useProducts();

  const loading = ingLoading || supLoading || purLoading || catLoading || orderLoading || prodLoading;

  const handleSaveIngredient = async (ingData) => {
    if (ingData.id) {
      await updateIngredient(ingData);
    } else {
      await addIngredient(ingData);
    }
  };

  const handleSaveSupplier = async (supData) => {
    if (supData.id) {
      await updateSupplier(supData);
    } else {
      await addSupplier(supData);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang nạp dữ liệu kho...</div>;

  return (
    <InventoryUI 
      ingredients={inventory}
      suppliers={activeSuppliers}
      purchaseOrders={purchases}
      posOrders={activeOrders}
      products={activeProducts}
      categories={(categories || []).filter(c => !c.deleted && c.type !== 'menu')}
      onSaveIngredient={handleSaveIngredient}
      onDeleteIngredient={deleteIngredient}
      onSaveSupplier={handleSaveSupplier}
      onDeleteSupplier={deleteSupplier}
    />
  );
};

export default Inventory;
