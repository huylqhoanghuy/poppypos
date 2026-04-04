import React from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, ChevronRight, Download, Zap, Database, LayoutTemplate } from 'lucide-react';
import { useImportManager } from '../hooks/useImportManager';
import { useData } from '../context/DataContext';

const ImportData = () => {
    const { dispatch } = useData();
    const {
        state,
        importConfig, setImportConfig,
        previewOrders, setPreviewOrders,
        importableChannels,
        handlePreviewCSV,
        confirmImport,
        handleFileUpload
    } = useImportManager();

    const showToast = (message, type = 'success') => {
        dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', paddingBottom: '16px' }}>
            {!previewOrders ? (
              <div style={{ display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.3s ease-in-out', flex: 1, overflow: 'hidden' }}>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto', paddingBottom: '24px', paddingRight: '8px' }}>
                     <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(16,185,129,0.1))', padding: '16px 24px', borderRadius: '16px', border: '1px solid rgba(59,130,246,0.2)', flexShrink: 0 }}>
                        <h4 style={{ margin: 0, color: 'var(--primary)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                           <Zap size={20} /> Động Cơ Trí Tuệ Kế Toán & Kho Tự Động
                        </h4>
                     </div>

                     <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 1.5fr', gap: '24px', flexShrink: 0 }}>
                        {/* Left Col */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                           <div style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--surface-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', flex: 1 }}>
                              <h4 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 <Database size={18} color="var(--primary)"/> Bước 1: Mục Tiêu Đồng Bộ
                              </h4>
                              <div className="form-group" style={{ marginBottom: '24px' }}>
                                 <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Kênh Giao Nhận Phù Hợp</label>
                                 <select 
                                    className="input-field" 
                                    style={{ width: '100%', padding: '14px 16px', fontSize: '15px', borderColor: importConfig.channelId ? 'var(--success)' : 'var(--primary)', borderWidth: '2px', background: importConfig.channelId ? 'rgba(16,185,129,0.05)' : 'rgba(59,130,246,0.05)', fontWeight: 600, transition: 'all 0.2s', borderRadius: '12px', outline: 'none' }} 
                                    value={importConfig.channelId} 
                                    onChange={e => setImportConfig({...importConfig, channelId: e.target.value})}
                                 >
                                    <option value="">-- Chọn 1 Kênh (Cần import báo cáo) --</option>
                                    {importableChannels.map(ch => (
                                       <option key={ch.id} value={ch.id}>{ch.name} (Phí mặc định: {ch.commission||ch.discountRate||0}%)</option>
                                    ))}
                                 </select>
                                 {importableChannels.length === 0 && (
                                    <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '10px', display:'flex', gap:'6px', alignItems:'center' }}>
                                       <AlertTriangle size={14}/> Chưa bật "Cho Phép Import" trên Quản Lý Kênh.
                                    </div>
                                 )}
                              </div>
                              
                              <div className="form-group" style={{ animation: 'slideIn 0.3s ease-out', opacity: importConfig.channelId ? 1 : 0.5, pointerEvents: importConfig.channelId ? 'auto' : 'none' }}>
                                 <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>Dòng Tiền Thực Thu Đổ Về Quỹ Nào?</label>
                                 <select 
                                    className="input-field" 
                                    value={importConfig.accountId} 
                                    style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', outline: 'none' }}
                                    onChange={e => setImportConfig({...importConfig, accountId: e.target.value})}
                                 >
                                    <option value="">-- KHÔNG ĐỔ VÀO QUỸ, chỉ tính Doanh thu/Lãi --</option>
                                    {state.accounts?.map(acc => (
                                       <option key={acc.id} value={acc.id}>{acc.name} - SD: {acc.balance?.toLocaleString('vi-VN')} đ</option>
                                    ))}
                                 </select>
                                 <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginTop: '10px', lineHeight: 1.5 }}>* Nếu chọn, hệ thống tự động gạch nợ thành công cho các hóa đơn và nạp tiền vào quỹ.</span>
                              </div>
                           </div>
                        </div>

                        {/* Right Col */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                           <div style={{ background: 'var(--surface-color)', padding: '24px', borderRadius: '16px', border: '1px solid var(--surface-border)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                              <h4 style={{ margin: '0 0 24px 0', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 <LayoutTemplate size={18} color="var(--primary)"/> Bước 2: Nạp File Báo Cáo
                              </h4>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed', borderColor: importConfig.fileName ? 'var(--success)' : 'var(--surface-border)', borderRadius: '16px', padding: '36px 20px', background: importConfig.fileName ? 'rgba(16, 185, 129, 0.05)' : '#F8FAFC', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', marginBottom: '24px', flexShrink: 0 }}
                                   onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                                   onMouseLeave={e => e.currentTarget.style.borderColor = importConfig.fileName ? 'var(--success)' : 'var(--surface-border)'}>
                                 <input type="file" accept=".csv, .txt, .tsv" onChange={handleFileUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                                 <UploadCloud size={48} color={importConfig.fileName ? 'var(--success)' : 'var(--primary)'} style={{ margin: '0 auto 16px', opacity: importConfig.fileName ? 1 : 0.8 }} />
                                 <strong style={{ display: 'block', fontSize: '15px', color: importConfig.fileName ? 'var(--success)' : 'var(--text-primary)', textAlign: 'center' }}>
                                    {importConfig.fileName ? `Sàng Lọc Thành Công: ${importConfig.fileName}` : 'Thả file CSV/TXT vào đây hoặc Bấm tải lên'}
                                 </strong>
                                 <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', display: 'block', textAlign: 'center' }}>Bắt buộc phải là định dạng chuẩn tải về từ Trang chủ Sàn</span>
                              </div>
                              
                              <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '120px' }}>
                                 <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface-color)', padding: '0 16px', fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>HOẶC DÁN NHANH TEXT THÔ</div>
                                 <textarea 
                                    className="input-field" 
                                    style={{ flex: 1, minHeight: '120px', fontFamily: '"Fira Code", monospace', resize: 'none', width: '100%', borderRadius: '12px', fontSize: '13px', background: '#F8FAFC', padding: '24px 16px 16px 16px', border: '1px solid var(--surface-border)', outline: 'none' }} 
                                    placeholder={`Mã đơn | Tên món | Số lượng  | Thực thu\n...`} 
                                    value={importConfig.content} 
                                    onChange={e => setImportConfig({...importConfig, content: e.target.value})} 
                                 />
                              </div>
                           </div>
                        </div>
                     </div>
                 </div>

                 <div style={{ paddingTop: '16px', borderTop: '1px solid var(--surface-border)', zIndex: 10, background: 'var(--bg-color)' }}>
                     <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 10px 25px -5px rgba(59,130,246,0.5)', opacity: importConfig.channelId && (importConfig.fileName || importConfig.content) ? 1 : 0.4, transition: 'all 0.3s' }} 
                        onClick={() => handlePreviewCSV(showToast)} 
                        disabled={!importConfig.channelId || (!importConfig.fileName && !importConfig.content)}
                     >
                        <FileText size={20}/> KHỞI CHẠY THUẬT TOÁN ĐỌC LIỆU
                     </button>
                 </div>
              </div>
            ) : (() => {
               const selectedChannel = importableChannels.find(ch => ch.id === importConfig.channelId);
               const configuredRate = Number(selectedChannel?.commission ?? selectedChannel?.discountRate ?? 0);
               const totalGross = previewOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
               const totalNet = previewOrders.reduce((sum, o) => sum + (o.netAmount || 0), 0);
               const totalDeduction = totalGross > totalNet ? (totalGross - totalNet) : 0;
               const actualRate = totalGross > 0 ? (totalDeduction / totalGross * 100) : 0;
               const isRateDeviated = Math.abs(actualRate - configuredRate) > 0.5;

               return (
               <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'slideIn 0.3s ease-out', overflow: 'hidden' }}>
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingBottom: '24px', paddingRight: '8px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexShrink: 0 }}>
                         <div>
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                               <CheckCircle2 size={24} color="var(--success)"/> Quét Dữ Liệu Hoàn Tất
                            </h4>
                            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Vui lòng rà soát lại thông số, đặc biệt các mức Phí Sàn và lượng Đơn trước khi Lưu.</span>
                         </div>
                         <div style={{ background: 'var(--success)', color: '#fff', padding: '10px 20px', borderRadius: '24px', fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                            <Database size={18}/> Hợp lệ: {previewOrders.length} đơn
                         </div>
                     </div>

                     {isRateDeviated && totalGross > 0 && (
                        <div style={{ flexShrink: 0, background: 'linear-gradient(to right, #FEF2F2, #FFF)', borderLeft: '4px solid #DC2626', padding: '16px 24px', borderRadius: '0 16px 16px 0', border: '1px solid #FECACA', borderLeftWidth: '4px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                           <div style={{ background: '#FEE2E2', padding: '10px', borderRadius: '50%' }}><AlertTriangle color="#DC2626" size={24} /></div>
                           <div>
                              <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 800, color: '#991B1B' }}>Cảnh Báo Chênh Lệch Phí Nền Tảng!</h4>
                              <p style={{ margin: 0, fontSize: '13.5px', lineHeight: 1.5, color: '#B91C1C' }}>
                                 Cài đặt Kênh <strong>{selectedChannel?.name}</strong>: <strong>{configuredRate}%</strong>. Tuy nhiên thực tế báo cáo tính toán: <strong style={{color:'#7F1D1D'}}>{actualRate.toFixed(2)}%</strong>.<br/>Thuật toán giữ vững nguyên tắc: <strong>Ưu Tiên Lưu Số Tiền Thực Thu Của File Báo Cáo.</strong>
                              </p>
                           </div>
                        </div>
                     )}

                     <div style={{ flex: 1, minHeight: '300px', background: 'var(--surface-color)', borderRadius: '16px', border: '1px solid var(--surface-border)', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                           <thead style={{ position: 'sticky', top: 0, background: 'var(--surface-variant)', zIndex: 1, backdropFilter: 'blur(8px)' }}>
                              <tr>
                                 <th style={{ padding: '14px 0px 14px 20px', width: '50px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, borderBottom: '1px solid var(--surface-border)', textAlign: 'center' }}>STT</th>
                                 <th style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, borderBottom: '1px solid var(--surface-border)' }}>Mã Đơn / Thời Gian</th>
                                 <th style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, borderBottom: '1px solid var(--surface-border)' }}>Phân Lớp Từ Khóa</th>
                                 <th style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, textAlign: 'right', borderBottom: '1px solid var(--surface-border)' }}>Tổng Tiền (Gross)</th>
                                 <th style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, textAlign: 'right', borderBottom: '1px solid var(--surface-border)' }}>Phí Sàn Khấu Trừ</th>
                                 <th style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800, textAlign: 'right', borderBottom: '1px solid var(--surface-border)' }}>Thực Thu Ghi Nhận (Net)</th>
                              </tr>
                           </thead>
                           <tbody style={{ overflowY: 'auto' }}>
                              {previewOrders.map((order, idx) => (
                                 <tr key={order.id} style={{ borderBottom: '1px solid var(--surface-border)', background: '#fff' }}>
                                    <td style={{ padding: '16px 0px 16px 20px', fontSize: '14px', fontWeight: 800, color: 'var(--text-secondary)', textAlign: 'center' }}>
                                       {idx + 1}
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                       <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px', marginBottom: '4px' }}>{order.orderCode || order.id}</div>
                                       <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                          {new Date(order.date).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                                       </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                       {order.items.map((item, idx) => (
                                          <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px', fontSize: '13.5px' }}>
                                             <span style={{ color: 'var(--primary)', fontWeight: 800, background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '6px' }}>x{item.quantity}</span>
                                             <span style={{ flex: 1, color: order.isFuzzyRecognized ? '#B45309' : 'var(--text-primary)', fontWeight: 600 }}>
                                                 {item.product?.name} 
                                             </span>
                                          </div>
                                       ))}
                                       {order.isFuzzyRecognized && (
                                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: '12px', marginTop: '4px', fontWeight: 700 }}>
                                             <AlertTriangle size={12}/> Phân nhóm tự động
                                          </div>
                                       )}
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '14px' }}>
                                       {order.totalAmount.toLocaleString('vi-VN')} đ
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                       {(order.totalAmount > 0 && order.totalAmount > order.netAmount) ? (
                                          <div style={{ color: 'var(--danger)', fontWeight: 800, fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                             <span>-{(order.totalAmount - order.netAmount).toLocaleString('vi-VN')} đ</span>
                                             <span style={{ fontSize: '11px', background: '#FEE2E2', padding: '2px 6px', borderRadius: '4px', display: 'inline-block' }}>
                                               {(((order.totalAmount - order.netAmount) / order.totalAmount) * 100).toFixed(1)}%
                                             </span>
                                          </div>
                                       ) : <span style={{color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600}}>-0 đ</span>}
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 900, color: 'var(--success)', fontSize: '15px' }}>
                                       {order.netAmount.toLocaleString('vi-VN')} đ
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                           <tfoot style={{ position: 'sticky', bottom: 0, background: '#F8FAFC', zIndex: 1, borderTop: '2px solid var(--primary)', outline: '1px solid var(--surface-border)' }}>
                              <tr>
                                 <td colSpan="3" style={{ padding: '16px 20px', fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                    Tổng cộng trước khi nhập: {previewOrders.length} Đơn
                                 </td>
                                 <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 800, color: 'var(--text-secondary)', fontSize: '15px' }}>
                                    {totalGross.toLocaleString('vi-VN')} đ
                                 </td>
                                 <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 800, color: 'var(--danger)', fontSize: '15px' }}>
                                    -{totalDeduction.toLocaleString('vi-VN')} đ
                                 </td>
                                 <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 900, color: 'var(--success)', fontSize: '16px' }}>
                                    {totalNet.toLocaleString('vi-VN')} đ
                                 </td>
                              </tr>
                           </tfoot>
                        </table>
                     </div>
                 </div>
                 
                 <div style={{ display:'flex', gap:'16px', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--surface-border)', zIndex: 10, background: 'var(--bg-color)', flexShrink: 0 }}>
                    <button className="btn btn-ghost" style={{ padding: '14px 32px', fontSize: '14px', fontWeight: 700, borderRadius: '12px', background: 'var(--surface-variant)' }} onClick={() => setPreviewOrders(null)}>
                       Quay Lại Sửa Cấu Hình
                    </button>
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-primary" style={{ padding: '14px 40px', fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', boxShadow: '0 8px 20px rgba(59,130,246,0.3)' }} onClick={() => confirmImport(showToast)}>
                       <CheckCircle2 size={20}/> KÍCH HOẠT LƯU THÔNG TIN BÁO CÁO VÀO CSDL
                    </button>
                 </div>
               </div>
               );
            })()}
        </div>
    );
};

export default ImportData;
