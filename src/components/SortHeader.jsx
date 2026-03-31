import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const SortHeader = ({ label, sortKey, sortConfig, onSort, align = 'left', width }) => {
  return (
    <th 
      onClick={() => onSort && onSort(sortKey)} 
      style={{ 
        padding: '14px 12px', 
        fontSize: '12px', 
        fontWeight: 800, 
        textTransform: 'uppercase', 
        cursor: onSort ? 'pointer' : 'default', 
        userSelect: 'none', 
        textAlign: align,
        width: width || 'auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: align === 'right' ? 'flex-end' : (align === 'center' ? 'center' : 'flex-start') }}>
        {label}
        {onSort && sortKey && (
          sortConfig?.key === sortKey 
            ? (sortConfig.direction === 'asc' ? <ChevronUp size={14}/> : <ChevronDown size={14}/>) 
            : <ChevronsUpDown size={14} color="var(--surface-border)"/>
        )}
      </div>
    </th>
  );
};

export default SortHeader;
