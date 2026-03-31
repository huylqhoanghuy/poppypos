import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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
  Trash2
} from 'lucide-react';
import './App.css';

import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import PriceStructure from './pages/PriceStructure';
import Accounting from './pages/Accounting';
import BusinessReports from './pages/BusinessReports';
import ChannelReports from './pages/ChannelReports';
import InventoryReports from './pages/InventoryReports';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Channels from './pages/Channels';
import Accounts from './pages/Accounts';
import Orders from './pages/Orders';
import FinanceCategories from './pages/FinanceCategories';
import Settings from './pages/Settings';
import GlobalTrash from './pages/GlobalTrash';
import Purchases from './pages/Purchases';
import InventoryWarning from './pages/InventoryWarning';
import FinancialStatements from './pages/FinancialStatements';

import logoPoppy from './assets/logo_poppy.png';
import { TrendingUp, BarChart3, FileText, CheckCircle2, AlertCircle, Briefcase } from 'lucide-react';

import { ChevronDown, ChevronRight } from 'lucide-react';

const SidebarSection = ({ item, onNavItemClick }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(
    item.children ? item.children.some(child => location.pathname === child.path) : false
  );

  if (!item.children) {
    return (
      <Link
        to={item.path}
        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        onClick={onNavItemClick}
      >
        {item.icon}
        <span>{item.name}</span>
      </Link>
    );
  }

  const isActiveGroup = item.children.some(child => location.pathname === child.path);

  return (
    <div className="sidebar-group" style={{ marginBottom: '4px' }}>
      <div
        className={`nav-item ${isActiveGroup ? 'active-group' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', background: isActiveGroup ? 'rgba(239, 68, 68, 0.05)' : '', color: isActiveGroup ? 'var(--primary)' : 'var(--text-secondary)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {item.icon}
          <span style={{ fontWeight: isActiveGroup ? 600 : 500 }}>{item.name}</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </div>

      {isOpen && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '2px',
          paddingLeft: '32px', marginTop: '4px',
          animation: 'slideDown 0.2s ease-out'
        }}>
          {item.children.map(child => (
            <Link
              key={child.path}
              to={child.path}
              className={`nav-item ${location.pathname === child.path ? 'active' : ''}`}
              style={{ minHeight: '36px', padding: '8px 12px', fontSize: '13.5px' }}
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
  const menuConfig = [
    { path: '/', name: 'Tổng Quan', icon: <LayoutDashboard size={20} /> },
    {
      name: 'Kinh Doanh',
      icon: <ShoppingCart size={20} />,
      children: [
        { path: '/pos', name: 'Bán Hàng (POS)' },
        { path: '/orders', name: 'Lịch Sử Đơn Hàng' },
        { path: '/channels', name: 'Kênh Bán (Grab/Shopee)' }
      ]
    },
    {
      name: 'Kho & Món',
      icon: <Package size={20} />,
      children: [
        { path: '/products', name: 'Thực Đơn (Menu)' },
        { path: '/categories', name: 'Thiết Lập Danh Mục' },
        { path: '/inventory', name: 'Kho / Nguyên Liệu' },
        { path: '/inventory-warning', name: 'Cảnh Báo Nhập Kho' },
        { path: '/purchases', name: 'Nhập Hàng (PO)' }
      ]
    },
    {
      name: 'Tài Chính',
      icon: <Wallet size={20} />,
      children: [
        { path: '/accounting', name: 'Sổ Quỹ (Giao Dịch)' },
        { path: '/accounts', name: 'Tài Khoản & Ví' },
        { path: '/finance-categories', name: 'Hạng Mục Thu/Chi' }
      ]
    },
    {
      name: 'Báo Cáo Hoạt Động',
      icon: <FileText size={20} />,
      children: [
        { path: '/reports/business', name: 'Doanh Thu & Lợi Nhuận' },
        { path: '/reports/channels', name: 'Báo Cáo Kênh Bán' },
        { path: '/reports/finance', name: 'Cấu Trúc Giá & LN Menu' },
        { path: '/reports/inventory', name: 'Báo Cáo Tồn Kho' }
      ]
    },
    { path: '/bctc', name: 'Báo Cáo Tài Chính', icon: <Briefcase size={20} /> },
    {
      name: 'Hệ Thống',
      icon: <SettingsIcon size={20} />,
      children: [
        { path: '/settings', name: 'Cài Đặt Chung' },
        { path: '/global-trash', name: 'Thùng Rác Tổng' }
      ]
    }
  ];

  return (
    <nav className="sidebar-nav">
      {menuConfig.map((item, index) => (
        <SidebarSection key={index} item={item} onNavItemClick={onNavItemClick} />
      ))}
    </nav>
  );
};

import { Menu, X } from 'lucide-react';

import { useData } from './context/DataContext';
import { ConfirmProvider } from './context/ConfirmContext';

function App() {
  const { state, dispatch } = useData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (state.toast) {
      const t = setTimeout(() => {
        dispatch({ type: 'HIDE_TOAST' });
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [state.toast, dispatch]);

  // Migration: Nuke all mock items to fix phantom data issue permanently
  React.useEffect(() => {
    const raw = localStorage.getItem('omnipos_gaumuoi_v3');
    if (raw) {
      try {
        let data = JSON.parse(raw);
        let hasChanges = false;

        if (data.ingredients) {
          const initialLen = data.ingredients.length;
          data.ingredients = data.ingredients.filter(i => !i.name.includes('Mock') && !i.name.includes('Quất (Ngày 20/3)'));
          if (data.ingredients.length !== initialLen) hasChanges = true;
        }

        if (data.purchaseOrders) {
          const initialLen2 = data.purchaseOrders.length;
          data.purchaseOrders = data.purchaseOrders.filter(po => po.id !== 'NK-MOCK-QUAT' && po.id !== 'NK-MOCK-20-03');
          if (data.purchaseOrders.length !== initialLen2) hasChanges = true;
        }

        if (data.suppliers) {
          const initialLen3 = data.suppliers.length;
          data.suppliers = data.suppliers.filter(s => !s.name.includes('Mẫu'));
          if (data.suppliers.length !== initialLen3) hasChanges = true;
        }

        if (hasChanges) {
          localStorage.setItem('omnipos_gaumuoi_v3', JSON.stringify(data));
          console.log("[Auto-Clean] Nuked phantom mock data from DB.");
          window.location.reload();
        }
      } catch (e) { }
    }
  }, []);



  return (
    <ConfirmProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <div className={`app-container ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`}>
          {/* Overlay for mobile menu */}
          <div
            className="sidebar-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--primary)', padding: '6px', borderRadius: '8px', color: 'white', display: 'flex' }}>
                  <BarChart3 size={20} />
                </div>
                <span className="brand-name" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>POPPY MGR</span>
              </div>
              <button className="mobile-close" onClick={() => setIsMobileMenuOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <SidebarMenu onNavItemClick={() => setIsMobileMenuOpen(false)} />
          </aside>

          <div className="main-wrapper">
            <header className="top-header">
              <div className="header-left">
                <button className="mobile-burger" onClick={() => setIsMobileMenuOpen(true)}>
                  <Menu size={24} />
                </button>
                <h1 className="header-title">Hệ Thống Quản Lý Bán Hàng</h1>
              </div>

              {/* Thanh tìm kiếm trung tâm */}
              <div className="desktop-only" style={{ flex: 1, padding: '0 40px', maxWidth: '400px', display: 'flex' }}>
                <div style={{ width: '100%', position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="text" placeholder="Tìm kiếm..." style={{
                    width: '100%',
                    padding: '12px 16px 12px 44px',
                    borderRadius: '24px',
                    border: '1px solid var(--surface-border)',
                    background: 'var(--bg-color)',
                    boxShadow: 'none',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }} />
                </div>
              </div>

              <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button className="btn btn-ghost" style={{ position: 'relative', background: 'transparent', padding: '8px', border: 'none', boxShadow: 'none' }}>
                  <Bell size={22} color="var(--text-primary)" />
                  <span style={{ position: 'absolute', top: 6, right: 8, width: 8, height: 8, background: 'var(--primary)', borderRadius: '50%' }}></span>
                </button>
                <button className="btn btn-ghost" style={{ background: 'transparent', padding: '8px', border: 'none', boxShadow: 'none' }}>
                  <SettingsIcon size={22} color="var(--text-primary)" />
                </button>
                <div className="user-profile" style={{ padding: 0, background: 'transparent', boxShadow: 'none', border: 'none' }}>
                  <div className="user-avatar" style={{ overflow: 'hidden', width: '40px', height: '40px', borderRadius: '50%' }}>
                    <img src="https://i.pravatar.cc/100?img=33" alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              </div>
            </header>

            <main className="content-area">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/channels" element={<Channels />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/inventory-warning" element={<InventoryWarning />} />
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/accounting" element={<Accounting />} />
                <Route path="/finance-categories" element={<FinanceCategories />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/bctc" element={<FinancialStatements />} />
                <Route path="/reports/business" element={<BusinessReports />} />
                <Route path="/reports/channels" element={<ChannelReports />} />
                <Route path="/reports/finance" element={<PriceStructure />} />
                <Route path="/reports/inventory" element={<InventoryReports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/global-trash" element={<GlobalTrash />} />
              </Routes>
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
        </div>
      </Router>
    </ConfirmProvider>
  );
}

export default App;
