import React, { useState, useEffect } from 'react';
import ModuleLayout from '../components/ModuleLayout';
import PurchasesUI from '../components/PurchasesUI';
import { usePurchases } from '../hooks/usePurchases';
import { useConfirm } from '../context/ConfirmContext';
import { useData } from '../context/DataContext';
import { Truck } from 'lucide-react';

const Purchases = () => {
  const { dispatch } = useData();
  const { 
    purchases, 
    loading, 
    addPurchase, 
    updatePurchaseStatus, 
    deletePurchase, 
    getSuppliers, 
    getIngredients 
  } = usePurchases();

  const { confirm } = useConfirm();
  
  const showToast = (message, type = 'success') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  };
  
  const [suppliers, setSuppliers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const loadDependencies = async () => {
      const sups = await getSuppliers();
      const ings = await getIngredients();
      setSuppliers(sups);
      setIngredients(ings);
    };
    loadDependencies();
  }, [getSuppliers, getIngredients]);

  const handleAddPurchase = async (payload) => {
    try {
      await addPurchase(payload);
      showToast(payload.status === 'Paid' ? 'Đã thanh toán phiếu nhập & Cập nhật tồn kho!' : 'Đã ghi nợ phiếu nhập & Cập nhật tồn kho!', 'success');
    } catch (err) {
      showToast('Lỗi lập phiếu: ' + err.message, 'error');
    }
  };

  const handlePayDebt = async (poId, amount, supplierName, accountId) => {
    // eslint-disable-next-line no-unused-vars
    const safeAmount = Number(amount) || 0;
    try {
      await updatePurchaseStatus(poId, 'Paid', accountId);
      showToast('Đã cấn trừ công nợ thành công!', 'success');
    } catch (err) {
      showToast('Lỗi thanh toán: ' + err.message, 'error');
    }
  };

  const handleDeletePurchase = async (poId) => {
    const isConfirmed = await confirm({
       title: 'Hủy/Xóa Phiếu Nhập Kho',
       message: 'Cảnh báo: Hành động này sẽ tự động Kéo Trừ lại Tồn Kho nguyên liệu đã cộng, đồng thời Hoàn Lại Tiền vào Sổ Quỹ (Nếu đã thanh toán). Bạn có chắc chắn?',
       confirmText: 'Đồng ý Hủy Phiếu',
       type: 'danger'
    });
    if (isConfirmed) {
       try {
         await deletePurchase(poId);
         showToast('Đã hủy phiếu nhập và hoàn trả kho thành công.', 'success');
       } catch (err) {
         showToast('Lỗi xóa phiếu: ' + err.message, 'error');
       }
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang nạp dữ liệu nhập kho...</div>;

  return (
    <ModuleLayout title="Quản Lý Nhập Hàng Tồn Kho" icon={Truck} disableSearch={true}>
      <PurchasesUI 
         purchases={purchases}
         suppliers={suppliers}
         ingredients={ingredients}
         onAddPurchase={handleAddPurchase}
         onPayDebt={handlePayDebt}
         onDeletePurchase={handleDeletePurchase}
         isRefreshing={isRefreshing}
         onRefresh={handleRefresh}
      />
    </ModuleLayout>
  );
};

export default Purchases;
