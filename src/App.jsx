import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  ChefHat, 
  Package, 
  Wallet, 
  Bell, 
  Store,
  Coffee,
  Tags
} from 'lucide-react';
import './App.css';

import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import KDS from './pages/KDS';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Channels from './pages/Channels';

const SidebarMenu = () => {
  const location = useLocation();
  const menuItems = [
    { path: '/', name: 'Tổng Quan', icon: <LayoutDashboard size={20} /> },
    { path: '/pos', name: 'Bán Hàng', icon: <ShoppingCart size={20} /> },
    { path: '/kds', name: 'Nhà Bếp', icon: <ChefHat size={20} /> },
    { path: '/products', name: 'Thực Đơn', icon: <Coffee size={20} /> },
    { path: '/categories', name: 'Danh Mục Nhóm', icon: <Tags size={20} /> },
    { path: '/channels', name: 'Kênh Bán (Phí Sàn)', icon: <Store size={20} /> },
    { path: '/inventory', name: 'Kho & Vật Tư', icon: <Package size={20} /> },
    { path: '/finance', name: 'Tài Chính', icon: <Wallet size={20} /> },
  ];

  return (
    <nav className="sidebar-nav">
      {menuItems.map(item => (
        <Link 
          key={item.path} 
          to={item.path} 
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          {item.icon}
          {item.name}
        </Link>
      ))}
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar">
          <div className="sidebar-header">
            <Store size={26} />
            <span>OmniPOS</span>
          </div>
          <SidebarMenu />
        </aside>

        <div className="main-wrapper">
          <header className="top-header">
            <div className="header-left">
              <h1 style={{fontSize: '1.2rem', fontWeight: 600}}>Hệ Thống Quản Lý Bán Hàng</h1>
            </div>
            <div className="header-right">
              <button className="btn btn-ghost"><Bell size={20} /></button>
              <div className="user-profile" style={{display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'}}>
                <div style={{width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems:'center', justifyContent: 'center', fontWeight: 'bold'}}>
                  A
                </div>
                <span style={{fontWeight: 500}}>Admin</span>
              </div>
            </div>
          </header>

          <main className="content-area">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/kds" element={<KDS />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/channels" element={<Channels />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/finance" element={<Finance />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
