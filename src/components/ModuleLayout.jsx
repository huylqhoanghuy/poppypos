import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, X, LayoutGrid, List as ListIcon, Edit, CheckSquare, Square, Filter, Calendar, ChevronDown } from 'lucide-react';
import UnifiedTrash from './UnifiedTrash';
import BulkActionBar from './BulkActionBar';
import SmartTable from './SmartTable';
import { useAuth } from '../context/AuthContext';
import SmartDatePicker from './SmartDatePicker';

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
  
  // Nút tuỳ chọn trên thanh Header (Bên cạnh Khai báo/ Thùng rác)
  extraHeaderActions = null,

  // Hành vi
  hideTotalBadge = false,

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

  const currentPresetLabel = (() => {
    if (datePreset !== 'custom') return datePresets[datePreset];
    const sDate = filterDate.start ? new Date(filterDate.start).toLocaleDateString('vi-VN') : '...';
    const eDate = filterDate.end ? new Date(filterDate.end).toLocaleDateString('vi-VN') : '...';
    if (sDate === eDate && sDate !== '...') return sDate;
    return `${sDate} - ${eDate}`;
  })();

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
      style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTop: 'none' }}
    />
  );
  const dateFilterBlock = !children && !trashMode && (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', position: 'relative' }} ref={datePickerRef}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 800, color: 'var(--text-secondary)', fontSize: '11px', marginRight: '4px' }}>
            <Filter size={12} /> LỌC NGÀY:
        </div>
          
        <button 
          className="btn btn-ghost"
          style={{ padding: '0 14px', height: '34px', background: 'var(--surface-color)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', display: 'flex', gap: '6px', alignItems: 'center' }}
          onClick={() => setShowDatePicker(!showDatePicker)}
        >
          <Calendar size={16} color="var(--primary)" />
          {currentPresetLabel}
          <ChevronDown size={14} color="var(--text-secondary)" style={{ marginLeft: '2px', transform: showDatePicker ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
        </button>

        {/* Date Picker Popover Panel */}
        {showDatePicker && (
            <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: '0', background: '#FFFFFF', padding: '16px', borderRadius: '12px', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-lg)', zIndex: 110, display: 'flex', gap: '20px', minWidth: '320px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '8px' }}>Mốc thời gian</div>
                  {Object.entries(datePresets).map(([key, label]) => {
                      if (key === 'custom') return null; // Ẩn nút custom
                      return (
                        <button 
                           key={key}
                           onClick={() => { handlePresetChange(key); setShowDatePicker(false); }}
                           style={{ padding: '10px 16px', textAlign: 'left', background: datePreset === key ? 'var(--primary)' : 'transparent', color: datePreset === key ? '#FFF' : 'var(--text-primary)', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, transition: '0.2s', width: '100%' }}
                        >
                           {label}
                        </button>
                      )
                  })}
                </div>
                
                <div style={{ width: '1px', background: 'var(--surface-border)' }}></div>

                <div>
                   <SmartDatePicker 
                      initialStart={filterDate.start}
                      initialEnd={filterDate.end}
                      onConfirm={(start, end) => {
                         let endNormalized = end;
                         if (end) {
                             const e = new Date(end);
                             e.setHours(23, 59, 59, 999);
                             endNormalized = e;
                         }
                         setFilterDate({
                            start: start ? start.toISOString() : null,
                            end: endNormalized ? endNormalized.toISOString() : null
                         });
                         if(datePreset !== 'custom') handlePresetChange('custom');
                         setShowDatePicker(false);
                      }}
                      onCancel={() => setShowDatePicker(false)}
                   />
                </div>
            </div>
        )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingBottom: '32px' }}>
      
      {/* TOOLBAR NGUYÊN KHỐI (Header + BỘ LỌC) */}
      {/* TOOLBAR NGUYÊN KHỐI (Header + BỘ LỌC) */}
      <div className={children ? "" : "glass-panel"} 
           style={{ 
              display: 'flex', flexDirection: 'column',
              background: children ? 'transparent' : 'var(--surface-color)', 
              borderRadius: children ? '0' : (trashMode ? '12px' : '12px 12px 0 0'), 
              border: children ? 'none' : '1px solid var(--surface-border)', 
              borderBottom: children ? 'none' : 'none',
              marginBottom: children ? '24px' : (trashMode ? '24px' : '0')
           }}>
        
        {/* ROW 1: HEADER & CÁC NÚT TỔNG */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: children ? '0' : '8px 16px', borderBottom: children ? 'none' : '1px solid var(--surface-border)' }}>
          
          {/* LEFT COLUMN: TITLE & DESCRIPTION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '280px' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {trashMode && (
                 <button className="btn btn-ghost" style={{ padding: '4px', marginRight: '4px' }} onClick={toggleTrashMode}>
                    <X size={20} color="var(--text-secondary)" />
                 </button>
              )}
              {Icon && <Icon color="var(--primary)" size={24} />} {trashMode ? `Thùng Rác ${title}` : title}
              {!trashMode && !hideTotalBadge && (
                <span style={{ fontSize: '13px', background: '#FFF0E6', color: '#EA580C', padding: '2px 10px', borderRadius: '12px', border: '1px solid #FFD8C4', fontWeight: 900 }}>
                  {(overrideData || filteredActiveItems).length}
                </span>
              )}
            </h2>

            {description && !trashMode && (
               <span style={{ margin: 0, color: '#4B5563', fontSize: '13px', fontWeight: 500, display: 'block' }}>
                 {description.startsWith('-') ? description.substring(1).trim() : description}
               </span>
            )}
          </div>

          {/* MIDDLE COLUMN: SEARCH */}
          {!trashMode && !children && (
            <div style={{ display: 'flex', justifyContent: 'center', flex: 1, minWidth: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-color)', padding: '0 14px', borderRadius: '8px', border: '1px solid var(--surface-border)', width: '100%', maxWidth: '400px', height: '34px' }}>
                <Search size={16} color="var(--text-secondary)" />
                <input 
                  placeholder="Tìm kiếm nhanh..." 
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '13px', fontWeight: 500, height: '100%' }}
                />
              </div>
            </div>
          )}

          {/* RIGHT COLUMN: ACTIONS */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end', minWidth: '280px' }}>
            {/* View Toggle */}
            {!trashMode && activeColumns && renderActiveList && (
              <div style={{ display: 'flex', background: 'var(--surface-variant)', padding: '2px', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                <button 
                  className={`btn btn-ghost ${viewMode === 'table' ? 'active' : ''}`} 
                  style={{ padding: '4px', background: viewMode === 'table' ? '#FFFFFF' : 'transparent', boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none', color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-secondary)' }}
                  onClick={() => setViewMode('table')}
                >
                  <ListIcon size={16} />
                </button>
                <button 
                  className={`btn btn-ghost ${viewMode === 'card' ? 'active' : ''}`} 
                  style={{ padding: '4px', background: viewMode === 'card' ? '#FFFFFF' : 'transparent', boxShadow: viewMode === 'card' ? 'var(--shadow-sm)' : 'none', color: viewMode === 'card' ? 'var(--primary)' : 'var(--text-secondary)' }}
                  onClick={() => setViewMode('card')}
                >
                  <LayoutGrid size={18} />
                </button>
              </div>
            )}

            {extraHeaderActions}

            {!trashMode && listState && canEditOrDelete && (
               <button className="btn btn-primary table-feature-btn" onClick={() => setShowForm(true)}>
                 <Plus size={16} /> <span style={{fontSize: '13px', fontWeight: 600}}>Khai báo mới</span>
               </button>
            )}
          </div>
        </div>
      </div>

      {/* BODY ITERATOR (Children / Table) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children ? children : (
          <>
            {/* Global Banner Custom */}
            {!trashMode && topBanner && topBanner}

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
                (viewMode === 'table' && activeColumns) ? (
                   renderActiveTable && React.isValidElement(renderActiveTable())
                      ? React.cloneElement(renderActiveTable(), {
                          topCustomLeft: (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                 {dateFilterBlock}
                                 {(!trashMode && listState && canEditOrDelete) ? (
                                    <button 
                                      className="btn btn-ghost" 
                                      title="Quản lý thùng rác"
                                      onClick={toggleTrashMode} 
                                      style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--surface-color)', border: '1px dashed var(--danger)', height: '28px', padding: '0 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--danger)', position: 'relative' }}
                                    >
                                       <Trash2 size={12} color="var(--danger)"/> Thùng rác
                                       {trashItems && trashItems.length > 0 && (
                                         <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: 'white', fontSize: '9px', padding: '1px 5px', borderRadius: '10px', fontWeight: 800 }}>
                                           {trashItems.length}
                                         </span>
                                       )}
                                    </button>
                                 ) : null}
                              </div>
                          ),
                          topCustomRight: extraFilters
                        })
                      : (renderActiveTable ? renderActiveTable() : <div/>)
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                     {!children && !trashMode && (
                        <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-color)', borderRadius: '12px 12px 0 0' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               {dateFilterBlock}
                               {(!trashMode && listState && canEditOrDelete) ? (
                                  <button 
                                    className="btn btn-ghost" 
                                    title="Quản lý thùng rác"
                                    onClick={toggleTrashMode} 
                                    style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'var(--surface-color)', border: '1px dashed var(--danger)', height: '32px', padding: '0 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--danger)', position: 'relative' }}
                                  >
                                     <Trash2 size={14} color="var(--danger)"/> Thùng rác
                                     {trashItems && trashItems.length > 0 && (
                                       <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--danger)', color: 'white', fontSize: '9px', padding: '1px 5px', borderRadius: '10px', fontWeight: 800 }}>
                                         {trashItems.length}
                                       </span>
                                     )}
                                  </button>
                               ) : null}
                           </div>
                           {extraFilters && <div style={{ display: 'flex', gap: '8px' }}>{extraFilters}</div>}
                        </div>
                     )}
                     <div style={{ flex: 1 }}>
                        {renderActiveList ? renderActiveList() : <div/>}
                     </div>
                  </div>
                )
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
