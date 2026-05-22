import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getLatestHealth, getHealthHistory } from '../services/api';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [healthRes, historyRes] = await Promise.all([
        getLatestHealth(user.id),
        getHealthHistory(user.id)
      ]);
      setHealth(healthRes.data);
      setHistory(historyRes.data);
    } catch (e) {
      console.log('No data yet');
    } finally {
      setLoading(false);
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'User';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const bmi = user?.bmi;
  const bmiCategory = !bmi ? '--' : bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  const bmiColor = !bmi ? '#64748b' : bmi < 25 ? '#00e5b0' : bmi < 30 ? '#f59e0b' : '#f43f5e';
  const hr = health?.healthData?.heartRate;
  const hrStatus = !hr ? '--' : hr < 60 ? 'Low' : hr <= 100 ? 'Normal' : 'High';
  const hrColor = !hr ? '#64748b' : hr <= 100 ? '#00e5b0' : '#f43f5e';
  const healthScore = health ? Math.min(100, Math.max(0,
    100 - (hr > 100 ? 20 : 0) -
    (health.healthData?.bloodPressureSystolic > 140 ? 20 : 0) -
    (health.healthData?.glucoseLevel > 140 ? 20 : 0)
  )) : 75;
  const scoreOffset = 226 - (226 * healthScore / 100);

  const S = {
    page: {
      minHeight: '100vh', display: 'flex',
      background: 'linear-gradient(135deg, #020610 0%, #030912 50%, #020810 100%)',
    },
    main: { flex: 1, display: 'flex', flexDirection: 'column' },
    topbar: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', height: '60px',
      background: 'rgba(4,8,18,0.95)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 10,
    },
    logo: {
      fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 800,
      letterSpacing: '-0.02em', color: '#f0f4ff',
    },
    logoAccent: { color: '#00e5b0' },
    topbarRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    userBadge: {
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '5px 12px 5px 6px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '999px', cursor: 'pointer',
      transition: 'border-color 0.2s',
    },
    avatar: {
      width: '28px', height: '28px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #00e5b0, #3b9eff)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.7rem', fontWeight: 700, color: '#020a08',
    },
    userName: { fontSize: '0.84rem', color: 'rgba(176,192,220,0.9)', fontWeight: 500 },
    signoutBtn: {
      padding: '5px 14px',
      background: 'transparent',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '999px', cursor: 'pointer',
      fontSize: '0.82rem', color: '#64748b',
      transition: 'all 0.2s', fontFamily: 'inherit',
    },
    content: { flex: 1, padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' },
    headerRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
    greeting: {
      fontFamily: "'Outfit', sans-serif", fontSize: '1.6rem', fontWeight: 800,
      letterSpacing: '-0.03em', color: '#f0f4ff', marginBottom: '4px',
    },
    subGreeting: { fontSize: '0.84rem', color: '#4a5a72' },
    dateLabel: {
      fontSize: '0.75rem', color: '#2d3d52',
      fontFamily: "'JetBrains Mono', monospace",
      fontWeight: 500, letterSpacing: '0.04em',
      marginTop: '4px',
    },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' },
    statCard: (accent) => ({
      background: 'rgba(8,14,26,0.9)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
      cursor: 'default',
      borderTop: `2px solid ${accent}`,
    }),
    statIconWrap: {
      width: '38px', height: '38px', borderRadius: '10px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.1rem', marginBottom: '14px',
    },
    statLabel: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.58rem', fontWeight: 600,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      color: '#2d3d52', marginBottom: '6px',
    },
    statValue: {
      fontFamily: "'Outfit', sans-serif", fontSize: '2rem',
      fontWeight: 800, letterSpacing: '-0.04em',
      color: '#f0f4ff', lineHeight: 1,
    },
    statUnit: { fontSize: '0.78rem', color: '#4a5a72', fontWeight: 400, marginLeft: '4px' },
    statStatus: (color) => ({
      fontSize: '0.72rem', fontWeight: 600, marginTop: '10px',
      color, display: 'flex', alignItems: 'center', gap: '5px',
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.03em',
    }),
    row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
    card: {
      background: 'rgba(8,14,26,0.9)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '16px', padding: '22px',
      position: 'relative', overflow: 'hidden',
    },
    cardTitle: {
      fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem', fontWeight: 700,
      color: '#c8d8f0', marginBottom: '18px',
      display: 'flex', alignItems: 'center', gap: '8px',
    },
    todayBadge: {
      fontSize: '0.65rem', padding: '2px 8px',
      background: 'rgba(0,229,176,0.1)', color: '#00e5b0',
      borderRadius: '999px', fontWeight: 600,
      border: '1px solid rgba(0,229,176,0.15)',
      fontFamily: "'JetBrains Mono', monospace",
    },
    scoreRow: { display: 'flex', alignItems: 'center', gap: '20px' },
    scoreTxt: {
      fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem',
      fontWeight: 700, color: '#c8d8f0', marginBottom: '6px',
    },
    scoreDesc: { fontSize: '0.82rem', color: '#4a5a72', lineHeight: 1.6 },
    alertItem: {
      padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem',
      background: 'rgba(0,229,176,0.05)',
      border: '1px solid rgba(0,229,176,0.12)',
      color: 'rgba(0,229,176,0.8)',
    },
    alertWarn: {
      padding: '10px 14px', borderRadius: '10px', fontSize: '0.82rem',
      background: 'rgba(245,158,11,0.05)',
      border: '1px solid rgba(245,158,11,0.15)',
      color: 'rgba(245,158,11,0.85)',
    },
    actionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' },
    actionBtn: (accent) => ({
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: '12px', padding: '16px 10px',
      textAlign: 'center', cursor: 'pointer',
      transition: 'all 0.2s', fontFamily: 'inherit',
    }),
    actionIcon: { fontSize: '1.4rem', marginBottom: '8px' },
    actionLabel: { fontSize: '0.75rem', color: '#4a5a72', fontWeight: 500 },
    tableHead: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.58rem', fontWeight: 600,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: '#2d3d52', paddingBottom: '10px', textAlign: 'left',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    },
    tableCell: { padding: '11px 0', fontSize: '0.82rem', color: '#4a5a72', borderBottom: '1px solid rgba(255,255,255,0.03)' },
    pill: (ok) => ({
      padding: '2px 8px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
      background: ok ? 'rgba(0,229,176,0.08)' : 'rgba(244,63,94,0.08)',
      color: ok ? '#00e5b0' : '#f43f5e',
      border: `1px solid ${ok ? 'rgba(0,229,176,0.18)' : 'rgba(244,63,94,0.18)'}`,
    }),
    emptyState: { textAlign: 'center', padding: '40px 0' },
    emptyIcon: { fontSize: '2rem', marginBottom: '10px', opacity: 0.3 },
    emptyText: { fontSize: '0.82rem', color: '#2d3d52' },
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const stats = [
    { icon: '💓', label: 'Heart Rate', value: hr || '--', unit: 'bpm', status: hrStatus, statusColor: hrColor, accent: '#00e5b0' },
    { icon: '🩸', label: 'Blood Pressure', value: health?.healthData?.bloodPressureSystolic ? `${health.healthData.bloodPressureSystolic}/${health.healthData.bloodPressureDiastolic}` : '--', unit: 'mmHg', status: '--', statusColor: '#3b9eff', accent: '#3b9eff' },
    { icon: '🍬', label: 'Glucose', value: health?.healthData?.glucoseLevel || '--', unit: 'mg/dL', status: '--', statusColor: '#f59e0b', accent: '#f59e0b' },
    { icon: '⚖️', label: 'BMI', value: bmi || '--', unit: '', status: bmiCategory, statusColor: bmiColor, accent: '#a78bfa' },
  ];

  const actions = [
    { icon: '💓', label: 'Scan Heart', path: '/scan', accent: '#00e5b0' },
    { icon: '🩺', label: 'Log Vitals', path: '/vitals', accent: '#3b9eff' },
    { icon: '🍽️', label: 'Log Meal', path: '/meal', accent: '#f59e0b' },
    { icon: '🤖', label: 'AI Doctor', path: '/ai-doctor', accent: '#a78bfa' },
  ];

  return (
    <div style={S.page}>
      <Sidebar />
      <div style={S.main}>
        {/* Topbar */}
        <div style={S.topbar}>
          <div style={S.logo}>Nutri<span style={S.logoAccent}>Sense</span></div>
          <div style={S.topbarRight}>
            <div style={S.userBadge} onClick={() => navigate('/profile')}>
              <div style={S.avatar}>{initials}</div>
              <span style={S.userName}>{firstName}</span>
            </div>
            <button style={S.signoutBtn}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)'; e.currentTarget.style.color = '#f43f5e'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#64748b'; }}
              onClick={() => { logout(); navigate('/login'); }}>
              Sign out
            </button>
          </div>
        </div>

        <div style={S.content}>
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={S.headerRow}>
            <div>
              <div style={S.greeting}>{greeting}, {firstName} 👋</div>
              <div style={S.subGreeting}>Here's your health overview for today</div>
            </div>
            <div style={S.dateLabel}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </motion.div>

          {/* Stats */}
          <div style={S.statsGrid}>
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={S.statCard(stat.accent)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = stat.accent + '30'; e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${stat.accent}15`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: '70px', height: '70px', background: `radial-gradient(circle at top right, ${stat.accent}10, transparent 70%)`, pointerEvents: 'none' }} />
                <div style={S.statIconWrap}>{stat.icon}</div>
                <div style={S.statLabel}>{stat.label}</div>
                <div style={S.statValue}>
                  {stat.value}
                  {stat.unit && <span style={S.statUnit}>{stat.unit}</span>}
                </div>
                <div style={S.statStatus(stat.statusColor)}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: stat.statusColor, flexShrink: 0 }} />
                  {stat.status}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Health Score + Alerts */}
          <div style={S.row2}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} style={S.card}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,229,176,0.15), transparent)' }} />
              <div style={S.cardTitle}>
                🏆 Health Score
                <span style={S.todayBadge}>Today</span>
              </div>
              <div style={S.scoreRow}>
                <div style={{ position: 'relative', width: '88px', height: '88px', flexShrink: 0 }}>
                  <svg width="88" height="88" viewBox="0 0 96 96" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="48" cy="48" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
                    <circle cx="48" cy="48" r="36" fill="none" stroke="#00e5b0" strokeWidth="7"
                      strokeDasharray="226" strokeDashoffset={scoreOffset} strokeLinecap="round"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,176,0.5))' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 800, color: '#00e5b0', lineHeight: 1 }}>{healthScore}</span>
                    <span style={{ fontSize: '0.58rem', color: '#2d3d52', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', marginTop: '2px' }}>SCORE</span>
                  </div>
                </div>
                <div>
                  <div style={S.scoreTxt}>{healthScore >= 80 ? 'Excellent!' : healthScore >= 60 ? 'Good Health' : 'Needs Attention'}</div>
                  <div style={S.scoreDesc}>{healthScore >= 80 ? 'Your vitals are in great shape. Keep it up!' : healthScore >= 60 ? 'Mostly normal. Minor attention needed.' : 'Some vitals need attention. Check diet plan.'}</div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.42 }} style={S.card}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.15), transparent)' }} />
              <div style={S.cardTitle}>⚠️ Smart Alerts</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {health?.recommendation?.alerts?.length > 0
                  ? health.recommendation.alerts.map((alert, i) => (
                    <div key={i} style={S.alertWarn}>{alert}</div>
                  ))
                  : <div style={S.alertItem}>ℹ️ Complete your first vital scan to get personalized alerts</div>
                }
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={S.card}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(59,158,255,0.12), transparent)' }} />
            <div style={S.cardTitle}>⚡ Quick Actions</div>
            <div style={S.actionsGrid}>
              {actions.map((action, i) => (
                <button key={i} onClick={() => navigate(action.path)} style={S.actionBtn(action.accent)}
                  onMouseEnter={e => { e.currentTarget.style.background = `${action.accent}08`; e.currentTarget.style.borderColor = `${action.accent}25`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={S.actionIcon}>{action.icon}</div>
                  <div style={S.actionLabel}>{action.label}</div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* History */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.58 }} style={S.card}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(167,139,250,0.12), transparent)' }} />
            <div style={S.cardTitle}>📈 Recent Health Records</div>
            {history.length === 0 ? (
              <div style={S.emptyState}>
                <div style={S.emptyIcon}>📋</div>
                <div style={S.emptyText}>No records yet. Log your vitals to see history here.</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Date & Time', 'Heart Rate', 'Blood Pressure', 'Glucose', 'Status'].map(h => (
                      <th key={h} style={S.tableHead}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 5).map((h, i) => {
                    const isHigh = h.heartRate > 100;
                    return (
                      <tr key={i}>
                        <td style={S.tableCell}>{new Date(h.timestamp).toLocaleDateString('en-IN')}</td>
                        <td style={S.tableCell}><span style={S.pill(!isHigh)}>{h.heartRate} bpm</span></td>
                        <td style={S.tableCell}>{h.bloodPressureSystolic || '--'}/{h.bloodPressureDiastolic || '--'}</td>
                        <td style={S.tableCell}>{h.glucoseLevel || '--'}</td>
                        <td style={S.tableCell}><span style={S.pill(!isHigh)}>{isHigh ? '⚠ High' : '✓ Normal'}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
