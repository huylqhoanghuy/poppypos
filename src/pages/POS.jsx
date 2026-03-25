import React, { useState } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Flame } from 'lucide-react';
import { useData } from '../context/DataContext';

const POS = () => {
  const { state, dispatch } = useData();
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  
  const [selectedChannelId, setSelectedChannelId] = useState('');
  React.useEffect(() => {
     if (!selectedChannelId && state.salesChannels?.length > 0) {
        setSelectedChannelId(state.salesChannels[0].id);
     }
  }, [state.salesChannels, selectedChannelId]);

  const categories = ['Tất cả', ...new Set(state.products.map(p => p.category))];

  const filteredProducts = state.products.filter(p => {
    const matchCat = activeCategory === 'Tất cả' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getEntityMaxPortions = (entityId, requiredQty, unitMode = 'base') => {
     if (requiredQty <= 0) return Infinity;
     const ing = state.ingredients.find(i => i.id === entityId);
     if (ing) {
        let requiredBaseQty = requiredQty;
        if (unitMode === 'buy') requiredBaseQty = requiredQty * (ing.conversionRate || 1);
        if (unitMode === 'divide') requiredBaseQty = 1 / requiredQty;
        return Math.floor(ing.stock / requiredBaseQty);
     }
     const prod = state.products.find(p => p.id === entityId);
     if (prod && prod.recipe) {
        let requiredProdQty = requiredQty;
        if (unitMode === 'divide') requiredProdQty = 1 / requiredQty;
        const prodMax = getProductMaxCapacity(prod.recipe);
        return Math.floor(prodMax / requiredProdQty);
     }
     return 0;
  };

  const getProductMaxCapacity = (recipe) => {
    if (!recipe || recipe.length === 0) return 'Unlimited';
    let max = Infinity;
    recipe.forEach(r => {
      const cap = getEntityMaxPortions(r.ingredientId, r.qty, r.unitMode);
      if (cap < max) max = cap;
    });
    return max === Infinity ? 0 : max;
  };

  const addToCart = (product) => {
    const port = getProductMaxCapacity(product.recipe);
    // Find current booked in cart to prevent overselling
    const booked = cart.find(c => c.id === product.id)?.qty || 0;
    
    if (port !== 'Unlimited' && booked >= port) {
      alert(`Xin lỗi! Kho chỉ còn đủ nguyên liệu để làm TỐI ĐA ${port} suất món này.`);
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
    const port = getProductMaxCapacity(product.recipe);
    const booked = cart.find(c => c.id === product.id)?.qty || 0;
    
    if (delta > 0 && port !== 'Unlimited' && booked >= port) {
       alert(`Xin lỗi! Kho chỉ còn đủ để làm TỐI ĐA ${port} suất.`);
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

  const selectedChannel = state.salesChannels?.find(c => c.id === selectedChannelId) || { discountRate: 0, name: 'Trực tiếp' };
  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
  const discountAmount = total * ((selectedChannel?.discountRate||0) / 100);
  const netAmount = total - discountAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const orderItems = cart.map(item => ({ product: item, quantity: item.qty }));
    dispatch({ type: 'ADD_POS_ORDER', payload: { 
       totalAmount: total, discountAmount, netAmount,
       channelId: selectedChannel.id, channelName: selectedChannel.name,
       items: orderItems, type: 'Giao hàng - Kênh Bán' 
    } });
    alert(`Thanh toán thành công! Nhận tiền net về ví: ${netAmount.toLocaleString('vi-VN')} đ`);
    setCart([]);
  };

  return (
    <div className="pos-container" style={{ display: 'flex', gap: '24px', height: '100%', overflow: 'hidden' }}>
      
      {/* Cột trái: Danh sách Món */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>
        
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
            <Search size={20} color="var(--text-secondary)" />
            <input 
              type="text" 
              placeholder="Bộ phận Kinh doanh: Tìm món để lên Sales (Shopee, Grab...)" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '1rem' }}
            />
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

        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', paddingRight: '4px' }}>
          {filteredProducts.map(product => {
            const port = getProductMaxCapacity(product.recipe);
            const isOutOfStock = port !== 'Unlimited' && port <= 0;

            return (
              <div 
                key={product.id} 
                className="glass-panel" 
                style={{ 
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer', 
                  overflow: 'hidden', 
                  transition: 'transform 0.2s', 
                  display: 'flex', flexDirection: 'column',
                  opacity: isOutOfStock ? 0.6 : 1,
                  border: isOutOfStock ? '1px solid var(--danger)' : '1px solid var(--surface-border)'
                }}
                onClick={() => !isOutOfStock && addToCart(product)}
                onMouseOver={e => !isOutOfStock && (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseOut={e => !isOutOfStock && (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ position: 'relative', width: '100%', height: '140px', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                   {product.image && <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                   
                   {/* BADGE TÌNH TRẠNG KHO TRỰC TIẾP LÊN MÓN */}
                   <div style={{ position: 'absolute', top: 10, right: 10 }}>
                     {port === 'Unlimited' ? null : (
                       <span style={{ background: port > 5 ? 'var(--success)' : 'var(--danger)', color: 'white', padding: '6px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                          {port <= 0 ? 'Hết Kho' : `Còn: ${port} suất`}
                       </span>
                     )}
                   </div>
                </div>
                
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{product.name}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <p style={{ margin: 0, fontSize: '1rem', color: 'var(--primary)', fontWeight: 700 }}>
                      {product.price.toLocaleString('vi-VN')} đ
                    </p>
                    <div style={{ background: 'rgba(249, 115, 22, 0.15)', padding: '6px', borderRadius: '8px' }}>
                       <Flame size={18} color="var(--primary)"/>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cột phải: Giỏ hàng */}
      <div className="glass-panel pos-cart" style={{ width: '380px', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--surface-border)' }}>
          <h3 style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Đơn Kinh Doanh Đang Lên
          </h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>Kinh doanh mời chọn món để lên Sale</div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{item.name}</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--primary)', marginTop: '4px' }}>{(item.price * item.qty).toLocaleString('vi-VN')} đ</p>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-color)', borderRadius: '8px', padding: '4px' }}>
                  <button onClick={() => updateQty(item, -1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}><Minus size={14} /></button>
                  <span style={{ width: '20px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item, 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '4px' }}><Plus size={14} /></button>
                </div>

                <button onClick={() => removeItem(item.id)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Kênh chốt đơn:</span>
            <select style={{ background:'rgba(0,0,0,0.5)', color:'white', border:'1px solid var(--surface-border)', padding:'6px', borderRadius:'4px', outline:'none', maxWidth: '200px' }} 
                    value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)}>
               {state.salesChannels?.map(ch => <option key={ch.id} value={ch.id}>{ch.name} (-{ch.discountRate}%)</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Tổng bill khách trả:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{total.toLocaleString('vi-VN')} đ</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--warning)' }}>
              <span style={{ fontSize: '0.9rem' }}>Phí Sàn Môi Giới (-{selectedChannel.discountRate}%):</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>-{discountAmount.toLocaleString('vi-VN')} đ</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', color: 'var(--success)' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Thực Thu Vào Quỹ:</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{netAmount.toLocaleString('vi-VN')} đ</span>
          </div>
          
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '12px', fontWeight: 'bold' }}
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            <CreditCard size={20} /> Bán & Thu Tiền Net Bảng
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;
