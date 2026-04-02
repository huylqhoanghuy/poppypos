import React, { useState } from 'react';
import { Tags, Edit, Trash2, CheckSquare, Square } from 'lucide-react';
import { useListController } from '../hooks/useListController';
import { useSalesChannels } from '../hooks/useSalesChannels';
import { useData } from '../context/DataContext'; // Tạm thời để hiện Toast toàn cục
import ModuleLayout from '../components/ModuleLayout';
import SortHeader from '../components/SortHeader';

const Channels = () => {
  const { salesChannels, addSalesChannel, updateSalesChannel, deleteSalesChannel, hardDeleteSalesChannel, restoreSalesChannel, bulkDeleteSalesChannels, bulkHardDeleteSalesChannels, bulkRestoreSalesChannels } = useSalesChannels();
  const { dispatch } = useData();

  const handleShowToast = (message, type) => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  };

  // === 1. Khởi tạo Hook dùng chung ===
  const listState = useListController({ 
    entityName: 'CHANNEL',
    data: salesChannels,
    onDelete: deleteSalesChannel,
    onHardDelete: hardDeleteSalesChannel,
    onRestore: restoreSalesChannel,
    onBulkDelete: bulkDeleteSalesChannels,
    onBulkHardDelete: bulkHardDeleteSalesChannels,
    onBulkRestore: bulkRestoreSalesChannels,
    onShowToast: handleShowToast
  });

  const { 
    filteredActiveItems, selectedIds, toggleSelection,
    setShowForm,
    handlers: { handleDelete, showToast } 
  } = listState;

  // === 2. Khởi tạo State của riêng Modal Form (Tương thích ngược 100%) ===
  const [form, setForm] = useState({ id: '', name: '', commission: 0, platform: 'foodapp', allowImport: false });

  // === 3. Logic Save riêng của Component ===
  const saveChannel = async (e) => {
    e.preventDefault();
    const payload = { ...form, commission: Number(form.commission), allowImport: form.allowImport === 'true' || form.allowImport === true };
    if (form.id) await updateSalesChannel(payload);
    else await addSalesChannel(payload);
    showToast(`Đã lưu kênh bán "${form.name}" thành công!`);
    setShowForm(false);
    setForm({ id: '', name: '', commission: 0, platform: 'foodapp', allowImport: false }); // reset form
  };

  const openEdit = (channel) => {
    setForm(channel);
    setShowForm(true);
  };

  React.useEffect(() => {
     if (listState.viewMode !== 'grid') {
        listState.setViewMode('grid');
     }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trashColumns = [
    { key: 'name', label: 'Tên Kênh', render: (val, c) => <strong>{c.name}</strong> },
    { key: 'platform', label: 'Loại hình', render: (val, c) => c.platform === 'foodapp' ? 'App Giao Đồ Ăn' : 'Bán Lẻ/Social' }
  ];

  // Cấu hình Cột bảng (Grid List)
  const activeColumns = [
    { 
      key: 'name', 
      label: <SortHeader label="Tên Kênh Bán" sortKey="name" sortConfig={listState.sortConfig} onSort={listState.handleSort} />, 
      render: (val, c) => <strong>{c.name}</strong> 
    },
    { 
      key: 'platform', 
      label: 'Loại hình', 
      render: (val, c) => <span style={{ padding: '4px 8px', background: 'var(--surface-variant)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{c.platform === 'foodapp' ? 'App Giao Đồ Ăn' : 'Bán Lẻ/Social'}</span> 
    },
    { 
      key: 'commission', 
      label: <SortHeader label="Phí Nền Tảng (%)" sortKey="commission" sortConfig={listState.sortConfig} onSort={listState.handleSort} align="right" />, 
      render: (val, c) => <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{c.commission}%</span> 
    },
    {
      key: 'allowImport',
      label: <SortHeader label="Quyền Nhập Đơn" sortKey="allowImport" sortConfig={listState.sortConfig} onSort={listState.handleSort} align="center" />,
      render: (val, c) => (c.allowImport === true || c.allowImport === 'true') ? 'Có' : 'Không'
    }
  ];

  // === 4. Hàm Render Grid hiển thị (Child) ===
  const renderActiveList = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
      {filteredActiveItems.map(channel => {
        const isSelected = selectedIds.includes(channel.id);
        return (
          <div key={channel.id} style={{ display: 'flex', flexDirection: 'column', padding: '24px', background: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-color)', borderRadius: '16px', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--surface-border)'}`, boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s', position: 'relative' }}>
            
            <div style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', zIndex: 10 }} onClick={() => toggleSelection(channel.id)}>
              {isSelected ? <CheckSquare size={22} color="var(--primary)"/> : <Square size={22} color="var(--text-secondary)"/>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'var(--surface-variant)', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <Tags size={28} />
              </div>
              <div style={{ paddingRight: '20px' }}>
                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{channel.name}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  <span style={{ padding: '4px 8px', background: 'var(--surface-variant)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>{channel.platform === 'foodapp' ? 'App Giao Đồ Ăn' : 'Bán Lẻ/Social'}</span>
                  <span style={{ padding: '4px 8px', background: 'var(--surface-border)', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Chiết khấu {channel.commission}%</span>
                  {(channel.allowImport === true || channel.allowImport === 'true') && (
                     <span style={{ padding: '4px 8px', background: 'var(--success)', color: 'white', borderRadius: '4px', fontSize: '12px', fontWeight: 600 }}>Cho phép Import</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--surface-border)' }}>
              <button className="btn btn-ghost" style={{ padding: '8px 12px', background: 'var(--surface-variant)', color: 'var(--text-primary)', border: '1px solid var(--surface-border)', borderRadius: '8px', flex: 1 }} onClick={() => openEdit(channel)}>
                <Edit size={16}/> Sửa
              </button>
              <button className="btn btn-ghost" style={{ padding: '8px 12px', background: '#FEF2F2', color: 'var(--danger)', border: '1px solid #FECACA', borderRadius: '8px', flex: 1 }} onClick={() => handleDelete(channel)}>
                <Trash2 size={16}/> Xóa
              </button>
            </div>
          </div>
        )
      })}
    </div>
  );

  // === 5. Hàm Render Layout Form (Child) ===
  const renderForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Tên Kênh bán:</label>
        <input required className="form-input" style={{ width: '100%' }} placeholder="VD: ShopeeFood, GrabMart" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Loại nền tảng:</label>
          <select className="form-input" value={form.platform} onChange={e => setForm({...form, platform: e.target.value})}>
             <option value="foodapp">App Giao Đi (Shopee/Grab/Be)</option>
             <option value="social">Kênh Social (FB/Zalo/Tiktok)</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Phí Môi Giới/Nền tảng (%):</label>
          <input required type="number" step="0.5" className="form-input" placeholder="VD: 25 cho 25%" value={form.commission} onChange={e => setForm({...form, commission: e.target.value})} />
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>Mức phí này áp dụng để tự trừ tự động vào Doanh thu Ròng.</p>
        </div>
        <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
          <label style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom:'6px', display:'block', fontWeight: 600 }}>Cấp quyền Nhập (Import) Dữ liệu Excel/CSV:</label>
          <select className="form-input" style={{ width: '100%' }} value={form.allowImport === true ? 'true' : 'false'} onChange={e => setForm({...form, allowImport: e.target.value})}>
             <option value="false">Không (Chỉ nhập thủ công qua POS)</option>
             <option value="true">Có cho phép Import hàng loạt</option>
          </select>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>Kênh này sẽ xuất hiện trong Danh sách Kênh ở Modal Import của trang Đơn Hàng.</p>
        </div>
      </div>
      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Hủy bỏ</button>
        <button className="btn btn-primary" onClick={saveChannel}>Lưu thông tin</button>
      </div>
    </div>
  );

  return (
    <ModuleLayout
      title="Kênh Phân Phối & Nền Tảng"
      description="Quản lý chiết khấu các App Food để hệ thống POS tự động trừ hoa hồng."
      icon={Tags}
      listState={listState}
      trashColumns={trashColumns}
      activeColumns={activeColumns}
      onEdit={openEdit}
      formTitle={form.id ? `Cập nhật Kênh: ${form.name}` : 'Khai báo Kênh bán mới'}
      renderActiveList={renderActiveList}
      renderForm={renderForm}
    />
  );
};

export default Channels;
