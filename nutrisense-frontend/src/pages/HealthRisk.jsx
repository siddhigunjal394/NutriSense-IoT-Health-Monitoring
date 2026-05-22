import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function HealthRisk() {
  const { user } = useAuth();
  const [risk, setRisk]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState({ show: false, message: '', type: 'success' });

  useEffect(() => { fetchRisk(); }, []);

  const fetchRisk = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/health-risk/${user?.id}`);
      setRisk(res.data);
    } catch {
      // demo fallback
      setRisk({
        heartRate: 88,
        hrCorrelation: { status: 'elevated', advice: 'Your heart rate is slightly elevated. Try magnesium-rich foods like spinach, almonds and dark chocolate. Avoid caffeine today.', suggestedFoods: ['Spinach', 'Almonds', 'Dark Chocolate', 'Bananas', 'Avocado'] },
        diabetesRisk:   { score: 32, level: 'Low',    color: '#00d4aa', reason: 'Good fiber intake. Moderate sugar levels detected.' },
        hypertensionRisk: { score: 45, level: 'Moderate', color: '#f59e0b', reason: 'Slightly high sodium average over past week.' },
        heartDiseaseRisk: { score: 28, level: 'Low',    color: '#00d4aa', reason: 'Good omega-3 intake. Keep it up.' },
        obesityRisk:    { score: 20, level: 'Low',    color: '#00d4aa', reason: 'Calorie intake within healthy range.' },
        overallScore:   38,
        daysAnalyzed:   14,
        recommendations: ['Reduce sodium intake — aim below 2300mg/day', 'Add more potassium-rich foods like bananas', 'Maintain your current fiber intake — excellent!'],
      });
    } finally { setLoading(false); }
  };

  const getRiskColor = (level) => ({ Low: '#00d4aa', Moderate: '#f59e0b', High: '#ef4444' }[level] || '#00d4aa');
  const getRiskBg    = (level) => ({ Low: 'bg-[#00d4aa]/5 border-[#00d4aa]/20', Moderate: 'bg-yellow-500/5 border-yellow-500/20', High: 'bg-red-500/5 border-red-500/20' }[level] || '');

  if (loading) return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}><Sidebar />
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm animate-pulse">Analyzing your health data...</div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-syne text-2xl font-bold mb-1">🩺 Health Risk Analysis</h1>
          <p className="text-slate-400 text-sm mb-6">
            Based on {risk?.daysAnalyzed || 0} days of meal logs + heart scan data
          </p>

          {/* rPPG ↔ Diet Correlation — UNIQUE FEATURE */}
          {risk?.heartRate && (
            <div className={`rounded-2xl border p-5 mb-6 ${risk.hrCorrelation?.status === 'elevated' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-[#00d4aa]/5 border-[#00d4aa]/20'}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">💓</span>
                <div>
                  <div className="font-syne font-bold">Heart Rate → Diet Correlation</div>
                  <div className="text-xs text-slate-400">Last scan: {risk.heartRate} BPM — {risk.hrCorrelation?.status === 'elevated' ? 'Elevated ⚠️' : 'Normal ✅'}</div>
                </div>
              </div>
              <p className="text-sm text-slate-300 mb-3">{risk.hrCorrelation?.advice}</p>
              <div className="flex flex-wrap gap-2">
                {risk.hrCorrelation?.suggestedFoods?.map((f, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs bg-[#131d2e] border border-[rgba(99,179,237,0.12)] text-slate-300">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Overall Score */}
          <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-5 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-syne font-bold text-lg">Overall Risk Score</div>
                <div className="text-xs text-slate-400 mt-0.5">Lower is better • Based on diet patterns</div>
              </div>
              <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 ${risk?.overallScore < 33 ? 'border-[#00d4aa] bg-[#00d4aa]/10' : risk?.overallScore < 66 ? 'border-yellow-400 bg-yellow-400/10' : 'border-red-400 bg-red-400/10'}`}>
                <span className="font-syne font-bold text-2xl" style={{ color: risk?.overallScore < 33 ? '#00d4aa' : risk?.overallScore < 66 ? '#f59e0b' : '#ef4444' }}>
                  {risk?.overallScore}
                </span>
                <span className="text-xs text-slate-400">/100</span>
              </div>
            </div>
          </div>

          {/* Risk Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: 'Diabetes Risk',     data: risk?.diabetesRisk     },
              { label: 'Hypertension Risk', data: risk?.hypertensionRisk },
              { label: 'Heart Disease Risk',data: risk?.heartDiseaseRisk },
              { label: 'Obesity Risk',      data: risk?.obesityRisk      },
            ].map((r, i) => r.data && (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className={`rounded-2xl border p-4 ${getRiskBg(r.data.level)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-syne font-semibold text-sm">{r.label}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ color: getRiskColor(r.data.level), background: `${getRiskColor(r.data.level)}20` }}>
                    {r.data.level}
                  </span>
                </div>
                <div className="h-2 bg-[#111827] rounded-full overflow-hidden mb-2">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${r.data.score}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full" style={{ background: getRiskColor(r.data.level) }} />
                </div>
                <div className="text-xs text-slate-400">{r.data.reason}</div>
              </motion.div>
            ))}
          </div>

          {/* Recommendations */}
          {risk?.recommendations?.length > 0 && (
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-5">
              <h3 className="font-syne font-semibold mb-3">💡 Personalized Recommendations</h3>
              <div className="space-y-2">
                {risk.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] mt-2 flex-shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
      <Toast {...toast} onClose={() => setToast(p => ({ ...p, show: false }))} />
    </div>
  );
}

