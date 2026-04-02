import React, { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import AccountsUI from '../components/AccountsUI';
import ModuleLayout from '../components/ModuleLayout';
import { Landmark } from 'lucide-react';
import { useData } from '../context/DataContext';

const Accounts = () => {
  const { dispatch } = useData();
  const { activeAccounts, loading, error, addAccount, updateAccount, deleteAccount, getTransactionsByAccount } = useAccounts();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSave = async (accountData) => {
    try {
      if (accountData.id) {
        await updateAccount(accountData);
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'Tài khoản Kế toán', message: `Cập nhật thẻ ${accountData.name} thành công.`, type: 'success' } });
      } else {
        await addAccount(accountData);
        dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'Tài khoản Kế toán', message: `Mở thẻ mới ${accountData.name} thành công.`, type: 'success' } });
      }
    } catch (err) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'Lỗi', message: 'Không thể lưu thẻ: ' + err.message, type: 'error' } });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAccount(id);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'Tài khoản Kế toán', message: `Khóa tài khoản thành công.`, type: 'info' } });
    } catch (err) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'Lỗi', message: 'Không thể khóa thẻ: ' + err.message, type: 'error' } });
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Giả lập reload state vì AutoBackup/IndexedDB đang đồng bộ
    setTimeout(() => setIsRefreshing(false), 600);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang nạp dữ liệu tài khoản...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red' }}>Lỗi lấy dữ liệu: {error}</div>;

  return (
    <ModuleLayout title="Quản Lý Tài Khoản Kế Toán" icon={Landmark} disableSearch={true}>
      <AccountsUI 
        accounts={activeAccounts}
        onSave={handleSave}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        getTransactions={getTransactionsByAccount}
      />
    </ModuleLayout>
  );
};

export default Accounts;
