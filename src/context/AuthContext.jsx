import React, { createContext, useContext, useState, useEffect } from 'react';
import { useData } from './DataContext';

const AuthContext = createContext();

const SESSION_KEY = 'omnipos_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Simple SHA-256 hash for client-side password comparison
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { state } = useData();

  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        // Check session expiry (24h)
        if (session.expiresAt && Date.now() > session.expiresAt) {
          localStorage.removeItem(SESSION_KEY);
        } else {
          // eslint-disable-next-line
          setUser(session.user);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    return new Promise(async (resolve, reject) => {
        const defaultUsers = [
          { id: 'U1', username: 'admin', password: 'admin', name: 'Quản Trị Tối Cao', role: 'ADMIN', status: 'active' },
          { id: 'U2', username: 'quanly', password: '123', name: 'Quản Lý Cửa Hàng', role: 'MANAGER', status: 'active' },
          { id: 'U3', username: 'thungan', password: '123', name: 'Thu Ngân', role: 'CASHIER', status: 'active' }
        ];
        
        let SYSTEM_DEFAULT_USERS = (state?.users && state.users.length > 0) ? state.users : defaultUsers;
        
        const safeUsername = username?.trim().toLowerCase();
        const safePassword = password?.trim();
        
        // Support both hashed and plaintext passwords for backward compatibility
        let foundUser = null;
        for (const u of SYSTEM_DEFAULT_USERS) {
          if (u.username.trim().toLowerCase() !== safeUsername || u.deleted) continue;
          
          // Admin account always uses hardcoded password
          if (u.username === 'admin') {
            if (safePassword === 'admin') { foundUser = u; break; }
            continue;
          }
          
          // Check hashed password first, then plaintext fallback
          if (u.passwordHash) {
            const inputHash = await hashPassword(safePassword);
            if (u.passwordHash === inputHash) { foundUser = u; break; }
          } else if (u.password?.trim() === safePassword) {
            foundUser = u;
            break;
          }
        }
        
        if (foundUser) {
          if (foundUser.status === 'inactive') {
            reject('Tài khoản này đã bị khóa!');
            return;
          }
          const uData = { id: foundUser.id, username: foundUser.username, role: foundUser.role, name: foundUser.name };
          const session = { user: uData, expiresAt: Date.now() + SESSION_TTL_MS };
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          setUser(uData);
          resolve(uData);
        } else {
          reject('Sai tên đăng nhập hoặc mật khẩu!');
        }
    });
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  if (loading) return null;

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, hashPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
