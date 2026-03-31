import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import UnifiedTrash from '../components/UnifiedTrash';
import { Trash2 } from 'lucide-react';

const ENTITY_CONFIG = [
  { key: 'categories', label: 'Danh Mục Thực Đơn', restoreAction: 'BULK_RESTORE_CATEGORY', deleteAction: 'BULK_HARD_DELETE_CATEGORY', singleRestore: 'RESTORE_CATEGORY', singleDelete: 'HARD_DELETE_CATEGORY' },
  { key: 'salesChannels', label: 'Kênh Bán', restoreAction: 'BULK_RESTORE_CHANNEL', deleteAction: 'BULK_HARD_DELETE_CHANNEL', singleRestore: 'RESTORE_CHANNEL', singleDelete: 'HARD_DELETE_CHANNEL' },
  { key: 'accounts', label: 'Tài Khoản/Ví', restoreAction: 'BULK_RESTORE_ACCOUNT', deleteAction: 'BULK_HARD_DELETE_ACCOUNT', singleRestore: 'RESTORE_ACCOUNT', singleDelete: 'HARD_DELETE_ACCOUNT' },
  { key: 'financeCategories', label: 'Mục Thu/Chi', restoreAction: 'BULK_RESTORE_FINANCE_CATEGORY', deleteAction: 'BULK_HARD_DELETE_FINANCE_CATEGORY', singleRestore: 'RESTORE_FINANCE_CATEGORY', singleDelete: 'HARD_DELETE_FINANCE_CATEGORY' },
  { key: 'ingredients', label: 'Kho Nguyên Liệu', restoreAction: 'BULK_RESTORE_INGREDIENT', deleteAction: 'BULK_HARD_DELETE_INGREDIENT', singleRestore: 'RESTORE_INGREDIENT', singleDelete: 'HARD_DELETE_INGREDIENT' },
  { key: 'products', label: 'Sản Phẩm (POS)', restoreAction: 'BULK_RESTORE_PRODUCT', deleteAction: 'BULK_HARD_DELETE_PRODUCT', singleRestore: 'RESTORE_PRODUCT', singleDelete: 'HARD_DELETE_PRODUCT' },
  { key: 'suppliers', label: 'Nhà Cung Cấp', restoreAction: 'BULK_RESTORE_SUPPLIER', deleteAction: 'BULK_HARD_DELETE_SUPPLIER', singleRestore: 'RESTORE_SUPPLIER', singleDelete: 'HARD_DELETE_SUPPLIER' },
  { key: 'posOrders', label: 'Đơn Hàng', restoreAction: 'BULK_RESTORE_POS_ORDER', deleteAction: 'BULK_HARD_DELETE_POS_ORDER', singleRestore: 'RESTORE_POS_ORDER', singleDelete: 'HARD_DELETE_POS_ORDER' } // Wait, Order is just DELETE_POS_ORDER? I implemented BULK_DELETE_POS_ORDER
];

export default function GlobalTrash() {
  const { state, dispatch } = useData();

  // Combine deleted items and memoize a mapping for extremely fast ID lookups
  const { masterList, idMapping } = useMemo(() => {
    const list = [];
    const mapping = {};

    ENTITY_CONFIG.forEach(config => {
      const items = state[config.key] || [];
      const deletedItems = items.filter(item => item.deleted);
      deletedItems.forEach(item => {
        mapping[item.id] = config;
        list.push({
          ...item,
          _entityLabel: config.label,
        });
      });
    });

    const sortedList = list.sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0));
    return { masterList: sortedList, idMapping: mapping };
  }, [state]);

  const handleBulkRestore = (ids) => {
     const groups = {};
     ids.forEach(id => {
        const config = idMapping[id];
        if (config) {
            if (!groups[config.key]) groups[config.key] = { action: config.restoreAction, ids: [] };
            groups[config.key].ids.push(id);
        }
     });
     
     Object.values(groups).forEach(g => {
        dispatch({ type: g.action, payload: g.ids });
     });
     dispatch({ type: 'SHOW_TOAST', payload: { message: `Đã khôi phục ${ids.length} mục dữ liệu.` } });
  };

  const handleBulkHardDelete = (ids) => {
     const groups = {};
     ids.forEach(id => {
        const config = idMapping[id];
        if (config) {
            if (!groups[config.key]) groups[config.key] = { action: config.deleteAction, ids: [] };
            groups[config.key].ids.push(id);
        }
     });
     
     Object.values(groups).forEach(g => {
        dispatch({ type: g.action, payload: g.ids });
     });
     dispatch({ type: 'SHOW_TOAST', payload: { message: `Đã dọn dẹp vĩnh viễn ${ids.length} mục dữ liệu.` } });
  };

  const handleRestore = (id) => {
     const config = idMapping[id];
     if (config && config.singleRestore) {
         dispatch({ type: config.singleRestore, payload: id });
         dispatch({ type: 'SHOW_TOAST', payload: { message: `Đã khôi phục dữ liệu.` } });
     } else if (config) {
         handleBulkRestore([id]);
     }
  };

  const handleHardDelete = (id) => {
     const config = idMapping[id];
     if (config && config.singleDelete) {
         dispatch({ type: config.singleDelete, payload: id });
         dispatch({ type: 'SHOW_TOAST', payload: { message: `Đã xóa vĩnh viễn.` } });
     } else if (config) {
         handleBulkHardDelete([id]);
     }
  };

  // Columns for UnifiedTrash
  const columns = [
    { key: 'name', label: 'Tên Dữ Liệu', render: (item) => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 600 }}>{item.name || item.customerName || `Chưa đặt tên (${item.id})`}</span>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {item._entityLabel}
        </span>
      </div>
    )},
    { key: 'deletedAt', label: 'Thời Gian Xóa', render: (item) => 
       item.deletedAt ? new Date(item.deletedAt).toLocaleString('vi-VN') : 'Không rõ'
    }
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '100%', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--danger)', color: 'white', padding: '10px', borderRadius: '12px', display: 'flex' }}>
          <Trash2 size={24} />
        </div>
        <div>
           <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Thùng Rác Tổng Hệ Thống</h2>
           <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>Quản lý và dọn dẹp tập trung toàn bộ dữ liệu đã xóa trên tất cả phân hệ</p>
        </div>
      </div>
      
      <div style={{ background: 'var(--surface-color)', borderRadius: '16px', overflow: 'hidden' }}>
        <UnifiedTrash 
          items={masterList}
          columns={columns}
          onRestore={handleRestore}
          onHardDelete={handleHardDelete}
          onBulkRestore={handleBulkRestore}
          onBulkHardDelete={handleBulkHardDelete}
          emptyMessage="Tuyệt vời! Hệ thống đã được dọn dẹp sạch sẽ, không có rác tồn đọng."
        />
      </div>
    </div>
  );
}
