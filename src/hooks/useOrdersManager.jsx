import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingBag, TrendingUp, PackageMinus } from 'lucide-react';
import { useListController } from './useListController';
import { useData } from '../context/DataContext';
import { parseCSVToOrders } from '../utils/csvParser';
import { OrderApi } from '../services/api/orderService';

export const useOrdersManager = () => {
  const { state, dispatch } = useData();
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
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importConfig, setImportConfig] = useState({ channelId: '', content: '', fileName: '' });
  const [previewOrders, setPreviewOrders] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setShowImportModal(false);
        setPreviewOrders(null);
        setExpandedOrderId(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const importableChannels = state.salesChannels?.filter(ch => ch.allowImport === true || ch.allowImport === 'true') || [];

  const handlePreviewCSV = () => {
    if (!importConfig.channelId) return showToast('Vui lòng chọn Kênh Bán Hàng!');
    if (!importConfig.content) return showToast("Vui lòng nhập hoặc copy dữ liệu báo cáo!");
    
    const matchedChannel = state.salesChannels.find(c => c.id === importConfig.channelId);
    if (!matchedChannel) return showToast('Lỗi: Kênh không khả dụng!');

    const parsedArray = parseCSVToOrders(importConfig.content, matchedChannel, state.products);
    if (!parsedArray || parsedArray.length === 0) {
        return showToast('Không tìm thấy dữ liệu hợp lệ trong file!');
    }
    
    setPreviewOrders(parsedArray);
  };

  const [formData, setFormData] = useState({ id: '', customerName: '', date: '', netAmount: 0, channelId: '' });
  
  const handleEdit = (order) => {
     setFormData({ ...order, netAmount: order.netAmount || 0, date: new Date(order.date).toISOString().split('T')[0] });
     listState.setShowForm(true);
  };

  const handleSave = async () => {
     await OrderApi.update(formData);
     listState.setShowForm(false);
     listState.handlers.showToast('Đã lưu thay đổi đơn hàng!');
  };

  const confirmImport = () => {
    const totalOrders = previewOrders.length;
    const totalNet = previewOrders.reduce((sum, o) => sum + o.netAmount, 0);
    
    const topProducts = {};
    previewOrders.forEach(o => o.items.forEach(i => {
         const name = i.product?.name || 'Sản phẩm khác';
         topProducts[name] = (topProducts[name] || 0) + i.quantity;
    }));
    
    const topEntries = Object.entries(topProducts).sort((a,b) => b[1] - a[1]);
    const displayProducts = topEntries.slice(0, 2).map(([k,v]) => `${v} ${k}`).join(', ');
    const moreCount = topEntries.length > 2 ? ` và ${topEntries.length - 2} món khác` : '';

    const summaryNode = (
       <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <strong style={{ fontSize: '15px' }}>Đồng bộ dữ liệu thành công!</strong>
          <div style={{ fontSize: '13px', fontWeight: 500, display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', color: 'var(--text-secondary)' }}>
             <span style={{ display:'flex', alignItems:'center', gap:'6px' }}><ShoppingBag size={14} color="var(--primary)"/> Ghi nhận <strong>{totalOrders}</strong> đơn mới</span>
             <span style={{ display:'flex', alignItems:'center', gap:'6px' }}><TrendingUp size={14} color="var(--success)"/> Doanh thu tăng: <strong>{totalNet.toLocaleString('vi-VN')} đ</strong></span>
             <span style={{ display:'flex', alignItems:'center', gap:'6px' }}><PackageMinus size={14} color="#EA580C"/> Kho vừa giảm: <strong>{displayProducts}{moreCount}</strong></span>
          </div>
       </div>
    );

    dispatch({ 
        type: 'CONFIRM_IMPORT_ORDERS', 
        payload: { orders: previewOrders } 
    });
    setPreviewOrders(null);
    setShowImportModal(false);
    setImportConfig({ channelId: '', content: '', fileName: '' });
    showToast(summaryNode);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportConfig({ ...importConfig, content: event.target.result, fileName: file.name });
    };
    reader.readAsText(file);
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
    showImportModal, setShowImportModal,
    importConfig, setImportConfig,
    previewOrders, setPreviewOrders,
    importableChannels,
    handlePreviewCSV,
    formData, setFormData,
    handleEdit, handleSave, confirmImport, handleFileUpload,
    sortConfig, setSortConfig, handleSort,
    displayOrders,
    updateStatus, toggleExpand, selectedOrder,
    filteredActiveItems, selectedIds, toggleSelection, showForm, setShowForm, search, setSearch, handleDelete, showToast
  };
};
