import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useData } from '../context/DataContext';

export default function GlobalToast() {
  const { state } = useData();
  const [toasts, setToasts] = useState([]);
  
  // Ref to keep track of processed notification IDs so we don't re-toast on random re-renders
  const [processedIds, setProcessedIds] = useState(new Set());

  useEffect(() => {
    if (!state.notifications) return;
    
    const now = Date.now();
    const undispatched = state.notifications.filter(n => {
       const timeDiff = now - new Date(n.timestamp).getTime();
       // Only toast things created recently and not processed yet, and NOT silent
       return timeDiff < 2000 && !processedIds.has(n.id) && !n.silent;
    });
    
    if (undispatched.length > 0) {
      setToasts(prev => [...prev, ...undispatched]);
      setProcessedIds(prev => {
         const newSet = new Set(prev);
         undispatched.forEach(t => newSet.add(t.id));
         return newSet;
      });
      
      undispatched.forEach(t => {
        setTimeout(() => {
          setToasts(current => current.filter(item => item.id !== t.id));
        }, 4000);
      });
    }
  }, [state.notifications, processedIds]);

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 99999 }}>
      {toasts.map(toast => {
        const typeColor = toast.type === 'success' ? '#16A34A' : toast.type === 'error' ? '#EF4444' : toast.type === 'warning' ? '#F59E0B' : '#3B82F6';
        const TypeIcon = toast.type === 'success' ? CheckCircle : toast.type === 'warning' ? AlertTriangle : toast.type === 'error' ? XCircle : Info;
        
        return (
          <div key={toast.id} className="toast-anim" style={{
            background: 'var(--surface-color)', padding: '16px', borderRadius: '12px', 
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', 
            gap: '12px', minWidth: '320px', maxWidth: '400px', borderLeft: `4px solid ${typeColor}`,
            border: '1px solid var(--surface-border)'
          }}>
             <div style={{ color: typeColor }}>
               <TypeIcon size={24}/>
             </div>
             <div style={{ flex: 1 }}>
               <h4 style={{ margin: 0, fontSize: '14.5px', color: 'var(--text-primary)' }}>{toast.title}</h4>
               {toast.message && <p style={{ margin: '4px 0 0 0', fontSize: '13.5px', color: 'var(--text-secondary)' }}>{toast.message}</p>}
             </div>
             <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
               <X size={16} />
             </button>
          </div>
        )
      })}
    </div>
  )
}
