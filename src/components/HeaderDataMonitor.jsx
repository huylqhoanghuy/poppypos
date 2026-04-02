import React, { useState, useEffect } from 'react';
import { HardDrive, Cloud, Zap } from 'lucide-react';
import { StorageService } from '../services/api/storage';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';

export default function HeaderDataMonitor() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [localSizeKB, setLocalSizeKB] = useState(0);

  // Chỉ hiển thị cho ADMIN
  if (user?.role !== 'ADMIN') return null;

  useEffect(() => {
    // Để tránh render block UI, ta bọc trong requestAnimationFrame hoặc setTimeout
    let isMounted = true;
    setTimeout(() => {
       StorageService.getAll().then(data => {
          if (!isMounted) return;
          const sizeBytes = JSON.stringify(data).length;
          setLocalSizeKB((sizeBytes / 1024).toFixed(1));
       });
    }, 100);
    return () => { isMounted = false; };
  }, [settings?.lastCloudSyncTime, settings?.lastWebhookSync]);

  const cloudSize = settings?.lastCloudSyncSize ? (settings.lastCloudSyncSize / 1024).toFixed(1) : 0;
  const webhookSize = settings?.lastWebhookSyncSize ? (settings.lastWebhookSyncSize / 1024).toFixed(1) : 0;

  // Nếu local lệch mây quá 10KB thì là đang có sync gap (hoặc chưa sync)
  const isCloudSynced = cloudSize && Math.abs(parseFloat(localSizeKB) - parseFloat(cloudSize)) < 10;
  
  return (
    <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', padding: '4px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
       
       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '8px', background: '#F8FAFC', color: '#475569' }} title="Dung lượng trạm Máy Bộ (Local)">
         <HardDrive size={14} /> {localSizeKB} KB
       </div>

       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '8px', background: isCloudSynced ? '#F0FDF4' : '#F0F9FF', color: isCloudSynced ? '#15803D' : '#0369A1' }} title="Dung lượng trên Đám Mây Firebase">
         <Cloud size={14} color={isCloudSynced ? "#15803D" : "#0284C7"} /> 
         {cloudSize ? `${cloudSize} KB` : 'Đang đo...'}
       </div>

       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '8px', background: '#FEFCE8', color: '#B45309' }} title="Dung lượng Đám Mây 2 (Dropbox/Make)">
         <Zap size={14} /> 
         {webhookSize ? `${webhookSize} KB` : 'Off'}
       </div>

    </div>
  );
}
