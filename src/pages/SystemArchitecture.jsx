import React from 'react';
import { PackageOpen, ShoppingCart, Calculator, BarChart3, ArrowRight, ArrowDown } from 'lucide-react';

export default function SystemArchitecture() {
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '32px', position: 'relative' }}>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
         <BarChart3 size={20} color="var(--primary)" /> Sơ Đồ Kiến Trúc Hệ Sinh Thái Poppy POS
      </h3>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '14px', lineHeight: 1.6 }}>
        Sơ đồ này thể hiện luồng luân chuyển dữ liệu lõi giữa 4 phân hệ lớn: Vận hành Kho, Bán Hàng POS, Kế Toán Dòng Tiền, và Phân Tích Báo Cáo. Hệ thống tuân thủ nguyên tắc ERP, bất kỳ thay đổi nào từ Kho và Bán hàng đều tự động đồng bộ sang Kế Toán.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', position: 'relative' }}>
        
        {/* Phân hệ KHO */}
        <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '16px', padding: '20px' }}>
           <h4 style={{ color: '#e11d48', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
             <PackageOpen size={18} /> Quản Lý Kho & Cung Ứng
           </h4>
           <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-primary)', fontSize: '13px', lineHeight: 2 }}>
             <li><b>Nhà Cung Cấp:</b> Quản lý đối tác</li>
             <li><b>Phiếu Nhập (PO):</b> Nhập kho, định giá lô hàng</li>
             <li><b>Nguyên Liệu:</b> Quản lý Tồn kho & giá vốn</li>
             <li><b>Kiểm kê (Mới):</b> Sinh bút toán hao hụt tự động</li>
           </ul>
        </div>

        {/* Phân hệ BÁN HÀNG */}
        <div style={{ background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: '16px', padding: '20px' }}>
           <h4 style={{ color: '#0284c7', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
             <ShoppingCart size={18} /> Hệ Thống Bán Hàng (POS)
           </h4>
           <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-primary)', fontSize: '13px', lineHeight: 2 }}>
             <li><b>Menu Sản Phẩm:</b> Quản lý mặt hàng</li>
             <li><b>Công Thức (BOM):</b> Mối nối tự động hóa trừ kho</li>
             <li><b>Phân Bổ Kênh:</b> Shopee, Grab, Quầy</li>
             <li><b>Đơn Hàng (POS):</b> Ghi doanh thu, tạo công nợ</li>
           </ul>
        </div>

        {/* Phân hệ KẾ TOÁN */}
        <div style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '16px', padding: '20px' }}>
           <h4 style={{ color: '#16a34a', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Calculator size={18} /> Sổ Quỹ & Kế Toán
           </h4>
           <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-primary)', fontSize: '13px', lineHeight: 2 }}>
             <li><b>Ví Tiền:</b> Ngân hàng, Tiền mặt thực tế</li>
             <li><b>Sổ Nhật Ký (TXN):</b> Lưu vết thu/chi kép</li>
             <li><b>Công Nợ:</b> Phải thu Khách, Phải trả NCC</li>
             <li><b>Bút toán Hạch Toán:</b> Dữ liệu kế toán ảo không tác động tiền mặt</li>
           </ul>
        </div>

        {/* Phân hệ BÁO CÁO */}
        <div style={{ background: 'rgba(234, 179, 8, 0.05)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '16px', padding: '20px' }}>
           <h4 style={{ color: '#ca8a04', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
             <BarChart3 size={18} /> Báo Cáo Tài Chính
           </h4>
           <ul style={{ paddingLeft: '20px', margin: 0, color: 'var(--text-primary)', fontSize: '13px', lineHeight: 2 }}>
             <li><b>Bảng Cân Đối:</b> Cân Asset (Kho, Tiền) & Liability</li>
             <li><b>P&L (KQKD):</b> Lọc từ Dòng tiền, COGS để ra Lợi Nhuận</li>
             <li><b>Báo Cáo Margin:</b> Thu thập từ Đơn POS</li>
             <li><b>Báo Cáo Tồn:</b> Cảnh báo mâm kho tự động</li>
           </ul>
        </div>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
         <h5 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Nguyên Lý Vận Hành Lõi (Data Flow)</h5>
         <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{ padding: '4px 8px', background: 'var(--primary)', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>Luồng Khấu Trừ Kho:</span>
                Đơn Hàng POS <ArrowRight size={14} /> Chạy qua Công Thức <ArrowRight size={14} /> Trừ Tồn Kho tự động <ArrowRight size={14} /> Trả về Chi phí vốn (COGS).
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{ padding: '4px 8px', background: '#16a34a', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>Luồng Dòng Tiền:</span>
                Nhập hàng / Bán hàng / Thu nợ <ArrowRight size={14} /> Ghi 1 Phiếu vào Sổ Nhật Ký Giao Dịch <ArrowRight size={14} /> Thay đổi Số dư Ví Tiền thực tế.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{ padding: '4px 8px', background: '#e11d48', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>Luồng Kế Toán Đóng:</span>
                Nhân viên Sửa Kho thủ công do hao hụt <ArrowRight size={14} /> Hệ thống tự sinh Phiếu Hạch Toán ảo <ArrowRight size={14} /> Trừ Lợi Nhuận trên P&L (Nhưng không trừ Tiền Mặt).
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{ padding: '4px 8px', background: '#d97706', color: 'white', borderRadius: '4px', fontWeight: 'bold' }}>Luồng Cách Ly Công Nợ:</span>
                Đơn Hàng đã bị Hủy hoặc Xóa Mềm <ArrowRight size={14} /> Bị Hệ thống từ chối lọc <ArrowRight size={14} /> Gạch tên khỏi Sổ Cảnh Báo Vay Nợ.
            </div>
         </div>
      <div style={{ marginTop: '40px', padding: '24px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', position: 'relative', overflow: 'hidden' }}>
         <svg style={{ position: 'absolute', top: 0, right: 0, opacity: 0.05, width: '300px', height: '300px' }} viewBox="0 0 100 100">
             <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="white" />
         </svg>
         
         <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative', zIndex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800, background: 'linear-gradient(to right, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
               VỀ DỰ ÁN & NHÀ PHÁT TRIỂN
            </h3>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Hệ Sinh Thái Poppy POS V2 & Đội Ngũ Kiến Tạo</p>
         </div>

         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', position: 'relative', zIndex: 1 }}>
            {/* Trung tâm */}
            <div style={{ padding: '16px 32px', background: 'var(--primary)', borderRadius: '30px', fontWeight: 800, fontSize: '18px', boxShadow: '0 10px 25px -5px rgba(2, 132, 199, 0.5)', zIndex: 2 }}>
               POPPY POS PROJECT
            </div>
            
            {/* Đường nối xuống */}
            <div style={{ width: '2px', height: '30px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
            
            {/* Phân nhánh */}
            <div style={{ width: '60%', height: '2px', background: 'rgba(255, 255, 255, 0.2)', position: 'relative' }}>
               <div style={{ position: 'absolute', left: 0, top: 0, width: '2px', height: '30px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
               <div style={{ position: 'absolute', right: 0, top: 0, width: '2px', height: '30px', background: 'rgba(255, 255, 255, 0.2)' }}></div>
               <div style={{ position: 'absolute', left: '50%', top: 0, width: '2px', height: '30px', background: 'rgba(255, 255, 255, 0.2)', transform: 'translateX(-50%)' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', width: '100%', marginTop: '30px' }}>
               
               {/* Người Mệnh Lệnh (Owner) */}
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(45deg, #f59e0b, #ea580c)', margin: '0 auto 12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     👤
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#f8fafc' }}>Lê Quang Huy</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24', fontWeight: 600 }}>CEO / System Architect</p>
                  <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                     Người thiết kế logic, hoạch định tài chính và đặt ra bộ quy tắc vận hành khắt khe (ERP) cho toàn bộ hệ thống.
                  </p>
               </div>

               {/* Hệ Thống & Liên Hệ */}
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(45deg, #10b981, #059669)', margin: '0 auto 12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <PackageOpen size={20} color="white" />
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#f8fafc' }}>Poppy POS V2.1</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#34d399', fontWeight: 600 }}>Tài sản trí tuệ & Liên hệ</p>
                  <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                     Bản quyền thuộc về Xóm Gà Poppy. Liên hệ triển khai & tư vấn vận hành F&B thông qua Email/Hotline của cửa hàng.
                  </p>
               </div>

               {/* AI Assistant (Antigravity) */}
               <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -10, right: -10, background: '#3b82f6', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '12px', fontWeight: 800 }}>⚡ PAIR PROGRAMMING</div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(45deg, #3b82f6, #4f46e5)', margin: '0 auto 12px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                     🤖
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#f8fafc' }}>Antigravity (AI)</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#818cf8', fontWeight: 600 }}>Google DeepMind Agent</p>
                  <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>
                     Cộng sự mã hóa chính thức kiến tạo toàn bộ giao diện và luồng logic code dựa trên chỉ đạo của CEO. Hỗ trợ 24/7 trong IDE!
                  </p>
               </div>

            </div>
         </div>
      </div>
    </div>
    </div>
    </div>
  );
}
