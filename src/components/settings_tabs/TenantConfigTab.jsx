import React, { useState } from 'react';
import { Store, MapPin, Phone, MessageSquare, Image as ImageIcon, Save, CheckCircle2, Wrench } from 'lucide-react';
import { useData } from '../../context/DataContext';
import logoPoppy from '../../assets/logo-poppy.png';

export default function TenantConfigTab() {
  const { state, dispatch, syncToCloud } = useData();
  const settings = state.settings || {};
  
  const [formData, setFormData] = useState({
    storeName: settings.storeName || '',
    branch: settings.branch || '',
    address: settings.address || '',
    phone: settings.phone || '',
    logoUrl: settings.logoUrl || '',
    faviconUrl: settings.faviconUrl || '',
    developerInfo: settings.developerInfo || '',
    developerAbout: settings.developerAbout || '',
    loginFooter: settings.loginFooter || 'Phần Mềm Quản Trị & Bán Hàng © 2026'
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    // Lưu ngay xuống local và cloud
    dispatch({ type: 'UPDATE_SETTINGS', payload: formData });
    try {
       await syncToCloud();
    } catch { /* ignore */ }
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleHealData = async () => {
     if (!window.confirm('Hệ thống sẽ quét toàn bộ Đơn hàng và Sổ quỹ cũ để tìm các lỗi lệch dữ liệu (Ví dụ: Các phiếu thu "Ma" không có đơn gốc) và tự động xóa để phục hồi kho. Bạn có chắc chắn muốn chạy công cụ này?')) return;
     
     const { StorageService } = await import('../../services/api/storage');
     const { TransactionApi } = await import('../../services/api/transactionService');
     const data = await StorageService.getAll();
     const { posOrders = [], transactions = [] } = data;
     
     let fixedCount = 0;
     
     // 1. Tìm các Phiếu Thu "Ma" (Phiếu thu gắn với Đơn hàng nhưng Đơn hàng không tồn tại)
     for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        if (tx.type === 'Thu' && tx.relatedId && tx.categoryName === 'Doanh thu bán hàng' && !tx.deleted) {
            const orderExists = posOrders.find(o => o.id === tx.relatedId);
            if (!orderExists) {
                 // Giao cho hệ thống Core System xử lý toàn bộ cơ chế Dịch Ngược + Hoàn Kho
                 await TransactionApi.delete(tx.id); 
                 fixedCount++;
            }
        }
     }

     // 2. Tìm các Đơn hàng đã Hủy / Xóa nhưng chưa có Phiếu Chi bồi hoàn tiền
     for (let i = 0; i < posOrders.length; i++) {
        const order = posOrders[i];
        if (order.status === 'Cancelled' || order.deleted) {
            const hasThu = transactions.find(t => t.relatedId === order.id && t.type === 'Thu');
            const hasChi = transactions.find(t => t.relatedId === order.id && t.type === 'Chi');
            
            if (hasThu && !hasChi) {
                 // Đơn hàng đã hủy tĩnh nhưng phiếu Thu gốc chưa kèm phiếu chi hoàn tiền
                 const targetAccountId = hasThu.accountId;
                 let accounts = await StorageService.getCollection('accounts');
                 let accIdx = accounts.findIndex(a => a.id === targetAccountId);
                 if (accIdx !== -1) {
                     accounts[accIdx].balance = (Number(accounts[accIdx].balance) || 0) - Number(order.netAmount || 0);
                     await StorageService.saveCollection('accounts', accounts);
                 }
                 
                 let txList = await StorageService.getCollection('transactions');
                 txList.unshift({
                     id: StorageService.generateId('TX-'),
                     voucherCode: StorageService.generateId('PC-'),
                     type: 'Chi',
                     amount: Number(order.netAmount || 0),
                     accountId: targetAccountId,
                     categoryId: 'FC10',
                     categoryName: 'Điều chỉnh số dư',
                     date: new Date().toISOString(),
                     note: `Healer: Hoàn tiền đơn lỗi cũ ${order.id}`,
                     relatedId: order.id,
                     status: 'Completed'
                 });
                 await StorageService.saveCollection('transactions', txList);
                 fixedCount++;
            }
        }
     }
     
     const message = `Hoàn tất Dò Lỗi tự động!\nĐã xử lý phục hồi ${fixedCount} bản ghi bất đồng bộ thông qua Lõi Hệ Thống.`;
     alert(message);
     window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-out' }}>
      
      {/* Hồ sơ cửa hàng */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px)', border: '1px solid var(--surface-border)', borderRadius: '16px', background: 'var(--surface-color)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={20} color="var(--primary)" /> Thông Tin Thương Hiệu
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Tên Cửa Hàng / Hệ Thống</label>
                <input 
                  type="text" 
                  name="storeName"
                  value={formData.storeName} 
                  onChange={handleChange}
                  className="form-input" 
                  placeholder="VD: Xóm Gà POPPY"
                  style={{ fontSize: '15px' }}
                />
            </div>
            
            <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Chi nhánh hiện tại</label>
                <div style={{ position: 'relative' }}>
                    <MapPin size={18} color="var(--text-secondary)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px' }}/>
                    <input 
                    type="text" 
                    name="branch"
                    value={formData.branch} 
                    onChange={handleChange}
                    className="form-input" 
                    placeholder="VD: Trụ sở chính"
                    style={{ paddingLeft: '38px', fontSize: '14px' }}
                    />
                </div>
            </div>

            <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Số điện thoại Hotline</label>
                <div style={{ position: 'relative' }}>
                    <Phone size={18} color="var(--text-secondary)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '12px' }}/>
                    <input 
                    type="text" 
                    name="phone"
                    value={formData.phone} 
                    onChange={handleChange}
                    className="form-input" 
                    placeholder="VD: 1900 1234"
                    style={{ paddingLeft: '38px', fontSize: '14px' }}
                    />
                </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Địa chỉ giao dịch</label>
                <input 
                  type="text" 
                  name="address"
                  value={formData.address} 
                  onChange={handleChange}
                  className="form-input" 
                  placeholder="Nhập địa chỉ đầy đủ..."
                  style={{ fontSize: '14px' }}
                />
            </div>
        </div>
      </div>

      {/* Tùy chỉnh Nhận diện */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px)', border: '1px solid var(--surface-border)', borderRadius: '16px', background: 'var(--surface-color)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={20} color="var(--primary)" /> Nhận Diện Hình Ảnh
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 200px', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>URL Logo Cửa Hàng (Header)</label>
                    <input 
                    type="text" 
                    name="logoUrl"
                    value={formData.logoUrl} 
                    onChange={handleChange}
                    className="form-input" 
                    placeholder="Dán đường dẫn ảnh (http://...) vào đây để sửa Logo mặc định"
                    style={{ fontSize: '14px' }}
                    />
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', marginBottom: 0 }}>
                        Bỏ trống để sử dụng Icon POPPY Mặc định. (Khuyến nghị tỷ lệ 4:1)
                    </p>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>URL Biểu tượng Website (Favicon)</label>
                    <input 
                    type="text" 
                    name="faviconUrl"
                    value={formData.faviconUrl} 
                    onChange={handleChange}
                    className="form-input" 
                    placeholder="http://..."
                    style={{ fontSize: '14px' }}
                    />
                </div>
            </div>
            
            <div style={{ border: '1px dashed var(--surface-border)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px', background: 'var(--bg-color)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>PREVIEW LOGO</span>
                {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} onError={(e) => { e.target.style.display='none' }}/>
                ) : (
                    <img src={logoPoppy} alt="Default Logo" style={{ maxWidth: '100%', maxHeight: '60px', objectFit: 'contain' }} />
                )}
            </div>
        </div>
      </div>

      {/* Thông tin hỗ trợ */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px)', border: '1px solid var(--surface-border)', borderRadius: '16px', background: 'var(--surface-color)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={20} color="var(--primary)" /> Thông Tin Hỗ Trợ Kỹ Thuật
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '20px' }}>
            <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Chữ hiển thị dưới cùng màn nhập (Login Footer)</label>
                <input 
                    type="text" 
                    name="loginFooter"
                    value={formData.loginFooter} 
                    onChange={handleChange}
                    className="form-input" 
                    placeholder="Phần Mềm Quản Trị & Bán Hàng © 2026"
                    style={{ fontSize: '14px' }}
                />
            </div>
            <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Thông Tin Hỗ Trợ Kỹ Thuật (Nối vào sau Form Login)</label>
                <input 
                    type="text" 
                    name="developerInfo"
                    value={formData.developerInfo} 
                    onChange={handleChange}
                    className="form-input" 
                    placeholder="Ví dụ: Dev abc - Liên hệ: 09..."
                    style={{ fontSize: '14px' }}
                />
            </div>
        </div>
      </div>

      {/* Database Doctor Tool */}
      <div style={{ padding: 'clamp(16px, 3vw, 24px)', border: '1px solid #FECACA', borderRadius: '16px', background: '#FEF2F2' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 10px 0', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wrench size={20} color="#DC2626" /> Công Cụ Chữa Lỗi Cơ Sở Dữ Liệu (Data Healer)
        </h3>
        <p style={{ fontSize: '14px', color: '#991B1B', marginBottom: '16px', lineHeight: 1.5 }}>
          Sử dụng công cụ này nếu dữ liệu của bạn trong quá khứ bị kẹt (Ví dụ: Xóa phiếu thu nhưng đơn vị vẫn còn, hoặc hủy đơn nhưng tiền chưa về do mạng rớt). Hệ thống sẽ quét qua toàn bộ sổ quỹ và đơn hàng để vá lỗi đồng bộ tự động.
        </p>
        <button 
           onClick={handleHealData}
           className="btn"
           style={{ background: '#DC2626', color: 'white', fontWeight: 700, padding: '10px 20px', borderRadius: '8px' }}
        >
           🛠️ Chạy Quét & Sửa Lỗi Ngay
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px' }}>
          <button 
             onClick={handleSave}
             disabled={saving}
             className="btn btn-primary" 
             style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px', fontSize: '15px', fontWeight: 600 }}
          >
             {saving ? 'Đang lưu...' : saveSuccess ? <><CheckCircle2 size={18}/> Đã lưu cài đặt</> : <><Save size={18} /> Lưu Cấu Hình</>}
          </button>
      </div>

    </div>
  );
}
