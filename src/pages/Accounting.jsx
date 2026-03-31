import React from 'react';
import { useAccountingManager } from '../hooks/useAccountingManager';
import AccountingUI from '../components/AccountingUI';

export default function Accounting() {
  const manager = useAccountingManager();
  return <AccountingUI manager={manager} />;
}
