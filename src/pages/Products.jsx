import React, { useState } from 'react';
import { Coffee, Plus, Search, Edit, Trash2, ListPlus, X, Copy, Eye, PieChart } from 'lucide-react';
import { useData } from '../context/DataContext';

const Products = () => {
  const { state, dispatch } = useData();
  const [search, setSearch] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', unit: '', category: '', price: '', image: '', recipe: [] });
  const [recipeItem, setRecipeItem] = useState({ ingredientId: '', qty: '', unitMode: 'base' });

  const [viewingProduct, setViewingProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterCategory, setFilterCategory] = useState('all');

  // Recursive Helper for Cost
  const getRecipeItemCost = (r) => {
      const ing = state.ingredients.find(i => i.id === r.ingredientId);
      if (ing) {
         if (r.unitMode === 'buy') return ing.cost * (ing.conversionRate || 1) * r.qty;
         if (r.unitMode === 'divide') return ing.cost / r.qty;
         return ing.cost * r.qty;
      }
      const prod = state.products.find(p => p.id === r.ingredientId);
      if (prod) {
         const prodCost = calculateTotalCost(prod.recipe);
         return r.unitMode === 'divide' ? (prodCost / r.qty) : (prodCost * r.qty);
      }
      return 0;
  };

  const calculateTotalCost = (recipe) => {
    if (!recipe || recipe.length === 0) return 0;
    return recipe.reduce((acc, r) => acc + getRecipeItemCost(r), 0);
  };

  // Recursive Helper for Max Portions
  const getEntityMaxPortions = (entityId, requiredQty, unitMode = 'base') => {
     if (requiredQty <= 0) return Infinity;
     const ing = state.ingredients.find(i => i.id === entityId);
     if (ing) {
        let requiredBaseQty = requiredQty;
        if (unitMode === 'buy') requiredBaseQty = requiredQty * (ing.conversionRate || 1);
        if (unitMode === 'divide') requiredBaseQty = 1 / requiredQty;
        return Math.floor(ing.stock / requiredBaseQty);
     }
     const prod = state.products.find(p => p.id === entityId);
     if (prod) {
        let requiredProdQty = requiredQty;
        if (unitMode === 'divide') requiredProdQty = 1 / requiredQty;
        const prodMax = calculateMaxPortions(prod.recipe);
        return Math.floor(prodMax / requiredProdQty);
     }
     return 0;
  };

  const calculateMaxPortions = (recipe) => {
    if (!recipe || recipe.length === 0) return 0;
    let max = Infinity;
    recipe.forEach(r => {
      const cap = getEntityMaxPortions(r.ingredientId, r.qty, r.unitMode);
      if (cap < max) max = cap;
    });
    return max === Infinity ? 0 : max;
  };

  const saveProduct = (e) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price) };
    if (form.id) dispatch({ type: 'UPDATE_PRODUCT', payload });
    else dispatch({ type: 'ADD_PRODUCT', payload });
    setShowForm(false);
  };

  const deleteProduct = (id) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
  };

  const duplicateProduct = (p) => {
    const clone = JSON.parse(JSON.stringify(p));
    delete clone.id;
    clone.name = `${clone.name} (Bản sao)`;
    setForm(clone);
    setShowForm(true);
  };

  const addRecipeItem = () => {
    if (!recipeItem.ingredientId || !recipeItem.qty) return;
    const exist = form.recipe.find(r => r.ingredientId === recipeItem.ingredientId);
    if (exist) return alert('Thành phần này đã có! Vui lòng sửa lượng ở bảng bên dưới.');
    setForm(prev => ({ ...prev, recipe: [...prev.recipe, { ...recipeItem, qty: Number(recipeItem.qty) }] }));
    setRecipeItem({ ingredientId: '', qty: '', unitMode: 'base' });
  };

  const removeRecipeItem = (index) => setForm(prev => ({ ...prev, recipe: prev.recipe.filter((_, i) => i !== index) }));
  const updateRecipeQty = (index, newQty) => setForm(prev => { const updated = [...prev.recipe]; updated[index].qty = Number(newQty); return { ...prev, recipe: updated }; });
  const updateRecipeUnitMode = (index, newMode) => setForm(prev => { const updated = [...prev.recipe]; updated[index].unitMode = newMode; return { ...prev, recipe: updated }; });

  const getEntityDisplayDetails = (id) => {
      const ing = state.ingredients.find(i => i.id === id);
      if (ing) return { type: 'ingredient', name: ing.name, baseUnit: ing.unit, buyUnit: ing.buyUnit, stock: ing.stock, cost: ing.cost };
      const prod = state.products.find(p => p.id === id);
      if (prod) return { type: 'product', name: prod.name, baseUnit: prod.unit || 'Suất', buyUnit: null, stock: calculateMaxPortions(prod.recipe), cost: calculateTotalCost(prod.recipe) };
      return null;
  }

  const InputStyle = { background: 'rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)', color: 'white', padding: '10px', borderRadius: '8px', width: '100%', outline: 'none' };
  
  const calculatedCost = calculateTotalCost(form.recipe);
  const maxPortions = calculateMaxPortions(form.recipe);

  const selectedNode = getEntityDisplayDetails(recipeItem.ingredientId);

  const getDraftCost = () => {
     if (!recipeItem.ingredientId || !Number(recipeItem.qty)) return 0;
     return getRecipeItemCost({ ...recipeItem, qty: Number(recipeItem.qty) });
  };
  const draftCost = getDraftCost();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Coffee color="var(--primary)" /> Danh Mục Cấu Thành Món Ăn (Recipe Đa Tầng)
          </h2>
          <p style={{ margin: 0, marginTop: '4px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Hỗ trợ nhúng Thực Đơn Phụ (Ví dụ: Nước Sốt 10 hộp) vào Thực Đơn Chính (Combo Gà) đệ quy tính Năng Lực chuẩn xác.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px' }}>
             <button className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('grid')} style={{ padding: '6px 12px' }}>Lưới Thẻ</button>
             <button className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('list')} style={{ padding: '6px 12px' }}>Bảng Liệt Kê</button>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm({ id: '', name: '', unit: '', category: '', price: '', image: '', recipe: [] }); setShowForm(true); }}>
            <Plus size={18} /> Chế Biến Món Mới
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-color)', zIndex: 10 }}>
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>{form.id ? `Chỉnh sửa: ${form.name}` : 'Mô tả Món Ăn Mới (Menu POS)'}</h3>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ padding: '8px' }}><X size={20}/></button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              {/* Thông tin Kinh Doanh & Cost */}
              <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom:'6px', display:'block' }}>Tên hiển thị Kinh Doanh:</label>
                  <input required style={InputStyle} placeholder="VD: Combo Gà 1/2 Con" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom:'6px', display:'block' }}>Nhóm danh mục:</label>
                    <select required style={InputStyle} value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                       <option value="">-- Mời chọn Danh Mục POS --</option>
                       {state.categories.filter(c => c.type === 'menu').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom:'6px', display:'block' }}>ĐVT Bán (Suất/Hộp/Khay):</label>
                    <input required style={InputStyle} placeholder="Suất" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} />
                  </div>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Giá vốn Cấu Thành Nhóm (VNĐ):</p>
                  <h2 style={{ margin: '8px 0', color: 'var(--warning)', fontWeight: 700 }}>{Math.round(calculatedCost).toLocaleString('vi-VN')} đ</h2>
                  
                  <div style={{ width: '100%', height: '1px', background: 'var(--surface-border)', margin: '12px 0' }}/>
                  
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Hiện đáp ứng đủ Tồn Nguyên liệu để làm:</p>
                  <h3 style={{ margin: '8px 0', color: maxPortions > 5 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{maxPortions} {form.unit || 'Suất'}</h3>
                </div>
                
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom:'6px', display:'block' }}>Giá Bán POS (Khách trả) (VNĐ):</label>
                  <input required type="number" style={{...InputStyle, borderColor: 'var(--success)', fontSize: '1.1rem'}} placeholder="VD: 150000" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                
                <button className="btn btn-primary" style={{ padding: '14px', fontSize: '1.1rem', marginTop: 'auto' }} onClick={saveProduct}>Đóng Gói Thành Phẩm</button>
              </div>

              {/* Recipe Đa Tầng */}
              <div style={{ flex: '2 1 500px', borderLeft: '1px solid var(--surface-border)', paddingLeft: '24px' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, marginBottom: '16px' }}><ListPlus size={18} /> Phân định Định mức Đa Cấu Trúc (Đa Tầng)</h4>
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                    <div style={{ flex: 1.5 }}>
                      <select style={InputStyle} value={recipeItem.ingredientId} onChange={e => setRecipeItem({...recipeItem, ingredientId: e.target.value, unitMode: 'base'})}>
                        <option value="">-- Kéo Vật Tư HOẶC Món Bếp (Đã sơ chế) --</option>
                        <optgroup label="[Kho Lõi] Nguồn Vật Tư Thô">
                           {state.ingredients.map(ing => <option key={ing.id} value={ing.id}>[K] {ing.name} ({Math.round(ing.cost).toLocaleString('vi-VN')} đ/{ing.unit})</option>)}
                        </optgroup>
                        <optgroup label="[Chế Phẩm] Món Ăn Bếp Đã Pha Trộn">
                           {state.products.filter(p => p.id !== form.id).map(p => <option key={p.id} value={p.id}>[Bếp] {p.name} ({Math.round(calculateTotalCost(p.recipe)).toLocaleString('vi-VN')} đ/{p.unit||'Suất'})</option>)}
                        </optgroup>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <select style={InputStyle} value={recipeItem.unitMode} onChange={e => setRecipeItem({...recipeItem, unitMode: e.target.value})} disabled={!selectedNode}>
                        {selectedNode && selectedNode.type === 'ingredient' && <option value="base">Lấy theo: {selectedNode.baseUnit}</option>}
                        {selectedNode && selectedNode.type === 'ingredient' && selectedNode.buyUnit && <option value="buy">Lấy theo: {selectedNode.buyUnit}</option>}
                        {selectedNode && selectedNode.type === 'product' && <option value="base">Lấy theo: {selectedNode.baseUnit}</option>}
                        {selectedNode && <option value="divide">Chia (Cắt 1 làm X phần)</option>}
                        {!selectedNode && <option value="">-- Tính Định Lượng --</option>}
                      </select>
                    </div>
                    <div style={{ width: '100px' }}>
                      <input type="number" step="0.01" style={InputStyle} placeholder="SL/Phần" value={recipeItem.qty} onChange={e => setRecipeItem({...recipeItem, qty: e.target.value})} />
                    </div>
                    {recipeItem.ingredientId && recipeItem.qty > 0 && (
                       <div style={{ display: 'flex', alignItems: 'center', padding: '0 12px', color: 'var(--warning)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          = {Math.round(draftCost).toLocaleString('vi-VN')} đ
                       </div>
                    )}
                    <button type="button" className="btn btn-primary" onClick={addRecipeItem}>Thêm</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {form.recipe.length === 0 && <span style={{ fontSize: '0.9rem', color:'var(--text-secondary)', fontStyle: 'italic'}}>Thực đơn hiện tại là khung rỗng, chưa rải nguyên liệu lưới.</span>}
                    {form.recipe.map((r, i) => {
                      const node = getEntityDisplayDetails(r.ingredientId);
                      if (!node) return null;
                      const actCostTotal = getRecipeItemCost(r);

                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: `3px solid ${node.type === 'product' ? 'var(--warning)' : 'var(--secondary)'}` }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>[{node.type === 'product' ? 'Bếp' : 'K'}] {node.name}</span>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              <span>Hao hụt vốn con: <strong style={{color:'var(--warning)'}}>{Math.round(actCostTotal).toLocaleString('vi-VN')} đ</strong> </span>
                              | <span style={{ color: 'var(--text-secondary)' }}>Giá Gốc: {Math.round(node.cost).toLocaleString('vi-VN')} đ/{node.baseUnit} </span>
                              | <span style={{ color: node.stock > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                {node.type === 'product' ? `Khả năng mượn rễ 1 lượt: ${node.stock} ${node.baseUnit}` : `Tồn Kho Lõi: ${parseFloat(Number(node.stock).toFixed(2))} ${node.baseUnit}`}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="number" step="0.01" value={r.qty} onChange={(e) => updateRecipeQty(i, e.target.value)} 
                                   style={{ width: '70px', padding: '6px', textAlign: 'center', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '4px' }}/>
                            <select value={r.unitMode} onChange={(e) => updateRecipeUnitMode(i, e.target.value)} style={{ padding: '6px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--surface-border)', color: 'white', borderRadius: '4px' }}>
                                <option value="base">{node.baseUnit}</option>
                                {node.type === 'ingredient' && node.buyUnit && <option value="buy">{node.buyUnit}</option>}
                                <option value="divide">Chia (1/X)</option>
                            </select>
                            
                            <button type="button" className="btn btn-ghost" style={{ padding: '8px', color: 'var(--danger)' }} onClick={() => removeRecipeItem(i)}><Trash2 size={18} /></button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetail && viewingProduct && (() => {
        const totalCost = calculateTotalCost(viewingProduct.recipe);
        const categoryBreakdown = {};
        
        viewingProduct.recipe.forEach(r => {
          const detail = getEntityDisplayDetails(r.ingredientId);
          if (detail) {
            const cost = getRecipeItemCost(r);
            const cat = detail.type === 'ingredient' ? (detail.category || 'Khác') : 'Món Chế Biến';
            categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + cost;
          }
        });

        const sortedCats = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-color)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <PieChart size={20} /> Phân Tích Cấu Thành: {viewingProduct.name}
                </h3>
                <button className="btn btn-ghost" onClick={() => setShowDetail(false)}><X size={20}/></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Biểu đồ % chi phí */}
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                  <h4 style={{ margin: 0, marginBottom: '16px', fontSize: '1rem' }}>Tỷ lệ % Chi phí theo Nhóm</h4>
                  <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', marginBottom: '16px' }}>
                    {sortedCats.map(([cat, val], idx) => {
                      const perc = (val / totalCost) * 100;
                      const colors = ['#f97316', '#3b82f6', '#2ea043', '#e3b341', '#da3633', '#8b949e'];
                      return (
                        <div key={cat} style={{ width: `${perc}%`, height: '100%', background: colors[idx % colors.length], transition: 'width 0.5s ease' }} title={`${cat}: ${perc.toFixed(1)}%`} />
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {sortedCats.map(([cat, val], idx) => {
                      const perc = (val / totalCost) * 100;
                      const colors = ['#f97316', '#3b82f6', '#2ea043', '#e3b341', '#da3633', '#8b949e'];
                      return (
                        <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: colors[idx % colors.length] }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{cat}:</span>
                          <span style={{ fontWeight: 600 }}>{perc.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Danh sách nguyên liệu */}
                <div>
                  <h4 style={{ margin: 0, marginBottom: '12px', fontSize: '1rem' }}>Danh sách Định mức (Recipe)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {viewingProduct.recipe.map((r, i) => {
                      const node = getEntityDisplayDetails(r.ingredientId);
                      const cost = getRecipeItemCost(r);
                      return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{node?.name}</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lượng: {r.qty} {r.unitMode === 'divide' ? `1/${r.qty}` : (r.unitMode === 'buy' ? node?.buyUnit : node?.baseUnit)}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600, color: 'var(--warning)' }}>{Math.round(cost).toLocaleString('vi-VN')} đ</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{((cost / totalCost) * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Tổng giá vốn cấu thành:</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--warning)' }}>{Math.round(totalCost).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Screen: Grid Cards */}
      <div className="glass-panel" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: '8px', minWidth: '300px', border: '1px solid var(--surface-border)' }}>
              <Search size={18} color="var(--text-secondary)" />
              <input 
                placeholder="Bộ lọc Món Toàn Hệ Thống..." 
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }}
              />
            </div>
            
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid var(--surface-border)', padding:'9px 16px', borderRadius:'8px', outline:'none' }}>
               <option value="all">-- Tất cả Danh Mục POS --</option>
               {state.categories.filter(c => c.type === 'menu').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          
          {viewMode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {state.products.filter(p => {
                const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
                const matchCat = filterCategory === 'all' || p.category === filterCategory;
                return matchSearch && matchCat;
              }).map(p => {
                const cost = calculateTotalCost(p.recipe);
                const port = calculateMaxPortions(p.recipe);
                return (
                  <div key={p.id} className="product-card-hover" style={{ position: 'relative', display: 'flex', flexDirection: 'column', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
                      {/* Tooltip on Hover */}
                      <div className="tooltip-content" style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', background: 'var(--bg-color)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '12px', zIndex: 50, opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
                         <p style={{ margin: 0, marginBottom: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem' }}>Định Mức Nguyên Liệu:</p>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {p.recipe.map((r, i) => {
                               const node = getEntityDisplayDetails(r.ingredientId);
                               return <span key={i} style={{ fontSize: '0.8rem' }}>• {node?.name}: <strong>{r.qty} {r.unitMode === 'divide' ? '1/x' : (r.unitMode === 'buy' ? node?.buyUnit : node?.baseUnit)}</strong></span>;
                            })}
                         </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{p.name}</h4>
                          <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {p.category} | Đo Năng Lực: ({p.unit || 'Suất'})
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ background: port > 5 ? 'rgba(46, 160, 67, 0.2)' : 'rgba(218, 54, 51, 0.2)', color: port > 5 ? 'var(--success)' : 'var(--danger)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                            Max Thực: {port} {p.unit || 'suất'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Vốn Cấu Thành Gộp Lưới:</span>
                          <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{Math.round(cost).toLocaleString('vi-VN')} đ/{p.unit||'Suất'}</span>
                        </div>
                        <div style={{ width: '100%', height: '1px', background: 'var(--surface-border)' }}/>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Giá Lên Đơn (POS):</span>
                          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{p.price.toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                        <button className="btn btn-ghost" style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--secondary)' }} onClick={() => { setViewingProduct(p); setShowDetail(true); }} title="Xem chi tiết & Biểu đồ">
                          <Eye size={18}/>
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '8px', background: 'rgba(46, 160, 67, 0.1)', color: 'var(--success)' }} onClick={() => duplicateProduct(p)} title="Nhân bản">
                          <Copy size={18}/>
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '8px', background: 'rgba(255,255,255,0.05)' }} onClick={() => { setForm(JSON.parse(JSON.stringify(p))); setShowForm(true); }} title="Sửa Recipe">
                          <Edit size={18}/>
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '8px', color: 'white', background: 'rgba(218, 54, 51, 0.2)', border: '1px solid rgba(218, 54, 51, 0.3)' }} onClick={() => deleteProduct(p.id)} title="Xóa Món">
                          <Trash2 size={18}/>
                        </button>
                      </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
               <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                     <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Tên Sản Phẩm POS</th>
                        <th style={{ padding: '12px' }}>Bảng Kê Nguyên Liệu (Recipe)</th>
                        <th style={{ padding: '12px' }}>Vốn Gộp</th>
                        <th style={{ padding: '12px' }}>Giá Bán</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Thao Tác</th>
                     </tr>
                  </thead>
                  <tbody>
                     {state.products.filter(p => {
                        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
                        const matchCat = filterCategory === 'all' || p.category === filterCategory;
                        return matchSearch && matchCat;
                     }).map(p => {
                        const cost = calculateTotalCost(p.recipe);
                        return (
                           <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                              <td style={{ padding: '12px' }}>
                                 <strong style={{ fontSize: '1rem' }}>{p.name}</strong>
                                 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.category}</div>
                              </td>
                              <td style={{ padding: '12px' }}>
                                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {p.recipe.map((r, i) => {
                                       const node = getEntityDisplayDetails(r.ingredientId);
                                       return (
                                          <span key={i} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.8rem' }}>
                                             {node?.name}: <strong>{r.qty}</strong>
                                          </span>
                                       )
                                    })}
                                 </div>
                              </td>
                              <td style={{ padding: '12px', color: 'var(--warning)', fontWeight: 600 }}>{Math.round(cost).toLocaleString('vi-VN')} đ</td>
                              <td style={{ padding: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>{p.price.toLocaleString('vi-VN')} đ</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                 <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                    <button className="btn btn-ghost" onClick={() => duplicateProduct(p)} title="Nhân bản"><Copy size={16}/></button>
                                    <button className="btn btn-ghost" onClick={() => { setForm(JSON.parse(JSON.stringify(p))); setShowForm(true); }} title="Sửa"><Edit size={16}/></button>
                                    <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => deleteProduct(p.id)} title="Xóa"><Trash2 size={16}/></button>
                                 </div>
                              </td>
                           </tr>
                        )
                     })}
                  </tbody>
               </table>
            </div>
          )}
        </div>
        <style>{`
          .product-card-hover:hover .tooltip-content {
             opacity: 1 !important;
             pointer-events: auto !important;
             transform: translateY(-5px);
          }
        `}</style>
      </div>
    );
};

export default Products;
