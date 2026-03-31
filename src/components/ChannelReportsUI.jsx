import React from 'react';
import { Calendar, Download, Globe, Filter } from 'lucide-react';
import { formatMoney } from '../utils/formatter';
import SmartTable from '../components/SmartTable';

const ChannelReportsUI = ({
  filterDate,
  setFilterDate,
  datePreset,
  handlePresetChange,
  timeTab,
  setTimeTab,
  reportData
}) => {
  if (!reportData) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu báo cáo...</div>;

  const channelCols = [
      { key: 'name', label: 'Tên Kênh', sortable: true, render: (v) => <div style={{fontWeight: 600}}>{v}</div> },
      { key: 'orders', label: 'Số Đơn', sortable: true, align: 'center', sum: true, render: (v) => <div style={{fontWeight: 800}}>{v}</div> },
      { key: 'revenue', label: 'Doanh Thu Thuần', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v) => (
          <div><span style={{fontWeight: 700}}>{formatMoney(v)} đ</span><br/><span style={{fontSize:'11px', color:'var(--text-secondary)'}}>100% Doanh Thu</span></div>
      )},
      { key: 'cogs', label: 'Giá Vốn (COGS)', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v, o) => (
          <div style={{color:'var(--danger)'}}><span>{formatMoney(v)} đ</span><br/><span style={{fontSize:'11px'}}>{o.revenue ? (v/o.revenue*100).toFixed(1) : 0}%</span></div>
      )},
      { key: 'fee', label: 'Phí Sàn (App)', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v, o) => (
          <div style={{color:'var(--warning)'}}><span>{formatMoney(v)} đ</span><br/><span style={{fontSize:'11px'}}>{o.revenue ? (v/o.revenue*100).toFixed(1) : 0}%</span></div>
      )},
      { key: 'opex', label: 'Phí Vận Hành', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v, o) => (
          <div style={{color:'var(--warning)'}}><span>{formatMoney(v)} đ</span><br/><span style={{fontSize:'11px'}}>{o.revenue ? (v/o.revenue*100).toFixed(1) : 0}%</span></div>
      )},
      { key: 'profit', label: 'Lợi Nhuận Ròng', sortable: true, align: 'right', sum: true, sumSuffix: ' đ', render: (v, o) => (
          <div style={{color:'var(--success)'}}><span style={{fontWeight: 800}}>{formatMoney(v)} đ</span><br/><span style={{fontSize:'11px', padding:'2px 6px', background:'var(--surface-color)', borderRadius:'4px'}}>{o.margin.toFixed(1)}% Biên</span></div>
      )}
  ];

  const timeSeriesCols = [
      { key: 'label', label: 'Mốc T.Gian', sortable: true, width: '130px', render: (v) => <div style={{fontWeight: 600}}>{v}</div> },
      { key: 'tot_orders', label: 'Đơn (TỔNG)', align: 'center', sum: true, sumFunc: (row) => row.total.orders, render: (_, o) => <div style={{fontWeight: 800}}>{o.total.orders}</div> },
      { key: 'tot_revenue', label: 'D.Thu (TỔNG)', align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.total.revenue, render: (_, o) => (
          <div style={{color:'var(--primary)', fontWeight:600}}>{formatMoney(o.total.revenue)}</div>
      )},
      { key: 'tot_profit', label: 'L.Nhuận (TỔNG)', align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.total.profit, render: (_, o) => (
          <div style={{color:'var(--success)', fontWeight:700}}>{formatMoney(o.total.profit)}<br/><span style={{fontSize:'10px', color:'var(--text-secondary)'}}>{o.total.revenue ? (o.total.profit/o.total.revenue*100).toFixed(0):0}% Biên</span></div>
      )},
      ...reportData.channels.flatMap(ch => [
          { key: `ch_${ch.name}_orders`, label: `Đơn (${ch.name})`, align: 'center', sum: true, sumFunc: (row) => row.channels[ch.name]?.orders || 0, render: (_, o) => {
              const chData = o.channels[ch.name];
              if (!chData) return <div style={{color:'var(--text-secondary)'}}>-</div>;
              return <div style={{fontWeight: 'bold'}}>{chData.orders}</div>;
          }},
          { key: `ch_${ch.name}_revenue`, label: `D.Thu (${ch.name})`, align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.channels[ch.name]?.revenue || 0, render: (_, o) => {
              const chData = o.channels[ch.name];
              if (!chData) return <div style={{color:'var(--text-secondary)'}}>-</div>;
              return <div style={{fontWeight: 500}}>{formatMoney(chData.revenue)}</div>;
          }},
          { key: `ch_${ch.name}_profit`, label: `L.Nhuận (${ch.name})`, align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.channels[ch.name]?.profit || 0, render: (_, o) => {
              const chData = o.channels[ch.name];
              if (!chData) return <div style={{color:'var(--text-secondary)'}}>-</div>;
              return <div style={{color:'var(--success)', fontWeight:700, fontSize:'13px'}}>{formatMoney(chData.profit)}<br/><span style={{fontSize:'10px', color:'var(--text-secondary)'}}>{chData.revenue ? (chData.profit/chData.revenue*100).toFixed(0):0}% Biên</span></div>;
          }}
      ])
  ];

  const pivotProductCols = [
      { key: 'name', label: 'Tên Món Chuẩn', sortable: true, width: '200px', render: (v, o) => (
          <div>
            <div style={{fontWeight: 600}}>{v}</div>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>(Đơn giá: {formatMoney(o.basePrice)} | G.V: {formatMoney(o.unitCost)})</span>
          </div>
      )},
      { key: 'tot_qty', label: 'SL (TỔNG)', align: 'center', sum: true, sumFunc: (row) => row.total.qty, render: (_, o) => <div style={{fontWeight: 800}}>{Math.round(o.total.qty * 10)/10}</div> },
      { key: 'tot_revenue', label: 'D.Thu (TỔNG)', align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.total.revenue, render: (_, o) => (
          <div style={{color:'var(--primary)', fontWeight:600}}>{formatMoney(o.total.revenue)}</div>
      )},
      { key: 'tot_cogs', label: 'G.Vốn (TỔNG)', align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.total.cogs, render: (_, o) => (
          <div style={{color:'var(--danger)'}}>{formatMoney(o.total.cogs)}</div>
      )},
      { key: 'tot_profit', label: 'L.Nhuận (TỔNG)', align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.total.profit, render: (_, o) => (
          <div style={{color:'var(--success)', fontWeight:700}}>{formatMoney(o.total.profit)}<br/><span style={{fontSize:'10px'}}>{o.total.revenue ? (o.total.profit/o.total.revenue*100).toFixed(0):0}% Biên</span></div>
      )},
      ...reportData.channels.flatMap(ch => [
          { key: `ch_${ch.name}_qty`, label: `SL (${ch.name})`, align: 'center', sum: true, sumFunc: (row) => row.channels[ch.name]?.qty || 0, render: (_, o) => {
              const chData = o.channels[ch.name];
              if (!chData) return <div style={{color:'var(--text-secondary)'}}>-</div>;
              return <div style={{fontWeight: 'bold'}}>{Math.round(chData.qty * 10)/10}</div>;
          }},
          { key: `ch_${ch.name}_revenue`, label: `D.Thu (${ch.name})`, align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.channels[ch.name]?.revenue || 0, render: (_, o) => {
              const chData = o.channels[ch.name];
              if (!chData) return <div style={{color:'var(--text-secondary)'}}>-</div>;
              return <div style={{fontWeight: 500}}>{formatMoney(chData.revenue)}</div>;
          }},
          { key: `ch_${ch.name}_profit`, label: `L.Nhuận (${ch.name})`, align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.channels[ch.name]?.profit || 0, render: (_, o) => {
              const chData = o.channels[ch.name];
              if (!chData) return <div style={{color:'var(--text-secondary)'}}>-</div>;
              return <div style={{color:'var(--success)', fontWeight:700, fontSize:'13px'}}>{formatMoney(chData.profit)}<br/><span style={{fontSize:'10px'}}>{chData.revenue ? (chData.profit/chData.revenue*100).toFixed(0):0}% Biên</span></div>;
          }}
      ])
  ];

  const getIngredientCols = (chAttrRev) => [
      { key: 'name', label: 'Tên Nguyên Liệu', sortable: true, render: (v) => <div style={{fontWeight: 600}}>{v}</div> },
      { key: 'qty', label: 'Sử Dụng', align: 'center', sum: true, render: (v, o) => <div><span style={{fontWeight: 800}}>{Math.round(v * 10) / 10}</span> <span style={{fontSize:'12px', color:'var(--text-secondary)'}}>{o.unit}</span></div> },
      { key: 'attributedRevenue', label: 'Doanh Thu', align: 'right', sum: true, sumSuffix: ' đ', render: (v) => <div style={{color:'var(--primary)', fontWeight:600}}>{formatMoney(v)}<br/><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{chAttrRev ? (v / chAttrRev * 100).toFixed(1) : 0}% DTT Kênh</span></div> },
      { key: 'totalCost', label: 'Chi Phí Vốn', align: 'right', sum: true, sumSuffix: ' đ', render: (v, o) => <div style={{color:'var(--danger)', fontWeight:600}}>{formatMoney(v)}<br/><span style={{ fontSize: '11px' }}>{o.attributedRevenue ? (v / o.attributedRevenue * 100).toFixed(1) : 0}%</span></div> },
      { key: 'totalAttachedFees', label: 'Tổng Phí (Sàn+VH)', align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.fee + row.opex, render: (_, o) => {
          const totalAttachedFees = o.fee + o.opex;
          return <div style={{color:'var(--warning)', fontWeight:600}}>{formatMoney(totalAttachedFees)}<br/><span style={{ fontSize: '11px' }}>{o.attributedRevenue ? (totalAttachedFees / o.attributedRevenue * 100).toFixed(1) : 0}%</span></div>
      }},
      { key: 'profit', label: 'Lợi Nhuận', align: 'right', sum: true, sumSuffix: ' đ', sumFunc: (row) => row.attributedRevenue - row.totalCost - (row.fee + row.opex), render: (_, o) => {
          const itemProfit = o.attributedRevenue - o.totalCost - (o.fee + o.opex);
          return <div style={{color:'var(--success)', fontWeight:800}}>{formatMoney(itemProfit)}<br/><span style={{ fontSize: '11px' }}>{o.attributedRevenue ? (itemProfit / o.attributedRevenue * 100).toFixed(1) : 0}%</span></div>
      }}
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Globe color="var(--primary)" /> Báo Cáo Kênh Bán Hàng
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
             Hiệu năng kinh doanh, tiêu hao nguyên liệu chi tiết cho từng kênh độc lập.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}><Download size={18}/> Xuất Báo Cáo</button>
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
                                padding: '6px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                                background: datePreset === pt ? 'white' : 'transparent',
                                color: datePreset === pt ? 'var(--primary)' : 'var(--text-secondary)',
                                boxShadow: datePreset === pt ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                             }}>
                        {names[pt]}
                    </button>
                 );
             })}
             <button onClick={() => setDatePreset('custom')}
                 style={{ 
                    padding: '6px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Globe size={18} color="var(--primary)" /> HIỆU QUẢ P&L TỔNG QUAN CÁC KÊNH
              </h4>
              <SmartTable
                 columns={channelCols}
                 data={reportData.channels}
                 idKey="id"
                 storageKey="channel_overview_report"
                 defaultItemsPerPage={20}
                 tableMinWidth="900px"
              />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                <h3 style={{ margin: '0 0 8px 0', borderBottom: '2px solid var(--surface-border)', paddingBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} /> PHÂN TÍCH NHỊP ĐỘ ĐƠN BÁN Theo THỜI GIAN</span>
                    <div style={{ display: 'flex', background: 'var(--surface-color)', padding: '4px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                        {[{id: 'day', label: 'Theo Ngày'}, {id: 'week', label: 'Theo Tuần'}, {id: 'month', label: 'Theo Tháng'}, {id: 'year', label: 'Theo Năm'}].map(tab => (
                            <button key={tab.id} onClick={() => setTimeTab(tab.id)}
                                style={{
                                    padding: '6px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                                    background: timeTab === tab.id ? 'white' : 'transparent',
                                    color: timeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                                    boxShadow: timeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </h3>
                <div className="glass-panel" style={{ padding: '0', overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                    <SmartTable
                        columns={timeSeriesCols}
                        data={reportData.timeSeries[timeTab]}
                        idKey="label"
                        storageKey="channel_timeseries_report"
                        defaultItemsPerPage={20}
                        tableMinWidth="1200px"
                    />
                </div>

                <h3 style={{ margin: '0 0 8px 0', borderBottom: '2px solid var(--surface-border)', paddingBottom: '12px' }}>📦 MA TRẬN HIỆU QUẢ CẤU THÀNH GIÁ TỪNG MÓN (PIVOT ĐA KÊNH)</h3>
                <div className="glass-panel" style={{ padding: '0', overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                    <SmartTable
                        columns={pivotProductCols}
                        data={reportData.pivotProductsArray}
                        idKey="id"
                        storageKey="channel_pivot_products_report"
                        defaultItemsPerPage={50}
                        tableMinWidth="1200px"
                    />
                </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ margin: '0 0 8px 0', borderBottom: '2px dashed var(--surface-border)', paddingBottom: '12px', paddingTop: '24px' }}>🥩 PHÂN RÃ CHI TIẾT NGUYÊN LIỆU ĐÃ TIÊU HAO THEO CHUỖI</h3>
                {Object.entries(reportData.ingredientsByChannel).map(([chName, items]) => {
                    const chCost = items.reduce((s, i) => s + i.totalCost, 0);
                    const chAttrRev = items.reduce((s, i) => s + i.attributedRevenue, 0);
                    const chTotalFees = items.reduce((s, i) => s + i.fee + i.opex, 0);
                    const chProfit = chAttrRev - chCost - chTotalFees;

                    return (
                    <div key={chName} className="glass-panel" style={{ padding: '24px' }}>
                        <div style={{ marginBottom: '16px' }}>
                           <h4 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                               Khấu Trừ Kho & Thặng Dư từ: <span style={{color: 'var(--primary)', fontWeight: 'bold'}}>{chName}</span>
                           </h4>
                        </div>
                        <SmartTable
                            columns={getIngredientCols(chAttrRev)}
                            data={items}
                            idKey="id"
                            storageKey={`channel_ingredient_report_${chName}`}
                            defaultItemsPerPage={20}
                            tableMinWidth="1000px"
                        />
                    </div>
                    );
                })}
             </div>
          </div>
      </div>
    </div>
  );
};

export default ChannelReportsUI;
