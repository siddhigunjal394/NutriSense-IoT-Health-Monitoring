import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const BADGES = [
  { id: 'first_scan',    icon: '💓', name: 'First Heartbeat',   desc: 'Complete your first heart scan',   xp: 50  },
  { id: 'first_meal',    icon: '🍽️', name: 'First Bite',        desc: 'Log your first meal',              xp: 30  },
  { id: 'streak_3',      icon: '🔥', name: '3-Day Streak',      desc: 'Log meals 3 days in a row',        xp: 100 },
  { id: 'streak_7',      icon: '⚡', name: 'Week Warrior',      desc: '7-day logging streak',             xp: 250 },
  { id: 'streak_30',     icon: '👑', name: 'Monthly Master',    desc: '30-day logging streak',            xp: 1000},
  { id: 'photo_scan_5',  icon: '📸', name: 'Food Photographer', desc: 'Scan 5 meals with camera',         xp: 150 },
  { id: 'protein_goal',  icon: '💪', name: 'Protein Champion',  desc: 'Hit protein goal 5 days in a row', xp: 200 },
  { id: 'hydration',     icon: '💧', name: 'Stay Hydrated',     desc: 'Log water intake for 7 days',      xp: 120 },
  { id: 'heart_health',  icon: '❤️', name: 'Heart Hero',        desc: 'Complete 10 heart scans',          xp: 300 },
  { id: 'calorie_goal',  icon: '🎯', name: 'On Target',         desc: 'Hit calorie goal 7 days in a row', xp: 300 },
  { id: 'bmi_normal',    icon: '⚖️', name: 'Balanced Body',     desc: 'Maintain normal BMI for 30 days',  xp: 500 },
  { id: 'ai_consulted',  icon: '🤖', name: 'AI Powered',        desc: 'Get 10 AI diet recommendations',   xp: 100 },
];

const CHALLENGES = [
  { id: 'c1', title: 'Log 3 meals today',      xp: 50,  icon: '🍽️', type: 'daily'  },
  { id: 'c2', title: 'Hit your protein goal',  xp: 75,  icon: '💪', type: 'daily'  },
  { id: 'c3', title: 'Scan a meal with camera',xp: 60,  icon: '📸', type: 'daily'  },
  { id: 'c4', title: 'Complete heart scan',    xp: 80,  icon: '💓', type: 'daily'  },
  { id: 'c5', title: '7-day meal streak',      xp: 200, icon: '🔥', type: 'weekly' },
  { id: 'c6', title: 'Stay under calorie limit 5 days', xp: 250, icon: '🎯', type: 'weekly' },
];

export default function Rewards() {
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('overview');
  const [toast, setToast]       = useState({ show: false, message: '', type: 'success' });

  const showToast = (msg, type = 'success') => setToast({ show: true, message: msg, type });

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/gamification/stats/${user?.id}`);
      setStats(res.data);
    } catch {
      // fallback demo data
      setStats({
        xp: 420, level: 3, streak: 5, longestStreak: 12,
        mealsLogged: 23, scansCompleted: 4, badgesEarned: ['first_scan', 'first_meal', 'streak_3', 'photo_scan_5'],
        challengesCompleted: ['c1', 'c4'],
        nextLevelXp: 600, currentLevelXp: 300,
        weeklyScore: 72,
        rank: 'Nutrition Enthusiast',
      });
    } finally { setLoading(false); }
  };

  const claimChallenge = async (challengeId) => {
    try {
      await axios.post(`${API}/api/gamification/claim`, { userId: user?.id, challengeId });
      showToast('🎉 Challenge claimed! XP added.');
      fetchStats();
    } catch { showToast('❌ Already claimed or not completed yet', 'error'); }
  };

  if (loading) return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading rewards...</div>
      </div>
    </div>
  );

  const xpProgress = stats ? Math.round(((stats.xp - stats.currentLevelXp) / (stats.nextLevelXp - stats.currentLevelXp)) * 100) : 0;

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-syne text-2xl font-bold mb-1">🏆 Rewards & Streaks</h1>
          <p className="text-slate-400 text-sm mb-6">Track your progress, earn badges, complete challenges</p>

          {/* Level Card */}
          <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#00d4aa]/10 border border-[#00d4aa]/20 flex flex-col items-center justify-center">
                  <span className="font-syne font-bold text-xl text-[#00d4aa]">{stats?.level}</span>
                  <span className="text-slate-500 text-xs">LVL</span>
                </div>
                <div>
                  <div className="font-syne font-bold text-lg">{stats?.rank}</div>
                  <div className="text-xs text-slate-400">{stats?.xp} XP total</div>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <span className="text-xl">🔥</span>
                <div>
                  <div className="font-syne font-bold text-orange-400">{stats?.streak} days</div>
                  <div className="text-xs text-slate-500">current streak</div>
                </div>
              </div>
            </div>

            {/* XP Bar */}
            <div className="mb-1 flex justify-between text-xs text-slate-400">
              <span>Level {stats?.level}</span>
              <span>{stats?.xp - stats?.currentLevelXp} / {stats?.nextLevelXp - stats?.currentLevelXp} XP to next level</span>
            </div>
            <div className="h-3 bg-[#111827] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #00d4aa, #0ea5e9)' }} />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { icon: '🍽️', label: 'Meals logged',    value: stats?.mealsLogged,     color: '#00d4aa' },
              { icon: '💓', label: 'Heart scans',      value: stats?.scansCompleted,  color: '#ef4444' },
              { icon: '⚡', label: 'Longest streak',   value: stats?.longestStreak + 'd', color: '#f59e0b' },
              { icon: '📊', label: 'Weekly score',     value: stats?.weeklyScore + '%',color: '#0ea5e9' },
            ].map((s, i) => (
              <div key={i} className="bg-[#131d2e] border border-[rgba(99,179,237,0.12)] rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="font-syne font-bold text-lg" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-5">
            {['overview', 'badges', 'challenges'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-xl text-sm font-syne font-semibold transition-all capitalize ${tab === t ? 'text-[#080c14]' : 'text-slate-400 border border-[rgba(99,179,237,0.12)] hover:border-[#00d4aa]/30'}`}
                style={tab === t ? { background: 'linear-gradient(135deg,#00d4aa,#00b890)' } : {}}>
                {t}
              </button>
            ))}
          </div>

          {/* Tab: Overview */}
          {tab === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              {/* Recent badges */}
              <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-5">
                <h3 className="font-syne font-semibold mb-3">Recent Badges</h3>
                <div className="grid grid-cols-3 gap-3">
                  {BADGES.filter(b => stats?.badgesEarned?.includes(b.id)).slice(0, 6).map((b, i) => (
                    <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}
                      className="flex flex-col items-center gap-1 p-3 bg-[#090e19]/90 rounded-xl border border-[rgba(99,179,237,0.06)]">
                      <span className="text-2xl">{b.icon}</span>
                      <span className="text-xs text-slate-300 text-center leading-tight">{b.name}</span>
                      <span className="text-xs text-[#00d4aa]">+{b.xp} XP</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Today challenges */}
              <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-5">
                <h3 className="font-syne font-semibold mb-3">Today's Challenges</h3>
                <div className="space-y-2">
                  {CHALLENGES.filter(c => c.type === 'daily').map((c, i) => {
                    const done = stats?.challengesCompleted?.includes(c.id);
                    return (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${done ? 'bg-[#00d4aa]/5 border-[#00d4aa]/20' : 'bg-[#111827] border-[rgba(99,179,237,0.06)]'}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{c.icon}</span>
                          <span className={`text-xs ${done ? 'text-slate-400 line-through' : 'text-slate-300'}`}>{c.title}</span>
                        </div>
                        {done
                          ? <span className="text-xs text-[#00d4aa]">✅ Done</span>
                          : <button onClick={() => claimChallenge(c.id)}
                              className="px-2 py-1 rounded-lg text-xs font-syne font-bold text-[#080c14]"
                              style={{ background: 'linear-gradient(135deg,#00d4aa,#00b890)' }}>
                              +{c.xp} XP
                            </button>
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Badges */}
          {tab === 'badges' && (
            <div className="grid grid-cols-3 gap-4">
              {BADGES.map((b, i) => {
                const earned = stats?.badgesEarned?.includes(b.id);
                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`p-4 rounded-2xl border transition-all ${earned ? 'bg-[#131d2e] border-[#00d4aa]/30' : 'bg-[#0d1520] border-[rgba(99,179,237,0.06)] opacity-50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${earned ? 'bg-[#00d4aa]/10' : 'bg-[#111827]'}`}>
                        {earned ? b.icon : '🔒'}
                      </div>
                      <div>
                        <div className="font-syne font-semibold text-sm">{b.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{b.desc}</div>
                        <div className={`text-xs mt-1 font-bold ${earned ? 'text-[#00d4aa]' : 'text-slate-600'}`}>+{b.xp} XP</div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Tab: Challenges */}
          {tab === 'challenges' && (
            <div className="space-y-3">
              {['daily', 'weekly'].map(type => (
                <div key={type}>
                  <div className="text-xs font-syne text-slate-500 uppercase tracking-wider mb-2 capitalize">{type} challenges</div>
                  {CHALLENGES.filter(c => c.type === type).map((c, i) => {
                    const done = stats?.challengesCompleted?.includes(c.id);
                    return (
                      <div key={i} className={`flex items-center justify-between p-4 rounded-2xl border mb-2 ${done ? 'bg-[#00d4aa]/5 border-[#00d4aa]/20' : 'bg-[#131d2e] border-[rgba(99,179,237,0.12)]'}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{c.icon}</span>
                          <div>
                            <div className={`font-syne font-semibold text-sm ${done ? 'text-slate-400 line-through' : ''}`}>{c.title}</div>
                            <div className="text-xs text-slate-500 mt-0.5">{type} challenge • {c.xp} XP reward</div>
                          </div>
                        </div>
                        {done
                          ? <div className="px-3 py-1.5 rounded-xl text-xs font-syne font-bold text-[#00d4aa] bg-[#00d4aa]/10 border border-[#00d4aa]/20">Claimed</div>
                          : <button onClick={() => claimChallenge(c.id)}
                              className="px-4 py-2 rounded-xl text-sm font-syne font-bold text-[#080c14] transition-all hover:scale-105"
                              style={{ background: 'linear-gradient(135deg,#00d4aa,#00b890)' }}>
                              Claim +{c.xp} XP
                            </button>
                        }
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
      <Toast {...toast} onClose={() => setToast(p => ({ ...p, show: false }))} />
    </div>
  );
}

