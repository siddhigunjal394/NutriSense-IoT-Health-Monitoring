import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function BMITracker() {
  const { user } = useAuth();
  const [form, setForm]     = useState({ weight: '', height: '', age: '', gender: 'female', activityLevel: 'moderate' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [toast, setToast]   = useState({ show: false, message: '', type: 'success' });

  const showToast = (msg, type = 'success') => setToast({ show: true, message: msg, type });

  useEffect(() => {
    axios.get(`${API}/api/bmi/${user?.id}`).then(r => {
      if (r.data?.weight) { setForm(f => ({ ...f, ...r.data })); setResult(r.data.result); }
    }).catch(() => {});
  }, []);

  const calculate = async () => {
    if (!form.weight || !form.height || !form.age) return showToast('Fill all fields', 'error');
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/bmi/calculate`, { ...form, userId: user?.id });
      setResult(res.data);
      setSaved(false);
    } catch { showToast('Calculation failed', 'error'); }
    finally { setLoading(false); }
  };

  const saveResult = async () => {
    try {
      await axios.post(`${API}/api/bmi/save`, { userId: user?.id, form, result });
      setSaved(true);
      showToast('✅ BMI data saved!');
    } catch { showToast('Save failed', 'error'); }
  };

  const BMI_ZONES = [
    { label: 'Underweight', range: '< 18.5', color: '#0ea5e9', min: 0,    max: 18.5 },
    { label: 'Normal',      range: '18.5–24.9', color: '#00d4aa', min: 18.5, max: 25   },
    { label: 'Overweight',  range: '25–29.9', color: '#f59e0b', min: 25,   max: 30   },
    { label: 'Obese',       range: '≥ 30',   color: '#ef4444', min: 30,   max: 50   },
  ];

  const getBMIColor = (bmi) => {
    if (!bmi) return '#00d4aa';
    if (bmi < 18.5) return '#0ea5e9';
    if (bmi < 25)   return '#00d4aa';
    if (bmi < 30)   return '#f59e0b';
    return '#ef4444';
  };

  const getBMIPercent = (bmi) => Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100));

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-syne text-2xl font-bold mb-1">⚖️ BMI & Body Composition</h1>
          <p className="text-slate-400 text-sm mb-6">Calculate your BMI, body fat %, and personalized macro targets</p>

          <div className="grid grid-cols-2 gap-6">
            {/* INPUT */}
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
              <h3 className="font-syne font-semibold mb-4">Your Details</h3>
              <div className="space-y-4">
                {[
                  { key: 'weight', label: 'Weight', placeholder: 'e.g. 65', unit: 'kg' },
                  { key: 'height', label: 'Height', placeholder: 'e.g. 165', unit: 'cm' },
                  { key: 'age',    label: 'Age',    placeholder: 'e.g. 22',  unit: 'yrs' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-slate-400 mb-1 block">{f.label}</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={form[f.key]}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="flex-1 bg-[#111827] border border-[rgba(99,179,237,0.12)] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00d4aa]/50"
                      />
                      <span className="px-3 py-2.5 bg-[#111827] border border-[rgba(99,179,237,0.08)] rounded-xl text-xs text-slate-500">{f.unit}</span>
                    </div>
                  </div>
                ))}

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Gender</label>
                  <div className="flex gap-2">
                    {['male', 'female'].map(g => (
                      <button key={g} onClick={() => setForm(p => ({ ...p, gender: g }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-syne capitalize transition-all ${form.gender === g ? 'text-[#080c14] font-bold' : 'text-slate-400 border border-[rgba(99,179,237,0.12)]'}`}
                        style={form.gender === g ? { background: 'linear-gradient(135deg,#00d4aa,#00b890)' } : {}}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Activity Level</label>
                  <select value={form.activityLevel} onChange={e => setForm(p => ({ ...p, activityLevel: e.target.value }))}
                    className="w-full bg-[#111827] border border-[rgba(99,179,237,0.12)] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#00d4aa]/50">
                    <option value="sedentary">Sedentary (little/no exercise)</option>
                    <option value="light">Light (1–3 days/week)</option>
                    <option value="moderate">Moderate (3–5 days/week)</option>
                    <option value="active">Active (6–7 days/week)</option>
                    <option value="very_active">Very Active (athlete)</option>
                  </select>
                </div>

                <button onClick={calculate} disabled={loading}
                  className="w-full py-3 rounded-xl font-syne font-bold text-sm text-[#080c14] disabled:opacity-50 transition-all hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg,#00d4aa,#00b890)' }}>
                  {loading ? 'Calculating...' : '⚖️ Calculate BMI'}
                </button>
              </div>
            </div>

            {/* RESULTS */}
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
              <h3 className="font-syne font-semibold mb-4">📊 Results</h3>

              {!result ? (
                <div className="text-center py-16 text-slate-500">
                  <div className="text-4xl mb-3">⚖️</div>
                  <div className="text-sm">Enter your details and<br />click Calculate BMI</div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {/* BMI Circle */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 flex-shrink-0"
                      style={{ borderColor: getBMIColor(result.bmi), background: `${getBMIColor(result.bmi)}15` }}>
                      <span className="font-syne font-bold text-2xl" style={{ color: getBMIColor(result.bmi) }}>{result.bmi}</span>
                      <span className="text-xs text-slate-400">BMI</span>
                    </div>
                    <div>
                      <div className="font-syne font-bold text-lg" style={{ color: getBMIColor(result.bmi) }}>{result.category}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Body Fat: ~{result.bodyFatPercent}%</div>
                      <div className="text-xs text-slate-400">Ideal weight: {result.idealWeight} kg</div>
                    </div>
                  </div>

                  {/* BMI Scale */}
                  <div>
                    <div className="h-3 rounded-full overflow-hidden flex mb-1" style={{ background: '#111827' }}>
                      {BMI_ZONES.map((z, i) => (
                        <div key={i} className="h-full flex-1" style={{ background: z.color, opacity: 0.3 }} />
                      ))}
                    </div>
                    <div className="relative h-2">
                      <div className="absolute w-3 h-3 rounded-full border-2 border-white -top-2.5"
                        style={{ left: `${getBMIPercent(result.bmi)}%`, background: getBMIColor(result.bmi), transform: 'translateX(-50%)' }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-600 mt-2">
                      {BMI_ZONES.map((z, i) => <span key={i}>{z.label}</span>)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Daily Calories (TDEE)', value: result.tdee + ' kcal', color: '#00d4aa' },
                      { label: 'Calories to reach goal', value: result.goalCalories + ' kcal', color: '#0ea5e9' },
                      { label: 'Protein target', value: result.proteinTarget + 'g', color: '#f59e0b' },
                      { label: 'Carbs target', value: result.carbsTarget + 'g', color: '#8b5cf6' },
                    ].map((s, i) => (
                      <div key={i} className="bg-[#090e19]/90 rounded-xl p-3 border border-[rgba(99,179,237,0.06)]">
                        <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                        <div className="font-syne font-bold text-sm" style={{ color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {result.aiAdvice && (
                    <div className="p-3 bg-[#111827] border border-[rgba(99,179,237,0.08)] rounded-xl text-xs text-slate-300 leading-relaxed">
                      🤖 {result.aiAdvice}
                    </div>
                  )}

                  <button onClick={saveResult} disabled={saved}
                    className="w-full py-2.5 rounded-xl text-sm font-syne font-semibold transition-all"
                    style={saved ? { background: 'rgba(0,212,170,0.1)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.3)' } : { background: 'linear-gradient(135deg,#00d4aa,#00b890)', color: '#080c14' }}>
                    {saved ? '✅ Saved to Profile' : '💾 Save Results'}
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <Toast {...toast} onClose={() => setToast(p => ({ ...p, show: false }))} />
    </div>
  );
}

