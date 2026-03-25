import React, { useState } from 'react';
import { ClipboardList, Search, Trash2, CheckCircle, Clock, XCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../context/DataContext';

const Orders = () => {
  const { state, dispatch } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');

  const orders = [...(state.posOrders || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(searchQuery.toLowerCase()) || o.channelName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchChannel = filterChannel === 'all' || o.channelName === filterChannel;
    
    const itemDate = new Date(o.date).setHours(0,0,0,0);
    const start = startDate ? new Date(startDate).setHours(0,0,0,0) : null;
    const end = endDate ? new Date(endDate).setHours(23,59,59,999) : null;
    const matchDate = (!start || itemDate >= start) && (!end || itemDate <= end);

    return matchSearch && matchStatus && matchChannel && matchDate;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Success':
        return <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(46, 160, 67, 0.2)', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 'bold' }}>Thành Công</span>;
      case 'Pending':
        return <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(249, 115, 22, 0.2)', color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 'bold' }}>Chờ Ship</span>;
      case 'Cancelled':
        return <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(218, 54, 51, 0.2)', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 'bold' }}>Đã Hủy</span>;
      default:
        return <span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{status}</span>;
    }
  };

  const updateStatus = (orderId, status) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
  };

  const deleteOrder = (orderId) => {
    if (confirm('Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng này? Hệ thống sẽ hoàn lại kho nếu đơn chưa bị hủy.')) {
      dispatch({ type: 'DELETE_POS_ORDER', payload: orderId });
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ClipboardList color="var(--primary)" /> Danh Sách Đơn Hàng (Kinh Doanh)
          </h2>
          <p style={{ margin: 0, marginTop: '4px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Quản lý trạng thái giao hàng, hủy đơn và truy vết dòng tiền từ các kênh Shopee, Grab.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: '8px', minWidth: '250px', border: '1px solid var(--surface-border)', height: '42px' }}>
            <Search size={18} color="var(--text-secondary)" />
            <input 
              placeholder="Mã đơn / Kênh bán..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Từ:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid var(--surface-border)', padding:'8px', borderRadius:'6px', outline:'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Đến:</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid var(--surface-border)', padding:'8px', borderRadius:'6px', outline:'none' }} />
          </div>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid var(--surface-border)', padding:'8px', borderRadius:'6px', outline:'none' }}>
            <option value="all">-- Tất cả Trạng thái --</option>
            <option value="Pending">Chờ Ship</option>
            <option value="Success">Thành Công</option>
            <option value="Cancelled">Đã Hủy</option>
          </select>

          <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)} style={{ background:'rgba(0,0,0,0.3)', color:'white', border:'1px solid var(--surface-border)', padding:'8px', borderRadius:'6px', outline:'none' }}>
            <option value="all">-- Tất cả Kênh --</option>
            {state.salesChannels?.map(ch => <option key={ch.id} value={ch.name}>{ch.name}</option>)}
          </select>

          <button className="btn btn-ghost" onClick={() => { setStartDate(''); setEndDate(''); setFilterStatus('all'); setFilterChannel('all'); setSearchQuery(''); }} style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>Xóa Lọc</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px' }}>Thời Gian</th>
                <th style={{ padding: '12px' }}>Khách Hàng</th>
                <th style={{ padding: '12px' }}>Kênh Bán</th>
                <th style={{ padding: '12px' }}>Thực Thu (Ví)</th>
                <th style={{ padding: '12px' }}>Trạng Thái</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Chưa có đơn hàng nào được ghi nhận.</td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <React.Fragment key={order.id}>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => toggleExpand(order.id)}>
                      <td style={{ padding: '12px', fontSize: '0.9rem' }}>{new Date(order.date).toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '12px' }}>
                        <strong style={{ display: 'block' }}>{order.id}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.customerName || 'Khách vãng lai'} - {order.customerPhone || ''}</span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.85rem' }}>{order.channelName}</span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--success)', fontWeight: 'bold' }}>
                        {(order.netAmount + (Number(order.extraFee) || 0)).toLocaleString('vi-VN')} đ
                      </td>
                      <td style={{ padding: '12px' }}>{getStatusBadge(order.status)}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }} onClick={e => e.stopPropagation()}>
                          <button className="btn btn-ghost" title="Thành công" style={{ color: 'var(--success)' }} onClick={() => updateStatus(order.id, 'Success')}><CheckCircle size={18}/></button>
                          <button className="btn btn-ghost" title="Chờ ship" style={{ color: 'var(--warning)' }} onClick={() => updateStatus(order.id, 'Pending')}><Clock size={18}/></button>
                          <button className="btn btn-ghost" title="Hủy đơn" style={{ color: 'var(--danger)' }} onClick={() => updateStatus(order.id, 'Cancelled')}><XCircle size={18}/></button>
                          <div style={{ width: '1px', background: 'var(--surface-border)', margin: '0 4px' }} />
                          <button className="btn btn-ghost" title="Xóa" onClick={() => deleteOrder(order.id)}><Trash2 size={18}/></button>
                          <button className="btn btn-ghost">
                            {expandedOrderId === order.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr>
                        <td colSpan="6" style={{ padding: '0' }}>
                          <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--surface-border)' }}>
                            <h4 style={{ margin: 0, marginBottom: '12px', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Chi Tiết Đồ Ăn Trong Đơn:</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                              {order.items.map((item, idx) => (
                                <div key={idx} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{item.product.name}</span>
                                  <strong style={{ color: 'var(--primary)' }}>x{item.quantity}</strong>
                                </div>
                              ))}
                            </div>
                            <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                                <div>
                                  Tổng bill gốc: {order.totalAmount.toLocaleString('vi-VN')} đ | Phí sàn: -{order.discountAmount.toLocaleString('vi-VN')} đ
                                </div>
                                {Number(order.extraFee) > 0 && (
                                  <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                                    + Phí phát sinh: {Number(order.extraFee).toLocaleString('vi-VN')} đ ({order.extraFeeNote || 'Không có ghi chú'})
                                  </div>
                                )}
                              </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
