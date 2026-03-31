import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from './DataContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { state } = useData();

  useEffect(() => {
    // Check session on mount
    const savedSession = localStorage.getItem('omnipos_session');
    if (savedSession) {
      try {
        const u = JSON.parse(savedSession);
        setUser(u);
      } catch (e) {
        localStorage.removeItem('omnipos_session');
      }
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const defaultUsers = [
          { id: 'U1', username: 'admin', password: 'admin', name: 'Quản Trị Tối Cao', role: 'ADMIN', status: 'active' },
          { id: 'U2', username: 'quanly', password: '123', name: 'Quản Lý Cửa Hàng', role: 'MANAGER', status: 'active' },
          { id: 'U3', username: 'thungan', password: '123', name: 'Thu Ngân', role: 'CASHIER', status: 'active' }
        ];
        // Merge from state if valid
        let MOCK_USERS = (state?.users && state.users.length > 0) ? state.users : defaultUsers;
        
        // Force admin pass to "admin" strictly during search in case cache has 123
        const safeUsername = username?.trim().toLowerCase();
        const safePassword = password?.trim();
        
        const foundUser = MOCK_USERS.find(
          u => u.username.trim().toLowerCase() === safeUsername && 
               (u.username === 'admin' ? safePassword === 'admin' : u.password.trim() === safePassword) && 
               !u.deleted
        );
        
        if (foundUser) {
          if (foundUser.status === 'inactive') {
            reject('Tài khoản này đã bị khóa!');
            return;
          }
          const uData = { id: foundUser.id, username: foundUser.username, role: foundUser.role, name: foundUser.name };
          localStorage.setItem('omnipos_session', JSON.stringify(uData));
          setUser(uData);
          resolve(uData);
        } else {
          reject('Sai tên đăng nhập hoặc mật khẩu!');
        }
      }, 500); // Simulate network delay
    });
  };

  const logout = () => {
    localStorage.removeItem('omnipos_session');
    setUser(null);
  };

  if (loading) return null; // Or a spinner

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
