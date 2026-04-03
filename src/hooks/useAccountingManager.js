import { useState, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useListController } from './useListController';

export const useAccountingManager = () => {
  const { state, dispatch } = useData();

  // State
  const [selectedAcc, setSelectedAcc] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(null); // Account Object
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [viewVoucher, setViewVoucher] = useState(null); // Transaction Object

  // Forms
  const [vForm, setVForm] = useState({ id: null, type: 'Chi', accountId: 'ACC1', categoryId: 'FC9', amount: '', note: '', collector: '', payer: '', relatedId: '', date: new Date().toISOString().split('T')[0] });
  const [adjustForm, setAdjustForm] = useState({ actual: '' });
  const [transferForm, setTransferForm] = useState({ fromId: 'ACC1', toId: 'ACC2', amount: '', fee: 0, note: '', date: new Date().toISOString().split('T')[0] });
  const [catForm, setCatForm] = useState({ name: '', type: 'expense' });
  const [confirmDelete, setConfirmDelete] = useState(null); // Transaction ID
  const [viewOrder, setViewOrder] = useState(null); // PO or POS Order for detail view
  const [debtFilters, setDebtFilters] = useState({ supplierId: 'all', channelId: 'all' });

  const [filters, setFilters] = useState({ start: '', end: '', type: 'all', categoryId: 'all', search: '' });
  const [activeJournalTab, setActiveJournalTab] = useState('all'); // all, income, expense, payable, receivable
  const [datePreset, setDatePreset] = useState('this_month'); 
  const [statsFilterDate, setStatsFilterDate] = useState({ start: '', end: '' });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowVoucherModal(false);
        setShowAdjustModal(null);
        setShowTransferModal(false);
        setShowCatModal(false);
        setViewVoucher(null);
        setViewOrder(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    dispatch({ type: 'ADJUST_BALANCE', payload: { accountId: showAdjustModal.id, actualBalance: Number(adjustForm.actual), note: 'Điều chỉnh số dư định kỳ.' } });
    setShowAdjustModal(null);
  };

  // Calculate range for Statistics
  const statsByRange = useMemo(() => {
    const now = new Date();
    let start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    let end = new Date().getTime();

    const today = new Date().setHours(0,0,0,0);
    const yesterday = new Date(today - 24*60*60*1000).getTime();

    if (datePreset === 'today') {
        start = today;
    } else if (datePreset === 'yesterday') {
        start = yesterday;
        end = new Date(yesterday).setHours(23,59,59,999);
    } else if (datePreset === '7days') {
        start = today - 7*24*60*60*1000;
    } else if (datePreset === '30days') {
        start = today - 30*24*60*60*1000;
    } else if (datePreset === 'last_month') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        end = new Date(now.getFullYear(), now.getMonth(), 0).setHours(23,59,59,999);
    } else if (datePreset === 'this_year') {
        start = new Date(now.getFullYear(), 0, 1).getTime();
    } else if (datePreset === 'custom') {
        start = statsFilterDate.start ? new Date(statsFilterDate.start).setHours(0,0,0,0) : new Date(2000,0,1).getTime();
        end = statsFilterDate.end ? new Date(statsFilterDate.end).setHours(23,59,59,999) : new Date().getTime();
    }
    
    return state.transactions.reduce((acc, t) => {
        const tDate = new Date(t.date).getTime();
        if (tDate >= start && tDate <= end) {
            if (t.type === 'Thu') acc.income += t.amount;
            else if (t.type === 'Chi') acc.expense += t.amount;
        }
        return acc;
    }, { income: 0, expense: 0 });
  }, [state.transactions, datePreset, statsFilterDate]);

  const monthlyNet = statsByRange.income - statsByRange.expense;

  const listCtrl = useListController({
    data: state.transactions,
    entityName: 'TRANSACTION',
    onDelete: (id) => dispatch({ type: 'DELETE_TRANSACTION', payload: id }),
    onBulkDelete: (ids) => dispatch({ type: 'BULK_DELETE_TRANSACTION', payload: ids }),
    onRestore: (id) => dispatch({ type: 'RESTORE_TRANSACTION', payload: id }),
    onBulkRestore: (ids) => dispatch({ type: 'BULK_RESTORE_TRANSACTION', payload: ids }),
    onHardDelete: (id) => dispatch({ type: 'HARD_DELETE_TRANSACTION', payload: id }),
    onBulkHardDelete: (ids) => dispatch({ type: 'BULK_HARD_DELETE_TRANSACTION', payload: ids })
  });

  const filteredTransactions = useMemo(() => {
    return state.transactions.filter(t => {
      if (t.deleted) return false;
      // Tab filter
      if (activeJournalTab === 'income' && t.type !== 'Thu') return false;
      if (activeJournalTab === 'expense' && t.type !== 'Chi') return false;

      const matchAcc = !selectedAcc || t.accountId === selectedAcc.id;
      const matchType = filters.type === 'all' || t.type === filters.type;
      const matchCat = filters.categoryId === 'all' || t.categoryId === filters.categoryId;
      const matchSearch = !filters.search || 
        t.note?.toLowerCase().includes(filters.search.toLowerCase()) || 
        t.voucherCode?.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.collector?.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.payer?.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.relatedId?.toLowerCase().includes(filters.search.toLowerCase()); // Link with orders/inventory
      
      const itemDate = new Date(t.date).setHours(0,0,0,0);
      const start = filters.start ? new Date(filters.start).setHours(0,0,0,0) : null;
      const end = filters.end ? new Date(filters.end).setHours(23,59,59,999) : null;
      const matchDate = (!start || itemDate >= start) && (!end || itemDate <= end);
      
      return matchAcc && matchType && matchCat && matchSearch && matchDate;
    });
  }, [state.transactions, filters, selectedAcc, activeJournalTab]);

  const handleVoucherSubmit = (e) => {
    e.preventDefault();
    const payload = { ...vForm, amount: Number(vForm.amount) };
    
    if (vForm.id) {
        dispatch({ type: 'UPDATE_TRANSACTION', payload });
    } else {
        if (vForm.relatedId) {
            // FIX: Robust check for order existence rather than fragile prefix checking
            // This prevents imported or legacy IDs from bypassing status updates
            const isPurchaseOrder = state.purchaseOrders?.some(p => p.id === vForm.relatedId);
            const isPosOrder = state.posOrders?.some(o => o.id === vForm.relatedId);

            if (isPurchaseOrder || vForm.relatedId.startsWith('PO-') || vForm.relatedId.startsWith('NK-')) {
                dispatch({ type: 'UPDATE_PURCHASE_ORDER_STATUS', payload: { id: vForm.relatedId, status: 'Paid', transactionData: payload } });
            } else if (isPosOrder || vForm.relatedId.startsWith('ORD-') || vForm.relatedId.startsWith('POS-') || vForm.relatedId.startsWith('DH-')) {
                dispatch({ type: 'ADD_TRANSACTION', payload });
                dispatch({ type: 'UPDATE_POS_ORDER_STATUS', payload: { id: vForm.relatedId, paymentStatus: 'Paid' } });
            } else {
                dispatch({ type: 'ADD_TRANSACTION', payload });
            }
        } else {
            dispatch({ type: 'ADD_TRANSACTION', payload });
        }
    }
    
    setShowVoucherModal(false);
    setVForm({ id: null, type: 'Chi', accountId: 'ACC1', categoryId: 'FC9', amount: '', note: '', collector: '', payer: '', relatedId: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleEditTransaction = (t) => {
    setVForm({ ...t, amount: t.amount.toString() });
    setShowVoucherModal(true);
  };

  const handleDeleteTransaction = (id) => {
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    setConfirmDelete(null);
  };

  const handleProcessDebt = (item, type) => {
    const isPayable = type === 'payable';
    const supplierName = isPayable ? (state.suppliers?.find(s => s.id === item.supplierId)?.name || item.seller || 'NCC') : null;
    setVForm({
        id: null,
        type: isPayable ? 'Chi' : 'Thu',
        accountId: 'ACC1',
        categoryId: isPayable ? 'FC9' : 'FC2',
        amount: item.totalAmount,
        note: isPayable ? `Thanh toán công nợ đơn nhập ${item.id}` : `Thu tiền công nợ đơn bán ${item.id}`,
        collector: isPayable ? supplierName : 'Cửa hàng',
        payer: isPayable ? 'Cửa hàng' : (item.customerName || 'Khách hàng'),
        relatedId: item.id,
        date: new Date().toISOString().split('T')[0]
    });
    setShowVoucherModal(true);
  };

  const matchCommonFilters = (item, dateField = 'date') => {
      const matchSearch = !filters.search || 
        item.id?.toLowerCase().includes(filters.search.toLowerCase()) || 
        (item.note || '').toLowerCase().includes(filters.search.toLowerCase()) || 
        (item.seller || item.channelName || '').toLowerCase().includes(filters.search.toLowerCase()) ||
        (item.customerName || '').toLowerCase().includes(filters.search.toLowerCase());

      const itemDate = new Date(item[dateField]).setHours(0,0,0,0);
      const start = filters.start ? new Date(filters.start).setHours(0,0,0,0) : null;
      const end = filters.end ? new Date(filters.end).setHours(23,59,59,999) : null;
      return matchSearch && (!start || itemDate >= start) && (!end || itemDate <= end);
  };

  const filteredPayables = state.purchaseOrders
    .filter(p => !p.deleted && p.status !== 'Cancelled')
    .filter(p => p.status !== 'Paid')
    .filter(p => {
        if (debtFilters.supplierId === 'all') return true;
        const sup = state.suppliers?.find(s => s.id === p.supplierId);
        const nameToMatch = sup?.name || p.seller;
        return nameToMatch === debtFilters.supplierId;
    })
    .filter(p => matchCommonFilters(p));

  const filteredReceivables = state.posOrders
    .filter(o => !o.deleted && o.status !== 'Cancelled')
    .filter(o => o.paymentStatus === 'Debt' || o.paymentStatus === 'Unpaid')
    .filter(o => {
        if (debtFilters.channelId === 'all') return true;
        const channelName = (o.channelName || '').toLowerCase();
        if (debtFilters.channelId === 'Grab') return channelName.includes('grab');
        if (debtFilters.channelId === 'Shopee') return channelName.includes('shopee');
        if (debtFilters.channelId === 'Tại quầy') return !channelName.includes('grab') && !channelName.includes('shopee');
        return true;
    })
    .filter(o => matchCommonFilters(o))
    .map(o => ({ ...o, totalAmount: (o.netAmount || 0) + (Number(o.extraFee) || 0) }));

  return {
    state, dispatch,
    models: {
      selectedAcc,
      showVoucherModal,
      showAdjustModal,
      showTransferModal,
      showCatModal,
      viewVoucher,
      vForm,
      adjustForm,
      transferForm,
      catForm,
      confirmDelete,
      viewOrder,
      debtFilters,
      filters,
      activeJournalTab,
      datePreset,
      statsFilterDate,
      statsByRange,
      monthlyNet,
      filteredTransactions,
      filteredPayables,
      filteredReceivables,
      listCtrl
    },
    actions: {
      setSelectedAcc, setShowVoucherModal, setShowAdjustModal, setShowTransferModal, setShowCatModal,
      setViewVoucher, setVForm, setAdjustForm, setTransferForm, setCatForm, setConfirmDelete, setViewOrder,
      setDebtFilters, setFilters, setActiveJournalTab, setDatePreset, setStatsFilterDate,
      handleAdjustSubmit, handleVoucherSubmit, handleEditTransaction, handleDeleteTransaction, handleProcessDebt
    }
  };
};
