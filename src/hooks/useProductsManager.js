import { useState, useEffect } from 'react';
import { useListController } from './useListController';
import { useProducts } from './useProducts';
import { useCategories } from './useCategories';
import { useInventory } from './useInventory';
import { useData } from '../context/DataContext';
import { useInventoryEngine } from './useInventoryEngine';

export const useProductsManager = () => {
  const { products, addProduct, updateProduct, deleteProduct, hardDeleteProduct, restoreProduct, bulkDeleteProducts, bulkHardDeleteProducts, bulkRestoreProducts } = useProducts();
  const { categories } = useCategories();
  const { ingredients } = useInventory();
  const { dispatch } = useData();

  const handleShowToast = (message, type) => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  };

  const listState = useListController({ 
    entityName: 'PRODUCT',
    data: products,
    onDelete: deleteProduct,
    onHardDelete: hardDeleteProduct,
    onRestore: restoreProduct,
    onBulkDelete: bulkDeleteProducts,
    onBulkHardDelete: bulkHardDeleteProducts,
    onBulkRestore: bulkRestoreProducts,
    onShowToast: handleShowToast
  });

  const {
    filteredActiveItems, search, selectedIds, toggleSelection,
    showForm, setShowForm,
    handlers: { handleDelete, showToast }
  } = listState;

  const [form, setForm] = useState({ id: '', name: '', unit: '', category: '', price: '', image: '', recipe: [], status: 'active' });
  const [recipeItem, setRecipeItem] = useState({ ingredientId: '', qty: '', unitMode: 'base' });

  const [viewingProduct, setViewingProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowDetail(false);
        setViewingProduct(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const safeNumber = (val) => Number(val) || 0;
  const getPercentage = (cost, price) => {
    const p = safeNumber(price);
    const c = safeNumber(cost);
    return p > 0 ? ((c / p) * 100).toFixed(1) : '0.0';
  };
  const getMargin = (cost, price) => {
    const p = safeNumber(price);
    const c = safeNumber(cost);
    return p > 0 ? (((p - c) / p) * 100).toFixed(1) : '0.0';
  };

  const { 
    calculateTotalCost, 
    getProductMaxCapacityInfo, 
    getEntityDisplayDetails,
    calculateMaxPortions,
    getRecipeItemCost
  } = useInventoryEngine({ ingredients, products });

  const saveProduct = (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.unit || form.price === '') {
      alert("Vui lòng điền đầy đủ: Tên hiển thị, Nhóm danh mục, Đơn vị tính và Giá bán.");
      return;
    }
    const safeRecipe = form.recipe.map(r => ({ ...r, qty: parseFloat(String(r.qty).replace(/,/g, '.')) || 0 }));
    const payload = { ...form, price: Number(form.price), recipe: safeRecipe };
    if (form.id) updateProduct(payload);
    else addProduct(payload);
    showToast(`Đã lưu "${form.name}" thành công!`);
    setShowForm(false);
    setForm({ id: '', name: '', unit: '', category: '', price: '', image: '', recipe: [], status: 'active' });
  };

  const duplicateProduct = (p) => {
    const clone = JSON.parse(JSON.stringify(p));
    delete clone.id;
    clone.name = `${clone.name} (Bản sao)`;
    setForm(clone);
    setShowForm(true);
  };

  const addRecipeItem = () => {
    if (!recipeItem.ingredientId || !recipeItem.qty) return;
    const exist = form.recipe.find(r => r.ingredientId === recipeItem.ingredientId);
    if (exist) return alert('Thành phần này đã có! Vui lòng sửa lượng ở bảng bên dưới.');
    const node = getEntityDisplayDetails(recipeItem.ingredientId);
    const safeQtyStr = String(recipeItem.qty).replace(/,/g, '.');
    const parsedQty = parseFloat(safeQtyStr);
    if (isNaN(parsedQty)) return alert('Số lượng không hợp lệ');
    setForm(prev => ({ ...prev, recipe: [...prev.recipe, { ...recipeItem, qty: parsedQty, name: node?.name }] }));
    setRecipeItem({ ingredientId: '', qty: '', unitMode: 'base' });
  };

  const removeRecipeItem = (index) => setForm(prev => ({ ...prev, recipe: prev.recipe.filter((_, i) => i !== index) }));
  const updateRecipeQty = (index, newQty) => setForm(prev => { const updated = [...prev.recipe]; updated[index].qty = String(newQty); return { ...prev, recipe: updated }; });
  const updateRecipeUnitMode = (index, newMode) => setForm(prev => { const updated = [...prev.recipe]; updated[index].unitMode = newMode; return { ...prev, recipe: updated }; });

  const finalFilteredItems = filteredActiveItems.filter(p => filterCategory === 'all' || p.category === filterCategory);

  return {
    products, categories, ingredients,
    listState,
    form, setForm,
    recipeItem, setRecipeItem,
    viewingProduct, setViewingProduct,
    showDetail, setShowDetail,
    viewMode, setViewMode,
    filterCategory, setFilterCategory,
    safeNumber, getPercentage, getMargin,
    calculateTotalCost, getProductMaxCapacityInfo, getEntityDisplayDetails, calculateMaxPortions, getRecipeItemCost,
    saveProduct, duplicateProduct, addRecipeItem, removeRecipeItem, updateRecipeQty, updateRecipeUnitMode,
    finalFilteredItems,
    filteredActiveItems, search, selectedIds, toggleSelection, showForm, setShowForm, handleDelete, showToast
  };
};
