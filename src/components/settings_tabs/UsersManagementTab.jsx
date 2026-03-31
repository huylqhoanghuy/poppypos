import React, { useState } from 'react';
import { Users, UserPlus, Key, Award, Trash2, Edit3, Save, X, ShieldAlert } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function UsersManagementTab() {
  const { state, dispatch } = useData();
  const users = (state.users || []).filter(u => !u.deleted);
  
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'CASHIER',
    status: 'active'
  });

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      password: user.password,
      name: user.name,
      role: user.role,
      status: user.status
    });
  };

  const handleCreateNew = () => {
    setEditingId('NEW');
    setFormData({
      username: '',
      password: '',
      name: '',
      role: 'CASHIER',
      status: 'active'
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!formData.username || !formData.password || !formData.name) {
      dispatch({ type: 'SHOW_TOAST', payload: { message: 'Vui lòng điền đủ thông tin!', type: 'error' } });
      return;
    }

    if (editingId === 'NEW') {
       // Check duplicate
       const exists = users.find(u => u.username.toLowerCase() === formData.username.toLowerCase());
       if (exists) {
           dispatch({ type: 'SHOW_TOAST', payload: { message: 'Tên đăng nhập đã tồn tại!', type: 'error' } });
           return;
       }
       dispatch({ type: 'ADD_USER', payload: formData });
    } else {
       dispatch({ type: 'UPDATE_USER', payload: { ...formData, id: editingId } });
    }
    
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này? Sẽ không thể hoàn tác.")) {
        dispatch({ type: 'DELETE_USER', payload: id });
    }
  };

  const getRoleBadge = (role) => {
      switch(role) {
          case 'ADMIN': return <span style={{ background: '#FEF2F2', color: 'var(--danger)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid #FCA5A5' }}>Quản Trị (ADMIN)</span>;
          case 'MANAGER': return <span style={{ background: '#FFF7ED', color: 'var(--warning)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid #FDF6B2' }}>Quản Lý (MANAGER)</span>;
          case 'CASHIER': return <span style={{ background: '#F0FDF4', color: 'var(--success)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, border: '1px solid #86EFAC' }}>Thu Ngân (CASHIER)</span>;
          default: return <span style={{ background: '#F3F4F6', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>Không Rõ</span>;
      }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* List */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px)', border: '1px solid var(--surface-border)', borderRadius: '16px', background: 'var(--surface-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="var(--primary)" /> Danh Sách Nhân Sự & Tài Khoản
            </h3>

            {editingId === null && (
                <button 
                  onClick={handleCreateNew}
                  className="btn btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '14px', fontWeight: 600 }}
                >
                  <UserPlus size={18} /> Thêm Tài Khoản
                </button>
            )}
        </div>

        {/* Editor Box */}
        {editingId !== null && (
            <div style={{ padding: '20px', background: 'var(--bg-color)', border: '1px solid var(--primary)', borderRadius: '12px', marginBottom: '24px', position: 'relative' }}>
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {editingId === 'NEW' ? 'Tạo Tài Khoản Mới' : 'Sửa Thông Tin Tài Khoản'}
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Tên người dùng (Tên Hiển Thị)</label>
                        <input 
                            type="text" 
                            name="name"
                            value={formData.name} 
                            onChange={handleChange}
                            className="form-input" 
                            placeholder="VD: Nguyễn Văn A"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Tên Đăng Nhập (Login ID)</label>
                        <input 
                            type="text" 
                            name="username"
                            value={formData.username} 
                            onChange={handleChange}
                            disabled={editingId !== 'NEW'}
                            className="form-input" 
                            placeholder="VD: nguyenvana"
                            style={{ background: editingId !== 'NEW' ? 'var(--surface-color)' : '' }}
                        />
                        {editingId !== 'NEW' && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Không thể đổi tên đăng nhập.</span>}
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Mật khẩu truy cập</label>
                        <div style={{ position: 'relative' }}>
                           <Key size={16} color="var(--text-secondary)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px'}} />
                           <input 
                               type="text" 
                               name="password"
                               value={formData.password} 
                               onChange={handleChange}
                               className="form-input" 
                               placeholder="********"
                               style={{ paddingLeft: '36px' }}
                           />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Cấp Quyền Doanh Nghiệp (Role)</label>
                        <div style={{ position: 'relative' }}>
                           <Award size={16} color="var(--primary)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px'}} />
                           <select 
                               name="role"
                               value={formData.role} 
                               onChange={handleChange}
                               className="form-input" 
                               style={{ paddingLeft: '36px', fontWeight: 600, color: formData.role === 'ADMIN' ? 'var(--danger)' : 'inherit' }}
                           >
                               <option value="CASHIER">Nhân Viên Thu Ngân (CASHIER)</option>
                               <option value="MANAGER">Quản Lý Trưởng (MANAGER)</option>
                               <option value="ADMIN">Chủ Cửa Hàng (ADMIN)</option>
                           </select>
                        </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                       <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Trạng thái</label>
                       <select 
                           name="status"
                           value={formData.status} 
                           onChange={handleChange}
                           className="form-input" 
                           style={{ width: '200px' }}
                       >
                           <option value="active">Đang hoạt động</option>
                           <option value="inactive">Đã Nghỉ Việc / Khóa</option>
                       </select>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button 
                        onClick={() => setEditingId(null)}
                        className="btn btn-ghost" 
                        style={{ padding: '8px 16px' }}
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSave}
                        className="btn btn-primary" 
                        style={{ padding: '8px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Save size={16} /> Lưu Thông Tin
                    </button>
                </div>
            </div>
        )}

        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
             <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '1px solid var(--surface-border)' }}>
                   <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>ID</th>
                   <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tên Nhân Viên</th>
                   <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tài Khoản</th>
                   <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Phân Quyền</th>
                   <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>TT</th>
                   <th style={{ padding: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Hành động</th>
                </tr>
             </thead>
             <tbody>
               {users.map((u, idx) => (
                   <tr key={u.id} style={{ borderBottom: '1px solid var(--surface-border)', background: idx % 2 === 0 ? 'transparent' : 'var(--bg-color)' }}>
                       <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>{u.id}</td>
                       <td style={{ padding: '16px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                       <td style={{ padding: '16px', fontSize: '14px', color: 'var(--primary)', fontWeight: 600 }}>{u.username}</td>
                       <td style={{ padding: '16px' }}>{getRoleBadge(u.role)}</td>
                       <td style={{ padding: '16px' }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: u.status === 'inactive' ? 'var(--danger)' : 'var(--success)' }}></span>
                       </td>
                       <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                             <button onClick={() => handleEdit(u)} className="btn btn-ghost" style={{ padding: '6px', color: 'var(--primary)' }}>
                                <Edit3 size={16} />
                             </button>
                             <button onClick={() => handleDelete(u.id)} className="btn btn-ghost" style={{ padding: '6px', color: 'var(--danger)' }} disabled={users.length <= 1}>
                                <Trash2 size={16} />
                             </button>
                          </div>
                       </td>
                   </tr>
               ))}
             </tbody>
          </table>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--danger)' }}>
            <ShieldAlert size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '13px', color: 'var(--danger)' }}>
            <strong>Cảnh báo Bảo mật:</strong> Chỉ có Chủ cửa hàng (ADMIN) mới có quyền vô hiệu hóa lịch sử Giao dịch và Sổ Quỹ hoặc Đổ mã Đám mây ngược. Vui lòng cấp quyền MANAGER cẩn trọng!
            </span>
        </div>
      </div>
    </div>
  );
}
