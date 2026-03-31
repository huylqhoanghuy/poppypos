import { useEffect, useRef } from 'react';

export function useAutoBackup(state, dispatch, syncToCloud) {
  const stateRef = useRef(state);
  const syncToCloudRef = useRef(syncToCloud);
  
  // Keep refs synchronized with the latest state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    syncToCloudRef.current = syncToCloud;
  }, [syncToCloud]);

  useEffect(() => {
    const checkAndBackup = async () => {
       const currentState = stateRef.current;
       const settings = currentState.settings || {};
       const now = Date.now();
       
       // 1. Kiểm tra tải File JSON cục bộ
       const localInterval = settings.autoBackupInterval;
       if (localInterval && localInterval !== 'none') {
           const lastTime = settings.lastBackupTime;
           let shouldBackup = false;
           if (!lastTime) {
             shouldBackup = true;
           } else {
             const diffHrs = (now - lastTime) / (1000 * 60 * 60);
             if (localInterval === 'hourly' && diffHrs >= 1) shouldBackup = true;
             if (localInterval === 'daily' && diffHrs >= 24) shouldBackup = true;
             if (localInterval === 'weekly' && diffHrs >= 24 * 7) shouldBackup = true;
             if (localInterval === 'monthly' && diffHrs >= 24 * 30) shouldBackup = true;
           }

           if (shouldBackup) {
              const dataStr = JSON.stringify(currentState, null, 2);
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `poppy_pos_autobackup_${new Date().toISOString().slice(0,10)}.json`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              
              dispatch({ type: 'UPDATE_SETTINGS', payload: { lastBackupTime: now } });
              dispatch({ 
                 type: 'SHOW_TOAST', 
                 payload: { message: `Đã tự động tải xuống bản sao lưu định kỳ (${localInterval})! Vui lòng lưu trữ tệp cẩn thận.`, type: 'success' } 
              });
           }
       }

       // 2. Kiểm tra đẩy Đám mây tự động
       const cloudInterval = settings.autoCloudSyncInterval;
       if (cloudInterval && cloudInterval !== 'none' && syncToCloudRef.current) {
           const lastCloudTime = settings.lastCloudSyncTime;
           let shouldCloudSync = false;
           if (!lastCloudTime) {
             shouldCloudSync = true;
           } else {
             const diffHrs = (now - lastCloudTime) / (1000 * 60 * 60);
             if (cloudInterval === 'hourly' && diffHrs >= 1) shouldCloudSync = true;
             if (cloudInterval === 'halfday' && diffHrs >= 12) shouldCloudSync = true;
             if (cloudInterval === 'daily' && diffHrs >= 24) shouldCloudSync = true;
           }

           if (shouldCloudSync) {
              dispatch({ type: 'UPDATE_SETTINGS', payload: { lastCloudSyncTime: now } });
              await syncToCloudRef.current();
           }
       }
    };

    // Kiểm tra sau 5 giây kể từ khi khởi động ứng dụng
    const timeout = setTimeout(checkAndBackup, 5000);
    // Sau đó kiểm tra định kỳ mỗi 15 phút (để dò các lịch trình sắp tới hạn kịp thời)
    const timer = setInterval(checkAndBackup, 15 * 60 * 1000);
    
    return () => {
      clearTimeout(timeout);
      clearInterval(timer);
    };
  }, [state.settings?.autoBackupInterval, state.settings?.autoCloudSyncInterval, state.settings?.lastBackupTime, state.settings?.lastCloudSyncTime, dispatch]);
}
