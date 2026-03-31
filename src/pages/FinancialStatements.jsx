import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { 
  Briefcase, 
  TrendingUp, 
  Wallet, 
  FileText, 
  Building2, 
  ShoppingBag, 
  DollarSign, 
  PieChart, 
  AlertCircle,
  Scale,
  Activity,
  ArrowRightLeft,
  BookOpen,
  Calendar,
  RefreshCcw
} from 'lucide-react';
import { useFinancialStatements } from '../hooks/useFinancialStatements';

export default function FinancialStatements() {
  const { state } = useData();
  const { 
    activeTab, setActiveTab, 
    period, setPeriod, 
    isRefreshing, handleRefresh, 
    statements 
  } = useFinancialStatements(state);

  const {
    totalCash, totalInventoryValue, totalAssets, totalLiabilities, ownersEquity,
    totalRevenue, totalCOGS, grossProfit, operatingExpenses, ebitda, netProfit,
    cashInflows, cashOutflows, netCashFlow, filteredTransactions = []
  } = statements;



  // Helpers
  const formatVND = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '0đ';
    const amount = Math.round(Math.abs(val)).toLocaleString('vi-VN') + 'đ';
    return val < 0 ? `- ${amount}` : amount;
  };

  return (
    <div className="bctc-container" style={{ padding: '0 0 40px 0', maxWidth: '1000px', margin: '0 auto', opacity: isRefreshing ? 0.6 : 1, transition: '0.3s' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
         <div>
           <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.5px' }}>
              <Briefcase size={32} color="var(--primary)" /> Báo Cáo Tài Chính (BCTC)
           </h2>
           <p style={{ margin: '8px 0 0 0', fontSize: '15px', color: 'var(--text-secondary)' }}>
             Hệ thống Realtime truy xuất tự động dữ liệu từ Kênh Bán Hàng & Các Trọng Điểm Quỹ.
           </p>
         </div>

         <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-color)', padding: '6px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
              <Calendar size={18} style={{ margin: '0 8px', color: 'var(--text-secondary)' }} />
              <select className="form-input" style={{ border: 'none', background: 'transparent', padding: '6px 32px 6px 8px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', outline: 'none', margin: 0, boxShadow: 'none' }} value={period} onChange={(e) => setPeriod(e.target.value)}>
                 <option value="today">Hôm nay</option>
                 <option value="month">Tháng này</option>
                 <option value="year">Năm nay</option>
                 <option value="all">Toàn thời gian (Lũy kế)</option>
              </select>
            </div>
            
            <button onClick={handleRefresh} className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 20px', borderRadius: '12px' }}>
              <RefreshCcw size={18} className={isRefreshing ? 'spin-anim' : ''} />
              Đồng Bộ Dữ Liệu
            </button>
         </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', borderBottom: '2px solid var(--surface-border)', paddingBottom: '16px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <button 
          onClick={() => setActiveTab('balance')}
          style={{ flex: 1, minWidth: '180px', background: activeTab === 'balance' ? 'var(--primary)' : 'var(--surface-color)', color: activeTab === 'balance' ? '#fff' : 'var(--text-primary)', border: 'none', padding: '16px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s', boxShadow: activeTab === 'balance' ? '0 10px 15px -3px rgba(249, 115, 22, 0.3)' : 'none' }}>
          <Scale size={20} /> Cân Đối Kế Toán
        </button>
        <button 
          onClick={() => setActiveTab('income')}
          style={{ flex: 1, minWidth: '180px', background: activeTab === 'income' ? 'var(--primary)' : 'var(--surface-color)', color: activeTab === 'income' ? '#fff' : 'var(--text-primary)', border: 'none', padding: '16px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s', boxShadow: activeTab === 'income' ? '0 10px 15px -3px rgba(249, 115, 22, 0.3)' : 'none' }}>
          <Activity size={20} /> KQKD (P&L)
        </button>
        <button 
          onClick={() => setActiveTab('cashflow')}
          style={{ flex: 1, minWidth: '180px', background: activeTab === 'cashflow' ? 'var(--primary)' : 'var(--surface-color)', color: activeTab === 'cashflow' ? '#fff' : 'var(--text-primary)', border: 'none', padding: '16px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s', boxShadow: activeTab === 'cashflow' ? '0 10px 15px -3px rgba(249, 115, 22, 0.3)' : 'none' }}>
          <ArrowRightLeft size={20} /> Lưu Chuyển Tiền Tệ
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          style={{ flex: 1, minWidth: '180px', background: activeTab === 'notes' ? 'var(--primary)' : 'var(--surface-color)', color: activeTab === 'notes' ? '#fff' : 'var(--text-primary)', border: 'none', padding: '16px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.2s', boxShadow: activeTab === 'notes' ? '0 10px 15px -3px rgba(249, 115, 22, 0.3)' : 'none' }}>
          <BookOpen size={20} /> Thuyết Minh
        </button>
      </div>

      {/* TAB CONTENT: BALANCE SHEET */}
      {activeTab === 'balance' && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
           <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid var(--surface-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
               <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: 800, textAlign: 'center', color: 'var(--text-primary)' }}>BẢNG CÂN ĐỐI KẾ TOÁN (BALANCE SHEET)</h3>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '40px' }}>
                  {/* CỘT TÀI SẢN */}
                  <div>
                     <div style={{ paddingBottom: '12px', borderBottom: '3px solid #0284c7', marginBottom: '20px' }}>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>I. TÀI SẢN (ASSETS)</h4>
                     </div>
                     
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>1. Tiền Mặt & Ngân Hàng khả dụng</span>
                        <span style={{ fontWeight: 600 }}>{formatVND(totalCash)}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>2. Giá trị Hàng Tồn Kho (Kho nguyên liệu)</span>
                        <span style={{ fontWeight: 600 }}>{formatVND(totalInventoryValue)}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>3. Tài Sản Lưu Động Khác</span>
                        <span style={{ fontWeight: 600 }}>{formatVND(0)}</span>
                     </div>

                     <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', padding: '16px', background: '#f0f9ff', borderRadius: '8px', fontWeight: 800, fontSize: '16px', color: '#0284c7' }}>
                        <span>TỔNG TÀI SẢN</span>
                        <span>{formatVND(totalAssets)}</span>
                     </div>
                  </div>

                  {/* CỘT NGUỒN VỐN */}
                  <div>
                     <div style={{ paddingBottom: '12px', borderBottom: '3px solid #dc2626', marginBottom: '20px' }}>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>II. NGUỒN VỐN (LIABILITIES & EQUITY)</h4>
                     </div>

                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>1. Nợ Công Phải Trả (A/P NCC)</span>
                        <span style={{ fontWeight: 600, color: '#dc2626' }}>{formatVND(totalLiabilities)}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>2. Nợ Vay (Ngân Hàng)</span>
                        <span style={{ fontWeight: 600 }}>{formatVND(0)}</span>
                     </div>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px', borderTop: '1px dashed var(--surface-border)', paddingTop: '12px' }}>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>3. Vốn Chủ Sở Hữu (Tài Sản Thuần)</span>
                        <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatVND(ownersEquity)}</span>
                     </div>

                     <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', padding: '16px', background: '#fef2f2', borderRadius: '8px', fontWeight: 800, fontSize: '16px', color: '#dc2626' }}>
                        <span>TỔNG NGUỒN VỐN</span>
                        <span>{formatVND(totalLiabilities + ownersEquity)}</span>
                     </div>
                  </div>
               </div>
           </div>
        </div>
      )}

      {/* TAB CONTENT: INCOME STATEMENT */}
      {activeTab === 'income' && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
           <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid var(--surface-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
               <h3 style={{ margin: '0 0 32px 0', fontSize: '20px', fontWeight: 800, textAlign: 'center', color: 'var(--text-primary)' }}>BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH (P&L)</h3>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {/* DOANH THU */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                     <span style={{ fontSize: '16px', fontWeight: 700 }}>1. Doanh Thu Bán Hàng (Gross Revenue)</span>
                     <span style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a' }}>{formatVND(totalRevenue)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 12px 24px', borderBottom: '1px dashed #f1f5f9', color: 'var(--text-secondary)' }}>
                     <span>- Giảm trừ doanh thu (Hoàn / Hủy)</span>
                     <span>{formatVND(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '2px solid var(--surface-border)' }}>
                     <span style={{ fontSize: '16px', fontWeight: 800, color: '#0ea5e9' }}>2. DOANH THU THUẦN (Net Revenue)</span>
                     <span style={{ fontSize: '16px', fontWeight: 800 }}>{formatVND(totalRevenue)}</span>
                  </div>

                  {/* GIÁ VỐN */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                     <span style={{ fontSize: '16px', fontWeight: 700 }}>3. Giá Vốn Hàng Bán (COGS)</span>
                     <span style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>- {formatVND(totalCOGS)}</span>
                  </div>
                  
                  {/* LỢI NHUẬN GỘP */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '2px solid var(--surface-border)' }}>
                     <span style={{ fontSize: '16px', fontWeight: 800, color: '#ea580c' }}>4. LỢI NHUẬN GỘP (Gross Profit)</span>
                     <span style={{ fontSize: '16px', fontWeight: 800 }}>{formatVND(grossProfit)}</span>
                  </div>

                  {/* CHI PHÍ HOẠT ĐỘNG */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                     <span style={{ fontSize: '16px', fontWeight: 700 }}>5. Chi Phí Hoạt Động KDXD (OPEX)</span>
                     <span style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>- {formatVND(operatingExpenses)}</span>
                  </div>

                  {/* LỢI NHUẬN RÒNG */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 20px', background: '#f0fdf4', borderRadius: '12px', marginTop: '24px', border: '1px solid #bcf0da' }}>
                     <span style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>6. LỢI NHUẬN RÒNG (NET PROFIT)</span>
                     <span style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>{formatVND(netProfit)}</span>
                  </div>
               </div>
           </div>
        </div>
      )}

      {/* TAB CONTENT: CASH FLOW */}
      {activeTab === 'cashflow' && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
           <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid var(--surface-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
               <h3 style={{ margin: '0 0 32px 0', fontSize: '20px', fontWeight: 800, textAlign: 'center', color: 'var(--text-primary)' }}>BÁO CÁO LƯU CHUYỂN TIỀN TỆ (CASH FLOW)</h3>
               
               <div style={{ paddingBottom: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#16a34a' }}>I. DÒNG TIỀN VÀO (CASH INFLOWS)</div>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>{formatVND(cashInflows)}</div>
               </div>
               <div style={{ padding: '12px 24px', borderBottom: '1px dashed #f1f5f9', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>- Tiền thu từ bán hàng hóa</span>
                  <span>{formatVND(totalRevenue)}</span>
               </div>
               <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>- Tiền thu nhập khác</span>
                  <span>{formatVND(cashInflows - totalRevenue > 0 ? cashInflows - totalRevenue : 0)}</span>
               </div>

               <div style={{ paddingBottom: '16px', paddingTop: '32px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#ef4444' }}>II. DÒNG TIỀN RA (CASH OUTFLOWS)</div>
                  <div style={{ fontWeight: 800, fontSize: '16px' }}>{formatVND(cashOutflows)}</div>
               </div>
               <div style={{ padding: '12px 24px', borderBottom: '1px dashed #f1f5f9', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>- Tiền chi trả kho NVL / Nhà cung cấp</span>
                  <span>{formatVND(filteredTransactions.filter(t=>t.type==='Chi' && t.note?.includes('nhập kho')).reduce((sum,t)=>sum+t.amount,0) || 0)}</span>
               </div>
               <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>- Tiền chi phí hoạt động KDXD</span>
                  <span>{formatVND(operatingExpenses)}</span>
               </div>

               <div style={{ display: 'flex', justifyContent: 'space-between', padding: '24px 20px', background: netCashFlow >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: '12px', marginTop: '32px', border: '1px solid', borderColor: netCashFlow >= 0 ? '#bcf0da' : '#fecaca' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: netCashFlow >= 0 ? '#16a34a' : '#ef4444' }}>III. LƯU CHUYỂN TIỀN TỆ THUẦN (NET CASH FLOW)</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: netCashFlow >= 0 ? '#16a34a' : '#ef4444' }}>{formatVND(netCashFlow)}</span>
               </div>
           </div>
        </div>
      )}

      {/* TAB CONTENT: FINANCIAL NOTES */}
      {activeTab === 'notes' && (
        <div style={{ animation: 'fadeIn 0.3s' }}>
           <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', border: '1px solid var(--surface-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
               <h3 style={{ margin: '0 0 32px 0', fontSize: '20px', fontWeight: 800, textAlign: 'center', color: 'var(--text-primary)' }}>BẢN THUYẾT MINH BÁO CÁO TÀI CHÍNH (AI GENERATED)</h3>
               
               <div style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--text-primary)' }}>
                  <p><strong>Kính Gửi Ban Giám Đốc (C-Level),</strong><br/>
                  Dựa trên dữ liệu kế toán và biến động giao dịch hiện tại, hệ thống đưa ra các diễn giải sâu sắc về tình trạng BCTC như sau:</p>

                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '16px', borderLeft: '4px solid #3b82f6' }}>
                     <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>1. Về Cơ Cấu Trọng Yếu Của Kế Toán Tài Sản Kho</h4>
                     Cửa hàng đang nắm giữ tổng Tài sản là <strong>{formatVND(totalAssets)}</strong>, trong đó lượng vốn bị ngâm vào Tồn Kho Nguyên Vật Liệu chiếm khoảng <strong>{totalAssets > 0 ? ((totalInventoryValue/totalAssets)*100).toFixed(1) : 0}%</strong> ({formatVND(totalInventoryValue)}). {totalInventoryValue/totalAssets > 0.4 ? "Tỷ trọng kẹt hàng kho tương đối CAO, đề xuất CCO chạy flash sale mảng Delivery để giải phóng nguyên liệu." : "Tỷ trọng kiểm soát ở mức An Toàn, thanh khoản tốt."}
                  </div>

                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '16px', borderLeft: '4px solid #ef4444' }}>
                     <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>2. Về Cơ Cấu Thanh Khoản Kế Toán Công Nợ (A/P)</h4>
                     Khoản Nợ Phải Trả Nhà Cung Cấp hiện ghi nhận là <strong>{formatVND(totalLiabilities)}</strong>. So với Dòng tiền khả dụng ({formatVND(totalCash)}), khả năng chi trả ngay của hệ thống đang {totalCash > totalLiabilities ? "VỮNG BƯỚC, Tiền mặt đủ thặng dư để thanh lý công nợ." : "CHỊU ÁP LỰC, Dòng tiền mặt thấp hơn khối công nợ. CFO cần giãn chu kỳ thanh toán cho Đại Lý / NCC."}
                  </div>

                  <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
                     <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>3. Về Cơ Cấu Sinh Lãi (Margin & OPEX)</h4>
                     Thu nhập trong kỳ của Cửa hàng đạt mức Tổng Doanh Thu <strong>{formatVND(totalRevenue)}</strong>. Chi phí Giá Vốn (Gà, Gia cầm, Đậu v.v) đang chiếm rủi ro biên khoảng <strong>{totalRevenue > 0 ? ((totalCOGS/totalRevenue)*100).toFixed(1) : 0}%</strong>. Tổng trừ sau tất cả chi phí Quỹ (OPEX), tỷ suất lợi nhuận ròng nhét túi là <strong>{totalRevenue > 0 ? ((netProfit/totalRevenue)*100).toFixed(1) : 0}%</strong> (Bằng chữ: Chín phẩy Không phần trăm).
                  </div>

                  <p style={{ marginTop: '24px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>Báo cáo được tự động trích xuất trực tiếp từ Chuỗi Giao Dịch Sổ Quỹ (General Ledger) và Kho Tổng. (Timestamp: Realtime Kế toán tự động lập)</p>
               </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-anim { animation: spin 0.6s linear infinite; }
      `}</style>
    </div>
  );
}
