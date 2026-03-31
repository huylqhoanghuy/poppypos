import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Clock, DollarSign, PieChart as PieIcon, BarChart3, Package, Truck, Wallet, Filter, CheckCircle2, ChevronDown, Calendar, ArrowUpRight, ArrowDownRight, Layers, Building2, LineChart } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler } from 'chart.js';
import { Pie, Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler);

const StatCard = ({ title, value, icon, colorClass, percentStr, isUp, statusText }) => {
  const themeColors = {
    primary: { bg: 'rgba(247, 83, 0, 0.15)', text: '#F75300' }, // Cam (Orange)
    success: { bg: 'rgba(27, 77, 62, 0.1)', text: '#1B4D3E' }, // Xanh lá tối (Dark Green)
    cyan: { bg: 'rgba(255, 208, 163, 0.5)', text: '#F75300' }, // Nền Đào (Peach), Chữ Cam
    danger: { bg: 'rgba(238, 93, 80, 0.12)', text: '#EE5D50' }, // Đỏ nhạt
    purple: { bg: 'rgba(147, 51, 234, 0.1)', text: '#9333ea' }
  };
  const color = themeColors[colorClass] || themeColors.primary;

  return (
    <div className="glass-panel hover-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px', borderLeft: `6px solid ${color.text}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
        <p style={{ color: '#64748b', fontSize: '12px', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
        <div style={{ 
          width: '36px', height: '36px',
          borderRadius: '10px', 
          backgroundColor: color.bg, 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {React.cloneElement(icon, { size: 18, color: color.text })}
        </div>
      </div>
      <div style={{ marginTop: '-4px' }}>
         <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{value}</h3>
      </div>
      <div style={{ marginTop: '4px' }}>
        {percentStr ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
            <span style={{ 
               color: isUp ? '#16a34a' : '#ef4444', 
               fontWeight: 700, display: 'flex', alignItems: 'center',
               background: isUp ? '#dcfce7' : '#fee2e2',
               padding: '2px 8px', borderRadius: '12px'
            }}>
              {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {percentStr}
            </span>
            {statusText && <span style={{ color: '#64748b', fontWeight: 500 }}>{statusText}</span>}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
             <span style={{ color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
               {statusText}
             </span>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { state } = useData();
  const [period, setPeriod] = React.useState('month'); // today, week, month, all
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(date);
  };

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
  const filteredTransactions = filterByPeriod(state.transactions);

  // Real-time P&L Calculations
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.netAmount, 0);

  // Compute precise COGS
  const totalCOGS = filteredOrders.reduce((sum, o) => {
      const orderItems = o.items || (o.cart ? o.cart.map(c => ({ product: c, quantity: c.qty })) : []);
      const orderCOGS = orderItems.reduce((cartSum, item) => {
          if (!item.product) return cartSum;
          const product = state.products.find(p => p.id === item.product.id);
          let unitCost = 0;
          if (product && product.recipe) {
              product.recipe.forEach(r => {
                  const ing = state.ingredients.find(i => i.id === r.ingredientId);
                  if (ing) {
                      let qty = r.qty;
                      if (r.unitMode === 'divide') qty = 1 / r.qty;
                      if (r.unitMode === 'buy') qty = r.qty * (ing.conversionRate || 1);
                      unitCost += qty * ing.cost;
                  }
              });
          }
          return cartSum + (unitCost * item.quantity);
      }, 0);
      return sum + orderCOGS;
  }, 0);

  const grossProfit = totalRevenue - totalCOGS;
  const operatingExpenses = filteredTransactions.filter(t => t.type === 'Chi' && !t.note?.toLowerCase().includes('nhập kho') && !t.note?.toLowerCase().includes('nợ')).reduce((sum, t) => sum + t.amount, 0);
  const netProfit = grossProfit - operatingExpenses;

  // Accounts Payable
  const totalSupplierDebt = (state.suppliers || []).reduce((sum, s) => sum + (s.debt || 0), 0);
  const pendingPOs = (state.purchases || []).filter(p => p.status === 'Pending').length;
  
  // Inventory Warnings
  const lowStockCount = state.ingredients?.filter(ing => {
    let warningThreshold = 5;
    if (ing.unit === 'kg') warningThreshold = 2;
    if (ing.unit === 'g') warningThreshold = 1000;
    return (ing.quantity !== undefined && ing.quantity <= warningThreshold);
  }).length || 0;

  // ==== CHARTS DATA ==== //
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 6, font: { size: 11, family: "'Inter', sans-serif" } } }
    }
  };
  const bottomLegendOptions = {
    ...commonOptions,
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 6, font: { size: 11 } } } }
  }

  // 1. CEO Chart: Revenue Trend (Bar)
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  
  const ceoTrendData = {
    labels: last7Days.map(d => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })),
    datasets: [
      {
        label: 'Doanh Thu',
        data: last7Days.map(day => filteredOrders.filter(o => o.date.startsWith(day)).reduce((sum, o) => sum + o.netAmount, 0)),
        backgroundColor: '#f97316',
        borderRadius: 4
      },
      {
         label: 'Chi Phí',
         data: last7Days.map(day => filteredTransactions.filter(t => t.type === 'Chi' && t.date.startsWith(day)).reduce((sum, t) => sum + t.amount, 0)),
         backgroundColor: '#1e293b',
         borderRadius: 4
       }
    ]
  };

  // 2. CFO Chart: COGS Analysis (Doughnut)
  const cfoCOGSData = (() => {
    const categoryTotals = {};
    state.products.filter(p => p.status !== 'draft').forEach(product => {
      product.recipe?.forEach(item => {
        const ingredient = state.ingredients.find(i => i.id === item.ingredientId);
        if (ingredient) {
          const cost = (item.qty || 0) * (ingredient.cost || 0);
          categoryTotals[ingredient.category || 'Khác'] = (categoryTotals[ingredient.category || 'Khác'] || 0) + cost;
        }
      });
    });
    return {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'],
        borderWidth: 0,
      }]
    };
  })();

  // 3. CFO Cashflow Chart
  const cashFlowData = {
    labels: last7Days.map(d => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })),
    datasets: [
      {
         fill: true,
         label: 'Tiền Thu',
         data: last7Days.map(day => filteredTransactions.filter(t => t.type === 'Thu' && t.date.startsWith(day)).reduce((sum, t) => sum + t.amount, 0)),
         borderColor: '#10b981',
         backgroundColor: 'rgba(16, 185, 129, 0.1)',
         tension: 0.4
      }
    ]
  };

  // 4. CCO Chart: Channel Performance (Pie)
  const ccoChannelData = (() => {
    const channels = filteredOrders.reduce((acc, o) => {
       acc[o.channelName || 'Tại quán'] = (acc[o.channelName || 'Tại quán'] || 0) + o.netAmount;
       return acc;
    }, {});
    return {
      labels: Object.keys(channels),
      datasets: [{
        data: Object.values(channels),
        backgroundColor: ['#3b82f6', '#f97316', '#10b981', '#f43f5e', '#8b5cf6'],
        borderWidth: 0,
      }]
    };
  })();

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
      
      {/* HEADER ROW WITH REALTIME CLOCK */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: 'var(--surface-color)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)', boxShadow: '0 2px 4px -1px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
           <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Executive Dashboard</h2>
           <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '12px', color: '#c2410c', fontSize: '12px', fontWeight: 600 }}>
              <Clock size={12} /> LIVE • {formatDateTime(currentTime)}
           </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select className="btn" style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-color)', border: '1px solid var(--surface-border)', fontWeight: 600, fontSize: '12px', outline: 'none' }} value={period} onChange={(e) => setPeriod(e.target.value)}>
               <option value="today">Hôm Nay</option>
               <option value="week">7 Ngày Qua</option>
               <option value="month">Tháng Này</option>
               <option value="all">Tất Cả</option>
            </select>
            <button className="btn btn-primary" style={{ padding: '8px 12px', borderRadius: '8px', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
               <Filter size={14} /> Lọc Báo Cáo
            </button>
        </div>
      </div>

      {/* SECTION 1: CCO (VẬN HÀNH) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
             <div style={{ background: '#ea580c', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 }}>VẬN HÀNH</div>
             <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Giám Đốc Vận Hành (Kênh Bán & Tồn Kho)</h3>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <StatCard title="TỔNG SỐ ĐƠN XUẤT" value={filteredOrders.length.toString()} icon={<Package />} colorClass="primary" statusText="Đơn hàng" />
            <StatCard title="NGUYÊN VẬT LIỆU (CHẠM ĐÁY)" value={lowStockCount.toString()} icon={<Layers />} colorClass="danger" statusText="Rủi ro thiếu hụt" />
            <StatCard title="PHIẾU Y/C NHẬP KHO CHỜ" value={pendingPOs.toString()} icon={<CheckCircle2 />} colorClass="purple" statusText="Đơn PO cần duyệt" />
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '16px' }}>
             <div className="glass-panel" style={{ padding: '16px', height: '220px', borderTop: '3px solid #ea580c', display: 'flex', flexDirection: 'column' }}>
                 <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#475569' }}>🛒 TỶ TRỌNG KÊNH BÁN</h4>
                 <div style={{ flex: 1, position: 'relative' }}>
                   {ccoChannelData.labels.length > 0 ? (
                      <Pie data={ccoChannelData} options={{...commonOptions, maintainAspectRatio: false }} />
                   ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>Chưa có doanh thu</div>
                   )}
                 </div>
             </div>

             <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', borderTop: '3px solid #ea580c', height: '220px' }}>
                 <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#475569' }}>⚡ BIẾN ĐỘNG NGOẠI LỆ MỚI NHẤT</h4>
                 <div className="table-responsive" style={{ border: 'none', boxShadow: 'none', margin: 0, overflowY: 'auto' }}>
                    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                       <thead>
                          <tr>
                             <th style={{ padding: '8px', background: '#f8fafc', color: '#64748b', fontSize: '11px' }}>Thời Gian</th>
                             <th style={{ padding: '8px', background: '#f8fafc', color: '#64748b', fontSize: '11px' }}>Sự Kiện</th>
                             <th style={{ padding: '8px', background: '#f8fafc', color: '#64748b', fontSize: '11px', textAlign: 'right' }}>Giá Trị</th>
                          </tr>
                       </thead>
                       <tbody>
                          {filteredTransactions.slice(0, 4).map((t, idx) => (
                             <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px', fontSize: '11px', color: '#64748b' }}>{new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                <td style={{ padding: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.note}</td>
                                <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontSize: '12px', color: t.type === 'Thu' ? '#16a34a' : '#ef4444' }}>
                                   {t.type === 'Thu' ? '+' : '-'}{t.amount.toLocaleString()}đ
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
             </div>
         </div>
      </section>

      {/* SECTION 2: CEO (KINH DOANH) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
             <div style={{ background: '#0ea5e9', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 }}>KINH DOANH</div>
             <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Tổng Giám Đốc (P&L Tổng Quan)</h3>
         </div>
         
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <StatCard title="DOANH THU THUẦN" value={`${(totalRevenue / 1000000).toFixed(1)}Tr`} icon={<LineChart />} colorClass="cyan" percentStr={totalRevenue > 0 ? "Khả quan" : "0%"} isUp={totalRevenue > 0} />
            <StatCard title="LỢI NHUẬN GỘP" value={`${(grossProfit / 1000000).toFixed(1)}Tr`} icon={<TrendingUp />} colorClass="success" percentStr={`${totalRevenue > 0 ? ((grossProfit/totalRevenue)*100).toFixed(1) : 0}% Biên`} isUp={grossProfit > 0}/>
            <StatCard title="TỔNG CHI PHÍ OUTSOURCE" value={`${(operatingExpenses / 1000000).toFixed(1)}Tr`} icon={<ShoppingBag />} colorClass="danger" statusText="Mặt bằng, Điện, Nước" />
         </div>

         <div className="glass-panel" style={{ padding: '16px', height: '240px', borderTop: '3px solid #0ea5e9', display: 'flex', flexDirection: 'column' }}>
             <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#475569' }}>📈 DOANH THU & CHI PHÍ HOẠT ĐỘNG (7 NGÀY)</h4>
             <div style={{ flex: 1, position: 'relative' }}>
                 <Bar data={ceoTrendData} options={{...bottomLegendOptions, maintainAspectRatio: false}} />
             </div>
         </div>
      </section>

      {/* SECTION 3: CFO (TÀI CHÍNH) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '4px', borderBottom: '1px solid #f1f5f9' }}>
             <div style={{ background: '#dc2626', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 }}>TÀI CHÍNH</div>
             <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>Giám Đốc Tài Chính (Giá Vốn & Dòng Tiền)</h3>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            <StatCard title="NGÂN SÁCH GIÁ VỐN (COGS)" value={`${(totalCOGS / 1000000).toFixed(1)}Tr`} icon={<PieIcon />} colorClass="danger" percentStr={`${totalRevenue > 0 ? ((totalCOGS/totalRevenue)*100).toFixed(1) : 0}% Tỷ Trọng`} isUp={false} />
            <StatCard title="CÔNG NỢ (A/P Kho)" value={`${(totalSupplierDebt / 1000000).toFixed(1)}Tr`} icon={<Wallet />} colorClass="primary" statusText="Nợ NCC" />
            <StatCard title="DÒNG TIỀN RÒNG (NET)" value={`${(netProfit / 1000000).toFixed(1)}Tr`} icon={<DollarSign />} colorClass="purple" statusText="Cash flow" />
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div className="glass-panel" style={{ padding: '16px', height: '240px', borderTop: '3px solid #dc2626', display: 'flex', flexDirection: 'column' }}>
                 <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#475569' }}>🍕 CƠ CẤU CHI PHÍ NGUYÊN VẬT LIỆU (COGS)</h4>
                 <div style={{ flex: 1, position: 'relative' }}>
                     {cfoCOGSData.labels.length > 0 ? (
                        <Doughnut data={cfoCOGSData} options={{...commonOptions, maintainAspectRatio: false}} />
                     ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px' }}>Chưa có dữ liệu định lượng</div>
                     )}
                 </div>
             </div>

             <div className="glass-panel" style={{ padding: '16px', height: '240px', borderTop: '3px solid #dc2626', display: 'flex', flexDirection: 'column' }}>
                 <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#475569' }}>💸 BIẾN ĐỘNG DÒNG TIỀN THU (CASH IN)</h4>
                 <div style={{ flex: 1, position: 'relative' }}>
                     <Line data={cashFlowData} options={{...bottomLegendOptions, maintainAspectRatio: false}} />
                 </div>
             </div>
         </div>
      </section>

      <style>{`
        .hover-card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px -4px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
};

export default Dashboard;
