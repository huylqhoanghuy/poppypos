import React, { useState, useMemo } from 'react';
import { Package, Search, Edit, Trash2, CheckSquare, Square, AlertCircle, ShoppingCart, Calendar, Focus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useInventoryForecast } from '../hooks/useInventoryForecast';
import { PurchaseApi } from '../services/api/purchaseService';

const InventoryWarning = () => {
    const { state, dispatch } = useData();
    
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    
    // UI states
    const [filterDate, setFilterDate] = useState({ start: firstDay, end: lastDay });
    const [datePreset, setDatePreset] = useState('this_month'); // Default preset
    const [thresholdX, setThresholdX] = useState(5); // Daily orders
    const [forecastDays, setForecastDays] = useState(7); // Days to forecast
    
    // Top N selection
    const [topNLimit, setTopNLimit] = useState(5); // default to 5
    
    const { forecastData, rankedProducts, loading, refreshForecast } = useInventoryForecast(filterDate, thresholdX, forecastDays, topNLimit);

    // Pagination for Ranked Products
    const resetKey = useMemo(() => `${topNLimit}-${rankedProducts.length}`, [topNLimit, rankedProducts.length]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    // Reset page when key changes
    const [prevResetKey, setPrevResetKey] = useState(resetKey);
    if (resetKey !== prevResetKey) {
        setPrevResetKey(resetKey);
        if (currentPage !== 1) setCurrentPage(1);
    }

    const [selectedShortfalls, setSelectedShortfalls] = useState([]);

    const handleDatePresetChange = (e) => {
        const preset = e.target.value;
        setDatePreset(preset);
        
        const now = new Date();
        let start, end;
        
        switch (preset) {
            case 'this_week': {
                const day = now.getDay() || 7; // Convert 0 (Sun) to 7
                const firstDayOfWeek = new Date(now);
                firstDayOfWeek.setDate(now.getDate() - day + 1);
                start = firstDayOfWeek.toISOString().split('T')[0];
                end = new Date(firstDayOfWeek);
                end.setDate(firstDayOfWeek.getDate() + 6);
                end = end.toISOString().split('T')[0];
                break;
            }
            case 'last_week': {
                const day = now.getDay() || 7;
                const lastWeekEnd = new Date(now);
                lastWeekEnd.setDate(now.getDate() - day);
                const lastWeekStart = new Date(lastWeekEnd);
                lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
                
                start = lastWeekStart.toISOString().split('T')[0];
                end = lastWeekEnd.toISOString().split('T')[0];
                break;
            }
            case 'this_month': {
                start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                break;
            }
            case 'last_month': {
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                break;
            }
            case 'custom':
            default:
                return; // Keep existing filterDate
        }
        
        setFilterDate({ start, end });
    };

    const showToast = (message, type = 'success') => {
        dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
    };

    const shortfallItems = forecastData.filter(i => i.shortfall > 0);
    const totalCapitalRequired = shortfallItems.reduce((acc, item) => acc + item.estimatedCost, 0);

    const displayRankedProducts = topNLimit === 'all' ? rankedProducts : rankedProducts.slice(0, Number(topNLimit));
    
    // Pagination Logic
    const totalPages = Math.ceil(displayRankedProducts.length / itemsPerPage);
    const paginatedProducts = displayRankedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="module-container" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
                            <AlertCircle size={22} /> HỆ THỐNG RADAR CẢNH BÁO TỒN KHO
                        </h3>
                        <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Dự báo Kế Hoạch Nhập Hàng Tương Lai dựa trên dữ liệu thật.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={18} color="var(--text-secondary)" />
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '13px' }}>Kỳ lịch sử phân tích:</span>
                            <select className="form-input" value={datePreset} onChange={handleDatePresetChange} style={{ padding: '8px 12px', fontWeight: 600, minWidth: '130px' }}>
                                <option value="this_week">Tuần Này</option>
                                <option value="last_week">Tuần Trước</option>
                                <option value="this_month">Tháng Này</option>
                                <option value="last_month">Tháng Trước</option>
                                <option value="custom">Tùy Chọn Lịch...</option>
                            </select>
                            
                            {datePreset === 'custom' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                                    <input title="Từ ngày" type="date" className="form-input" value={filterDate.start} onChange={e => setFilterDate({...filterDate, start: e.target.value})} style={{ padding: '8px' }} />
                                    <span>-</span>
                                    <input title="Đến ngày" type="date" className="form-input" value={filterDate.end} onChange={e => setFilterDate({...filterDate, end: e.target.value})} style={{ padding: '8px' }} />
                                </div>
                            )}
                        </div>
                        <div style={{ height: '24px', width: '1px', background: 'var(--surface-border)' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Dự báo cho:</span>
                            <select className="form-input" value={forecastDays} onChange={(e) => setForecastDays(Number(e.target.value))} style={{ fontWeight: 700, padding: '8px 12px' }}>
                                <option value={1}>1 Ngày</option>
                                <option value={3}>3 Ngày</option>
                                <option value={7}>1 Tuần (7 ngày)</option>
                                <option value={14}>2 Tuần (14 ngày)</option>
                                <option value={30}>1 Tháng (30 ngày)</option>
                            </select>
                        </div>
                        <div style={{ height: '24px', width: '1px', background: 'var(--surface-border)' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Năng lực (X đơn/ngày):</span>
                            <input type="number" min="1" value={thresholdX} onChange={(e) => setThresholdX(Number(e.target.value))} placeholder="VD: 50" className="form-input" style={{ width: '100px', fontSize: '16px', textAlign: 'center', color: 'var(--primary)', fontWeight: 800, borderColor: 'var(--primary)', padding: '8px 12px' }} />
                        </div>
                        
                        <button className="btn btn-primary" onClick={refreshForecast} disabled={loading} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {loading ? 'Đang Radar...' : <><Search size={18} /> Quét Phân Tích</>}
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(400px, 2fr)', gap: '24px' }}>
                    {/* Danh sách Món Ăn Bảng Xếp Hạng Panel */}
                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid #FECACA', background: '#FEF2F2' }}>
                        <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--danger)', borderBottom: '1px solid #FECACA', paddingBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Focus size={18} /> MỤC TIÊU PHỤC VỤ TRỌNG TÂM
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Chọn số lượng mặt hàng chủ lực đẻ ra doanh thu trong thời gian qua để Radar tính toán định mức nhập liệu chuyên sâu cho chúng.</p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #FCA5A5', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Phân tích: </span>
                                <select className="form-input" value={topNLimit} onChange={e => setTopNLimit(e.target.value === 'all' ? 'all' : Number(e.target.value))} style={{ padding: '6px 12px', fontWeight: 700, color: 'var(--danger)' }}>
                                    <option value={3}>Top 3 Tiêu Điểm</option>
                                    <option value={5}>Top 5 Bán Chạy</option>
                                    <option value={10}>Top 10 Bán Chạy</option>
                                    <option value={15}>Top 15 Bán Chạy</option>
                                    <option value={20}>Top 20 Bán Chạy</option>
                                    <option value="all">Tất cả Thực Đơn</option>
                                </select>
                            </div>
                            
                            {(totalPages > 1 || displayRankedProducts.length > 8) && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <select className="form-input" title="Số dòng hiển thị" style={{ padding: '4px 8px', fontSize: '12px', background: '#FFFFFF' }} value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                                        <option value={8}>8 dòng/tr</option>
                                        <option value={15}>15 dòng/tr</option>
                                        <option value={20}>20 dòng/tr</option>
                                        <option value={9999}>Cuộn 1 Tr</option>
                                    </select>
                                    
                                    {totalPages > 1 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.05)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                            <button className="btn btn-ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '4px 8px', fontSize: '12px', minWidth: 'auto', color: currentPage === 1 ? '#D1D5DB' : 'var(--danger)', border: 'none' }}>&lt;</button>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger)', padding: '0 4px' }}>{currentPage}/{totalPages}</span>
                                            <button className="btn btn-ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '4px 8px', fontSize: '12px', minWidth: 'auto', color: currentPage === totalPages ? '#D1D5DB' : 'var(--danger)', border: 'none' }}>&gt;</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {displayRankedProducts.length === 0 ? (
                            <p style={{ margin: 0, color: 'var(--success)', fontWeight: 600, padding: '20px', textAlign: 'center' }}>Không có số liệu bán hàng trong kỳ.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '350px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                    {paginatedProducts.map((p, idx) => {
                                        const globalRank = (currentPage - 1) * itemsPerPage + idx + 1;
                                        return (
                                            <div key={p.id} style={{ background: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>#{globalRank}. {p.name}</strong>
                                                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--danger)' }}>{p.qty} <span style={{fontSize:'11px', fontWeight: 600}}>lượt</span></span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Câu lệnh cảnh báo Panel */}
                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--surface-border)', paddingBottom: '12px' }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>Kế Hoạch Nhập Bổ Sung Đề Xuất</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>Mục tiêu: {thresholdX} đơn/ngày × {forecastDays} ngày = <strong>{thresholdX * forecastDays} Đơn</strong></p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block' }}>Dự toán nhập hàng:</span>
                                <strong style={{ fontSize: '20px', color: 'var(--primary)' }}>{totalCapitalRequired.toLocaleString('vi-VN')} đ</strong>
                            </div>
                        </div>

                        {shortfallItems.length === 0 ? (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--text-secondary)', padding: '40px' }}>
                                <CheckSquare size={48} color="var(--success)" style={{ opacity: 0.2, marginBottom: '16px' }} />
                                <span>Mọi năng lực cung ứng đều đã đạt chuẩn cho mục tiêu {thresholdX * forecastDays} đơn cho {forecastDays} ngày tới. Cấp độ tồn kho AN TOÀN.</span>
                            </div>
                        ) : (
                            <>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                <thead>
                                <tr style={{ background: 'var(--surface-variant)', color: 'var(--text-secondary)' }}>
                                    <th style={{ padding: '10px', width: '40px', textAlign: 'center' }}>
                                        <div style={{ cursor: 'pointer' }} onClick={() => {
                                            if (selectedShortfalls.length === shortfallItems.length && shortfallItems.length > 0) setSelectedShortfalls([]);
                                            else setSelectedShortfalls(shortfallItems.map(i => i.id));
                                        }}>
                                            {selectedShortfalls.length === shortfallItems.length && shortfallItems.length > 0 ? <CheckSquare size={16} color="var(--primary)"/> : <Square size={16} color="var(--text-secondary)"/>}
                                        </div>
                                    </th>
                                    <th style={{ padding: '10px' }}>Trọng yếu thiếu hụt</th>
                                    <th style={{ padding: '10px' }}>Quy lượng bù (Lô nhập)</th>
                                    <th style={{ padding: '10px', textAlign: 'right' }}>Báo giá dự phòng</th>
                                </tr>
                                </thead>
                                <tbody>
                                {shortfallItems.map(item => {
                                    const isSelected = selectedShortfalls.includes(item.id);
                                    return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-border)', background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}>
                                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                            <div style={{ cursor: 'pointer' }} onClick={() => {
                                                if (isSelected) setSelectedShortfalls(prev => prev.filter(id => id !== item.id));
                                                else setSelectedShortfalls(prev => [...prev, item.id]);
                                            }}>
                                                {isSelected ? <CheckSquare size={16} color="var(--primary)"/> : <Square size={16} color="var(--text-secondary)"/>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                                {item.name}
                                                {item.isTop10Related && <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--primary)', background: 'rgba(59,130,246,0.1)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>Theo Dõi Sát</span>}
                                            </strong>
                                            <span style={{ fontSize: '12px', color: 'var(--danger)', background: '#FEF2F2', padding: '2px 6px', borderRadius: '4px' }}>
                                                Thiếu thực: {item.shortfall.toLocaleString('vi-VN', {maximumFractionDigits:2})} {item.unit}
                                            </span>
                                            {item.isTop10Related && <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>Chuẩn bị cho: {item.relatedProductsArr.slice(0, 3).join(', ')}{item.relatedProductsArr.length > 3 ? '...' : ''}</p>}
                                        </td>
                                        <td style={{ padding: '12px 10px' }}>
                                            <strong style={{ fontSize: '16px', color: 'var(--primary)' }}>+ {item.buyQty}</strong> <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.buyUnit || item.unit}</span>
                                            <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--success)', background: '#F0FDF4', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', fontWeight: 600 }}>
                                                Chuẩn bị cho {thresholdX * forecastDays} Đơn
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            <div style={{ marginBottom: '8px' }}>{item.estimatedCost.toLocaleString('vi-VN')} đ</div>
                                        </td>
                                    </tr>
                                )})}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '16px', padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Nhà Cung Cấp Kế Hoạch Đề Suất:</label>
                                    <select className="form-input" style={{ minWidth: '250px' }} id="autoPosupplier">
                                        <option value="">-- [Thả Tự Do (Nháp)] --</option>
                                        {(state.suppliers || []).filter(s => !s.deleted).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <button disabled={selectedShortfalls.length === 0} className="btn btn-primary" style={{ padding: '14px 24px', fontWeight: 700, fontSize: '15px', opacity: selectedShortfalls.length === 0 ? 0.5 : 1 }} onClick={() => {
                                    const sid = document.getElementById('autoPosupplier').value;
                                    const selectedItemsData = shortfallItems.filter(i => selectedShortfalls.includes(i.id));
                                    const poItems = selectedItemsData.map(item => ({
                                        ingredientId: item.id,
                                        baseQty: item.buyQty * (Number(item.conversionRate) || 1),
                                        cost: item.buyPrice / (Number(item.conversionRate) || 1),
                                        itemTotal: item.estimatedCost
                                    }));
                                    PurchaseApi.add({
                                        supplierId: sid,
                                        items: poItems,
                                        totalAmount: selectedItemsData.reduce((sum, i) => sum + i.estimatedCost, 0),
                                        status: 'Pending',
                                        date: new Date().toISOString()
                                    });
                                    showToast(`Đã phác thảo trình ký kế hoạch Nhập Dự Cấp (${selectedShortfalls.length} món) vào hàng chờ Duyệt Kế Toán!`);
                                    setSelectedShortfalls([]);
                                }}>
                                    <Package size={18} style={{ marginRight: '8px' }}/>
                                    Trình Ký Xét Duyệt ({selectedShortfalls.length})
                                </button>
                            </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryWarning;
