import React from 'react';
import { Coffee, Search, Edit, Trash2, ListPlus, Copy, Eye, PieChart, Image as ImageIcon, CheckSquare, Square, X } from 'lucide-react';
import ModuleLayout from './ModuleLayout';
import SortHeader from './SortHeader';
import CurrencyInput from './CurrencyInput';
import SmartTable from './SmartTable';

const ProductsUI = ({ manager }) => {
  const {
    products, categories, ingredients,
    listState,
    form, setForm,
    recipeItem, setRecipeItem,
    viewingProduct, setViewingProduct,
    showDetail, setShowDetail,
    _viewMode, _setViewMode,
    filterCategory, setFilterCategory,
    safeNumber, getPercentage, getMargin,
    calculateTotalCost, getProductMaxCapacityInfo, getEntityDisplayDetails, calculateMaxPortions, getRecipeItemCost,
    saveProduct, duplicateProduct, addRecipeItem, removeRecipeItem, updateRecipeQty, updateRecipeUnitMode,
    finalFilteredItems,
    _filteredActiveItems, _search, selectedIds, toggleSelection, _showForm, setShowForm, handleDelete, _showToast
  } = manager;

  const renderActiveList = () => {
    const listColumns = [
        { 
          key: 'name', 
          label: 'Tên Sản Phẩm POS', 
          sortable: true,
          render: (val, p) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {p.image ? (
                <img src={p.image} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--surface-variant)', border: '1px dashed var(--surface-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  <ImageIcon size={16} />
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '1rem' }}>{p.name}</strong>
                  {p.status === 'draft' && <span style={{ padding: '2px 6px', background: 'rgba(249, 115, 22, 0.2)', color: 'var(--primary)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>NHÁP</span>}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.category}</div>
              </div>
            </div>
          )
        },
        {
          key: 'recipe',
          label: 'Bảng Kê Nguyên Liệu (Recipe)',
          width: '38%',
          render: (val, p) => (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }} onClick={e => e.stopPropagation()}>
              {p.recipe.map((r, i) => {
                const node = getEntityDisplayDetails(r.ingredientId);
                if (!node) return (
                    <div key={`${p.id}-${i}-deleted`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: '#FEF2F2', borderRadius: '6px', fontSize: '13px', color: 'var(--danger)', fontStyle: 'italic' }}>
                      {'(Nguyên liệu đã bị xóa khỏi kho)'}
                    </div>
                );
                return (
                  <div key={`${p.id}-${i}-${r.qty}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', background: node.deleted ? '#FEF2F2' : '#F3F4F6', borderRadius: '6px', fontSize: '13px', color: node.deleted ? 'var(--danger)' : 'var(--text-primary)', fontWeight: 500 }}>
                    {node.name} {node.deleted ? '(Đã xóa)' : ''}:
                    <input
                      type="number"
                      style={{ width: '48px', padding: '4px', fontSize: '13px', fontWeight: 'bold', color: 'var(--danger)', border: `1px solid ${node.deleted ? 'var(--danger)' : '#D1D5DB'}`, borderRadius: '4px', background: '#FFFFFF', outline: 'none', textAlign: 'center' }}
                      defaultValue={r.qty}
                      step="any"
                      onBlur={(e) => {
                        const newQty = Number(e.target.value);
                        if (newQty > 0 && newQty !== r.qty) {
                          const updatedRecipe = [...p.recipe];
                          updatedRecipe[i].qty = newQty;
                          manager.updateProduct({ ...p, recipe: updatedRecipe });
                        } else { e.target.value = r.qty; }
                      }}
                    />
                    <span style={{ fontSize: '12px', color: node.deleted ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      {r.unitMode === 'divide' ? '1/x' : (r.unitMode === 'buy' ? node.buyUnit : node.baseUnit)}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        },
        {
          key: 'cost',
          label: 'Chi Phí Vốn (%)',
          sortable: true,
          render: (_, p) => {
             const cost = calculateTotalCost(p.recipe);
             return (
              <>
                <div style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '14px' }}>{Math.round(cost).toLocaleString('vi-VN')} đ</div>
                <div style={{ fontSize: '12px', color: 'var(--danger)' }}>Tỷ trọng: <strong style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>{getPercentage(cost, p.price)}%</strong></div>
              </>
             )
          }
        },
        {
          key: 'price',
          label: 'Giá Bán POS',
          sortable: true,
          render: (val, p) => <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '15px' }}>{safeNumber(p.price).toLocaleString('vi-VN')} đ</span>
        },
        {
          key: 'margin',
          label: 'Lợi Nhuận (%)',
          sortable: true,
          render: (_, p) => {
             const cost = calculateTotalCost(p.recipe);
             return (
              <>
                <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '14px' }}>{Math.round(safeNumber(p.price) - cost).toLocaleString('vi-VN')} đ</div>
                <div style={{ fontSize: '12px', color: 'var(--success)' }}>Biên lãi: <strong style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>{getMargin(cost, p.price)}%</strong></div>
              </>
             )
          }
        }
      ];

      return (
        <SmartTable 
           tableId="products"
           defaultView="card"
           data={finalFilteredItems}
           columns={listColumns}
           selectable={true}
           selectedIds={selectedIds}
           onSelectToggle={(id) => toggleSelection(id)}
           onSelectAll={() => {
              if (selectedIds.length === finalFilteredItems.length && finalFilteredItems.length > 0) listState.clearSelection();
              else listState.setSelectedIds(finalFilteredItems.map(i => i.id));
           }}
           onEdit={(p) => { setForm(JSON.parse(JSON.stringify(p))); setShowForm(true); }}
           onDelete={(p) => handleDelete(p)}
           confirmBeforeDelete={true}
           extraRowActions={(p) => (
             <button className="btn btn-ghost" onClick={(e) => { e.stopPropagation(); duplicateProduct(p); }} title="Nhân bản" style={{ padding: '6px' }}><Copy size={16} /></button>
           )}
           emptyMessage="Không có món ăn nào trong danh mục này."
           renderCardItem={(p, isSelected, localToggleSelection) => {
             const cost = calculateTotalCost(p.recipe);
             const capInfo = getProductMaxCapacityInfo(p.recipe);
             const port = capInfo.max === Infinity ? 0 : capInfo.max;
             
             return (
               <div className="product-card-hover" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', background: isSelected ? 'rgba(59, 130, 246, 0.05)' : '#FFFFFF', borderRadius: '16px', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--surface-border)'}`, boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}>
                  <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 20, cursor: 'pointer' }} onClick={() => localToggleSelection(p.id)}>
                     {isSelected ? <CheckSquare size={22} color="var(--primary)" /> : <Square size={22} color="var(--text-secondary)" />}
                  </div>

                  <div className="tooltip-content" style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', background: 'var(--bg-color)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '16px', zIndex: 100, opacity: 0, pointerEvents: 'none', transition: 'all 0.2s ease-in-out', boxShadow: 'var(--shadow-xl)' }}>
                    <p style={{ margin: 0, marginBottom: '8px', color: 'var(--primary)', fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase' }}>Định Mức Nguyên Liệu</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {p.recipe.map((r, i) => {
                        const node = getEntityDisplayDetails(r.ingredientId);
                        return <div key={i} style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--surface-border)', paddingBottom: '4px' }}>
                          <span style={{ color: node ? 'var(--text-secondary)' : 'var(--danger)', fontWeight: node ? 400 : 700 }}>• {node ? node.name : `[Bị xóa: ${r.ingredientId.slice(0,4)}...]`}</span>
                          <strong style={{ color: node ? 'inherit' : 'var(--danger)' }}>{r.qty} {r.unitMode === 'divide' ? '1/x' : (r.unitMode === 'buy' ? node?.buyUnit : node?.baseUnit)}</strong>
                        </div>;
                      })}
                      {p.recipe.length === 0 && <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>Chưa thiết lập Recipe</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                    {p.image && (
                      <div style={{ width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--surface-border)' }}>
                        <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ flex: 1, paddingRight: '28px' }}>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '6px' }}>{p.name}</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        <span style={{ padding: '4px 8px', background: 'var(--surface-color)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', border: '1px solid var(--surface-border)' }}>
                          {p.category}
                        </span>
                        {p.status === 'draft' && (
                          <span style={{ padding: '4px 8px', background: '#FEF2F2', color: 'var(--danger)', borderRadius: '6px', fontSize: '11px', fontWeight: 800, border: '1px solid #FECACA' }}>NHÁP (ẨN OS)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ background: port > 5 ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${port > 5 ? '#BBF7D0' : '#FECACA'}`, padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: port > 5 ? '#166534' : '#991B1B', fontWeight: 600 }}>Năng lực đáp ứng:</span>
                      <span style={{ fontSize: '15px', color: port > 5 ? 'var(--success)' : 'var(--danger)', fontWeight: 800 }}>{port} {p.unit || 'suất'}</span>
                    </div>
                    {port <= 0 && capInfo.limitingName && (
                      <div style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 700, fontStyle: 'italic', display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px dashed #FECACA', paddingTop: '6px', marginTop: '2px' }}>
                        <span>⚠️ Hết: {capInfo.limitingName}</span>
                        <span style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 'normal' }}>*Nhập lượng tồn vào Kho*</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', background: 'var(--surface-variant)', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Vốn cấu thành:</span>
                      <span style={{ fontSize: '14px', color: 'var(--danger)', fontWeight: 600 }}>
                        {Math.round(cost).toLocaleString('vi-VN')} đ 
                        <span style={{ fontSize: '12px', marginLeft: '4px', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>{getPercentage(cost, p.price)}%</span>
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '1px', background: 'var(--surface-border)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Giá Bán POS:</span>
                      <span style={{ fontSize: '18px', color: 'var(--primary)', fontWeight: 800 }}>{safeNumber(p.price).toLocaleString('vi-VN')} đ</span>
                    </div>
                    <div style={{ width: '100%', height: '1px', background: 'var(--surface-border)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Lợi nhuận gộp:</span>
                      <span style={{ fontSize: '14px', color: 'var(--success)', fontWeight: 700 }}>
                        {Math.round(safeNumber(p.price) - cost).toLocaleString('vi-VN')} đ 
                        <span style={{ fontSize: '12px', marginLeft: '4px', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>{getMargin(cost, p.price)}%</span>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
                    <button className="btn btn-ghost" style={{ flex: 1, padding: '8px', background: '#F0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', borderRadius: '8px' }} onClick={() => { setViewingProduct(p); setShowDetail(true); }}><PieChart size={16} /></button>
                    <button className="btn btn-ghost" style={{ flex: 1, padding: '8px', background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', borderRadius: '8px' }} onClick={() => duplicateProduct(p)}><Copy size={16} /></button>
                    <button className="btn btn-ghost" style={{ flex: 1, padding: '8px', background: 'var(--surface-variant)', color: 'var(--text-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px' }} onClick={() => { setForm(JSON.parse(JSON.stringify(p))); setShowForm(true); }}><Edit size={16} /></button>
                    <button className="btn btn-ghost" style={{ flex: 1, padding: '8px', background: '#FEF2F2', color: 'var(--danger)', border: '1px solid #FECACA', borderRadius: '8px' }} onClick={() => handleDelete(p)}><Trash2 size={16} /></button>
                  </div>
               </div>
             );
           }}
        />
      );
  };

  const renderForm = () => {
    const calculatedCost = calculateTotalCost(form.recipe);
    const maxPortions = calculateMaxPortions(form.recipe);
    const selectedNode = getEntityDisplayDetails(recipeItem.ingredientId);
    const draftCost = recipeItem.ingredientId && Number(recipeItem.qty) ? getRecipeItemCost({ ...recipeItem, qty: Number(recipeItem.qty) }) : 0;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 1.2fr)', gap: '40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '12px', background: 'var(--surface-variant)', border: '1px dashed var(--surface-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }} onClick={() => document.getElementById('productImageUpload').click()}>
              {form.image ? <img src={form.image} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}><ImageIcon size={24} /><span style={{ fontSize: '10px', marginTop: '4px' }}>Tải ảnh</span></div>}
              <input type="file" id="productImageUpload" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => setForm({ ...form, image: event.target.result });
                  reader.readAsDataURL(file);
                }
              }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Tên hiển thị POS:</label>
              <input required className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Nhóm danh mục:</label>
              <select required className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">-- Chọn --</option>
                {(categories || []).filter(c => c.type === 'menu').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Đơn vị tính:</label>
              <input required className="form-input" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Trạng thái:</label>
              <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Đang phục vụ</option>
                <option value="draft">Bản nháp (Ẩn)</option>
              </select>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--primary)' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Giá vốn dự tính (VNĐ):</p>
            <h2 style={{ margin: '8px 0', color: 'var(--warning)', fontWeight: 700 }}>{Math.round(calculatedCost).toLocaleString('vi-VN')} đ</h2>
            <div style={{ width: '100%', height: '1px', background: 'var(--surface-border)', margin: '12px 0' }} />
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Khả năng đáp ứng hiện tại:</p>
            <h3 style={{ margin: '8px 0', color: maxPortions > 5 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>{maxPortions} {form.unit || 'Suất'}</h3>
          </div>

          <div>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block', fontWeight: 600 }}>Giá bán niêm yết (VNĐ):</label>
            <CurrencyInput required style={{ borderColor: 'var(--success)', fontSize: '1.1rem' }} value={form.price} onChange={val => setForm({ ...form, price: val })} />
          </div>

          <button className="btn btn-primary" style={{ padding: '14px', fontSize: '1.1rem', marginTop: 'auto', fontWeight: 600 }} onClick={saveProduct}>Lưu thông tin</button>
        </div>

        <div style={{ borderLeft: '1px solid var(--surface-border)', paddingLeft: '32px', display: 'flex', flexDirection: 'column', maxHeight: 'calc(90vh - 150px)', overflowY: 'auto' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, marginBottom: '16px' }}><ListPlus size={18} /> Định mức nguyên liệu</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid var(--primary)' }}>
            <div>
              <select className="form-input" value={recipeItem.ingredientId} onChange={e => setRecipeItem({ ...recipeItem, ingredientId: e.target.value, unitMode: 'base' })}>
                <option value="">-- Chọn nguyên liệu hoặc bán thành phẩm --</option>
                <optgroup label="Vật tư thô">
                  {(ingredients || []).filter(i => !i.deleted).map(ing => <option key={ing.id} value={ing.id}>[VT] {ing.name} ({Math.round(ing.cost).toLocaleString('vi-VN')} đ/{ing.unit})</option>)}
                </optgroup>
                <optgroup label="Bán thành phẩm">
                  {(products || []).filter(p => !p.deleted && p.id !== form.id).map(p => <option key={p.id} value={p.id}>[BTP] {p.name} ({Math.round(calculateTotalCost(p.recipe)).toLocaleString('vi-VN')} đ/{p.unit || 'Suất'})</option>)}
                </optgroup>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ flex: 2 }}>
                <select className="form-input" value={recipeItem.unitMode} onChange={e => setRecipeItem({ ...recipeItem, unitMode: e.target.value })} disabled={!selectedNode}>
                  {selectedNode && selectedNode.type === 'ingredient' && <option value="base">Theo: {selectedNode.baseUnit}</option>}
                  {selectedNode && selectedNode.type === 'ingredient' && selectedNode.buyUnit && <option value="buy">Theo: {selectedNode.buyUnit}</option>}
                  {selectedNode && selectedNode.type === 'product' && <option value="base">Theo: {selectedNode.baseUnit}</option>}
                  {selectedNode && <option value="divide">Chia tỷ lệ (1/X)</option>}
                  {!selectedNode && <option value="">-- Tính theo --</option>}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <input type="number" step="0.01" className="form-input" placeholder="Số lượng" value={recipeItem.qty} onChange={e => setRecipeItem({ ...recipeItem, qty: e.target.value })} />
              </div>
              <button type="button" className="btn btn-primary" onClick={addRecipeItem}>Thêm</button>
            </div>
            {recipeItem.ingredientId && recipeItem.qty > 0 && (
              <div style={{ fontSize: '13px', color: 'var(--warning)', fontWeight: 600, textAlign: 'right' }}>Trị giá dự tính: {Math.round(draftCost).toLocaleString('vi-VN')} đ</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {form.recipe.length === 0 && <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Chưa có nguyên liệu thành phần.</span>}
             {form.recipe.map((r, i) => {
              const node = getEntityDisplayDetails(r.ingredientId);
              if (!node) {
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#FEF2F2', borderRadius: '8px', borderLeft: '3px solid var(--danger)' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--danger)' }}>[Cảnh báo] Nguyên liệu đã bị xóa khỏi kho: {r.name || `ID: ${r.ingredientId.slice(0,6)}...`}</span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '4px' }}>
                        <span>Vui lòng xóa dòng này và chọn nguyên liệu thay thế.</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--danger)' }}>SL: {r.qty}</span>
                      <button type="button" className="btn btn-ghost" style={{ padding: '8px', color: 'var(--danger)' }} onClick={() => removeRecipeItem(i)} title="Gỡ bỏ nguyên liệu này"><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              }
              const actCostTotal = getRecipeItemCost(r);
              const isSoftDeleted = node.deleted;
              const isOutOfStock = node.stock <= 0 && node.type === 'ingredient';

              let rowStyle = { background: 'rgba(255,255,255,0.05)', borderLeft: `3px solid ${node.type === 'product' ? 'var(--warning)' : 'var(--secondary)'}` };
              if (isSoftDeleted) rowStyle = { background: '#FEF2F2', borderLeft: '3px solid var(--danger)' };
              else if (isOutOfStock) rowStyle = { background: '#FFFBEB', borderLeft: '3px solid var(--warning)' };

              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: '8px', ...rowStyle }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: isSoftDeleted ? 'var(--danger)' : 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       [{node.type === 'product' ? 'Bếp' : 'K'}] {node.name}
                       {isSoftDeleted && <span style={{ fontSize: '10px', background: 'var(--danger)', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Nằm trong thùng rác</span>}
                       {isOutOfStock && !isSoftDeleted && <span style={{ fontSize: '10px', background: 'var(--warning)', color: 'black', padding: '2px 6px', borderRadius: '4px' }}>Hết hàng</span>}
                    </span>
                    <div style={{ fontSize: '0.8rem', color: isSoftDeleted ? 'var(--danger)' : 'var(--text-secondary)', marginTop: '4px' }}>
                      <span>Hao hụt vốn con: <strong style={{ color: isSoftDeleted ? 'var(--danger)' : 'var(--warning)' }}>{Math.round(actCostTotal).toLocaleString('vi-VN')} đ</strong> </span>
                      {isSoftDeleted && <div style={{ marginTop: '2px', fontStyle: 'italic' }}>Nguyên liệu này đã bị Xóa (Nằm trong thùng rác). Dễ gây sai số hiển thị! Bấm 🗑️ xóa bên phải và chọn cái mới.</div>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input type="number" step="0.01" value={r.qty} onChange={(e) => updateRecipeQty(i, e.target.value)}
                      style={{ width: '80px', padding: '8px', textAlign: 'center', background: 'var(--surface-variant)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: '6px' }} />
                    <select value={r.unitMode} onChange={(e) => updateRecipeUnitMode(i, e.target.value)} style={{ padding: '8px', background: 'var(--surface-variant)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)', borderRadius: '6px' }}>
                      <option value="base">{node.baseUnit}</option>
                      {node.type === 'ingredient' && node.buyUnit && <option value="buy">{node.buyUnit}</option>}
                      <option value="divide">Chia (1/X)</option>
                    </select>
                    <button type="button" className="btn btn-ghost" style={{ padding: '8px', color: 'var(--danger)' }} onClick={() => removeRecipeItem(i)} title="Gỡ bỏ nguyên liệu này"><Trash2 size={18} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const customFilters = (
    <>
      <select className="table-feature-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
        <option value="all">-- Tất cả Danh Mục POS --</option>
        {(categories || []).filter(c => c.type === 'menu').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
    </>
  );

  const trashColumns = [
    { key: 'name', label: 'Tên Sản Phẩm', render: p => <strong>{p.name}</strong> },
    { key: 'category', label: 'Danh Mục', render: p => p.category || '-' },
    { key: 'price', label: 'Giá Bán', render: p => <strong style={{ color: 'var(--primary)' }}>{Number(p.price || 0).toLocaleString('vi-VN')} đ</strong> }
  ];

  return (
    <>
      <style>{`
        .product-card-hover:hover .tooltip-content {
           opacity: 1 !important;
           pointer-events: auto !important;
           transform: translateY(-5px);
        }
      `}</style>
      <ModuleLayout
        title="Danh Mục Cấu Thành Món Ăn (Recipe Đa Tầng)"
        description="Quản lý thực đơn và tính toán giá vốn trực tiếp từ thẻ định mức nguyên liệu."
        icon={Coffee}
        listState={listState}
        trashColumns={trashColumns}
        extraFilters={customFilters}
        formTitle={form.id ? `Cập nhật: ${form.name}` : 'Khai báo món mới'}
        renderActiveList={renderActiveList}
        renderForm={renderForm}
      />

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
                <button className="btn btn-ghost" onClick={() => setShowDetail(false)}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                  <h4 style={{ margin: 0, marginBottom: '16px', fontSize: '1rem' }}>Tỷ lệ % Chi phí theo Nhóm</h4>
                  <div style={{ display: 'flex', height: '24px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', marginBottom: '16px' }}>
                    {sortedCats.map(([cat, val], idx) => {
                      const perc = (val / totalCost) * 100;
                      const colors = ['#f97316', '#3b82f6', '#2ea043', '#e3b341', '#da3633', '#8b949e'];
                      return <div key={cat} style={{ width: `${perc}%`, height: '100%', background: colors[idx % colors.length] }} title={`${cat}: ${perc.toFixed(1)}%`} />;
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
    </>
  );
};

export default ProductsUI;
