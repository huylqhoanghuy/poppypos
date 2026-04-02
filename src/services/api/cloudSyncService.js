import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { StorageService } from './storage';

let debounceTimer = null;

export const CloudSyncService = {
  syncToCloud: async () => {
    try {
      const state = await StorageService.getAll();
      const keys = Object.keys(state);
      for (const key of keys) {
        if (key !== 'toast' && key !== 'notifications') {
          await setDoc(doc(db, 'store_data', key), { data: state[key] });
        }
      }
      return { success: true, message: 'Đã lưu trữ dữ liệu lên Đám mây an toàn!' };
    } catch (err) {
      console.error("Firebase sync error:", err);
      return { success: false, message: 'Lỗi đẩy dữ liệu. Vui lòng kiểm tra kết nối mạng.' };
    }
  },

  pullFromCloud: async () => {
    try {
      console.log("[Auth Flow] Bắt đầu tự động tải hệ thống nền từ Cloud...");
      const targetKeys = [
        'categories', 'salesChannels', 'ingredients', 'products', 
        'suppliers', 'purchaseOrders', 'posOrders', 'accounts', 
        'financeCategories', 'transactions', 'settings', 'users'
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
        // Tham số thứ 2 "false" cho biết đây là lệnh do Pull sinh ra, không cần kích hoạt AutoSync vòng lặp.
        await StorageService.saveAll(mergedState, false); 
        return { success: true, message: 'Đã đồng bộ bộ nhớ từ Đám mây thành công!', newState: mergedState };
      } else {
        return { success: false, message: 'Không tìm thấy máy chủ sao lưu đám mây.' };
      }
    } catch (err) {
      console.error("Firebase pull error:", err);
      return { success: false, message: 'Lỗi đồng bộ cấu hình Mây. Có thể do đứt kết nối mạng.' };
    }
  },

  debouncedSyncToCloud: () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    // Chờ 3 giây để tránh làm quá tải Firebase khi có thao tác liên tiếp
    debounceTimer = setTimeout(() => {
      console.log("[Real-time Core] Tự động cập nhật thao tác lên Đám Mây...");
      CloudSyncService.syncToCloud();
    }, 2000);
  },

  startRealtimeListener: (onRemoteUpdate) => {
    console.log("[Realtime] Đang kết nối kênh đồng bộ thời gian thực giữa các chi nhánh...");
    const colRef = collection(db, 'store_data');
    
    // Trả về hàm unsubscribe để huỷ theo dõi khi cần
    return onSnapshot(colRef, async (snapshot) => {
      let needsMerge = false;
      const newState = {};
      
      snapshot.docChanges().forEach((change) => {
         // metadata.hasPendingWrites = true nghĩa là dữ liệu này do CHÍNH THE MÁY NÀY vừa ghi (chưa lên mây kịp)
         // Lúc này ta bỏ qua để hệ thống không tự kéo về ghi đè chính mình.
         // Chỉ nhận dữ liệu từ các máy khác (hasPendingWrites = false).
         if (!change.doc.metadata.hasPendingWrites && change.type !== 'removed') {
            const dataObj = change.doc.data();
            if (dataObj && dataObj.data !== undefined) {
               newState[change.doc.id] = dataObj.data;
               needsMerge = true;
            }
         }
      });
      
      if (needsMerge) {
         console.log("[Realtime] Cập nhật dữ liệu từ chi nhánh khác. Xin chờ...");
         const currentState = await StorageService.getAll();
         const mergedState = { ...currentState, ...newState };
         // Tham số thứ 2 "false" để không kích hoạt vòng lặp đẩy ngược lên mây
         await StorageService.saveAll(mergedState, false);
         
         if (typeof onRemoteUpdate === 'function') {
            onRemoteUpdate(mergedState);
         }
      }
    });
  }
};
