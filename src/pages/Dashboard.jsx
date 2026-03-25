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
  const [period, setPeriod] = React.useState('today'); // today, week, month, all

  // Filter Logic
  const filterByPeriod = (data) => {
    if (period === 'all') return data;
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    
    return (data || []).filter(item => {
      const itemDate = new Date(item.date);
      if (period === 'today') return itemDate >= startOfDay;
      if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate >= weekAgo;
      }
      if (period === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return itemDate >= monthAgo;
      }
      return true;
    });
  };

  const filteredOrders = filterByPeriod(state.posOrders);

  // Stats
  const pendingOrdersCount = filteredOrders.filter(o => o.status !== 'Success' && o.status !== 'Cancelled').length;
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.netAmount, 0);

  // Activities
  const recentOrders = [...filteredOrders].reverse().slice(0, 8);

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header with Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Báo Cáo Tổng Quan</h2>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
          {[
            { id: 'today', name: 'Hôm nay' },
            { id: 'week', name: '7 ngày qua' },
            { id: 'month', name: 'Tháng này' },
            { id: 'all', name: 'Tất cả' }
          ].map(p => (
            <button 
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`btn ${period === p.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 16px', fontSize: '0.9rem' }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <StatCard title="Tổng Doanh Thu (Thực Thu)" value={`${totalRevenue.toLocaleString('vi-VN')} đ`} icon={<TrendingUp color="var(--primary)" />} colorClass="primary" />
        <StatCard title="Số Đơn Hàng" value={totalOrders} icon={<ShoppingBag color="var(--secondary)" />} colorClass="secondary" />
        <StatCard title="Đơn Đang Xử Lý" value={pendingOrdersCount} icon={<Clock color="var(--warning)" />} colorClass="warning" />
      </div>

      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: 0, marginBottom: '20px' }}>Lịch Sử Giao Dịch ({period === 'all' ? 'Toàn bộ' : 'Trong kỳ'})</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {recentOrders.length === 0 ? <p style={{color:'var(--text-secondary)'}}>Chưa có hoạt động nào trong khoảng thời gian này.</p> : recentOrders.map((item, idx) => (
             <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
               <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.status === 'Success' ? 'var(--success)' : (item.status === 'Cancelled' ? 'var(--danger)' : 'var(--warning)'), marginTop: '6px' }} />
               <div style={{ flex: 1 }}>
                 <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
                    <span style={{ color: 'var(--primary)' }}>{item.id}</span> - {item.channelName} 
                    <span style={{ float: 'right', color: 'var(--success)' }}>+{item.netAmount.toLocaleString('vi-VN')}đ</span>
                 </p>
                 <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, marginTop: '4px' }}>
                   {new Date(item.date).toLocaleString('vi-VN')} | Trạng thái: {item.status === 'Success' ? 'Hoàn tất' : (item.status === 'Cancelled' ? 'Đã hủy' : 'Chờ ship')}
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
