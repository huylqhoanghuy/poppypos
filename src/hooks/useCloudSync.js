import { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { StorageService } from '../services/api/storage';

export const useCloudSync = () => {
  const [syncing, setSyncing] = useState(false);

  const syncToCloud = async () => {
    try {
      setSyncing(true);
      const state = await StorageService.getAll();
      const keys = Object.keys(state);
      for (const key of keys) {
        if (key !== 'toast' && key !== 'settings') {
          await setDoc(doc(db, 'store_data', key), { data: state[key] });
        }
      }
      return { success: true, message: 'Đã đẩy dữ liệu lên Đám mây an toàn!' };
    } catch (err) {
      console.error("Firebase sync error:", err);
      return { success: false, message: 'Lỗi đẩy dữ liệu. Vui lòng kiểm tra kết nối mạng.' };
    } finally {
      setSyncing(false);
    }
  };

  const pullFromCloud = async () => {
    try {
      setSyncing(true);
      const targetKeys = [
        'categories', 'salesChannels', 'ingredients', 'products', 
        'suppliers', 'purchaseOrders', 'posOrders', 'accounts', 
        'financeCategories', 'transactions'
      ];
      
      const newState = {};
      for (const key of targetKeys) {
        const docRef = doc(db, 'store_data', key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          newState[key] = docSnap.data().data;
        }
      }
      
      if (Object.keys(newState).length > 0) {
        const currentState = await StorageService.getAll();
        const mergedState = { ...currentState, ...newState };
        await StorageService.saveAll(mergedState);
        return { success: true, message: 'Đã tải và cập nhật dữ liệu từ Đám mây!' };
      } else {
        return { success: false, message: 'Chưa có bản lưu nào trên Đám mây!' };
      }
    } catch (err) {
      console.error("Firebase pull error:", err);
      return { success: false, message: 'Lỗi tải dữ liệu. Vui lòng kiểm tra mạng.' };
    } finally {
      setSyncing(false);
    }
  };

  return { syncToCloud, pullFromCloud, syncing };
};
