import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import SmartDatePicker from './SmartDatePicker';

const DATE_PRESETS = {
  'today': 'Hôm nay',
  'yesterday': 'Hôm qua',
  '7days': '7 ngày qua',
  '30days': '30 ngày qua',
  'this_month': 'Tháng này',
  'last_month': 'Tháng trước',
  'this_year': 'Năm nay',
  'all': 'Tất cả thời gian',
  'custom': 'Tuỳ chọn'
};

const SmartDateFilter = ({ 
    filterDate, 
    setFilterDate, 
    datePreset, 
    setDatePreset, 
    handlePresetChange, 
    // eslint-disable-next-line no-unused-vars
    icon: Icon = Calendar,
    align = 'left' 
}) => {
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setShowPicker(false);
            }
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') setShowPicker(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('keydown', handleEsc);
        };
    }, []);

    const currentPresetLabel = (() => {
        if (datePreset !== 'custom' && datePreset && DATE_PRESETS[datePreset]) {
            return DATE_PRESETS[datePreset];
        }
        const sDate = filterDate?.start ? new Date(filterDate.start).toLocaleDateString('vi-VN') : '...';
        const eDate = filterDate?.end ? new Date(filterDate.end).toLocaleDateString('vi-VN') : '...';
        if (sDate === eDate && sDate !== '...') return sDate;
        return `${sDate} - ${eDate}`;
    })();

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }} ref={pickerRef}>
             <button 
               className="btn btn-ghost"
               style={{ padding: '0 14px', height: '34px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', display: 'flex', gap: '6px', alignItems: 'center' }}
               onClick={() => setShowPicker(!showPicker)}
             >
               <Icon size={16} color="var(--primary)" />
               {currentPresetLabel}
               <ChevronDown size={14} color="var(--text-secondary)" style={{ marginLeft: '2px', transform: showPicker ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
             </button>

             {showPicker && (
                 <div style={{ position: 'absolute', top: 'calc(100% + 8px)', [align]: '0', background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-lg)', zIndex: 110, display: 'flex', gap: '20px', minWidth: '320px' }}>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                       <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Mốc thời gian</div>
                       {Object.entries(DATE_PRESETS).map(([key, label]) => {
                           if (key === 'custom') return null;
                           return (
                             <button 
                                key={key}
                                onClick={() => { 
                                    if (handlePresetChange) handlePresetChange(key); 
                                    else if (setDatePreset) setDatePreset(key);
                                    setShowPicker(false); 
                                }}
                                style={{ padding: '8px 12px', textAlign: 'left', background: (datePreset || 'this_month') === key ? 'var(--primary)' : 'transparent', color: (datePreset || 'this_month') === key ? '#FFF' : 'var(--text-primary)', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: '0.2s' }}
                             >
                                {label}
                             </button>
                           )
                       })}
                     </div>
                     
                     <div style={{ width: '1px', background: 'var(--surface-border)' }}></div>

                     <div>
                        <SmartDatePicker 
                           initialStart={filterDate?.start}
                           initialEnd={filterDate?.end}
                           onConfirm={(start, end) => {
                              let endNormalized = end;
                              if (end) {
                                  const e = new Date(end);
                                  e.setHours(23, 59, 59, 999);
                                  endNormalized = e;
                              }
                              const pad = n => n.toString().padStart(2, '0');
                              if (setFilterDate) {
                                  setFilterDate({
                                      start: start ? `${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}` : '',
                                      end: endNormalized ? `${endNormalized.getFullYear()}-${pad(endNormalized.getMonth()+1)}-${pad(endNormalized.getDate())}` : ''
                                  });
                              }
                              if (setDatePreset) setDatePreset('custom');
                              setShowPicker(false);
                           }}
                           onCancel={() => setShowPicker(false)}
                        />
                     </div>
                 </div>
             )}
         </div>
    );
};

export default SmartDateFilter;
