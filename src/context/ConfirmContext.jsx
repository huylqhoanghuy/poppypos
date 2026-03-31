import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmContext = createContext();

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    cancelText: 'Hủy',
    type: 'danger', // danger | warning | info
    onConfirm: null,
    onCancel: null
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title: options.title || 'Xác nhận',
        message: options.message || 'Bạn có chắc chắn muốn thực hiện thao tác này?',
        confirmText: options.confirmText || 'Xác nhận',
        cancelText: options.cancelText || 'Hủy',
        type: options.type || 'danger',
        onConfirm: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {confirmState.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg-color)', width: '100%', maxWidth: '400px', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ background: confirmState.type === 'danger' ? '#FEF2F2' : '#FFFBEB', color: confirmState.type === 'danger' ? 'var(--danger)' : 'var(--warning)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, marginBottom: '8px', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{confirmState.title}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
                  {confirmState.message}
                </p>
              </div>
            </div>
            <div style={{ padding: '16px 20px', background: 'var(--surface-variant)', borderTop: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn btn-ghost" 
                onClick={confirmState.onCancel}
                style={{ padding: '8px 16px', fontWeight: 600, background: 'var(--bg-color)', border: '1px solid var(--surface-border)', color: 'var(--text-primary)' }}
              >
                {confirmState.cancelText}
              </button>
              <button 
                className={`btn ${confirmState.type === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
                onClick={confirmState.onConfirm}
                style={{ padding: '8px 16px', fontWeight: 600 }}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
