import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, TrendingUp, PackageMinus } from 'lucide-react';
import { useListController } from './useListController';
import { useData } from '../context/DataContext';
import { OrderApi } from '../services/api/orderService';

export const useOrdersManager = () => {
  const { state, dispatch, syncToCloud } = useData();
  const { posOrders } = state;

  const handleShowToast = (message, type) => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  };

  const listState = useListController({ 
    entityName: 'POS_ORDER',
    data: posOrders,
    onDelete: async (id) => { await OrderApi.delete(id); showToast('Đã đưa đơn hàng vào Thùng rác!'); },
    onHardDelete: async (id) => { await OrderApi.hardDelete(id); showToast('Đã xóa vĩnh viễn đơn hàng!'); },
    onRestore: async (id) => { await OrderApi.restore(id); showToast('Đã khôi phục đơn hàng!'); },
    onBulkDelete: async (ids) => { await OrderApi.bulkDelete(ids); showToast('Đã xóa nhiều đơn hàng!'); },
    onBulkHardDelete: async (ids) => { await OrderApi.bulkHardDelete(ids); showToast('Đã xóa vĩnh viễn nhiều đơn hàng!'); },
    onBulkRestore: async (ids) => { await OrderApi.bulkRestore(ids); showToast('Đã khôi phục nhiều đơn hàng!'); },
    onShowToast: handleShowToast
  });

  const { 
    filteredActiveItems, selectedIds, toggleSelection,
    showForm, setShowForm,
    search, setSearch,
    handlers: { handleDelete, showToast } 
  } = listState;

  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setExpandedOrderId(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const [formData, setFormData] = useState({ id: '', customerName: '', date: '', netAmount: 0, channelId: '' });

  const handleEdit = (order) => {
     setFormData({ ...order, netAmount: order.netAmount || 0, date: new Date(order.date).toISOString().split('T')[0] });
     setShowForm(true);
  };

  const handleSave = async () => {
     await OrderApi.update(formData);
     setShowForm(false);
     showToast('Đã lưu thay đổi đơn hàng!');
  };

  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const displayOrders = useMemo(() => {
    let filtered = filteredActiveItems.filter(o => {
      const matchStatus = filterStatus === 'all' || o.status === filterStatus;
      return matchStatus;
    });

    filtered = filtered.map(o => {
      const liveChannel = state.salesChannels?.find(c => c.name === o.channelName || c.id === o.channelId);
      return { ...o, liveChannelName: liveChannel ? liveChannel.name : (o.channelName || 'Trực tiếp') };
    });

    if (filterChannel !== 'all') {
      filtered = filtered.filter(o => o.liveChannelName.toLowerCase().includes(filterChannel.toLowerCase()));
    }

    filtered.sort((a,b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'date') {
        valA = new Date(valA || 0).getTime();
        valB = new Date(valB || 0).getTime();
      } else if (sortConfig.key === 'orderCode') {
        valA = (a.orderCode || a.id || '').toString();
        valB = (b.orderCode || b.id || '').toString();
      } else if (sortConfig.key === 'customerName') {
        valA = (a.customerName || 'Khách vãng lai').toString();
        valB = (b.customerName || 'Khách vãng lai').toString();
      } else if (sortConfig.key === 'liveChannelName') {
        valA = (a.liveChannelName || a.channelName || 'Trực tiếp').toString();
        valB = (b.liveChannelName || b.channelName || 'Trực tiếp').toString();
      } else if (sortConfig.key === 'totalAmount') {
        valA = Number(a.totalAmount) || 0;
        valB = Number(b.totalAmount) || 0;
      } else if (sortConfig.key === 'netAmount') {
        valA = (Number(a.netAmount) || 0) + (Number(a.extraFee) || 0);
        valB = (Number(b.netAmount) || 0) + (Number(b.extraFee) || 0);
      } else if (sortConfig.key === 'status') {
        valA = (a.status || '').toString();
        valB = (b.status || '').toString();
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB, 'vi');
        return sortConfig.direction === 'asc' ? cmp : -cmp;
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [filteredActiveItems, filterStatus, filterChannel, sortConfig, state.salesChannels]);

  const updateStatus = async (orderId, status) => {
    if (status === 'Cancelled') {
        await OrderApi.cancel(orderId);
    } else {
        const order = state.posOrders.find(o => o.id === orderId);
        if (order) {
           await OrderApi.update({ ...order, status });
        }
    }
    showToast(`Đã chuyển trạng thái đơn hàng thành ${status}`);
  };

  const toggleExpand = (id) => setExpandedOrderId(expandedOrderId === id ? null : id);
  const selectedOrder = expandedOrderId ? state.posOrders.find(o => o.id === expandedOrderId) : null;

  return {
    state, dispatch, posOrders,
    listState,
    expandedOrderId, setExpandedOrderId,
    filterStatus, setFilterStatus,
    filterChannel, setFilterChannel,
    formData, setFormData,
    handleEdit, handleSave,

    sortConfig, setSortConfig, handleSort,
    displayOrders,
    updateStatus, toggleExpand, selectedOrder,
    filteredActiveItems, selectedIds, toggleSelection, showForm, setShowForm, search, setSearch, handleDelete, showToast
  };
};
