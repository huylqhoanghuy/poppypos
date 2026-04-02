import { useState, useMemo, useEffect } from 'react';
import { ReportService } from '../services/reportService';

export const useBusinessReport = (state) => {
  const [filterDate, setFilterDate] = useState({ start: '', end: '' });
  const [datePreset, setDatePreset] = useState('month');

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const startObj = new Date(now);
    const endObj = new Date(now);
    
    if (preset === 'today') {
      // both stay today
    } else if (preset === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startObj.setDate(diff);
    } else if (preset === 'month') {
      startObj.setDate(1);
    } else if (preset === 'year') {
      startObj.setMonth(0, 1);
    }

    if (preset !== 'custom') {
      const pad = n => n.toString().padStart(2, '0');
      setFilterDate({
        start: `${startObj.getFullYear()}-${pad(startObj.getMonth()+1)}-${pad(startObj.getDate())}`,
        end: `${endObj.getFullYear()}-${pad(endObj.getMonth()+1)}-${pad(endObj.getDate())}`
      });
    }
  };

  useEffect(() => {
    handlePresetChange('month'); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const reportData = useMemo(() => {
    return ReportService.generateBusinessReport(state, filterDate);
  }, [state, filterDate]);

  return {
    filterDate,
    setFilterDate,
    datePreset,
    handlePresetChange,
    reportData
  };
};
