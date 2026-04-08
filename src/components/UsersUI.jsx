import React, { useState } from 'react';
import { Edit2, ShieldAlert, Key, Trash2, Eye, EyeOff, PlusCircle, Shield, User, X, Unlock, Save, Activity } from 'lucide-react';
import ModuleLayout from './ModuleLayout';
import SmartTable from './SmartTable';
import ActivityLogsUI from './ActivityLogsUI';

const UsersUI = ({ users, settings, onSave, onDelete, onUpdatePin }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPasswords, setViewingPasswords] = useState({});
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'CASHIER',
    status: 'active'
  });

  const [pinValue, setPinValue] = useState(settings?.securityPin || '1004');
  const [showPin, setShowPin] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [viewingLogsFor, setViewingLogsFor] = useState(null);

  const togglePasswordView = (id) => {
    setViewingPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: user.password || '', // Display plain password
        name: user.name,
        role: user.role,
        status: user.status || 'active'
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        role: 'CASHIER',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...(editingUser ? { id: editingUser.id } : {}),
      ...formData
    });
    closeModal();
  };

  const handleDelete = (user) => {
    if (user.id === 'U1') {
       alert('Tuyệt đối không được xóa tài khoản Quản Trị Tối Cao.');
       return;
    }
    if (window.confirm(`Bạn có chắc muốn khóa hoặc xóa vĩnh viễn tài khoản [${user.username}] không?`)) {
       onDelete(user.id);
    }
  };

  const columns = [
    {
      header: 'Nhân_viên',
      key: 'name',
      render: (val, u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={`https://ui-avatars.com/api/?name=${u.name}&background=random`} alt={u.name} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '15px' }}>{u.name}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>@{u.username}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Cấp_bậc (Role)',
      key: 'role',
      render: (val, u) => {
        let badgeColor = '#94a3b8'; let bg = '#f1f5f9'; let icon = <User size={14} />;
        if (u.role === 'ADMIN') { badgeColor = '#dc2626'; bg = '#fef2f2'; icon = <ShieldAlert size={14} />; }
        if (u.role === 'MANAGER') { badgeColor = '#059669'; bg = '#ecfdf5'; icon = <Shield size={14} />; }
        
        return (
          <span style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '6px', 
            padding: '4px 10px', borderRadius: '20px', 
            fontSize: '12px', fontWeight: 700, 
            color: badgeColor, background: bg, border: `1px solid ${badgeColor}30` 
          }}>
            {icon} {u.role}
          </span>
        );
      }
    },
    {
      header: 'Mật_khẩu',
      key: 'password',
      render: (val, u) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
          <Key size={14} color="#64748b" />
          <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: viewingPasswords[u.id] ? 'normal' : '2px', color: 'var(--text-primary)', fontSize: '14px', minWidth: '60px' }}>
             {viewingPasswords[u.id] ? (u.password || '******') : '******'}
          </span>
          <button 
             onClick={() => togglePasswordView(u.id)}
             style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--primary)', display: 'flex', marginLeft: '10px' }}
             title={viewingPasswords[u.id] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
             {viewingPasswords[u.id] ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      )
    },
    {
      header: 'Trạng_thái',
      key: 'status',
      render: (val, u) => (
        <span style={{ 
          color: u.status === 'active' ? '#16a34a' : '#ef4444', 
          fontWeight: 600, fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '4px'
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: u.status === 'active' ? '#16a34a' : '#ef4444' }} />
          {u.status === 'active' ? 'Đang hoạt động' : 'Bị khóa'}
        </span>
      )
    },
    {
      header: 'Hành_động',
      key: 'actions',
      render: (val, u) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setViewingLogsFor(u.username)} className="btn btn-outline" style={{ padding: '6px', color: '#059669', borderColor: '#a7f3d0' }} title="Sao kê Nhật ký Hoạt động">
            <Activity size={16} />
          </button>
          <button onClick={() => openModal(u)} className="btn btn-outline" style={{ padding: '6px', color: 'var(--primary)', borderColor: 'var(--primary-light)' }} title="Chỉnh sửa">
            <Edit2 size={16} />
          </button>
          <button onClick={() => handleDelete(u)} className="btn btn-outline" style={{ padding: '6px', color: 'var(--danger)', borderColor: '#fecaca', opacity: u.id === 'U1' ? 0.3 : 1 }} disabled={u.id === 'U1'} title="Thiết quân luật (Khóa/Xóa)">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <ModuleLayout
      title="Nhân Sự & Phân Quyền"
      icon={Shield}
      description="Quản lý tài khoản đăng nhập máy POS. Admin có toàn quyền cấp thẻ và thiết lập mật khẩu cho nhân viên."
      extraHeaderActions={
        <button className="btn btn-primary table-feature-btn" onClick={() => openModal()} title="Thêm Nhân Viên">
           <PlusCircle size={16} /> <span className="hide-on-mobile" style={{fontSize: '13px', fontWeight: 600}}>Thêm Nhân Viên</span>
        </button>
      }
    >
      <div style={{
          background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px',
          display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Unlock size={18} color="var(--primary)" />
             Thiết Lập Mã PIN Két Sắt (Master PIN)
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
             Sử dụng cho các chức năng bảo mật cấp cao như Xóa toàn bộ DB, Kéo dữ liệu Prod.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', maxWidth: '300px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                  <input 
                      type={showPin ? "text" : "password"} 
                      value={pinValue}
                      onChange={(e) => setPinValue(e.target.value)}
                      className="form-control"
                      style={{ paddingRight: '40px', letterSpacing: showPin ? 'normal' : '4px', fontFamily: 'monospace', fontWeight: 600, fontSize: '16px' }}
                  />
                  <button 
                     onClick={() => setShowPin(!showPin)}
                     style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                     {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
              </div>
              <button className="btn btn-primary" onClick={() => onUpdatePin(pinValue)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Save size={16} /> Lưu PIN
              </button>
          </div>
      </div>

      <SmartTable data={users} columns={columns} pagination={false} searchKey="name" />

      {/* MODAL USER FORM */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', background: 'rgba(0,0,0,0.4)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px', fontWeight: 800 }}>{editingUser ? 'Cập Nhật Tài Khoản' : 'Thêm Nhân Viên Mới'}</h3>
              <button className="btn btn-ghost" onClick={closeModal} style={{ padding: '8px', color: 'var(--text-secondary)' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Tên hiển thị (Tên thật) <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Vd: Nguyễn Văn A" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--surface-color)', outline: 'none' }} />
              </div>
              
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Tên Đăng Nhập (Username) <span style={{color: '#ef4444'}}>*</span></label>
                <input required type="text" className="form-control" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} disabled={editingUser?.id === 'U1'} placeholder="Viết liền không dấu, vd: nguyen_a" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: editingUser?.id === 'U1' ? 'var(--surface-variant)' : 'var(--surface-color)', outline: 'none' }} />
                {editingUser?.id === 'U1' && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>Tài khoản Admin gốc không được phép đổi tên đăng nhập.</span>}
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Mật Khẩu Đăng Nhập <span style={{color: '#ef4444'}}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input 
                    required 
                    type={showFormPassword ? "text" : "password"} 
                    className="form-control" 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    placeholder="Mật khẩu rõ (Tự động hiển thị dạng sao cho Cashier)" 
                    style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--surface-color)', outline: 'none' }} 
                  />
                  <button 
                     type="button"
                     onClick={() => setShowFormPassword(!showFormPassword)}
                     style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }}
                     title={showFormPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                     {showFormPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Vai trò / Cấp bậc <span style={{color: '#ef4444'}}>*</span></label>
                  <select className="form-control" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} disabled={editingUser?.id === 'U1'} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--surface-color)', outline: 'none' }}>
                    <option value="CASHIER">Thu Ngân (CASHIER)</option>
                    <option value="MANAGER">Quản Lý (MANAGER)</option>
                    {editingUser?.id === 'U1' && <option value="ADMIN">Quản Trị Tối Cao (ADMIN)</option>}
                  </select>
                </div>
                
                <div className="form-group">
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Trạng thái</label>
                  <select className="form-control" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} disabled={editingUser?.id === 'U1'} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'var(--surface-color)', outline: 'none' }}>
                    <option value="active">Đang kích hoạt</option>
                    <option value="inactive">Tạm khóa thẻ</option>
                  </select>
                </div>
              </div>

              <div style={{ 
                 background: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px solid #fde68a', 
                 marginTop: '8px', fontSize: '13px', color: '#92400e', lineHeight: 1.5 
              }}>
                <strong>Lưu ý quyền hạn:</strong><br/>
                - <b>Thu Ngân</b> không xem được Lợi nhuận (P&L), Danh mục Vốn, hay các Báo cáo Cấp cao.
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                 <button type="button" className="btn btn-ghost" onClick={closeModal} style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: 600, background: 'var(--surface-variant)' }}>Hủy Bỏ</button>
                 <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '12px', borderRadius: '8px', fontWeight: 600 }}>{editingUser ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL USER LOGS */}
      {viewingLogsFor && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', background: 'rgba(0,0,0,0.4)' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', height: '80vh', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
             <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                <ActivityLogsUI targetUsername={viewingLogsFor} embedded={true} onClose={() => setViewingLogsFor(null)} />
             </div>
          </div>
        </div>
      )}
    </ModuleLayout>
  );
};

export default UsersUI;
