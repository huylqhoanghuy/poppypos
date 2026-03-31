import { useState, useMemo } from 'react';
import { FinancialService } from '../services/financialService';

export const useFinancialStatements = (state) => {
  const [activeTab, setActiveTab] = useState('balance');
  const [period, setPeriod] = useState('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const statements = useMemo(() => {
    return FinancialService.calculateStatements(state, period);
  }, [state, period]);

  return {
    activeTab,
    setActiveTab,
    period,
    setPeriod,
    isRefreshing,
    handleRefresh,
    statements
  };
};
