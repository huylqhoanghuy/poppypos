import { useState, useMemo } from 'react';
import { FinancialService } from '../services/financialService';

export const useFinancialStatements = (state) => {
  const [activeTab, setActiveTab] = useState('balance');
  const [period, setPeriod] = useState('this_month');
  const [filterDate, setFilterDate] = useState({ start: '', end: '' });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const statements = useMemo(() => {
    return FinancialService.calculateStatements(state, period, filterDate.start, filterDate.end);
  }, [state, period, filterDate]);

  return {
    activeTab,
    setActiveTab,
    period,
    setPeriod,
    filterDate,
    setFilterDate,
    isRefreshing,
    handleRefresh,
    statements
  };
};
