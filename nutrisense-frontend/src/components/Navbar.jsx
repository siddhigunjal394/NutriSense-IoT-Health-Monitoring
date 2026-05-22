import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', height: '60px',
      background: 'rgba(4,8,18,0.95)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#f0f4ff' }}>
        Nutri<span style={{ color: '#00e5b0' }}>Sense</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Bell */}
        <button style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,176,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
          🔔
        </button>

        {/* User */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '4px 12px 4px 5px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '999px', cursor: 'pointer', transition: 'border-color 0.2s',
        }}
          onClick={() => navigate('/profile')}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,176,0.18)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #00e5b0, #3b9eff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.68rem', fontWeight: 700, color: '#020a08',
          }}>{initials}</div>
          <span style={{ fontSize: '0.82rem', color: 'rgba(176,192,220,0.85)', fontWeight: 500 }}>{firstName}</span>
        </div>

        {/* Logout */}
        <button onClick={() => { logout(); navigate('/login'); }}
          style={{
            padding: '5px 14px',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '999px', cursor: 'pointer',
            fontSize: '0.8rem', color: '#4a5a72',
            transition: 'all 0.2s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; e.currentTarget.style.color = '#f43f5e'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#4a5a72'; }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
