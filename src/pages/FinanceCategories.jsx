import React, { useState } from 'react';
import { ListTree, Plus, Edit, Trash2, ArrowRight, CheckSquare, Square } from 'lucide-react';
import { useListController } from '../hooks/useListController';
import { useFinanceCategories } from '../hooks/useFinanceCategories';
import { useData } from '../context/DataContext'; // Tạm để toast
import ModuleLayout from '../components/ModuleLayout';
import SortHeader from '../components/SortHeader';

const FinanceCategories = () => {
  const { financeCategories, addFinanceCategory, updateFinanceCategory, deleteFinanceCategory, hardDeleteFinanceCategory, restoreFinanceCategory, bulkDeleteFinanceCategories, bulkHardDeleteFinanceCategories, bulkRestoreFinanceCategories } = useFinanceCategories();
  const { dispatch } = useData();

  const handleShowToast = (message, type) => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  };

  const listState = useListController({ 
    entityName: 'FINANCE_CATEGORY',
    data: financeCategories,
    onDelete: deleteFinanceCategory,
    onHardDelete: hardDeleteFinanceCategory,
    onRestore: restoreFinanceCategory,
    onBulkDelete: bulkDeleteFinanceCategories,
    onBulkHardDelete: bulkHardDeleteFinanceCategories,
    onBulkRestore: bulkRestoreFinanceCategories,
    onShowToast: handleShowToast
  });

  const { 
    filteredActiveItems, selectedIds, toggleSelection,
    setShowForm,
    handlers: { handleDelete, showToast } 
  } = listState;

  const [form, setForm] = useState({ id: '', name: '', type: 'expense', parentId: null });

  const saveCategory = async (e) => {
    e.preventDefault();
    if (form.id) await updateFinanceCategory(form);
    else await addFinanceCategory(form);
    showToast(`Đã lưu danh mục tài chính "${form.name}"`);
    setShowForm(false);
    setForm({ id: '', name: '', type: 'expense', parentId: null });
  };

  const openAddChild = (parentId) => {
     const parentCat = financeCategories.find(c => c.id === parentId);
     setForm({ id: '', name: '', type: parentCat.type, parentId });
     setShowForm(true);
  };

  React.useEffect(() => {
     if (listState.viewMode !== 'grid') {
        listState.setViewMode('grid');
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasChildren = (id) => (financeCategories || []).some(cat => !cat.deleted && cat.parentId === id);

  const trashColumns = [
    { key: 'name', label: 'Tên DM Tài Chính', render: (v, c) => <strong>{c.name}</strong> },
    { key: 'type', label: 'Tôn Chỉ', render: (v, c) => <span style={{ color: c.type === 'income' ? 'var(--success)' : 'var(--danger)'}}>{c.type === 'income' ? '+ Khoản Thu' : '- Tâm Chi'}</span> },
    { key: 'parentId', label: 'Cấp Bậc', render: (v, c) => c.parentId ? 'Hạng Mục Con' : 'Danh Mục Gốc' }
  ];

  // Cột hiển thị View Active
  const activeColumns = [
    { 
       key: 'name', 
       label: <SortHeader label="Tên Phân Loại" sortKey="name" sortConfig={listState.sortConfig} onSort={listState.handleSort} />, 
       render: (v, c) => <strong>{c.name}</strong> 
    },
    { 
       key: 'type', 
       label: <SortHeader label="Dòng Tiền (Thu/Chi)" sortKey="type" sortConfig={listState.sortConfig} onSort={listState.handleSort} />, 
       render: (v, c) => (
      <span style={{ 
        padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
        background: c.type === 'income' ? '#DCFCE7' : '#FEE2E2',
        color: c.type === 'income' ? '#166534' : '#991B1B'
      }}>
        Báo cáo {c.type === 'income' ? 'Thu nhập' : 'Chi phí'}
      </span>
    ) },
    { key: 'parentId', label: 'Cấp Bậc', render: (v, c) => c.parentId ? <span style={{ color: 'var(--text-secondary)' }}>Hạng Mục Con</span> : <strong>Danh Mục Gốc</strong> }
  ];

  const renderActiveList = () => {
    const expenses = filteredActiveItems.filter(c => c.type === 'expense' && !c.parentId);
    const incomes = filteredActiveItems.filter(c => c.type === 'income' && !c.parentId);

    const renderTree = (categories) => {
        return categories.map(cat => {
            const children = filteredActiveItems.filter(c => c.parentId === cat.id);
            const isSelected = selectedIds.includes(cat.id);
            return (
                <div key={cat.id} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: isSelected ? 'rgba(59, 130, 246, 0.05)' : '#FFFFFF', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--surface-border)'}`, borderRadius: '12px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                           <div style={{ cursor: 'pointer' }} onClick={() => toggleSelection(cat.id)}>
                              {isSelected ? <CheckSquare size={20} color="var(--primary)"/> : <Square size={20} color="var(--text-secondary)"/>}
                           </div>
                           <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: 700 }}>{cat.name}</h4>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {!cat.parentId && (
                               <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => openAddChild(cat.id)} title="Thêm mục con">
                                   <Plus size={16} color="var(--primary)" />
                               </button>
                            )}
                            <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => { setForm(cat); setShowForm(true); }}><Edit size={16}/></button>
                            <button className="btn btn-ghost" style={{ padding: '6px', color: 'var(--danger)' }} onClick={() => handleDelete(cat)} disabled={hasChildren(cat.id)} title={hasChildren(cat.id) ? "Không thể xóa thư mục Mẹ khi còn thư mục Con" : ""} >
                                <Trash2 size={16}/>
                            </button>
                        </div>
                    </div>
                    
                    {/* Render Children */}
                    {children.length > 0 && (
                        <div style={{ paddingLeft: '24px', paddingTop: '12px', borderLeft: '2px solid var(--surface-border)', marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {children.map(child => {
                                const isChildSelected = selectedIds.includes(child.id);
                                return (
                                    <div key={child.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: isChildSelected ? 'rgba(59, 130, 246, 0.05)' : 'var(--surface-variant)', border: `1px solid ${isChildSelected ? 'var(--primary)' : 'var(--surface-border)'}`, borderRadius: '10px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ cursor: 'pointer' }} onClick={() => toggleSelection(child.id)}>
                                               {isChildSelected ? <CheckSquare size={18} color="var(--primary)"/> : <Square size={18} color="var(--text-secondary)"/>}
                                            </div>
                                            <ArrowRight size={14} color="var(--text-secondary)" />
                                            <span style={{ fontSize: '14px', fontWeight: 600 }}>{child.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn btn-ghost" style={{ padding: '4px' }} onClick={() => { setForm(child); setShowForm(true); }}><Edit size={14}/></button>
                                            <button className="btn btn-ghost" style={{ padding: '4px', color: 'var(--danger)' }} onClick={() => handleDelete(child)}>
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )
        });
    };

    return (
        <div className="dashboard-chart-grid-2" style={{ gap: '20px' }}>
          <div>
            <h3 style={{ margin: 0, marginBottom: '20px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', paddingBottom: '12px', borderBottom: '2px solid rgba(34, 197, 94, 0.2)' }}>
              + Khoản Thu Tiền (Income)
            </h3>
            {renderTree(incomes)}
            {incomes.length === 0 && <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '14px' }}>Chưa có danh mục thu tiền nào.</p>}
          </div>
          <div>
            <h3 style={{ margin: 0, marginBottom: '20px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', paddingBottom: '12px', borderBottom: '2px solid rgba(239, 68, 68, 0.2)' }}>
              - Trung Tâm Chi Phí (Expense)
            </h3>
            {renderTree(expenses)}
            {expenses.length === 0 && <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '14px' }}>Chưa có danh mục chi phí nào.</p>}
          </div>
        </div>
    );
  };

  const renderForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <label style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Tên Khoản Mục:</label>
        <input required className="form-input" placeholder="VD: Lương, Mặt bằng, Chuyển phát..." value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Khối Tính Chất:</label>
          <select className="form-input" value={form.type} onChange={e => setForm({...form, type: e.target.value, parentId: null})} disabled={!!form.parentId}>
             <option value="expense">- Phân hệ Chi Phí</option>
             <option value="income">+ Phân hệ Nguồn Thu</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Thư mục Gốc/Nhánh:</label>
          <select className="form-input" value={form.parentId || ''} onChange={e => setForm({...form, parentId: e.target.value || null})}>
             <option value="">-- Thuộc nhánh cao nhất (Root) --</option>
             {filteredActiveItems
                .filter(cat => cat.type === form.type && !cat.parentId && cat.id !== form.id)
                .map(cat => <option key={cat.id} value={cat.id}>Nhánh Mẹ: {cat.name}</option>)
             }
          </select>
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Hủy đóng</button>
        <button className="btn btn-primary" onClick={saveCategory}>Lưu Khai Báo</button>
      </div>
    </div>
  );

  return (
    <ModuleLayout
      title="Hệ Thống Phân Loại Dòng Tiền"
      description="Quản lý cây thư mục thu/chi để kế toán phân loại giao dịch chính xác."
      icon={ListTree}
      listState={listState}
      trashColumns={trashColumns}
      activeColumns={activeColumns}
      onEdit={(cat) => { setForm(cat); setShowForm(true); }}
      formTitle={form.id ? `Cập nhật Code: ${form.name}` : 'Mở Node Kế Toán Mới'}
      renderActiveList={renderActiveList}
      renderForm={renderForm}
    />
  );
};

export default FinanceCategories;
