import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, DollarSign, Building } from 'lucide-react';
import { useData } from '../context/DataContext';

const StatBox = ({ title, amount, icon, type }) => (
  <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
    <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', color: type === 'income' ? 'var(--success)' : type === 'expense' ? 'var(--danger)' : 'var(--primary)' }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>{title}</p>
      <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700 }}>{amount.toLocaleString('vi-VN')} đ</h3>
    </div>
  </div>
);

const Finance = () => {
  const { state } = useData();
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [filterType, setFilterType] = React.useState('all');

  // Tính toán các chỉ số
  const filteredTransactions = state.transactions.filter(t => {
    const matchType = filterType === 'all' || t.type === filterType;
    const itemDate = new Date(t.date).setHours(0,0,0,0);
    const start = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
    const end = endDate ? new Date(endDate).setHours(23,59,59,999) : null;
    const matchDate = (!start || itemDate >= start) && (!end || itemDate <= end);
    return matchType && matchDate;
  });

  const totalIncome = filteredTransactions.filter(t => t.type === 'Thu').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'Chi').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Wallet color="var(--primary)" /> Quản Lý Tài Chính & Sổ Quỹ
          </h2>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
         <StatBox title="Tổng Thu (Kỳ)" amount={totalIncome} icon={<ArrowUpRight size={24} />} type="income" />
         <StatBox title="Tổng Chi (Kỳ)" amount={totalExpense} icon={<ArrowDownRight size={24} />} type="expense" />
         <StatBox title="Lợi Nhuận Gộp (Kỳ)" amount={netProfit} icon={<Wallet size={24} />} type="neutral" />
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Từ ngày:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid var(--surface-border)', padding:'8px', borderRadius:'6px', outline:'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Đến ngày:</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid var(--surface-border)', padding:'8px', borderRadius:'6px', outline:'none' }} />
          </div>

          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid var(--surface-border)', padding:'8px', borderRadius:'6px', outline:'none' }}>
            <option value="all">-- Tất cả Loại GD --</option>
            <option value="Thu">Chỉ Khoản Thu</option>
            <option value="Chi">Chỉ Khoản Chi</option>
          </select>

          <button className="btn btn-ghost" onClick={() => { setStartDate(''); setEndDate(''); setFilterType('all'); }} style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>Xóa Lọc</button>
        </div>
        <h3 style={{ margin: 0, marginBottom: '20px' }}>Sổ Quỹ (Toàn bộ Giao dịch)</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--surface-border)' }}>Mã GD</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--surface-border)' }}>Thời Gian</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--surface-border)' }}>Loại</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--surface-border)' }}>Danh Mục</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--surface-border)' }}>Tham Chiếu</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--surface-border)' }}>Số Tiền</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--surface-border)' }}>Ghi Chú</th>
            </tr>
          </thead>
          <tbody>
            {[...filteredTransactions].reverse().map((t, idx) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--surface-border)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                <td style={{ padding: '12px 16px' }}>{t.id}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{new Date(t.date).toLocaleString('vi-VN')}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', backgroundColor: t.type === 'Thu' ? 'rgba(46, 160, 67, 0.2)' : 'rgba(218, 54, 51, 0.2)', color: t.type === 'Thu' ? 'var(--success)' : 'var(--danger)' }}>
                    {t.type}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>{t.category}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{t.refId || '-'}</td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: t.type === 'Thu' ? 'var(--success)' : 'var(--danger)' }}>
                  {t.type === 'Thu' ? '+' : ''}{t.amount.toLocaleString('vi-VN')} đ
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{t.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Finance;
