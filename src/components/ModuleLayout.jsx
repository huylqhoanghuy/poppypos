import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, X, LayoutGrid, List as ListIcon, Edit, CheckSquare, Square, Filter, Calendar, ChevronDown } from 'lucide-react';
import UnifiedTrash from './UnifiedTrash';
import BulkActionBar from './BulkActionBar';
import SmartTable from './SmartTable';
import { useAuth } from '../context/AuthContext';

/**
 * ModuleLayout: Wrapper chuẩn hóa cấu trúc UI Vanilla Premium cho các trang
 */
const ModuleLayout = ({
  title,
  icon: Icon,
  description,
  
  // States từ useDataList
  listState,
  
  // Table Configurations
  activeColumns,   // Mảng cấu hình cột khi viewMode='table'
  onEdit,          // Callback khi ấn sửa ở dạng table
  
  // Trash Configs
  trashColumns,
  
  // Custom Filters (nằm cạnh Search)
  extraFilters = null,
  
  // Custom Banner (Above Table/List)
  topBanner,
  
  // Dữ liệu tuỳ chỉnh ghi đè (Dành cho các bảng có tính toán phức tạp như listOrder)
  overrideData,
  
  // Custom Actions inside Active Table Row
  extraRowActions = null,

  // Renderers
  renderActiveList, // child component render active list (ở dạng Grid/Card, fallback)
  renderForm,       // child component render content of Form Modal
  formTitle,        // Title cho Form Modal
  
  // Trẻ em (Dành cho kiến trúc CHS mới)
  children
}) => {
  // Graceful fallback for components that have migrated to CHS and don't use listState
  const safeListState = listState || {
    search: '', setSearch: () => {},
    trashMode: false, toggleTrashMode: () => {},
    viewMode: 'grid', setViewMode: () => {},
    datePreset: 'all', filterDate: { start: '', end: '' }, handlePresetChange: () => {}, setFilterDate: () => {},
    selectedIds: [], clearSelection: () => {},
    showForm: false, setShowForm: () => {},
    trashItems: [],
    filteredActiveItems: [],
    handlers: { handleBulkDelete: () => {}, handleBulkRestore: () => {}, handleBulkHardDelete: () => {} }
  };

  const {
    search = '', setSearch = () => {},
    trashMode = false, toggleTrashMode = () => {},
    viewMode = 'grid', setViewMode = () => {},
    datePreset = 'all', filterDate = { start: '', end: '' }, handlePresetChange = () => {}, setFilterDate = () => {},
    selectedIds = [], clearSelection = () => {},
    showForm = false, setShowForm = () => {},
    trashItems = [],
    filteredActiveItems = [], 
    handlers = {}
  } = safeListState;

  const { user } = useAuth();
  const canEditOrDelete = user?.role !== 'CASHIER';
  const role = user?.role;

  const { 
    handleBulkDelete = () => {}, 
    handleBulkRestore = () => {}, 
    handleBulkHardDelete = () => {} 
  } = handlers;

  // State cho Date Picker Popover
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);

  useEffect(() => {
     const handleClickOutside = (event) => {
        if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
           setShowDatePicker(false);
        }
     };
     const handleEsc = (e) => {
        if (e.key === 'Escape') setShowDatePicker(false);
     };

     document.addEventListener('mousedown', handleClickOutside);
     window.addEventListener('keydown', handleEsc);
     return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('keydown', handleEsc);
     };
  }, []);

  const datePresets = {
     'all': 'Tất cả thời gian',
     'today': 'Hôm nay',
     'week': 'Tuần này',
     'month': 'Tháng này',
     'year': 'Năm nay',
     'custom': 'Tuỳ chọn'
  };

  const currentPresetLabel = datePreset === 'custom' 
        ? `${filterDate.start ? new Date(filterDate.start).toLocaleDateString('vi-VN') : '...'} - ${filterDate.end ? new Date(filterDate.end).toLocaleDateString('vi-VN') : '...'}`
        : datePresets[datePreset];

  // Generic Reusable Active Table
  const renderActiveTable = () => (
    <SmartTable 
      data={overrideData || filteredActiveItems}
      columns={activeColumns}
      confirmBeforeDelete={false} // listState.handlers.handleDelete already has Confirm Box
      onEdit={canEditOrDelete ? onEdit : null}
      onDelete={canEditOrDelete ? listState.handlers.handleDelete : null}
      extraRowActions={extraRowActions}
      selectable={canEditOrDelete}
      selectedIds={selectedIds}
      onSelectToggle={canEditOrDelete ? ((id) => listState.toggleSelection(id)) : undefined}
      onSelectAll={canEditOrDelete ? (() => {
        if (selectedIds.length === filteredActiveItems.length && filteredActiveItems.length > 0) clearSelection();
        else listState.setSelectedIds(filteredActiveItems.map(i => i.id));
      }) : undefined}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingBottom: '32px' }}>
      {/* Header H1 & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            {Icon && <Icon color="var(--primary)" />} {title}
          </h2>
          {description && (
             <p style={{ margin: 0, marginTop: '4px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
               {description}
             </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* View Toggle */}
          {!trashMode && activeColumns && renderActiveList && (
            <div style={{ display: 'flex', background: 'var(--surface-variant)', padding: '4px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
              <button 
                className={`btn btn-ghost ${viewMode === 'table' ? 'active' : ''}`} 
                style={{ padding: '6px', background: viewMode === 'table' ? '#FFFFFF' : 'transparent', boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none', color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-secondary)' }}
                onClick={() => setViewMode('table')}
              >
                <ListIcon size={18} />
              </button>
              <button 
                className={`btn btn-ghost ${viewMode === 'card' ? 'active' : ''}`} 
                style={{ padding: '6px', background: viewMode === 'card' ? '#FFFFFF' : 'transparent', boxShadow: viewMode === 'card' ? 'var(--shadow-sm)' : 'none', color: viewMode === 'card' ? 'var(--primary)' : 'var(--text-secondary)' }}
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          )}

          {canEditOrDelete && (
            <button 
              className={`btn ${trashMode ? 'btn-danger' : 'btn-outline'}`} 
              onClick={toggleTrashMode} 
              style={{ display: listState ? 'flex' : 'none', gap: '8px', alignItems: 'center' }}
            >
              <Trash2 size={18} /> {trashMode ? 'Thoát Thùng rác' : `Thùng rác (${trashItems.length})`}
            </button>
          )}
          {!trashMode && listState && canEditOrDelete && (
             <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
               <Plus size={18} /> Khai báo mới
             </button>
          )}
        </div>
      </div>

      {/* Body: Danh Sách hoặc Thùng Rác */}
      <div className="glass-panel" style={{ flex: 1, padding: children ? '0' : '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: children ? 'transparent' : 'var(--bg-color)', border: children ? 'none' : '1px solid var(--surface-border)' }}>
        
        {/* Render CHS Component directly if children is provided */}
        {children ? children : (
          <>
            {/* Thanh Search / Lọc luôn hiện (trừ phi đang trong Trash Mode) */}
            {!trashMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            {/* BỘ LỌC + XUẤT */}
            <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
               {/* Date Filters (Refactored to 1 Panel) */}
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', position: 'relative' }} ref={datePickerRef}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '13px', marginRight: '8px' }}>
                       <Filter size={16} /> LỌC NGÀY:
                   </div>
                   
                   <button 
                      className="btn btn-ghost"
                      style={{ padding: '8px 16px', background: 'var(--surface-variant)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', display: 'flex', gap: '8px', alignItems: 'center' }}
                      onClick={() => setShowDatePicker(!showDatePicker)}
                   >
                      <Calendar size={16} color="var(--primary)" />
                      {currentPresetLabel}
                      <ChevronDown size={14} color="var(--text-secondary)" style={{ marginLeft: '4px', transform: showDatePicker ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                   </button>

                   {/* Date Picker Popover Panel */}
                   {showDatePicker && (
                       <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '0', background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-lg)', zIndex: 110, display: 'flex', gap: '20px', minWidth: '320px' }}>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Mốc thời gian</div>
                              {Object.entries(datePresets).map(([key, label]) => {
                                 if (key === 'custom') return null; // Ẩn nút custom
                                 return (
                                    <button 
                                      key={key}
                                      onClick={() => { handlePresetChange(key); setShowDatePicker(false); }}
                                      style={{ padding: '8px 12px', textAlign: 'left', background: datePreset === key ? 'var(--primary)' : 'transparent', color: datePreset === key ? '#FFF' : 'var(--text-primary)', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, transition: '0.2s' }}
                                    >
                                      {label}
                                    </button>
                                 )
                              })}
                           </div>
                           
                           <div style={{ width: '1px', background: 'var(--surface-border)' }}></div>

                           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1.5 }}>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tuỳ chọn từ khoá</div>
                              <div>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Từ ngày (00:00)</label>
                                <input type="date" className="form-input" style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }} value={filterDate.start} onChange={e => { setFilterDate({...filterDate, start: e.target.value}); if(datePreset!=='custom') handlePresetChange('custom'); }} />
                              </div>
                              <div>
                                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Đến ngày (23:59)</label>
                                <input type="date" className="form-input" style={{ width: '100%', padding: '8px 12px', fontSize: '13px' }} value={filterDate.end} onChange={e => { setFilterDate({...filterDate, end: e.target.value}); if(datePreset!=='custom') handlePresetChange('custom'); }} />
                              </div>
                              <button className="btn btn-primary" style={{ marginTop: 'auto', padding: '8px', fontSize: '13px', display: 'flex', justifyContent: 'center' }} onClick={() => setShowDatePicker(false)}>Xong</button>
                           </div>
                       </div>
                   )}
               </div>

               {/* Search & Extra */}
               <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surface-variant)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)', flex: 1, maxWidth: '320px' }}>
                   <Search size={16} color="var(--text-secondary)" />
                   <input 
                     placeholder="Tìm kiếm nhanh..." 
                     value={search} onChange={e => setSearch(e.target.value)}
                     style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '14px', fontWeight: 500 }}
                   />
                 </div>
                 {extraFilters}
               </div>
            </div>
          </div>
        )}

        {/* Global Banner (Top) */}
        {!trashMode && (topBanner !== undefined ? topBanner : (
          <div style={{ marginBottom: '24px', padding: '16px 24px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow-sm)' }}>
               <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {Icon ? <Icon size={24}/> : <ListIcon size={24} />}
               </div>
               <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                     Tổng Số Lượng ({title})
                  </div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', lineHeight: 1 }}>
                     {(overrideData || filteredActiveItems).length}
                  </div>
               </div>
          </div>
        ))}

        {/* Dynamic Rendering */}
        <div style={{ flex: 1 }}>
            {trashMode ? (
              <UnifiedTrash 
                  items={trashItems}
                  columns={trashColumns}
                  // For UnifiedTrash, it expects direct dispatches or single handler arrays. 
                  // Since UnifiedTrash supports single actions via prop callbacks, we'll map them:
                  onRestore={(id) => handleBulkRestore([id])}
                  onHardDelete={(id) => handleBulkHardDelete([id])}
                  onBulkRestore={handleBulkRestore}
                  onBulkHardDelete={handleBulkHardDelete}
              />
            ) : (
              (viewMode === 'table' && activeColumns) ? renderActiveTable() : (renderActiveList ? renderActiveList() : <div/>)
            )}
        </div>
        </>
      )}
      </div>

      {/* Form Modal (Dùng chung bộ khung Glass, ruột do page truyền vào) */}
      {showForm && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-color)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-color)', zIndex: 10 }}>
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>{formTitle || 'Khai báo thông tin'}</h3>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ padding: '8px' }}><X size={20}/></button>
            </div>
            {/* Inner Form content injected safely */}
            <div style={{ padding: '24px' }}>
               {renderForm()}
            </div>
          </div>
        </div>
      )}

      {/* Footer: Bulk Action Bar chỉ hiện bản Active có chọn dữ liệu */}
      {(!trashMode && listState && canEditOrDelete) && (
        <BulkActionBar 
          selectedCount={selectedIds.length} 
          onClearSelection={clearSelection} 
          onDeleteSelected={handleBulkDelete} 
        />
      )}
    </div>
  );
};

export default ModuleLayout;
