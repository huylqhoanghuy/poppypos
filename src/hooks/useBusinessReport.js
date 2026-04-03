import { useState, useMemo, useEffect } from 'react';
import { ReportService } from '../services/reportService';

export const useBusinessReport = (state) => {
  const [filterDate, setFilterDate] = useState({ start: '', end: '' });
  const [datePreset, setDatePreset] = useState('month');

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    let startObj = new Date(now);
    let endObj = new Date(now);
    
    if (preset === 'today') {
      // today
    } else if (preset === 'yesterday') {
      startObj.setDate(now.getDate() - 1);
      endObj.setDate(now.getDate() - 1);
    } else if (preset === '7days') {
      startObj.setDate(now.getDate() - 6);
    } else if (preset === '30days') {
      startObj.setDate(now.getDate() - 29);
    } else if (preset === 'this_month') {
      startObj.setDate(1);
    } else if (preset === 'last_month') {
      startObj.setMonth(now.getMonth() - 1, 1);
      endObj.setMonth(now.getMonth(), 0);
    } else if (preset === 'this_year') {
      startObj.setMonth(0, 1);
    } else if (preset === 'all') {
      startObj.setFullYear(2000, 0, 1);
    }

    if (preset !== 'custom') {
      const pad = n => n.toString().padStart(2, '0');
      setFilterDate({
        start: preset === 'all' ? '' : `${startObj.getFullYear()}-${pad(startObj.getMonth()+1)}-${pad(startObj.getDate())}`,
        end: preset === 'all' ? '' : `${endObj.getFullYear()}-${pad(endObj.getMonth()+1)}-${pad(endObj.getDate())}`
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
