import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SmartDatePicker = ({ initialStart, initialEnd, onConfirm, onCancel }) => {
  const normalize = (d) => {
    if (!d) return null;
    const nd = new Date(d);
    nd.setHours(0,0,0,0);
    return nd;
  };

  const [currentMonth, setCurrentMonth] = useState(initialStart ? normalize(initialStart) : normalize(new Date()));
  const [startDate, setStartDate] = useState(normalize(initialStart));
  const [endDate, setEndDate] = useState(normalize(initialEnd));

  const handleDayClick = (dayStr) => {
    const clickedDate = new Date(dayStr);
    
    // Logic:
    // Case 1: Start and end exist -> Reset start, clear end
    // Case 2: Start exists, no end -> 
    //    If clicked >= start -> Set end
    //    If clicked < start -> Replace start
    // Case 3: No start -> Set start

    if (startDate && endDate) {
      setStartDate(clickedDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (clickedDate.getTime() >= startDate.getTime()) {
        setEndDate(clickedDate);
      } else {
        setStartDate(clickedDate);
      }
    } else {
      setStartDate(clickedDate);
    }
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Lịch Math
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-based
  
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0(Sun) - 6(Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const daysArray = [];
  // Khoảng trống đầu tháng
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(new Date(year, month, i));
  }
  
  const getDayStatus = (d) => {
    if (!d) return 'empty';
    const time = d.getTime();
    const stime = startDate?.getTime();
    const etime = endDate?.getTime();
    
    if (stime && etime) {
      if (time === stime) return 'start';
      if (time === etime) return 'end';
      if (time > stime && time < etime) return 'in-range';
    } else if (stime) {
      if (time === stime) return 'start';
    }
    return 'default';
  };

  return (
    <div style={{ minWidth: '240px' }}>
      {/* Header Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
         <button className="btn btn-ghost" style={{ padding: 0, color: '#4B5563', fontSize: '13px', fontWeight: 600 }} onClick={onCancel}>Hủy</button>
         <button className="btn btn-ghost" style={{ padding: 0, color: '#EA580C', fontSize: '13px', fontWeight: 800 }} onClick={() => onConfirm(startDate, endDate)}>Xác nhận</button>
      </div>

      {/* Month Navigator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
         <button className="btn btn-ghost" onClick={prevMonth} style={{ padding: '4px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '50%' }}><ChevronLeft size={14}/></button>
         <span style={{ fontSize: '14px', fontWeight: 800 }}>Th{month + 1 > 9 ? month + 1 : `0${month + 1}`} {year !== new Date().getFullYear() ? `- ${year}` : ''}</span>
         <button className="btn btn-ghost" onClick={nextMonth} style={{ padding: '4px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '50%' }}><ChevronRight size={14}/></button>
      </div>

      {/* WeekDays Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px', textAlign: 'center' }}>
         {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(d => (
           <div key={d} style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: 700 }}>{d}</div>
         ))}
      </div>

      {/* Days Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0', textAlign: 'center' }}>
         {daysArray.map((d, idx) => {
            if (!d) return <div key={idx} />;
            const status = getDayStatus(d);
            const isToday = d.getTime() === normalize(new Date()).getTime();

            // Default Styling
            let bg = 'transparent';
            let color = '#111827';
            let borderRadius = '0';
            let fontWeight = 500;
            
            if (status === 'start' || status === 'end') {
              bg = '#EA580C';
              color = '#FFFFFF';
              borderRadius = '6px'; // Bo nhẹ
              fontWeight = 800;
            } else if (status === 'in-range') {
              bg = '#FFF0E6';
              color = '#EA580C';
              fontWeight = 700;
            } else if (isToday) {
              color = '#EA580C'; // Highlight today
              fontWeight = 800;
            }
            
            // Xử lý background nối dải băng
            let daiBangStyle = {};
            if (startDate && endDate && startDate.getTime() !== endDate.getTime()) {
               if (status === 'start') {
                  daiBangStyle = { background: `linear-gradient(to right, transparent 50%, #FFF0E6 50%)`, borderRadius: 0 };
               } else if (status === 'end') {
                  daiBangStyle = { background: `linear-gradient(to left, transparent 50%, #FFF0E6 50%)`, borderRadius: 0 };
               }
            }

            return (
               <div key={idx} style={{ position: 'relative', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', ...daiBangStyle }} onClick={() => handleDayClick(d.toISOString())}>
                  
                  {/* Khung ngày thực tế */}
                  <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color, borderRadius, fontWeight, zIndex: 2, position: 'relative', fontSize: '12px' }}>
                     {d.getDate()}
                     
                     {/* Badge Bắt Đầu */}
                     {status === 'start' && (
                        <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#EA580C', color: '#FFF', fontSize: '8px', padding: '2px 4px', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: 800, boxShadow: '0 2px 4px rgba(234,88,12,0.3)' }}>
                           Bắt đầu
                        </div>
                     )}
                     
                     {/* Badge Kết Thúc */}
                     {(status === 'end' && startDate?.getTime() !== endDate?.getTime()) && (
                        <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#EA580C', color: '#FFF', fontSize: '8px', padding: '2px 4px', borderRadius: '4px', whiteSpace: 'nowrap', fontWeight: 800, boxShadow: '0 2px 4px rgba(234,88,12,0.3)' }}>
                           Kết thúc
                        </div>
                     )}
                  </div>
               </div>
            )
         })}
      </div>
    </div>
  );
};
export default SmartDatePicker;
