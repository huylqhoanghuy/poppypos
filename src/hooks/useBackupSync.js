import { useState, useEffect, useRef } from 'react';
import { useSettings } from './useSettings';
import { useCloudSync } from './useCloudSync';
import { useData } from '../context/DataContext';
import { useConfirm } from '../context/ConfirmContext';
import { StorageService } from '../services/api/storage';

export const useBackupSync = () => {
  const { dispatch } = useData();
  const { confirm } = useConfirm();
  const { settings, updateSettings } = useSettings();
  const { syncToCloud, pullFromCloud, pullFromProdCloud, syncing } = useCloudSync();

  const [localBackupInt, setLocalBackupInt] = useState('none');
  const [localCloudInt, setLocalCloudInt] = useState('none');
  const [localCloudTime, setLocalCloudTime] = useState(''); // Thêm state cho thời gian hẹn giờ HH:MM
  const [localWebhookUrl, setLocalWebhookUrl] = useState('');
  
  const [localTitle1, setLocalTitle1] = useState('');
  const [localTitle2, setLocalTitle2] = useState('');
  const [localTitle3, setLocalTitle3] = useState('');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (settings) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalBackupInt(settings.autoBackupInterval || 'none');
      setLocalCloudInt(settings.autoCloudSyncInterval || 'none');
      setLocalCloudTime(settings.autoCloudSyncTime || '');
      setLocalWebhookUrl(settings.webhookUrl || '');
      
      setLocalTitle1(settings.customBackupTitle1 || 'Đồng Bộ Cloud API Dự Phòng');
      setLocalTitle2(settings.customBackupTitle2 || 'Tự Động Đẩy Dữ Liệu Lên Đám Mây (Make.com)');
      setLocalTitle3(settings.customBackupTitle3 || 'Tải File Cứng (Dữ Liệu Nội Bộ JSON)');
    }
  }, [settings]);

  const showToast = (message, type = 'success') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  };

  const applyAutoBackup = async () => {
    const payload = { autoBackupInterval: localBackupInt };
    await updateSettings(payload);
    dispatch({ type: 'UPDATE_SETTINGS', payload });
    showToast(`Đã lưu cài đặt tự động tải Backup JSON: ${localBackupInt}`);
  };

  const applyAutoCloud = async () => {
    const payload = { autoCloudSyncInterval: localCloudInt };
    await updateSettings(payload);
    dispatch({ type: 'UPDATE_SETTINGS', payload });
    showToast(`Đã lưu cài đặt tự động Đẩy Cloud: ${localCloudInt}`);
  };

  const applyAutoCloudTime = async () => {
    const payload = { autoCloudSyncTime: localCloudTime };
    await updateSettings(payload);
    dispatch({ type: 'UPDATE_SETTINGS', payload });
    if(localCloudTime) {
       showToast(`Đã hẹn giờ tự động đẩy Webhook lên Đám Mây vào lúc: ${localCloudTime} hằng ngày`);
    } else {
       showToast(`Đã tắt hẹn giờ tự động đẩy Cloud`);
    }
  };

  const applyCustomTitle = async (key, value) => {
    const payload = { [key]: value };
    await updateSettings(payload);
    dispatch({ type: 'UPDATE_SETTINGS', payload });
  };

  const manualSync = async () => {
    const result = await syncToCloud();
    showToast(result.message, result.success ? 'success' : 'error');
    if (result.success && result.size) {
        await updateSettings({ lastCloudSyncSize: result.size, lastCloudSyncTime: Date.now() });
    }
  };

  const handlePullCloud = async () => {
    const result = await pullFromCloud();
    if (result.success) {
      showToast(result.message, 'success');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showToast(result.message, 'error');
    }
  };

  const applyWebhookUrl = async () => {
    const trimmedUrl = localWebhookUrl ? localWebhookUrl.trim() : '';
    const payload = { webhookUrl: trimmedUrl };
    await updateSettings(payload);
    dispatch({ type: 'UPDATE_SETTINGS', payload });
    showToast(`Đã lưu URL Webhook Cloud (Google Drive/Dropbox)!`);
  };

  const handlePullProdCloud = async () => {
    if (!import.meta.env.DEV) {
       showToast('Chức năng này chỉ khả dụng trên môi trường Local Development!', 'error');
       return;
    }

    const { confirmed, value } = await confirm({
      title: 'KÉO DỮ LIỆU TỪ PRODUCTION',
      message: `HÀNH ĐỘNG NGUY HIỂM: Thao tác này sẽ tải dữ liệu thực tế đang chạy trên LIVE xuống máy tính này, ghi đè toàn bộ dữ liệu Dev Local hiện tại.\n\nVui lòng nhập mã PIN (${settings.securityPin || '1004'}) để xác nhận quyền:`,
      type: 'danger',
      confirmText: 'CHẤP NHẬN ĐỒNG BỘ PROD',
      withInput: true
    });

    if (confirmed) {
       if (value !== (settings.securityPin || '1004')) {
          showToast('Mã PIN không chính xác! Đã huỷ thao tác.', 'error');
          return;
       }
       showToast('Đang tải dữ liệu từ DB Production [store_data]...', 'success');
       const result = await pullFromProdCloud();
       if (result.success) {
          showToast('Đã sao chép DB Prod. Hệ thống sẽ khởi động lại!', 'success');
          setTimeout(() => window.location.reload(), 1500);
       } else {
          showToast(result.message, 'error');
       }
    }
  };

  const testWebhook = async () => {
    if (import.meta.env.DEV) {
       showToast('Đang chạy ở môi trường Máy Bộ (DEV). Tạm thời Khóa gửi Webhook để tránh đẩy dữ liệu nháp vào luồng thực!', 'warning');
       return;
    }
  
    const hookUrl = settings.webhookUrl ? settings.webhookUrl.trim() : '';
    if (!hookUrl) {
      showToast('Vui lòng nhập và lưu Webhook URL trước!', 'error');
      return;
    }
    
    if (!hookUrl.startsWith('http')) {
      showToast('Link Webhook không hợp lệ. Phải bắt đầu bằng http:// hoặc https://', 'error');
      return;
    }
    
    try {
      showToast('Đang đóng gói và gửi dữ liệu lên Webhook...', 'success');
      const entireState = await StorageService.getAll();
      
      // Cơ chế xoay vòng Camera DVR (1-5 slots)
      const currentSlot = settings.backupDvrSlot ? Number(settings.backupDvrSlot) : 1;
      const nextSlot = currentSlot >= 5 ? 1 : currentSlot + 1;
      const suggestedName = `poppy_backup_slot_${currentSlot}.json`;

      const payload = {
        timestamp: new Date().toISOString(),
        storeName: settings.storeName || 'POPPY POS',
        type: 'auto_webhook_sync',
        dvrSlot: currentSlot,
        suggestedFilename: suggestedName,
        filename: suggestedName,
        data: entireState,
        // Bí quyết: Cung cấp sẵn một biến string thô (Text) để anh map thẳng vào ô File Content (Make/Zapier)
        // Việc này ngăn lỗi Make.com biến data thành chữ [Collection] hoặc file 24 bytes (do nhầm map timestamp)
        fileContentString: JSON.stringify(entireState, null, 2),
        value: JSON.stringify(entireState, null, 2)
      };
      
      const payloadString = JSON.stringify(payload);
      const payloadSize = payloadString.length;
      
      // Đính kèm thẳng tên file vào URL để Make.com dễ dàng lấy ra mà không cần Parse Body!
      const separator = hookUrl.includes('?') ? '&' : '?';
      const finalUrl = `${hookUrl}${separator}filename=${suggestedName}`;

      const response = await fetch(finalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: payloadString
      });
      
      if (response.ok) {
        showToast('✅ Đã gửi thành công bản Backup JSON lên Webhook Cloud (Make/Zapier)!', 'success');
        await updateSettings({ lastWebhookSync: Date.now(), lastWebhookSyncSize: payloadSize, backupDvrSlot: nextSlot });
      } else {
        showToast(`Make/Zapier từ chối. HTTP Code: ${response.status}`, 'error');
      }
    } catch (e) {
      console.error('Webhook Error:', e);
      showToast(`Mạng Lỗi / Hoặc link sai: ${e.message}`, 'error');
    }
  };

  const handleBackup = async () => {
    const entireState = await StorageService.getAll();
    const dataStr = JSON.stringify(entireState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `poppy_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    await updateSettings({ lastBackupTime: Date.now() });
    showToast('Đã tải xuống bản sao lưu dữ liệu cục bộ thành công!');
  };

  const handleRestoreClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedState = JSON.parse(event.target.result);

        const isConfirmed = await confirm({
          title: 'Phục hồi dữ liệu từ file',
          message: 'CẢNH BÁO NGUY HIỂM: Hành động này sẽ GHI ĐÈ XÓA SẠCH toàn bộ dữ liệu hiện tại (chi nhánh, đơn hàng, hóa đơn, quỹ) bằng dữ liệu cũ từ file Backup. Bạn có chắc chắn muốn tiến hành?',
          confirmText: 'Tôi hiểu, Ghi đè',
          type: 'danger'
        });

        if (isConfirmed) {
          await StorageService.saveAll(importedState);
          const cloudResult = await syncToCloud(); if(cloudResult.success){showToast('Khôi phục Bản cứng và Đám Mây Mẹ thành công! Vui lòng đợi tải lại...');}else{showToast('Lỗi hệ thống: '+cloudResult.message, 'error');}
          setTimeout(() => { window.location.reload(); }, 1500);
        }
      } catch {
        showToast('File không hợp lệ hoặc bị lỗi định dạng JSON. Vui lòng kiểm tra lại!', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return {
    state: {
      settings,
      syncing,
      localBackupInt,
      localCloudInt,
      localCloudTime,
      localWebhookUrl,
      localTitle1,
      localTitle2,
      localTitle3,
      fileInputRef
    },
    actions: {
      setLocalBackupInt,
      setLocalCloudInt,
      setLocalCloudTime,
      setLocalWebhookUrl,
      setLocalTitle1,
      setLocalTitle2,
      setLocalTitle3,
      applyAutoBackup,
      applyAutoCloud,
      applyAutoCloudTime,
      applyCustomTitle,
      applyWebhookUrl,
      testWebhook,
      manualSync,
      handlePullCloud,
      handlePullProdCloud,
      handleBackup,
      handleRestoreClick,
      handleFileChange
    }
  };
};
