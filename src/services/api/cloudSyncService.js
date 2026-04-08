import { db } from '../../firebase';
import { doc, getDoc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { StorageService } from './storage';
import { GlobalConfirm } from '../../context/ConfirmContext';

const DB_COLLECTION = import.meta.env.DEV ? 'store_data_dev' : 'store_data';

let debounceTimer = null;
let isPendingSync = false;

window.addEventListener('beforeunload', (e) => {
  if (isPendingSync) {
    e.preventDefault();
    e.returnValue = 'Dữ liệu chưa kịp đồng bộ lên Đám mây. Thoát bây giờ có thể mất thao tác vừa xong!';
  }
});

export const CloudSyncService = {
  syncToCloud: async () => {
    isPendingSync = true;
    
    // --- DEV ENVIRONMENT ISOLATION ---
    // Môi trường Dev tách bạch hoàn toàn với Firebase rác. Chỉ lưu Local. Không cho PUSH.
    if (import.meta.env.DEV) {
       isPendingSync = false;
       return { success: true, message: 'Local Dev Mode: Bỏ qua Sync Mây', size: 0 };
    }
    // ---------------------------------------------

    try {
      const state = await StorageService.getAll();
      const keys = Object.keys(state);
      
      // Memoize guard validations per sync cycle so we don't annoy the admin with 4 consecutive PIN prompts!
      let pinAlreadyVerified = false;
      let anomalyAlreadyVerified = false;

      for (const key of keys) {
        if (key !== 'toast' && key !== 'notifications') {
          // [ENTERPRISE SANITY CHECK INTERCEPTOR]
          if (Array.isArray(state[key]) && ['products', 'categories', 'posOrders', 'purchases'].includes(key)) {
             const newLen = state[key].length;
             const oldLen = window.__CLOUD_LENGTHS__ ? window.__CLOUD_LENGTHS__[key] : 0;
             
             if (oldLen > 0) {
                 const diff = oldLen - newLen;
                 let blockedByGuard = false;

                 if (newLen === 0) {
                     // 1. CHỐNG XÓA TRẮNG DỮ LIỆU CỐT LÕI (Zero-Tolerance Guard)
                     if (!pinAlreadyVerified) {
                         try {
                            const sessStr = localStorage.getItem('omnipos_session');
                            const sess = sessStr ? JSON.parse(sessStr) : null;
                            const u = sess ? sess.user : null;
                            if (u?.role !== 'ADMIN') {
                               if (GlobalConfirm.current) {
                                   await GlobalConfirm.current({
                                      title: 'TRẠM KIỂM DUYỆT BẢO MẬT',
                                      message: `Đã CHẶN đứng lệnh Xóa Sạch toàn bộ phân vùng [${key}].\n\nChỉ QUẢN TRỊ TỐI CAO (Admin) mới có thẩm quyền xóa toàn bộ! Hệ thống sẽ nạp lại Dữ Liệu Gốc từ Mây!`,
                                      type: 'danger',
                                      cancelText: 'Đóng'
                                   });
                               } else {
                                   alert(`🚫 [TRẠM KIỂM DUYỆT BẢO MẬT]\n\nĐã CHẶN đứng lệnh Xóa Sạch toàn bộ phân vùng [${key}].\n\nChỉ QUẢN TRỊ TỐI CAO (Admin) mới có thẩm quyền xóa toàn bộ! Hệ thống sáp nạp lại Dữ Liệu Gốc từ Mây!`);
                               }
                               blockedByGuard = true;
                            } else {
                               let pinValue = null;
                               if (GlobalConfirm.current) {
                                   const res = await GlobalConfirm.current({
                                       title: 'KHÓA BẢO MẬT ADMIN - QUYỀN TỐI CAO',
                                       message: `Phát hiện lệnh XÓA TRẮNG (0 phần tử) đâm vào vùng [${key}] trên Mây.\nKhởi chạy quy trình Dọn Dẹp Reset toàn bộ cơ sở dữ liệu.\n\nVui lòng nhập Mã PIN Bảo Mật để xác nhận xóa sạch:`,
                                       type: 'danger',
                                       confirmText: 'XÓA SẠCH DỮ LIỆU',
                                       withInput: true
                                   });
                                   if (res.confirmed) pinValue = res.value;
                               } else {
                                   pinValue = window.prompt(`🔒 [KHÓA BẢO MẬT ADMIN] - QUYỀN TỐI CAO\n\nPhát hiện lệnh XÓA TRẮNG (0 phần tử) đâm vào vùng [${key}] trên Mây.\nKhởi chạy quy trình Dọn Dẹp Reset toàn bộ cơ sở dữ liệu.\n\nVui lòng nhập Mã PIN Bảo Mật để xác nhận xóa sạch:`);
                               }
                               
                               const systemPin = (typeof window !== 'undefined') ? (JSON.parse(localStorage.getItem('omnipos_gaumuoi_v3') || '{}').settings?.securityPin || '1004') : '1004';
                               if (pinValue === systemPin) {
                                   pinAlreadyVerified = true;
                               } else {
                                   if (GlobalConfirm.current) {
                                       await GlobalConfirm.current({
                                          title: 'ĐÃ HUỶ',
                                          message: "❌ Mã PIN không chính xác hoặc đã hủy! Ngừng lệnh xóa rác.",
                                          type: 'warning',
                                          cancelText: 'Đóng'
                                       });
                                   } else {
                                       alert("❌ Mã PIN không chính xác! Ngừng lệnh xóa rác.");
                                   }
                                   blockedByGuard = true;
                               }
                            }
                         } catch (e) { 
                             console.error(e);
                             blockedByGuard = true; 
                         }
                     }
                 } 
                 else if (diff > 0 && (diff / oldLen > 0.1 || diff >= 5)) {
                     // 2. CHỐNG HAO HỤT MẢNG ĐỘT BIẾN (Anomaly Decrease Guard) - Tụt 10% hoặc tụt > 5 món
                     if (!anomalyAlreadyVerified) {
                         try {
                            const sessStr = localStorage.getItem('omnipos_session');
                            const sess = sessStr ? JSON.parse(sessStr) : null;
                            const u = sess ? sess.user : null;
                            if (u?.role !== 'ADMIN') {
                               if (GlobalConfirm.current) {
                                   await GlobalConfirm.current({
                                       title: 'TRẠM KIỂM DUYỆT BẢO MẬT',
                                       message: `Hệ thống phát hiện Dữ liệu [${key}] sụt giảm quá bất thường (Bay màu ${diff} mục cùng lúc).\n\nĐể ngăn chặn phá hoại hoặc đồng bộ rác, thao tác lưu rủi ro cao này bị TỪ CHỐI. Hệ thống sẽ Tải Lại Gốc!`,
                                       type: 'danger',
                                       cancelText: 'Đóng'
                                   });
                               } else {
                                   alert(`🚫 [TRẠM KIỂM DUYỆT BẢO MẬT]\n\nHệ thống phát hiện Dữ liệu [${key}] sụt giảm quá bất thường (Bay màu ${diff} mục cùng lúc).\n\nĐể ngăn chặn phá hoại hoặc đồng bộ rác, thao tác lưu rủi ro cao này bị TỪ CHỐI. Hệ thống sẽ Tải Lại Gốc!`);
                               }
                               blockedByGuard = true;
                            } else {
                               let ok = false;
                               if (GlobalConfirm.current) {
                                   const res = await GlobalConfirm.current({
                                       title: 'CẢNH BÁO QUẢN TRỊ',
                                       message: `Dữ liệu [${key}] hụt mất ${diff} mục so với Bản Cũ.\n\n- Nếu bạn vừa Dọn Dẹp hệ thống: Chọn XÁC NHẬN.\n- Nếu thấy lạ/Nhân viên lỡ tay: Chọn HUỶ để phục hồi.`,
                                       type: 'warning',
                                       confirmText: 'XÁC NHẬN XÓA',
                                       cancelText: 'HUỶ BỎ'
                                   });
                                   ok = res.confirmed;
                               } else {
                                   ok = window.confirm(`⚠️ [CẢNH BÁO QUẢN TRỊ]\n\nDữ liệu [${key}] hụt mất ${diff} mục so với Bản Cũ.\n\n- Nếu bạn vừa Dọn Dẹp hệ thống: Bấm OK để Xóa.\n- Nếu thấy lạ/Nhân viên lỡ tay: Bấm CANCEL để chặn đứng và phục hồi.`);
                               }
                               
                               if (ok) {
                                   anomalyAlreadyVerified = true;
                               } else {
                                   blockedByGuard = true;
                               }
                            }
                         } catch (e) {
                             console.error(e);
                             blockedByGuard = true; 
                         }
                     }
                 }

                 // Nếu dính gác chắn -> Quét lại local bằng file Cloud gốc để tẩy rửa sạch sẽ Data Lỗi
                 if (blockedByGuard) {
                    window.location.reload(); 
                    return { success: false, message: 'Bị chặn bởi Anomaly Guard.' };
                 }
             }
          }

          // [VƯỢT QUA KIỂM DUYỆT] - Bắt đầu đẩy lên Mây
          await setDoc(doc(db, DB_COLLECTION, key), { data: state[key] });

          // Cập nhật lại mốc neo Tracking
          if (Array.isArray(state[key])) {
             if (!window.__CLOUD_LENGTHS__) window.__CLOUD_LENGTHS__ = {};
             window.__CLOUD_LENGTHS__[key] = state[key].length;
          }
        }
      }
      
      const payloadSize = JSON.stringify(state).length;
      isPendingSync = false;
      return { success: true, message: 'Đã lưu trữ dữ liệu lên Đám mây an toàn!', size: payloadSize };
    } catch (err) {
      console.error("Firebase sync error:", err);
      isPendingSync = false;
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
        const docRef = doc(db, DB_COLLECTION, key);
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

  pullFromProdCloud: async () => {
    try {
      console.log("[Dev Mode] Bắt đầu tải hệ thống nền thực tế từ Production Cloud...");
      const targetKeys = [
        'categories', 'salesChannels', 'ingredients', 'products', 
        'suppliers', 'purchaseOrders', 'posOrders', 'accounts', 
        'financeCategories', 'transactions', 'settings', 'users'
      ];
      
      const newState = {};
      for (const key of targetKeys) {
        // LUÔN LUÔN CHỈ ĐỊNH RÕ RÀNG 'store_data' (Production DB)
        const docRef = doc(db, 'store_data', key);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          newState[key] = docSnap.data().data;
        }
      }
      
      if (Object.keys(newState).length > 0) {
        const currentState = await StorageService.getAll();
        const mergedState = { ...currentState, ...newState };
        
        // Reset local-only properties to ensure 100% identical size with Prod for visual consistency
        mergedState.notifications = [];
        
        // Ghi xuống Local
        await StorageService.saveAll(mergedState, false); 
        
        // --- BYPASS GUARDS SAU KHI ĐÃ NHẬP PIN PROD ---
        // 1. Bypass Dev Guard (Tránh popup hỏi PIN 1004 lần 2 vô lý)
        sessionStorage.setItem('__dev_push_bypass', 'granted');
        
        // 2. Bypass Anomaly Guard & Zero-Wipe Guard bằng cách reset mốc Tracking
        // (Do thao tác ghi đè Prod -> Dev chắc chắn sẽ làm lệch mảng dữ liệu đáng kể)
        window.__CLOUD_LENGTHS__ = {};
        
        // Cực Trọng Yếu: Ép đẩy thẳng lên DEV Firebase bỏ qua Debounce để lần F5 không bị Data gốc từ DEV đè lại!
        await CloudSyncService.syncToCloud();

        return { success: true, message: 'Đã sao chép toàn bộ bộ nhớ từ Production Đám mây thành công!', newState: mergedState };
      } else {
        return { success: false, message: 'Không tìm thấy dữ liệu trên Production server.' };
      }
    } catch (err) {
      console.error("Firebase pull from Prod error:", err);
      return { success: false, message: 'Lỗi đồng bộ cấu hình Mây. Có thể do đứt kết nối mạng.' };
    }
  },

  debouncedSyncToCloud: () => {
    isPendingSync = true;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    // Chờ 3 giây để tránh làm quá tải Firebase khi có thao tác liên tiếp
    debounceTimer = setTimeout(async () => {
      console.log("[Real-time Core] Tự động cập nhật thao tác lên Đám Mây...");
      const result = await CloudSyncService.syncToCloud();
      if (result.success && result.size) {
          const settings = await StorageService.getCollection('settings') || {};
          const updatedSettings = { ...settings, lastCloudSyncSize: result.size, lastCloudSyncTime: Date.now() };
          // Lưu ngầm không kích hoạt triggerSync
          await StorageService.saveCollection('settings', updatedSettings, false);
      }
    }, 2000);
  },

  startRealtimeListener: (onRemoteUpdate) => {
    console.log("[Realtime] Đang kết nối kênh đồng bộ thời gian thực giữa các chi nhánh...");
    const colRef = collection(db, DB_COLLECTION);
    
    // Trả về hàm unsubscribe để huỷ theo dõi khi cần
    return onSnapshot(colRef, async (snapshot) => {
      let needsMerge = false;
      const newState = {};
      
      snapshot.docChanges().forEach((change) => {
         // metadata.hasPendingWrites = true nghĩa là dữ liệu này do CHÍNH THE MÁY NÀY vừa ghi (chưa lên mây kịp)
         // Lúc này ta bỏ qua để hệ thống không tự kéo về ghi đè chính mình.
         // Chỉ nhận dữ liệu từ các máy khác (hasPendingWrites = false).

         const dataObj = change.doc.data();
         if (dataObj && dataObj.data !== undefined) {
             // Luôn duy trì một biến Động tracking độ dài mọi mảng trên Mây để Trạm Kiểm Duyệt có cơ sở so sánh
             if (!window.__CLOUD_LENGTHS__) window.__CLOUD_LENGTHS__ = {};
             window.__CLOUD_LENGTHS__[change.doc.id] = Array.isArray(dataObj.data) ? dataObj.data.length : 0;

             if (!change.doc.metadata.hasPendingWrites && change.type !== 'removed') {
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
