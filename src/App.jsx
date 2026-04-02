import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Wallet,
  Bell,
  Store,
  Coffee,
  Tags,
  Settings as SettingsIcon,
  ClipboardList,
  CreditCard,
  ListTree,
  Search,
  CloudUpload,
  CloudDownload,
  Trash2,
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react';
import './App.css';

// Code-splitting: Load pages on demand to reduce initial bundle
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const POS = React.lazy(() => import('./pages/POS'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const PriceStructure = React.lazy(() => import('./pages/PriceStructure'));
const Accounting = React.lazy(() => import('./pages/Accounting'));
const BusinessReports = React.lazy(() => import('./pages/BusinessReports'));
const ChannelReports = React.lazy(() => import('./pages/ChannelReports'));
const InventoryReports = React.lazy(() => import('./pages/InventoryReports'));
const Products = React.lazy(() => import('./pages/Products'));
const Categories = React.lazy(() => import('./pages/Categories'));
const Channels = React.lazy(() => import('./pages/Channels'));
const Accounts = React.lazy(() => import('./pages/Accounts'));
const Orders = React.lazy(() => import('./pages/Orders'));
const FinanceCategories = React.lazy(() => import('./pages/FinanceCategories'));
const Settings = React.lazy(() => import('./pages/Settings'));
const BackupSync = React.lazy(() => import('./pages/BackupSync'));
const GlobalTrash = React.lazy(() => import('./pages/GlobalTrash'));
const Purchases = React.lazy(() => import('./pages/Purchases'));
const InventoryWarning = React.lazy(() => import('./pages/InventoryWarning'));
const FinancialStatements = React.lazy(() => import('./pages/FinancialStatements'));
import Login from './pages/Login';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import { TrendingUp, BarChart3, FileText, CheckCircle2, AlertCircle, Briefcase } from 'lucide-react';

import { ChevronDown, ChevronRight } from 'lucide-react';

const SidebarSection = ({ item, onNavItemClick }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(
    item.children ? item.children.some(child => location.pathname === child.path) : false
  );

  // Item đơn (không có submenu)
  if (!item.children) {
    const isActive = location.pathname === item.path;
    return (
      <Link
        to={item.path}
        className={`nav-item ${isActive ? 'active' : ''}`}
        onClick={onNavItemClick}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, width: '20px', height: '20px', color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)' }}>
          {item.icon}
        </div>
        <span>{item.name}</span>
      </Link>
    );
  }


  const isActiveGroup = item.children.some(child => location.pathname === child.path);

  return (
    <div className="sidebar-group" style={{ marginBottom: '2px' }}>
      <div
        className={`nav-item ${isActiveGroup ? 'active-group' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, width: '20px', height: '20px', color: isActiveGroup ? '#ff9f67' : 'rgba(255,255,255,0.5)' }}>
            {item.icon}
          </span>
          <span style={{ fontWeight: isActiveGroup ? 600 : 500, color: isActiveGroup ? '#ff9f67' : 'rgba(255,255,255,0.65)' }}>{item.name}</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center' }}>
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </div>

      {isOpen && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '1px',
          paddingLeft: '14px', marginTop: '2px', marginBottom: '4px',
          borderLeft: '1px solid rgba(255,255,255,0.1)',
          marginLeft: '22px',
          animation: 'slideDown 0.2s ease-out'
        }}>
          {item.children.map(child => (
            <Link
              key={child.path}
              to={child.path}
              className={`nav-item ${location.pathname === child.path ? 'active' : ''}`}
              style={{ minHeight: '34px', padding: '8px 10px', fontSize: '13px', borderRadius: '8px' }}
              onClick={onNavItemClick}
            >
              <span>{child.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const SidebarMenu = ({ onNavItemClick }) => {
  const { user } = useAuth();
  const role = user?.role || 'CASHIER';

  const menuConfig = [
    { path: '/', name: 'Tổng Quan', icon: <LayoutDashboard size={20} /> },
    {
      name: 'Kinh Doanh',
      icon: <ShoppingCart size={20} />,
      children: [
        { path: '/pos', name: 'Bán Hàng (POS)' },
        { path: '/orders', name: 'Lịch Sử Đơn Hàng' },
        ...(role === 'ADMIN' || role === 'MANAGER' ? [{ path: '/channels', name: 'Kênh Bán (Grab/Shopee)' }] : [])
      ]
    },
    {
      name: 'Kho & Món',
      icon: <Package size={20} />,
      children: [
        ...(role === 'ADMIN' ? [{ path: '/products', name: 'Thực Đơn (Menu)' }, { path: '/categories', name: 'Thiết Lập Danh Mục' }] : []),
        { path: '/inventory', name: 'Kho / Nguyên Liệu' },
        ...(role !== 'CASHIER' ? [{ path: '/inventory-warning', name: 'Cảnh Báo Nhập Kho' }] : []),
        ...(role !== 'CASHIER' ? [{ path: '/purchases', name: 'Nhập Hàng (PO)' }] : [])
      ]
    },
    ...(role !== 'CASHIER' ? [{
      name: 'Tài Chính',
      icon: <Wallet size={20} />,
      children: [
        { path: '/accounting', name: 'Sổ Quỹ (Giao Dịch)' },
        { path: '/accounts', name: 'Tài Khoản & Ví' },
        { path: '/finance-categories', name: 'Hạng Mục Thu/Chi' }
      ]
    }] : []),
    ...(role !== 'CASHIER' ? [{
      name: 'Báo Cáo Hoạt Động',
      icon: <FileText size={20} />,
      children: [
        { path: '/reports/business', name: 'Doanh Thu & Lợi Nhuận' },
        { path: '/reports/channels', name: 'Báo Cáo Kênh Bán' },
        { path: '/reports/finance', name: 'Cấu Trúc Giá & LN Menu' },
        { path: '/reports/inventory', name: 'Báo Cáo Tồn Kho' }
      ]
    }] : []),
    ...(role === 'ADMIN' ? [{ path: '/bctc', name: 'Báo Cáo Tài Chính', icon: <Briefcase size={20} /> }] : []),
    ...(role === 'ADMIN' ? [{
      name: 'Hệ Thống',
      icon: <SettingsIcon size={20} />,
      children: [
        { path: '/settings', name: 'Cài Đặt Chung' },
        { path: '/backup-sync', name: 'Đồng Bộ & Sao Lưu' },
        { path: '/global-trash', name: 'Thùng Rác Tổng' }
      ]
    }] : [])
  ];

  return (
    <nav className="sidebar-nav">
      {menuConfig.map((item, index) => (
        <SidebarSection key={index} item={item} onNavItemClick={onNavItemClick} />
      ))}
    </nav>
  );
};

import { Menu, X, LogOut } from 'lucide-react';

import { useData } from './context/DataContext';
import { ConfirmProvider } from './context/ConfirmContext';
import GlobalToast from './components/GlobalToast';
import LiveClock from './components/LiveClock';
import { useAutoInventoryWarning } from './hooks/useAutoInventoryWarning';

const AppContent = () => {
  useAutoInventoryWarning();

  const { state, dispatch } = useData();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const notifRef = React.useRef(null);
  
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);
  
  const notifications = (state.notifications || []).filter(n => !n.deleted);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const storeName = state?.settings?.storeName || 'Xóm Gà POPPY';
  const logoUrl = state?.settings?.logoUrl;
  const storeBranch = state?.settings?.branch || 'Chi Nhánh 1';

  React.useEffect(() => {
    // Cập nhật Document Title
    document.title = `${storeName} | Quản trị Hệ Thống`;
    // Thử cập nhật favicon nếu có
    if (state?.settings?.faviconUrl) {
       let link = document.querySelector("link[rel~='icon']");
       if (!link) {
           link = document.createElement('link');
           link.rel = 'icon';
           document.getElementsByTagName('head')[0].appendChild(link);
       }
       link.href = state.settings.faviconUrl;
    }
  }, [storeName, state?.settings?.faviconUrl]);

  React.useEffect(() => {
    if (state.toast) {
      const t = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [state.toast, dispatch]);

  // Data validation/migration can happen here if needed natively
  React.useEffect(() => {
    // Left empty for future data migrations on boot
  }, []);

  // BACKGROUND WORKER: Auto Cloud Webhook Sync
  React.useEffect(() => {
    const webhookUrl = state?.settings?.webhookUrl;
    const intervalStr = state?.settings?.autoCloudSyncTime; // e.g. "1h", "3h", "4h", "12h"
    
    if (!webhookUrl || !intervalStr || intervalStr === 'none') {
      return;
    }
    
    let isChecking = false;

    const checkAndSync = async () => {
      if (isChecking) return;
      isChecking = true;
      
      try {
        const { StorageService } = await import('./services/api/storage');
        const currentState = await StorageService.getAll();
        const settings = currentState.settings || {};
        const lastSync = settings.lastWebhookSync || 0;
        
        let hoursNeeded = null;
        if (intervalStr === '1h') hoursNeeded = 1;
        if (intervalStr === '3h') hoursNeeded = 3;
        if (intervalStr === '4h') hoursNeeded = 4;
        if (intervalStr === '12h') hoursNeeded = 12;
        
        if (hoursNeeded) {
          const msNeeded = hoursNeeded * 60 * 60 * 1000;
          if (Date.now() - lastSync >= msNeeded) {
            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                timestamp: new Date().toISOString(),
                storeName: settings.storeName || 'OmniPOS',
                type: 'auto_webhook_sync',
                data: currentState
              })
            });

            if (response.ok) {
              settings.lastWebhookSync = Date.now();
              currentState.settings = settings;
              await StorageService.saveAll(currentState);
              dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
              dispatch({ type: 'SHOW_TOAST', payload: { message: `✅ Đã tự động tải lên Make.com theo chu kỳ ${hoursNeeded} tiếng!`, type: 'success' } });
              dispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                  title: 'Đồng bộ Đám mây (Webhook)',
                  message: `Bản sao lưu dự phòng JSON định kỳ đã được kết xuất tĩnh và gửi an toàn qua API vào lúc ${new Date().toLocaleTimeString('vi-VN')}.`,
                  type: 'success'
                }
              });
            } else {
              dispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                  title: 'Lỗi Đồng bộ Webhook',
                  message: `Hệ thống vừa cố gửi gói dữ liệu định kỳ nhưng API kết nối bị lỗi. Mã HTTP: ${response.status}`,
                  type: 'error'
                }
              });
            }
          }
        }
      } catch (e) {
        console.error("Auto Sync Worker Error:", e);
      }
      isChecking = false;
    };
    
    // Check initially after 15s wait to not block UI thread on boot
    const initialTimeout = setTimeout(checkAndSync, 15000);
    
    // Then check every 15 minutes continuously
    const intervalId = setInterval(checkAndSync, 15 * 60 * 1000);
    
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
    };
  }, [state?.settings?.webhookUrl, state?.settings?.autoCloudSyncTime, dispatch]);

  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  if (!user && !isLoginPage) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoginPage) {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
  }

  return (
    <div className={`app-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />

      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }} onClick={() => setIsMobileMenuOpen(false)}>
            {logoUrl ? <img src={logoUrl} alt="Logo" style={{ height: '32px', borderRadius: '6px' }}/> : (
                <div style={{ background: 'linear-gradient(135deg, #f75300, #ff7a30)', padding: '7px', borderRadius: '10px', color: 'white', display: 'flex', boxShadow: '0 3px 10px rgba(247,83,0,0.4)' }}><BarChart3 size={18} /></div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="brand-name">{storeName}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{storeBranch}</span>
            </div>
          </div>
          <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
        </div>
        <SidebarMenu onNavItemClick={() => setIsMobileMenuOpen(false)} />
      </aside>

          <div className="main-wrapper">
            <header className="top-header">
              <div className="header-left">
                <button className="mobile-burger" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu size={24} />
                </button>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h1 className="header-title" style={{ fontSize: '18px', margin: 0 }}>Hệ Thống Quản Trị & Vận Hành Bán Hàng</h1>
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    [{user?.role === 'ADMIN' ? 'Quản Trị Tối Cao' : user?.role === 'MANAGER' ? 'Quản Lý Cửa Hàng' : 'Nhân Viên Thu Ngân'}]
                  </span>
                </div>
              </div>

              <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="hide-on-mobile">
                  <LiveClock />
                </div>
                <div style={{ position: 'relative' }} ref={notifRef}>
                  <button onClick={() => setShowNotifications(!showNotifications)} style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                    background: unreadCount > 0 ? '#FEF2F2' : (showNotifications ? 'var(--surface-hover)' : 'transparent'), 
                    padding: unreadCount > 0 ? '6px 16px 6px 12px' : '8px', 
                    border: unreadCount > 0 ? '1px solid #FECACA' : '1px solid transparent', 
                    borderRadius: '24px', transition: 'all 0.2s', position: 'relative'
                  }}>
                    <Bell size={20} color={unreadCount > 0 ? "var(--danger)" : "var(--text-primary)"} className={unreadCount > 0 ? 'bell-ringing' : ''} />
                    {unreadCount > 0 && (
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)', whiteSpace: 'nowrap' }}>
                        Bạn có {unreadCount} tin mới
                      </span>
                    )}
                  </button>
                  
                  {showNotifications && (
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                      width: '320px', background: 'white', border: '1px solid var(--surface-border)',
                      borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 999
                    }}>
                      <div style={{ padding: '16px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Thông báo</h3>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {unreadCount > 0 && (
                              <button onClick={() => dispatch({ type: 'MARK_ALL_NOTIFICATIONS_READ' })} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Đã xem hết</button>
                            )}
                        </div>
                      </div>
                      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>Chưa có thông báo nào</div>
                        ) : (
                          notifications.map(n => (
                            <div 
                              key={n.id} 
                              onClick={() => { if (!n.isRead) dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id }); }}
                              style={{ 
                                padding: '12px 16px', borderBottom: '1px solid var(--surface-border)', 
                                background: n.isRead ? 'transparent' : '#F0FDF4', 
                                cursor: 'pointer', transition: 'background 0.2s',
                                borderLeft: !n.isRead ? '3px solid #16A34A' : '3px solid transparent'
                              }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ marginTop: '2px', color: n.type === 'success' ? '#16A34A' : n.type === 'error' ? '#EF4444' : n.type === 'warning' ? '#D97706' : '#2563EB' }}>
                                  {n.type === 'success' ? <CheckCircle size={18}/> : n.type === 'warning' ? <AlertTriangle size={18}/> : n.type === 'error' ? <XCircle size={18}/> : <Info size={18}/>}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: '14px', fontWeight: !n.isRead ? 600 : 500, color: 'var(--text-primary)', marginBottom: '4px' }}>{n.title}</div>
                                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '6px' }}>{n.message}</div>
                                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(n.timestamp).toLocaleString('vi-VN')}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', alignItems: 'center' }}>
                                  <button title="Xóa thông báo" onClick={(e) => { 
                                     e.stopPropagation(); 
                                     dispatch({ type: 'DELETE_NOTIFICATION', payload: n.id }); 
                                     dispatch({ type: 'SHOW_TOAST', payload: { message: 'Đã chuyển thông báo vào thùng rác' } });
                                  }} style={{ background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
                                    <Trash2 size={14}/>
                                  </button>
                                  {!n.isRead && (
                                    <button title="Đánh dấu đã đọc" onClick={(e) => { e.stopPropagation(); dispatch({ type: 'MARK_NOTIFICATION_READ', payload: n.id }); }} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
                                      <CheckCircle size={14}/>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="user-profile" style={{ padding: '4px 12px 4px 4px', background: 'var(--surface-color)', borderRadius: '24px', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="user-avatar" style={{ overflow: 'hidden', width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }}>
                    <img src={`https://ui-avatars.com/api/?name=${user?.username}&background=random`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                     <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{user?.name || user?.username}</span>
                  </div>
                </div>

                <button title="Đăng xuất" onClick={logout} className="btn btn-ghost" style={{ background: '#FEF2F2', padding: '10px', color: 'var(--danger)', borderRadius: '12px', border: '1px solid #FCA5A5' }}>
                  <LogOut size={20} />
                </button>
              </div>
            </header>

            <main className="content-area">
              <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', fontWeight: 600 }}>Đang tải...</div>}>
              <Routes>
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                
                {/* Manager / Admin Areas */}
                <Route path="/channels" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Channels /></ProtectedRoute>} />
                <Route path="/products" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Products /></ProtectedRoute>} />
                <Route path="/categories" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Categories /></ProtectedRoute>} />
                
                {/* Everyone can see inventory, but restricted writes (handled in component) */}
                <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                
                {/* Manager / Admin */}
                <Route path="/inventory-warning" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><InventoryWarning /></ProtectedRoute>} />
                <Route path="/purchases" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Purchases /></ProtectedRoute>} />
                
                <Route path="/accounting" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Accounting /></ProtectedRoute>} />
                <Route path="/finance-categories" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><FinanceCategories /></ProtectedRoute>} />
                <Route path="/accounts" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Accounts /></ProtectedRoute>} />
                
                {/* Admin Only */}
                <Route path="/bctc" element={<ProtectedRoute allowedRoles={['ADMIN']}><FinancialStatements /></ProtectedRoute>} />
                
                <Route path="/reports/business" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><BusinessReports /></ProtectedRoute>} />
                <Route path="/reports/channels" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><ChannelReports /></ProtectedRoute>} />
                <Route path="/reports/finance" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><PriceStructure /></ProtectedRoute>} />
                <Route path="/reports/inventory" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><InventoryReports /></ProtectedRoute>} />
                
                <Route path="/settings" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Settings /></ProtectedRoute>} />
                <Route path="/backup-sync" element={<ProtectedRoute allowedRoles={['ADMIN']}><BackupSync /></ProtectedRoute>} />
                <Route path="/global-trash" element={<ProtectedRoute allowedRoles={['ADMIN']}><GlobalTrash /></ProtectedRoute>} />
                
                {/* Catch all non-matched routes and redirect to dashboard */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              </Suspense>
            </main>
          </div>

          {state.toast && (
            <div style={{
              position: 'fixed', bottom: '32px', right: '32px', zIndex: 9999,
              background: '#FFFFFF',
              color: 'var(--text-primary)',
              padding: '12px 24px 12px 14px',
              borderRadius: '16px',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', gap: '14px',
              fontWeight: 600, fontSize: '15px',
              animation: 'slideInToast 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: 'none'
            }}>
              <div style={{
                background: state.toast.type === 'error' ? '#FEF2F2' : '#F0FDF4',
                color: state.toast.type === 'error' ? 'var(--danger)' : 'var(--success)',
                width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                {state.toast.type === 'error' ? <AlertCircle size={20} strokeWidth={2.5} /> : <CheckCircle2 size={20} strokeWidth={2.5} />}
              </div>
              {state.toast.message}
            </div>
          )}
          <GlobalToast />
    </div>
  );
};

export default function App() {
  return (
    <ConfirmProvider>
      <AuthProvider>
        <Router basename={import.meta.env.BASE_URL}>
           <AppContent />
        </Router>
      </AuthProvider>
    </ConfirmProvider>
  );
}
