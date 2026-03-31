import React, { useState } from 'react';
import { RefreshCcw, Trash2, CheckSquare, Square } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';

const UnifiedTrash = ({ 
  items, 
  columns, 
  onRestore, 
  onHardDelete, 
  onBulkRestore, 
  onBulkHardDelete,
  emptyMessage = "Thùng rác đang trống."
}) => {
  const { confirm } = useConfirm();
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(i => i.id));
    }
  };

  const toggleItem = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkRestore = async () => {
    const isConfirmed = await confirm({
      title: 'Khôi phục dữ liệu',
      message: `Khôi phục ${selectedIds.length} mục đã chọn?`,
      confirmText: 'Khôi phục'
    });
    if (isConfirmed) {
      onBulkRestore(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkHardDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Xóa vĩnh viễn',
      message: `Xóa vĩnh viễn ${selectedIds.length} mục đã chọn? Hành động này không thể hoàn tác.`,
      confirmText: 'Xóa sạch',
      type: 'danger'
    });
    if (isConfirmed) {
      onBulkHardDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
        <Trash2 size={40} style={{ opacity: 0.2, marginBottom: '12px', margin: '0 auto' }}/>
        <p style={{ margin: 0 }}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Floating Action Bar for Trash */}
      {selectedIds.length > 0 && (
        <div style={{ 
          background: 'var(--surface-variant)', 
          border: '1px solid var(--primary)', 
          padding: '12px 20px', 
          borderRadius: '12px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Đã chọn {selectedIds.length} mục</span>
            <button className="btn btn-ghost" style={{ fontSize: '13px', padding: '4px 8px', color: 'var(--text-secondary)' }} onClick={() => setSelectedIds([])}>Hủy chọn</button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
             <button className="btn btn-outline" style={{ display: 'flex', gap: '6px', alignItems: 'center', borderColor: 'var(--success)', color: 'var(--success)', padding: '8px 16px' }} onClick={handleBulkRestore}>
               <RefreshCcw size={16}/> Khôi phục hàng loạt
             </button>
             <button className="btn btn-danger" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '8px 16px' }} onClick={handleBulkHardDelete}>
               <Trash2 size={16}/> Xóa TẤT CẢ đã chọn
             </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-variant)', borderBottom: '1px solid var(--surface-border)' }}>
              <th style={{ padding: '12px 16px', width: '50px', cursor: 'pointer' }} onClick={toggleAll}>
                {selectedIds.length === items.length && items.length > 0 ? <CheckSquare size={18} color="var(--primary)"/> : <Square size={18} color="var(--text-secondary)"/>}
              </th>
              {columns.map((col, idx) => (
                <th key={idx} style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>{col.label}</th>
              ))}
              <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--surface-border)', background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent', transition: 'background 0.2s' }}>
                  <td style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => toggleItem(item.id)}>
                    {isSelected ? <CheckSquare size={18} color="var(--primary)"/> : <Square size={18} color="var(--text-secondary)"/>}
                  </td>
                  {columns.map((col, idx) => (
                    <td key={idx} style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                      {col.render ? col.render(item) : item[col.key]}
                    </td>
                  ))}
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--success)', borderColor: 'var(--success)' }} onClick={() => onRestore(item.id)}>
                        Khôi phục
                      </button>
                      <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={async () => {
                        const isConfirmed = await confirm({ title: 'Xóa vĩnh viễn', message: 'Hành động này không thể khôi phục.', type: 'danger'});
                        if (isConfirmed) onHardDelete(item.id);
                      }}>
                        Xóa sạch
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UnifiedTrash;
