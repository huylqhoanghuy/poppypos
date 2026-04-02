import React, { useState } from 'react';
import { FileText, TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, BarChart3, Calendar, Download, Globe, Info, Filter } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, ArcElement } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { formatMoney } from '../utils/formatter';
import { useBusinessReport } from '../hooks/useBusinessReport';
import SmartTable from '../components/SmartTable';
import ReportDetailModal from '../components/ReportDetailModal';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement, ArcElement, ChartDataLabels);

const BusinessReports = () => {
  const { state } = useData();
  const { filterDate, setFilterDate, datePreset, handlePresetChange, reportData } = useBusinessReport(state);
  
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [detailModalTitle, setDetailModalTitle] = useState('');

  if (!reportData) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu báo cáo...</div>;

  const handleOpenDetailModal = (item, type) => {
      setDetailModalTitle(type === 'channel' ? 'Kênh Bán' : type === 'product' ? 'Sản Phẩm' : 'Nguyên Liệu');
      setDetailModalItem(item);
  };


  const trendChartData = {
    labels: reportData.dailyTrend.labels,
    datasets: [
        {
            type: 'line',
            label: 'Lợi Nhuận',
            data: reportData.dailyTrend.profit,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y'
        },
        {
            type: 'bar',
            label: 'Doanh Thu',
            data: reportData.dailyTrend.revenue,
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderRadius: 4,
            yAxisID: 'y'
        }
    ]
  };

  const pieChartData = {
      labels: reportData.channels.map(c => c.name),
      datasets: [{
          data: reportData.channels.map(c => c.revenue),
          backgroundColor: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'],
          borderWidth: 1
      }]
  };

  const topProductsChartData = {
      labels: reportData.totalProductsList.slice(0, 10).map(p => p.name.length > 25 ? p.name.substring(0,25) + '...' : p.name),
      datasets: [{
          axis: 'y',
          label: 'Số Lượng Bán',
          data: reportData.totalProductsList.slice(0, 10).map(p => p.qty),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderRadius: 4
      }]
  };

  const topIngredientsChartData = {
      labels: reportData.totalIngredientsList.slice(0, 10).map(i => i.name.length > 25 ? i.name.substring(0,25) + '...' : i.name),
      datasets: [{
          axis: 'y',
          label: 'Tiêu Hao',
          data: reportData.totalIngredientsList.slice(0, 10).map(i => Math.round(i.qty * 10) / 10),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderRadius: 4
      }]
  };

  const channelCols = [
      { key: 'name', label: 'Tên Kênh', sortable: true, render: (v) => <div style={{fontWeight: 600}}>{v}</div> },
      { key: 'orders', label: 'Số Đơn (Thành công)', sortable: true, align: 'center', sum: true, render: (v) => <div style={{fontWeight: 800}}>{v}</div> },
      { key: 'revenue', label: 'Doanh Thu Thuần', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v) => (
          <div><span style={{fontWeight: 700}}>{formatMoney(v)} đ</span><br/><span style={{fontSize:'11px', color:'var(--text-secondary)'}}>{reportData.totalRevenue ? (v/reportData.totalRevenue*100).toFixed(1) : 0}% DTT Tổng</span></div>
      )},
      { key: 'cogs', label: 'Giá Vốn (COGS)', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v) => (
          <div style={{color:'var(--danger)'}}><span>{formatMoney(v)} đ</span><br/><span style={{fontSize:'11px'}}>{reportData.totalCOGS ? (v/reportData.totalCOGS*100).toFixed(1) : 0}% COGS Tổng</span></div>
      )},
      { key: 'fee', label: 'Phí Sàn (App)', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v) => (
          <div style={{color:'var(--warning)'}}><span>{formatMoney(v)} đ</span><br/><span style={{fontSize:'11px'}}>{reportData.totalFee ? (v/reportData.totalFee*100).toFixed(1) : 0}% Phí Tổng</span></div>
      )},
      { key: 'opex', label: 'Phí Vận Hành', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v) => (
          <div style={{color:'var(--warning)'}}><span>{formatMoney(v)} đ</span><br/><span style={{fontSize:'11px'}}>{reportData.totalOPEX ? (v/reportData.totalOPEX*100).toFixed(1) : 0}% VH Tổng</span></div>
      )},
      { key: 'profit', label: 'Lợi Nhuận Ròng', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v, o) => (
          <div style={{color:'var(--success)'}}><span style={{fontWeight: 800}}>{formatMoney(v)} đ</span><br/><span style={{fontSize:'11px', padding:'2px 6px', background:'var(--surface-color)', borderRadius:'4px'}}>{o.margin.toFixed(1)}% Biên Kênh</span></div>
      )}
  ];

  const productCols = [
      { key: 'name', label: 'Tên Sản Phẩm (TỔNG)', sortable: true, render: (v, o) => (
          <div>
            <div style={{fontWeight: 600}}>{v}</div>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>(Đơn giá: {formatMoney(o.basePrice)} đ | G.Vốn: {formatMoney(o.unitCost)} đ)</span>
          </div>
      )},
      { key: 'qty', label: 'Số Lượng', sortable: true, align: 'center', sum: true, render: (v) => <div style={{fontWeight: 800, fontSize:'15px'}}>{Math.round(v * 10)/10}</div> },
      { key: 'revenue', label: 'Doanh Thu', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v, o) => (
          <div style={{color:'var(--primary)'}}>
            <span style={{fontWeight: 700}}>{formatMoney(v)} đ</span><br/>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>({formatMoney(o.basePrice)} x {Math.round(o.qty * 10)/10})</span>
          </div>
      )},
      { key: 'cogs', label: 'Giá Vốn', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v, o) => (
          <div style={{color:'var(--danger)'}}>
             <span>{formatMoney(v)} đ</span><br/>
             <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>({formatMoney(o.unitCost)} x {Math.round(o.qty * 10)/10})</span>
          </div>
      )},
      { key: 'feeOpex', label: 'Phí Sàn & VH', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.fee + row.opex, render: (_, o) => (
          <div style={{color:'var(--warning)'}}>{formatMoney(o.fee + o.opex)} đ</div>
      )},
      { key: 'profit', label: 'LN Gộp', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.revenue - row.cogs - row.fee - row.opex, render: (_, o) => {
          const itemProfit = o.revenue - o.cogs - o.fee - o.opex;
          return <div style={{color:'var(--success)'}}>
              <span style={{fontWeight: 800}}>{formatMoney(itemProfit)} đ</span><br/>
              <span style={{fontSize:'11px'}}>{o.revenue ? (itemProfit / o.revenue * 100).toFixed(1) : 0}% Biên</span>
          </div>
      }}
  ];

  const ingredientCols = [
      { key: 'name', label: 'Tên Nguyên Liệu', sortable: true, render: (v) => <div style={{fontWeight: 600}}>{v}</div> },
      { key: 'qty', label: 'Sử Dụng', sortable: true, align: 'center', sum: true, render: (v, o) => <div><span style={{fontWeight: 800}}>{Math.round(v * 10) / 10}</span> <span style={{fontSize:'12px', color:'var(--text-secondary)'}}>{o.unit}</span></div> },
      { key: 'attributedRevenue', label: 'Doanh Thu Vị Trí', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v) => <div style={{color:'var(--primary)', fontWeight:600}}>{formatMoney(v)} đ</div> },
      { key: 'totalCost', label: 'Chi Phí Vốn', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v, o) => (
          <div style={{color:'var(--danger)', fontWeight:600}}>
             {formatMoney(v)} đ<br/>
             <span style={{fontSize:'11px'}}>{o.attributedRevenue ? (v / o.attributedRevenue * 100).toFixed(1) : 0}%</span>
          </div>
      )},
      { key: 'profit', label: 'Biên Tích Lũy', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.attributedRevenue - row.totalCost - (row.fee + row.opex), render: (_, o) => {
          const itemProfit = o.attributedRevenue - o.totalCost - (o.fee + o.opex);
          return <div style={{color:'var(--success)', fontWeight:800}}>
              {formatMoney(itemProfit)} đ<br/>
              <span style={{fontSize:'11px'}}>{o.attributedRevenue ? (itemProfit / o.attributedRevenue * 100).toFixed(1) : 0}%</span>
          </div>
      }},
      { key: 'roi', label: 'ROI', sortable: true, align: 'right', sumFunc: () => 0, render: (_, o) => {
          const totalAttachedFees = o.fee + o.opex;
          const itemProfit = o.attributedRevenue - o.totalCost - totalAttachedFees;
          const roi = o.totalCost > 0 ? (itemProfit / o.totalCost) * 100 : 0;
          return <span style={{color: roi >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600}}>{roi > 0 ? '+' : ''}{roi.toFixed(0)}%</span>;
      }}
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChart3 color="var(--primary)" /> Doanh Thu & Lợi Nhuận Khái Quát
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
             Dữ liệu tổng hợp hệ thống, không chia tách. Để xem chi tiết theo kênh, sang tính năng Báo Cáo Kênh Phân Rã.
          </p>
        </div>
        <button className="btn btn-primary table-feature-btn" onClick={() => window.print()}><Download size={16}/> Xuất Báo Cáo</button>
      </div>

      <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', background: 'var(--surface-color)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
             <Filter size={18} /> Bộ Lọc Tổng Cục Số Liệu:
         </div>
         <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', padding: '4px' }}>
             {['today', 'week', 'month', 'year'].map(pt => {
                 const names = { today: 'Hôm Nay', week: 'Tuần Này', month: 'Tháng Này', year: 'Năm Nay' };
                 return (
                    <button key={pt} onClick={() => handlePresetChange(pt)} 
                            style={{ 
                                padding: '0 16px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center',
                                background: datePreset === pt ? 'white' : 'transparent',
                                color: datePreset === pt ? 'var(--primary)' : 'var(--text-secondary)',
                                boxShadow: datePreset === pt ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                             }}>
                        {names[pt]}
                    </button>
                 );
             })}
             <button onClick={() => handlePresetChange('custom')}
                 style={{ 
                    padding: '0 16px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center',
                    background: datePreset === 'custom' ? 'white' : 'transparent',
                    color: datePreset === 'custom' ? 'var(--primary)' : 'var(--text-secondary)',
                    boxShadow: datePreset === 'custom' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                 }}>Tùy Chọn</button>
         </div>

         {datePreset === 'custom' && (
             <div style={{ display:'flex', alignItems:'center', gap:'12px', borderLeft: '1px solid var(--surface-border)', paddingLeft: '16px' }}>
                <Calendar size={18} color="var(--primary)" />
                <input type="date" className="form-input" style={{ width:'140px', padding: '6px 12px' }} value={filterDate.start} onChange={e => setFilterDate({...filterDate, start: e.target.value})} />
                <span>đến</span>
                <input type="date" className="form-input" style={{ width:'140px', padding: '6px 12px' }} value={filterDate.end} onChange={e => setFilterDate({...filterDate, end: e.target.value})} />
             </div>
         )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--text-primary)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>TỔNG LƯỢNG ĐƠN HÀNG</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>{reportData.totalSuccessOrders} <span style={{fontSize:'16px', fontWeight:600}}>(Đơn)</span></div>
              <div style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '8px', fontWeight: 600 }}>Tỷ lệ đơn hủy: {reportData.totalSuccessOrders + reportData.totalCancelledOrders > 0 ? ((reportData.totalCancelledOrders / (reportData.totalSuccessOrders + reportData.totalCancelledOrders))*100).toFixed(1) : 0}% ({reportData.totalCancelledOrders} đơn)</div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>TỔNG DOANH THU THUẦN</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--primary)' }}>{formatMoney(reportData.totalRevenue)} đ</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  Hợp nhất toàn bộ các kênh
              </div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--danger)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>TỔNG CHI PHÍ HOẠT ĐỘNG</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--danger)' }}>{formatMoney(reportData.totalCOGS + reportData.totalFee + reportData.totalOPEX)} đ</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                 Vốn ({reportData.totalRevenue ? ((reportData.totalCOGS/reportData.totalRevenue)*100).toFixed(1) : 0}%) 
                 + Sàn ({reportData.totalRevenue ? ((reportData.totalFee/reportData.totalRevenue)*100).toFixed(1) : 0}%) 
                 + Vận hành ({reportData.totalRevenue ? ((reportData.totalOPEX/reportData.totalRevenue)*100).toFixed(1) : 0}%)</div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--success)', background: 'linear-gradient(to right, rgba(16, 185, 129, 0.05), transparent)' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>LỢI NHUẬN RÒNG ĐÃ TRỪ PHÍ</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--success)' }}>{formatMoney(reportData.totalProfit)} đ</div>
              <div style={{ fontSize: '13px', color: 'var(--success)', marginTop: '8px', fontWeight: 600 }}>Cấp tỷ suất sinh lời: {reportData.totalMargin.toFixed(1)}%</div>
          </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>BIỂU ĐỒ THEO DÕI DOANH THU / LỢI NHUẬN TỔNG {datePreset === 'today' ? 'TRONG NGÀY' : 'HẰNG NGÀY'}</h4>
              <div style={{ height: '300px' }}>
                  <Bar data={trendChartData} options={{ 
                      maintainAspectRatio: false, 
                      interaction: { mode: 'index', intersect: false },
                      scales: { y: { beginAtZero: true } },
                      plugins: {
                          datalabels: {
                              display: true,
                              color: '#334155',
                              anchor: 'end',
                              align: 'top',
                              offset: 4,
                              font: { size: 10, weight: 'bold' },
                              formatter: (value) => value > 0 ? (value >= 1000000 ? (value / 1000000).toFixed(1) + 'Tr' : (value / 1000).toFixed(0) + 'K') : ''
                          }
                      }
                  }} />
              </div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)', alignSelf: 'flex-start' }}>CƠ CẤU DOANH THU KÊNH</h4>
              <div style={{ height: '220px', width: '100%', maxWidth: '280px', margin: 'auto' }}>
                  {reportData.channels.length > 0 ? (
                     <Pie data={pieChartData} options={{ 
                         maintainAspectRatio: false, 
                         layout: { padding: 20 },
                         plugins: { 
                             legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                             datalabels: {
                                 color: '#ffffff',
                                 font: { weight: 'bold', size: 11 },
                                 formatter: (value, ctx) => {
                                      const total = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
                                      const p = (value/total*100).toFixed(0);
                                      return p > 5 ? p + '%' : '';
                                 }
                             }
                         } 
                     }} />
                  ) : <div style={{textAlign:'center', paddingTop: '80px', color: 'var(--text-secondary)'}}>Trống</div>}
              </div>
          </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={18} color="var(--primary)" /> TỶ TRỌNG P&L TỔNG QUAN CÁC KÊNH SO VỚI TỔNG CỤC
          </h4>
              <SmartTable 
                 columns={channelCols} 
                 data={reportData.channels}
                 idKey="id"
                 storageKey="report_channels"
                 defaultItemsPerPage={20}
                 tableMinWidth="1000px"
                 onView={(row) => handleOpenDetailModal(row, 'channel')}
              />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>TOP 10 SẢN PHẨM BÁN CHẠY NHẤT (THEO SỐ LƯỢNG)</h4>
              <div style={{ height: '320px', width: '100%' }}>
                  {reportData.totalProductsList.length > 0 ? (
                      <Bar data={topProductsChartData} options={{ 
                          maintainAspectRatio: false, 
                          indexAxis: 'y', 
                          layout: { padding: { right: 40 } },
                          plugins: { 
                              legend: { display: false },
                              datalabels: {
                                  color: '#1e40af', anchor: 'end', align: 'right', font: { weight: 'bold', size: 11 },
                                  formatter: (v) => v + ' phần'
                              }
                          } 
                      }} />
                  ) : <div style={{textAlign:'center', marginTop:'100px', color:'var(--text-secondary)'}}>Không có dữ liệu</div>}
              </div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>TOP 10 NGUYÊN LIỆU TIÊU HAO NHIỀU NHẤT</h4>
              <div style={{ height: '320px', width: '100%' }}>
                  {reportData.totalIngredientsList.length > 0 ? (
                      <Bar data={topIngredientsChartData} options={{ 
                          maintainAspectRatio: false, 
                          indexAxis: 'y', 
                          layout: { padding: { right: 40 } },
                          plugins: { 
                              legend: { display: false },
                              datalabels: {
                                  color: '#991b1b', anchor: 'end', align: 'right', font: { weight: 'bold', size: 11 },
                                  formatter: (v) => v
                              }
                          } 
                      }} />
                  ) : <div style={{textAlign:'center', marginTop:'100px', color:'var(--text-secondary)'}}>Không có dữ liệu</div>}
              </div>
          </div>
      </div>


      <div className="glass-panel" style={{ padding: '24px', borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <h4 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <PieIcon size={18} color="var(--primary)" /> BÁO CÁO TỔNG HỢP: HIỆU QUẢ MENU SẢN PHẨM KHÁI QUÁT
             </h4>
          </div>
              <SmartTable
                 columns={productCols}
                 data={reportData.totalProductsList}
                 idKey="id"
                 storageKey="report_products"
                 defaultItemsPerPage={20}
                 tableMinWidth="1000px"
                 onView={(row) => handleOpenDetailModal(row, 'product')}
              />
      </div>

      <div className="glass-panel" style={{ padding: '24px', borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <h4 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <TrendingDown size={18} color="var(--primary)" /> BÁO CÁO TỔNG HỢP: TIÊU HAO & THẶNG DƯ NGUYÊN LIỆU KHÁI QUÁT
             </h4>
          </div>
              <SmartTable
                 columns={ingredientCols}
                 data={reportData.totalIngredientsList}
                 idKey="id"
                 storageKey="report_ingredients"
                 defaultItemsPerPage={20}
                 tableMinWidth="1000px"
                 onView={(row) => handleOpenDetailModal(row, 'ingredient')}
              />
      </div>

      <ReportDetailModal 
         isOpen={!!detailModalItem} 
         onClose={() => setDetailModalItem(null)} 
         data={detailModalItem} 
         contextTitle={detailModalTitle} 
      />
    </div>
  );
};

export default BusinessReports;
