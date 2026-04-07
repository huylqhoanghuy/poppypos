import React, { useState, useEffect } from 'react';
import { Database, Cloud, Zap } from 'lucide-react';
import { StorageService } from '../services/api/storage';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../context/AuthContext';

export default function HeaderDataMonitor() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [localSizeKB, setLocalSizeKB] = useState(0);

  if (user?.role !== 'ADMIN') return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
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
  const webhookSizeObj = settings?.lastWebhookSyncSize;
  const webhookSize = webhookSizeObj ? (webhookSizeObj / 1024).toFixed(1) : 0;

  const isCloudSynced = cloudSize && Math.abs(parseFloat(localSizeKB) - parseFloat(cloudSize)) < 10;
  
  return (
    <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', padding: '4px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
       <style>
         {`
           @keyframes pulseDataFast {
             0%, 100% { opacity: 1; transform: scale(1); }
             50% { opacity: 0.2; transform: scale(0.9); }
           }
           @keyframes floatCloudSoft {
             0%, 100% { transform: translateY(0px) scale(1); }
             50% { transform: translateY(-3px) scale(1.1); }
           }
           @keyframes flashZapStrong {
             0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 0px transparent); }
             5%, 15% { opacity: 0.1; }
             10%, 20% { opacity: 1; transform: scale(1.3) rotate(15deg); filter: drop-shadow(0 0 6px #F59E0B); }
             25% { transform: scale(1) rotate(0deg); filter: drop-shadow(0 0 0px transparent); }
           }
           .wrapper-anim-data { display: inline-flex; transform-origin: center; animation: pulseDataFast 1.5s ease-in-out infinite; }
           .wrapper-anim-cloud { display: inline-flex; transform-origin: center; animation: floatCloudSoft 3s ease-in-out infinite; }
           .wrapper-anim-zap { display: inline-flex; transform-origin: center; animation: flashZapStrong 4s ease-out infinite; color: #EAB308 !important; }
         `}
       </style>
       
       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '8px', background: '#F8FAFC', color: '#475569' }} title="Dung lượng trạm Máy Bộ (Local)">
         <span className="wrapper-anim-data"><Database size={14} color="#64748B" /></span> {localSizeKB} KB
       </div>

       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '8px', background: isCloudSynced ? '#F0FDF4' : '#F0F9FF', color: isCloudSynced ? '#15803D' : '#0369A1' }} title="Dung lượng trên Đám Mây Firebase">
         <span className="wrapper-anim-cloud"><Cloud size={14} color={isCloudSynced ? "#15803D" : "#0284C7"} /></span> 
         {cloudSize ? `${cloudSize} KB` : 'Đang đo...'}
       </div>

       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '8px', background: '#FEFCE8', color: '#B45309' }} title="Dung lượng Đám Mây 2 (Dropbox/Make)">
         <span className={webhookSize !== 0 ? "wrapper-anim-zap" : "wrapper-anim-zap"} style={{ color: '#EAB308' }}>
            <Zap size={14} fill={webhookSize !== 0 ? "#FDE047" : "transparent"} />
         </span> 
         {webhookSize ? `${webhookSize} KB` : 'Off'}
       </div>
    </div>
  );
}
