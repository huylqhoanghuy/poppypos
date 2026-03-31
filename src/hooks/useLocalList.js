import { useState, useMemo, useEffect } from 'react';

/**
 * useLocalList: Hook UI quản lý tìm kiếm, sắp xếp, lọc ngày tháng, chọn checkbox
 * Hook này chỉ thuần thao tác trên Array, hoàn toàn không gọi API hay kết nối DataContext.
 */
export const useLocalList = (initialData = []) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showForm, setShowForm] = useState(false);

  // Date Filtering State
  const [datePreset, setDatePreset] = useState('all');

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowForm(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);
  const [filterDate, setFilterDate] = useState({ start: '', end: '' });

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

  // Filter Active View
  const filteredActiveItems = useMemo(() => {
     return initialData.filter(item => {
        const matchSearch = !search || item.name?.toLowerCase().includes(search.toLowerCase()) || item.id?.toLowerCase().includes(search.toLowerCase());
        
        let matchDate = true;
        if (datePreset !== 'all' && item.date) {
           const itemDate = new Date(item.date).getTime();
           const start = filterDate.start ? new Date(filterDate.start).setHours(0,0,0,0) : 0;
           const end = filterDate.end ? new Date(filterDate.end).setHours(23,59,59,999) : Infinity;
           matchDate = (itemDate >= start && itemDate <= end);
        } else if (datePreset !== 'all' && item.createdAt) { // fallback
           const itemDate = new Date(item.createdAt).getTime();
           const start = filterDate.start ? new Date(filterDate.start).setHours(0,0,0,0) : 0;
           const end = filterDate.end ? new Date(filterDate.end).setHours(23,59,59,999) : Infinity;
           matchDate = (itemDate >= start && itemDate <= end);
        }

        return matchSearch && matchDate;
     });
  }, [initialData, search, filterDate, datePreset]);

  const sortedItems = useMemo(() => {
     let sortableItems = [...filteredActiveItems];
     if (sortConfig.key) {
       sortableItems.sort((a, b) => {
         let valA = a[sortConfig.key];
         let valB = b[sortConfig.key];
         if (sortConfig.key === 'date' || sortConfig.key === 'createdAt') {
            valA = valA ? new Date(valA).getTime() : 0;
            valB = valB ? new Date(valB).getTime() : 0;
         } else if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB ? valB.toLowerCase() : '';
         }
         
         if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
         if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
         return 0;
       });
     }
     return sortableItems;
  }, [filteredActiveItems, sortConfig]);

  const toggleSelection = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Data helpers based on selected checkboxes
  const selectedItemsData = useMemo(() => {
      return sortedItems.filter(i => selectedIds.includes(i.id));
  }, [sortedItems, selectedIds]);

  return {
    search, setSearch,
    selectedIds, setSelectedIds, toggleSelection, clearSelection, selectedItemsData,
    sortConfig, handleSort,
    datePreset, handlePresetChange, filterDate, setFilterDate,
    showForm, setShowForm,
    filteredActiveItems: sortedItems
  };
};
