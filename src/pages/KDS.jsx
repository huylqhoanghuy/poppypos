import React, { useState } from 'react';
import { ChefHat, CheckCircle2, Clock, AlarmClock } from 'lucide-react';
import { useData } from '../context/DataContext';

const KDS = () => {
  const { state, dispatch } = useData();
  const [itemStatusOverride, setItemStatusOverride] = useState({});

  const toggleItemStatus = (orderId, itemIdx) => {
    const key = `${orderId}-${itemIdx}`;
    setItemStatusOverride(prev => {
      const current = prev[key] || 'pending';
      const next = current === 'pending' ? 'preparing' : current === 'preparing' ? 'done' : 'pending';
      return { ...prev, [key]: next };
    });
  };

  const markOrderReady = (orderId) => {
    dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status: 'ready' } });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'var(--danger)';
      case 'preparing': return 'var(--warning)';
      case 'done':
      case 'ready': return 'var(--success)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Đang Chờ';
      case 'preparing': return 'Đang Làm';
      case 'done':
      case 'ready': return 'Hoàn Thành';
      default: return '';
    }
  };

  // Filter orders that are not ready
  const activeOrders = (state.posOrders || []).filter(o => o.status !== 'ready');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflow: 'hidden' }}>
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ChefHat color="var(--primary)" /> Màn Hình Nhà Bếp (KDS)
          </h2>
          <p style={{ margin: 0, marginTop: '4px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Hiển thị các đơn hàng đang cần chuẩn bị
          </p>
        </div>
      </div>

      <div style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: '20px', paddingBottom: '12px' }}>
        {activeOrders.length === 0 ? (
           <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
             Không có đơn hàng nào chờ chế biến
           </div>
        ) : (
          activeOrders.map(order => {
             // Derive order status based on items
             const itemsStatus = order.items.map((_, i) => itemStatusOverride[`${order.id}-${i}`] || 'pending');
             const allDone = itemsStatus.every(s => s === 'done');
             const anyPreparing = itemsStatus.some(s => s === 'preparing' || s === 'done');
             let orderStatus = 'pending';
             if (allDone) orderStatus = 'ready';
             else if (anyPreparing) orderStatus = 'preparing';

             return (
              <div key={order.id} className="glass-panel" style={{ width: '320px', minWidth: '320px', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderTop: `4px solid ${getStatusColor(orderStatus)}`, backgroundColor: 'rgba(22, 27, 34, 0.8)' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{order.id}</h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.type}</span>
                   </div>
                   <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {new Date(order.date).toLocaleTimeString('vi-VN')}
                      </div>
                   </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {order.items.map((item, idx) => {
                    const status = itemStatusOverride[`${order.id}-${idx}`] || 'pending';
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleItemStatus(order.id, idx)}
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          padding: '12px',
                          backgroundColor: 'rgba(255,255,255,0.03)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          borderLeft: `4px solid ${getStatusColor(status)}`,
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                             <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>{item.qty}x</span>
                             <span style={{ fontWeight: 500, fontSize: '1rem', textDecoration: status === 'done' ? 'line-through' : 'none', opacity: status === 'done' ? 0.6 : 1 }}>{item.name}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          {status === 'done' ? <CheckCircle2 color="var(--success)" /> : <Clock color="var(--text-secondary)" />}
                          <span style={{ fontSize: '0.7rem', color: getStatusColor(status) }}>{getStatusText(status)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ padding: '16px', borderTop: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)' }}>
                   <button 
                     className={`btn ${orderStatus === 'ready' ? 'btn-primary' : 'btn-ghost'}`} 
                     style={{ width: '100%', padding: '12px', borderColor: 'var(--surface-border)', borderWidth: '1px', borderStyle: 'solid' }}
                     onClick={() => markOrderReady(order.id)}
                   >
                     Đánh Dấu Hoàn Tất Đơn
                   </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default KDS;
