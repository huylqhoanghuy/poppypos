import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Key, User, Eye, EyeOff, AlertCircle, ChefHat } from 'lucide-react';
import { useData } from '../context/DataContext';

// Star field canvas - giữ nguyên nền vũ trụ
function StarCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const stars = [];

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 300; i++) {
      stars.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.2,
        alpha: Math.random(),
        speed: Math.random() * 0.005 + 0.001,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.twinkle += s.speed;
        s.alpha = 0.25 + 0.6 * Math.abs(Math.sin(s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 160, ${s.alpha * 0.7})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

// Floating food emojis
const FOOD_ITEMS = ['🍗', '🥣', '🌶️', '🧄', '🫙', '🍲', '🥢', '🌿', '🧂', '🍋', '🥩', '🔥'];
function FloatingFood() {
  const [items] = useState(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      emoji: FOOD_ITEMS[i % FOOD_ITEMS.length],
      x: Math.random() * 100,
      size: Math.random() * 18 + 16,
      duration: Math.random() * 14 + 12,
      delay: Math.random() * -16,
      sway: Math.random() * 30 + 10,
    }))
  );
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(110vh) rotate(-8deg); opacity: 0; }
          5% { opacity: 0.55; }
          90% { opacity: 0.25; }
          100% { transform: translateY(-10vh) rotate(8deg); opacity: 0; }
        }
      `}</style>
      {items.map(item => (
        <div key={item.id} style={{
          position: 'absolute',
          left: `${item.x}%`,
          bottom: 0,
          fontSize: `${item.size}px`,
          animation: `floatUp ${item.duration}s ease-in-out ${item.delay}s infinite`,
          filter: 'blur(0.4px)',
          opacity: 0.4
        }}>
          {item.emoji}
        </div>
      ))}
    </div>
  );
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useData();

  const from = location.state?.from?.pathname || '/';
  const storeName = state?.settings?.storeName || 'Xóm Gà POPPY';
  const branch = state?.settings?.branch || '';
  const logoUrl = state?.settings?.logoUrl;
  const loginFooter = state?.settings?.loginFooter || 'Phần Mềm Quản Trị & Bán Hàng © 2026';
  const developerInfo = state?.settings?.developerInfo || '';

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 10) setGreeting('Chào buổi sáng! ☀️ Bắt đầu ngày mới năng động nào!');
    else if (h >= 10 && h < 13) setGreeting('Giờ cao điểm buổi sáng! 🍗 Sẵn sàng bán hàng chưa?');
    else if (h >= 13 && h < 17) setGreeting('Buổi chiều năng suất! 🔥 Tiếp tục chinh phục doanh số!');
    else if (h >= 17 && h < 21) setGreeting('Giờ vàng buổi tối! 🌙 Đông khách nhất trong ngày đây!');
    else setGreeting('Làm ca khuya? 🌟 Cảm ơn bạn đã tận tụy với tiệm!');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) { setError('Vui lòng nhập đầy đủ thông tin!'); return; }
    setError(''); setLoading(true);
    try { await login(username, password); navigate(from, { replace: true }); }
    catch (err) { setError(typeof err === 'string' ? err : 'Sai thông tin đăng nhập!'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100vw',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 30% 40%, #2A1000 0%, #150A00 50%, #0A0500 100%)',
      overflow: 'hidden', position: 'relative',
      fontFamily: "'Inter', 'Segoe UI', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,700;0,800;1,700&display=swap');
        @keyframes gentleGlow { 0%,100% { box-shadow: 0 24px 80px rgba(220,100,0,0.18), 0 0 0 1px rgba(255,160,60,0.15); } 50% { box-shadow: 0 24px 80px rgba(220,100,0,0.28), 0 0 0 1px rgba(255,160,60,0.25); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes subtlePulse { 0%,100% { opacity: 0.8; } 50% { opacity: 1; } }
        @keyframes taglineFade { 0%,100% { opacity: 0.6 } 50% { opacity: 1; } }
      `}</style>

      {/* Star canvas - nền vũ trụ */}
      <StarCanvas />

      {/* Warm nebula overlays */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '55vw', height: '55vw', background: 'radial-gradient(circle, rgba(200,60,0,0.15) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '45vw', height: '45vw', background: 'radial-gradient(circle, rgba(255,120,0,0.12) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'absolute', top: '35%', right: '25%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(180,40,0,0.10) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 1 }} />

      {/* Floating food */}
      <FloatingFood />

      {/* === MAIN CARD === */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px', padding: '16px', animation: 'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{
          background: 'rgba(28, 14, 5, 0.85)',
          borderRadius: '24px',
          overflow: 'hidden',
          backdropFilter: 'blur(24px)',
          animation: 'gentleGlow 5s ease-in-out infinite',
          border: '1px solid rgba(255, 140, 40, 0.22)'
        }}>
          {/* Top warm stripe */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #C84800, #FF7A00, #FFB347, #FF7A00, #C84800)', backgroundSize: '200% 100%', animation: 'shimmer 3s linear infinite' }} />

          <div style={{ padding: '36px 36px 30px' }}>
            {/* === HEADER === */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ height: '64px', objectFit: 'contain', marginBottom: '14px', filter: 'drop-shadow(0 4px 16px rgba(255,120,0,0.5))' }} />
              ) : (
                <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '20px',
                    background: 'linear-gradient(135deg, #C84800 0%, #FF7A00 60%, #FFB347 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(200,72,0,0.5), 0 0 0 1px rgba(255,150,60,0.3)',
                    animation: 'subtlePulse 3s ease-in-out infinite'
                  }}>
                    <ChefHat size={34} color="white" />
                  </div>
                </div>
              )}

              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '26px', fontWeight: 800,
                color: '#FFFFFF', margin: '0 0 4px 0',
                letterSpacing: '0.5px',
                textShadow: '0 2px 20px rgba(255,120,0,0.3)'
              }}>
                {storeName}
              </h1>

              {branch && (
                <p style={{ fontSize: '12px', color: 'rgba(255,160,60,0.7)', margin: '0 0 12px 0', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
                  {branch}
                </p>
              )}

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0 14px' }}>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,140,40,0.3))' }} />
                <span style={{ fontSize: '16px', animation: 'subtlePulse 2.5s infinite' }}>🍗</span>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(255,140,40,0.3))' }} />
              </div>

              {/* Greeting */}
              {greeting && (
                <p style={{ fontSize: '13px', color: 'rgba(255,200,120,0.9)', margin: 0, fontStyle: 'italic', lineHeight: 1.5, animation: 'taglineFade 4s ease-in-out infinite' }}>
                  {greeting}
                </p>
              )}
            </div>

            {/* === ERROR === */}
            {error && (
              <div style={{
                marginBottom: '18px', padding: '12px 14px',
                background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,100,100,0.3)',
                borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px',
                animation: 'fadeUp 0.3s ease-out'
              }}>
                <AlertCircle size={16} color="#FF7070" style={{ flexShrink: 0 }} />
                <span style={{ color: '#FF8888', fontSize: '13px', fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {/* === FORM === */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Username */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,160,60,0.8)', marginBottom: '7px', letterSpacing: '0.5px' }}>
                  Tên đăng nhập
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="rgba(255,140,40,0.5)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '14px', pointerEvents: 'none' }} />
                  <input
                    type="text" value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập..." autoComplete="username"
                    style={{
                      width: '100%', height: '48px', paddingLeft: '42px', paddingRight: '16px', boxSizing: 'border-box',
                      background: 'rgba(255,120,30,0.06)', border: '1.5px solid rgba(255,120,30,0.2)',
                      borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none',
                      fontFamily: 'inherit', transition: 'all 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(255,140,40,0.7)'; e.target.style.background = 'rgba(255,120,30,0.1)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,120,30,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,120,30,0.2)'; e.target.style.background = 'rgba(255,120,30,0.06)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'rgba(255,160,60,0.8)', marginBottom: '7px', letterSpacing: '0.5px' }}>
                  Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} color="rgba(255,140,40,0.5)" style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: '14px', pointerEvents: 'none' }} />
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password"
                    style={{
                      width: '100%', height: '48px', paddingLeft: '42px', paddingRight: '46px', boxSizing: 'border-box',
                      background: 'rgba(255,120,30,0.06)', border: '1.5px solid rgba(255,120,30,0.2)',
                      borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none',
                      fontFamily: 'inherit', transition: 'all 0.2s',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(255,140,40,0.7)'; e.target.style.background = 'rgba(255,120,30,0.1)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,120,30,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(255,120,30,0.2)'; e.target.style.background = 'rgba(255,120,30,0.06)'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,140,40,0.5)', display: 'flex', padding: '4px' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={loading}
                style={{
                  marginTop: '10px', height: '52px', width: '100%', border: 'none', borderRadius: '14px',
                  background: loading ? 'rgba(200,72,0,0.4)' : 'linear-gradient(135deg, #C84800 0%, #FF7A00 50%, #FFB347 100%)',
                  color: 'white', fontSize: '15px', fontWeight: 700, fontFamily: 'inherit',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  boxShadow: loading ? 'none' : '0 8px 28px rgba(200,72,0,0.45)',
                  transition: 'all 0.25s', letterSpacing: '0.3px',
                  backgroundSize: '200% 100%', backgroundPosition: 'left center',
                }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.backgroundPosition = 'right center'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(200,72,0,0.6)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { if (!loading) { e.currentTarget.style.backgroundPosition = 'left center'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(200,72,0,0.45)'; e.currentTarget.style.transform = 'none'; } }}
              >
                {loading ? (
                  <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Đang xác thực...</>
                ) : (
                  <><span style={{ fontSize: '18px' }}>🍽️</span> Vào Bếp Thôi nào! <LogIn size={18} /></>
                )}
              </button>
            </form>

            {/* Đã gỡ bỏ Quick Hint chứa các tài khoản mặc định để bảo mật hệ thống */}
          </div>

          {/* Footer block */}
          <div style={{ paddingBottom: '20px', textAlign: 'center', borderTop: '1px solid rgba(255,120,30,0.1)', marginTop: '0', paddingTop: '18px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,160,60,0.35)', margin: '0 0 3px 0', fontWeight: 500 }}>{loginFooter}</p>
            {developerInfo && <p style={{ fontSize: '11px', color: 'rgba(255,160,60,0.2)', margin: 0 }}>{developerInfo}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
