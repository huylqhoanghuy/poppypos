import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Flame, Image as ImageIcon } from 'lucide-react';
import { useInventoryEngine } from '../hooks/useInventoryEngine';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useSalesChannels } from '../hooks/useSalesChannels';
import { useOrders } from '../hooks/useOrders';
import { useInventory } from '../hooks/useInventory';
import { useData } from '../context/DataContext';
import CurrencyInput from '../components/CurrencyInput';

const POS = () => {
  const { dispatch } = useData();
  const { activeProducts } = useProducts();
  const { activeCategories } = useCategories();
  const { activeSalesChannels } = useSalesChannels();
  const { activeIngredients } = useInventory();
  const { addOrder } = useOrders();
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  
  // New POS fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [extraFee, setExtraFee] = useState(0);
  const [extraFeeNote, setExtraFeeNote] = useState('');
  // Không tự động chọn kênh sàn đầu tiên, giữ mặc định là trống (Tại Quán)
  React.useEffect(() => {
     // Giữ selectedChannelId là rỗng để chọn option "Tại Quán"
  }, []);


  
  const validMenuCategoryNames = activeCategories.filter(c => c.type === 'menu').map(c => c.name);
  const categories = ['Tất cả', ...Array.from(new Set(activeProducts.map(p => p.category))).filter(c => validMenuCategoryNames.includes(c))];

  const filteredProducts = activeProducts.filter(p => {
    const matchCat = activeCategory === 'Tất cả' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isNotDraft = p.status !== 'draft';
    return matchCat && matchSearch && isNotDraft;
  });

  const { getProductMaxCapacityInfo, calculateMaxPortions } = useInventoryEngine({ ingredients: activeIngredients, products: activeProducts });

  const addToCart = (product) => {
    const info = getProductMaxCapacityInfo(product.recipe);
    const port = info.max;
    // Find current booked in cart to prevent overselling
    const booked = cart.find(c => c.id === product.id)?.qty || 0;
    
    if (port !== Infinity && booked >= port) {
      if (port <= 0) {
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            title: 'Hết nguyên liệu',
            message: `Nguyên liệu [${info.limitingName || 'Không xác định'}] đã cạn kiệt. Vui lòng Nhập Kho!`,
            type: 'error'
          }
        });
      } else {
        dispatch({
          type: 'ADD_NOTIFICATION',
          payload: {
            title: 'Sắp hết nguyên liệu',
            message: `Kho chỉ còn đủ nguyên liệu để làm TỐI ĐA ${port} suất món này.`,
            type: 'warning'
          }
        });
      }
      return;
    }

    setCart(prev => {
      const exist = prev.find(item => item.id === product.id);
      if (exist) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (product, delta) => {
    const port = calculateMaxPortions(product.recipe);
    const booked = cart.find(c => c.id === product.id)?.qty || 0;
    
    if (delta > 0 && port !== Infinity && booked >= port) {
       dispatch({
         type: 'ADD_NOTIFICATION',
         payload: {
           title: 'Sắp hết nguyên liệu',
           message: `Kho chỉ còn đủ nguyên liệu để làm TỐI ĐA ${port} suất món này.`,
           type: 'warning'
         }
       });
       return;
    }

    setCart(prev => prev.map(item => {
      if (item.id === product.id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const getChannelPrefix = (channelName) => {
      const lower = (channelName || '').toLowerCase();
      if (lower.includes('grab')) return 'GF';
      if (lower.includes('shopee')) return 'SF';
      return 'POS';
  };

  const selectedChannel = activeSalesChannels?.find(c => c.id === selectedChannelId) || { commission: 0, name: 'Trực tiếp' };
  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const actualCommissionRate = selectedChannel?.commission ?? selectedChannel?.discountRate ?? 0;
  const discountAmount = total * (actualCommissionRate / 100);
  const netAmount = total - discountAmount;

  const handleCheckout = async (paymentStatus = 'Paid') => {
    if (cart.length === 0) return;
    const orderItems = cart.map(item => ({ product: item, quantity: item.qty }));
    const prefix = getChannelPrefix(selectedChannel.name);
    // Thay thế logic ID ngẫu nhiên không an toàn bằng logic ID duy nhất toàn cầu
    const finalOrderCode = orderCode || StorageService.generateId(prefix + '-');
    
    try {
      await addOrder({
         orderCode: finalOrderCode,
         customerName,
         customerPhone,
         extraFee: Number(extraFee) || 0,
         extraFeeNote,
         totalAmount: total, discountAmount, netAmount,
         channelId: selectedChannel.id, channelName: selectedChannel.name,
         paymentStatus,
         items: orderItems, type: 'Giao hàng - Kênh Bán' 
      });
      
      const displayTotal = netAmount + (Number(extraFee) || 0);
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { 
          title: `Đơn hàng mới: ${finalOrderCode}`, 
          message: `Thanh toán thành công. Thu về: ${displayTotal.toLocaleString('vi-VN')} đ`, 
          type: 'success' 
        }
      });
      
      // Reset form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setOrderCode('');
    } catch (e) {
      console.error(e);
      alert("HỆ THỐNG GẶP LỖI KHI LƯU ĐƠN: " + (e.stack || e.message));
    }
    setExtraFee(0);
    setExtraFeeNote('');
  };

  const generateOrderCode = () => {
    const prefix = getChannelPrefix(selectedChannel?.name);
    setOrderCode(StorageService.generateId(prefix + '-'));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div className="pos-container pos-layout" style={{ height: '100%', padding: '24px 24px 40px 24px' }}>
      
      {/* Cột trái: Danh sách Món */}
      <div className="pos-left">

        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-variant)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
              <Search size={20} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="Tìm tên món / sản phẩm..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '1rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: 'var(--primary)', fontWeight: 700, whiteSpace: 'nowrap' }}>
              <Flame size={18} />
              <span style={{ fontSize: '14px' }}>{filteredProducts.length} Món</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-ghost'}`}
                style={{ whiteSpace: 'nowrap' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="product-scroll-area" style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(150px, 45%, 210px), 1fr))', gap: 'clamp(12px, 2vw, 20px)', paddingRight: '4px' }}>
          {filteredProducts.map(product => {
            const info = getProductMaxCapacityInfo(product.recipe);
            const port = info.max;
            const isOutOfStock = port !== Infinity && port <= 0;

            return (
              <div 
                key={product.id} 
                style={{ 
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer', 
                  overflow: 'hidden', 
                  transition: 'transform 0.1s', 
                  display: 'flex', flexDirection: 'column',
                  background: 'var(--surface-color)',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: isOutOfStock ? '1px solid #FECACA' : '1px solid var(--surface-border)',
                  opacity: isOutOfStock ? 0.6 : 1,
                  userSelect: 'none',
                  minHeight: '220px'
                }}
                onClick={() => addToCart(product)}
                onMouseDown={e => !isOutOfStock && (e.currentTarget.style.transform = 'scale(0.96)')}
                onMouseUp={e => !isOutOfStock && (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={e => !isOutOfStock && (e.currentTarget.style.transform = 'scale(1)')}
              >
                <div style={{ position: 'relative', width: '100%', height: '110px', flexShrink: 0, backgroundColor: 'var(--bg-color)', borderBottom: '1px solid var(--surface-border)' }}>
                   {product.image ? (
                     <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   ) : (
                     <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', background: 'var(--surface-variant)' }}>
                       <ImageIcon size={26} opacity={0.4} style={{ marginBottom: '4px' }} />
                       <span style={{ fontSize: '11px', fontWeight: 500, opacity: 0.6 }}>Chưa có ảnh</span>
                     </div>
                   )}
                   
                   {/* BADGE TÌNH TRẠNG KHO TRỰC TIẾP LÊN MÓN */}
                   <div style={{ position: 'absolute', top: 8, right: 8 }}>
                     {port === Infinity ? null : (
                       <span style={{ background: port > 5 ? '#16A34A' : '#DC2626', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                          {port <= 0 ? `HẾT HÀNG` : `CÒN: ${port}`}
                       </span>
                     )}
                   </div>
                </div>
                
                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ minHeight: '38px', flexShrink: 0, marginBottom: '2px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.name}
                    </h4>
                  </div>
                  
                  {isOutOfStock && info.limitingName && (
                    <div style={{ fontSize: '11px', color: '#DC2626', fontWeight: 600, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      (Thiếu: {info.limitingName})
                    </div>
                  )}

                  <div style={{ display: 'flex', flexShrink: 0, justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <p style={{ margin: 0, fontSize: '15px', color: 'var(--primary)', fontWeight: 800 }}>
                      {product.price.toLocaleString('vi-VN')} đ
                    </p>
                    <div style={{ background: isOutOfStock ? '#F3F4F6' : '#FFF7ED', padding: '6px', borderRadius: '10px', display: 'flex', opacity: isOutOfStock ? 0.5 : 1 }}>
                       <Plus size={16} color={isOutOfStock ? '#9CA3AF' : 'var(--primary)'}/>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cột phải: Giỏ hàng */}
      <div className="pos-right">
        <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-color)' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Giỏ Hàng / Lên Đơn
          </h3>
        </div>

        <div className="cart-scroll-area" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-color)' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px', fontWeight: 600 }}>Chưa có món nào trong giỏ</div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--surface-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.name}</h5>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--primary)', fontWeight: 800 }}>{(item.price * item.qty).toLocaleString('vi-VN')} đ</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-color)', borderRadius: '8px', padding: '4px', border: '1px solid var(--surface-border)' }}>
                  <button onClick={() => updateQty(item, -1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={16} /></button>
                  <span style={{ width: '20px', textAlign: 'center', fontSize: '15px', fontWeight: 800 }}>{item.qty}</span>
                  <button onClick={() => updateQty(item, 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
                </div>

                <button onClick={() => removeItem(item.id)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--danger)', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--surface-border)', background: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 -4px 15px rgba(0,0,0,0.02)', zIndex: 10 }}>
          
          {/* Customer Info Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Khách Hàng:</label>
              <input className="form-input" placeholder="Anh Tuấn..." value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Số điện thoại:</label>
              <input className="form-input" placeholder="09xxxxxx" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
            </div>
          </div>

          {/* Order Code & Channel Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Mã Đơn:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="input-field" value={orderCode} onChange={e => setOrderCode(e.target.value)} placeholder={`Ví dụ: ${getChannelPrefix(selectedChannel.name)}-0001`} style={{ flex: 1, fontSize: '14px' }}/>        <button className="btn btn-ghost" onClick={generateOrderCode} style={{ padding: '0 12px', background: 'var(--bg-color)', border: '1px solid var(--surface-border)', borderRadius: '8px', fontWeight: 700 }}>Tạo</button>
              </div>
            </div>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Nguồn Đơn:</label>
               <select className="form-input" style={{ cursor: 'pointer' }} value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)}>
                 <option value="">Tại Quán / Mang Đi (0%)</option>
                 {activeSalesChannels?.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
               </select>
            </div>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'var(--surface-border)', margin: '8px 0' }}/>

          {/* Checkout Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Cộng tiền hàng:</span>
              <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{total.toLocaleString('vi-VN')} đ</span>
            </div>

            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#EA580C' }}>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>Chiết khấu nền tảng ({selectedChannel?.commission ?? selectedChannel?.discountRate ?? 0}%):</span>
                <span style={{ fontSize: '14px', fontWeight: 800 }}>-{discountAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Phụ thu (Vd: Phí ship):</span>
               <div style={{ display: 'flex', gap: '8px', width: '140px' }}>
                 <input className="form-input" style={{ padding: '4px 8px', textAlign: 'right'}} placeholder="Ghi chú" value={extraFeeNote} onChange={e => setExtraFeeNote(e.target.value)} />
                 <CurrencyInput style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--primary)'}} value={extraFee} onChange={val => setExtraFee(val)} />
               </div>
            </div>
          </div>

          <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#EA580C' }}>THỰC THU:</span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#EA580C', letterSpacing: '-0.5px' }}>{(netAmount + (Number(extraFee) || 0)).toLocaleString('vi-VN')} đ</span>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, padding: '16px', fontSize: '15px', borderRadius: '12px', fontWeight: 800, letterSpacing: '0.5px', textTransform: 'uppercase', boxShadow: '0 4px 12px rgba(247, 83, 0, 0.3)' }}
              disabled={cart.length === 0}
              onClick={() => handleCheckout('Paid')}
            >
              <CreditCard size={18} style={{marginRight: '8px'}} /> Thu Tiền & Nhận Đơn
            </button>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
