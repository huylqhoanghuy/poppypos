import { useState, useMemo, useEffect } from 'react';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StorageService } from '../services/api/storage';

export const useListController = ({ 
  data = [], 
  entityName = 'ITEM',
  onDelete,
  onBulkDelete,
  onRestore,
  onBulkRestore,
  onHardDelete,
  onBulkHardDelete,
  onShowToast
}) => {
  const { confirm } = useConfirm();
  const { user } = useAuth();
  const { dispatch } = useData();

  const entityKeyMap = {
      'CATEGORY': 'categories',
      'CHANNEL': 'salesChannels',
      'ACCOUNT': 'accounts',
      'FINANCE_CATEGORY': 'financeCategories',
      'INGREDIENT': 'ingredients',
      'PRODUCT': 'products',
      'SUPPLIER': 'suppliers',
      'POS_ORDER': 'posOrders',
      'TRANSACTION': 'transactions'
  };
  const entityKey = entityKeyMap[entityName];

  const [search, setSearch] = useState('');
  const [trashMode, setTrashMode] = useState(false);
  const [viewMode, setViewModeState] = useState(() => {
    return localStorage.getItem(`poppy_view_${entityName}`) || 'table';
  });

  const setViewMode = (mode) => {
    setViewModeState(mode);
    localStorage.setItem(`poppy_view_${entityName}`, mode);
  };

  const [selectedIds, setSelectedIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Date Filtering State
  const [datePreset, setDatePreset] = useState('all');
  const [filterDate, setFilterDate] = useState({ start: '', end: '' });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowForm(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset === 'all' || preset === 'custom') return;
    
    const now = new Date();
    const startObj = new Date(now);
    const endObj = new Date(now);
    
    if (preset === 'today') {
      // both stay now
    } else if (preset === 'week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startObj.setDate(diff);
    } else if (preset === 'month') {
      startObj.setDate(1);
    } else if (preset === 'year') {
      startObj.setMonth(0, 1);
    }

    const pad = n => n.toString().padStart(2, '0');
    setFilterDate({
      start: `${startObj.getFullYear()}-${pad(startObj.getMonth()+1)}-${pad(startObj.getDate())}`,
      end: `${endObj.getFullYear()}-${pad(endObj.getMonth()+1)}-${pad(endObj.getDate())}`
    });
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const activeItems = data.filter(item => !item.deleted);
  const trashItems = data.filter(item => item.deleted && !item.hiddenFromStaff);

  // Filter Active View
  const filteredActiveItems = useMemo(() => {
     return activeItems.filter(item => {
        const matchSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase());
        
        let matchDate = true;
        if (datePreset !== 'all') {
           const itemDate = new Date(item.date || item.createdAt || 0).getTime();
           const start = filterDate.start ? new Date(filterDate.start).setHours(0,0,0,0) : 0;
           const end = filterDate.end ? new Date(filterDate.end).setHours(23,59,59,999) : Infinity;
           matchDate = (itemDate >= start && itemDate <= end);
        }

        return matchSearch && matchDate;
     });
  }, [activeItems, search, filterDate, datePreset]);

  const sortedItems = useMemo(() => {
     let sortableItems = [...filteredActiveItems];
     if (sortConfig.key) {
        sortableItems.sort((a,b) => {
           let valA = a[sortConfig.key];
           let valB = b[sortConfig.key];

           if (sortConfig.key === 'date' || sortConfig.key === 'createdAt') {
              valA = new Date(valA || 0).getTime();
              valB = new Date(valB || 0).getTime();
           } else if (typeof valA === 'string' || typeof valB === 'string') {
              valA = (valA || '').toString();
              valB = (valB || '').toString();
              const cmp = valA.localeCompare(valB, 'vi');
              return sortConfig.direction === 'asc' ? cmp : -cmp;
           }

           valA = valA || 0;
           valB = valB || 0;
           if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
           if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
           return 0;
        });
     }
     return sortableItems;
  }, [filteredActiveItems, sortConfig]);

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const clearSelection = () => setSelectedIds([]);

  const toggleTrashMode = () => {
    setTrashMode(!trashMode);
    setSelectedIds([]);
  };

  const showToast = (message, type = 'success') => {
    if (onShowToast) onShowToast(message, type);
  };

  const handleDelete = async (item) => {
    const isConfirmed = await confirm({
      title: 'Đưa vào Thùng Rác',
      message: `Bạn có chắc muốn đưa "${item.name}" vào thùng rác?`,
      confirmText: 'Đưa vào thùng rác'
    });
    if (isConfirmed) {
      if (onDelete) {
        await onDelete(item.id);
      } else if (entityKey) {
        const list = await StorageService.getCollection(entityKey);
        if (list) {
          const updatedList = list.map(p => p.id === item.id ? { ...p, deleted: true, deletedAt: new Date().toISOString() } : p);
          await StorageService.saveCollection(entityKey, updatedList);
        }
      }
      showToast(`Đã xóa ${item.name} vào thùng rác`);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const isConfirmed = await confirm({
      title: 'Xóa Hàng Loạt',
      message: `Bạn có chắc chắn muốn đưa ${selectedIds.length} mục đã chọn vào thùng rác?`,
      confirmText: 'Đưa vào thùng rác',
      type: 'danger'
    });
    if (isConfirmed) {
      if (onBulkDelete) {
        await onBulkDelete(selectedIds);
      } else if (entityKey) {
        const list = await StorageService.getCollection(entityKey);
        if (list) {
          const updatedList = list.map(item => selectedIds.includes(item.id) ? { ...item, deleted: true, deletedAt: new Date().toISOString() } : item);
          await StorageService.saveCollection(entityKey, updatedList);
        }
      }
      showToast(`Đã đưa ${selectedIds.length} mục vào thùng rác`);
      setSelectedIds([]);
    }
  };

  const handleBulkRestore = async (ids) => {
    if (onBulkRestore) {
      await onBulkRestore(ids);
    } else if (onRestore) {
      for (const id of ids) await onRestore(id);
    } else if (entityKey) {
      const list = await StorageService.getCollection(entityKey);
      if (list) {
        const updatedList = list.map(item => ids.includes(item.id) ? { ...item, deleted: false, deletedAt: null, hiddenFromStaff: false } : item);
        await StorageService.saveCollection(entityKey, updatedList);
      }
    }
    showToast(`Đã khôi phục ${ids.length} mục`);
    setSelectedIds([]);
  };

  const handleBulkHardDelete = async (ids) => {
    const isConfirmed = await confirm({
      title: 'Xóa Vĩnh Viễn',
      message: `CẢNH BÁO: Xóa vĩnh viễn ${ids.length} mục này sẽ không thể khôi phục lại dữ liệu!`,
      confirmText: 'Xóa Vĩnh Viễn',
      type: 'danger'
    });
    if (isConfirmed) {
      if (user?.role !== 'ADMIN' && entityKey) {
          // Fake hard delete => Direct pure storage update to avoid stale DataContext
          const list = await StorageService.getCollection(entityKey);
          if (list) {
             const updatedList = list.map(item => ids.includes(item.id) ? { ...item, hiddenFromStaff: true } : item);
             await StorageService.saveCollection(entityKey, updatedList);
          }
          showToast(`Đã xóa vĩnh viễn ${ids.length} mục`, 'error');
      } else {
          // Real Admin hard delete
          if (onBulkHardDelete) {
             await onBulkHardDelete(ids);
          } else if (onHardDelete) {
             for (const id of ids) await onHardDelete(id);
          } else if (entityKey) {
             const list = await StorageService.getCollection(entityKey);
             if (list) {
               const updatedList = list.filter(item => !ids.includes(item.id));
               await StorageService.saveCollection(entityKey, updatedList);
             }
          }
          showToast(`Đã xóa vĩnh viễn ${ids.length} mục`, 'error');
      }
      setSelectedIds([]);
    }
  };

  return {
    search, setSearch,
    trashMode, toggleTrashMode,
    viewMode, setViewMode,
    datePreset, filterDate, handlePresetChange, setFilterDate,
    selectedIds, toggleSelection, clearSelection, setSelectedIds,
    showForm, setShowForm,
    sortConfig, setSortConfig, handleSort,
    data: sortedItems,
    trashItems,
    filteredActiveItems,
    sortedItems,
    handlers: {
      handleDelete,
      handleBulkDelete,
      handleBulkRestore,
      handleBulkHardDelete,
      showToast
    }
  };
};
