import React, { useState, useEffect } from 'react';
import { useLocalList } from '../hooks/useLocalList';
import SortHeader from './SortHeader';
import { useData } from '../context/DataContext';
import CurrencyInput from './CurrencyInput';
import { PackagePlus, CheckSquare, Square, Trash2, Eye, Truck, CreditCard, Search, XCircle } from 'lucide-react';

export default function PurchasesUI({ 
  purchases, 
  suppliers, 
  ingredients, 
  onAddPurchase, 
  onPayDebt, 
  onDeletePurchase
}) {
  const { state: rootState, dispatch } = useData();
  const [showForm, setShowForm] = useState(false);
  const [expandedPoId, setExpandedPoId] = useState(null);
  const [payDebtForm, setPayDebtForm] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowForm(false);
        setExpandedPoId(null);
        setPayDebtForm(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Form states cho Nhập Hàng Mới
  const [importForm, setImportForm] = useState({ supplierId: '', items: [] });
  const [tempItem, setTempItem] = useState({ ingredientId: '', baseQty: 1, cost: 0 });

  const listState = useLocalList(purchases);

  const _selectedSupplier = suppliers.find(s => s.id === importForm.supplierId);

  // Auto-fill cost from ingredient's buyPrice or cost
  const onSelectIngredient = (ingId) => {
     const ing = ingredients.find(i => i.id === ingId);
     if (ing) {
        setTempItem(prev => ({ 
           ...prev, 
           ingredientId: ingId, 
           cost: Number(ing.buyPrice) || (Number(ing.cost) * (Number(ing.conversionRate) || 1)) 
        }));
     } else {
        setTempItem(prev => ({ ...prev, ingredientId: ingId }));
     }
  };

  const handleAddItem = () => {
    if (!tempItem.ingredientId) return alert('Vui lòng chọn nguyên liệu');
    if (tempItem.baseQty <= 0) return alert('Số lượng phải > 0');
    if (tempItem.cost <= 0) return alert('Đơn giá nhập phải > 0');

    const ing = ingredients.find(i => i.id === tempItem.ingredientId);
    
    setImportForm(prev => ({
       ...prev,
       items: [...prev.items, { 
          ingredientId: ing.id,
          ingredientName: ing.name, 
          baseQty: Number(tempItem.baseQty), 
          cost: Number(tempItem.cost),
          totalLine: Number(tempItem.baseQty) * Number(tempItem.cost),
          unit: ing.buyUnit || ing.unit
       }]
    }));
    
    setTempItem({ ingredientId: '', baseQty: 1, cost: 0 });
  };

  const handleRemoveItem = (index) => {
    setImportForm(prev => ({
       ...prev,
       items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const commitPurchaseLocal = (status) => {
    if (!importForm.supplierId) {
       dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'Lỗi Nhập Kho', message: 'Bắt buộc phải chọn Nhà Cung Cấp. Nếu chưa có, vui lòng tạo mới.', type: 'error' } });
       return;
    }
    if (importForm.items.length === 0) {
       dispatch({ type: 'ADD_NOTIFICATION', payload: { title: 'Thiếu Mặt Hàng', message: 'Chưa bốc mặt hàng nào lên phiếu ngỏ.', type: 'warning' } });
       return;
    }

    const totalAmount = importForm.items.reduce((sum, item) => sum + item.totalLine, 0);
    
    onAddPurchase && onAddPurchase({
        supplierId: importForm.supplierId, 
        items: importForm.items.map(i => ({ ingredientId: i.ingredientId, baseQty: Number(i.baseQty), cost: Number(i.cost) })),
        totalAmount,
        status, 
        date: new Date().toISOString()
    });
    
    dispatch({ 
      type: 'ADD_NOTIFICATION', 
      payload: { title: 'Nhập Kho Bãi', message: `Nhập lô hàng trị giá ${totalAmount.toLocaleString('vi-VN')} đ thành công!`, type: 'success' } 
    });

    setShowForm(false);
    setImportForm({ supplierId: '', items: [] });
  };

  const renderActiveList = () => (
    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--surface-border)', background: '#FFFFFF' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--surface-border)', background: 'var(--surface-variant)', color: 'var(--text-secondary)' }}>
            <th style={{ width: '50px', padding: '16px', textAlign: 'center' }} onClick={() => {
              if (listState.selectedIds.length === purchases.length && purchases.length > 0) listState.clearSelection();
              else listState.setSelectedIds(purchases.map(i => i.id));
            }}>
               {listState.selectedIds.length === purchases.length && purchases.length > 0 ? <CheckSquare size={18} color="var(--primary)"/> : <Square size={18} color="var(--text-secondary)"/>}
            </th>
            <SortHeader label="Ngày Cập Nhật" sortKey="date" sortConfig={listState.sortConfig} onSort={listState.handleSort} />
            <SortHeader label="Nhà Cung Cấp" sortKey="supplierId" sortConfig={listState.sortConfig} onSort={listState.handleSort} />
            <SortHeader label="Tình Trạng" sortKey="status" sortConfig={listState.sortConfig} onSort={listState.handleSort} align="center" />
            <SortHeader label="Tổng Phiếu (VNĐ)" sortKey="totalAmount" sortConfig={listState.sortConfig} onSort={listState.handleSort} align="right" />
            <th style={{ padding: '16px', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {listState.filteredActiveItems.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontWeight: 600 }}>Lịch sử giao dịch nhập sạch bách, chưa có phiếu nào.</td></tr>
          ) : (
            listState.filteredActiveItems.map(o => {
              const isSelected = listState.selectedIds.includes(o.id);
              const supName = suppliers.find(s => s.id === o.supplierId)?.name || 'Vô danh';
              return (
                <React.Fragment key={o.id}>
                  <tr style={{ borderBottom: '1px solid var(--surface-border)', background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent', transition: '0.2s' }}>
                    <td style={{ padding: '16px', textAlign: 'center', cursor: 'pointer' }} onClick={() => listState.toggleSelection(o.id)}>
                      {isSelected ? <CheckSquare size={18} color="var(--primary)"/> : <Square size={18} color="var(--text-secondary)"/>}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 600 }}>
                      <div style={{ color: 'var(--text-primary)', fontSize: '14px', marginBottom:'4px' }}>{new Date(o.date).toLocaleString('vi-VN')}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Mã phiếu: {o.id}</div>
                    </td>
                    <td style={{ padding: '16px' }}>{supName}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: o.status === 'Paid' ? '#F0FDF4' : '#FEF2F2', color: o.status === 'Paid' ? '#166534' : '#991B1B' }}>
                         {o.status === 'Paid' ? 'Đã Thanh Toán' : 'Đang Treo Nợ'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)', fontSize: '15px' }}>{o.totalAmount.toLocaleString('vi-VN')} ₫</td>
                    <td style={{ padding: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end', opacity: expandedPoId === o.id ? 1 : 0.8 }}>
                       {o.status === 'Pending' && (
                         <button className="btn btn-ghost" style={{ padding: '6px', color: 'var(--primary)', background: '#F0F9FF' }} onClick={() => onPayDebt && onPayDebt(o.id, o.totalAmount, supName)} title="Rút Két Trả Nợ">
                           <CreditCard size={16} />
                         </button>
                       )}
                       <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => setExpandedPoId(prev => prev === o.id ? null : o.id)} title="Xem Chi Tiết">
                          <Eye size={16}/>
                       </button>
                       <button className="btn btn-ghost" style={{ padding: '6px', color: 'var(--danger)' }} onClick={() => onDeletePurchase && onDeletePurchase(o.id)} title="Xóa & Hoàn Kho">
                          <Trash2 size={16}/>
                       </button>
                    </td>
                  </tr>

                  {/* Inline expansion removed, using Modal instead */}
                </React.Fragment>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
       {/* Toolbar */}
       <div className="accounting-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '500px' }}>
            <div className="search-bar" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--bg-color)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '0 14px', height: '34px' }}>
                <Search size={16} color="var(--text-secondary)" />
                <input style={{ border: 'none', outline: 'none', background: 'transparent', padding: '0 0 0 8px', width: '100%', color: 'var(--text-primary)', height: '100%', fontSize: '13px', fontWeight: 500 }} placeholder="Tìm kiếm phiếu nhập..." value={listState.search} onChange={e => listState.setSearch(e.target.value)} />
            </div>
            
            <select className="table-feature-select" value={listState.datePreset} onChange={(e) => listState.handlePresetChange(e.target.value)}>
               <option value="all">Mọi thời gian</option>
               <option value="today">Hôm nay</option>
               <option value="week">Tuần này</option>
               <option value="month">Tháng này</option>
            </select>
          </div>
          
          <button className="btn btn-primary table-feature-btn" onClick={() => setShowForm(!showForm)}>
             {showForm ? <XCircle size={16}/> : <PackagePlus size={16}/>}
             {showForm ? 'Hủy Lập Phiếu' : 'Lập Phiếu Nhập'}
          </button>
       </div>

       {showForm ? (
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
             <h3 style={{ margin: '0 0 20px', color: 'var(--text-primary)' }}>Lập phiếu nhập kho & Thanh toán</h3>
             <div className="dashboard-chart-grid-2" style={{ gap: '20px' }}>
                 <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Nhà Cung Cấp Đối Tác</label>
                    <select className="form-input" value={importForm.supplierId} onChange={e => setImportForm({...importForm, supplierId: e.target.value})}>
                       <option value="">-- Bắt buộc chọn nhà cung cấp --</option>
                       {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} - (Nợ cũ: {s.debt?.toLocaleString('vi-VN')}đ)</option>)}
                    </select>

                    <div style={{ marginTop: '20px', padding: '16px', background: 'var(--surface-variant)', borderRadius: '12px' }}>
                       <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                          <Truck size={24} color="var(--primary)" />
                          <div style={{ flex: 1 }}>
                             <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Tìm Nguyên Liệu / Phụ Tùng</label>
                             <select className="form-input" value={tempItem.ingredientId} onChange={e => onSelectIngredient(e.target.value)}>
                               <option value="">-- Chọn món nhập --</option>
                               {ingredients.map(ing => <option key={ing.id} value={ing.id}>{ing.name}</option>)}
                             </select>
                          </div>
                       </div>
                       
                       <div style={{ display: 'flex', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                             <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>SL Nhập Theo Đơn Vị Gốc</label>
                             <input type="number" min="0" step="any" className="form-input" value={tempItem.baseQty} onChange={e => setTempItem({...tempItem, baseQty: e.target.value})} />
                          </div>
                          <div style={{ flex: 1 }}>
                             <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Giá Vốn Đơn Vị (VNĐ)</label>
                             <CurrencyInput value={tempItem.cost} onChange={v => setTempItem({...tempItem, cost: v})} className="form-input" />
                          </div>
                       </div>

                       <button className="btn btn-secondary" style={{ width: '100%', marginTop: '16px', background: '#fff', border: '1px solid var(--primary)', color: 'var(--primary)' }} onClick={handleAddItem}>
                          + Thêm Dòng Mặt Hàng
                       </button>
                    </div>
                 </div>

                 <div style={{ background: 'var(--bg-color)', borderRadius: '12px', padding: '20px', border: '1px solid var(--surface-border)' }}>
                     <h4 style={{ margin: '0 0 16px', fontSize: '15px' }}>Bảng Kê Mặt Hàng:</h4>
                     {importForm.items.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>Chưa bốc dòng mặt hàng nào lên phiếu.</div>
                     ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                           <thead>
                              <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'left' }}>
                                 <th style={{ paddingBottom: '8px' }}>Mặt Hàng (Gốc)</th>
                                 <th style={{ paddingBottom: '8px' }}>Khối Lượng</th>
                                 <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Đơn Giá</th>
                                 <th style={{ paddingBottom: '8px', textAlign: 'right' }}>Thành Tiền</th>
                                 <th style={{ paddingBottom: '8px' }}></th>
                              </tr>
                           </thead>
                           <tbody>
                              {importForm.items.map((item, idx) => (
                                 <tr key={idx} style={{ borderBottom: '1px dashed var(--surface-border)' }}>
                                    <td style={{ padding: '12px 0', fontSize: '14px', fontWeight: 600 }}>{item.ingredientName}</td>
                                    <td style={{ padding: '12px 0', fontSize: '14px' }}>{item.baseQty} <span style={{ color: 'var(--text-secondary)' }}>{item.unit}</span></td>
                                    <td style={{ padding: '12px 0', fontSize: '14px', textAlign: 'right' }}>{item.cost?.toLocaleString('vi-VN')} ₫</td>
                                    <td style={{ padding: '12px 0', fontSize: '14px', textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>{item.totalLine?.toLocaleString('vi-VN')} ₫</td>
                                    <td style={{ padding: '12px 0', textAlign: 'right' }}>
                                       <button onClick={() => handleRemoveItem(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16}/></button>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     )}

                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>TỔNG THANH TOÁN (BILL):</span>
                        <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary)' }}>
                           {importForm.items.reduce((s, i) => s + i.totalLine, 0).toLocaleString('vi-VN')} ₫
                        </span>
                     </div>

                     <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-secondary" style={{ flex: 1, padding: '14px', display: 'flex', justifyContent: 'center', gap: '8px', background: '#fff', color: '#B91C1C', border: '1px solid #FECACA' }} onClick={() => commitPurchaseLocal('Pending')}>
                           <CreditCard size={18} /> Ghi Nợ 
                        </button>
                        <button className="btn btn-primary" style={{ flex: 2, padding: '14px', display: 'flex', justifyContent: 'center', gap: '8px' }} onClick={() => commitPurchaseLocal('Paid')}>
                           ✔ Thanh Toán Ngay Bằng Quỹ Tiền Mặt
                        </button>
                     </div>
                 </div>
             </div>
          </div>
       ) : renderActiveList()}

       {/* Modal Chi Tiết Phiếu Nhập */}
       {expandedPoId && (
        (() => {
          const po = purchases.find(p => p.id === expandedPoId);
          if (!po) return null;
          const sup = suppliers.find(s => s.id === po.supplierId);
          return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '700px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Chi Tiết Phiếu Nhập Kho</h3>
                  <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => setExpandedPoId(null)}>
                    <XCircle size={24} color="var(--text-secondary)" />
                  </button>
                </div>

                <div style={{ display: 'flex', background: 'var(--surface-variant)', padding: '16px', borderRadius: '12px', marginBottom: '24px', justifyContent: 'space-between' }}>
                  <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Mã Phiếu</label>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '16px' }}>{po.id}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Nhà Cung Cấp</label>
                    <div style={{ fontWeight: 600 }}>{sup?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Trạng Thái</label>
                    <div style={{ fontWeight: 600, color: po.status === 'Paid' ? 'var(--success)' : 'var(--danger)' }}>
                      {po.status === 'Paid' ? 'Đã thanh toán' : 'Ghi Nợ'}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ngày Lập</label>
                    <div style={{ fontWeight: 500 }}>{new Date(po.date).toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>

                <div style={{ border: '1px solid var(--surface-border)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ padding: '12px 16px', background: 'var(--bg-color)', borderBottom: '1px solid var(--surface-border)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        DANH SÁCH MẶT HÀNG NHẬP VÀO KHO
                    </div>
                    {po.items?.map((item, idx) => {
                        const ing = ingredients.find(i => i.id === item.ingredientId);
                        return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: idx === po.items.length - 1 ? 'none' : '1px solid var(--surface-border)' }}>
                                <div style={{ flex: 2 }}>
                                   <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{ing?.name || 'Nguyên liệu không xác định'}</div>
                                   <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Mã NL: {item.ingredientId}</div>
                                </div>
                                <div style={{ flex: 1 }}>
                                   <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Số lượng nhập</div>
                                   <div style={{ fontWeight: 700 }}>{item.baseQty} <span style={{ fontWeight: 400, fontSize: '13px' }}>{ing?.unit}</span></div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'right' }}>
                                   <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Đơn giá kho</div>
                                   <div style={{ fontWeight: 500 }}>{Number(item.cost || 0).toLocaleString('vi-VN')} đ</div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'right' }}>
                                   <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Thành tiền</div>
                                   <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{((item.baseQty * Number(item.cost||0)) || 0).toLocaleString('vi-VN')} đ</div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tổng giá trị lô hàng:</div>
                   <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary)' }}>{Number(po.totalAmount || 0).toLocaleString('vi-VN')} đ</div>
                </div>

                {po.status === 'Pending' && (
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '15px' }} onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setPayDebtForm({ 
                                poId: po.id, 
                                amount: po.totalAmount, 
                                supplierName: sup?.name || po.seller,
                                accountId: 'ACC1' 
                            });
                        }}>
                            <CreditCard size={20}/>
                            Duyệt Xuất Quỹ & Cấn Trừ Nợ Phụ Tùng
                        </button>
                    </div>
                )}

              </div>
            </div>
          )
        })()
       )}
       
       {payDebtForm && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(4px)' }}>
          <form style={{ width: '450px', padding: '32px', background: 'var(--bg-color)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }} onSubmit={(e) => {
             e.preventDefault();
             if (onPayDebt) {
                onPayDebt(payDebtForm.poId, payDebtForm.amount, payDebtForm.supplierName, payDebtForm.accountId);
             }
             setPayDebtForm(null);
          }}>
             <h3 style={{ margin: 0, marginBottom: '20px', fontSize: '20px', color: 'var(--text-primary)', fontWeight: 800 }}>Xác Nhận Thanh Toán Nợ</h3>
             <div style={{ marginBottom: '24px' }}>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                   Duyệt chi <strong>{payDebtForm.amount.toLocaleString('vi-VN')} đ</strong> để trả nợ cho <strong>{payDebtForm.supplierName || 'Nhà cung cấp'}</strong> (Mã đơn: {payDebtForm.poId}). Phiếu chi tương ứng sẽ tự động được lập vào Sổ nhật ký.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Chọn nguồn Quỹ chi trả:</label>
                   <select className="form-input" style={{ width: '100%', padding: '10px' }} value={payDebtForm.accountId} onChange={e => setPayDebtForm({...payDebtForm, accountId: e.target.value})}>
                      {rootState.accounts.map(acc => (
                         <option key={acc.id} value={acc.id}>{acc.name} (Tồn quỹ: {acc.balance.toLocaleString('vi-VN')} đ)</option>
                      ))}
                   </select>
                </div>
             </div>
             <div style={{ display: 'flex', gap: '8px' }}>
               <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}><CheckSquare size={18}/> Xác nhân Xuất Quỹ</button>
               <button type="button" className="btn btn-ghost" style={{ flex: 1, padding: '12px' }} onClick={() => setPayDebtForm(null)}>Hủy</button>
             </div>
          </form>
        </div>
       )}
    </div>
  );
}
