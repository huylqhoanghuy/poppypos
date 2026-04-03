import React, { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown, Edit2, Trash2, Eye, CheckSquare, Square, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, List as ListIcon, LayoutGrid } from 'lucide-react';
import { useConfirm } from '../context/ConfirmContext';

/**
 * SmartTable - Premium Data Table Component
 * - Hỗ trợ: Pagination (Phân Trang), Auto STT, Tổng (Tổng Footer), Sorting tự động.
 * - Hỗ trợ: Selectable Boxes, View/Edit/Delete actions with Auto-Confirm Alert.
 */
const SmartTable = ({
  data = [],
  columns = [],
  // Mặc định hiện Actions column, truyền false để giấu
  actions = true,
  onEdit,
  onDelete,
  onView,
  extraRowActions, // Callback trả về component tùy chọn thêm (e.g. Approve, Reject)
  
  // Custom delete message config
  confirmBeforeDelete = true,
  deleteConfirmTitle = 'Xóa dữ liệu',
  deleteConfirmMessage = 'Bạn có chắc chắn muốn xóa bản ghi này?',
  
  // Selection
  selectable = false,
  selectedIds = [],
  onSelectToggle,
  onSelectAll,
  
  // Phân trang mặc định
  defaultItemsPerPage = 10,
  
  // CSS styles
  style,
  emptyMessage = 'Không có dữ liệu hiển thị.',
  
  // Mở rộng custom row rendering (VD: Click row bung detail)
  onRowClick,
  rowClassName,
  expandedContent,
  
  // Nâng Cấp: View Mode & Nhận dạng Table
  tableId, // ID định danh dùng để lưu prefered viewMode vào localStorage
  defaultView = 'table', // 'table' | 'card'
  renderCardItem, // Function (item, isSelected, toggleSelection) => ReactNode
  tableMinWidth = '800px',
  topCustomLeft,
  topCustomRight
}) => {
  const { confirm } = useConfirm();
  
  const [viewModeState, setViewModeState] = useState(() => {
     if (tableId) return localStorage.getItem(`smart_view_${tableId}`) || defaultView || 'table';
     return defaultView || 'table';
  });

  const setViewMode = (mode) => {
     setViewModeState(mode);
     if (tableId) localStorage.setItem(`smart_view_${tableId}`, mode);
  };

  // Cập nhật viewMode cho các mobile screen (buộc Grid nếu trên Mobile và có renderCardItem)
  useEffect(() => {
     const checkMobile = () => {
        if (window.innerWidth <= 768 && renderCardItem) {
           // Bật Lựa chọn B theo yêu cầu (Auto chuyển sang giao diện Thẻ trên Mobile)
           setViewModeState('card'); 
        }
     };
     checkMobile();
     window.addEventListener('resize', checkMobile);
     return () => window.removeEventListener('resize', checkMobile);
  }, [renderCardItem]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Handle Sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 0. Tạo Index gốc để hỗ trợ Sort theo STT
  const dataWithIndex = useMemo(() => {
     return [...data].map((item, idx) => ({ ...item, _originalIndex: idx }));
  }, [data]);

  // 1. Dữ liệu sau khi Sắp Xếp
  const sortedData = useMemo(() => {
    let sortableItems = [...dataWithIndex];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // Special Sort by Original Index (STT)
        if (sortConfig.key === '_originalIndex') {
           return sortConfig.direction === 'asc' ? a._originalIndex - b._originalIndex : b._originalIndex - a._originalIndex;
        }

        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        // Resolve nested (e.g. product.name) => Note: column config needs exact key, custom sort is better handled externally,
        // but for basic keys, we try our best.
        
        if (typeof valA === 'string' || typeof valB === 'string') {
          valA = (valA || '').toString().toLowerCase();
          valB = (valB || '').toString().toLowerCase();
          const cmp = valA.localeCompare(valB, 'vi');
          return sortConfig.direction === 'asc' ? cmp : -cmp;
        }

        if (typeof valA === 'number' || typeof valB === 'number') {
           valA = valA == null ? 0 : valA;
           valB = valB == null ? 0 : valB;
           if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
           if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
           return 0;
        }
        
        // Dates handling fallback
        const dateA = new Date(valA).getTime();
        const dateB = new Date(valB).getTime();
        if (!isNaN(dateA) && !isNaN(dateB)) {
            if (dateA < dateB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (dateA > dateB) return sortConfig.direction === 'asc' ? 1 : -1;
        }

        return 0;
      });
    }
    return sortableItems;
  }, [dataWithIndex, sortConfig]);

  // 2. Phân Trang (Pagination)
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  // 3. Tính Tổng Footer Sum
  // Chỉ cộng những cột đánh dấu `sum: true` hoặc có hàm `sumFunc` trong config
  const footerSums = useMemo(() => {
    const sums = {};
    columns.forEach(col => {
      if (col.sum || col.sumFunc) {
         sums[col.key] = sortedData.reduce((acc, row) => {
            let val = col.sumFunc ? col.sumFunc(row) : (row[col.key] || 0);
            return acc + (isNaN(parseFloat(val)) ? 0 : parseFloat(val));
         }, 0);
      }
    });
    return sums;
  }, [columns, sortedData]);

  // Actions Delete wrapper
  const handleDeleteClick = async (e, item) => {
    e.stopPropagation();
    if (!confirmBeforeDelete) {
       if (onDelete) onDelete(item);
       return;
    }
    
    const isConfirmed = await confirm({
      title: deleteConfirmTitle,
      message: deleteConfirmMessage.replace('{name}', item.name || item.id || 'bản ghi này'),
      confirmText: 'Đưa vào Thùng Rác',
      type: 'danger'
    });
    if (isConfirmed && onDelete) {
      onDelete(item);
    }
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  const renderPagination = (position = 'bottom') => (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: position === 'top' ? '6px 16px' : '12px 16px', background: position === 'top' ? '#f0f2f5' : 'var(--surface-color)', borderTop: position === 'bottom' ? '1px solid var(--surface-border)' : 'none', borderBottom: position === 'top' ? '1px solid var(--surface-border)' : 'none', flexWrap: 'wrap', gap: '12px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Kích thước:</span>
            <select 
              value={itemsPerPage} 
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              style={{ padding: '0 10px', height: '34px', background: 'var(--surface-variant)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', outline: 'none' }}
            >
              <option value={10}>10 dòng</option>
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
              <option value={100}>100 dòng</option>
            </select>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              (Tổng: <strong style={{ color: 'var(--text-primary)' }}>{sortedData.length}</strong>)
            </span>

            {position === 'top' && topCustomLeft && (
               <div style={{ display: 'flex', alignItems: 'center', borderLeft: '1px solid var(--surface-border)', paddingLeft: '12px', marginLeft: '4px' }}>
                  {topCustomLeft}
               </div>
            )}
         </div>

         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {position === 'top' && topCustomRight && (
               <div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid var(--surface-border)', paddingRight: '12px', marginRight: '4px' }}>
                  {topCustomRight}
               </div>
            )}

            {/* View Toggles - Only show on TOP pagination if renderCardItem is provided */}
            {position === 'top' && renderCardItem && (
                <div style={{ display: 'flex', background: 'var(--surface-variant)', padding: '2px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                   <button 
                     className="btn btn-ghost"
                     style={{ padding: '6px', background: viewModeState === 'table' ? '#FFFFFF' : 'transparent', boxShadow: viewModeState === 'table' ? 'var(--shadow-sm)' : 'none', color: viewModeState === 'table' ? 'var(--primary)' : 'var(--text-secondary)', transition: 'background 0.2s', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                     onClick={() => setViewMode('table')}
                     title="Giao diện bảng"
                   >
                     <ListIcon size={16} />
                   </button>
                   <button 
                     className="btn btn-ghost"
                     style={{ padding: '6px', background: viewModeState === 'card' ? '#FFFFFF' : 'transparent', boxShadow: viewModeState === 'card' ? 'var(--shadow-sm)' : 'none', color: viewModeState === 'card' ? 'var(--primary)' : 'var(--text-secondary)', transition: 'background 0.2s', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                     onClick={() => setViewMode('card')}
                     title="Giao diện lưới thẻ"
                   >
                     <LayoutGrid size={16} />
                   </button>
                </div>
            )}

            {/* Pagination Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button className="btn btn-ghost" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} style={{ padding: '4px', opacity: currentPage === 1 ? 0.4 : 1 }} title="Trang Đầu Tiên">
                   <ChevronsLeft size={18} />
                </button>
                <button className="btn btn-ghost" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} style={{ padding: '4px', opacity: currentPage === 1 ? 0.4 : 1 }} title="Trang Trước">
                   <ChevronLeft size={18} />
                </button>
                
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '28px', padding: '0 12px', background: 'var(--surface-variant)', border: '1px solid var(--surface-border)', borderRadius: '6px', fontSize: '13px', fontWeight: 700, minWidth: '70px', textAlign: 'center' }}>
                   {currentPage} / {totalPages}
                </span>

                <button className="btn btn-ghost" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} style={{ padding: '4px', opacity: (currentPage === totalPages || totalPages === 0) ? 0.4 : 1 }} title="Trang Sau">
                   <ChevronRight size={18} />
                </button>
                <button className="btn btn-ghost" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} style={{ padding: '4px', opacity: (currentPage === totalPages || totalPages === 0) ? 0.4 : 1 }} title="Trang Cuối">
                   <ChevronsRight size={18} />
                </button>
            </div>
         </div>
      </div>
  );

  return (
    <div className="smart-table-wrapper" style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--surface-border)', overflow: 'hidden', ...style }}>
      
      {/* Top Pagination + Toolbar */}
      {renderPagination('top')}

      {viewModeState === 'card' && renderCardItem ? (
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', padding: '20px', background: 'var(--bg-color)' }}>
            {currentData.length === 0 ? (
               <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontWeight: 600 }}>{emptyMessage}</div>
            ) : (
               currentData.map((item, index) => (
                  <div key={item.id || index}>
                     {renderCardItem(item, selectedIds.includes(item.id), () => onSelectToggle && onSelectToggle(item.id))}
                  </div>
               ))
            )}
         </div>
      ) : (
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}>
        <table className="glass-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: tableMinWidth }}>
          <thead>
            <tr style={{ background: 'var(--surface-variant)', borderBottom: '2px solid var(--surface-border)' }}>
              {/* Cột Checkbox */}
              {selectable && (
                <th style={{ padding: '16px 12px', width: '40px', cursor: 'pointer', textAlign: 'center' }} onClick={onSelectAll}>
                  {isAllSelected ? <CheckSquare size={18} color="var(--primary)"/> : <Square size={18} color="var(--text-secondary)"/>}
                </th>
              )}
              
              {/* Cột STT mặc định - Bấm vào sẽ đảo ngược mảng gốc */}
              <th 
                 style={{ padding: '16px 12px', width: '60px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px', textAlign: 'center', cursor: 'pointer' }}
                 onClick={() => handleSort('_originalIndex')}
              >
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    STT
                    {sortConfig.key === '_originalIndex' && (
                       sortConfig.direction === 'asc' ? <ChevronDown size={14} color="var(--primary)" /> : <ChevronUp size={14} color="var(--primary)" />
                    )}
                 </div>
              </th>

              {/* Từng Cột Cấu Hình */}
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  style={{ 
                    padding: '16px 12px', 
                    color: 'var(--text-secondary)', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    fontSize: '12px',
                    textAlign: col.align || 'left',
                    width: col.width,
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                  onClick={() => col.sortable && handleSort(col.sortKey || col.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: col.align === 'right' ? 'flex-end' : (col.align === 'center' ? 'center' : 'flex-start') }}>
                    {col.label}
                    {col.sortable && sortConfig.key === (col.sortKey || col.key) && (
                      sortConfig.direction === 'asc' ? <ChevronUp size={14} color="var(--primary)" /> : <ChevronDown size={14} color="var(--primary)" />
                    )}
                  </div>
                </th>
              ))}

              {/* Cột Action */}
              {actions && (
                <th style={{ padding: '16px 12px', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', fontSize: '12px', textAlign: 'right', width: '120px' }}>
                  Thao Tác
                </th>
              )}
            </tr>
          </thead>
          
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0) + 1} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentData.map((item, rowIndex) => {
                const isSelected = selectedIds.includes(item.id);
                // Số tự động: (Trang hiện tại - 1) * Số dòng + (Vị trí dòng hiện tại + 1)
                const serialNumber = (currentPage - 1) * itemsPerPage + rowIndex + 1;
                
                return (
                  <React.Fragment key={item.id || rowIndex}>
                    <tr 
                      className={`table-row-hover ${rowClassName ? (typeof rowClassName === 'function' ? rowClassName(item) : rowClassName) : ''}`} 
                      style={{ 
                        borderBottom: '1px solid var(--surface-border)', 
                        background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent', 
                        cursor: onRowClick ? 'pointer' : 'default',
                        transition: 'background 0.2s',
                        transform: 'none'
                      }}
                      onClick={() => onRowClick && onRowClick(item)}
                    >
                      {/* Cột Checkbox */}
                      {selectable && (
                        <td style={{ padding: '14px 12px', textAlign: 'center' }} onClick={(e) => { e.stopPropagation(); onSelectToggle && onSelectToggle(item.id); }}>
                          {isSelected ? <CheckSquare size={18} color="var(--primary)"/> : <Square size={18} color="var(--text-secondary)"/>}
                        </td>
                      )}
                      
                      {/* Cột STT */}
                      <td style={{ padding: '14px 12px', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '13px' }}>
                        {serialNumber}
                      </td>

                      {/* Các Ô Dữ Liệu */}
                      {columns.map((col, idx) => (
                        <td key={idx} style={{ padding: '14px 12px', textAlign: col.align || 'left', color: 'var(--text-primary)', fontSize: '13px' }}>
                          {col.render ? col.render(item[col.key], item) : item[col.key]}
                        </td>
                      ))}

                      {/* Cột Hành Động */}
                      {actions && (
                        <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }} onClick={e => e.stopPropagation()}>
                            {extraRowActions && extraRowActions(item)}
                            {onView && (
                              <button className="btn btn-ghost" title="Xem Chi Tiết" style={{ padding: '6px', color: 'var(--text-secondary)' }} onClick={(e) => { e.stopPropagation(); onView(item); }}>
                                <Eye size={16}/>
                              </button>
                            )}
                            {onEdit && (
                              <button className="btn btn-ghost" title="Sửa Đổi" style={{ padding: '6px', color: 'var(--primary)' }} onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                                <Edit2 size={16}/>
                              </button>
                            )}
                            {onDelete && (
                              <button className="btn btn-ghost" title="Thùng Rác" style={{ padding: '6px' }} onClick={(e) => handleDeleteClick(e, item)}>
                                <Trash2 size={16} color="var(--danger)"/>
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                    {expandedContent && expandedContent(item)}
                  </React.Fragment>
                );
              })
            )}
          </tbody>

          {/* Hàng Tính Tổng Tự Động */}
          {Object.keys(footerSums).length > 0 && totalPages > 0 && (
            <tfoot style={{ background: 'var(--surface-variant)', borderTop: '2px solid var(--surface-border)' }}>
              <tr>
                {selectable && <td style={{ padding: '16px 12px' }}></td>}
                
                {/* STT Column - Use as label if first sum is at index 0 */}
                <td style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '12px' }}>
                   {columns.findIndex(c => c.sum || c.sumFunc) === 0 ? 'TỔNG CỘNG:' : ''}
                </td>

                {columns.map((col, idx) => {
                   const firstSumIdx = columns.findIndex(c => c.sum || c.sumFunc);
                   
                   // Nếu đây là cột tính tổng
                   if (col.sum || col.sumFunc) {
                      return (
                        <td key={idx} style={{ padding: '16px 12px', textAlign: col.align || 'left', fontWeight: 900, fontSize: '15px', color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                          {col.sumRender 
                             ? col.sumRender(footerSums[col.key], footerSums)
                             : `${Math.round(footerSums[col.key] || 0).toLocaleString('vi-VN')} ${col.sumSuffix || ''}`
                          }
                        </td>
                      );
                   }
                   
                   // Nếu đây là cột ngay sát cột tính tổng đầu tiên -> Hiển thị text "TỔNG CỘNG"
                   if (idx === firstSumIdx - 1) {
                      return (
                         <td key={idx} style={{ padding: '16px 12px', textAlign: 'right', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '12px' }}>
                            TỔNG CỘNG:
                         </td>
                      )
                   }
                   
                   // Các cột còn lại để trống
                   return <td key={idx} style={{ padding: '16px 12px' }}></td>;
                })}
                
                {actions && <td style={{ padding: '16px 12px' }}></td>}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      )}
      
      {/* Bottom Pagination */}
      {renderPagination('bottom')}
    </div>
  );
};

export default SmartTable;
