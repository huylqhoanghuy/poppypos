import React, { useState } from 'react';
import { Package, Plus, Search, Trash2, Edit, Truck, ArrowRight, History, CheckCircle, CreditCard, X } from 'lucide-react';
import { useData } from '../context/DataContext';

const parseNum = (val) => Number(String(val).replace(/[^\d]/g, ''));
const formatNum = (val) => val ? parseNum(val).toLocaleString('vi-VN') : '';

const Inventory = () => {
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState('ingredients'); 
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({ id: '', name: '', category: '', buyUnit: '', unit: '', conversionRate: '', cost: '', buyCost: '' });
  
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ id: '', name: '', phone: '', email: '' });

  const [poForm, setPoForm] = useState({ supplierId: '', items: [], note: '', status: 'Paid' });
  const [poItem, setPoItem] = useState({ ingredientId: '', buyUnit: '', buyQty: '', itemTotalDisplay: '', baseQty: '' });

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ id: '', name: '', oldStock: 0, newStock: '', unit: '' });

  const handleIngredientChange = (e) => {
    const val = e.target.value;
    const ing = state.ingredients.find(i => i.id === val);
    setPoItem(prev => ({
      ...prev,
      ingredientId: val,
      buyUnit: ing?.buyUnit || '',
      baseQty: ing ? (Number(prev.buyQty) || 0) * (ing.conversionRate || 1) : ''
    }));
  };

  const handleBuyQtyChange = (e) => {
    const val = e.target.value;
    const ing = state.ingredients.find(i => i.id === poItem.ingredientId);
    setPoItem(prev => ({
      ...prev,
      buyQty: val,
      baseQty: ing ? (Number(val) || 0) * (ing.conversionRate || 1) : prev.baseQty
    }));
  };

  const saveIngredient = (e) => {
    e.preventDefault();
    const conv = Number(itemForm.conversionRate) || 1;
    const bCost = parseNum(itemForm.buyCost);
    const costPerBase = bCost / conv;

    const payload = {
      name: itemForm.name,
      category: itemForm.category,
      buyUnit: itemForm.buyUnit,
      unit: itemForm.unit,
      conversionRate: conv,
      buyCost: bCost,
      cost: costPerBase,
      stock: itemForm.id ? state.ingredients.find(i => i.id === itemForm.id).stock : 0
    };
    if (itemForm.id) dispatch({ type: 'UPDATE_INGREDIENT', payload: { ...payload, id: itemForm.id } });
    else dispatch({ type: 'ADD_INGREDIENT', payload });
    setShowItemForm(false);
  };

  const deleteIngredient = (id) => {
    dispatch({ type: 'DELETE_INGREDIENT', payload: id });
  };

  const saveSupplier = (e) => {
    e.preventDefault();
    if (supplierForm.id) dispatch({ type: 'UPDATE_SUPPLIER', payload: supplierForm });
    else dispatch({ type: 'ADD_SUPPLIER', payload: supplierForm });
    setShowSupplierForm(false);
  };

  const deleteSupplier = (id) => {
    dispatch({ type: 'DELETE_SUPPLIER', payload: id });
  };

  const addPoItem = () => {
    const buyQty = Number(poItem.buyQty);
    const itemTotal = parseNum(poItem.itemTotalDisplay);
    const baseQty = Number(poItem.baseQty);

    if (!poItem.ingredientId || !buyQty || !itemTotal || !baseQty) {
      return alert('Vui lòng điền đủ Số lượng nhập, Tổng tiền Lô hàng, và Số lượng thực tế sẽ Cất Kho.');
    }
    setPoForm(prev => ({ 
      ...prev, 
      items: [...prev.items, { 
        ...poItem, 
        buyQty, 
        itemTotal, 
        baseQty
      }] 
    }));
    setPoItem({ ingredientId: '', buyUnit: '', buyQty: '', itemTotalDisplay: '', baseQty: '' });
  };

  const removePoItem = (index) => {
    setPoForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  }

  const submitPurchaseOrder = () => {
    if (!poForm.supplierId || poForm.items.length === 0) return alert('Vui lòng điền tối thiểu 1 mặt hàng và Nhà cung cấp');
    const totalAmount = poForm.items.reduce((acc, curr) => acc + curr.itemTotal, 0);
    dispatch({ type: 'ADD_PURCHASE_ORDER', payload: { ...poForm, totalAmount } });
    alert(`Khóa Sổ nhập kho thành công! Kế toán tự động ghi nhận: ${poForm.status === 'Paid' ? 'Đã xuất quỹ thanh toán' : 'Treo Công nợ'}`);
    setPoForm({ supplierId: '', items: [], note: '', status: 'Paid' });
    setActiveTab('history');
  };

  const payDebt = (poId) => {
    if(confirm('Xác nhận thanh toán công nợ cho hóa đơn này (Tiền mặt sẽ bị trừ từ quỹ)?')) {
      dispatch({ type: 'UPDATE_PURCHASE_ORDER_STATUS', payload: { id: poId, status: 'Paid' } });
    }
  }

  const handleAdjustStock = (e) => {
    e.preventDefault();
    const ns = Number(adjustForm.newStock);
    if (isNaN(ns)) return alert('Vui lòng nhập số lượng hợp lệ');
    dispatch({ type: 'ADJUST_STOCK', payload: { id: adjustForm.id, newStock: ns } });
    setShowAdjustModal(false);
  };

  const editPO = (po) => {
    dispatch({ type: 'DELETE_PURCHASE_ORDER', payload: po.id });
    
    // Nạp lại format string cho các input
    const restoredItems = po.items.map(i => ({ ...i, itemTotalDisplay: formatNum(i.itemTotal) }));
    setPoForm({ supplierId: po.supplierId, items: restoredItems, note: po.note, status: po.status });
    setActiveTab('purchase');
  };

  const deletePO = (poId) => {
    dispatch({ type: 'DELETE_PURCHASE_ORDER', payload: poId });
  }

  const handleDisplayChange = (e, field, setter, stateObj) => {
    const raw = e.target.value;
    const numStr = raw.replace(/[^\d]/g, '');
    setter({...stateObj, [field]: numStr ? Number(numStr).toLocaleString('vi-VN') : ''});
  }

  const InputStyle = { background: 'rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)', color: 'white', padding: '10px', borderRadius: '8px', width: '100%', outline: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package color="var(--primary)" /> Quản Lý Kho & Nhập Hàng Tự Động
          </h2>
          <p style={{ margin: 0, marginTop: '4px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nơi định nghĩa vật tư Đa đơn vị tính, Lên phiếu nhập hàng và kiểm soát Công nợ. Tiền tệ hỗ trợ phân cách nghìn.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        <button className={`btn ${activeTab === 'purchase' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('purchase')}><Truck size={16}/> Lên Phiếu Nhập / Chốt Lô Hàng</button>
        <button className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('history')}><History size={16}/> Sổ Lịch Sử Khai Báo & Công Nợ</button>
        <button className={`btn ${activeTab === 'ingredients' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('ingredients')}>Thẻ Từ Điển Vật Tư Hệ Thống</button>
        <button className={`btn ${activeTab === 'suppliers' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('suppliers')}>Hồ Sơ Nhà Cung Cấp</button>
      </div>

      {activeTab === 'ingredients' && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <h3 style={{ margin: 0 }}>Từ Điển Nguyên Vật Liệu (Phân chia Giá Nhập - Giá Dùng)</h3>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                  <Search size={16} color="var(--text-secondary)" />
                  <input placeholder="Tìm tên vật tư..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} style={{ background:'transparent', border:'none', color:'white', outline:'none', fontSize:'0.9rem' }} />
               </div>
               <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid var(--surface-border)', padding:'8px', borderRadius:'6px', outline:'none' }}>
                  <option value="all">-- Tất cả Danh Mục --</option>
                  {state.categories.filter(c => c.type === 'inventory').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
               </select>
               <button className="btn btn-primary" onClick={() => { setItemForm({id:'', name:'', category:'', buyUnit:'', unit:'', conversionRate:'', cost:'', buyCost:''}); setShowItemForm(true); }}>
                 <Plus size={16} /> Định Nghĩa Vật Tư Mới
               </button>
            </div>
          </div>

          {showItemForm && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
              <div className="glass-panel" style={{ width: '600px', padding: '24px', background: 'var(--bg-color)', border: '1px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary)' }}>{itemForm.id ? 'Cập Nhật Thẻ Vật Tư' : 'Khai Báo Định Dạng Dữ Liệu Vật Tư'}</h3>
                  <button className="btn btn-ghost" onClick={() => setShowItemForm(false)} style={{ padding: '4px' }}><X/></button>
                </div>
                <form onSubmit={saveIngredient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tên Gọi (VD: Chai Nước Chấm Mặn):</label>
                      <input required style={InputStyle} value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Thuộc Thẻ Phân Loại Danh Mục (Kho):</label>
                      <select required style={InputStyle} value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})}>
                        <option value="">-- Chọn thẻ danh mục Kho --</option>
                        {state.categories.filter(c => c.type === 'inventory').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--text-secondary)' }}>
                     <h4 style={{ margin: 0, marginBottom: '12px', color: 'var(--text-primary)' }}>Thiết Lập Đơn Vị Tính Song Song (Mua vs Dùng)</h4>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ĐVT Nhập Liệu Thường Mua (VD: Thùng):</label>
                          <input required style={InputStyle} value={itemForm.buyUnit} onChange={e => setItemForm({...itemForm, buyUnit: e.target.value})} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ĐVT Sử Dụng Chế Biến Thực (VD: Hộp con):</label>
                          <input required style={InputStyle} value={itemForm.unit} onChange={e => setItemForm({...itemForm, unit: e.target.value})} />
                        </div>
                     </div>
                     <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ArrowRight color="var(--success)"/>
                        <span>Tỉ lệ quy trình Cắt/bổ đồ tự động: 1 {itemForm.buyUnit || '[Nhập]'} = </span>
                        <input required type="number" step="0.01" style={{...InputStyle, width: '100px', borderColor: 'var(--success)'}} placeholder="VD: 100" value={itemForm.conversionRate} onChange={e => setItemForm({...itemForm, conversionRate: e.target.value})} />
                        <span>{itemForm.unit || '[Dùng]'}</span>
                     </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Giá Nhập Tiêu Chuẩn (Mua 1 {itemForm.buyUnit || 'ĐVT Nhập'}) (VNĐ):</label>
                    <input required type="text" style={{...InputStyle, fontSize: '1.05rem', color: 'var(--primary)'}} placeholder="1.200.000" 
                      value={itemForm.buyCost} 
                      onChange={e => handleDisplayChange(e, 'buyCost', setItemForm, itemForm)} 
                    />
                    <p style={{margin:0, marginTop:'4px', fontSize:'0.8rem', color:'var(--success)'}}>Hệ thống sẽ tự động CHIA tỷ lệ để trích xuất Giá vốn cho 1 {itemForm.unit || 'ĐVT Dùng'} lúc khai Recipe!</p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Ghi Nhận Thuộc Tính Hệ Song Song</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowItemForm(false)}>Hủy Bỏ</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showAdjustModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
              <div className="glass-panel" style={{ width: '450px', padding: '24px', background: 'var(--bg-color)', border: '1px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: 'var(--primary)' }}>Điều Chỉnh Tồn Kho Thủ Công</h3>
                  <button className="btn btn-ghost" onClick={() => setShowAdjustModal(false)} style={{ padding: '4px' }}><X/></button>
                </div>
                <form onSubmit={handleAdjustStock} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <p style={{ margin: 0, fontSize: '0.95rem' }}>
                    Vật tư: <strong style={{color: 'var(--primary)'}}>{adjustForm.name}</strong>
                  </p>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{color: 'var(--text-secondary)'}}>Tồn kho hiện tại:</span>
                    <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{adjustForm.oldStock} {adjustForm.unit}</span>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Số lượng thực tế mới ({adjustForm.unit}):</label>
                    <input autoFocus required type="number" step="0.01" style={{...InputStyle, fontSize: '1.2rem', textAlign: 'center'}} 
                      value={adjustForm.newStock} 
                      onChange={e => setAdjustForm({...adjustForm, newStock: e.target.value})} 
                      placeholder="Nhập số chuẩn tại kho..."
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Xác Nhận Cân Kho</button>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdjustModal(false)}>Hủy</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div style={{overflowX: 'auto'}}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px' }}>Mã & Tên Vật Tư</th>
                  <th style={{ padding: '12px' }}>Chủng Loại (Danh mục)</th>
                  <th style={{ padding: '12px' }}>Tồn Kho Thực Tế Lõi</th>
                  <th style={{ padding: '12px' }}>Giá Vốn ĐVT Lõi (Đã Cưa)</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {state.ingredients
                  .filter(ing => {
                    const matchSearch = ing.name.toLowerCase().includes(filterSearch.toLowerCase());
                    const matchCat = filterCategory === 'all' || ing.category === filterCategory;
                    return matchSearch && matchCat;
                  })
                  .map(ing => {
                  const buyStockEquivalent = (ing.stock / (ing.conversionRate || 1)).toFixed(1);
                  return (
                  <tr key={ing.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px' }}>
                      <strong style={{display: 'block', color: 'var(--text-primary)', fontSize: '1.05rem'}}>{ing.name}</strong>
                      <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>({ing.id}) Quy chuyển Hàng Lô: 1 {ing.buyUnit} = {ing.conversionRate} {ing.unit}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.85rem' }}>{ing.category || '-'}</span>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>
                      <div style={{ color: ing.stock <= 0 ? 'var(--danger)' : 'var(--success)', fontSize: '1.1rem' }}>
                        {parseFloat(Number(ing.stock).toFixed(2))} {ing.unit}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <span style={{color: 'var(--primary)'}}>Nguồn Trữ Lô ~{buyStockEquivalent} {ing.buyUnit}</span> nguyên nhãn
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {Math.round(ing.cost).toLocaleString('vi-VN')} đ / {ing.unit}
                      <br/>
                      <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>~ {Math.round(ing.cost * ing.conversionRate).toLocaleString('vi-VN')}đ/{ing.buyUnit}</span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button className="btn btn-ghost" title="Điều chỉnh tồn" style={{ color: 'var(--warning)' }} onClick={() => { setAdjustForm({ id: ing.id, name: ing.name, oldStock: ing.stock, newStock: ing.stock, unit: ing.unit }); setShowAdjustModal(true); }}><Package size={16}/></button>
                      <button className="btn btn-ghost" onClick={() => { setItemForm({...ing, buyCost: formatNum(ing.cost * ing.conversionRate)}); setShowItemForm(true); }}><Edit size={16}/></button>
                      <button className="btn btn-ghost" style={{color: 'var(--danger)'}} onClick={() => deleteIngredient(ing.id)}><Trash2 size={16}/></button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'purchase' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
           <div className="glass-panel" style={{ padding: '24px' }}>
             <h3 style={{ margin: 0, marginBottom: '20px', color: 'var(--primary)' }}>[Nhập Hàng Mới] Check Bill & Điểm Đếm Tăng Kho</h3>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <select required style={{...InputStyle, borderColor: 'var(--secondary)'}} value={poForm.supplierId} onChange={e => setPoForm({...poForm, supplierId: e.target.value})}>
                 <option value="">-- Mở Nhóm: Chọn Nhà Cung Cấp Thanh Toán Phía Sau --</option>
                 {state.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </select>

               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                 
                 <div>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>1. Chốt mặt hàng & Lấy Khai báo Hóa đơn sỉ</label>
                    <select style={{...InputStyle, marginTop: '8px'}} value={poItem.ingredientId} onChange={handleIngredientChange}>
                      <option value="">-- Chọn Tên Mặt Hàng Nhập Thêm --</option>
                      {state.ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.id})</option>)}
                    </select>
                    {poItem.ingredientId && (
                      <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(249, 115, 22, 0.15)', borderRadius: '6px', borderLeft: '4px solid var(--warning)' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--warning)', fontWeight: 600 }}>
                           Dữ liệu Cảnh Báo Điều Tiết: Tồn kho của Quán đang CÒN <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)'}}> {parseFloat(Number(state.ingredients.find(i=>i.id===poItem.ingredientId).stock).toFixed(2))} {state.ingredients.find(i=>i.id===poItem.ingredientId).unit}</strong>, hãy xem xét kỹ lưỡng trước khi Quyết định Lượng Nhập tiếp!
                        </span>
                      </div>
                    )}
                 </div>
                 
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                   <div>
                     <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mã ĐVT Hóa đơn Sỉ</label>
                     <input style={InputStyle} placeholder="VD: Thùng/Kg" value={poItem.buyUnit} onChange={e => setPoItem({...poItem, buyUnit: e.target.value})} />
                   </div>
                   <div>
                     <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Số Lượng Sỉ Khai Giá</label>
                     <input type="number" step="0.01" style={InputStyle} placeholder="1.5" value={poItem.buyQty} onChange={handleBuyQtyChange} />
                   </div>
                   <div style={{ gridColumn: '1 / span 2' }}>
                     <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Chiết tính Tiền trả cho Hoá đơn Sỉ này (VNĐ)</label>
                     <input type="text" style={{...InputStyle, fontSize: '1.1rem', color: 'var(--danger)'}} placeholder="VD: 1.500.000" 
                        value={poItem.itemTotalDisplay} 
                        onChange={e => handleDisplayChange(e, 'itemTotalDisplay', setPoItem, poItem)} />
                   </div>
                 </div>

                 {poItem.ingredientId && (
                   <div style={{ padding: '16px', background: 'rgba(46, 160, 67, 0.15)', borderRadius: '8px', borderLeft: '4px solid var(--success)' }}>
                      <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--success)' }}>2. Kiểm Hàng: Mở túi xé hộp, Quán thu được bao nhiêu Sản phẩm con?</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                        <input type="number" step="0.01" style={{...InputStyle, width: '120px', borderColor: 'var(--success)'}} value={poItem.baseQty} onChange={e => setPoItem({...poItem, baseQty: e.target.value})}/>
                        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{state.ingredients.find(i=>i.id===poItem.ingredientId).unit}</span>
                      </div>
                      <p style={{ margin: 0, marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Hệ thống đã tự tính phỏng đoán Tỉ Lệ dựa trên Khai báo Cấu hình, Quản kho CÓ QUYỀN GÕ ĐÈ kết quả kiểm đếm tay khách quan nhất!</p>
                   </div>
                 )}

                 <button className="btn btn-ghost" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={addPoItem}>Thêm Mục Này Vào Container Chốt Đơn</button>
               </div>
             </div>
           </div>

           <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ margin: 0, marginBottom: '20px' }}>Chi Tiết Giỏ Biên Lai Container</h3>
             
             <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {poForm.items.length === 0 && <span style={{color:'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', marginTop: '40px'}}>Chưa thêm mã vật tư nào.</span>}
                {poForm.items.map((item, idx) => {
                  const ing = state.ingredients.find(i => i.id === item.ingredientId);
                  return (
                    <div key={idx} style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{ing?.name}</p>
                        <button className="btn btn-ghost" style={{ padding: '4px', color:'var(--danger)'}} onClick={() => removePoItem(idx)}><Trash2 size={16}/></button>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Hoá Sỉ Cấu Thành mua: {item.buyQty} Lô {item.buyUnit} (Rút ví: {item.itemTotal.toLocaleString('vi-VN')} đ)
                      </p>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--success)', marginTop: '4px', fontWeight: 'bold' }}>
                        {'=>'} Cắt Khui Đếm Nhét Kho Lõi: +{item.baseQty} {ing?.unit} 
                      </p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--warning)', marginTop: '4px' }}>
                        (Cấu hình Giá vốn Bình quân Gia quyền mới bị đội thành: {Math.round(item.itemTotal/item.baseQty).toLocaleString('vi-VN')}đ/1 {ing?.unit})
                      </p>
                    </div>
                  )
                })}
             </div>
             
             <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '20px', marginTop: '20px' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                 <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Giao Kế toán xử lý công nợ:</p>
                 <select style={{...InputStyle, width: '200px', padding: '6px'}} value={poForm.status} onChange={e => setPoForm({...poForm, status: e.target.value})}>
                   <option value="Paid">Xuất Quỹ Thanh Toán Tiền Mặt Mặt</option>
                   <option value="Debt">Lưu vào Công Nợ Xin Nợ NCC</option>
                 </select>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                 <span>Tổng tiền chốt mua nguyên Phiếu:</span>
                 <span style={{ color: 'var(--primary)' }}>
                   {poForm.items.reduce((acc, curr) => acc + curr.itemTotal, 0).toLocaleString('vi-VN')} đ
                 </span>
               </div>
               
               <input style={{...InputStyle, marginTop: '16px'}} placeholder="Ghi chú nhân viên nhập / Biển số xe giao..." value={poForm.note} onChange={e => setPoForm({...poForm, note: e.target.value})} />
               <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px', padding: '16px', fontSize: '1.05rem', fontWeight: 'bold' }} onClick={submitPurchaseOrder} disabled={poForm.items.length === 0}>
                 <CheckCircle size={20} style={{marginRight: '8px'}} /> Xác Thực & Đẩy Trực Tiếp Số Liệu Kho Tài Chính
               </button>
             </div>
           </div>
        </div>
      )}

      {/* TAB MỚI: THEO DÕI LỊCH SỬ / CÔNG NỢ */}
      {activeTab === 'history' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ margin: 0, marginBottom: '20px' }}>Sổ Truy Vết Hệ Phiếu Nhập & Phân Quản Lý Sổ Sinh Thêm Công Nợ NCC</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px' }}>Mã Chốt Hàng</th>
                  <th style={{ padding: '12px' }}>Ngày Khai Báo</th>
                  <th style={{ padding: '12px' }}>Hồ sơ Nhà Cung Cấp</th>
                  <th style={{ padding: '12px' }}>Lịch Sử Kéo Tài Sản Đếm Về Kho Lõi</th>
                  <th style={{ padding: '12px' }}>Tổng Chi Phí</th>
                  <th style={{ padding: '12px' }}>Trạng Thái Kế Toán Nhận Tiền</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Xử Lý Sự Cố Trái Quy Trình</th>
                </tr>
              </thead>
              <tbody>
                {[...state.purchaseOrders].reverse().map(po => {
                  const supplier = state.suppliers.find(s => s.id === po.supplierId);
                  return (
                    <tr key={po.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{po.id}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{new Date(po.date).toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '12px', color: 'var(--secondary)', fontWeight: 600 }}>{supplier ? supplier.name : 'Vô danh'}</td>
                      <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                         {po.items.map((i, k) => (
                           <div key={k}>+ {(state.ingredients.find(ig => ig.id === i.ingredientId)||{}).name} ({i.baseQty})</div>
                         ))}
                      </td>
                      <td style={{ padding: '12px', color: 'var(--danger)', fontWeight: 'bold' }}>{po.totalAmount.toLocaleString('vi-VN')} đ</td>
                      <td style={{ padding: '12px' }}>
                         {po.status === 'Paid' ? (
                           <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(46, 160, 67, 0.2)', color: 'var(--success)', fontSize: '0.85rem' }}>Đã Trả Bằng Tiền Quỹ Thu Thực</span>
                         ) : (
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                              <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(218, 54, 51, 0.2)', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 'bold' }}>TREO SỔ NỢ (NGƯỜI KÉO HÀNG TRƯỚC VỐN SAU)</span>
                              <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => payDebt(po.id)}>
                                <CreditCard size={14}/> Trả Nợ Bằng Quỹ Ngay Mới
                              </button>
                           </div>
                         )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                         <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                           <button className="btn btn-ghost" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px' }} onClick={() => editPO(po)} title="Sửa PO"><Edit size={18}/></button>
                           <button className="btn btn-ghost" style={{ background: 'rgba(218,54,51,0.1)', color: 'var(--danger)', padding: '8px' }} onClick={() => deletePO(po.id)} title="Xóa PO"><Trash2 size={18}/></button>
                         </div>
                      </td>
                    </tr>
                  )
                })}
                {state.purchaseOrders.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color:'var(--text-secondary)' }}>Lịch sử giao dịch nhập sạch bách, chưa chạy dữ liệu.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Suppliers */}
      {activeTab === 'suppliers' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h3>Thẻ Thiết Lập Liên Danh Nhà Cung Cấp Nhập Hàng</h3>
            <button className="btn btn-primary" onClick={() => { setSupplierForm({id:'', name:'', phone:'', email:''}); setShowSupplierForm(true); }}>
              <Plus size={16} /> Liên Kết Mới
            </button>
          </div>

          {showSupplierForm && (
            <form onSubmit={saveSupplier} style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) 1fr 1fr auto', gap: '12px', marginBottom: '24px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px' }}>
              <input required style={InputStyle} placeholder="Tên nhà cung cấp chốt bill" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} />
              <input style={InputStyle} placeholder="Dây Điện Thoại Thường Trực" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
              <input style={InputStyle} placeholder="Địa chỉ / Note Phụ Trợ" value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary">Lưu Bộ Khai Báo</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowSupplierForm(false)}>Hủy Form</button>
              </div>
            </form>
          )}

          <div style={{overflowX:'auto'}}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth:'500px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px' }}>Bộ Lệnh Cấp Mã</th>
                  <th style={{ padding: '12px' }}>Sổ Thuơng Hiệu Đối Ngoại</th>
                  <th style={{ padding: '12px' }}>Số Phôn Ngoại Giao</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Luồng Hủy Sửa</th>
                </tr>
              </thead>
              <tbody>
                {state.suppliers.map(sup => (
                  <tr key={sup.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px' }}>{sup.id}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{sup.name}</td>
                    <td style={{ padding: '12px' }}>{sup.phone}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button className="btn btn-ghost" onClick={() => { setSupplierForm({...sup}); setShowSupplierForm(true); }}><Edit size={16}/></button>
                      <button className="btn btn-ghost" style={{color: 'var(--danger)'}} onClick={() => deleteSupplier(sup.id)}><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Inventory;
