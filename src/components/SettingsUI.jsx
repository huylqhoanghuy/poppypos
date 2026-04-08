import React, { useState } from 'react';
import { Save, Store, Users, Database, ShieldCheck, DownloadCloud, UploadCloud, AlertTriangle, Cloud, Trash2 } from 'lucide-react';


import { useAuth } from '../context/AuthContext';

// Tabs Components
import TenantConfigTab from './settings_tabs/TenantConfigTab';

export default function SettingsUI({ state, actions }) {
  // eslint-disable-next-line no-unused-vars
  const { settings, syncing, localBackupInt, localCloudInt, localWebhookUrl, fileInputRef } = state;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === 'ADMIN' ? 'tenant' : 'tenant');

  const {
    // eslint-disable-next-line no-unused-vars
    applyAutoBackup,
    // eslint-disable-next-line no-unused-vars
    applyAutoCloud,
    // eslint-disable-next-line no-unused-vars
    manualSync,
    // eslint-disable-next-line no-unused-vars
    handlePullCloud,
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
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '400px' }}>
            {activeTab === 'tenant' && <TenantConfigTab settings={settings} />}
        </div>
      </div>
    </div>
  );
}
