import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Wallet, 
  Package, 
  Share2, 
  BarChart3, 
  PieChart,
  UserCheck,
  Building2,
  LineChart,
  ChevronRight,
  Clock
} from 'lucide-react';

const ReportCard = ({ title, description, icon, color, bg, onClick, metrics }) => {
  return (
    <div 
       className="glass-panel hover-card" 
       onClick={onClick}
       style={{ 
         padding: '24px', 
         cursor: 'pointer', 
         display: 'flex', 
         flexDirection: 'column', 
         gap: '16px',
         transition: 'all 0.2s',
         border: '1px solid var(--surface-border)'
       }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
         <div style={{ 
           width: '48px', height: '48px', 
           borderRadius: '12px', 
           background: bg, 
           color: color, 
           display: 'flex', alignItems: 'center', justifyContent: 'center' 
         }}>
            {icon}
         </div>
         <div style={{ padding: '4px', color: 'var(--text-secondary)' }}>
            <ChevronRight size={20} />
         </div>
      </div>
      <div>
         <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{title}</h3>
         <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{description}</p>
      </div>
      {metrics && (
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px dashed var(--surface-border)', display: 'flex', gap: '16px' }}>
           {metrics.map((m, i) => (
             <div key={i}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{m.label}</div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.value}</div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default function ReportsIndex() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="reports-index-container" style={{ padding: '0 0 40px 0', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
         <div>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <PieChart size={32} color="var(--primary)" /> Trung Tâm Báo Cáo Điều Hành
            </h2>
            <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-secondary)' }}>
              Phân luồng báo cáo chiến lược dành riêng cho Ban Giám Đốc (C-Level).
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '20px', fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
               <Clock size={14} color="var(--primary)" />
               <span>Dữ liệu thời gian thực: {formatDateTime(currentTime)}</span>
            </div>
         </div>
         <button className="btn btn-primary" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600 }}>
            <BarChart3 size={18} /> Quay về Dashboard Tổng
         </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
         {/* CEO Section */}
         <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
               <div style={{ background: '#F0F9FF', padding: '10px', borderRadius: '12px', color: '#0284C7' }}>
                  <Building2 size={24} />
               </div>
               <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Giao Diện CEO (Tổng Giám Đốc)</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Tầm nhìn bao quát toàn bộ hiệu quả kinh doanh & tăng trưởng.</p>
               </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
               <ReportCard 
                  title="Doanh Thu & Lợi Nhuận Tổng Thể"
                  description="Bức tranh toàn cảnh về Doanh thu thuần, Lợi nhuận gộp, Tổng chi phí vận hành và tỷ suất tăng trưởng (P&L Tổng quan)."
                  icon={<LineChart size={24} />}
                  color="#16A34A"
                  bg="#F0FDF4"
                  onClick={() => navigate('/reports/business')}
                  metrics={[
                     { label: 'Góc nhìn', value: 'Vĩ Mô' },
                     { label: 'Chỉ số', value: 'Real-time P&L' }
                  ]}
               />
               {/* Có thể thêm các báo cáo CEO khác ở đây */}
            </div>
         </section>

         {/* CFO Section */}
         <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
               <div style={{ background: '#FEF2F2', padding: '10px', borderRadius: '12px', color: '#DC2626' }}>
                  <TrendingUp size={24} />
               </div>
               <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Giao Diện CFO (Giám Đốc Tài Chính)</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Kiểm soát chặt chẽ Cấu trúc giá vốn (COGS) và rủi ro dòng tiền.</p>
               </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
               <ReportCard 
                  title="Cấu Trúc Giá Trị & LN Menu"
                  description="Phân tích sâu rễ cấu trúc Giá vốn nguyên liệu (Food Cost) đập xuống từng món ăn trong Menu để kiểm soát rủi ro dòng tiền và thiết lập giá bán."
                  icon={<Wallet size={24} />}
                  color="#DC2626"
                  bg="#FEF2F2"
                  onClick={() => navigate('/reports/finance')}
               />
            </div>
         </section>

         {/* CCO Section */}
         <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
               <div style={{ background: '#FFF7ED', padding: '10px', borderRadius: '12px', color: '#EA580C' }}>
                  <UserCheck size={24} />
               </div>
               <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Giao Diện CCO (Giám Đốc Vận Hành/Kinh Doanh)</h3>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Kiểm soát luân chuyển hàng hóa và bức tranh khách lẻ kênh phân phối.</p>
               </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
               <ReportCard 
                  title="Báo Cáo Hiệu Xuất Kênh Bán"
                  description="Thống kê tỷ trọng đơn hàng và phễu doanh thu từ các kênh Online (GrabFood, ShopeeFood) so với khách In-store tại quán."
                  icon={<Share2 size={24} />}
                  color="#EA580C"
                  bg="#FFF7ED"
                  onClick={() => navigate('/reports/channels')}
               />
               <ReportCard 
                  title="Phân Tích Biến Động Tồn Kho"
                  description="Báo cáo mức độ rủi ro hàng tồn, tuổi thọ nguyên liệu quá hạn, và giá trị tài sản đang nằm ứ đọng trên kệ kho."
                  icon={<Package size={24} />}
                  color="#9333EA"
                  bg="#FAF5FF"
                  onClick={() => navigate('/reports/inventory')}
               />
            </div>
         </section>
      </div>
      <style>{`
        .hover-card:hover {
           transform: translateY(-4px);
           box-shadow: 0 12px 24px -8px rgba(0,0,0,0.1);
           border-color: var(--primary) !important;
        }
      `}</style>
    </div>
  );
}
