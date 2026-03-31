import React, { useState } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import AccountsUI from '../components/AccountsUI';
import ModuleLayout from '../components/ModuleLayout';
import { Landmark } from 'lucide-react';

const Accounts = () => {
  const { activeAccounts, loading, error, addAccount, updateAccount, deleteAccount, getTransactionsByAccount } = useAccounts();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSave = async (accountData) => {
    try {
      if (accountData.id) {
        await updateAccount(accountData);
      } else {
        await addAccount(accountData);
      }
    } catch (err) {
      alert('Lỗi khi lưu thẻ tài khoản: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAccount(id);
    } catch (err) {
      alert('Lỗi đóng thẻ: ' + err.message);
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
