import React from 'react';
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
  RefreshCcw,
  ChevronDown
} from 'lucide-react';
import { useFinancialStatements } from '../hooks/useFinancialStatements';
import SmartDateFilter from '../components/SmartDateFilter';

export default function FinancialStatements() {
  const { state } = useData();
  const { 
    activeTab, setActiveTab, 
    period, setPeriod, 
    filterDate, setFilterDate,
    isRefreshing, handleRefresh, 
    statements 
  } = useFinancialStatements(state);

  const {
    totalCash, totalInventoryValue, totalAssets, totalLiabilities, ownersEquity,
    totalGrossRevenue, totalNetRevenue, totalCOGS, cogsByCategory, grossProfit, operatingExpenses, netProfit,
    totalPlatformCommission, totalPlatformVAT, totalPlatformTNCN, platformFee,
    cashInflows, cashOutflows, operationsCashInflows, equityInflows, netCashFlow, filteredTransactions = []
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
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <SmartDateFilter 
                   filterDate={filterDate}
                   setFilterDate={setFilterDate}
                   datePreset={period}
                   setDatePreset={setPeriod}
                   align="right"
                />
            </div>
            
            <button onClick={handleRefresh} className="btn btn-primary table-feature-btn">
              <RefreshCcw size={16} className={isRefreshing ? 'spin-anim' : ''} />
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
                     <span style={{ fontSize: '16px', fontWeight: 700, color: '#16a34a' }}>{formatVND(totalGrossRevenue)}</span>
                  </div>
                  
                  {/* CÁC KHOẢN GIẢM TRỪ */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px 24px', color: 'var(--text-secondary)' }}>
                     <span>- Chiết khấu Nền tảng / Sàn Dịch vụ</span>
                     <span>- {formatVND(totalPlatformCommission)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 4px 24px', color: 'var(--text-secondary)' }}>
                     <span>- Thuế GTGT nộp hộ (3%)</span>
                     <span>- {formatVND(totalPlatformVAT)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0 12px 24px', borderBottom: '1px dashed #f1f5f9', color: 'var(--text-secondary)' }}>
                     <span>- Thuế TNCN nộp hộ (1.5%)</span>
                     <span>- {formatVND(totalPlatformTNCN)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '2px solid var(--surface-border)' }}>
                     <span style={{ fontSize: '16px', fontWeight: 800, color: '#0ea5e9' }}>2. DOANH THU THUẦN (Net Revenue)</span>
                     <span style={{ fontSize: '16px', fontWeight: 800 }}>{formatVND(totalNetRevenue)}</span>
                  </div>

                  {/* GIÁ VỐN */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                     <span style={{ fontSize: '16px', fontWeight: 700 }}>3. Giá Vốn Hàng Bán (COGS)</span>
                     <span style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>- {formatVND(totalCOGS)}</span>
                  </div>
                  {cogsByCategory && Object.keys(cogsByCategory).length > 0 && (
                     <div style={{ paddingBottom: '8px', background: '#f8fafc', borderRadius: '4px', margin: '4px 0 12px 0' }}>
                        {Object.entries(cogsByCategory).map(([cat, amount]) => (
                           <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px 4px 24px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                              <span style={{ display: 'flex', alignItems: 'center' }}>
                                 <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#94a3b8', marginRight: '8px' }}/>
                                 {cat}
                              </span>
                              <span style={{ fontFamily: 'monospace' }}>{formatVND(amount)}</span>
                           </div>
                        ))}
                     </div>
                  )}
                  
                  {/* LỢI NHUẬN GỘP */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 0', borderBottom: '2px solid var(--surface-border)' }}>
                     <span style={{ fontSize: '16px', fontWeight: 800, color: '#ea580c' }}>4. LỢI NHUẬN GỘP (Gross Profit)</span>
                     <span style={{ fontSize: '16px', fontWeight: 800 }}>{formatVND(grossProfit)}</span>
                  </div>

                  {/* CHI PHÍ HOẠT ĐỘNG */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f1f5f9' }}>
                     <span style={{ fontSize: '16px', fontWeight: 700 }}>5. Chi Phí Hoạt Động Cố Định (OPEX)</span>
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
                  <span>- Tiền thu từ HĐ bán hàng (Operations)</span>
                  <span>{formatVND(operationsCashInflows)}</span>
               </div>
               {equityInflows > 0 && (
                   <div style={{ padding: '12px 24px', borderBottom: '1px dashed #f1f5f9', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>- Tiền góp vốn chủ sở hữu (Financing)</span>
                      <span>{formatVND(equityInflows)}</span>
                   </div>
               )}
               <div style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>- Tiền thu nhập khác</span>
                  <span>{formatVND(Math.max(0, cashInflows - operationsCashInflows - equityInflows))}</span>
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
               <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800, textAlign: 'center', color: '#1e293b', textTransform: 'uppercase' }}>BÁO CÁO CỔ ĐÔNG & CHỈ ĐẠO ĐIỀU HÀNH</h3>
               <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '32px' }}>Trích xuất theo chuẩn VAS/IFRS - Cảnh báo Real-time từ Trí Tuệ Nhân Tạo</p>
               
               <div style={{ fontSize: '15px', lineHeight: '1.8', color: 'var(--text-primary)' }}>
                  <p style={{ fontSize: '16px', marginBottom: '24px' }}><strong>Kính Gửi Hội Đồng Quản Trị & Ban Giám Đốc,</strong><br/>
                  Dưới đây là Báo cáo Sức khỏe Hệ thống chuyên sâu, được phân rã thành **4 trụ cột điều hành** giúp các Cổ đông có thể nắm bắt bức tranh toàn cảnh và dễ dàng luân phiên quản trị chéo (Cross-management):</p>

                  {/* 1. GÓC ĐỘ CFO (Tài Chính & Dòng Tiền) */}
                  <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '20px', borderLeft: '4px solid #3b82f6' }}>
                     <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>1. Góc độ CFO: Thanh khoản & Hiệu suất Vốn (Liquidity & ROE)</h4>
                     <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '8px' }}>
                           <strong>Khả năng thanh toán hiện hành (Current Ratio):</strong> {(totalLiabilities > 0 ? (totalAssets / totalLiabilities) : (totalAssets > 0 ? 999 : 0)).toFixed(2)} lần.
                           <span style={{ fontSize: '13px', color: '#475569', marginLeft: '8px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', verticalAlign: 'middle' }}>(Tổng TS: {formatVND(totalAssets)} ÷ Nợ: {formatVND(totalLiabilities)})</span><br/>
                           <span style={{ color: 'var(--text-secondary)' }}>👉 <strong>Chỉ đạo:</strong> Mốc an toàn &gt; 1.5 lần. {totalAssets > (totalLiabilities * 1.5) ? 'Tài sản dồi dào, doanh nghiệp hoàn toàn miễn nhiễm với rủi ro phá sản ngắn hạn.' : 'Đang dưới mốc an toàn! Tuyệt đối không ký thêm hợp đồng mua chịu (Công nợ) mới.'}</span>
                        </li>
                        <li style={{ marginBottom: '8px' }}>
                           <strong>Lợi nhuận trên Vốn Chủ Sở Hữu (ROE):</strong> {ownersEquity > 0 ? ((netProfit / ownersEquity) * 100).toFixed(2) : 0}%.
                           <span style={{ fontSize: '13px', color: '#475569', marginLeft: '8px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', verticalAlign: 'middle' }}>(Lãi ròng: {formatVND(netProfit)} ÷ Vốn CSH: {formatVND(ownersEquity)})</span><br/>
                           <span style={{ color: 'var(--text-secondary)' }}>👉 <strong>Chỉ đạo:</strong> Thể hiện 100 đồng vốn cổ đông bỏ ra sinh được bao nhiêu đồng lãi. {ownersEquity > 0 && (netProfit/ownersEquity) >= 0.2 ? 'ROE xuất sắc, vượt kênh đầu tư tài chính. Nên giữ lại lợi nhuận để gộp vốn mở điểm bán mới (Scale-up).' : 'ROE đang thấp hoặc âm, cần tạm dừng các kế hoạch mở rộng để tối ưu lại Cửa hàng hiện tại.'}</span>
                        </li>
                        <li>
                           <strong>Sức khỏe Ngân quỹ (Net Cash Flow):</strong> {netCashFlow >= 0 ? <span style={{color: '#16a34a', fontWeight:700}}>THẶNG DƯ {formatVND(netCashFlow)}</span> : <span style={{color: '#dc2626', fontWeight:700}}>THÂM HỤT {formatVND(netCashFlow)}</span>}.<br/>
                           <span style={{ color: 'var(--text-secondary)' }}>👉 <strong>Chỉ đạo:</strong> {netCashFlow >= 0 ? 'Dòng tiền dương từ hoạt động kinh doanh (Core Operations) đang đủ nuôi máy bộ máy, có thể trích quỹ dự phòng hoặc chia cổ tức.' : 'Đang "đốt tiền" (Burn-rate) nhanh hơn dòng tiền vào. Yêu cầu kiểm soát ngay Phút (Stop) các khoản chi tiêu không tạo ra doanh thu ngay tức khắc.'}</span>
                        </li>
                     </ul>
                  </div>

                  {/* 2. GÓC ĐỘ CMO (Doanh Thu & Kênh Bán) */}
                  <div style={{ background: '#fdf4ff', padding: '24px', borderRadius: '12px', marginBottom: '20px', borderLeft: '4px solid #d946ef' }}>
                     <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>2. Góc độ CMO: Phát triển Kênh Bán & Khấu trừ (Sales & Margin)</h4>
                     <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '8px' }}>
                           <strong>Biên Lợi Nhuận Gộp (Gross Margin):</strong> {totalNetRevenue > 0 ? ((grossProfit/totalNetRevenue)*100).toFixed(2) : 0}%. 
                           <span style={{ fontSize: '13px', color: '#86198f', marginLeft: '8px', background: '#fae8ff', padding: '2px 8px', borderRadius: '4px', verticalAlign: 'middle' }}>(Lãi gộp: {formatVND(grossProfit)} ÷ Doanh thu thuần: {formatVND(totalNetRevenue)})</span><br/>
                           <span style={{ color: 'var(--text-secondary)' }}>👉 <strong>Chỉ đạo:</strong> Mốc chuẩn F&B là 60%-70%. {totalNetRevenue > 0 && (grossProfit/totalNetRevenue) < 0.5 ? 'Biên gộp đang DƯỚI 50% => Giá vốn (Food Cost) quá cao hoặc đang giảm giá ngầm quá nhiều. Cần rà soát lại Menu/Giá bán ngay.' : 'Biên gộp khỏe mạnh, có thể tung thêm Combo hoặc Flash Sale để hút Traffic.'}</span>
                        </li>
                        <li>
                           <strong>Tỷ trọng ăn mòn của Phí Sàn & Thuế App:</strong> {totalGrossRevenue > 0 ? ((platformFee/totalGrossRevenue)*100).toFixed(2) : 0}%.
                           <span style={{ fontSize: '13px', color: '#86198f', marginLeft: '8px', background: '#fae8ff', padding: '2px 8px', borderRadius: '4px', verticalAlign: 'middle' }}>(Tổng cấu véo: {formatVND(platformFee)} ÷ Doanh thu gốc: {formatVND(totalGrossRevenue)})</span><br/>
                           <span style={{ color: 'var(--text-secondary)' }}>👉 <strong>Chỉ đạo:</strong> {totalGrossRevenue > 0 && (platformFee/totalGrossRevenue) >= 0.2 ? 'Nền tảng giao đồ ăn đang "ăn mòn" hơn 20% doanh thu gốc. Đề xuất tung chương trình MKT kéo User qua Zalo/Hotline hoặc chèn tờ rơi vào đơn hàng để chuyển đổi khách App thành khách quen mua trực tiếp (Direct Orders).' : 'Kênh trực tiếp đang hoạt động tốt, không bị lệ thuộc vào nền tảng thứ 3.'}</span>
                        </li>
                     </ul>
                  </div>

                  {/* 3. GÓC ĐỘ COO (Vận hành & Chi phí ẩn) */}
                  <div style={{ background: '#f0fdf4', padding: '24px', borderRadius: '12px', marginBottom: '20px', borderLeft: '4px solid #10b981' }}>
                     <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>3. Góc độ COO: Hiệu suất Vận hành (Operations & OPEX)</h4>
                     <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '8px' }}>
                           <strong>Gánh nặng Định phí (OPEX Ratio):</strong> {totalNetRevenue > 0 ? ((operatingExpenses/totalNetRevenue)*100).toFixed(2) : 0}%.
                           <span style={{ fontSize: '13px', color: '#166534', marginLeft: '8px', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', verticalAlign: 'middle' }}>(Chi phí Q/L: {formatVND(operatingExpenses)} ÷ Doanh thu thuần: {formatVND(totalNetRevenue)})</span><br/>
                           <span style={{ color: 'var(--text-secondary)' }}>👉 <strong>Chỉ đạo:</strong> Mốc chuẩn là &lt; 25%. Trực tiếp phản ánh hiệu suất chắt bóp chi phí của Ban vận hành (Điện, nước, nhân sự, hao hụt). {totalNetRevenue > 0 && (operatingExpenses/totalNetRevenue) > 0.3 ? 'OPEX ĐANG NUỐT TRỌN LỢI NHUẬN. COO có trát (Mandate) rà soát hệ thống điện nước, cắt giảm nhân sự dưa thừa vào giờ thấp điểm (Off-peak).' : 'Kiểm soát bộ máy Cửa hàng rất tốt, tinh gọn và cỗ máy tối ưu.'}</span>
                        </li>
                        <li>
                           <strong>Biên Lợi Nhuận Ròng (Net Margin):</strong> {totalNetRevenue > 0 ? ((netProfit/totalNetRevenue)*100).toFixed(2) : 0}%. 
                           <span style={{ fontSize: '13px', color: '#166534', marginLeft: '8px', background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', verticalAlign: 'middle' }}>(Lãi ròng: {formatVND(netProfit)} ÷ Doanh thu thuần: {formatVND(totalNetRevenue)})</span><br/>
                           <span style={{ color: 'var(--text-secondary)' }}>👉 <strong>Chỉ đạo:</strong> Mốc kỳ vọng là &gt; 15%. Chốt hạ cuối cùng của nỗ lực toàn thể hệ thống. Lợi nhuận gộp có đẹp đến đâu mà Net Margin âm thì bằng Không. </span>
                        </li>
                     </ul>
                  </div>

                  {/* 4. GÓC ĐỘ SUPPLY CHAIN (Bếp Trưởng & Kho) */}
                  <div style={{ background: '#fffbeb', padding: '24px', borderRadius: '12px', marginBottom: '20px', borderLeft: '4px solid #f59e0b' }}>
                     <h4 style={{ margin: '0 0 12px 0', color: '#1e293b', fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>4. Góc độ Bếp Trưởng: Chuỗi Cung Cứng & Tồn Kho (Supply Chain)</h4>
                     <p style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span>Lượng vốn bị kẹt chết trong Tồn kho (NVL): <strong>{totalAssets > 0 ? ((totalInventoryValue/totalAssets)*100).toFixed(2) : 0}%</strong> tổng tài sản.</span>
                        <span style={{ fontSize: '13px', color: '#92400e', background: '#fef3c7', padding: '2px 8px', borderRadius: '4px' }}>(Giá trị kho: {formatVND(totalInventoryValue)} ÷ Tổng TS: {formatVND(totalAssets)})</span>
                     </p>
                     <div style={{ padding: '12px', background: 'rgba(255,255,255,0.6)', borderRadius: '8px', border: '1px dashed #fcd34d' }}>
                        <strong>[Mốc rủi ro ngành F&B]: Mức Tối Ưu luân chuyển từ 15% - 25%</strong>
                        <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                           <li><strong>Dưới 15%:</strong> Có thể cháy hàng bất cứ lúc nào. Đặc biệt rủi ro nếu có Đơn Khách Sỉ (Catering).</li>
                           <li><strong>15% - 25%:</strong> {totalAssets > 0 && (totalInventoryValue/totalAssets) >= 0.15 && (totalInventoryValue/totalAssets) <= 0.25 ? <span style={{color:'#d97706', fontWeight: 700}}>XUẤT SẮC. QUẢN TRỊ KHO ĐANG Ở CHUẨN VÀNG.</span> : ''}</li>
                           <li><strong>Trên 25%:</strong> {totalAssets > 0 && (totalInventoryValue/totalAssets) > 0.25 ? <span style={{color:'#dc2626', fontWeight: 700}}>BÁO ĐỘNG ĐỎ. VỐN ĐANG BỊ GIAM TRONG TỦ ĐÔNG. Bếp trưởng cần lên phương án ưu tiên đẩy các món dùng nguyên liệu đang tồn dư nhiều. Tránh hỏng hóc!</span> : ''}</li>
                        </ul>
                     </div>
                  </div>

                  <p style={{ marginTop: '32px', textAlign: 'center', fontStyle: 'italic', fontSize: '13px', color: 'var(--text-secondary)' }}>Báo cáo được khởi tạo theo cơ chế Real-time Accounting Protocol độc quyền dành cho Ban Lãnh Đạo cấp cao (C-Level).<br/>Mọi thành viên HĐQT đều có bổn phận đọc hiểu và thực thi các chỉ đạo tương ứng chức năng của mình.</p>
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
