import React, { useState } from 'react';
import { useInventoryForecast } from '../hooks/useInventoryForecast';
import SmartTable from './SmartTable';
import { Calendar, TrendingUp, AlertTriangle, CheckCircle, PackageSearch } from 'lucide-react';

const InventoryForecastTab = () => {
    // Tạm hiểu filterDate đơn giản (tháng này chuẩn nhất)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const [filterDate, setFilterDate] = useState({ start: firstDay, end: lastDay });
    const [maxOrders, setMaxOrders] = useState(100);

    const { forecastData, top10Products, loading, refreshForecast } = useInventoryForecast(filterDate, maxOrders);

    const handleApply = () => {
        refreshForecast();
    };

    const columns = [
        {
           key: 'name', 
           label: 'Nguyên Liệu / BTP', 
           sortable: true,
           render: (val, item) => (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: 800 }}>{val}</span>
                {item.isTop10Related && (
                   <span style={{ fontSize: '11px', color: 'var(--primary)', background: 'rgba(59,130,246,0.1)', padding: '2px 6px', borderRadius: '4px', width: 'fit-content', fontWeight: 600 }}>
                      🔥 Cực Kỳ Ưu Tiên (Phục vụ Top 10 Bán chạy)
                   </span>
                )}
             </div>
           )
        },
        {
           key: 'projectedRequiredQty',
           label: 'Nhu cầu dự kiến',
           sortable: true,
           align: 'right',
           render: (val, item) => (
              <span>
                 <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{val.toFixed(2)}</strong> <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>{item.buyUnit || item.unit}</span>
              </span>
           )
        },
        {
           key: 'stock',
           label: 'Tồn Kho Hiện Tại',
           sortable: true,
           align: 'right',
           render: (val, item) => (
              <span>
                 <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{val.toFixed(2)}</strong> <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>{item.buyUnit || item.unit}</span>
              </span>
           )
        },
        {
           key: 'shortfall',
           label: 'Trạng Thái & Kế Hoạch',
           sortable: true,
           render: (val, item) => {
              const isShort = val > 0;
              return (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isShort ? (
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)', fontWeight: 700, fontSize: '13px' }}>
                             <AlertTriangle size={16} /> Cần nhập thêm: {val.toFixed(2)} {item.buyUnit || item.unit}
                          </span>
                       </div>
                    ) : (
                       <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', fontWeight: 700, fontSize: '13px' }}>
                          <CheckCircle size={16} /> Đã đủ phục vụ
                       </span>
                    )}
                 </div>
              )
           }
        }
    ];

    return (
       <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
             <h3 style={{ margin: '0 0 16px 0', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                 <TrendingUp size={20} /> Tham số Dự báo Kế hoạch (Dựa trên quá khứ)
             </h3>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                <div>
                   <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Kỳ phân tích quá khứ (Từ):</label>
                   <input type="date" className="form-input" value={filterDate.start} onChange={e => setFilterDate({...filterDate, start: e.target.value})} style={{ width: '100%', padding: '10px 12px' }} />
                </div>
                <div>
                   <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Kỳ phân tích quá khứ (Đến):</label>
                   <input type="date" className="form-input" value={filterDate.end} onChange={e => setFilterDate({...filterDate, end: e.target.value})} style={{ width: '100%', padding: '10px 12px' }} />
                </div>
                <div>
                   <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--danger)', marginBottom: '4px', display: 'block' }}>Mục tiêu năng lực / Ngày (Đơn X):</label>
                   <input type="number" min="1" className="form-input" value={maxOrders} onChange={e => setMaxOrders(Number(e.target.value))} style={{ width: '100%', padding: '10px 12px', fontWeight: 800, color: 'var(--text-primary)' }} />
                </div>
                <button className="btn btn-primary" onClick={handleApply} disabled={loading} style={{ padding: '10px 24px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                   {loading ? 'Đang tính toán...' : <><PackageSearch size={18} /> Cập nhật</>}
                </button>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
             {/* Thông tin 10 sản phẩm */}
             <div className="glass-panel" style={{ padding: '16px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                 <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)' }}>Lưu ý: Hệ thống đang trích xuất định mức của <strong>toàn bộ sản phẩm</strong> (hệ số an toàn +3%), nhưng ĐÁNH DẤU CỰC KỲ ƯU TIÊN cho <strong>TOP 10 Sản phẩm bán chạy nhất</strong> trong kỳ dưới đây:</h4>
                 <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {top10Products.length > 0 ? top10Products.map((p, idx) => (
                        <div key={p.id} style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                           #{idx + 1} - {p.name}
                        </div>
                    )) : (
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Chưa có dữ liệu giao dịch trong khoảng thời gian này.</div>
                    )}
                 </div>
             </div>

             <SmartTable 
                 data={forecastData}
                 columns={columns}
                 emptyMessage="Vui lòng nhấn Cập nhật để tính toán..."
             />
          </div>
       </div>
    );
};

export default InventoryForecastTab;
