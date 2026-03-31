import React, { useState, useMemo } from 'react';
import { X, Calendar, BarChart2, List } from 'lucide-react';
import SmartTable from './SmartTable';
import { Line, Bar } from 'react-chartjs-2';
import { formatMoney } from '../utils/formatter';

export default function ReportDetailModal({ isOpen, onClose, data, contextTitle = 'Chi Tiết' }) {
  const [activeTab, setActiveTab] = useState('chart'); // 'chart' | 'list'
  const [timeGroup, setTimeGroup] = useState('daily'); // 'daily' | 'weekly' | 'monthly' | 'yearly'
  
  const processData = useMemo(() => {
    if (!data || !data.dailyLogs) return [];
    
    const logs = Object.keys(data.dailyLogs)
      .map(dateStr => data.dailyLogs[dateStr])
      .sort((a,b) => a.date.localeCompare(b.date));

    // Grouping logic
    const grouped = {};
    logs.forEach(log => {
      const d = new Date(log.date);
      let key = log.date; // YYYY-MM-DD default
      let label = log.date;

      if (timeGroup === 'weekly') {
        // Tuần trong năm
        const weekNum = Math.ceil((((d - new Date(d.getFullYear(),0,1)) / 86400000) + new Date(d.getFullYear(),0,1).getDay()+1) / 7);
        key = `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
        label = `Tuần ${weekNum.toString().padStart(2, '0')} - ${d.getFullYear()}`;
      } else if (timeGroup === 'monthly') {
        key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        label = `Tháng ${d.getMonth() + 1} / ${d.getFullYear()}`;
      } else if (timeGroup === 'yearly') {
        key = `${d.getFullYear()}`;
        label = `Năm ${d.getFullYear()}`;
      } else {
        // daily
        label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          label: label,
          revenue: 0,
          qty: 0,
          cogs: 0,
          fee: 0,
          opex: 0,
          profit: 0
        };
      }
      grouped[key].revenue += (log.revenue || log.attributedRevenue || 0);
      grouped[key].qty += (log.qty || log.orders || 0); // channels have orders instead of qty
      grouped[key].cogs += (log.cogs || log.totalCost || 0); // ingredients have totalCost
      grouped[key].fee += (log.fee || 0);
      grouped[key].opex += (log.opex || 0);
    });

    return Object.values(grouped).map(g => {
      g.profit = g.revenue - g.cogs - g.fee - g.opex;
      return g;
    });
  }, [data, timeGroup]);

  if (!isOpen || !data) return null;

  const isChannel = !!data.orders; // if it has orders, it's a channel
  const isIngredient = typeof data.attributedRevenue !== 'undefined';
  const showProfit = !isIngredient; // Don't show profit for raw ingredients

  // Xây dựng Chart
  const chartData = {
    labels: processData.map(d => d.label),
    datasets: [
      {
        type: 'bar',
        label: isIngredient ? 'Giá Trị Lợi Ích (đ)' : 'Doanh Thu (đ)',
        data: processData.map(d => d.revenue),
        backgroundColor: 'rgba(56, 189, 248, 0.5)',
        borderColor: '#38BDF8',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: showProfit ? 'Lợi Nhuận Gộp (đ)' : 'Chi Phí Gốc (đ)',
        data: processData.map(d => showProfit ? d.profit : d.cogs),
        borderColor: showProfit ? '#22C55E' : '#EF4444',
        backgroundColor: showProfit ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        yAxisID: 'y'
      },
      {
         type: 'line',
         label: isChannel ? 'Số Đơn' : 'Số Lượng/Khối Lượng',
         data: processData.map(d => d.qty),
         borderColor: '#F59E0B',
         borderWidth: 2,
         borderDash: [5, 5],
         yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    scales: {
      y: { type: 'linear', display: true, position: 'left', beginAtZero: true },
      y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, beginAtZero: true }
    }
  };

  // Các cột SmartTable
  const cols = [
    { key: 'label', label: 'Thời Gian', sortable: true, render: v => <div style={{fontWeight: 600}}>{v}</div> },
    { key: 'qty', label: isChannel ? 'Số Đơn' : 'Sử Dụng / Bán Ra', sum: true, align: 'center', render: v => <div style={{fontWeight: 800}}>{Math.round(v * 10) / 10}</div> },
    { key: 'revenue', label: isIngredient ? 'Doanh Thu Phóng Chiếu' : 'Doanh Thu Thuần', sum: true, align: 'right', render: v => <div style={{color: 'var(--primary)', fontWeight: 600}}>{formatMoney(v)} đ</div> },
    { key: 'cogs', label: 'Giá Vốn', sum: true, align: 'right', render: v => <div style={{color: 'var(--danger)'}}>{formatMoney(v)} đ</div> },
  ];

  if (!isIngredient) {
     cols.push({ key: 'fee', label: 'Phí Sàn', sum: true, align: 'right', render: v => <div style={{color: 'var(--warning)'}}>{formatMoney(v)} đ</div> });
     cols.push({ key: 'opex', label: 'CP Vận Hành', sum: true, align: 'right', render: v => <div style={{color: 'var(--warning)'}}>{formatMoney(v)} đ</div> });
     cols.push({ key: 'profit', label: 'Lợi Nhuận Cốt Lõi', sum: true, align: 'right', render: v => <div style={{color: 'var(--success)', fontWeight: 700}}>{formatMoney(v)} đ</div> });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '95%' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <BarChart2 size={24} color="var(--primary)" />
               Khai phá: {data.name} 
               <span style={{ fontSize: '14px', background: 'var(--surface-variant)', padding: '4px 10px', borderRadius: '16px', color: 'var(--text-secondary)', fontWeight: 600 }}>{contextTitle}</span>
            </h2>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Hệ thống lưu trữ Time-Series dữ liệu chi tiết của từng đối tượng.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', borderRadius: '50%', transition: 'background 0.2s' }}>
            <X size={24} />
          </button>
        </div>

        {/* Mảng Tùy Chọn + Tabs */}
        <div style={{ padding: '16px 32px', background: 'var(--bg-color)', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          
          <div style={{ display: 'flex', gap: '8px', background: 'var(--surface-color)', padding: '4px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
             <button onClick={() => setActiveTab('chart')} className={`btn ${activeTab === 'chart' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <BarChart2 size={18} /> Biểu Đồ
             </button>
             <button onClick={() => setActiveTab('list')} className={`btn ${activeTab === 'list' ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <List size={18} /> Danh Sách
             </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-color)', padding: '6px 16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
             <Calendar size={18} color="var(--text-secondary)" />
             <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Nhóm theo:</span>
             <select 
                value={timeGroup} 
                onChange={e => setTimeGroup(e.target.value)} 
                style={{ border: 'none', background: 'transparent', fontWeight: 700, color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontSize: '14px' }}
             >
                <option value="daily">Ngày</option>
                <option value="weekly">Tuần</option>
                <option value="monthly">Tháng</option>
                <option value="yearly">Năm</option>
             </select>
          </div>

        </div>

        {/* Nội Dung (Chart vs Table) */}
        <div style={{ padding: '32px', maxHeight: '60vh', overflowY: 'auto' }}>
           {activeTab === 'chart' ? (
              <div style={{ height: '400px', width: '100%', position: 'relative' }}>
                 {processData.length > 0 ? (
                     <Bar data={chartData} options={chartOptions} />
                 ) : (
                     <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Không có dữ liệu thời gian ghi nhận.</div>
                 )}
              </div>
           ) : (
              <SmartTable
                 columns={cols}
                 data={processData}
                 defaultItemsPerPage={10}
                 actions={false}
                 selectable={false}
              />
           )}
        </div>
      </div>
    </div>
  );
}
