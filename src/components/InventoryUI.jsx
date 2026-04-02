import React, { useState } from 'react';
import { Package, Plus, Search, Edit, Trash2, CheckSquare, Square, Phone, Mail, MapPin, Eye, Printer, X, Filter } from 'lucide-react';
import { useLocalList } from '../hooks/useLocalList';
import ModuleLayout from './ModuleLayout';
import SortHeader from './SortHeader';
import CurrencyInput from './CurrencyInput';
import SmartTable from './SmartTable';

const InventoryUI = ({
  ingredients,
  suppliers,
  purchaseOrders,
  onSaveIngredient,
  onDeleteIngredient,
  onSaveSupplier,
  onDeleteSupplier
}) => {
  const [activeTab, setActiveTab] = useState('ingredient');
  
  // Local hooks for UI states (search, sort, selection)
  const ingListState = useLocalList(ingredients);
  const supListState = useLocalList(suppliers);
  
  const currentListState = activeTab === 'ingredient' ? ingListState : supListState;
  
  // Forms
  const [ingForm, setIngForm] = useState({ id: '', name: '', stock: 0, unit: '', buyUnit: '', conversionRate: 1, cost: 0, buyPrice: 0, minStock: 0, lastPurchaseDate: new Date().toISOString().split('T')[0] });
  const [supForm, setSupForm] = useState({ id: '', name: '', phone: '', email: '', address: '', notes: '', debt: 0 });
  
  const [expandedIngId, setExpandedIngId] = useState(null);

  // Compute last purchase from purchase orders map (purely calculated from props)
  const lastPurchaseMap = React.useMemo(() => {
    const map = {};
    (ingredients || []).forEach(ing => {
      if (ing.lastPurchaseDate) {
        map[ing.id] = new Date(ing.lastPurchaseDate).getTime();
      }
    });
    (purchaseOrders || []).forEach(po => {
      const tTime = new Date(po.date || po.createdAt).getTime();
        (po.items || []).forEach(item => {
        const existing = map[item.ingredientId] || 0;
        if (tTime > existing) map[item.ingredientId] = tTime;
      });
    });
    return map;
  }, [ingredients, purchaseOrders]);

  const saveIngredient = (e) => {
    e.preventDefault();
    const payload = { ...ingForm, stock: Number(ingForm.stock), cost: Number(ingForm.cost), buyPrice: Number(ingForm.buyPrice), minStock: Number(ingForm.minStock), conversionRate: Number(ingForm.conversionRate) || 1 };
    onSaveIngredient(payload);
    currentListState.setShowForm(false);
    setIngForm({ id: '', name: '', stock: 0, unit: '', buyUnit: '', conversionRate: 1, cost: 0, buyPrice: 0, minStock: 0, lastPurchaseDate: new Date().toISOString().split('T')[0] });
  };

  const saveSupplier = (e) => {
    e.preventDefault();
    const payload = { ...supForm, debt: Number(supForm.debt) };
    onSaveSupplier(payload);
    currentListState.setShowForm(false);
    setSupForm({ id: '', name: '', phone: '', email: '', address: '', notes: '', debt: 0 });
  };

  const openIngEdit = (i) => { 
     setIngForm({ ...i, buyPrice: i.buyPrice || (i.cost * (i.conversionRate || 1)), lastPurchaseDate: i.lastPurchaseDate ? i.lastPurchaseDate.split('T')[0] : new Date().toISOString().split('T')[0] }); 
     currentListState.setShowForm(true); 
  };
  const openSupEdit = (s) => { setSupForm(s); currentListState.setShowForm(true); };

  const handleBuyPriceChange = (val) => {
     const bp = Number(val) || 0;
     const cr = Number(ingForm.conversionRate) || 1;
     setIngForm({ ...ingForm, buyPrice: val, cost: bp / cr });
  };

  const handleConvRateChange = (val) => {
     const cr = Number(val) || 1;
     const bp = Number(ingForm.buyPrice) || 0;
     setIngForm({ ...ingForm, conversionRate: val, cost: bp / cr });
  };

  const extraFilters = (
    <div style={{ display: 'flex', background: 'var(--surface-variant)', borderRadius: '8px', padding: '4px', border: '1px solid var(--surface-border)' }}>
      <button className={`btn ${activeTab === 'ingredient' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setActiveTab('ingredient'); currentListState.clearSelection(); }} style={{ padding: '6px 12px' }}>Nguyên Liệu</button>
      <button className={`btn ${activeTab === 'supplier' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setActiveTab('supplier'); currentListState.clearSelection(); }} style={{ padding: '6px 12px' }}>Nhà Cung Cấp</button>
    </div>
  );

  const renderActiveList = () => {
    if (activeTab === 'ingredient') {
      const ingColumns = [
        { key: 'name', label: 'Tên Nguyên Liệu/Vật Tư', sortable: true, render: val => <span style={{fontWeight: 600}}>{val}</span> },
        { 
          key: 'stock', 
          label: 'Lượng Tồn Kho', 
          sortable: true,
          render: (val, item) => {
             const isLowStock = item.stock <= item.minStock;
             return (
               <>
                 <div>
                   <span style={{ fontSize: '15px', fontWeight: 800, color: isLowStock ? 'var(--danger)' : 'var(--text-primary)' }}>{item.stock}</span>
                   <span style={{fontSize:'12px', color:'var(--text-secondary)', marginLeft: '4px'}}>{item.buyUnit || item.unit}</span>
                 </div>
                 {item.buyUnit && item.conversionRate > 1 && (
                   <div style={{ fontSize: '12px', color: 'var(--primary)', marginTop: '4px', fontWeight: 600, background: 'rgba(59, 130, 246, 0.1)', padding: '2px 8px', borderRadius: '12px', display: 'inline-block' }}>
                     &asymp; {(item.stock * item.conversionRate).toLocaleString('vi-VN')} {item.unit}
                   </div>
                 )}
               </>
             )
          } 
        },
        {
          key: 'minStock',
          label: 'Cảnh Báo & Tuổi Tồn',
          sortable: true,
          render: (val, item) => {
             const isLowStock = item.stock <= item.minStock;
             const lastDateStr = lastPurchaseMap[item.id];
             let ageNode = <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>- Chưa nhập hàng -</span>;
             
             if (lastDateStr) {
                const todayMidnight = new Date().setHours(0,0,0,0);
                const purchaseMidnight = new Date(lastDateStr).setHours(0,0,0,0);
                const diffDays = Math.floor((todayMidnight - purchaseMidnight) / (1000 * 60 * 60 * 24));
                ageNode = (
                    <div style={{ fontSize: '11px', fontWeight: 700, color: diffDays > 30 ? 'var(--danger)' : diffDays > 7 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                        {diffDays === 0 ? 'Mới nhập hôm nay' : `Tồn ${diffDays} ngày (${new Date(lastDateStr).toLocaleDateString('vi-VN')})`}
                    </div>
                );
             }

             return (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {isLowStock ? <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '11px', background: '#FEF2F2', padding: '2px 6px', borderRadius: '4px', width: 'fit-content' }}>Dưới mức an toàn</span> : <span style={{ color: 'var(--success)', fontSize: '11px', fontWeight: 600 }}>Tồn kho an toàn</span>}
                  {ageNode}
               </div>
             )
          }
        },
        {
          key: 'buyPrice',
          label: 'Giá Nhập / ĐVT Gốc',
          sortable: true,
          render: (val, item) => item.buyUnit ? (
            <span>{Number((item.buyPrice || ((Number(item.cost)||0) * (Number(item.conversionRate) || 1))) || 0).toLocaleString('vi-VN')} đ <span style={{fontSize:'12px', color:'var(--text-secondary)'}}>/ {item.buyUnit}</span></span>
          ) : <span style={{color: 'var(--text-secondary)', fontStyle: 'italic'}}>- Không có ĐVT Gốc -</span>
        },
        {
          key: 'cost',
          label: 'Giá Định Mức (Cost)',
          sortable: true,
          render: (val, item) => (
             <><strong>{Number(item.cost || 0).toLocaleString('vi-VN')} đ</strong> <span style={{fontSize:'12px', color:'var(--text-secondary)'}}>/ {item.unit}</span></>
          )
        }
      ];

      return (
        <SmartTable 
           data={currentListState.filteredActiveItems}
           columns={ingColumns}
           selectable={true}
           selectedIds={currentListState.selectedIds}
           onSelectToggle={(id) => currentListState.toggleSelection(id)}
           onSelectAll={() => {
              if (currentListState.selectedIds.length === currentListState.filteredActiveItems.length && currentListState.filteredActiveItems.length > 0) currentListState.clearSelection();
              else currentListState.setSelectedIds(currentListState.filteredActiveItems.map(i => i.id));
           }}
           onEdit={(i) => openIngEdit(i)}
           onDelete={(i) => onDeleteIngredient(i.id)}
           confirmBeforeDelete={true}
           extraRowActions={(i) => (
              <button className="btn btn-ghost" title="Lịch sử nhập" onClick={(e) => { e.stopPropagation(); setExpandedIngId(i.id); }} style={{ padding: '6px' }}><Eye size={16} color="var(--primary)"/></button>
           )}
           emptyMessage="Không có dữ liệu nguyên liệu."
        />
      );
    } else {
      const supColumns = [
         { key: 'name', label: 'Tên Hãng/NCC', sortable: true, render: val => <span style={{fontWeight: 800, fontSize: '14px'}}>{val}</span> },
         { key: 'phone', label: 'Điện Thoại', sortable: true, render: val => <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} color="var(--primary)"/> {val || '---'}</div> },
         { key: 'email', label: 'Email', sortable: true, render: val => <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Mail size={14} color="var(--primary)"/> {val || '---'}</div> },
         { key: 'address', label: 'Địa Chỉ', render: val => <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={14} color="var(--primary)"/> {val || '---'}</div> },
         { key: 'debt', label: 'Công Nợ', sum: true, align: 'right', sortable: true, render: val => <span style={{color: 'var(--danger)', fontWeight: 800}}>{Number(val||0).toLocaleString('vi-VN')} đ</span> }
      ];

      return (
        <SmartTable 
           data={currentListState.filteredActiveItems}
           columns={supColumns}
           selectable={true}
           selectedIds={currentListState.selectedIds}
           onSelectToggle={(id) => currentListState.toggleSelection(id)}
           onSelectAll={() => {
              if (currentListState.selectedIds.length === currentListState.filteredActiveItems.length && currentListState.filteredActiveItems.length > 0) currentListState.clearSelection();
              else currentListState.setSelectedIds(currentListState.filteredActiveItems.map(i => i.id));
           }}
           onEdit={(s) => openSupEdit(s)}
           onDelete={(s) => onDeleteSupplier(s.id)}
           confirmBeforeDelete={true}
           emptyMessage="Chưa có nhà cung cấp nào được cấu hình."
        />
      );
    }
  };

  const renderForm = () => {
    if (activeTab === 'ingredient') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Tên Nguyên Liệu / Vật Tư:</label>
            <input required className="form-input" placeholder="VD: Bò Mỹ, Cà phê hạt..." value={ingForm.name} onChange={e => setIngForm({...ingForm, name: e.target.value})} />
          </div>
          
          <div style={{ padding: '20px', background: 'var(--surface-variant)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
             <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--primary)', marginBottom: '16px' }}>Thiết lập Chuyển Đổi Đơn Vị Đo Lường</h4>
             <div style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 24px minmax(120px, 1fr)', gap: '16px', alignItems: 'center' }}>
                <div>
                   <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>1 {ingForm.buyUnit || '[ĐVT Nhập]'} = (Chia ra)</label>
                   <input required type="number" step="0.001" className="form-input" placeholder="Hệ số quy đổi" value={ingForm.conversionRate} onChange={e => handleConvRateChange(e.target.value)} />
                 </div>
                <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)' }}>➔</div>
                <div>
                   <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>X {ingForm.unit || '[ĐVT Tiêu Dùng]'}</label>
                   <input readOnly disabled className="form-input" value="Bán ra" style={{ background: '#E5E7EB', color: '#6B7280' }} />
                </div>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>ĐVT Nhập (Nguyên Lô):</label>
              <input required className="form-input" placeholder="VD: Thùng, Can, Mã, Bao..." value={ingForm.buyUnit} onChange={e => setIngForm({...ingForm, buyUnit: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>ĐVT Bán/Định mức (Lẻ):</label>
              <input required className="form-input" placeholder="VD: Kg, Lít, Gram, ML..." value={ingForm.unit} onChange={e => setIngForm({...ingForm, unit: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Giá Nhập (Theo lô to/ĐVT Nhập):</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', borderRadius: '8px', paddingRight: '12px', border: '1px solid var(--success)', overflow: 'hidden' }}>
                 <CurrencyInput required style={{ border: 'none', background: 'transparent', boxShadow: 'none', color: 'var(--success)', fontWeight: 'bold', flex: 1 }} 
                    value={ingForm.buyPrice} onChange={val => handleBuyPriceChange(val)} />
                 <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>đ / {ingForm.buyUnit || 'ĐVT Nhập'}</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Giá Định Mức (Tính tự động theo 1 lẻ):</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F3F4F6', borderRadius: '8px', padding: '0 12px', border: '1px solid var(--surface-border)' }}>
                 <input disabled type="number" className="form-input" style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontWeight: 'bold', flex: 1, paddingLeft: 0 }} value={(Number(ingForm.cost) || 0).toFixed(0)} />
                 <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>đ / {ingForm.unit || '[Lẻ]'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(150px, 1fr)', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Tồn Kho (Theo Lô To):</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', borderRadius: '8px', paddingRight: '12px', border: '1px solid var(--surface-border)', overflow: 'hidden' }}>
                <input required type="number" step="0.01" className="form-input" style={{ border: 'none', background: 'transparent', boxShadow: 'none', flex: 1 }} value={ingForm.stock} onChange={e => setIngForm({...ingForm, stock: e.target.value})} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{ingForm.buyUnit || 'ĐVT Nhập'}</span>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Mức Cảnh Báo Sắp Hết (Lô To):</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', borderRadius: '8px', paddingRight: '12px', border: '1px solid var(--danger)', overflow: 'hidden' }}>
                <input required type="number" step="0.01" className="form-input" style={{ border: 'none', background: 'transparent', boxShadow: 'none', flex: 1 }} value={ingForm.minStock} onChange={e => setIngForm({...ingForm, minStock: e.target.value})} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{ingForm.buyUnit || 'ĐVT Nhập'}</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
             <button className="btn btn-ghost" onClick={() => currentListState.setShowForm(false)}>Hủy bỏ</button>
             <button className="btn btn-primary" onClick={saveIngredient}>Lưu Nguyên Liệu</button>
          </div>
        </div>
      );
    } else {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 2fr) minmax(150px, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Tên Công Ty / Nhà Cung Cấp:</label>
              <input required className="form-input" placeholder="VD: Công ty..." value={supForm.name} onChange={e => setSupForm({...supForm, name: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Nợ Khởi Ước (Nếu có):</label>
              <CurrencyInput style={{ color: 'var(--danger)', fontWeight: 'bold' }} value={supForm.debt} onChange={val => setSupForm({...supForm, debt: val})} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Số điện thoại LH:</label>
              <input className="form-input" placeholder="090..." value={supForm.phone} onChange={e => setSupForm({...supForm, phone: e.target.value})} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Email LH:</label>
              <input className="form-input" type="email" placeholder="@..." value={supForm.email} onChange={e => setSupForm({...supForm, email: e.target.value})} />
            </div>
          </div>
          <div>
             <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Địa chỉ Kho / Cty:</label>
             <input className="form-input" value={supForm.address} onChange={e => setSupForm({...supForm, address: e.target.value})} />
          </div>
          <div>
             <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Ghi chú chung:</label>
             <textarea className="form-input" rows="2" placeholder="Ghi chú về việc giao nhận, chất lượng..." value={supForm.notes} onChange={e => setSupForm({...supForm, notes: e.target.value})} />
          </div>
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
             <button className="btn btn-ghost" onClick={() => currentListState.setShowForm(false)}>Hủy bỏ</button>
             <button className="btn btn-primary" onClick={saveSupplier}>Lưu Đối Tác NCC</button>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <ModuleLayout
        title="Quản Trị Kho, BTP & Đối Tác"
        description="Quản lý chi tiết lượng vật tư theo quy đổi và nợ nhà cung cấp đại lý."
        listState={currentListState}
        extraFilters={extraFilters}
        formTitle={
           activeTab === 'ingredient'
             ? (ingForm.id ? `Cập nhật Nguyên Liệu: ${ingForm.name}` : 'Khai Báo Nguyên Liệu / BTP')
             : (supForm.id ? `Cập nhật NCC: ${supForm.name}` : 'Thêm mới Nhà Cung Cấp Đối Tác')
        }
        renderActiveList={renderActiveList}
        renderForm={renderForm}
      />

      {expandedIngId && (() => {
         const ing = ingredients.find(i => i.id === expandedIngId);
         if (!ing) return null;
         
         // Lịch sử nhập hàng cho món này (xuyên suốt các purchaseOrders props)
         const history = (purchaseOrders || []).filter(po => (po.items || []).some(it => it.ingredientId === ing.id));
         const sorted = [...history].sort((a,b)=> new Date(b.date) - new Date(a.date));
         const latestPO = sorted.length > 0 ? sorted[0] : null;
         const latestItem = latestPO ? latestPO.items.find(it => it.ingredientId === ing.id) : null;
         const supplier = latestPO ? (suppliers || []).find(s => s.id === latestPO.supplierId) : null;

         return (
           <div className="modal-overlay" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
             <div className="glass-panel printable-area" style={{ width: '600px', maxWidth: '95vw', padding: '32px', position: 'relative', background: 'var(--bg-color)', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
                <button className="btn btn-ghost no-print" onClick={() => setExpandedIngId(null)} style={{ position: 'absolute', top: '24px', right: '24px', padding: '8px', zIndex: 10 }}><X size={20}/></button>
                
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: 'var(--primary)', borderBottom: '2px solid var(--surface-border)', paddingBottom: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                   <Package size={28}/> BÁO CÁO HỒ SƠ VẬT TƯ
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                   <div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>TÊN NGUYÊN LIỆU</p>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800 }}>{ing.name}</h3>
                   </div>
                   <div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>LƯỢNG TỒN HIỆN TẠI</p>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 900, color: (ing.stock <= ing.minStock) ? 'var(--danger)' : 'var(--success)' }}>
                         {ing.stock} <span style={{fontSize:'14px'}}>{ing.buyUnit || ing.unit}</span>
                      </h3>
                   </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px', background: 'var(--surface-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                   <div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>GIÁ NHẬP QUY ĐỊNH (GỐC)</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 800 }}>{Number((ing.buyPrice || ((Number(ing.cost)||0) * (Number(ing.conversionRate)||1))) || 0).toLocaleString('vi-VN')} đ <span style={{fontSize:'12px', color:'var(--text-secondary)', fontWeight: 500}}>/ {ing.buyUnit || ing.unit}</span></p>
                   </div>
                   <div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>GIÁ ĐỊNH MỨC (TÍNH COST)</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 800 }}>{Number(ing.cost || 0).toLocaleString('vi-VN')} đ <span style={{fontSize:'12px', color:'var(--text-secondary)', fontWeight: 500}}>/ {ing.unit}</span></p>
                   </div>
                </div>

                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>THÔNG TIN ĐỢT NHẬP HÀNG GẦN NHẤT</h4>
                {latestPO ? (
                  <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Ngày chốt đơn:</span>
                        <strong style={{ fontSize: '14px' }}>{new Date(latestPO.date).toLocaleString('vi-VN')}</strong>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Khối lượng đã nhập:</span>
                        <strong style={{ fontSize: '15px', color: 'var(--primary)' }}>+ {latestItem?.baseQty} {ing.buyUnit || ing.unit}</strong>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Đơn giá thực tế đợt này:</span>
                        <strong style={{ fontSize: '15px', color: 'var(--danger)' }}>{(latestItem?.cost || 0).toLocaleString('vi-VN')} đ <span style={{fontSize:'12px', color:'var(--text-secondary)'}}>/ {ing.buyUnit || ing.unit}</span></strong>
                     </div>
                     <div style={{ width: '100%', height: '1px', background: '#E2E8F0', margin: '4px 0' }}/>
                     <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Nguồn cung cấp:</span>
                        <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{supplier?.name || 'Vô danh'}</strong>
                     </div>
                  </div>
                ) : (
                  <p style={{ background: '#FEF2F2', color: 'var(--danger)', padding: '16px', borderRadius: '8px', border: '1px dashed #FECACA', fontWeight: 600, fontSize: '14px', textAlign: 'center' }}>Vật tư này chưa từng được nạp qua Phiếu Nhập Hàng hệ thống.</p>
                )}

                <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                   <button className="btn btn-outline" style={{ padding: '12px 24px', fontWeight: 700, borderColor: 'var(--text-primary)', color: 'var(--text-primary)' }} onClick={() => window.print()}>
                      <Printer size={18} style={{marginRight: '8px'}}/> In Báo Cáo Này
                   </button>
                </div>
             </div>
           </div>
         );
      })()}
    </>
  );
};

export default InventoryUI;
