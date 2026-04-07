import React from 'react';
import { Wallet, Plus, Search, Building2, CreditCard, Banknote, ArrowLeftRight, Trash2, Edit3, FileText, Printer, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import CurrencyInput from './CurrencyInput';
import SmartTable from './SmartTable';
import BulkActionBar from './BulkActionBar';
import UnifiedTrash from './UnifiedTrash';
import SmartDateFilter from './SmartDateFilter';
import { numberToWords } from '../utils/formatter';

const Settings2 = ({ size, onClick, style, title }) => (
  <Edit3 size={size} onClick={onClick} style={style} title={title} />
);

const AccountCard = ({ acc, onSelect, isActive, onAdjust }) => {
  const getIcon = (type) => {
    if (type === 'bank') return <Building2 size={18} />;
    if (type === 'e-wallet') return <CreditCard size={18} />;
    return <Banknote size={18} />;
  };

  return (
    <div 
      className="glass-panel hover-glow" 
      onClick={() => onSelect(acc)}
      style={{ 
        padding: '16px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px', 
        minWidth: '220px', 
        cursor: 'pointer',
        border: isActive ? '1px solid var(--primary)' : '1px solid var(--surface-border)',
        boxShadow: isActive ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{acc.type}</span>
        <Settings2 size={14} onClick={(e) => { e.stopPropagation(); onAdjust(acc); }} style={{ cursor: 'pointer' }} title="Điều chỉnh số dư" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ color: isActive ? 'var(--primary)' : 'inherit' }}>{getIcon(acc.type)}</div>
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{acc.name}</h4>
      </div>
      <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
        {acc.balance.toLocaleString('vi-VN')} đ
      </p>
    </div>
  );
};

export default function AccountingUI({ manager }) {
  const { state: rootState, dispatch } = manager;
  const { 
      selectedAcc, showVoucherModal, showAdjustModal, showTransferModal, showCatModal, 
      viewVoucher, vForm, adjustForm, transferForm, catForm, confirmDelete, 
      viewOrder, debtFilters, filters, activeJournalTab, datePreset, statsByRange, 
      monthlyNet, filteredTransactions, filteredPayables, filteredReceivables,
      listCtrl
  } = manager.models;
  const { 
      setSelectedAcc, setShowVoucherModal, setShowAdjustModal, setShowTransferModal, setShowCatModal,
      setViewVoucher, setVForm, setAdjustForm, setTransferForm, setCatForm, setConfirmDelete, setViewOrder,
      setDebtFilters, setFilters, setActiveJournalTab, setDatePreset,
      handleAdjustSubmit, handleVoucherSubmit, handleEditTransaction, handleDeleteTransaction, handleProcessDebt
  } = manager.actions;

  const {
      trashMode, toggleTrashMode,
      selectedIds, clearSelection, toggleSelection,
      trashItems,
      handlers
  } = listCtrl || {};

  // eslint-disable-next-line no-unused-vars
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const datePickerRef = React.useRef(null);

  React.useEffect(() => {
     const handleClickOutside = (event) => {
        if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
           setShowDatePicker(false);
        }
     };
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const datePresetsDict = {
     'all': 'Tất cả thời gian',
     'today': 'Hôm nay',
     'this_week': 'Tuần này',
     'this_month': 'Tháng này',
     'custom': 'Tuỳ chọn'
  };

  const handlePresetApply = (preset) => {
     if (preset === 'custom' || preset === 'all') {
         if(preset === 'all') setFilters({...filters, start: '', end: '', dateFilterPreset: 'all'});
         return;
     }
     const now = new Date();
     const startObj = new Date(now);
     const endObj = new Date(now);
     if (preset === 'today') {
        // stay now
     } else if (preset === 'this_week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startObj.setDate(diff);
     } else if (preset === 'this_month') {
        startObj.setDate(1);
     }
     const pad = n => n.toString().padStart(2, '0');
     setFilters({...filters, 
       start: `${startObj.getFullYear()}-${pad(startObj.getMonth()+1)}-${pad(startObj.getDate())}`,
       end: `${endObj.getFullYear()}-${pad(endObj.getMonth()+1)}-${pad(endObj.getDate())}`,
       dateFilterPreset: preset
     });
  };

  // eslint-disable-next-line no-unused-vars
  const currentPresetFilterLabel = (() => {
    if (filters.dateFilterPreset !== 'custom' && filters.dateFilterPreset && datePresetsDict[filters.dateFilterPreset]) {
        return datePresetsDict[filters.dateFilterPreset];
    }
    const sDate = filters.start ? new Date(filters.start).toLocaleDateString('vi-VN') : '...';
    const eDate = filters.end ? new Date(filters.end).toLocaleDateString('vi-VN') : '...';
    if (sDate === eDate && sDate !== '...') return sDate;
    return `${sDate} - ${eDate}`;
  })();

  const InputStyle = { 
    background: '#FFFFFF', border: '1px solid #D1D5DB', color: '#111827', padding: '12px 16px', 
    borderRadius: '8px', width: '100%', outline: 'none', fontSize: '14px', fontWeight: 600,
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)', boxSizing: 'border-box'
  };
  
  const LabelStyle = {
    fontSize: '13px', color: '#374151', fontWeight: 700, marginBottom: '6px', display: 'block'
  };

  const FormGroup = { marginBottom: '16px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>
      <div className="accounting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: 'var(--font-xl)' }}>
            <Wallet color="var(--primary)" /> Sổ Quỹ & Công Nợ
          </h2>
          <p className="mobile-hide hide-on-landscape" style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quản lý dòng tiền, đối soát ví và công nợ tập trung.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
           <button className="btn btn-ghost table-feature-btn" onClick={() => setShowTransferModal(true)}>
              <ArrowLeftRight size={16} /> Chuyển Ví
           </button>
           <button className="btn btn-primary table-feature-btn" onClick={() => setShowVoucherModal(true)}>
              <Plus size={16} /> Lập Phiếu
           </button>
        </div>
      </div>

      <div className="accounting-layout">
         <div className="stats-horizontal-grid">
            <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderTop: '4px solid var(--warning)', background: 'rgba(249, 115, 22, 0.02)' }}>
               <h4 style={{ margin: 0, marginBottom: '12px', fontSize: '11px', color: 'var(--warning)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', borderBottom: '1px dashed #fed7aa', paddingBottom: '6px', width: 'fit-content' }}>Cảnh Báo Công Nợ</h4>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '20px' }}>
                  {/* Cột Phải Trả NCC */}
                  <div>
                     <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>NỢ NCC (PHẢI TRẢ):</span>
                     <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                        <strong style={{ fontSize: '1.2rem', color: 'var(--danger)', lineHeight: 1 }}>
                           {rootState.purchaseOrders.filter(p => !p.deleted && p.status !== 'Cancelled' && (p.status === 'Debt' || p.status === 'Pending')).reduce((sum, p) => sum + (p.totalAmount || 0), 0).toLocaleString()} <small style={{fontSize:'var(--font-xs)'}}>đ</small>
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px', fontWeight: 600 }}>
                           ({rootState.purchaseOrders.filter(p => !p.deleted && p.status !== 'Cancelled' && (p.status === 'Debt' || p.status === 'Pending')).length} phiếu)
                        </span>
                     </div>
                  </div>
                  
                  <div style={{ width: '1px', background: 'var(--surface-border)', height: '100%' }}></div>
                  
                  {/* Cột Phải Thu Khách Hàng */}
                  <div>
                     <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px', fontWeight: 600 }}>NỢ KHÁCH HÀNG (PHẢI THU):</span>
                     <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                        <strong style={{ fontSize: '1.2rem', color: '#B45309', lineHeight: 1 }}>
                           {rootState.posOrders.filter(o => !o.deleted && o.status !== 'Cancelled' && (o.paymentStatus === 'Debt' || o.paymentStatus === 'Unpaid')).reduce((sum, o) => sum + ((o.netAmount || 0) + (Number(o.extraFee) || 0)), 0).toLocaleString()} <small style={{fontSize:'var(--font-xs)'}}>đ</small>
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px', fontWeight: 600 }}>
                           ({rootState.posOrders.filter(o => !o.deleted && o.status !== 'Cancelled' && (o.paymentStatus === 'Debt' || o.paymentStatus === 'Unpaid')).length} đơn)
                        </span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="glass-panel" style={{ padding: '12px 20px', gridColumn: 'span 2' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-sm)' }}>
                     <TrendingUp size={18} color="var(--primary)"/> Thống Kê Nhanh
                  </h4>
                     <SmartDateFilter 
                         filterDate={manager.models.statsFilterDate}
                         setFilterDate={manager.actions.setStatsFilterDate}
                         datePreset={datePreset}
                         setDatePreset={setDatePreset}
                         align="right"
                     />
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '10px 16px', background: 'rgba(34, 197, 94, 0.05)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--success)', display: 'flex', flexDirection: 'column' }}>
                     <p style={{ margin: 0, fontSize: '10px', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase' }}>Tổng Thu</p>
                     <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--success)' }}>
                        {statsByRange.income.toLocaleString()} <span style={{fontSize:'var(--font-xs)', opacity: 0.8}}>đ</span>
                     </p>
                  </div>
                  <div style={{ padding: '10px 16px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--danger)', display: 'flex', flexDirection: 'column' }}>
                     <p style={{ margin: 0, fontSize: '10px', color: 'var(--danger)', fontWeight: 700, textTransform: 'uppercase' }}>Tổng Chi</p>
                     <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--danger)' }}>
                        {statsByRange.expense.toLocaleString()} <span style={{fontSize:'var(--font-xs)', opacity: 0.8}}>đ</span>
                     </p>
                  </div>
                  <div style={{ padding: '10px 16px', background: monthlyNet >= 0 ? 'rgba(59, 130, 246, 0.05)' : 'rgba(249, 115, 22, 0.05)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${monthlyNet >= 0 ? 'var(--primary)' : 'var(--warning)'}`, display: 'flex', flexDirection: 'column' }}>
                     <p style={{ margin: 0, fontSize: '10px', color: monthlyNet >= 0 ? 'var(--primary)' : 'var(--warning)', fontWeight: 700, textTransform: 'uppercase' }}>Dòng Tiền</p>
                     <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: monthlyNet >= 0 ? 'var(--primary)' : 'var(--warning)' }}>
                        {monthlyNet >= 0 ? '+' : ''}{monthlyNet.toLocaleString()} <span style={{fontSize:'var(--font-xs)', opacity: 0.8}}>đ</span>
                     </p>
                  </div>
               </div>
            </div>
         </div>

         <div className="glass-panel ledger-container bctc-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="journal-tabs bctc-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--surface-border)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                {['all', 'income', 'expense', 'payable', 'receivable'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => { setActiveJournalTab(tab); if (tab !== 'payable' && tab !== 'receivable') setFilters(prev => ({ ...prev, categoryId: 'all' })); }}
                        style={{ 
                            padding: '12px 24px', background: 'transparent', border: 'none', 
                            borderBottom: activeJournalTab === tab ? `2px solid ${tab === 'payable' ? 'var(--warning)' : tab === 'receivable' ? '#0ea5e9' : tab === 'income' ? 'var(--success)' : tab === 'expense' ? 'var(--danger)' : 'var(--primary)'}` : '2px solid transparent', 
                            color: activeJournalTab === tab ? (tab === 'payable' ? 'var(--warning)' : tab === 'receivable' ? '#0ea5e9' : tab === 'income' ? 'var(--success)' : tab === 'expense' ? 'var(--danger)' : 'var(--primary)') : 'var(--text-secondary)', 
                            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' 
                        }}
                    >
                        {tab === 'all' ? 'Sổ Nhật Ký Chung' : tab === 'income' ? 'Nhật Ký THU' : tab === 'expense' ? 'Nhật Ký CHI' : tab === 'payable' ? 'Nợ PHẢI TRẢ (NCC)' : 'Nợ PHẢI THU (Khách)'}
                    </button>
                ))}
            </div>

            <div className="ledger-toolbar bctc-panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
               <h3 style={{ margin: 0, fontSize: 'var(--font-base)', minWidth: '150px' }}>
                  {activeJournalTab === 'payable' ? 'Chi tiết công nợ phải trả' : activeJournalTab === 'receivable' ? 'Chi tiết công nợ phải thu' : (selectedAcc ? `Sổ Chi Tiết: ${selectedAcc.name}` : 'Toàn bộ dòng tiền')}
               </h3>
               
               <div className="ledger-toolbar" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <div className="search-box" style={{ width: 'clamp(200px, 100%, 280px)', padding: '0 12px', height: '34px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={14} color="var(--text-secondary)" />
                    <input type="text" placeholder="Tìm theo Mã, Diễn giải, Đối tác..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', flex: 1, fontSize: '13px', fontWeight: 500 }} />
                  </div>

                  {activeJournalTab !== 'payable' && activeJournalTab !== 'receivable' && (
                     <>
                       <select 
                          className="table-feature-select"
                          value={selectedAcc?.id || 'all'} 
                          onChange={e => setSelectedAcc(rootState.accounts.find(a => a.id === e.target.value) || null)}
                          style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', height: '34px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', padding: '0 12px' }}
                       >
                          <option value="all">Tất cả Ví</option>
                          {rootState.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}{acc.accountNumber ? ` - ${acc.accountNumber}` : ''}</option>)}
                       </select>
                     </>
                  )}

                  {activeJournalTab === 'payable' && (
                     <select 
                        className="table-feature-select"
                        value={debtFilters.supplierId}
                        onChange={e => setDebtFilters({...debtFilters, supplierId: e.target.value})}
                        style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', height: '34px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', padding: '0 12px' }}
                     >
                        <option value="all">Tất cả NCC</option>
                        {rootState.suppliers?.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                     </select>
                  )}

                  {activeJournalTab === 'receivable' && (
                     <select 
                        className="table-feature-select"
                        value={debtFilters.channelId}
                        onChange={e => setDebtFilters({...debtFilters, channelId: e.target.value})}
                        style={{ background: 'var(--surface-color)', border: '1px solid var(--surface-border)', height: '34px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', padding: '0 12px' }}
                     >
                        <option value="all">Tất cả Kênh</option>
                        <option value="Grab">Grab Order</option>
                        <option value="Shopee">Shopee Order</option>
                        <option value="Tại quầy">Tại quầy</option>
                     </select>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <SmartDateFilter 
                         filterDate={{ start: filters.start, end: filters.end }}
                         setFilterDate={(date) => {
                             if (!date) return;
                             setFilters({
                                 ...filters,
                                 start: date.start,
                                 end: date.end,
                                 dateFilterPreset: 'custom'
                             });
                         }}
                         datePreset={filters.dateFilterPreset || 'all'}
                         handlePresetChange={(preset) => handlePresetApply(preset)}
                         icon={AlertCircle}
                         align="right"
                     />
                  </div>
                  <button className="btn btn-ghost" onClick={() => { setFilters({ start: '', end: '', type: 'all', categoryId: 'all', search: '', dateFilterPreset: 'all' }); setSelectedAcc(null); setActiveJournalTab('all'); setDebtFilters({ supplierId: 'all', channelId: 'all' }); }} style={{ color: 'var(--danger)', fontSize: '13px', fontWeight: 600, padding: '0 12px', height: '34px', border: '1px dashed #FCA5A5', borderRadius: '8px', background: '#FEF2F2' }}>Xóa Lọc</button>
               </div>
            </div>
            
            <div className="divider-solid" style={{ marginBottom: '20px', opacity: 0.5 }}></div>

            <div className="table-responsive" style={{ flex: 1, border: '1px solid var(--surface-border)', borderRadius: '12px', overflow: 'hidden' }}>
               {activeJournalTab === 'payable' ? (
                 <SmartTable 
                   data={filteredPayables}
                   columns={[
                     { key: 'date', label: 'Ngày Nhập', sortable: true, render: val => new Date(val).toLocaleDateString('vi-VN') },
                     { key: 'id', label: 'Mã Đơn', sortable: true, render: val => <span style={{fontWeight: 700}}>{val}</span> },
                     { key: 'seller', label: 'Nhà Cung Cấp', sortable: true, render: (_, p) => rootState.suppliers?.find(s => s.id === p.supplierId)?.name || p.seller || 'N/A' },
                     { key: 'items', label: 'Diễn Giải', render: (val, p) => (
                        <button className="btn btn-ghost" onClick={() => setViewOrder({ ...p, orderType: 'PO' })} style={{ padding: '0', color: 'var(--primary)', textDecoration: 'underline', fontSize: '13px' }}>
                           Xem {p.items?.length || 0} mục
                        </button>
                     )},
                     { key: 'totalAmount', label: 'Tổng Cần Trả', align: 'right', sum: true, sortable: true, render: val => <span style={{color:'var(--danger)', fontWeight:700}}>{(val || 0).toLocaleString('vi-VN')} đ</span> },
                     { key: 'status', label: 'Trạng Thái', align: 'center', render: (val, p) => (
                        <div style={{ display:'flex', gap:'8px', justifyContent:'center', alignItems: 'center' }}>
                           <span style={{ padding:'4px 8px', borderRadius:'4px', background:'rgba(239, 68, 68, 0.1)', color:'var(--danger)', fontSize:'11px', fontWeight:800 }}>{val}</span>
                           <button className="btn btn-primary" onClick={() => handleProcessDebt(p, 'payable')} style={{ padding:'4px 12px', fontSize:'11px', background:'var(--success)', whiteSpace: 'nowrap' }}>Thanh toán</button>
                        </div>
                     )}
                   ]}
                   actions={false}
                   emptyMessage="Hiện tại không có khoản nợ nhà cung cấp nào."
                 />
               ) : activeJournalTab === 'receivable' ? (
                 <SmartTable 
                   data={filteredReceivables}
                   columns={[
                     { key: 'date', label: 'Ngày Bán', sortable: true, render: val => new Date(val).toLocaleDateString('vi-VN') },
                     { key: 'id', label: 'Mã Đơn', sortable: true, render: val => <span style={{fontWeight: 700}}>{val}</span> },
                     { key: 'channelName', label: 'Kênh Bán', sortable: true, render: val => val || 'Tại quầy' },
                     { key: 'items', label: 'Diễn Giải', render: (val, o) => (
                        <button className="btn btn-ghost" onClick={() => setViewOrder({ ...o, orderType: 'POS' })} style={{ padding: '0', color: 'var(--primary)', textDecoration: 'underline', fontSize: '13px' }}>
                           Xem {o.items?.length || 0} mục
                        </button>
                     )},
                     { key: 'totalAmount', label: 'Tổng Tiền', align: 'right', sum: true, sortable: true, render: val => <span style={{color:'var(--warning)', fontWeight:700}}>{(val || 0).toLocaleString('vi-VN')} đ</span> },
                     { key: 'paymentStatus', label: 'Trạng Thái', align: 'center', render: (val, o) => (
                        <div style={{ display:'flex', gap:'8px', justifyContent:'center', alignItems: 'center' }}>
                           <span style={{ padding:'4px 8px', borderRadius:'4px', background:'rgba(249, 115, 22, 0.1)', color:'var(--warning)', fontSize:'11px', fontWeight:800 }}>{val}</span>
                           <button className="btn btn-primary" onClick={() => handleProcessDebt(o, 'receivable')} style={{ padding:'4px 12px', fontSize:'11px', whiteSpace: 'nowrap' }}>Thu tiền</button>
                        </div>
                     )}
                   ]}
                   actions={false}
                   emptyMessage="Toàn bộ khoản thu đã được thanh toán đầy đủ."
                 />
               ) : trashMode ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ display: 'flex' }}>
                     <button className="btn btn-ghost" style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', height: '34px', padding: '0 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }} onClick={toggleTrashMode}>
                       <Trash2 size={14} color="var(--primary)"/> Quay lại Sổ Quỹ
                     </button>
                   </div>
                   <UnifiedTrash 
                     items={trashItems}
                     columns={[
                       { key: 'voucherCode', label: 'Mã Phiếu', render: val => <span style={{fontWeight: 700, color: 'var(--primary)'}}>{val}</span> },
                       { key: 'date', label: 'Ngày Tháng', render: val => new Date(val).toLocaleString('vi-VN', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) },
                       { key: 'accountId', label: 'Vật Mang (Ví)', render: val => rootState.accounts.find(a => a.id === val)?.name || val },
                       { key: 'amount', label: 'Số Tiền', render: (_, t) => (
                           <span style={{ fontWeight: 800, color: t.type === 'Thu' ? 'var(--success)' : 'var(--danger)' }}>
                              {t.type === 'Thu' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')} đ
                           </span>
                       )}
                     ]}
                     onRestore={handlers?.handleBulkRestore ? (id) => handlers.handleBulkRestore([id]) : null}
                     onHardDelete={handlers?.handleBulkHardDelete ? (id) => handlers.handleBulkHardDelete([id]) : null}
                     onBulkRestore={handlers?.handleBulkRestore}
                     onBulkHardDelete={handlers?.handleBulkHardDelete}
                     emptyMessage="Không có chứng từ nào trong thùng rác."
                   />
                 </div>
               ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                   {selectedIds && selectedIds.length > 0 && (
                     <BulkActionBar 
                       selectedCount={selectedIds.length} 
                       onClearSelection={clearSelection} 
                       onDeleteSelected={handlers?.handleBulkDelete} 
                     />
                   )}
                   <SmartTable 
                     data={filteredTransactions}
                     topCustomLeft={
                        <button className="btn btn-ghost" style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--surface-color)', border: '1px dashed var(--danger)', height: '28px', padding: '0 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--danger)', position: 'relative' }} onClick={toggleTrashMode}>
                           <Trash2 size={12} color="var(--danger)"/> Thùng rác
                           {trashItems && trashItems.length > 0 && (
                             <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: 'white', fontSize: '9px', padding: '1px 5px', borderRadius: '10px', fontWeight: 800 }}>
                               {trashItems.length}
                             </span>
                           )}
                        </button>
                     }
                     selectable={true}
                     selectedIds={selectedIds}
                     onSelectToggle={toggleSelection}
                     onSelectAll={() => {
                        if (selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0) {
                            clearSelection();
                        } else {
                            listCtrl.setSelectedIds(filteredTransactions.map(t => t.id));
                        }
                     }}
                     columns={[
                     { key: 'voucherCode', label: 'Mã Phiếu', sortable: true, render: val => <span style={{fontWeight: 700, color: 'var(--primary)'}}>{val}</span> },
                     { key: 'date', label: 'Ngày Tháng', sortable: true, render: val => new Date(val).toLocaleString('vi-VN', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) },
                     { key: 'accountId', label: 'Vật Mang (Ví)', sortable: true, render: val => rootState.accounts.find(a => a.id === val)?.name || val },
                     { key: 'target', label: 'Đối Tượng', render: (_, t) => {
                         let targetName = t.type === 'Thu' ? (t.payer || '') : (t.collector || '');
                         if (!targetName && t.relatedId) {
                             if (t.relatedId.startsWith('PO-')) {
                                 const po = rootState.purchaseOrders?.find(p => p.id === t.relatedId);
                                 if (po) targetName = rootState.suppliers?.find(s => s.id === po.supplierId)?.name || po.seller;
                             } else if (t.relatedId.startsWith('ORD-') || t.relatedId.startsWith('POS-')) {
                                 const o = rootState.posOrders?.find(p => p.id === t.relatedId);
                                 if (o) targetName = o.customerName || 'Khách lẻ';
                             }
                         }
                         return targetName || '---';
                     }},
                     { key: 'note', label: 'Diễn Giải', render: (_, t) => (
                        <div style={{ display:'flex', flexDirection:'column' }}>
                           <span>{t.note || '---'}</span>
                           {t.relatedId && <small style={{ color:'var(--success)', opacity:0.8, fontWeight: 700 }}>Ref: {t.relatedId}</small>}
                        </div>
                     )},
                     { key: 'amount', label: 'Số Tiền', align: 'right', sum: true, sortable: true, render: (_, t) => (
                         <span style={{ fontWeight: 800, color: t.type === 'Thu' ? 'var(--success)' : 'var(--danger)' }}>
                            {t.type === 'Thu' ? '+' : '-'}{t.amount.toLocaleString('vi-VN')} đ
                         </span>
                     ), sumFunc: t => (t.type === 'Thu' ? Number(t.amount) : -Number(t.amount)) }
                   ]}
                   onEdit={handleEditTransaction}
                   onDelete={(t) => handlers?.handleDelete ? handlers.handleDelete(t) : setConfirmDelete(t.id)}
                   confirmBeforeDelete={false} 
                   onView={setViewVoucher}
                   extraRowActions={(t) => (
                      <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); setViewVoucher(t); }} style={{ padding: '6px' }} title="In Phiếu"><Printer size={16}/></button>
                   )}
                   emptyMessage="Hệ thống chưa ghi nhận dữ liệu dòng tiền nào."
                 />
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* MODALS */}
      {confirmDelete && (
         <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div className="glass-panel" style={{ width: '320px', padding: '24px', textAlign: 'center' }}>
               <AlertCircle size={40} color="var(--danger)" style={{ marginBottom: '16px' }} />
               <h3 style={{ margin: 0, marginBottom: '8px' }}>Xác nhận xóa?</h3>
               <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Hành động này sẽ xóa vĩnh viễn chứng từ và hoàn tác số dư tài khoản.</p>
               <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Hủy</button>
                  <button className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)' }} onClick={() => handleDeleteTransaction(confirmDelete)}>Xóa Ngay</button>
               </div>
            </div>
         </div>
      )}

      {viewOrder && (
         <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
            <div className="glass-panel" style={{ width: '600px', padding: '32px', maxHeight: '90vh', overflowY: 'auto' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>Chi tiết đơn: {viewOrder.id}</h3>
                  <button className="btn btn-ghost" onClick={() => setViewOrder(null)}>Đóng</button>
               </div>
               <div style={{ background: 'var(--surface-variant)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                  <p><strong>Ngày:</strong> {new Date(viewOrder.date).toLocaleString('vi-VN')}</p>
                  <p><strong>Đối tác:</strong> {viewOrder.orderType === 'PO' ? (rootState.suppliers?.find(s => s.id === viewOrder.supplierId)?.name || viewOrder.seller || 'N/A') : (viewOrder.customerName || 'Khách lẻ')}</p>
                  <p><strong>Trạng thái:</strong> {viewOrder.orderType === 'PO' ? viewOrder.status : viewOrder.paymentStatus}</p>
               </div>
               <table className="table">
                  <thead>
                     <tr>
                        <th>Sản phẩm / Nguyên liệu</th>
                        <th style={{ textAlign: 'center' }}>SL</th>
                        <th style={{ textAlign: 'right' }}>Giá</th>
                        <th style={{ textAlign: 'right' }}>Thành tiền</th>
                     </tr>
                  </thead>
                  <tbody>
                     {viewOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                           <td>
                              {viewOrder.orderType === 'PO' ? 
                                 rootState.ingredients.find(i => i.id === item.ingredientId)?.name : 
                                 item.product?.name}
                           </td>
                           <td style={{ textAlign: 'center' }}>{item.quantity || item.baseQty}</td>
                           <td style={{ textAlign: 'right' }}>{(item.price || item.unitCost).toLocaleString()} đ</td>
                           <td style={{ textAlign: 'right' }}>{(item.itemTotal || (item.quantity * item.price)).toLocaleString()} đ</td>
                        </tr>
                     ))}
                  </tbody>
                  <tfoot>
                     <tr>
                        <td colSpan="3" style={{ textAlign: 'right', padding: '16px', fontWeight: 800 }}>TỔNG CỘNG:</td>
                        <td style={{ textAlign: 'right', padding: '16px', fontWeight: 800, color: 'var(--primary)', fontSize: '1.2rem' }}>{viewOrder.totalAmount.toLocaleString()} đ</td>
                     </tr>
                  </tfoot>
               </table>
            </div>
         </div>
      )}

      {showVoucherModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <form style={{ width: '600px', padding: '32px', background: '#F9FAFB', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' }} onSubmit={handleVoucherSubmit}>
             <h3 style={{ margin: 0, marginBottom: '24px', display:'flex', alignItems:'center', gap:'12px', fontSize: '20px', color: '#111827', fontWeight: 800 }}>
                <FileText color="var(--primary)"/> Lập phiếu thu/chi
             </h3>
             <div style={{ display:'grid', gap:'20px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                   <div>
                      <label style={LabelStyle}>Loại chứng từ:</label>
                      <select className="form-input" value={vForm.type} onChange={e => setVForm({...vForm, type: e.target.value, categoryId: rootState.financeCategories.find(c => c.type === (e.target.value === 'Thu' ? 'income' : 'expense'))?.id || 'FC9'})}>
                        <option value="Thu">Phiếu thu</option>
                        <option value="Chi">Phiếu chi</option>
                      </select>
                   </div>
                   <div>
                      <label style={LabelStyle}>Ngày hạch toán:</label>
                      <input type="date" className="form-input" value={vForm.date} onChange={e => setVForm({...vForm, date: e.target.value})} />
                   </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                   <div>
                      <label style={LabelStyle}>Tài khoản (Khoản/Ví):</label>
                      <select className="form-input" value={vForm.accountId} onChange={e => setVForm({...vForm, accountId: e.target.value})}>
                        {rootState.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}{acc.accountNumber ? ` - ${acc.accountNumber}` : ''}</option>)}
                      </select>
                   </div>
                   <div>
                      <label style={LabelStyle}>Danh mục:</label>
                      <select className="form-input" value={vForm.categoryId} onChange={e => setVForm({...vForm, categoryId: e.target.value})}>
                        {rootState.financeCategories.filter(c => c.type === (vForm.type === 'Thu' ? 'income' : 'expense')).map(cat => (
                           <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                   </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                   <div>
                      <label style={LabelStyle}>{vForm.type === 'Thu' ? 'Người nộp tiền:' : 'Người nhận tiền:'}</label>
                      <input required type="text" className="form-input" value={vForm.type === 'Thu' ? vForm.payer : vForm.collector} onChange={e => setVForm({...vForm, [vForm.type === 'Thu' ? 'payer' : 'collector']: e.target.value})} placeholder="Họ tên đối tác..." />
                   </div>
                   <div>
                      <label style={LabelStyle}>Mã tham chiếu (Optional):</label>
                      <input type="text" className="form-input" value={vForm.relatedId} onChange={e => setVForm({...vForm, relatedId: e.target.value})} placeholder="VD: DH-001 hoặc NK-002" />
                   </div>
                </div>

                <div>
                   <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Số tiền giao dịch (VNĐ) <span style={{color:'red'}}>*</span></label>
                   <CurrencyInput required style={{ fontSize: '18px', fontWeight: 800, color: vForm.type === 'Thu' ? '#16A34A' : '#DC2626', borderColor: vForm.type === 'Thu' ? '#BBF7D0' : '#FECACA'}} value={vForm.amount} onChange={val => setVForm({...vForm, amount: val})} placeholder="0" />
                </div>
                <div>
                   <label style={LabelStyle}>Diễn giải:</label>
                   <textarea className="form-input" style={{ minHeight:'80px', resize: 'vertical'}} value={vForm.note} onChange={e => setVForm({...vForm, note: e.target.value})} placeholder="Lý do thu/chi..." />
                </div>
             </div>
             <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
               <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px', fontWeight: 600 }}>Lưu thông tin</button>
               <button type="button" className="btn btn-ghost" style={{ flex: 1, padding: '12px', fontWeight: 600 }} onClick={() => setShowVoucherModal(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {showAdjustModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
          <form style={{ width: '400px', padding: '32px', background: '#F9FAFB', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' }} onSubmit={handleAdjustSubmit}>
             <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '20px', color: '#111827', fontWeight: 800 }}>Điều chỉnh số dư</h3>
             <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '24px' }}>
                Cập nhật số dư thực tế cho tài khoản/ví: <strong style={{color: '#111827'}}>{showAdjustModal.name}</strong>
             </p>
             <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                   <label style={LabelStyle}>Số dư trên hệ thống:</label>
                   <p style={{ margin: '4px 0', fontSize: '18px', fontWeight: 800, color: 'var(--text-secondary)' }}>{showAdjustModal.balance.toLocaleString()} đ</p>
                </div>
                <div>
                   <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'8px', display:'block', fontWeight: 600 }}>Số dư Tồn Quỹ THỰC TẾ đếm được (VNĐ):</label>
                   <CurrencyInput autoFocus required style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', borderColor: 'var(--primary)' }} value={adjustForm.actual} onChange={val => setAdjustForm({...adjustForm, actual: val})} placeholder={showAdjustModal.balance} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#FEF3C7', borderRadius: '8px', color: '#D97706', fontSize: '13px', fontWeight: 600 }}>
                   <AlertCircle size={18}/> 
                   <span>Phiếu cân bằng sẽ được cộng/trừ vào sổ quỹ.</span>
                </div>
             </div>
             <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
               <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px', fontWeight: 600 }}>Cập nhật chênh lệch</button>
               <button type="button" className="btn btn-ghost" style={{ flex: 1, padding: '12px', fontWeight: 600 }} onClick={() => setShowAdjustModal(null)}>Hủy</button>
             </div>
          </form>
        </div>
      )}

      {viewVoucher && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
           <div className="glass-panel" style={{ width: '500px', padding: '40px', background: 'white', color: 'black' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid black', paddingBottom: '20px', marginBottom: '20px' }}>
                 <h2 style={{ margin: 0, textTransform: 'uppercase' }}>{viewVoucher.type === 'Thu' ? 'Phiếu Thu' : 'Phiếu Chi'}</h2>
                 <p style={{ margin: '4px 0', fontWeight: 600 }}>Số: {viewVoucher.voucherCode}</p>
                 <p style={{ margin: 0, fontSize: '0.8rem' }}>Ngày lập: {new Date(viewVoucher.date).toLocaleString('vi-VN')}</p>
              </div>
              <div style={{ display: 'grid', gap: '12px', fontSize: '1rem' }}>
                 <p><strong>Người {viewVoucher.type === 'Thu' ? 'nộp' : 'nhận'}:</strong> {(()=>{
                     let targetName = viewVoucher.type === 'Thu' ? (viewVoucher.payer || '') : (viewVoucher.collector || '');
                     if (!targetName && viewVoucher.relatedId) {
                         if (viewVoucher.relatedId.startsWith('PO-')) {
                             const po = rootState.purchaseOrders?.find(p => p.id === viewVoucher.relatedId);
                             if (po) targetName = rootState.suppliers?.find(s => s.id === po.supplierId)?.name || po.seller;
                         } else if (viewVoucher.relatedId.startsWith('ORD-') || viewVoucher.relatedId.startsWith('POS-')) {
                             const o = rootState.posOrders?.find(p => p.id === viewVoucher.relatedId);
                             if (o) targetName = o.customerName || 'Khách lẻ';
                         }
                     }
                     return targetName || '...........................................';
                 })()}</p>
                 <p><strong>Nội dung:</strong> {viewVoucher.note}</p>
                 <p><strong>Số tiền:</strong> <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{viewVoucher.amount.toLocaleString()} đ</span></p>
                 <p><strong>Bằng chữ:</strong> {numberToWords(viewVoucher.amount)}</p>
                 <p><strong>Tài khoản:</strong> {rootState.accounts.find(a => a.id === viewVoucher.accountId)?.name}</p>
                 {viewVoucher.relatedId && <p><strong>Kèm theo:</strong> Chứng từ gốc {viewVoucher.relatedId}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: '40px', textAlign: 'center' }}>
                 <div>
                    <p style={{ fontWeight: 700, margin: 0 }}>Người lập</p>
                    <p style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>(Ký, họ tên)</p>
                 </div>
                 <div>
                    <p style={{ fontWeight: 700, margin: 0 }}>{viewVoucher.type === 'Thu' ? 'Người nộp' : 'Người nhận'}</p>
                    <p style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>(Ký, họ tên)</p>
                 </div>
              </div>
              <div style={{ marginTop: '50px', display: 'flex', gap: '12px' }}>
                 <button className="btn btn-primary" style={{ flex: 1, filter: 'none', background: 'black' }} onClick={() => window.print()}><Printer size={18}/> In Phiếu</button>
                 <button className="btn btn-ghost" style={{ flex: 1, border: '1px solid #ccc', color: 'black' }} onClick={() => setViewVoucher(null)}>Đóng</button>
              </div>
           </div>
        </div>
      )}

      {showCatModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '400px', padding: '32px', background: '#F9FAFB', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' }}>
             <h3 style={{ margin: 0, marginBottom: '24px', fontSize: '18px', color: '#111827', fontWeight: 800 }}>Thêm Danh Mục Tài Chính</h3>
             <form style={{ display:'grid', gap:'16px' }} onSubmit={(e) => { e.preventDefault(); dispatch({type:'ADD_FINANCE_CATEGORY', payload:catForm}); setShowCatModal(false); }}>
                <div>
                   <label style={LabelStyle}>Tên danh mục:</label>
                   <input style={InputStyle} placeholder="VD: Tiền Marketing..." value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} required />
                </div>
                <div>
                   <label style={LabelStyle}>Loại (Thu/Chi):</label>
                   <select style={InputStyle} value={catForm.type} onChange={e => setCatForm({...catForm, type: e.target.value})}>
                     <option value="income">Dòng THU (Income)</option>
                     <option value="expense">Dòng CHI (Expense)</option>
                   </select>
                </div>
                <div style={{ display:'flex', gap:'12px', marginTop:'24px' }}>
                   <button type="button" className="btn btn-ghost" style={{ flex:1, padding: '12px', background: '#E5E7EB', color: '#111827', borderRadius: '8px', fontWeight: 700 }} onClick={() => setShowCatModal(false)}>Hủy</button>
                   <button type="submit" className="btn btn-primary" style={{ flex:1, padding: '12px', borderRadius: '8px', fontWeight: 800 }}>Lưu Danh Mục</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }}>
          <form style={{ width: '500px', padding: '32px', background: '#F9FAFB', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB' }} onSubmit={(e) => { e.preventDefault(); dispatch({type:'TRANSFER_FUNDS', payload:transferForm}); setShowTransferModal(false); }}>
             <h3 style={{ margin: 0, marginBottom: '24px', fontSize: '20px', color: '#111827', fontWeight: 800 }}>Luân Chuyển Dòng Tiền</h3>
             <div style={{ display:'grid', gap:'20px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                   <div>
                      <label style={LabelStyle}>Tài khoản Nguồn (Trừ):</label>
                      <select style={InputStyle} value={transferForm.fromId} onChange={e => setTransferForm({...transferForm, fromId: e.target.value})}>
                        {rootState.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}{acc.accountNumber ? ` - ${acc.accountNumber}` : ''}</option>)}
                      </select>
                   </div>
                   <div>
                      <label style={LabelStyle}>Tài khoản Đích (Cộng):</label>
                      <select style={InputStyle} value={transferForm.toId} onChange={e => setTransferForm({...transferForm, toId: e.target.value})}>
                        {rootState.accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}{acc.accountNumber ? ` - ${acc.accountNumber}` : ''}</option>)}
                      </select>
                   </div>
                </div>
                <div style={FormGroup}>
                   <label>Số tiền chuyển (VNĐ) <span style={{color:'var(--danger)'}}>*</span></label>
                   <CurrencyInput required style={{...InputStyle, fontSize: '18px', fontWeight: 800, color: 'var(--primary)'}} value={transferForm.amount} onChange={val => setTransferForm({...transferForm, amount: val})} placeholder="0" />
                 </div>
                 <div style={FormGroup}>
                   <label>Phí chuyển khoản (VNĐ - Trừ vào quỹ nguồn)</label>
                   <CurrencyInput style={InputStyle} value={transferForm.fee} onChange={val => setTransferForm({...transferForm, fee: val})} placeholder="0" />
                 </div>
                <div>
                   <label style={LabelStyle}>Ghi chú:</label>
                   <textarea style={{...InputStyle, minHeight:'80px', resize: 'vertical'}} value={transferForm.note} onChange={e => setTransferForm({...transferForm, note: e.target.value})} placeholder="Lý do chuyển tiền..." />
                </div>
             </div>
             <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
               <button type="button" className="btn btn-ghost" style={{ flex: 1, padding: '14px', background: '#E5E7EB', color: '#374151', borderRadius: '8px', fontWeight: 700 }} onClick={() => setShowTransferModal(false)}>Hủy Tác Vụ</button>
               <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '14px', borderRadius: '8px', fontWeight: 800, fontSize: '15px' }}>Xác Nhận Chuyển</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
