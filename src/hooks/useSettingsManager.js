import { useState, useEffect, useRef } from 'react';
import { useSettings } from './useSettings';
import { useCloudSync } from './useCloudSync';
import { useData } from '../context/DataContext';
import { useConfirm } from '../context/ConfirmContext';
import { StorageService } from '../services/api/storage';

export const useSettingsManager = () => {
  const { dispatch } = useData();
  const { confirm } = useConfirm();
  const { settings, updateSettings } = useSettings();
  const { syncToCloud, pullFromCloud, syncing } = useCloudSync();

  const [localBackupInt, setLocalBackupInt] = useState('none');
  const [localCloudInt, setLocalCloudInt] = useState('none');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (settings) {
      setLocalBackupInt(settings.autoBackupInterval || 'none');
      setLocalCloudInt(settings.autoCloudSyncInterval || 'none');
    }
  }, [settings]);

  const showToast = (message, type = 'success') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  };

  const applyAutoBackup = async () => {
    await updateSettings({ autoBackupInterval: localBackupInt });
    showToast(`Đã lưu cài đặt tự động Backup JSON: ${localBackupInt}`);
  };

  const applyAutoCloud = async () => {
    await updateSettings({ autoCloudSyncInterval: localCloudInt });
    showToast(`Đã lưu cài đặt tự động Đẩy Cloud: ${localCloudInt}`);
  };

  const manualSync = async () => {
    const result = await syncToCloud();
    showToast(result.message, result.success ? 'success' : 'error');
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
          showToast('Khôi phục toàn bộ hệ thống từ file Backup thành công! Vui lòng đợi...');
          setTimeout(() => { window.location.reload(); }, 1500);
        }
      } catch (err) {
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
      fileInputRef
    },
    actions: {
      setLocalBackupInt,
      setLocalCloudInt,
      applyAutoBackup,
      applyAutoCloud,
      manualSync,
      handlePullCloud,
      handleBackup,
      handleRestoreClick,
      handleFileChange
    }
  };
};
