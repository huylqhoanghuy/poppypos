import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, Flame, Image as ImageIcon, Calculator, TrendingUp, TrendingDown, Percent, Settings2 } from 'lucide-react';
import { useInventoryEngine } from '../hooks/useInventoryEngine';
import { useProducts } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import { useSalesChannels } from '../hooks/useSalesChannels';
import { useInventory } from '../hooks/useInventory';
import CurrencyInput from '../components/CurrencyInput';

const ProfitSimulator = () => {
  const { activeProducts } = useProducts();
  const { activeCategories } = useCategories();
  const { activeSalesChannels } = useSalesChannels();
  const { activeIngredients } = useInventory();
  
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState('');
  const [manualDiscount, setManualDiscount] = useState(0);

  React.useEffect(() => {
     if (!selectedChannelId && activeSalesChannels?.length > 0) {
        setSelectedChannelId(activeSalesChannels[0].id);
     }
  }, [activeSalesChannels, selectedChannelId]);

  const validMenuCategoryNames = activeCategories.filter(c => c.type === 'menu').map(c => c.name);
  const categories = ['Tất cả', ...Array.from(new Set(activeProducts.map(p => p.category))).filter(c => validMenuCategoryNames.includes(c))];

  const filteredProducts = activeProducts.filter(p => {
    const matchCat = activeCategory === 'Tất cả' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isNotDraft = p.status !== 'draft';
    return matchCat && matchSearch && isNotDraft;
  });

  const { calculateTotalCost } = useInventoryEngine({ ingredients: activeIngredients, products: activeProducts });

  const addToCart = (product) => {
    setCart(prev => {
      const exist = prev.find(item => item.id === product.id);
      if (exist) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (product, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === product.id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeItem = (id) => setCart(prev => prev.filter(item => item.id !== id));

  const selectedChannel = activeSalesChannels?.find(c => c.id === selectedChannelId) || { commission: 0, name: 'Trực tiếp' };
  
  // Lợi nhuận calculations
  const analysis = useMemo(() => {
    let grossRevenue = 0;
    let totalCogs = 0;

    cart.forEach(item => {
      grossRevenue += item.price * item.qty;
      const unitCogs = calculateTotalCost(item.recipe);
      totalCogs += unitCogs * item.qty;
    });

    const actualCommissionRate = selectedChannel?.commission ?? selectedChannel?.discountRate ?? 0;
    const channelFee = grossRevenue * (actualCommissionRate / 100);
    const netRevenue = grossRevenue - channelFee - (Number(manualDiscount) || 0);
    const netProfit = netRevenue - totalCogs;
    
    let marginPercent = 0;
    if (grossRevenue > 0) {
      marginPercent = (netProfit / grossRevenue) * 100;
    }

    return { grossRevenue, totalCogs, channelFee, netRevenue, netProfit, marginPercent, actualCommissionRate };
  }, [cart, selectedChannel, manualDiscount, calculateTotalCost]);

  const clearCart = () => {
    setCart([]);
    setManualDiscount(0);
  };

  return (
    <div className="pos-container" style={{ display: 'flex', gap: '24px', height: '100%', overflow: 'hidden' }}>
      
      {/* Cột trái: Danh sách Món */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}>
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-variant)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
              <Search size={20} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="Tìm món để thử nghiệm tính ròng..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '1rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: '#f59e0b', fontWeight: 700, whiteSpace: 'nowrap' }}>
              <Calculator size={18} />
              <span style={{ fontSize: '14px' }}>Giả Tình Huống</span>
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
            return (
              <div 
                key={product.id} 
                style={{ 
                  cursor: 'pointer', 
                  overflow: 'hidden', 
                  transition: 'transform 0.1s', 
                  display: 'flex', flexDirection: 'column',
                  background: 'var(--surface-color)',
                  borderRadius: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  border: '1px solid var(--surface-border)',
                  userSelect: 'none',
                  minHeight: '220px'
                }}
                onClick={() => addToCart(product)}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
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
                </div>
                
                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ minHeight: '38px', flexShrink: 0, marginBottom: '2px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {product.name}
                    </h4>
                  </div>
                  <div style={{ display: 'flex', flexShrink: 0, justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <p style={{ margin: 0, fontSize: '15px', color: 'var(--primary)', fontWeight: 800 }}>
                      {product.price.toLocaleString('vi-VN')} đ
                    </p>
                    <div style={{ background: '#F0F9FF', padding: '6px', borderRadius: '10px', display: 'flex' }}>
                       <Plus size={16} color="var(--primary)"/>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cột phải: Bảng Tính Thử Khuyến Mãi */}
      <div style={{ width: '420px', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, background: 'var(--surface-color)', borderLeft: '1px solid var(--surface-border)', boxShadow: '-4px 0 15px rgba(0,0,0,0.02)' }}>
        <div style={{ padding: '24px 24px 16px 24px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={20} color="var(--primary)" /> Bảng Tính Thử Lợi Nhuận
          </h3>
          <button className="btn btn-ghost" onClick={clearCart} style={{ color: 'var(--danger)', fontSize: '13px', padding: '4px 8px' }}>Làm Lại</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-color)' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px', fontWeight: 600 }}>Thêm món vào để bắt đầu tính ròng</div>
          ) : (
            cart.map(item => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', background: 'var(--surface-color)', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
                <div style={{ flex: 1 }}>
                  <h5 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.name}</h5>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <p style={{ margin: 0, fontSize: '13px', color: 'var(--primary)', fontWeight: 800 }}>{(item.price * item.qty).toLocaleString('vi-VN')} đ</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-color)', borderRadius: '8px', padding: '2px', border: '1px solid var(--surface-border)' }}>
                  <button onClick={() => updateQty(item, -1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
                  <span style={{ width: '16px', textAlign: 'center', fontSize: '13px', fontWeight: 800 }}>{item.qty}</span>
                  <button onClick={() => updateQty(item, 1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
                </div>
                <button onClick={() => removeItem(item.id)} style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--danger)', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--surface-border)', background: 'var(--surface-color)', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 -4px 15px rgba(0,0,0,0.02)', zIndex: 10 }}>
          
          {/* Cấu Hình Giả Lập */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Kênh Bán (Phí sàn):</label>
               <select className="form-input" style={{ cursor: 'pointer', padding: '8px', fontSize: '13px' }} value={selectedChannelId} onChange={e => setSelectedChannelId(e.target.value)}>
                 {activeSalesChannels?.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
               </select>
            </div>
            <div>
               <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Khuyến Mãi Thêm:</label>
               <div style={{ position: 'relative' }}>
                 <CurrencyInput className="form-input" style={{ padding: '8px', fontSize: '13px', width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }} value={manualDiscount} onChange={val => setManualDiscount(val)} />
               </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'var(--surface-border)', margin: '4px 0' }}/>

          {/* Phân Tích */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Doanh Thu Gốc (Gross):</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{analysis.grossRevenue.toLocaleString('vi-VN')} đ</span>
                {analysis.grossRevenue > 0 && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>(100%)</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Chiết khấu sàn ({analysis.actualCommissionRate}%):
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#EA580C' }}>
                  -{analysis.channelFee.toLocaleString('vi-VN')} đ
                </span>
                {analysis.grossRevenue > 0 && <span style={{ fontSize: '12px', color: '#EA580C', opacity: 0.8 }}>({((analysis.channelFee / analysis.grossRevenue) * 100).toFixed(1)}%)</span>}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Tổng Vốn Nguyên Liệu (COGS):
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#EA580C' }}>
                  -{analysis.totalCogs.toLocaleString('vi-VN')} đ
                </span>
                {analysis.grossRevenue > 0 && <span style={{ fontSize: '12px', color: '#EA580C', opacity: 0.8 }}>({((analysis.totalCogs / analysis.grossRevenue) * 100).toFixed(1)}%)</span>}
              </div>
            </div>
            
            {manualDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600 }}>
                    Tự cắt KM Mời Khách:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#EA580C' }}>
                      -{(Number(manualDiscount) || 0).toLocaleString('vi-VN')} đ
                    </span>
                    {analysis.grossRevenue > 0 && <span style={{ fontSize: '12px', color: '#EA580C', opacity: 0.8 }}>({(((Number(manualDiscount) || 0) / analysis.grossRevenue) * 100).toFixed(1)}%)</span>}
                  </div>
                </div>
            )}
          </div>

          {/* HIỂN THỊ MARGIN THEO MÀU */}
          {(() => {
            const isProfit = analysis.netProfit > 0;
            const margin = analysis.marginPercent;
            let themeColor = '#16a34a'; // Green
            let bgFill = '#f0fdf4';
            let border = '#bbf7d0';
            let Icon = TrendingUp;

            if (margin < 0) {
              themeColor = '#dc2626'; // Red
              bgFill = '#fef2f2';
              border = '#fecaca';
              Icon = TrendingDown;
            } else if (margin < 20) {
              themeColor = '#d97706'; // Yellow/Orange
              bgFill = '#fffbeb';
              border = '#fef08a';
              Icon = Percent;
            }

            return (
              <div style={{ background: bgFill, border: `1px solid ${border}`, borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: themeColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lãi Ròng Ước Tính</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: themeColor, letterSpacing: '-0.5px' }}>
                    {analysis.netProfit.toLocaleString('vi-VN')} đ
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'white', padding: '4px 8px', borderRadius: '8px', border: `1px solid ${border}` }}>
                    <Icon size={14} color={themeColor} strokeWidth={3} />
                    <span style={{ fontSize: '14px', fontWeight: 800, color: themeColor }}>
                      {margin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
};

export default ProfitSimulator;
