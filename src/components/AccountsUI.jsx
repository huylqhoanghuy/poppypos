import React, { useState, useEffect } from 'react';
import { CreditCard, Edit, Trash2, CheckSquare, Square, RefreshCcw, Landmark, Wallet, FileText, X } from 'lucide-react';
import CurrencyInput from './CurrencyInput';
import SmartTable from './SmartTable';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return <div style={{padding: '20px', color: 'red'}}>Error: {this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

export default function AccountsUI({ 
  accounts, 
  onSave, 
  onDelete,
  onRefresh,
  isRefreshing,
  getTransactions
}) {
  const [form, setForm] = useState(null);
  const [statementAccount, setStatementAccount] = useState(null);
  const [statementTxs, setStatementTxs] = useState([]);
  const [statementLoading, setStatementLoading] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setStatementAccount(null);
        setForm(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const openNew = () => {
    setForm({ id: '', name: '', type: 'bank', bankName: '', accountNumber: '', accountHolder: '', balance: 0, description: '' });
  };

  const openEdit = (acc) => {
    setForm(acc);
  };

  const saveForm = (e) => {
    e.preventDefault();
    onSave && onSave({ ...form, balance: Number(form.balance) || 0 });
    setForm(null);
  };

  const handleDelete = (acc) => {
    if (window.confirm(`Bạn có chắc muốn đóng thẻ ${acc.name}?`)) {
      onDelete && onDelete(acc.id);
    }
  };

  const openStatement = async (acc) => {
    setStatementAccount(acc);
    setStatementLoading(true);
    if (getTransactions) {
      const txs = await getTransactions(acc.id);
      setStatementTxs(txs);
    }
    setStatementLoading(false);
  };

  const formatVND = (val) => {
    return Math.round(Number(val) || 0).toLocaleString('vi-VN') + ' đ';
  };

  // Render Danh Sách Thẻ
  const renderList = () => {
    const accColumns = [
       {
         key: 'name',
         label: 'Tên Gợi Nhớ',
         sortable: true,
         render: (val, acc) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div style={{ background: acc.type === 'cash' ? '#F0FDF4' : '#E0F2FE', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: acc.type === 'cash' ? '#166534' : '#0369A1' }}>
                 {acc.type === 'cash' ? <Wallet size={20} /> : <Landmark size={20} />}
               </div>
               <div>
                 <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{acc.name}</h4>
                 <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{acc.type === 'cash' ? 'Quỹ Tiền Mặt' : (acc.bankName || 'Ngân hàng')}</p>
               </div>
            </div>
         )
       },
       {
         key: 'info',
         label: 'Thông Tin Tín Dụng',
         render: (_, acc) => acc.type === 'bank' ? (
             <div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Chủ TK: <strong style={{ color: 'var(--text-primary)' }}>{acc.accountHolder || '-'}</strong></div>
                <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 700, marginTop: '2px' }}>{acc.accountNumber || 'Chưa cập nhật'}</div>
             </div>
         ) : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Thu chi tiền mặt</span>
       },
       {
         key: 'balance',
         label: 'Cân Đối Số Dư',
         sortable: true,
         sum: true,
         align: 'right',
         render: (val, acc) => (
             <span style={{ fontSize: '18px', color: (acc.balance || 0) < 0 ? 'var(--danger)' : 'var(--primary)', fontWeight: 800 }}>
                {formatVND(acc.balance)}
             </span>
         )
       }
    ];

    return (
      <SmartTable 
         data={accounts}
         columns={accColumns}
         tableId="accounts_manager"
         defaultView="card"
         renderCardItem={(acc) => (
             <div 
               className="glass-panel hover-glow" 
               style={{ padding: '24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '16px', background: acc.type === 'cash' ? 'linear-gradient(135deg, #F0FDF4, #DCFCE7)' : 'linear-gradient(135deg, #F0F9FF, #E0F2FE)', border: '1px solid var(--surface-border)' }}
             >
                {/* Header Thẻ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '10px', background: '#FFFFFF', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', color: acc.type === 'cash' ? '#166534' : '#0369A1' }}>
                         {acc.type === 'cash' ? <Wallet size={24} /> : <Landmark size={24} />}
                      </div>
                      <div>
                         <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{acc.name}</h4>
                         <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{acc.type === 'cash' ? 'Quỹ Tiền Mặt' : (acc.bankName || 'Ngân hàng')}</p>
                      </div>
                   </div>
                   
                   <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-ghost" title="Sao kê" onClick={() => openStatement(acc)} style={{ padding: '6px', background: '#FFFFFF' }}><FileText size={16} color="var(--primary)"/></button>
                      <button className="btn btn-ghost" title="Sửa thẻ" onClick={() => openEdit(acc)} style={{ padding: '6px', background: '#FFFFFF' }}><Edit size={16} color="var(--primary)"/></button>
                      <button className="btn btn-ghost" title="Đóng thẻ" onClick={() => handleDelete(acc)} style={{ padding: '6px', background: '#FFFFFF' }}><Trash2 size={16} color="var(--danger)"/></button>
                   </div>
                </div>

                {/* Body Thẻ - Thông tin NH */}
                <div style={{ flex: 1 }}>
                   {acc.type === 'bank' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                         <div style={{ fontSize: '14px', letterSpacing: '2px', fontWeight: 700, color: 'var(--text-primary)' }}>{acc.accountNumber || '**** **** ****'}</div>
                         <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{acc.accountHolder || 'CHỦ TÀI KHOẢN'}</div>
                      </div>
                   ) : (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '10px' }}>* Tiền mặt / Thu ngân tại quầy</div>
                   )}
                </div>

                {/* Footer Thẻ - Số Dư */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                   <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Số dư khả dụng</span>
                   <span style={{ fontSize: '22px', fontWeight: 900, color: acc.balance < 0 ? 'var(--danger)' : 'var(--primary)' }}>{formatVND(acc.balance)}</span>
                </div>
             </div>
         )}
         onEdit={openEdit}
         onDelete={handleDelete}
         confirmBeforeDelete={true}
         extraRowActions={(acc) => (
            <button className="btn btn-ghost" title="Sao kê giao dịch" onClick={(e) => { e.stopPropagation(); openStatement(acc); }} style={{ padding: '6px' }}>
              <FileText size={16} color="var(--primary)" />
            </button>
         )}
         emptyMessage="Chưa có ví tài khoản nào được mở."
      />
    );
  };

  const renderForm = () => (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '20px' }} onClick={() => setForm(null)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--bg-color)', padding: '24px', borderRadius: '12px', border: '1px solid var(--surface-border)', width: '100%', maxWidth: '600px', boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{form.id ? 'Sửa Thẻ Tài Khoản' : 'Mở Thẻ Mới'}</h3>
          <button className="btn btn-ghost" onClick={() => setForm(null)} style={{ padding: '4px' }}><X size={20}/></button>
        </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Tên ví/tài khoản nhắc nhớ:</label>
          <input required className="form-input" placeholder="VD: Thẻ Techcombank Vợ, Két Tiền Quầy" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        </div>
        <div>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Tài sản lưu trữ (Tính chất):</label>
          <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
             <option value="bank">Tài Khoản Ngân Hàng/Ví Điện Tử</option>
             <option value="cash">Két Giao Dịch Tiền Mặt</option>
          </select>
        </div>
      </div>

      {form.type === 'bank' && (
         <div style={{ padding: '20px', background: 'var(--surface-variant)', borderRadius: '12px', border: '1px solid var(--surface-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
               <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}><Landmark size={18} /> Kết Nối Chuyển Khoản</h4>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Ngân hàng/Ví:</label>
              <input className="form-input" placeholder="VD: Vietcombank" value={form.bankName} onChange={e => setForm({...form, bankName: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Tên Chủ TK:</label>
              <input className="form-input" placeholder="VD: NGUYEN VAN A" style={{ textTransform: 'uppercase' }} value={form.accountHolder} onChange={e => setForm({...form, accountHolder: e.target.value.toUpperCase()})} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Số Tài Khoản:</label>
              <input className="form-input" placeholder="VD: 1903939..." value={form.accountNumber} onChange={e => setForm({...form, accountNumber: e.target.value})} />
            </div>
         </div>
      )}

      <div>
        <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Số dư kế toán khai báo đầu kỳ (VNĐ):</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <CurrencyInput className="form-input" style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)', paddingLeft: '40px', width: '100%', boxSizing: 'border-box' }} placeholder="VD: 5.000.000" value={form.balance} onChange={val => setForm({...form, balance: val})} />
                <span style={{ position: 'absolute', left: '16px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>₫</span>
            </div>
            {form.balance > 0 && <span style={{ color: 'var(--success)', fontWeight: 600 }}>Cớ Số Dư</span>}
        </div>
      </div>
      
      <div>
         <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Diễn giải chú thích:</label>
         <textarea className="form-input" rows="2" placeholder="Tùy chọn ghi chú" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="btn btn-ghost" onClick={() => setForm(null)}>Hủy bỏ</button>
        <button className="btn btn-primary" onClick={saveForm} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
           <RefreshCcw size={18} /> Lưu Tài Khoản
        </button>
      </div>
    </div>
    </div>
  );

  const renderStatementModal = () => {
    if (!statementAccount) return null;

    const statementColumns = [
      {
        key: 'date',
        label: 'THỜI GIAN',
        sortable: true,
        render: (val, t) => <span style={{ fontSize: '14px', whiteSpace: 'nowrap' }}>{new Date(t.date).toLocaleString('vi-VN')}</span>
      },
      {
        key: 'desc',
        label: 'DIỄN GIẢI GIAO DỊCH',
        render: (_, t) => (
           <div>
             <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '4px' }}>{t.categoryId ? (t.categoryName || 'Danh mục KH') : 'Giao Dịch'}</div>
             <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t.note || '-'}</div>
           </div>
        )
      },
      {
        key: 'amount',
        label: 'BIẾN ĐỘNG (+/-)',
        align: 'right',
        render: (val, t) => {
           const amount = Number(t.amount) || 0;
           return (
              <span style={{ fontWeight: 800, fontSize: '15px', color: t.type === 'Thu' ? 'var(--success)' : 'var(--danger)' }}>
                 {t.type === 'Thu' ? '+' : '-'}{formatVND(amount)}
              </span>
           )
        }
      }
    ];

    return (
      <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-color)', zIndex: 10 }}>
            <div>
               <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Sao Kê Biến Động Số Dư</h3>
               <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>Ví: <strong style={{ color: 'var(--primary)' }}>{statementAccount.name}</strong></p>
            </div>
            <button className="btn btn-ghost" onClick={() => setStatementAccount(null)} style={{ padding: '8px' }}><X size={20}/></button>
          </div>
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
             {statementLoading ? (
                 <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Đang truy xuất sao kê...</div>
             ) : (
                 <ErrorBoundary>
                    <SmartTable 
                      data={statementTxs}
                      columns={statementColumns}
                      tableMinWidth="100%"
                      emptyMessage="Chưa có giao dịch lịch sử nào trong tài khoản này."
                    />
                 </ErrorBoundary>
             )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
         <div>
            <h2 style={{ margin: 0 }}>Quản Lý Két / Số Dư</h2>
         </div>
         <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary table-feature-btn" onClick={openNew}>+ Mở thẻ mới</button>
            <button className="btn btn-ghost table-feature-btn" onClick={onRefresh} disabled={isRefreshing}>
               <RefreshCcw size={18} className={isRefreshing ? 'spin-anim' : ''} /> Load lại
            </button>
         </div>
      </div>

      {renderList()}
      {form && renderForm()}
      {renderStatementModal()}
    </div>
  );
}
