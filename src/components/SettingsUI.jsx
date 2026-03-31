import React, { useState } from 'react';
import { Save, Store, Users, Database, ShieldCheck, DownloadCloud, UploadCloud, AlertTriangle, Cloud } from 'lucide-react';
import MockDataGenerator from './MockDataGenerator';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

// Tabs Components
import TenantConfigTab from './settings_tabs/TenantConfigTab';
import UsersManagementTab from './settings_tabs/UsersManagementTab';

export default function SettingsUI({ state, actions }) {
  const { settings, syncing, localBackupInt, localCloudInt, fileInputRef } = state;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === 'ADMIN' ? 'tenant' : 'backup');

  const {
    setLocalBackupInt,
    setLocalCloudInt,
    applyAutoBackup,
    applyAutoCloud,
    manualSync,
    handlePullCloud,
    handleBackup,
    handleRestoreClick,
    handleFileChange
  } = actions;

  // Fallback if settings are not loaded yet
  if (!settings) return null;

  return (
    <div className="glass-panel" style={{ padding: 'clamp(16px, 3vw, 24px)', margin: '0 auto', maxWidth: 1000 }}>
      {/* Header */}
      <h2 style={{ marginBottom: 24, color: 'var(--text-primary)', fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ShieldCheck size={28} color="var(--primary)" /> Quản Trị Hệ Thống Enterprise
      </h2>

      {/* Tabs Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Desktop Tab Header / Mobile Select */}
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '1px solid var(--surface-border)' }}>
            {user?.role === 'ADMIN' && (
               <button 
                 onClick={() => setActiveTab('tenant')}
                 style={{ 
                   display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', 
                   background: activeTab === 'tenant' ? 'var(--primary)' : 'transparent',
                   color: activeTab === 'tenant' ? 'white' : 'var(--text-secondary)',
                   border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                   transition: 'all 0.2s', whiteSpace: 'nowrap'
                 }}
               >
                 <Store size={18} /> Hồ Sơ Cửa Hàng
               </button>
            )}
            {user?.role === 'ADMIN' && (
               <button 
                 onClick={() => setActiveTab('users')}
                 style={{ 
                   display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', 
                   background: activeTab === 'users' ? 'var(--primary)' : 'transparent',
                   color: activeTab === 'users' ? 'white' : 'var(--text-secondary)',
                   border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                   transition: 'all 0.2s', whiteSpace: 'nowrap'
                 }}
               >
                 <Users size={18} /> Quản Lý Nhân Sự
               </button>
            )}
            
            <button 
              onClick={() => setActiveTab('backup')}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', 
                background: activeTab === 'backup' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'backup' ? 'white' : 'var(--text-secondary)',
                border: 'none', borderRadius: '12px', fontWeight: 600, fontSize: '15px', cursor: 'pointer',
                transition: 'all 0.2s', whiteSpace: 'nowrap'
              }}
            >
              <Database size={18} /> Bảo Trì & Đám Mây
            </button>
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '400px' }}>
            {activeTab === 'tenant' && <TenantConfigTab settings={settings} />}
            {activeTab === 'users' && <UsersManagementTab />}
            {activeTab === 'backup' && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Đồng Bộ Đám Mây */}
                  <div style={{ padding: 'clamp(16px, 3vw, 20px)', border: '1px solid var(--surface-border)', borderRadius: '16px', background: 'var(--surface-color)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                      <div style={{ flex: '1 1 200px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Cloud size={20} color="#0284C7" /> Lưu Khóa Cloud API (Đám Mây)
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, margin: 0 }}>
                          Hệ thống ưu tiên lưu cục bộ siêu tốc dưới nền. Việc đẩy dữ liệu lên Đám Mây hỗ trợ chế độ tự động định kỳ, trong khi việc Tải dữ liệu về luôn ở chế độ <strong style={{ color: 'var(--primary)', fontWeight: 600 }}>Thủ công 100%</strong> để tránh vô ý ghi đè.
                        </p>
                      </div>
                    </div>

                    <div style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--surface-border)', marginBottom: '20px', marginTop: '16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                          <div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--text-primary)' }}>Lịch Tự Động Lưu Đè Đám Mây</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Tiến trình tự động đẩy dữ liệu cục bộ cập nhật lên Đám mây.</p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <select className="form-input" value={localCloudInt} onChange={e => setLocalCloudInt(e.target.value)} style={{ width: '200px' }}>
                                <option value="none">Tắt (Thủ công)</option>
                                <option value="hourly">Mỗi giờ 1 lần</option>
                                <option value="halfday">Mỗi 12 tiếng</option>
                                <option value="daily">Mỗi ngày 1 lần</option>
                            </select>
                            <button className="btn btn-primary" onClick={applyAutoCloud} disabled={localCloudInt === settings.autoCloudSyncInterval} style={{ padding: '8px 16px', fontWeight: 600 }}>Lưu Cài Đặt</button>
                          </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--surface-border)' }}>
                          <div style={{ background: settings.lastCloudSyncTime ? 'var(--success)' : 'var(--danger)', width: '10px', height: '10px', borderRadius: '50%' }} />
                          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Lần đồng bộ ngầm gần nhất:</span>
                          {settings.lastCloudSyncTime ? (
                            <strong style={{ color: 'var(--success)' }}>{new Date(settings.lastCloudSyncTime).toLocaleString('vi-VN')}</strong>
                          ) : (
                            <strong style={{ color: 'var(--danger)' }}>Chưa có lần lưu tự động nào</strong>
                          )}
                      </div>
                    </div>

                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px dashed var(--surface-border)', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                        <button className="btn btn-outline" onClick={handlePullCloud} disabled={syncing} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 16px', borderColor: '#0284C7', color: '#0284C7', background: '#F0F9FF', borderRadius: '12px' }}>
                          <DownloadCloud size={32}/>
                          <span style={{ fontWeight: 600, fontSize: '15px' }}>{syncing ? 'Đang Tải...' : 'Tải Dữ Liệu Từ Đám Mây'}</span>
                        </button>
                        <button className="btn btn-primary" onClick={manualSync} disabled={syncing} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 16px', borderRadius: '12px' }}>
                          <UploadCloud size={32}/> 
                          <span style={{ fontWeight: 600, fontSize: '15px' }}>{syncing ? 'Đang Tải...' : 'Lưu Đè Lên Đám Mây'}</span>
                        </button>
                      </div>
                  </div>

                  {/* Khôi phục & Sao lưu File Ổ đĩa nội bộ */}
                  <div style={{ padding: 'clamp(16px, 3vw, 20px)', border: '1px solid var(--surface-border)', borderRadius: '16px', background: 'var(--surface-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <DownloadCloud size={20} color="#16A34A" />
                      <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>Sao lưu ổ đĩa & Cứu Hộ Dữ Liệu</h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5, marginTop: 0, marginBottom: 20 }}>
                      Tải về toàn bộ cấu trúc hệ thống (Đơn hàng, Khách hàng, Sản phẩm, Sổ quỹ) thành một Tệp tin định dạng siêu nhẹ (JSON) để lưu trữ thủ công trên Desktop của bạn phòng hờ sự cố mạng.
                    </p>

                    <div style={{ padding: '16px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--surface-border)', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed var(--surface-border)' }}>
                          <div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--text-primary)' }}>Lịch tự động tải File Backup</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Hệ thống sẽ tự động kích hoạt tiến trình tải File an toàn về máy.</p>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <select className="form-input" value={localBackupInt} onChange={e => setLocalBackupInt(e.target.value)} style={{ width: '200px' }}>
                                <option value="none">Tắt (Thủ công)</option>
                                <option value="hourly">Mỗi giờ 1 lần</option>
                                <option value="daily">Mỗi ngày 1 lần</option>
                                <option value="weekly">Mỗi tuần 1 lần</option>
                                <option value="monthly">Mỗi tháng 1 lần</option>
                            </select>
                            <button className="btn btn-primary" onClick={applyAutoBackup} disabled={localBackupInt === settings.autoBackupInterval} style={{ padding: '8px 16px', fontWeight: 600 }}>Lưu Lịch Trình</button>
                          </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ background: settings.lastBackupTime ? 'var(--success)' : 'var(--danger)', width: '10px', height: '10px', borderRadius: '50%' }} />
                          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Trạng thái bảo vệ:</span>
                          {settings.lastBackupTime ? (
                            <strong style={{ color: 'var(--success)' }}>
                              Bản lưu gần nhất lúc {new Date(settings.lastBackupTime).toLocaleString('vi-VN')}
                            </strong>
                          ) : (
                            <strong style={{ color: 'var(--danger)' }}>Hệ thống chưa từng xuất bản sao lưu nào. Hãy sao lưu ngay!</strong>
                          )}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px' }}>
                      <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 16px', borderColor: 'var(--success)', color: 'var(--success)' }} onClick={handleBackup}>
                        <DownloadCloud size={32} />
                        <span style={{ fontWeight: 600 }}>Tải Bản Sao Lưu (.json)</span>
                      </button>

                      <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px 16px', borderColor: 'var(--danger)', color: 'var(--danger)', background: '#FEF2F2' }} onClick={handleRestoreClick}>
                        <UploadCloud size={32} />
                        <span style={{ fontWeight: 600 }}>Phục Hồi Dữ Liệu Lên Lại</span>
                        <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                      </button>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--danger)' }}>
                      <AlertTriangle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '13px', color: 'var(--danger)' }}>
                        <strong>Thận trọng:</strong> Hành động tải Tệp Tin lên Phục hồi sẽ xóa hoàn toàn và ghi đè dữ liệu phiên làm việc lúc này. Chỉ thực hiện khi được chuyên gia hướng dẫn hoặc mất mã đám mây.
                      </span>
                    </div>
                  </div>

                  {user?.role === 'ADMIN' && <MockDataGenerator />}
               </div>
            )}
        </div>
      </div>
    </div>
  );
}
