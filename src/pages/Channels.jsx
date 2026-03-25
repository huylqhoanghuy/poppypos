import React, { useState } from 'react';
import { Store, Plus, Edit, Trash2, Link as IconLink, X } from 'lucide-react';
import { useData } from '../context/DataContext';

const Channels = () => {
  const { state, dispatch } = useData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', discountRate: '' });

  const saveChannel = (e) => {
    e.preventDefault();
    const payload = { ...form, discountRate: Number(form.discountRate) };
    if (form.id) dispatch({ type: 'UPDATE_CHANNEL', payload });
    else dispatch({ type: 'ADD_CHANNEL', payload });
    setShowForm(false);
  };

  const deleteChannel = (id) => {
    dispatch({ type: 'DELETE_CHANNEL', payload: id });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}><Store color="var(--primary)" /> Mạng Lưới Kênh Phân Phối</h2>
         <button className="btn btn-primary" onClick={() => { setForm({ id: '', name: '', discountRate: '' }); setShowForm(true); }}>
            <Plus size={18} /> Thêm Kênh
         </button>
      </div>

      {showForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
             <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: 'var(--primary)' }}>{form.id ? 'Cập Nhật Kênh Bán' : 'Tạo Kênh Phát Triển'}</h3>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ padding: '8px' }}><X size={20}/></button>
             </div>
             
             <form onSubmit={saveChannel} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                   <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Tên nền tảng Cắt Cầu:</label>
                   <input required style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)', color: 'white', padding: '12px', borderRadius: '8px', width: '100%', outline: 'none' }} 
                          value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="VD: Giao Hàng Bến Xe" />
                </div>
                <div>
                   <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Mức phí Môi giới Nhận hộ (%):</label>
                   <input required type="number" step="0.1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--surface-border)', color: 'white', padding: '12px', borderRadius: '8px', width: '100%', outline: 'none' }} 
                          value={form.discountRate} onChange={e => setForm({...form, discountRate: e.target.value})} placeholder="VD: 5.5" />
                </div>
                
                <button type="submit" className="btn btn-primary" style={{ padding: '14px', fontSize: '1.1rem', marginTop: '12px' }}>{form.id ? 'Lưu Thiết Lập' : 'Treo Lên Danh Sách'}</button>
             </form>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', alignContent: 'start' }}>
         {state.salesChannels?.map(channel => (
           <div key={channel.id} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '16px', border: '1px solid var(--surface-border)' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(249, 115, 22, 0.2)', padding: '12px', borderRadius: '12px' }}>
                   <IconLink size={24} color="var(--warning)"/>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.3rem' }}>{channel.name}</h3>
             </div>
             <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.90rem' }}>Phần Trăm Phí Cấu Trúc / Giao Dịch Bán:</p>
             <h2 style={{ margin: '8px 0', color: 'var(--danger)', fontSize: '1.8rem' }}>-{channel.discountRate}%</h2>
             
             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button className="btn btn-ghost" style={{ padding: '12px', background: 'rgba(255,255,255,0.05)' }} onClick={() => { setForm(channel); setShowForm(true); }}><Edit size={18}/></button>
                <button className="btn btn-ghost" style={{ padding: '12px', color: 'var(--danger)' }} onClick={() => deleteChannel(channel.id)}><Trash2 size={18}/></button>
             </div>
           </div>
         ))}
         {(!state.salesChannels || state.salesChannels.length === 0) && <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', gridColumn: '1 / -1' }}>Chưa có kênh phân phối nào. Bấm nút Thêm để bắt đầu khai thác!</p>}
      </div>
    </div>
  );
};

export default Channels;
