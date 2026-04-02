import { useState } from 'react';
import { CloudSyncService } from '../services/api/cloudSyncService';

export const useCloudSync = () => {
  const [syncing, setSyncing] = useState(false);

  const syncToCloud = async () => {
    setSyncing(true);
    const result = await CloudSyncService.syncToCloud();
    setSyncing(false);
    return result;
  };

  const pullFromCloud = async () => {
    setSyncing(true);
    const result = await CloudSyncService.pullFromCloud();
    setSyncing(false);
    return result;
  };

  return { syncToCloud, pullFromCloud, syncing };
};
