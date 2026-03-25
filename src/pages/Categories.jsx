import React, { useState } from 'react';
import { Tags, Plus, Edit, Trash2, Package, X } from 'lucide-react';
import { useData } from '../context/DataContext';

const Categories = () => {
  const { state, dispatch } = useData();
  const [activeTab, setActiveTab] = useState('menu');
  
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', type: 'menu' });

  const saveCategory = (e) => {
    e.preventDefault();
    const payload = { ...form };
    if (form.id) dispatch({ type: 'UPDATE_CATEGORY', payload });
    else dispatch({ type: 'ADD_CATEGORY', payload });
    setShowForm(false);
  };

  const deleteCategory = (id) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: id });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}><Tags color="var(--primary)" /> Danh Mục Hệ Thống</h2>
         <button className="btn btn-primary" onClick={() => { setForm({ id: '', name: '', type: activeTab }); setShowForm(true); }}>
            <Plus size={18} /> Thêm Danh Mục
         </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '450px', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
             <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--primary)' }}>{form.id ? 'Sửa Nhóm' : 'Thêm Nhóm Trực Tiếp'}</h3>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ padding: '8px' }}><X size={20}/></button>
             </div>
             
             <form onSubmit={saveCategory} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                   <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Tên danh mục quản lý:</label>
                   <input required style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)', color: 'white', padding: '12px', borderRadius: '8px', width: '100%', outline: 'none' }} 
                          value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="VD: Gà Ủ Muối Bán Chạy" />
                </div>
                <div>
                   <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Phân lưu (Root Type):</label>
                   <select required style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)', color: 'white', padding: '12px', borderRadius: '8px', width: '100%', outline: 'none' }} 
                           value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      <option value="menu">Menu Thực Đơn POS (Kinh Doanh)</option>
                      <option value="inventory">Kho & Vật Tư Lõi (Kế Toán)</option>
                   </select>
                </div>
                
                <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '1.1rem', marginTop: '12px' }}>{form.id ? 'Lưu Thay Đổi' : 'Xác Nhận Đưa Vào Danh Sách'}</button>
             </form>
          </div>
        </div>
      )}

       <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
         <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '16px', marginBottom: '16px' }}>
            <button className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('menu')}>Trại Danh Mục - Món Bán (POS)</button>
            <button className={`btn ${activeTab === 'inventory' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setActiveTab('inventory')}>Trại Danh Mục - Vật Tư Khẩu Phần</button>
         </div>

         <div style={{ flex: 1, overflowY: 'auto' }}>
            {state.categories.filter(c => c.type === activeTab).map(cat => (
               <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                     <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '10px', borderRadius: '12px' }}>
                        {cat.type === 'menu' ? <Tags size={24} color="var(--primary)"/> : <Package size={24} color="var(--primary)"/>}
                     </div>
                     <div>
                        <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{cat.name}</h4>
                     </div>
                  </div>
                  <div>
                    <button className="btn btn-ghost" style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', marginRight: '8px' }} onClick={() => { setForm(cat); setShowForm(true); }}><Edit size={18} /></button>
                    <button className="btn btn-ghost" style={{ background: 'rgba(218,54,51,0.1)', color: 'var(--danger)', padding: '12px' }} onClick={() => deleteCategory(cat.id)}><Trash2 size={18} /></button>
                  </div>
               </div>
            ))}
            {state.categories.filter(c => c.type === activeTab).length === 0 && <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Chưa có danh mục nào được khởi tạo ở hệ này.</p>}
         </div>
       </div>
    </div>
  );
};

export default Categories;
