import React, { useState } from 'react';
import { Zap, Activity } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function MockDataGenerator() {
  const { state, dispatch } = useData();
  const [loading, setLoading] = useState(false);

  // Constants
  const TARGET_REVENUE = 12000000;
  const OWNER_EQUITY = 10000000;
  
  const handleGenerate = async () => {
    setLoading(true);
    
    // Đảm bảo UI update state loading trước khi block main thread
    await new Promise(r => setTimeout(r, 100));
    
    try {
      let activeProducts = [...products];
      if (activeProducts.length === 0) {
        // Auto-inject a default product to guarantee testability
        activeProducts = [{
          id: 'PROD-MOCK-' + Date.now(),
          name: 'Gà Ủ Muối Nguyên Con (Mock)',
          price: 250000,
          categoryId: 'CAT1',
          recipe: []
        }];
        dispatch({ type: 'ADD_PRODUCT', payload: activeProducts[0] });
      }

      // ==== 1. Tiêm Vốn Chủ Sở Hữu (10,000,000 VNĐ) ====
      const cashAcc = accounts.find(a => a.type === 'cash') || accounts[0];
      const accId = cashAcc ? cashAcc.id : 'ACC1';
      
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: {
          accountId: accId,
          categoryId: 'FC3', // Vốn chủ sở hữu
          date: '2026-03-01T08:00:00.000Z',
          amount: OWNER_EQUITY,
          type: 'Thu',
          note: '[MOCK DATA] Vốn đầu tư ban đầu',
          payer: 'Chủ Đầu Tư',
          collector: 'Auto'
        }
      });

      // Mua nguyên vật liệu (Tự động hạch toán giả một khoản mua hàng vào Kho 1,500,000d)
      // Để Tồn kho dương cho phép bán hàng. (Chia đều kho)
      /* Optional if the user already set it manually "như đã set" 
         We just add a PO directly so they have trace. */
      
      // ==== 2. Tiêm Đơn Hàng Doanh Thu (12,000,000 VNĐ) ====
      const channels = {
        shopee: { target: TARGET_REVENUE * 0.5, name: 'ShopeeFood' }, // 6tr
        grab: { target: TARGET_REVENUE * 0.3, name: 'GrabFood' },     // 3.6tr
        direct: { target: TARGET_REVENUE * 0.2, name: 'Trực tiếp' }   // 2.4tr
      };

      const getChannelId = (nameQuery) => {
        const found = salesChannels.find(c => c.name.toLowerCase().includes(nameQuery.toLowerCase()));
        return found ? found.id : ('CH-' + nameQuery);
      };

      const shopeeId = getChannelId('Shopee');
      const grabId = getChannelId('Grab');
      const directId = getChannelId('Tiệm');

      let mockDays = 1;

      for (const [key, config] of Object.entries(channels)) {
        let currentRev = 0;
        let cId = key === 'shopee' ? shopeeId : (key === 'grab' ? grabId : directId);
        
        while (currentRev < config.target) {
          const product = activeProducts[Math.floor(Math.random() * activeProducts.length)];
          let price = parseInt(product.price);
          if (isNaN(price) || price <= 0) price = 50000; // Safe fallback to prevent infinite loops
          
          let qty = Math.floor(Math.random() * 2) + 1; 
          let itemNet = price * qty;
          
          if (currentRev + itemNet > config.target) {
            qty = 1;
            itemNet = config.target - currentRev;
            if (itemNet <= 0) break;
          }

          const dateStr = `2026-03-${mockDays.toString().padStart(2, '0')}T12:${Math.floor(Math.random()*50).toString().padStart(2, '0')}:00.000Z`;

          const payload = {
            id: 'ORD-MOCK-' + Math.random().toString().slice(2, 6),
            createdAt: dateStr,
            date: dateStr,
            channelId: cId,
            channelName: config.name,
            customerName: key === 'direct' ? 'Khách Vãng Lai' : `Khách ${config.name}`,
            netAmount: itemNet,
            totalAmount: itemNet,
            items: [{
              id: 'ITM-' + Math.random().toString().slice(2, 6),
              product: product,
              quantity: qty,
              selectedPrice: itemNet / qty,
              itemTotal: itemNet
            }],
            status: 'Completed',
            paymentStatus: 'Paid'
          };

          dispatch({ type: 'ADD_POS_ORDER', payload });
          currentRev += itemNet;
          
          mockDays++;
          if (mockDays > 30) mockDays = 1;
        }
      }

      setTimeout(() => {
        dispatch({ type: 'SHOW_TOAST', payload: { message: 'THÀNH CÔNG! Đã bơm dữ liệu mẫu tháng 3/2026. Các báo cáo đã được làm mới tự động!', type: 'success' } });
      }, 500);

    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi tạo Mock Data: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 24, padding: 'clamp(16px, 3vw, 20px)', border: '1px solid #c084fc', borderRadius: '16px', background: '#faf5ff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
         <Activity size={20} color="#9333ea" />
         <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#9333ea' }}>Dev Tools: Data Injector</h3>
      </div>
      <p style={{ color: '#7e22ce', fontSize: '14px', lineHeight: 1.5, marginTop: 0, marginBottom: 20 }}>
        [Yêu cầu Đặc Biệt Hệ Thống]: Công cụ Injector sẽ giải lập <strong>12,000,000đ Doanh Thu</strong> (Tháng 3/2026) chia cho các sàn (Shopee: 50%, Grab: 30%, Tiệm: 20%). Và tiêm 1 lệnh <strong>10,000,000đ Vốn Chủ Sở Hữu</strong> vào dòng tiền để test báo cáo Kế Toán Dòng Tiền. Hoàn toàn chạy dựa trên bảng giá & Công thức Món của bạn!
      </p>

      <button className="btn" onClick={handleGenerate} disabled={loading} style={{ display: 'flex', alignItems: 'center', padding: '12px 24px', background: '#9333ea', color: 'white', borderRadius: '12px', fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        <Zap size={20} style={{ marginRight: 8 }}/> 
        {loading ? 'Đang kích hoạt bộ máy tính toán...' : 'Tiêm Dữ Liệu Tháng 03/2026 Ngay'}
      </button>
    </div>
  );
}
