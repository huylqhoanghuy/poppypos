import React from 'react';
import { useUsers } from '../hooks/useUsers';
import UsersUI from '../components/UsersUI';
import { useData } from '../context/DataContext';

const Users = () => {
  const { users, settings, loading, addUser, updateUser, deleteUser, updatePin } = useUsers();
  const { dispatch } = useData();

  if (loading) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Đang nạp dữ liệu nhân sự...</div>;
  }

  const handleSave = async (userData) => {
    if (userData.id) {
       const res = await updateUser(userData);
       if (res.success) {
           dispatch({ type: 'SHOW_TOAST', payload: { message: `Thay đổi thông tin tài khoản [${userData.username}] thành công!`, type: 'success' } });
       } else {
           dispatch({ type: 'SHOW_TOAST', payload: { message: res.message, type: 'error' } });
       }
    } else {
       const res = await addUser(userData);
       if (res.success) {
           dispatch({ type: 'SHOW_TOAST', payload: { message: `Đã cấp tài khoản phân quyền [${userData.username}] thành công!`, type: 'success' } });
       } else {
           dispatch({ type: 'SHOW_TOAST', payload: { message: res.message, type: 'error' } });
       }
    }
  };

  const handleDelete = async (id) => {
     const res = await deleteUser(id);
     if (res.success) {
         dispatch({ type: 'SHOW_TOAST', payload: { message: `Đã đóng băng thẻ và xử lý tài khoản thành công!`, type: 'success' } });
     } else {
         dispatch({ type: 'SHOW_TOAST', payload: { message: res.message, type: 'error' } });
     }
  };

  const handleUpdatePin = async (newPin) => {
     if (!newPin || newPin.length < 4) {
         dispatch({ type: 'SHOW_TOAST', payload: { message: 'Mã PIN phải có ít nhất 4 ký tự!', type: 'error' } });
         return;
     }
     const res = await updatePin(newPin);
     if (res.success) {
         dispatch({ type: 'SHOW_TOAST', payload: { message: `Đã thay đổi mã PIN hệ thống thành công!`, type: 'success' } });
     } else {
         dispatch({ type: 'SHOW_TOAST', payload: { message: res.message, type: 'error' } });
     }
  };

  return <UsersUI users={users} settings={settings} onSave={handleSave} onDelete={handleDelete} onUpdatePin={handleUpdatePin} />;
};

export default Users;
