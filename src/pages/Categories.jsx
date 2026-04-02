import React, { useState } from 'react';
import { Tags, Edit, Trash2, CheckSquare, Square } from 'lucide-react';
import { useListController } from '../hooks/useListController';
import { useCategories } from '../hooks/useCategories';
import { useProducts } from '../hooks/useProducts';
import { useData } from '../context/DataContext'; // Tạm giữ Toast
import ModuleLayout from '../components/ModuleLayout';
import SortHeader from '../components/SortHeader';

const Categories = () => {
  const { categories, addCategory, updateCategory, deleteCategory, hardDeleteCategory, restoreCategory, bulkDeleteCategories, bulkHardDeleteCategories, bulkRestoreCategories } = useCategories();
  const { products } = useProducts();
  const { dispatch } = useData();

  const handleShowToast = (message, type) => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  };

  const listState = useListController({ 
    entityName: 'CATEGORY',
    data: categories,
    onDelete: deleteCategory,
    onHardDelete: hardDeleteCategory,
    onRestore: restoreCategory,
    onBulkDelete: bulkDeleteCategories,
    onBulkHardDelete: bulkHardDeleteCategories,
    onBulkRestore: bulkRestoreCategories,
    onShowToast: handleShowToast
  });

  const { 
    filteredActiveItems, selectedIds, toggleSelection,
    setShowForm,
    handlers: { handleDelete, showToast },
    sortConfig, handleSort
  } = listState;

  const [form, setForm] = useState({ id: '', name: '', type: 'menu' });

  const saveCategory = async (e) => {
    e.preventDefault();
    if (form.id) await updateCategory(form);
    else await addCategory(form);
    showToast(`Đã lưu danh mục "${form.name}" thành công!`);
    setShowForm(false);
    setForm({ id: '', name: '', type: 'menu' });
  };

  const openEdit = (cat) => {
    setForm(cat);
    setShowForm(true);
  };

  React.useEffect(() => {
     if (listState.viewMode !== 'grid') {
        listState.setViewMode('grid');
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trashColumns = [
    { key: 'name', label: 'Tên Danh Mục', render: (val, c) => <strong>{c.name}</strong> },
    { key: 'type', label: 'Loại', render: (val, c) => c.type === 'menu' ? 'Thực Đơn' : c.type === 'expense' ? 'Thu Chi' : 'Khác' }
  ];

  const activeColumns = [
    { 
      key: 'name', 
      label: <SortHeader label="Tên Danh Mục" sortKey="name" sortConfig={sortConfig} onSort={handleSort} />, 
      render: (val, c) => <strong>{c.name}</strong> 
    },
    { key: 'type', label: 'Phân Hệ', render: (val, c) => <span style={{ padding: '4px 8px', background: 'var(--surface-variant)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{c.type === 'menu' ? 'Thực Đơn' : 'Thu Chi'}</span> },
    { key: 'items', label: 'Mặt hàng', render: (val, c) => <span style={{ padding: '4px 8px', background: 'var(--surface-border)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{(products || []).filter(p => !p.deleted && p.category === c.name).length} Mục</span> }
  ];

  const renderActiveList = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
      {filteredActiveItems.map(category => {
        const isSelected = selectedIds.includes(category.id);
        const itemCount = (products || []).filter(p => !p.deleted && p.category === category.name).length;
        
        return (
          <div key={category.id} style={{ display: 'flex', flexDirection: 'column', padding: '24px', background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-color)', borderRadius: '16px', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--surface-border)'}`, boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s', position: 'relative' }}>
            
            <div style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', zIndex: 10 }} onClick={() => toggleSelection(category.id)}>
              {isSelected ? <CheckSquare size={22} color="var(--primary)"/> : <Square size={22} color="var(--text-secondary)"/>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--surface-variant)', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Tags size={28} />
              </div>
              <div style={{ paddingRight: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{category.name}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  <span style={{ padding: '4px 8px', background: 'var(--surface-variant)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{category.type === 'menu' ? 'Thực Đơn' : 'Thu Chi'}</span>
                  <span style={{ padding: '4px 8px', background: 'var(--surface-border)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{itemCount} Mặt hàng</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
              <button className="btn btn-ghost" style={{ padding: '8px 12px', background: 'var(--surface-variant)', color: 'var(--text-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px', flex: 1 }} onClick={() => openEdit(category)}>
                <Edit size={16}/> Sửa
              </button>
              <button className="btn btn-ghost" style={{ padding: '8px 12px', background: '#FEF2F2', color: 'var(--danger)', border: '1px solid #FECACA', borderRadius: '8px', flex: 1 }} onClick={() => handleDelete(category)} disabled={itemCount > 0} title={itemCount > 0 ? "Không thể xóa thư mục có sản phẩm" : "Xóa danh mục"}>
                <Trash2 size={16}/> Xóa
              </button>
            </div>
          </div>
        )
      })}
    </div>
  );

  const renderForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Cấu trúc Menu / Group:</label>
        <input required className="form-input" placeholder="VD: Đồ Ăn Trưa" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
      </div>
      <div>
        <label style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Phân Hệ Hoạt Động:</label>
        <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
           <option value="menu">Giao diện Bán POS</option>
           <option value="expense">Khoản phí Giao Hàng</option>
        </select>
      </div>
      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Hủy bỏ</button>
        <button className="btn btn-primary" onClick={saveCategory}>Lưu thông tin</button>
      </div>
    </div>
  );

  return (
    <ModuleLayout
      title="Thiết Lập Menu & Group"
      description="Quản lý cấu trúc danh mục món ăn hiển thị trên màn hình POS."
      icon={Tags}
      listState={listState}
      trashColumns={trashColumns}
      activeColumns={activeColumns}
      onEdit={openEdit}
      formTitle={form.id ? `Cập nhật: ${form.name}` : 'Khai báo Nhóm Mới'}
      renderActiveList={renderActiveList}
      renderForm={renderForm}
    />
  );
};

export default Categories;
