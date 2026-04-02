import React, { useMemo, useState } from 'react';
import { Package, AlertTriangle, TrendingUp, BarChart3, Download, Filter, Calendar, Activity } from 'lucide-react';
import { useData } from '../context/DataContext';
import { formatMoney } from '../utils/formatter';
import SmartTable from '../components/SmartTable';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const InventoryReports = () => {
  const { state } = useData();
  const [filterDate, setFilterDate] = useState({ start: '', end: '' });
  const [datePreset, setDatePreset] = useState('month'); 

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const startObj = new Date(now);
    const endObj = new Date(now);
    
    if (preset === 'today') {
      // today is same day
    } else if (preset === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startObj.setDate(diff);
    } else if (preset === 'month') {
      startObj.setDate(1);
    } else if (preset === 'year') {
      startObj.setMonth(0, 1);
    }

    if (preset !== 'custom') {
      const pad = n => n.toString().padStart(2, '0');
      setFilterDate({
        start: `${startObj.getFullYear()}-${pad(startObj.getMonth()+1)}-${pad(startObj.getDate())}`,
        end: `${endObj.getFullYear()}-${pad(endObj.getMonth()+1)}-${pad(endObj.getDate())}`
      });
    }
  };

  React.useEffect(() => {
    handlePresetChange('month');
  }, []);

  const reportData = useMemo(() => {
    if (!state) return null;
    try {
      const start = filterDate.start ? new Date(filterDate.start).setHours(0,0,0,0) : 0;
      const end = filterDate.end ? new Date(filterDate.end).setHours(23,59,59,999) : Infinity;

      const ingredients = state.ingredients || [];
      const posOrders = state.posOrders || [];
      const purchases = state.purchaseOrders || state.purchases || [];
      const products = state.products || [];

      // Dữ liệu "Đứng yên" Snapshot
      let totalStockValue = 0;
      const lowStockItems = [];
      const highValueItems = [];

      const lastPurchaseMap = {};
      
      if (ingredients) {
         ingredients.forEach(ing => {
            if (ing.lastPurchaseDate) {
               lastPurchaseMap[ing.id] = new Date(ing.lastPurchaseDate).getTime();
            }
         });
      }

      purchases.forEach(po => {
         const tTime = new Date(po.date || po.createdAt).getTime();
         (po.items || []).forEach(item => {
             const existing = lastPurchaseMap[item.ingredientId] || 0;
             if (tTime > existing) {
                 lastPurchaseMap[item.ingredientId] = tTime;
             }
         });
      });

      ingredients.forEach(item => {
        const conv = Number(item.conversionRate) || 1;
        const costPerBuyUnit = Number(item.buyPrice) || (Number(item.cost) * conv) || 0;
        const itemValue = item.stock * costPerBuyUnit;
        const lastPurchaseDate = lastPurchaseMap[item.id] || null;
        
        totalStockValue += (itemValue || 0);

        if (item.stock <= item.minStock) {
          lowStockItems.push({ ...item, itemValue, costPerBuyUnit, lastPurchaseDate });
        }
        highValueItems.push({ ...item, itemValue, costPerBuyUnit, lastPurchaseDate });
      });

      highValueItems.sort((a, b) => b.itemValue - a.itemValue);


      // Dữ liệu "Dòng chảy" (Time-Series)
      const dailyTrend = {};
      const getDateStr = (d) => {
        const date = new Date(d);
        return `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}`;
      };

      let totalConsumption = 0;
      
      const getProductCost = (recipe) => {
        if (!recipe || !Array.isArray(recipe)) return 0;
        return recipe.reduce((sum, item) => {
          const sub = products.find(p => p.id === item.ingredientId);
          if (sub) {
            const subQty = item.unitMode === 'divide' ? (1/item.qty) : item.qty;
            return sum + (getProductCost(sub.recipe) * subQty);
          }
          const ing = ingredients.find(i => i.id === item.ingredientId);
          if (ing) {
            let bQty = item.qty || 0;
            if (item.unitMode === 'buy') bQty = (item.qty || 0) * (ing.conversionRate || 1);
            if (item.unitMode === 'divide') bQty = 1 / (item.qty || 1);
            return sum + (bQty * (ing.cost || 0));
          }
          return sum;
        }, 0);
      };

      // Quét Tiêu Hao
      posOrders.forEach(o => {
          const tTime = new Date(o.date).getTime();
          if (tTime >= start && tTime <= end && o.status !== 'Cancelled') {
              const dStr = getDateStr(o.date);
              if (!dailyTrend[dStr]) dailyTrend[dStr] = { consumption: 0, purchase: 0 };
              
              const orderItems = o.items || (o.cart ? o.cart.map(c => ({ product: c, quantity: c.qty })) : []);
              orderItems.forEach(cartItem => {
                  if (!cartItem.product) return;
                  const pid = cartItem.product.id;
                  const qty = cartItem.quantity || 1;
                  
                  let latestProduct = products.find(p => p.id === pid);
                  if (!latestProduct && cartItem.product.name) {
                      latestProduct = products.find(p => p.name.trim().toLowerCase() === cartItem.product.name.trim().toLowerCase());
                  }
                  const recipeToUse = latestProduct ? latestProduct.recipe : (cartItem.product.recipe || []);
                  const unitCost = getProductCost(recipeToUse);
                  
                  dailyTrend[dStr].consumption += (unitCost * qty);
                  totalConsumption += (unitCost * qty);
              });
          }
      });

      // Quét Nhập Hàng
      let totalPurchases = 0;
      purchases.forEach(po => {
          const tTime = new Date(po.createdAt).getTime();
          if (tTime >= start && tTime <= end && po.status !== 'Cancelled') {
              const dStr = getDateStr(po.createdAt);
              if (!dailyTrend[dStr]) dailyTrend[dStr] = { consumption: 0, purchase: 0 };
              const val = Number(po.totalAmount) || 0;
              dailyTrend[dStr].purchase += val;
              totalPurchases += val;
          }
      });

      const sortedTrendLabels = Object.keys(dailyTrend).sort((a,b) => {
          const [d1, m1] = a.split('/'); const [d2, m2] = b.split('/');
          return new Date(2020, m1-1, d1) - new Date(2020, m2-1, d2);
      });

      return {
        totalStockValue,
        lowStockItems,
        highValueItems: highValueItems.slice(0, 50),
        trend: {
            labels: sortedTrendLabels,
            consumption: sortedTrendLabels.map(d => dailyTrend[d].consumption),
            purchase: sortedTrendLabels.map(d => dailyTrend[d].purchase)
        },
        totalConsumption,
        totalPurchases
      };
    } catch (err) {
      console.log(err);
      return null;
    }
  }, [state, filterDate]);

  if (!reportData) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu báo cáo kho...</div>;
  }

  const chartData = {
      labels: reportData.trend.labels,
      datasets: [
          {
              type: 'bar',
              label: 'Thực Chi Nhập Kho',
              data: reportData.trend.purchase,
              backgroundColor: 'rgba(59, 130, 246, 0.6)',
              borderRadius: 4
          },
          {
              type: 'line',
              label: 'Tiêu Hao Lên Món (COGS)',
              data: reportData.trend.consumption,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
          }
      ]
  };

  const inventoryCols = [
      { key: 'name', label: 'Tên Nguyên Liệu / Vật Tư', sortable: true, render: (v, item) => (
          <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{v}</div>
              {item.buyUnit && item.buyUnit !== item.unit && (
                 <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '4px', background: 'rgba(59, 130, 246, 0.05)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                     1 {item.buyUnit} = {item.conversionRate || 1} {item.unit}
                 </div>
              )}
          </div>
      ) },
      { key: 'stock', label: 'Lượng Tồn Hiện Tại', sortable: true, align: 'right', render: (v, item) => {
          const conversion = Number(item.conversionRate) || 1;
          const stockInBuyUnit = item.stock || 0;
          const baseStock = (item.stock || 0) * conversion;
          return (
             <div>
                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '14px' }}>
                    {Math.round(stockInBuyUnit * 100)/100} <span style={{fontSize: '11px', color:'var(--text-secondary)'}}>{item.buyUnit || item.unit}</span>
                </div>
                <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ fontWeight: 700 }}>{Math.round(baseStock * 10)/10}</span> <span style={{fontSize: '10px'}}>{item.unit}</span>
                    {(() => {
                        const conv = Number(item.conversionRate) || 1;
                        if (item.buyUnit && item.buyUnit !== item.unit && conv > 1) {
                            const w = Math.floor(Math.abs(baseStock) / conv) * Math.sign(baseStock);
                            const r = Math.abs(baseStock) % conv * Math.sign(baseStock);
                            if (w !== 0 || r !== 0) {
                                return (
                                   <span style={{ fontSize: '11px', fontWeight: 600, display: 'inline-block', marginLeft: '6px' }}>
                                      ({w !== 0 ? `${w} ${item.buyUnit} ` : ''}{w !== 0 && r !== 0 ? '+ ' : ''}{r !== 0 ? `${Math.round(r*10)/10} ${item.unit}` : ''})
                                   </span>
                                );
                            }
                        }
                        return null;
                    })()}
                </div>
             </div>
          );
      } },
      { key: 'costPerBuyUnit', label: 'Đơn Giá Nhập', sortable: true, align: 'right', render: (v, item) => (
          <div>
             <div style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>{formatMoney(v)}</div>
             <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-secondary)' }}>/ {item.buyUnit || item.unit}</div>
          </div>
      ) },
      { key: 'itemValue', label: 'Khối Lượng Vốn', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v) => {
          const pct = reportData.totalStockValue > 0 ? ((v / reportData.totalStockValue) * 100).toFixed(1) : 0;
          return (
             <div>
                 <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '14px' }}>
                     {formatMoney(v)}
                 </div>
                 <div style={{ marginTop: '4px' }}>
                     <span style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>Tỷ trọng: {pct}%</span>
                 </div>
             </div>
          );
      } },
      { key: 'lastPurchaseDate', label: 'Ngày Nhập Cũ', sortable: true, align: 'center', render: (v) => {
          if (!v) return <div style={{color:'var(--text-secondary)'}}>-</div>;
          const todayMidnight = new Date().setHours(0,0,0,0);
          const purchaseMidnight = new Date(v).setHours(0,0,0,0);
          const diffDays = Math.floor((todayMidnight - purchaseMidnight) / (1000 * 60 * 60 * 24));
          return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{new Date(v).toLocaleDateString('vi-VN')}</div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: diffDays > 30 ? 'var(--danger)' : diffDays > 7 ? 'var(--warning)' : 'var(--success)' }}>
                      {diffDays === 0 ? 'Mới nhập hôm nay' : `Đã tồn ${diffDays} ngày`}
                  </div>
              </div>
          );
      } },
      { key: 'status', label: 'Đánh Giá Ngưỡng', align: 'center', render: (_, item) => {
          const isLowStock = item.stock <= item.minStock;
          return isLowStock ? <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '13px', background: '#FEF2F2', padding: '4px 8px', borderRadius: '4px' }}>Chạm Đáy</span> : <span style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 500 }}>An toàn</span>;
      } }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package color="var(--primary)" /> Báo Cáo Tồn Kho & Dòng Chảy Vật Tư
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Phân tích định giá hàng hóa hiện tại và theo dõi biến động dòng tiền nhập xuất kỳ vọng.</p>
        </div>
        <button className="btn btn-primary table-feature-btn" onClick={() => window.print()}><Download size={16}/> Xuất Báo Cáo</button>
      </div>

      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', background: 'var(--surface-color)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
             <Filter size={18} /> Bộ Lọc Theo Thời Gian (Dòng chảy):
         </div>
         <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', padding: '4px' }}>
             {['today', 'week', 'month', 'year'].map(pt => {
                 const names = { today: 'Hôm Nay', week: 'Tuần Này', month: 'Tháng Này', year: 'Năm Nay' };
                 return (
                    <button key={pt} onClick={() => handlePresetChange(pt)} 
                            style={{ 
                                padding: '0 16px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center',
                                background: datePreset === pt ? 'white' : 'transparent',
                                color: datePreset === pt ? 'var(--primary)' : 'var(--text-secondary)',
                                boxShadow: datePreset === pt ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                             }}>
                        {names[pt]}
                    </button>
                 );
             })}
             <button onClick={() => setDatePreset('custom')}
                 style={{ 
                    padding: '0 16px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
                    background: datePreset === 'custom' ? 'white' : 'transparent',
                    color: datePreset === 'custom' ? 'var(--primary)' : 'var(--text-secondary)',
                    boxShadow: datePreset === 'custom' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                 }}>Tùy Chọn</button>
         </div>

         {datePreset === 'custom' && (
             <div style={{ display:'flex', alignItems:'center', gap:'12px', borderLeft: '1px solid var(--surface-border)', paddingLeft: '16px' }}>
                <Calendar size={18} color="var(--primary)" />
                <input type="date" className="form-input" style={{ width:'140px', padding: '6px 12px' }} value={filterDate.start} onChange={e => setFilterDate({...filterDate, start: e.target.value})} />
                <span>đến</span>
                <input type="date" className="form-input" style={{ width:'140px', padding: '6px 12px' }} value={filterDate.end} onChange={e => setFilterDate({...filterDate, end: e.target.value})} />
             </div>
         )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--primary)' }}>
           <h3 style={{ color: 'var(--primary)', margin: '0 0 12px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             GIÁ TRỊ TỒN KHO THỰC TẾ TRONG KHO
           </h3>
           <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>{formatMoney(reportData.totalStockValue)}</div>
           <div style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '12px', fontWeight: 500 }}>
               (Dựa trên Số lượng * Giá vốn hiện tại). Chỉ số mang tính thời điểm.
           </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--success)' }}>
           <h3 style={{ color: 'var(--success)', margin: '0 0 12px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             TỔNG CHI NHẬP HÀNG KỲ NÀY
           </h3>
           <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--success)' }}>{formatMoney(reportData.totalPurchases)}</div>
           <div style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '12px', fontWeight: 500 }}>
             Tổng giá trị Phiếu Nhập Kho trong kỳ.
           </div>
        </div>

        <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--danger)' }}>
           <h3 style={{ color: 'var(--danger)', margin: '0 0 12px 0', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
             TỔNG VỐN TIÊU HAO LÊN MÓN (COGS)
           </h3>
           <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--danger)' }}>{formatMoney(reportData.totalConsumption)}</div>
           <div style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '12px', fontWeight: 500 }}>
             Tổng giá trị nguyên liệu đã bị xuất kho để bán.
           </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>BIỂU ĐỒ BÙ TRỪ VẬT TƯ: TỐC ĐỘ TIÊU HAO (XUẤT) VÀ NHẬP HÀNG</h4>
          <div style={{ height: '300px' }}>
              <Bar data={chartData} options={{ 
                  maintainAspectRatio: false, 
                  interaction: { mode: 'index', intersect: false },
                  scales: { y: { beginAtZero: true } }
              }} />
          </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--primary)" /> Tầm Soát Tồn Kho & Cấu Trúc Khối Lượng Tiền Tồn (Theo Thực Tế Hiện Tại)
          </h4>
          <div className="glass-panel" style={{ padding: '0', overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
              <SmartTable
                 columns={inventoryCols}
                 data={reportData.highValueItems}
                 idKey="id"
                 storageKey="inventory_report"
                 defaultItemsPerPage={50}
                 tableMinWidth="900px"
              />
          </div>
      </div>
    </div>
  );
};

export default InventoryReports;
