import React, { useState } from 'react';
import {
  TrendingUp, ShoppingBag, DollarSign, PieChart as PieIcon,
  BarChart3, Package, Truck, Wallet, Filter, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Layers, LineChart, Activity,
  AlertTriangle, ChevronRight, Zap
} from 'lucide-react';
import { useData } from '../context/DataContext';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
  PointElement, LineElement, Filler
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Pie, Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, Title, PointElement, LineElement, Filler, ChartDataLabels
);

/* ─────────────────────────────────────────
   KPI CARD — Hiển thị chỉ số quan trọng
───────────────────────────────────────── */
const KpiCard = ({ title, value, icon, accent, trend, trendLabel, statusText }) => {
  const accentMap = {
    orange: { color: '#F75300', bg: 'rgba(247,83,0,0.08)', glow: 'rgba(247,83,0,0.15)' },
    green:  { color: '#059669', bg: 'rgba(5,150,105,0.08)',  glow: 'rgba(5,150,105,0.15)' },
    red:    { color: '#DC2626', bg: 'rgba(220,38,38,0.08)',  glow: 'rgba(220,38,38,0.15)' },
    blue:   { color: '#0284C7', bg: 'rgba(2,132,199,0.08)',  glow: 'rgba(2,132,199,0.15)' },
    amber:  { color: '#D97706', bg: 'rgba(217,119,6,0.08)',  glow: 'rgba(217,119,6,0.15)' },
  };
  const a = accentMap[accent] || accentMap.orange;
  const isUp = trend === 'up';
  const isDown = trend === 'down';

  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      border: '1px solid rgba(226,232,240,0.8)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-3px)';
      e.currentTarget.style.boxShadow = `0 8px 24px ${a.glow}, 0 2px 8px rgba(0,0,0,0.06)`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)';
    }}
    >
      {/* Accent top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '3px', background: a.color, borderRadius: '16px 16px 0 0'
      }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{
          margin: 0, fontSize: '11px', fontWeight: 700,
          color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px'
        }}>{title}</p>
        <div style={{
          width: '38px', height: '38px', borderRadius: '12px',
          background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}>
          {React.cloneElement(icon, { size: 18, color: a.color })}
        </div>
      </div>

      {/* Value */}
      <div>
        <h3 style={{
          margin: 0, fontSize: '28px', fontWeight: 800,
          color: '#0f172a', letterSpacing: '-1px', lineHeight: 1
        }}>{value}</h3>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {trend ? (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '3px',
            fontSize: '11px', fontWeight: 700,
            color: isUp ? '#059669' : '#DC2626',
            background: isUp ? '#d1fae5' : '#fee2e2',
            padding: '3px 8px', borderRadius: '20px'
          }}>
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {trendLabel}
          </span>
        ) : null}
        {statusText && (
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   SECTION HEADER — Tiêu đề phần
───────────────────────────────────────── */
const SectionHeader = ({ badge, badgeColor, title, subtitle }) => (
  <div style={{ marginBottom: '4px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
      <span style={{
        background: badgeColor, color: '#fff',
        fontSize: '10px', fontWeight: 800,
        padding: '3px 10px', borderRadius: '20px',
        letterSpacing: '0.6px', textTransform: 'uppercase'
      }}>{badge}</span>
      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{title}</h3>
    </div>
    {subtitle && (
      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', paddingLeft: '2px' }}>{subtitle}</p>
    )}
  </div>
);

/* ─────────────────────────────────────────
   CHART PANEL — Wrapper cho biểu đồ
───────────────────────────────────────── */
const ChartPanel = ({ title, accentColor, height = 220, children }) => (
  <div style={{
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
    border: '1px solid rgba(226,232,240,0.8)',
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
      <div style={{ width: '3px', height: '16px', background: accentColor, borderRadius: '2px', flexShrink: 0 }} />
      <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</h4>
    </div>
    <div style={{ flex: 1, position: 'relative', height: `${height}px` }}>
      {children}
    </div>
  </div>
);

/* ─────────────────────────────────────────
   DASHBOARD MAIN
───────────────────────────────────────── */
const Dashboard = () => {
  const { state } = useData();
  const [period, setPeriod] = useState('month');

  // ── Filter Logic ──
  const filterByPeriod = (data) => {
    if (period === 'all') return data || [];
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    return (data || []).filter(item => {
      const itemDate = new Date(item.date);
      if (period === 'today') return itemDate >= startOfDay;
      if (period === 'week') {
        const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate >= weekAgo;
      }
      if (period === 'month') {
        const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
        return itemDate >= monthAgo;
      }
      return true;
    });
  };

  const filteredOrders = filterByPeriod(state.posOrders);
  const filteredTransactions = filterByPeriod(state.transactions);
  const totalAccountBalance = (state.accounts || []).reduce((sum, acc) => sum + acc.balance, 0);

  // ── P&L ──
  const totalRevenue = filteredOrders.reduce((s, o) => s + ((o.totalAmount || o.netAmount) || 0), 0);

  const totalFees = filteredOrders.reduce((sum, o) => {
      const net = Number(o.netAmount) || 0;
      const gross = Number(o.totalAmount) || net;
      if (gross > net && net > 0) return sum + (gross - net);
      const chObj = state.salesChannels?.find(c => c.name === o.channelName);
      const rate = chObj ? Number(chObj.commission ?? chObj.discountRate ?? 0) : 0;
      return sum + (gross * (rate / 100));
  }, 0);

  const totalCOGS = filteredOrders.reduce((sum, o) => {
    const items = o.items || (o.cart ? o.cart.map(c => ({ product: c, quantity: c.qty })) : []);
    return sum + items.reduce((cs, item) => {
      if (!item.product) return cs;
      const product = state.products?.find(p => p.id === item.product.id);
      let unitCost = 0;
      if (product?.recipe) {
        product.recipe.forEach(r => {
          const ing = state.ingredients?.find(i => i.id === r.ingredientId);
          if (ing) {
            let qty = r.qty;
            if (r.unitMode === 'divide') qty = 1 / r.qty;
            if (r.unitMode === 'buy') qty = r.qty * (ing.conversionRate || 1);
            unitCost += qty * ing.cost;
          }
        });
      }
      return cs + unitCost * item.quantity;
    }, 0);
  }, 0);

  const grossProfit = totalRevenue - totalCOGS - totalFees;
  const operatingExpenses = filteredTransactions
    .filter(t => t.type === 'Chi' && !t.note?.toLowerCase().includes('nhập kho') && !t.note?.toLowerCase().includes('nợ'))
    .reduce((s, t) => s + t.amount, 0);
  const netProfit = grossProfit - operatingExpenses;

  const totalSupplierDebt = (state.suppliers || []).reduce((s, sup) => s + (sup.debt || 0), 0);
  const pendingPOs = (state.purchases || []).filter(p => p.status === 'Pending').length;

  const lowStockCount = (state.ingredients || []).filter(ing => {
    const warningLimit = ing.minStock !== undefined ? Number(ing.minStock) : (ing.unit === 'kg' ? 2 : (ing.unit === 'g' ? 1000 : 5));
    return ing.stock !== undefined && ing.stock <= warningLimit;
  }).length;

  const totalInventoryValue = (state.ingredients || []).reduce((sum, ing) => {
    const buyPrice = Number(ing.buyPrice || (Number(ing.cost || 0) * Number(ing.conversionRate || 1)));
    return sum + (Number(ing.stock) || 0) * buyPrice;
  }, 0);

  // ── Chart helpers ──
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartTooltipPlugin = {
    backgroundColor: '#0f172a',
    titleColor: '#94a3b8',
    bodyColor: '#f1f5f9',
    padding: 12,
    cornerRadius: 8,
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    titleFont: { size: 11 },
    bodyFont: { size: 12, weight: '700' },
    callbacks: {
      label: (ctx) => {
        const val = ctx.parsed.y ?? ctx.parsed;
        return ` ${typeof val === 'number' ? val.toLocaleString('vi-VN') + 'đ' : val}`;
      }
    }
  };

  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true, pointStyle: 'circle',
          padding: 16, boxWidth: 6,
          font: { size: 11, family: "'Inter', sans-serif" },
          color: '#64748b'
        }
      },
      tooltip: chartTooltipPlugin,
      datalabels: { display: false } // Default to false for UI consistency unless overridden
    }
  };

  // 1. Revenue Trend Bar
  const revenueBarData = {
    labels: last7Days.map(d => new Date(d + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })),
    datasets: [
      {
        label: 'Doanh Thu',
        data: last7Days.map(day => filteredOrders.filter(o => o.date?.startsWith(day)).reduce((s, o) => s + o.netAmount, 0)),
        backgroundColor: '#F75300',
        borderRadius: 6, borderSkipped: false
      },
      {
        label: 'Chi Phí',
        data: last7Days.map(day => filteredTransactions.filter(t => t.type === 'Chi' && t.date?.startsWith(day)).reduce((s, t) => s + t.amount, 0)),
        backgroundColor: '#e2e8f0',
        borderRadius: 6, borderSkipped: false
      }
    ]
  };

  // 2. COGS Doughnut
  const cogsData = (() => {
    const cats = {};
    (state.products || []).filter(p => p.status !== 'draft').forEach(prod => {
      prod.recipe?.forEach(r => {
        const ing = (state.ingredients || []).find(i => i.id === r.ingredientId);
        if (ing) {
          const k = ing.category || 'Khác';
          cats[k] = (cats[k] || 0) + (r.qty || 0) * (ing.cost || 0);
        }
      });
    });
    return {
      labels: Object.keys(cats),
      datasets: [{
        data: Object.values(cats),
        backgroundColor: ['#F75300', '#0ea5e9', '#059669', '#d97706', '#dc2626', '#64748b'],
        borderWidth: 0, hoverOffset: 4
      }]
    };
  })();

  // 3. Cashflow Line
  const cashflowData = {
    labels: last7Days.map(d => new Date(d + 'T00:00:00').toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })),
    datasets: [{
      label: 'Tiền Thu',
      data: last7Days.map(day => filteredTransactions.filter(t => t.type === 'Thu' && t.date?.startsWith(day)).reduce((s, t) => s + t.amount, 0)),
      borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.08)',
      fill: true, tension: 0.4, pointRadius: 4,
      pointBackgroundColor: '#059669', pointBorderColor: '#fff', pointBorderWidth: 2
    }]
  };

  // 4. Channel Pie
  const channelData = (() => {
    const ch = filteredOrders.reduce((acc, o) => {
      const k = o.channelName || 'Tại quán';
      acc[k] = (acc[k] || 0) + o.netAmount;
      return acc;
    }, {});
    return {
      labels: Object.keys(ch),
      datasets: [{
        data: Object.values(ch),
        backgroundColor: ['#F75300', '#0ea5e9', '#059669', '#d97706', '#7c3aed'],
        borderWidth: 0, hoverOffset: 4
      }]
    };
  })();

  const periodLabels = { today: 'Hôm nay', week: '7 ngày qua', month: 'Tháng này', all: 'Tất cả' };

  return (
    <div className="dashboard-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '24px' }}>

      {/* ── HEADER ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '12px',
        background: '#fff', padding: '16px 20px', borderRadius: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        border: '1px solid rgba(226,232,240,0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #F75300, #ff8c42)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Activity size={20} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
              Executive Dashboard
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
              Phân tích theo: <strong style={{ color: '#F75300' }}>{periodLabels[period]}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            style={{
              padding: '9px 14px', borderRadius: '10px',
              background: '#f8fafc', border: '1px solid #e2e8f0',
              fontWeight: 600, fontSize: '13px', color: '#334155',
              cursor: 'pointer', outline: 'none'
            }}
          >
            <option value="today">Hôm Nay</option>
            <option value="week">7 Ngày Qua</option>
            <option value="month">Tháng Này</option>
            <option value="all">Tất Cả</option>
          </select>
        </div>
      </div>


      {/* ══════════════════════════════════
          SECTION 1 — VẬN HÀNH (CCO)
      ══════════════════════════════════ */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SectionHeader
          badge="Vận Hành"
          badgeColor="#ea580c"
          title="Tổng Quan Vận Hành"
          subtitle="Giám sát kênh bán hàng, tồn kho & đơn nhập kho"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <KpiCard
            title="Giá Trị Tồn Kho"
            value={totalInventoryValue >= 1_000_000 ? `${(totalInventoryValue / 1_000_000).toFixed(1)}Tr` : `${(totalInventoryValue / 1000).toFixed(0)}K`}
            icon={<Layers />}
            accent="blue"
            trend={totalInventoryValue > 0 ? 'up' : null}
            trendLabel="Vốn lưu động"
          />
          <KpiCard
            title="Tổng Đơn Xuất"
            value={filteredOrders.length.toLocaleString()}
            icon={<Package />}
            accent="orange"
            statusText="đơn hàng"
          />
          <KpiCard
            title="NVL Chạm Đáy"
            value={lowStockCount.toLocaleString()}
            icon={<AlertTriangle />}
            accent={lowStockCount > 0 ? 'red' : 'green'}
            trend={lowStockCount > 0 ? 'down' : null}
            trendLabel={lowStockCount > 0 ? 'Cần bổ sung' : null}
            statusText={lowStockCount === 0 ? 'Tồn kho ổn định' : 'nguyên liệu'}
          />
          <KpiCard
            title="Phiếu PO Chờ Duyệt"
            value={pendingPOs.toLocaleString()}
            icon={<CheckCircle2 />}
            accent="amber"
            statusText={pendingPOs > 0 ? 'đơn đang chờ' : 'Không có đơn'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr)', gap: '16px' }}>
          <ChartPanel title="Tỷ trọng kênh bán" accentColor="#ea580c" height={200}>
            {channelData.labels.length > 0
              ? <Doughnut data={channelData} options={{ 
                  ...baseChartOptions, 
                  cutout: '50%',
                  plugins: { 
                     ...baseChartOptions.plugins, 
                     legend: { ...baseChartOptions.plugins.legend, position: 'right' },
                     datalabels: {
                         color: '#ffffff',
                         font: { weight: 'bold', size: 10 },
                         formatter: (value, ctx) => {
                              const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
                              if(total === 0) return '';
                              const p = (value/total*100).toFixed(1);
                              return p > 3 ? `${p}%` : '';
                         }
                     }
                  } 
                }} />
              : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '13px' }}>Chưa có dữ liệu</div>
            }
          </ChartPanel>

          <ChartPanel title="Biến động giao dịch gần nhất" accentColor="#ea580c" height={200}>
            <div style={{ height: '100%', overflowY: 'auto' }}>
              {filteredTransactions.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '13px' }}>
                  Chưa có giao dịch
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredTransactions.slice(0, 5).map((t, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: '10px',
                      background: i % 2 === 0 ? '#f8fafc' : '#fff',
                      border: '1px solid #f1f5f9'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '8px',
                          background: t.type === 'Thu' ? '#d1fae5' : '#fee2e2',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {t.type === 'Thu'
                            ? <ArrowUpRight size={14} color="#059669" />
                            : <ArrowDownRight size={14} color="#DC2626" />
                          }
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>{t.note || t.type}</p>
                          <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>
                            {new Date(t.date).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: '13px', fontWeight: 700,
                        color: t.type === 'Thu' ? '#059669' : '#DC2626'
                      }}>
                        {t.type === 'Thu' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ChartPanel>

          <ChartPanel title="Tiền mặt hiện tại" accentColor="#ea580c" height={200}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
               <div style={{ marginBottom: '16px', background: 'var(--surface-variant)', padding: '12px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>TỔNG QUỸ THỰC TẾ</p>
                  <h3 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                     {totalAccountBalance >= 0 ? '' : '-'}{Math.abs(totalAccountBalance).toLocaleString('vi-VN')} đ
                  </h3>
               </div>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                  {(state.accounts || []).map(acc => (
                     <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 4px', borderBottom: '1px dashed #e2e8f0' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{acc.name}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: acc.balance >= 0 ? '#10b981' : '#ef4444' }}>
                           {acc.balance.toLocaleString('vi-VN')} đ
                        </span>
                     </div>
                  ))}
               </div>
            </div>
          </ChartPanel>
        </div>
      </section>

      {/* ══════════════════════════════════
          SECTION 2 — KINH DOANH (CEO)
      ══════════════════════════════════ */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SectionHeader
          badge="Kinh Doanh"
          badgeColor="#0284c7"
          title="P&L Tổng Quan"
          subtitle="Doanh thu thuần, lợi nhuận gộp & chi phí vận hành"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <KpiCard
            title="Doanh Thu Thuần"
            value={totalRevenue >= 1_000_000 ? `${(totalRevenue / 1_000_000).toFixed(1)}Tr` : `${(totalRevenue / 1000).toFixed(0)}K`}
            icon={<LineChart />}
            accent="orange"
            trend={totalRevenue > 0 ? 'up' : null}
            trendLabel="100% Thu"
          />
          <KpiCard
            title="Lợi Nhuận Gộp"
            value={grossProfit >= 1_000_000 ? `${(grossProfit / 1_000_000).toFixed(1)}Tr` : `${(grossProfit / 1000).toFixed(0)}K`}
            icon={<TrendingUp />}
            accent={grossProfit >= 0 ? 'green' : 'red'}
            trend={grossProfit > 0 ? 'up' : 'down'}
            trendLabel={totalRevenue > 0 ? `${((grossProfit / totalRevenue) * 100).toFixed(1)}% DTT` : '0%'}
          />
          <KpiCard
            title="Chi Phí Sàn"
            value={totalFees >= 1_000_000 ? `${(totalFees / 1_000_000).toFixed(1)}Tr` : `${(totalFees / 1000).toFixed(0)}K`}
            icon={<Package />}
            accent="amber"
            trend="down"
            trendLabel={totalRevenue > 0 ? `${((totalFees / totalRevenue) * 100).toFixed(1)}% DTT` : '0%'}
          />
          <KpiCard
            title="Chi Phí Vận Hành"
            value={operatingExpenses >= 1_000_000 ? `${(operatingExpenses / 1_000_000).toFixed(1)}Tr` : `${(operatingExpenses / 1000).toFixed(0)}K`}
            icon={<ShoppingBag />}
            accent="red"
            trend="down"
            trendLabel={totalRevenue > 0 ? `${((operatingExpenses / totalRevenue) * 100).toFixed(1)}% DTT` : '0%'}
          />
        </div>

        <ChartPanel title="Doanh Thu & Chi Phí Hoạt Động (7 Ngày)" accentColor="#0284c7" height={220}>
          <Bar data={revenueBarData} options={{
            ...baseChartOptions,
            plugins: {
              ...baseChartOptions.plugins,
              legend: { ...baseChartOptions.plugins.legend }
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
              y: {
                grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                ticks: {
                  font: { size: 11 }, color: '#94a3b8',
                  callback: v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}Tr` : `${(v / 1000).toFixed(0)}K`
                }
              }
            }
          }} />
        </ChartPanel>
      </section>

      {/* ══════════════════════════════════
          SECTION 3 — TÀI CHÍNH (CFO)
      ══════════════════════════════════ */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <SectionHeader
          badge="Tài Chính"
          badgeColor="#dc2626"
          title="Giá Vốn & Dòng Tiền"
          subtitle="COGS, công nợ nhà cung cấp & dòng tiền ròng"
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          <KpiCard
            title="Giá Vốn Hàng Bán (COGS)"
            value={totalCOGS >= 1_000_000 ? `${(totalCOGS / 1_000_000).toFixed(1)}Tr` : `${(totalCOGS / 1000).toFixed(0)}K`}
            icon={<PieIcon />}
            accent="red"
            trend="down"
            trendLabel={totalRevenue > 0 ? `${((totalCOGS / totalRevenue) * 100).toFixed(1)}% tỷ trọng` : '0%'}
          />
          <KpiCard
            title="Công Nợ Nhà Cung Cấp"
            value={totalSupplierDebt >= 1_000_000 ? `${(totalSupplierDebt / 1_000_000).toFixed(1)}Tr` : `${(totalSupplierDebt / 1000).toFixed(0)}K`}
            icon={<Wallet />}
            accent={totalSupplierDebt > 0 ? 'amber' : 'green'}
            statusText={totalSupplierDebt > 0 ? 'Nợ NCC cần thanh toán' : 'Không có nợ NCC'}
          />
          <KpiCard
            title="Dòng Tiền Ròng (Net)"
            value={netProfit >= 1_000_000 ? `${(netProfit / 1_000_000).toFixed(1)}Tr` : `${(netProfit / 1000).toFixed(0)}K`}
            icon={<DollarSign />}
            accent={netProfit >= 0 ? 'green' : 'red'}
            trend={netProfit >= 0 ? 'up' : 'down'}
            trendLabel={netProfit >= 0 ? 'Dương' : 'Âm'}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <ChartPanel title="Cơ cấu chi phí nguyên vật liệu" accentColor="#dc2626" height={220}>
            {cogsData.labels.length > 0
              ? <Doughnut data={cogsData} options={{ 
                  ...baseChartOptions, 
                  cutout: '55%',
                  plugins: {
                     ...baseChartOptions.plugins,
                     legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } },
                     datalabels: {
                        color: '#ffffff',
                        font: { weight: 'bold', size: 11 },
                        formatter: (value, ctx) => {
                             const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
                             const p = (value/total*100).toFixed(1);
                             return p >= 3 ? p + '%' : '';
                        }
                     }
                  }
               }} />
              : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontSize: '13px' }}>
                  Chưa có dữ liệu định lượng
                </div>
            }
          </ChartPanel>

          <ChartPanel title="Biến động dòng tiền thu (Cash In)" accentColor="#dc2626" height={220}>
            <Line data={cashflowData} options={{
              ...baseChartOptions,
              scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
                y: {
                  grid: { color: 'rgba(0,0,0,0.04)', drawBorder: false },
                  ticks: {
                    font: { size: 11 }, color: '#94a3b8',
                    callback: v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}Tr` : `${(v / 1000).toFixed(0)}K`
                  }
                }
              }
            }} />
          </ChartPanel>
        </div>
      </section>

    </div>
  );
};

export default Dashboard;
