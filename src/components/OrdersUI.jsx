import React from 'react';
import { ClipboardList, Trash2, CheckCircle, Clock, XCircle, Eye, UploadCloud, CheckCircle2, FileText, X, CheckSquare, Square, AlertTriangle, Edit2, Plus, Minus, RefreshCw } from 'lucide-react';
import ModuleLayout from './ModuleLayout';
import ImportData from '../pages/ImportData';
import { useData } from '../context/DataContext';
import { useImportManager } from '../hooks/useImportManager';

const OrdersUI = ({ manager }) => {
  const {
    state,
    listState,
    _expandedOrderId, setExpandedOrderId,
    filterStatus, setFilterStatus,
    filterChannel, setFilterChannel,
    formData, setFormData,
    handleEdit, handleSave,
    _sortConfig, _handleSort,
    displayOrders,
    updateStatus, toggleExpand, selectedOrder,
    _selectedIds, _toggleSelection,
  } = manager;

  const { dispatch, syncToCloud } = useData();
  const showToast = (message, type = 'success') => {
      dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  };



  const getStatusBadge = (status) => {
    switch (status) {
      case 'Success': return <span style={{ padding: '6px 12px', borderRadius: '20px', background: '#F1F5F9', color: '#111827', fontSize: '12px', fontWeight: 800, border: '1px solid #E2E8F0' }}>THÀNH CÔNG</span>;
      case 'Pending': return <span style={{ padding: '6px 12px', borderRadius: '20px', background: '#FFEDD5', color: '#C2410C', fontSize: '12px', fontWeight: 800, border: '1px solid #FED7AA' }}>CHỜ SHIP</span>;
      case 'Cancelled': return <span style={{ padding: '6px 12px', borderRadius: '20px', background: '#FEE2E2', color: '#991B1B', fontSize: '12px', fontWeight: 800, border: '1px solid #FECACA' }}>ĐÃ HỦY</span>;
      default: return <span style={{ padding: '6px 12px', borderRadius: '20px', background: 'var(--surface-variant)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 800, border: '1px solid var(--surface-border)' }}>{status}</span>;
    }
  };

  const extraFiltersBlock = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <select className="table-feature-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">-- Tất cả Trạng thái --</option>
          <option value="Pending">Chờ Ship</option>
          <option value="Success">Thành Công</option>
          <option value="Cancelled">Đã Hủy</option>
        </select>
        <select className="table-feature-select" value={filterChannel} onChange={e => setFilterChannel(e.target.value)}>
          <option value="all">-- Tất cả Kênh --</option>
          {state.salesChannels?.map(ch => <option key={ch.id} value={ch.name}>{ch.name}</option>)}
        </select>
    </div>
  );

  const [showImportModal, setShowImportModal] = React.useState(false);

  const headerActionsBlock = (
    <button className="btn btn-primary" onClick={() => setShowImportModal(true)}>
      <UploadCloud size={18} /> Đồng Bộ Đơn Sàn (Import)
    </button>
  );

  const trashColumns = [
    { key: 'id', label: 'Khách hàng', render: o => <div><strong>{o.id}</strong><br/><span style={{fontSize:'12px',color:'var(--text-secondary)'}}>{o.customerName || 'Khách vãng lai'}</span></div> },
    { key: 'channelName', label: 'Kênh Bán', render: o => o.channelName || 'Trực tiếp' },
    { key: 'netAmount', label: 'Thực thu', render: o => `${(o.netAmount + (Number(o.extraFee) || 0)).toLocaleString('vi-VN')} đ` }
  ];

  // Khai báo cột cho SmartTable
  const orderColumns = [
    { key: 'date', label: 'Thời Gian', sortable: true, render: (val) => new Date(val).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) },
    { key: 'orderCode', label: 'Mã Đơn', sortable: true, render: (val, o) => <span style={{fontWeight:700, color:'var(--text-primary)'}}>{val || o.id}</span> },
    { key: 'customerName', label: 'Khách Hàng', sortable: true, render: (val) => val || 'Khách vãng lai' },
    { key: 'liveChannelName', label: 'Kênh Bán', sortable: true, render: (val) => <span style={{ padding: '4px 8px', background: 'var(--surface-variant)', border: '1px solid var(--surface-border)', borderRadius: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>{val}</span> },
    { key: 'totalAmount', label: 'Tổng (Gross)', align: 'right', sortable: true, sum: true, render: (val) => (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.3}}>
           <span>{(val || 0).toLocaleString('vi-VN')} đ</span>
           {val > 0 && <span style={{fontSize: '11px', color: 'var(--text-secondary)'}}>(100%)</span>}
        </div>
    ) },
    { key: 'discountAmount', label: 'Tổng Phí Sàn', align: 'right', sumFunc: (o) => { const fee = o.discountAmount != null ? o.discountAmount : (o.totalAmount - o.netAmount); return Math.max(0, fee); }, sumSuffix: 'đ', render: (val, o) => {
        const fee = Math.max(0, o.discountAmount != null ? o.discountAmount : (o.totalAmount - o.netAmount));
        const percent = fee > 0 && o.totalAmount ? Math.round((fee / o.totalAmount) * 100) : 0;
        return (
           <div style={{color: '#EA580C', fontWeight:600, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.3}}>
              <span>-{fee.toLocaleString('vi-VN')} đ</span>
              {percent > 0 && <span style={{fontSize: '11px', opacity: 0.85}}>({percent}%)</span>}
           </div>
        );
    } },
    { key: 'netAmount', label: 'Thực Thu (Net)', align: 'right', sortable: true, sum: true, render: (val, o) => {
        const net = (val || 0) + (Number(o.extraFee) || 0);
        const percent = net && o.totalAmount ? Math.round((net / o.totalAmount) * 100) : 0;
        return (
            <div style={{color:'var(--success)', fontWeight:800, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.3}}>
                <span>{net.toLocaleString('vi-VN')} đ</span>
                {percent > 0 && <span style={{fontSize: '11px', opacity: 0.85}}>({percent}%)</span>}
            </div>
        );
    } },
    { key: 'items', label: 'Chi Tiết Món', render: (val, order) => (
       <div style={{ maxWidth: '250px' }}>
          {order.items?.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '4px', marginBottom: '4px', color: order.isFuzzyRecognized ? '#92400E' : 'var(--text-primary)', lineHeight: 1.4 }}>
               <span style={{ fontWeight: 800, color: 'var(--primary)', flexShrink: 0 }}>x{item.quantity}</span> 
               <span style={{ fontWeight: 500 }}>{item.product?.name}</span>
            </div>
          ))}
          {order.isFuzzyRecognized && <span style={{ fontSize: '10px', background: '#FEF3C7', color: '#B45309', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px', fontWeight: 700 }}>Nội suy giá</span>}
          {(!order.items || order.items.length === 0) && <span style={{ color: 'var(--danger)', fontWeight: 600 }}>Không có món</span>}
       </div>
    )},
    { key: 'status', label: 'Trạng Thái', align: 'center', sortable: true, render: (val) => getStatusBadge(val) }
  ];

  const extraRowActions = (order) => (
    <>
      <button className="btn btn-ghost" title="Thành công" style={{ color: '#111827', padding: '6px' }} onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'Success'); }}><CheckCircle size={16}/></button>
      <button className="btn btn-ghost" title="Chờ ship" style={{ color: '#EA580C', padding: '6px' }} onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'Pending'); }}><Clock size={16}/></button>
      <button className="btn btn-ghost" title="Hủy đơn" style={{ color: '#DC2626', padding: '6px' }} onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'Cancelled'); }}><XCircle size={16}/></button>
      <div style={{ width: '1px', background: 'var(--surface-border)', margin: '0 4px' }} />
    </>
  );

  const calculateTotals = (currentFormData, targetChannelId = null) => {
      const items = currentFormData.items || [];
      const totalAmount = items.reduce((sum, it) => {
         const price = it.product?.price ?? it.price ?? 0;
         const qty = it.quantity ?? 1;
         return sum + (price * qty);
      }, 0);
      
      const channelId = targetChannelId !== null ? targetChannelId : currentFormData.channelId;
      const channel = state.salesChannels?.find(c => c.id === channelId || (c.name && c.name === currentFormData.channelName));
      const discountRate = channel?.commission ?? channel?.discountRate ?? 0;
      const discountAmount = totalAmount * (discountRate / 100);
      const extraFee = currentFormData.extraFee || 0;
      const netAmount = totalAmount - discountAmount + extraFee;

      return { totalAmount, discountAmount, netAmount, channelId: channel?.id || '', channelName: channel?.name || 'Trực tiếp' };
  };

  const updateCartItem = (index, delta) => {
      const newItems = [...(formData.items || [])];
      newItems[index].quantity += delta;
      if (newItems[index].quantity <= 0) newItems.splice(index, 1);
      const updatedForm = { ...formData, items: newItems };
      setFormData({ ...updatedForm, ...calculateTotals(updatedForm) });
  };

  const addProductToCart = (e) => {
      const productId = e.target.value;
      if (!productId) return;
      const product = state.products?.find(p => p.id === productId);
      if (!product) return;
      
      const newItems = [...(formData.items || [])];
      const existingIdx = newItems.findIndex(it => (it.product?.id || it.id) === productId);
      if (existingIdx >= 0) {
          newItems[existingIdx].quantity += 1;
      } else {
          newItems.push({ product, quantity: 1, price: product.price });
      }
      const updatedForm = { ...formData, items: newItems };
      setFormData({ ...updatedForm, ...calculateTotals(updatedForm) });
      e.target.value = ""; // Reset selector
  };

  const renderForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Sửa Thông Tin Đơn Hàng</h3>
      
      <div className="form-group">
        <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Mã Đơn / Khách Hàng</label>
        <div style={{ display: 'flex', gap: '8px' }}>
           <input className="input-field" disabled value={formData.orderCode || formData.id || ''} style={{ flex: 1, opacity: 0.6 }}/>
           <input className="input-field" value={formData.customerName || ''} onChange={e => setFormData({...formData, customerName: e.target.value})} placeholder="Tên khách hàng" style={{ flex: 2 }}/>
        </div>
      </div>
      
      <div className="form-group">
        <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>Thời Gian & Kênh Bán</label>
        <div style={{ display: 'flex', gap: '8px' }}>
           <input className="input-field" type="datetime-local" value={formData.date ? formData.date.slice(0, 16) : ''} onChange={e => setFormData({...formData, date: new Date(e.target.value).toISOString()})} style={{ flex: 1 }}/>
           <select className="input-field" value={formData.channelId || formData.channelName || ''} onChange={e => {
              const totals = calculateTotals(formData, e.target.value);
              setFormData({...formData, ...totals});
           }} style={{ flex: 1 }}>
              <option value="" disabled>-- Chọn kênh bán --</option>
              {state.salesChannels?.map(ch => <option key={ch.id} value={ch.id}>{ch.name} (Chiết khấu {ch.commission ?? ch.discountRate ?? 0}%)</option>)}
           </select>
        </div>
      </div>

      <div className="form-group">
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
             <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', margin: 0 }}>Thực Đơn (Danh Sách Món)</label>
             <select className="input-field" onChange={addProductToCart} defaultValue="" style={{ padding: '6px 10px', fontSize: '13px', width: 'auto', background: '#f8fafc', boxShadow: 'none' }}>
                <option value="" disabled>+ Lựa thêm món vào đơn</option>
                {state.products?.filter(p => p.status !== 'draft').map(p => (
                   <option key={p.id} value={p.id}>{p.name} - {p.price.toLocaleString('vi-VN')}đ</option>
                ))}
             </select>
         </div>
         
         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--surface-color)', padding: '12px', borderRadius: '8px', border: '1px solid var(--surface-border)', maxHeight: '250px', overflowY: 'auto' }}>
            {(!formData.items || formData.items.length === 0) ? (
               <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>Đơn hàng trống</div>
            ) : (
               formData.items.map((it, idx) => {
                  const pName = it.product?.name || it.name || 'Món không xác định';
                  const pPrice = it.product?.price ?? it.price ?? 0;
                  return (
                     <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px dashed #e2e8f0' }}>
                        <div style={{ flex: 1 }}>
                           <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{pName}</div>
                           <div style={{ fontSize: '12px', color: '#64748b' }}>{pPrice.toLocaleString('vi-VN')}đ</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '6px' }}>
                              <button className="btn btn-ghost" style={{ padding: '4px', minWidth: '24px' }} onClick={() => updateCartItem(idx, -1)}><Minus size={14}/></button>
                              <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{it.quantity}</span>
                              <button className="btn btn-ghost" style={{ padding: '4px', minWidth: '24px' }} onClick={() => updateCartItem(idx, 1)}><Plus size={14}/></button>
                           </div>
                           <span style={{ fontSize: '14px', fontWeight: 800, color: '#ea580c', minWidth: '80px', textAlign: 'right' }}>
                              {(pPrice * (it.quantity || 1)).toLocaleString('vi-VN')} đ
                           </span>
                        </div>
                     </div>
                  );
               })
            )}
         </div>
      </div>
      
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', color: '#64748b' }}>
            <span>Tổng tiền món:</span>
            <span>{(formData.totalAmount || 0).toLocaleString('vi-VN')} đ</span>
         </div>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', marginBottom: '12px', color: '#ef4444' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               Chiết khấu nền tảng:
               <button className="btn btn-ghost" onClick={(e) => { e.preventDefault(); setFormData({...formData, ...calculateTotals(formData, null)}); listState.handlers.showToast('Đã tính lại Thực thu theo cấu hình Kênh mới nhất!'); }} style={{ padding: '2px 6px', fontSize: '11px', background: 'var(--surface-color)', border: '1px solid currentColor', color: 'inherit', height: 'auto', borderRadius: '4px' }}>
                  <RefreshCw size={10} style={{ marginRight: '4px' }}/> 
                  Gắn % Hiện Tại
               </button>
            </span>
            <span>-{(formData.discountAmount || 0).toLocaleString('vi-VN')} đ</span>
         </div>
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: '#0f172a', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <span>Thực Thu (Net Amount):</span>
            <span style={{ color: '#059669' }}>{(formData.netAmount || 0).toLocaleString('vi-VN')} đ</span>
         </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button className="btn btn-ghost" onClick={() => listState.setShowForm(false)}>Hủy</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!formData.date}><CheckCircle2 size={18}/> Lưu Đơn Đã Sửa</button>
      </div>
    </div>
  );

  return (
    <>
      <ModuleLayout
        title="Danh Sách Đơn Hàng"
        description="Quản lý trạng thái giao hàng, sửa đơn và doanh thu từ Shopee, Grab."
        icon={ClipboardList}
        listState={listState}
        overrideData={displayOrders}
        activeColumns={orderColumns}
        onEdit={handleEdit}
        onView={order => toggleExpand(order.id)}
        extraRowActions={extraRowActions}
        trashColumns={trashColumns}
        extraFilters={extraFiltersBlock}
        extraHeaderActions={headerActionsBlock}
        renderForm={renderForm}
      />

      {selectedOrder && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel" style={{ width: '800px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative', background: 'var(--bg-color)' }}>
             <button className="btn btn-ghost" onClick={() => setExpandedOrderId(null)} style={{ position: 'absolute', top: '24px', right: '24px', padding: '8px', zIndex: 10 }}><X size={20}/></button>
             <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '20px', color: '#111827', fontWeight: 800 }}>Chi Tiết Đơn Hàng #{selectedOrder.id}</h3>
             <div style={{ marginBottom: '24px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Thời gian tạo đơn: {new Date(selectedOrder.date).toLocaleString('vi-VN')}</div>
             
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                <div>
                   <h4 style={{ margin: 0, marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>Đồ Ăn Định Lượng</h4>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {selectedOrder.items?.map((item, idx) => (
                       <div key={idx} style={{ padding: '12px 16px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{item.product?.name || 'Sản phẩm'}</span>
                         <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>{item.product?.price?.toLocaleString('vi-VN')} đ</span>
                            <strong style={{ color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>x{item.quantity}</strong>
                         </div>
                       </div>
                     ))}
                     {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                        <div style={{ padding: '12px', fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Không có chi tiết mặt hàng (Đơn từ báo cáo).</div>
                     )}
                   </div>
                </div>

                <div>
                   <h4 style={{ margin: 0, marginBottom: '16px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>Phân Tích Dòng Tiền & Cấu Trúc Đơn</h4>
                   <div style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                         <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Tổng tiền hàng (Gross):</span>
                         <span style={{ fontWeight: 700 }}>{selectedOrder.totalAmount?.toLocaleString('vi-VN')} đ {selectedOrder.totalAmount > 0 && <span style={{ fontSize: '12px', opacity: 0.8, color: 'var(--text-secondary)' }}>({100}%)</span>}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                         <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500 }}>Chiết khấu nền tảng:</span>
                         {(() => {
                            const fee = Math.max(0, selectedOrder.discountAmount != null ? selectedOrder.discountAmount : (selectedOrder.totalAmount - selectedOrder.netAmount));
                            const pt = fee > 0 && selectedOrder.totalAmount ? Math.round((fee / selectedOrder.totalAmount) * 100) : 0;
                            return (
                                <span style={{ color: '#EA580C', fontWeight: 700 }}>
                                    -{fee.toLocaleString('vi-VN')} đ {pt > 0 && <span style={{ fontSize: '12px', opacity: 0.8 }}>({pt}%)</span>}
                                </span>
                            );
                         })()}
                      </div>
                      <div style={{ width: '100%', height: '1px', background: 'var(--surface-border)', margin: '4px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '14px', fontWeight: 800 }}>THỰC THU (NET):</span>
                         {(() => {
                            const net = selectedOrder.netAmount + (Number(selectedOrder.extraFee) || 0);
                            const pt = net && selectedOrder.totalAmount ? Math.round((net / selectedOrder.totalAmount) * 100) : 0;
                            return (
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                                   <span style={{ color: 'var(--success)', fontSize: '18px', fontWeight: 900 }}>{net.toLocaleString('vi-VN')} đ</span>
                                   {pt > 0 && <span style={{ color: 'var(--success)', fontSize: '14px', opacity: 0.85, fontWeight: 700 }}>({pt}%)</span>}
                                </div>
                            );
                         })()}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1300, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
           <div className="glass-panel" style={{ width: '1000px', maxWidth: '95vw', height: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-color)', overflow: 'hidden', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px 0 24px' }}>
                 <button className="btn btn-ghost" onClick={() => setShowImportModal(false)} style={{ padding: '8px', zIndex: 10 }}><X size={24} color="var(--text-secondary)"/></button>
              </div>
              <div style={{ flex: 1, padding: '0 24px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                 <ImportData />
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default OrdersUI;
