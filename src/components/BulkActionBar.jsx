import React from 'react';
import { Trash2 } from 'lucide-react';

const BulkActionBar = ({ selectedCount, onClearSelection, onDeleteSelected, customActions }) => {
  if (selectedCount === 0) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: '32px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--surface-color)',
      border: '1px solid var(--primary)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      padding: '16px 24px',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      zIndex: 500,
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'var(--primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
          {selectedCount}
        </div>
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>mục đang chọn</span>
        <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '13px', color: 'var(--text-secondary)' }} onClick={onClearSelection}>Bỏ chọn</button>
      </div>
      
      <div style={{ width: '1px', height: '24px', background: 'var(--surface-border)' }} />
      
      <div style={{ display: 'flex', gap: '12px' }}>
        {customActions}
        {onDeleteSelected && (
          <button className="btn btn-danger" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 16px', fontWeight: 600 }} onClick={onDeleteSelected}>
            <Trash2 size={16}/> Đưa vào thùng rác
          </button>
        )}
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default BulkActionBar;
