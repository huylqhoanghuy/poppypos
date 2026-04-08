import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useConfirm } from '../context/ConfirmContext';
import { X, Users, FileText, ArrowRight, Shield, ShieldAlert, Monitor, LogIn, LogOut, PlusCircle, Trash2, Edit2, AlertTriangle, Filter } from 'lucide-react';

const ActivityLogsUI = ({ targetUsername = '', embedded = false, onClose }) => {
   const { state, dispatch } = useData();
   const { confirm } = useConfirm();
   const logs = state.activityLogs || [];
   const [filterUsername, setFilterUsername] = useState(targetUsername);
   const [filterAction, setFilterAction] = useState('ALL');
   const [limit, setLimit] = useState(100); // Mặc định chỉ show 100 dòng mới nhất

   const filteredLogs = logs.filter(log => {
      let match = true;
      if (filterUsername && !(log.userName || '').toLowerCase().includes(filterUsername.toLowerCase())) match = false;
      if (filterAction !== 'ALL' && log.action !== filterAction) match = false;
      return match;
   }).slice(0, limit);

   const getActionIcon = (action) => {
      switch(action) {
         case 'LOGIN': return <LogIn size={16} color="#059669" />;
         case 'LOGOUT': return <LogOut size={16} color="#64748b" />;
         case 'CREATE_ORDER': return <PlusCircle size={16} color="#2563eb" />;
         case 'DELETE_ORDER': return <Trash2 size={16} color="#dc2626" />;
         case 'UPDATE_ORDER': return <Edit2 size={16} color="#f59e0b" />;
         case 'CREATE_PRODUCT': return <PlusCircle size={16} color="#16a34a" />;
         case 'UPDATE_PRODUCT': return <Edit2 size={16} color="#f59e0b" />;
         case 'DELETE_PRODUCT': return <Trash2 size={16} color="#dc2626" />;
         case 'ADD_USER': return <Shield size={16} color="#4f46e5" />;
         case 'UPDATE_USER': return <ShieldAlert size={16} color="#4f46e5" />;
         case 'DELETE_USER': return <AlertTriangle size={16} color="#dc2626" />;
         default: return <FileText size={16} color="#94a3b8" />;
      }
   };

   const handleClearLogs = async () => {
      const isConfirmed = await confirm({
         title: 'Hủy diệt Bộ nhớ đệm',
         message: 'Bạn có chắc chắn muốn xóa SẠCH toàn bộ dấu vết lịch sử hoạt động không? Hành động này giúp giải phóng RAM bộ nhớ nhưng sẽ không thể khôi phục các Log cũ!',
         confirmText: 'Xác nhận xóa sạch',
         type: 'danger'
      });
      
      if (isConfirmed) {
         dispatch({ type: 'CLEAR_ACTIVITY_LOGS' });
         dispatch({ type: 'SHOW_TOAST', payload: { message: 'Đã xóa toàn bộ Lịch sử hoạt động thành công!', type: 'success' } });
      }
   };

   const formatTime = (ts) => {
      if (!ts) return '';
      const d = new Date(ts);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit', second:'2-digit' }) + ' - ' + d.toLocaleDateString('vi-VN');
   };

   return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', paddingBottom: embedded ? '0' : '32px' }}>
         <div className={embedded ? "" : "glass-panel"} style={{ padding: embedded ? '0' : '20px', borderRadius: '12px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div>
                 <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: embedded ? '18px' : '20px' }}>
                    <Monitor size={embedded ? 20 : 24} color="var(--primary)" /> Lịch Sử Hoạt Động (Nhật Ký)
                 </h2>
                 {!embedded && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px', marginBottom: '20px' }}>
                       Ghi nhận tất cả thao tác của nhân viên dưới dạng Log (Tối đa hiển thị 2000 thao tác mới nhất).
                    </p>
                 )}
                 {embedded && <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '6px', marginBottom: '16px' }}>Sao kê các tương tác hệ thống của người dùng này.</p>}
               </div>
               
               <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-outline" style={{ padding: '8px 16px', color: 'var(--danger)', borderColor: '#fecaca', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleClearLogs}>
                     <Trash2 size={16} /> Dọn Rác Lịch Sử
                  </button>
                  {embedded && onClose && (
                     <button className="btn btn-ghost" onClick={onClose} style={{ padding: '8px' }}>
                        <X size={20} /> {/* Invisible placeholder or use X icon */}
                     </button>
                  )}
               </div>
             </div>

             {/* BỘ LỌC */}
             <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                   <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Tìm Nhân Viên</label>
                   <input type="text" className="form-control" placeholder="Nhập tên nhân viên..." value={filterUsername} onChange={(e) => setFilterUsername(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                   <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Hành Động</label>
                   <select className="form-control" value={filterAction} onChange={(e) => setFilterAction(e.target.value)} style={{ width: '100%' }}>
                      <option value="ALL">Tất cả thao tác</option>
                      <option value="LOGIN">Đăng nhập (LOGIN)</option>
                      <option value="LOGOUT">Đăng xuất (LOGOUT)</option>
                      <option value="CREATE_ORDER">Tạo đơn hàng (CREATE_ORDER)</option>
                      <option value="DELETE_ORDER">Xóa/Hủy đơn (DELETE_ORDER)</option>
                      <option value="UPDATE_ORDER">Cập nhật đơn (UPDATE_ORDER)</option>
                      <option value="ADD_USER">Cấp quyền nhân viên (ADD_USER)</option>
                   </select>
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                   <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Hiển thị</label>
                   <select className="form-control" value={limit} onChange={(e) => setLimit(Number(e.target.value))} style={{ width: '100%' }}>
                      <option value={50}>50 dòng gần nhất</option>
                      <option value={100}>100 dòng gần nhất</option>
                      <option value={500}>500 dòng gần nhất</option>
                      <option value={2000}>2000 dòng gần nhất</option>
                   </select>
                </div>
             </div>
         </div>

         <div className={embedded ? "" : "glass-panel"} style={{ flex: 1, padding: '0', borderRadius: '12px', overflow: 'hidden', border: embedded ? '1px solid var(--surface-border)' : 'none' }}>
             {filteredLogs.length === 0 ? (
                 <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                     Không tìm thấy nhật ký hoạt động nào phù hợp.
                 </div>
             ) : (
                 <div style={{ overflowX: 'auto', maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                     <table className="glass-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-color)', zIndex: 10 }}>
                           <tr style={{ borderBottom: '2px solid var(--surface-border)' }}>
                              <th style={{ padding: '16px', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', width: '200px' }}>Thời Gian</th>
                              <th style={{ padding: '16px', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', width: '200px' }}>Nhân Sự</th>
                              <th style={{ padding: '16px', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', width: '150px' }}>Hành Động</th>
                              <th style={{ padding: '16px', fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Diễn Giải</th>
                           </tr>
                        </thead>
                        <tbody>
                           {filteredLogs.map(log => (
                              <tr key={log.id} style={{ borderBottom: '1px solid var(--surface-border)', transition: '0.2s', background: log.action.includes('DELETE') ? '#fef2f2' : 'transparent' }}>
                                 <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>{formatTime(log.timestamp)}</td>
                                 <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                                       {(log.userName || '??').substring(0,2).toUpperCase()}
                                    </div>
                                    {log.userName || 'Không xác định'}
                                 </td>
                                 <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                       {getActionIcon(log.action)} {log.action || 'UNKNOWN'}
                                    </div>
                                 </td>
                                 <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                                    {log.details}
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                 </div>
             )}
         </div>
      </div>
   );
};

export default ActivityLogsUI;
