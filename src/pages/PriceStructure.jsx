import React, { useState, useMemo } from 'react';
import { BarChart3, PieChart as PieIcon, TrendingUp, Info, Globe, Percent, DollarSign, Settings, Copy, CheckCircle } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useProducts } from '../hooks/useProducts';
import { useInventory } from '../hooks/useInventory';
import { useSalesChannels } from '../hooks/useSalesChannels';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut, Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { toBlob, toPng } from 'html-to-image';
import { formatMoney } from '../utils/formatter';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const PriceStructure = () => {
  const { dispatch } = useData();
  const { activeProducts } = useProducts();
  const { activeIngredients } = useInventory();
  const { activeSalesChannels } = useSalesChannels();
  const [opexPerDish, setOpexPerDish] = useState(5000);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'list'
  const [copyingId, setCopyingId] = useState(null);

  const handleCopyImage = async (id, pName) => {
      setCopyingId(id);
      const element = document.getElementById("product-chart-" + id);
      if (!element) return;
      
      const filterFn = (node) => {
          // Bỏ qua thẻ HTML của nút copy để nó không lọt vào trong ảnh chụp
          return node.id !== `copy-btn-${id}`;
      };

      try {
         const blob = await toBlob(element, { filter: filterFn, backgroundColor: '#ffffff', style: { transform: 'scale(1)', margin: '0' }});
         if (blob) {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            dispatch({ type: 'SHOW_TOAST', payload: { message: `Đã copy ảnh món [${pName}], dán (Ctrl+V) vào Zalo/Mesenger!`, type: 'success' } });
         }
      } catch (e) {
         console.error(e);
         // Fallback download if clipboard fails
         try {
             const dataUrl = await toPng(element, { filter: filterFn, backgroundColor: '#ffffff', style: { transform: 'scale(1)', margin: '0' }});
             const link = document.createElement('a');
             link.download = `Cau-Truc-Gia-${pName}.png`;
             link.href = dataUrl;
             link.click();
             dispatch({ type: 'SHOW_TOAST', payload: { message: `Do không copy được trực tiếp. Đã tự động đổi sang TẢI VỀ ẢNH!`, type: 'info' } });
         } catch (err2) {
             alert('Lỗi tạo ảnh: ' + err2.message);
         }
      } finally {
         setCopyingId(null);
      }
  };

  React.useEffect(() => {
    if (activeSalesChannels?.length > 0 && !selectedChannelId) {
      setSelectedChannelId(activeSalesChannels[0].id);
    }
  }, [activeSalesChannels, selectedChannelId]);

  const productMetrics = useMemo(() => {
    const getCostBreakdown = (recipe) => {
      let breakdown = {};
      let total = 0;

      const addCategoryCost = (cat, cost) => {
        if (!breakdown[cat]) breakdown[cat] = 0;
        breakdown[cat] += cost;
        total += cost;
      };

      if (!recipe || recipe.length === 0) return { total, breakdown };

      recipe.forEach(item => {
        const subProd = activeProducts.find(p => p.id === item.ingredientId);
        if (subProd) {
          const subQty = item.unitMode === 'divide' ? (1/item.qty) : item.qty;
          const subResult = getCostBreakdown(subProd.recipe);
          Object.keys(subResult.breakdown).forEach(cat => {
             addCategoryCost(cat, subResult.breakdown[cat] * subQty);
          });
          return;
        }

        const ing = activeIngredients.find(i => i.id === item.ingredientId);
        if (ing) {
          let baseQty = item.qty;
          if (item.unitMode === 'buy') baseQty = item.qty * (ing.conversionRate || 1);
          if (item.unitMode === 'divide') baseQty = 1/item.qty;
          const cost = baseQty * (ing.cost || 0);
          const catName = ing.category || 'Khác';
          addCategoryCost(catName, cost);
        }
      });
      return { total, breakdown };
    };

    return activeProducts.map(p => {
      const costData = getCostBreakdown(p.recipe);
      const cogs = costData.total;
      const cogsBreakdown = costData.breakdown;
      
      const channelMetrics = {};
      let avgNetProfit = 0;
      let totalChannels = 0;

      activeSalesChannels.forEach(c => {
         const feeRate = c.commission ?? c.discountRate ?? 0;
         const channelFee = p.price * feeRate / 100;
         const netRevenue = p.price - channelFee;
         const grossProfit = netRevenue - cogs;
         const netProfit = grossProfit - opexPerDish;
         const netMargin = p.price > 0 ? (netProfit / p.price) * 100 : 0;
         
         channelMetrics[c.id] = { feeRate, channelFee, netRevenue, netProfit, netMargin };
         avgNetProfit += netProfit;
         totalChannels++;
      });
      
      avgNetProfit = totalChannels > 0 ? avgNetProfit / totalChannels : 0;
      
      return { ...p, cogs, cogsBreakdown, channelMetrics, avgNetProfit };
    }).sort((a, b) => b.avgNetProfit - a.avgNetProfit);
  }, [activeProducts, activeIngredients, activeSalesChannels, opexPerDish]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '40px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp color="var(--primary)" /> Ma Trận Cấu Trúc Giá & Lợi Nhuận Menu
          </h2>
          <p className="hide-on-landscape" style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Đánh giá biên lợi nhuận ròng của từng món ăn trên các kênh bán hàng song song.</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings size={20} color="var(--primary)" />
            <span style={{ fontWeight: 600 }}>Chi Phí Vận Hành Cố Định (OPEX)/Món:</span>
            <input aria-label="Chi phí vận hành giả định" type="number" className="form-control" style={{ width: '120px' }} value={opexPerDish} onChange={e => setOpexPerDish(Number(e.target.value))} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>(Điện, nước, bao bì, lương...)</span>
         </div>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflowX: 'auto' }}>
         <div className="table-responsive">
            <table style={{ width: '100%', minWidth: '1000px', borderCollapse: 'collapse' }}>
               <thead>
                  <tr style={{ background: '#F8FAFC', textAlign: 'left', borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                     <th rowSpan="2" style={{ padding: '16px 12px', borderRight: '2px solid var(--surface-border)', borderBottom: '1px solid var(--surface-border)' }}>Sản Phẩm (Menu)</th>
                     <th rowSpan="2" style={{ padding: '16px 12px', textAlign: 'right', borderBottom: '1px solid var(--surface-border)' }}>Giá Bán Cơ Sở</th>
                     <th rowSpan="2" style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--danger)', borderBottom: '1px solid var(--surface-border)' }}>Giá Vốn (COGS)</th>
                     <th rowSpan="2" style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--warning)', borderRight: '2px solid var(--surface-border)', borderBottom: '1px solid var(--surface-border)' }}>Phí Vận Hành</th>
                     {activeSalesChannels.map(c => (
                         <th key={c.id} colSpan="2" style={{ padding: '12px', textAlign: 'center', borderRight: '2px solid var(--surface-border)', borderBottom: '1px solid var(--surface-border)', background: 'rgba(59, 130, 246, 0.04)' }}>{c.name.toUpperCase()}</th>
                     ))}
                  </tr>
                  <tr>
                     {activeSalesChannels.map(c => (
                        <React.Fragment key={`sub-${c.id}`}>
                           <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', color: 'var(--warning)', borderBottom: '1px solid var(--surface-border)', background: 'rgba(59, 130, 246, 0.04)' }}>Phí Sàn ({c.commission ?? c.discountRate ?? 0}%)</th>
                           <th style={{ padding: '12px', textAlign: 'right', fontSize: '11px', color: 'var(--success)', borderRight: '2px solid var(--surface-border)', borderBottom: '1px solid var(--surface-border)', background: 'rgba(34, 197, 94, 0.08)' }}>LỢI NHUẬN RÒNG</th>
                        </React.Fragment>
                     ))}
                  </tr>
               </thead>
               <tbody>
                  {productMetrics.map(p => (
                     <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="hover-row">
                        <td style={{ padding: '16px 12px', fontWeight: 600, borderRight: '2px solid var(--surface-border)' }}>{p.name}</td>
                        <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 700 }}>{formatMoney(p.price)} đ</td>
                        <td style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--danger)', fontWeight: 600 }}>
                           <div style={{ fontSize: '14px' }}>-{formatMoney(p.cogs)} đ</div>
                           <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Tỷ trọng: <span style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>{p.price > 0 ? (p.cogs / p.price * 100).toFixed(1) : 0}%</span></div>
                        </td>
                        <td style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--warning)', fontWeight: 600, borderRight: '2px solid var(--surface-border)' }}>
                           <div style={{ fontSize: '14px' }}>-{formatMoney(opexPerDish)} đ</div>
                           <div style={{ fontSize: '11px', fontWeight: 'bold' }}>Tỷ trọng: <span style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>{p.price > 0 ? (opexPerDish / p.price * 100).toFixed(1) : 0}%</span></div>
                        </td>
                        
                        {activeSalesChannels.map(c => {
                            const cm = p.channelMetrics[c.id];
                            return (
                               <React.Fragment key={c.id}>
                                  <td style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--warning)', background: 'rgba(59, 130, 246, 0.01)' }}>
                                     <div style={{ fontSize: '14px', fontWeight: 600 }}>-{formatMoney(cm.channelFee)} đ</div>
                                     <div style={{ fontSize: '11px', fontWeight: 'bold' }}>App thu: <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '2px 4px', borderRadius: '4px' }}>{cm.feeRate}%</span></div>
                                  </td>
                                  <td style={{ padding: '16px 12px', textAlign: 'right', color: cm.netProfit > 0 ? 'var(--success)' : 'var(--danger)', borderRight: '2px solid var(--surface-border)', background: cm.netProfit > 0 ? 'rgba(34, 197, 94, 0.03)' : 'rgba(239, 68, 68, 0.03)' }}>
                                     <strong style={{ fontSize: '15px' }}>{cm.netProfit > 0 ? '+' : ''}{formatMoney(cm.netProfit)} đ</strong><br/>
                                     <span style={{ fontSize: '11px' }}>{cm.netMargin.toFixed(1)}% Biên Lãi</span>
                                  </td>
                               </React.Fragment>
                            )
                        })}
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* BIỂU ĐỒ PHÂN TÍCH TỶ TRỌNG CHI PHÍ & LỢI NHUẬN TỪNG MÓN */}
      {selectedChannelId && (
          <div className="glass-panel" style={{ padding: '24px', borderTop: '4px solid var(--primary)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PieIcon size={18} color="var(--primary)" /> PHÂN TÍCH TỶ TRỌNG CHI PHÍ & LỢI NHUẬN TỪNG MÓN
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', background: 'var(--surface-variant)', borderRadius: '8px', padding: '4px', border: '1px solid var(--surface-border)' }}>
                       <button className={`btn ${viewMode === 'chart' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('chart')} style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}>Sơ Đồ Trực Quan</button>
                       <button className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('list')} style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}>Bảng Kê Chi Tiết</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                       <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>KÊNH BÁN:</span>
                   <select 
                      className="form-control" 
                      style={{ padding: '8px 16px', minWidth: '180px', fontWeight: 'bold', color: 'var(--primary)', cursor: 'pointer' }}
                      value={selectedChannelId} 
                      onChange={e => setSelectedChannelId(e.target.value)}
                   >
                      {activeSalesChannels.map(c => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                   </select>
                </div>
             </div>
          </div>

              {viewMode === 'chart' ? (
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {productMetrics.map(p => {
                    const cm = p.channelMetrics[selectedChannelId];
                    if (!cm) return null;

                    const cogsCategories = Object.keys(p.cogsBreakdown || {}).sort((a,b) => p.cogsBreakdown[b] - p.cogsBreakdown[a]);
                    const costLabels = cogsCategories.map(k => `Vốn (${k})`);
                    const costDataVals = cogsCategories.map(k => p.cogsBreakdown[k]);
                    
                    const rawBreakdownColors = ['#EF4444', '#EC4899', '#D946EF', '#06b6d4', '#F43F5E', '#BE185D', '#9D174D'];
                    const cogsColors = costLabels.map((_, i) => rawBreakdownColors[i % rawBreakdownColors.length]);

                    const chartData = {
                        labels: [...costLabels, 'Vận Hành (OPEX)', 'Phí Sàn', 'Lợi Nhuận Ròng'],
                        datasets: [{
                            data: [...costDataVals, opexPerDish, cm.channelFee, Math.max(0, cm.netProfit)],
                            backgroundColor: [...cogsColors, '#F59E0B', '#3B82F6', '#10B981'],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    };

                    const hasProfit = cm.netProfit > 0;

                    return (
                        <div id={`product-chart-${p.id}`} key={p.id} style={{ background: 'var(--surface-color)', padding: '20px', borderRadius: '16px', border: '1px solid var(--surface-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' }}>
                               <h5 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.4' }}>{p.name}</h5>
                               <button 
                                  id={`copy-btn-${p.id}`}
                                  onClick={() => handleCopyImage(p.id, p.name)}
                                  disabled={copyingId === p.id}
                                  style={{ flexShrink: 0, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 4px rgba(59,130,246,0.3)', transition: '0.2s', opacity: copyingId === p.id ? 0.7 : 1 }}
                                  title="Copy ảnh này để gửi"
                               >
                                  {copyingId === p.id ? <CheckCircle size={14} /> : <Copy size={14} />} 
                                  {copyingId === p.id ? 'Đang Xử Lý...' : 'Copy Ảnh'}
                               </button>
                           </div>
                           
                           <div style={{ position: 'relative', height: '280px', marginBottom: '20px' }}>
                              <Doughnut 
                                 data={chartData} 
                                 options={{ 
                                    maintainAspectRatio: false, 
                                    cutout: '50%',
                                    plugins: { 
                                       legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 10 } } },
                                       datalabels: {
                                          color: '#ffffff',
                                          font: { weight: 'bold', size: 10, family: 'Inter, sans-serif' },
                                          textShadowColor: 'rgba(0,0,0,0.8)',
                                          textShadowBlur: 4,
                                          formatter: (value, context) => {
                                             if (value <= 0) return null;
                                             const total = context.chart.data.datasets[0].data.reduce((a,b) => a + Math.max(0, b), 0);
                                             if (total === 0) return null;
                                             const percentage = (value / total * 100).toFixed(1);
                                             if (percentage < 4) return null; // Hide labels for tiny slices
                                             
                                             const rawLabel = context.chart.data.labels[context.dataIndex];
                                             let shortLabel = rawLabel;
                                             if (rawLabel.includes('Vốn (')) shortLabel = rawLabel.replace('Vốn (', '').replace(')', '');
                                             if (rawLabel === 'Giá Vốn (COGS)') shortLabel = 'Vốn';
                                             if (rawLabel.includes('OPEX')) shortLabel = 'Vận hành';
                                             if (rawLabel.includes('Phí Sàn')) shortLabel = 'Phí Sàn';
                                             if (rawLabel.includes('Ròng')) shortLabel = 'Lãi Ròng';
                                             
                                             return `${shortLabel}\n${percentage}%`;
                                          },
                                       }
                                    } 
                                 }} 
                              />
                              {!hasProfit ? (
                                  <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(239, 68, 68, 0.95)', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(239,68,68,0.4)' }}>
                                      LỖ/HÒA
                                  </div>
                              ) : (
                                  <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Biên Lãi</div>
                                      <div style={{ fontSize: '15px', color: 'var(--success)', fontWeight: 800 }}>{cm.netMargin.toFixed(1)}%</div>
                                  </div>
                              )}
                           </div>
                           <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderBottom: '1px dashed var(--surface-border)', paddingBottom: '6px' }}>
                                 <span style={{color: 'var(--text-secondary)'}}>Giá Bán Khách Trả</span>
                                 <span style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{formatMoney(p.price)} đ</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 500 }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#EF4444' }}/> Tổng Giá Vốn</span>
                                 <span style={{ color: 'var(--danger)', fontWeight: 600 }}>-{formatMoney(p.cogs)} đ <span style={{ opacity: 0.6, fontSize: '11px', display: 'inline-block', width: '36px', textAlign: 'right' }}>{p.price ? (p.cogs / p.price * 100).toFixed(0) : 0}%</span></span>
                              </div>
                              {cogsCategories.map((cat, i) => (
                                 <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '18px', fontSize: '12px', marginTop: '-4px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cogsColors[i] }}/> Vốn {cat}</span>
                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>-{formatMoney(p.cogsBreakdown[cat])} đ</span>
                                 </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                 <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 500 }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#F59E0B' }}/> Vận Hành (OPEX)</span>
                                 <span style={{ color: 'var(--warning)', fontWeight: 600 }}>-{formatMoney(opexPerDish)} đ <span style={{ opacity: 0.6, fontSize: '11px', display: 'inline-block', width: '36px', textAlign: 'right' }}>{p.price ? (opexPerDish / p.price * 100).toFixed(0) : 0}%</span></span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                 <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontWeight: 500 }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#3B82F6' }}/> Phí Sàn Thu ({cm.feeRate}%)</span>
                                 <span style={{ color: 'var(--primary)', fontWeight: 600 }}>-{formatMoney(cm.channelFee)} đ <span style={{ opacity: 0.6, fontSize: '11px', display: 'inline-block', width: '36px', textAlign: 'right' }}>{p.price ? (cm.channelFee / p.price * 100).toFixed(0) : 0}%</span></span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: '4px', paddingTop: '10px', borderTop: '2px solid var(--surface-border)', alignItems: 'center' }}>
                                 <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10B981' }}/> THỰC LÃI</span>
                                 <span style={{ color: hasProfit ? 'var(--success)' : 'var(--danger)', fontSize: '14px' }}>
                                    {hasProfit ? '+' : ''}{formatMoney(cm.netProfit)} đ <span style={{ opacity: 0.9, fontSize: '11px', display: 'inline-block', width: '36px', textAlign: 'right' }}>{cm.netMargin.toFixed(0)}%</span>
                                 </span>
                              </div>
                           </div>
                        </div>
                    );
                })}
             </div>
             ) : (
                <div className="table-responsive" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                   <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                      <thead>
                         <tr style={{ borderBottom: '2px solid #cbd5e1', background: '#f8fafc', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '16px 12px' }}>Sản Phẩm (Menu)</th>
                            <th style={{ padding: '16px 12px', textAlign: 'right' }}>Giá Bán Khách Trả</th>
                            <th style={{ padding: '16px 12px', textAlign: 'left', borderLeft: '1px dotted #cbd5e1' }}>Chi Tiết Cấu Thành Giá Vốn (COGS)</th>
                            <th style={{ padding: '16px 12px', textAlign: 'right' }}>Vận Hành (OPEX)</th>
                            <th style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--primary)' }}>Phí Sàn ({(() => { const ch = activeSalesChannels.find(c => c.id === selectedChannelId); return ch?.commission ?? ch?.discountRate ?? 0; })()}%)</th>
                            <th style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--success)' }}>Lãi Ròng</th>
                         </tr>
                      </thead>
                      <tbody>
                         {productMetrics.map(p => {
                             const cm = p.channelMetrics[selectedChannelId];
                             if (!cm) return null;
                             const cogsCategories = Object.keys(p.cogsBreakdown || {}).sort((a,b) => p.cogsBreakdown[b] - p.cogsBreakdown[a]);
                             
                             return (
                                 <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }} className="hover-row">
                                    <td style={{ padding: '16px 12px', fontWeight: 600, fontSize: '14px', verticalAlign: 'top' }}>{p.name}</td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--primary)', verticalAlign: 'top' }}>{formatMoney(p.price)} đ</td>
                                    <td style={{ padding: '16px 12px', verticalAlign: 'top', borderLeft: '1px dotted #cbd5e1' }}>
                                       <div style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: '8px' }}>Tổng: {formatMoney(p.cogs)} đ <span style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', marginLeft: '6px' }}>{p.price > 0 ? (p.cogs/p.price * 100).toFixed(0) : 0}%</span></div>
                                       <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                       {cogsCategories.map(cat => (
                                          <div key={cat} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', width: '220px' }}>
                                             <span>- Vốn {cat}</span>
                                             <span>{formatMoney(p.cogsBreakdown[cat])} đ</span>
                                          </div>
                                       ))}
                                       </div>
                                    </td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--warning)', fontWeight: 600, verticalAlign: 'top' }}>
                                       {formatMoney(opexPerDish)} đ <br/>
                                       <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>{p.price > 0 ? (opexPerDish/p.price*100).toFixed(0) : 0}%</span>
                                    </td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--primary)', fontWeight: 600, verticalAlign: 'top' }}>
                                       {formatMoney(cm.channelFee)} đ <br/>
                                       <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>{p.price > 0 ? (cm.channelFee/p.price*100).toFixed(0) : 0}%</span>
                                    </td>
                                    <td style={{ padding: '16px 12px', textAlign: 'right', color: cm.netProfit > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: '15px', verticalAlign: 'top', background: cm.netProfit > 0 ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)' }}>
                                       {formatMoney(cm.netProfit)} đ <br/>
                                       <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{cm.netMargin.toFixed(0)}%</span>
                                    </td>
                                 </tr>
                             )
                         })}
                      </tbody>
                   </table>
                </div>
             )}
          </div>
      )}

    </div>
  );
};

export default PriceStructure;
