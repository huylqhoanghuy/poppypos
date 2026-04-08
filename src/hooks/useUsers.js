import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useActivityLogger } from './useActivityLogger';

export const useUsers = () => {
  const { state, dispatch } = useData();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logAction } = useActivityLogger();

  // Mảng mặc định theo đặc tả Hệ thống nếu DB trống
  const defaultUsers = [
    { id: 'U1', username: 'admin', password: 'admin', name: 'Quản Trị Tối Cao', role: 'ADMIN', status: 'active', createdAt: Date.now() },
    { id: 'U2', username: 'quanly', password: '123', name: 'Quản Lý Cửa Hàng', role: 'MANAGER', status: 'active', createdAt: Date.now() },
    { id: 'U3', username: 'thungan', password: '123', name: 'Thu Ngân', role: 'CASHIER', status: 'active', createdAt: Date.now() }
  ];

  useEffect(() => {
    // Nếu chưa từng lưu trữ danh sách DB, hoặc danh sách hoàn toàn rỗng.
    if (!state.users || state.users.length === 0) {
      // Dùng HYDRATE_STATE_SILENT hoặc ADD_USER từng người
      // Ở đây ta bypass nhanh bằng cách gọi StorageService nếu cần, nhưng thay vào đó ta chỉ cần set local để render.
      // Firebase/Localstorage sẽ tự hứng lấy state mới khi update.
      setUsers(defaultUsers);
    } else {
      let currentStateUsers = [...state.users];
      const hasAdmin = currentStateUsers.some(u => u.username === 'admin');
      if (!hasAdmin) {
        currentStateUsers.unshift(defaultUsers[0]);
        // Tắt dispatch update toàn mảng ở đây vì DataContext không cho phép ghi đè toàn mảng users dễ dàng
      }
      setUsers(currentStateUsers);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.users]);

  const addUser = async (userData) => {
    try {
      dispatch({ type: 'ADD_USER', payload: { ...userData, status: userData.status || 'active', createdAt: Date.now() } });
      logAction('ADD_USER', `Cấp quyền cho nhân viên [${userData.username}]`);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  };

  const updateUser = async (updatedUser) => {
    try {
      // Chặn đổi username của admin để bảo vệ hardcode logic
      if (updatedUser.id === 'U1' && updatedUser.username !== 'admin') {
          return { success: false, message: 'Với tài khoản Admin Tối Cao, bạn tuyệt đối không được đổi Username "admin".' };
      }
      
      // Xóa passwordHash cũ khi cập nhật mật khẩu mới (ép hệ thống dùng mật khẩu plain text mới nhập)
      updatedUser.passwordHash = '';
      
      dispatch({ type: 'UPDATE_USER', payload: updatedUser });
      logAction('UPDATE_USER', `Chỉnh sửa thông tin nhân viên [${updatedUser.username}]`);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  };

  const deleteUser = async (userId) => {
    if (userId === 'U1') {
        return { success: false, message: 'LỖI: Bạn không thể xóa tài khoản Quản trị tối cao (Admin)!' };
    }
    try {
      const userToDelete = users.find(u => u.id === userId);
      dispatch({ type: 'DELETE_USER', payload: userId });
      logAction('DELETE_USER', `Xóa nhân viên [${userToDelete?.username || userId}]`);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { success: false, message: error.message };
    }
  };

  const updatePin = async (newPin) => {
     try {
        dispatch({ type: 'UPDATE_SETTINGS', payload: { securityPin: newPin } });
        return { success: true };
     } catch (e) {
        return { success: false, message: e.message };
     }
  };

  return {
    users: users.filter(u => !u.deleted),
    settings: state.settings || {},
    loading,
    addUser,
    updateUser,
    deleteUser,
    updatePin
  };
};
