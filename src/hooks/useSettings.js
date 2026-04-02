import { useState, useEffect } from 'react';
import { StorageService } from '../services/api/storage';

export const useSettings = () => {
  const [settings, setSettings] = useState({
    theme: 'light',
    syncMode: 'manual',
    autoBackupInterval: 'none',
    lastBackupTime: null,
    autoCloudSyncInterval: 'none',
    lastCloudSyncTime: null
  });

  const fetchSettings = async () => {
    const data = await StorageService.getCollection('settings');
    const validData = Array.isArray(data) ? {} : data;
    if (Object.keys(validData).length > 0) {
      setSettings(validData);
    }
  };

  useEffect(() => {
    fetchSettings(); // eslint-disable-line react-hooks/set-state-in-effect
    const unsub = StorageService.subscribe((collection) => {
      if (collection === 'settings' || collection === '*') fetchSettings();
    });
    return unsub;
  }, []);

  const updateSettings = async (updates) => {
    const data = await StorageService.getCollection('settings');
    const currentSettings = Array.isArray(data) ? {} : data;
    const newSettings = { ...currentSettings, ...updates };
    await StorageService.saveCollection('settings', newSettings);
  };

  return { settings, updateSettings };
};
