import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function LiveClock() {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDateTime = (date) => {
        return new Intl.DateTimeFormat('vi-VN', {
            weekday: 'long',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(date);
    };

    return (
        <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '6px', 
            padding: '4px 10px', background: '#fff7ed', border: '1px solid #ffedd5', 
            borderRadius: '12px', color: '#ea580c', fontSize: '11px', fontWeight: 700,
            whiteSpace: 'nowrap', textTransform: 'uppercase'
        }}>
            <Clock size={12} strokeWidth={2.5} /> LIVE • {formatDateTime(currentTime)}
        </div>
    );
}
