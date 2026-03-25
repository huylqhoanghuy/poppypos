import React from 'react';
import { TrendingUp, ShoppingBag, Users, Clock } from 'lucide-react';
import { useData } from '../context/DataContext';

const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, marginBottom: '8px' }}>{title}</p>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{value}</h3>
      </div>
      <div className={`icon-wrapper ${colorClass}`} style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { state } = useData();

  // Stats
  const pendingOrdersCount = (state.posOrders || []).filter(o => o.status !== 'ready').length;
  const totalOrders = (state.posOrders || []).length;
  const totalRevenue = (state.posOrders || []).reduce((sum, o) => sum + o.netAmount, 0);

  // Activities
  const recentOrders = [...(state.posOrders || [])].reverse().slice(0, 8);

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <StatCard title="Tổng Doanh Thu (POS)" value={`${totalRevenue.toLocaleString('vi-VN')} đ`} icon={<TrendingUp color="var(--primary)" />} colorClass="primary" />
        <StatCard title="Số Đơn Hàng Mới" value={totalOrders} icon={<ShoppingBag color="var(--secondary)" />} colorClass="secondary" />
        <StatCard title="Đơn Đang Phục Vụ Bếp" value={pendingOrdersCount} icon={<Clock color="var(--warning)" />} colorClass="warning" />
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: 0, marginBottom: '20px' }}>Hoạt Động KDS & Bán Hàng Gần Đây</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {recentOrders.length === 0 ? <p style={{color:'var(--text-secondary)'}}>Chưa có hoạt động nào.</p> : recentOrders.map((item, idx) => (
             <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.status === 'ready' ? 'var(--success)' : 'var(--warning)', marginTop: '6px' }} />
               <div style={{ flex: 1 }}>
                 <p style={{ fontSize: '0.9rem', fontWeight: 500, margin: 0 }}>
                    {item.status === 'ready' ? 'Hoàn tất đơn' : 'Đơn mới'} <span style={{ color: 'var(--primary)' }}>{item.id}</span>
                    {' - '}{item.totalAmount.toLocaleString('vi-VN')}đ
                 </p>
                 <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, marginTop: '4px' }}>
                   Lúc {new Date(item.date).toLocaleTimeString('vi-VN')}
                 </p>
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
