import { useEffect, useRef, useState } from 'react';
import { useData } from '../context/DataContext';
import { useInventoryForecast } from './useInventoryForecast';

export const useAutoInventoryWarning = () => {
    const { state, dispatch } = useData();

    // Đổi lịch phân tích ngầm sang: "30 Ngày Qua" để đảm bảo luôn có data (Tránh lỗi ngày mùng 1 đầu tháng ko có lệnh bán)
    const [filterDate] = useState(() => {
        const today = new Date();
        const lastDay = today.toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const firstDay = thirtyDaysAgo.toISOString().split('T')[0];
        return { start: firstDay, end: lastDay };
    });
    
    // Gọi Radar ngầm phân tích Top 10 Món Bán Chạy nhất để nuôi mục tiêu 50 Đơn/ngày x 7 Ngày.
    const { forecastData, loading } = useInventoryForecast(filterDate, 50, 7, 10);
    
    const [radarFetched, setRadarFetched] = useState(false);

    // Kích hoạt flag sau khi quá trình loading đã trải qua chu kỳ true -> false
    useEffect(() => {
        if (loading) setRadarFetched(true);
    }, [loading]);

    useEffect(() => {
        // Tránh race condition: Chỉ chạy toán tử Alert khi Radar đã thực sự chạy ngầm xong 
        if (!radarFetched || loading) return;

        // Đã qua ải chờ data. Bây giờ setup hàm Check & Báo Động
        const evaluateAndWarn = () => {
            // 1. KHO CẠN KIỆT
            const outOfStockItems = state.ingredients.filter(i => !i.deleted && (i.stock || 0) <= 0);
            
            // 2. RADAR TỒN KHO HỤT
            const shortfalls = (forecastData && forecastData.length > 0) ? forecastData.filter(i => i.shortfall > 0) : [];
            
            // 3. QUẢN LÝ NHẬP HÀNG TỒN KHO 
            const pendingPurchases = (state.purchaseOrders || []).filter(p => p.status === 'Pending').length;
            
            // 4. CẢNH BÁO CÔNG NỢ (Treo nợ NCC và Khách hàng)
            // Tính số lượng và số tiền nợ NCC (Dựa vào Phiếu Nhập Chưa Thanh Toán)
            const unpaidPOs = (state.purchaseOrders || []).filter(p => p.status !== 'Paid');
            let supplierDebtTotal = unpaidPOs.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
            let supplierDebtCount = unpaidPOs.length;
            
            // Xử lý nợ đầu kỳ: Nếu chưa có Phiếu nào Treo Nợ nhưng Sổ NCC có nợ cũ
            if (supplierDebtTotal === 0 && supplierDebtCount === 0) {
                 supplierDebtTotal = (state.suppliers || []).reduce((sum, sup) => sum + (Number(sup.debt) || 0), 0);
                 supplierDebtCount = (state.suppliers || []).filter(s => (Number(s.debt) || 0) > 0).length;
            }
            
            // Tính số lượng và số tiền Khách Hàng Nợ
            const unpaidPosOrders = (state.posOrders || []).filter(o => o.paymentStatus !== 'Paid' && o.status !== 'Cancelled');
            const customerDebtTotal = unpaidPosOrders.reduce((sum, o) => sum + (Number(o.netAmount) || 0), 0);
            const customerDebtCount = unpaidPosOrders.length;
            
            // 5. DANH SÁCH ĐƠN HÀNG CẦN SHIP (Status Pending)
            const pendingOrders = (state.posOrders || []).filter(o => o.status === 'Pending').length;

            // Xây dựng Mã Băm (Hash) nhận diện toàn bộ trạng thái hệ thống:
            const activeIssues = [];
            if (outOfStockItems.length > 0) activeIssues.push(`STOCK:${outOfStockItems.map(i=>i.id).join()}`);
            if (shortfalls.length > 0) activeIssues.push(`RADAR:${shortfalls.map(i=>i.id).join()}`);
            if (pendingPurchases > 0) activeIssues.push(`PO:${pendingPurchases}`);
            if (supplierDebtTotal > 0 || customerDebtTotal > 0) activeIssues.push(`DEBT:${supplierDebtTotal}-${customerDebtTotal}`);
            if (pendingOrders > 0) activeIssues.push(`ORD:${pendingOrders}`);

            const currentHash = activeIssues.join('|');

            // Nếu toàn bộ hệ thống KHÔNG HỀ CÓ LỖI (Hash rỗng), Tuyệt Đối Không làm phiền.
            if (currentHash === '') return;

            const now = new Date();
            const hour = now.getHours();
            const dateStr = now.toISOString().split('T')[0];
            const nowTime = now.getTime();

            // Lấy thông tin lịch sử
            const lastWarnInfoStr = localStorage.getItem('__radar_warn_history');
            const lastWarnInfo = lastWarnInfoStr ? JSON.parse(lastWarnInfoStr) : { date: '', hash: '' };
            const isNewIssue = (lastWarnInfo.date !== dateStr) || (lastWarnInfo.hash !== currentHash);

            // 1. Phân Ca làm việc cho TOAST (Hiển thị popup)
            let currentShift = `early_${dateStr}`; // Trước 8h sáng
            if (hour >= 8 && hour < 14) currentShift = `morning_${dateStr}`;
            else if (hour >= 14) currentShift = `afternoon_${dateStr}`;

            const lastToastShift = localStorage.getItem('__radar_toast_shift');
            let shouldToast = (lastToastShift !== currentShift) && (hour >= 8);

            // 2. Phân Ca cho CHUÔNG (Nhắc nhở mỗi 30 phút)
            const lastBellTimeStr = localStorage.getItem('__radar_bell_time');
            const lastBellTime = lastBellTimeStr ? parseInt(lastBellTimeStr, 10) : 0;
            let shouldBell = (nowTime - lastBellTime) >= 30 * 60 * 1000;

            // FORCE TRIGGER: Bỏ qua block cho 1 session đầu tiên để User nhìn thấy UI ngay lập tức
            if (!sessionStorage.getItem('__radar_force_spammed_v2')) {
                 shouldToast = true;
                 shouldBell = true;
                 sessionStorage.setItem('__radar_force_spammed_v2', 'true');
            }

            // NẾU: Không phải giờ quy định TOAST + Không quá cữ quy định CHUÔNG + Không phát sinh lỗi MỚI
            // -> Thì GIỮ IM LẶNG!
            if (!shouldToast && !shouldBell && !isNewIssue) {
                 return; 
            }

            const isSilent = !shouldToast; // Nếu chu kỳ này chỉ là nhắc nhở Chuông -> Bật cơ chế Silent

            // LƯU LẠI VẾT CHU KỲ NÀY
            localStorage.setItem('__radar_warn_history', JSON.stringify({ date: dateStr, hash: currentHash }));
            if (shouldToast) localStorage.setItem('__radar_toast_shift', currentShift);
            if (shouldBell || shouldToast || isNewIssue) localStorage.setItem('__radar_bell_time', nowTime.toString());

            // ==== THỰC THI BẮN PHÁO HIỆU THÔNG BÁO CHO TỪNG MODULE LỖI ==== //

            if (outOfStockItems.length > 0) {
                const names = outOfStockItems.slice(0, 3).map(i => i.name).join(', ');
                const suffix = outOfStockItems.length > 3 ? ` và ${outOfStockItems.length - 3} món khác.` : '';
                dispatch({
                    type: 'ADD_NOTIFICATION',
                    payload: { title: 'Kho Cạn Kiệt Nguyên Liệu', message: `Đã hết sạch: ${names}${suffix}. Cần Nhập Hàng Gấp!`, type: 'error', silent: isSilent }
                });
            }

            if (shortfalls.length > 0) {
                const names = shortfalls.slice(0, 3).map(i => i.name).join(', ');
                const suffix = shortfalls.length > 3 ? ` và ${shortfalls.length - 3} khách khác` : '';
                dispatch({
                    type: 'ADD_NOTIFICATION',
                    payload: { title: 'Radar Tồn Kho Cảnh Báo', message: `Năng lực cung ứng sẽ GIÁN ĐOẠN. Hụt ngầm: ${names}${suffix}. Hãy rà soát ngay!`, type: 'warning', silent: isSilent }
                });
            }

            if (pendingPurchases > 0) {
                dispatch({
                    type: 'ADD_NOTIFICATION',
                    payload: { title: 'Quản Lý Nhập Hàng', message: `Bạn có ${pendingPurchases} Phiếu Yêu Cầu Nhập Kho (PO) đang chờ được xét duyệt / xử lý.`, type: 'info', silent: isSilent }
                });
            }

            if (supplierDebtTotal > 0 || customerDebtTotal > 0) {
                const parts = [];
                if (supplierDebtTotal > 0) parts.push(`${supplierDebtCount} nợ trả NCC (${supplierDebtTotal.toLocaleString('vi-VN')}đ)`);
                if (customerDebtTotal > 0) parts.push(`${customerDebtCount} phiếu nợ khách hàng cần thu (${customerDebtTotal.toLocaleString('vi-VN')}đ)`);
                
                dispatch({
                    type: 'ADD_NOTIFICATION',
                    payload: { 
                        title: 'Cảnh Báo Công Nợ', 
                        message: `Trong sổ quỹ: Có ${parts.join(', và ')}. Hãy trích lập thanh toán xử lý ngay.`, 
                        type: 'warning', 
                        silent: isSilent 
                    }
                });
            }

            if (pendingOrders > 0) {
                 dispatch({
                    type: 'ADD_NOTIFICATION',
                    payload: { title: 'Dọn Đơn Hàng', message: `Bạn có ${pendingOrders} đơn hàng đang trong trạng thái CHỜ SHIP cần được bàn giao ngay.`, type: 'info', silent: isSilent }
                });
            }
        };

        // Chạy ngay lần đầu tiên khi component được khởi tạo hoặc khi data thay đổi
        evaluateAndWarn();

        // Thiết lập Tracker: Mỗi 1 phút sẽ thức dậy xem Tồn kho có rách không + Có tới phiên nhắc 30p chưa
        const intervalId = setInterval(() => {
            evaluateAndWarn();
        }, 60 * 1000);

        return () => clearInterval(intervalId);

    }, [state.ingredients, state.purchaseOrders, state.posOrders, state.suppliers, forecastData, loading, dispatch, radarFetched]);
};
