import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { addHealthData } from '../services/api';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';

export default function Vitals() {
  const { user } = useAuth();
  const [form, setForm] = useState({ heartRate: '', systolic: '', diastolic: '', glucose: '', oxygen: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => setToast({ show: true, message, type });

  const handleSubmit = async () => {
    if (!form.heartRate) { showToast('Heart rate is required!', 'error'); return; }
    setLoading(true);
    try {
      const res = await addHealthData({
        userId: user.id,
        heartRate: +form.heartRate,
        bloodPressureSystolic: +form.systolic || undefined,
        bloodPressureDiastolic: +form.diastolic || undefined,
        glucoseLevel: +form.glucose || undefined,
        oxygenLevel: +form.oxygen || undefined,
      });
      setResult(res.data);
      showToast('Vitals saved! AI analysis complete ✅');
    } catch (e) {
      showToast('Failed to save vitals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-transparent border-none outline-none font-syne text-2xl font-bold text-white placeholder-slate-700";

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-syne text-2xl font-bold mb-1">Log Vitals</h1>
          <p className="text-slate-400 text-sm mb-6">Record your health measurements for AI analysis</p>

          <div className="grid grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
              <h3 className="font-syne font-semibold mb-5">🩺 Enter Your Vitals</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'heartRate', label: 'Heart Rate', unit: 'BPM', hint: 'Normal: 60–100', required: true, accent: '#00d4aa' },
                  { key: 'systolic', label: 'Systolic BP', unit: 'mmHg', hint: 'Normal: <120', accent: '#0ea5e9' },
                  { key: 'diastolic', label: 'Diastolic BP', unit: 'mmHg', hint: 'Normal: <80', accent: '#0ea5e9' },
                  { key: 'glucose', label: 'Glucose', unit: 'mg/dL', hint: 'Normal: 70–140', accent: '#f59e0b' },
                  { key: 'oxygen', label: 'SpO2', unit: '%', hint: 'Normal: 95–100', accent: '#a78bfa' },
                ].map(field => (
                  <div key={field.key}
                    className="bg-[#090e19]/90 rounded-xl p-4 border border-[rgba(99,179,237,0.08)] hover:border-opacity-30 transition-all"
                    style={{ '--accent': field.accent }}
                    onFocus={() => {}} >
                    <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </div>
                    <input
                      type="number"
                      className={inputClass}
                      placeholder="--"
                      value={form[field.key]}
                      onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
                    />
                    <div className="text-xs text-slate-600 mt-1">{field.unit} • {field.hint}</div>
                  </div>
                ))}
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full mt-5 py-3 rounded-xl font-syne font-semibold text-[#080c14] transition-all hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #00d4aa, #00b890)' }}>
                {loading ? '⏳ Analyzing...' : '📤 Submit & Get AI Recommendation'}
              </button>
            </div>

            {/* Result Panel */}
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
              <h3 className="font-syne font-semibold mb-5">🤖 AI Analysis Result</h3>
              {!result ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-4xl mb-3">⏳</div>
                  <div className="text-sm">Submit your vitals to get<br />AI-powered health analysis</div>
                </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  {/* Status */}
                  <div className="px-4 py-3 rounded-xl bg-[#00d4aa]/5 border border-[#00d4aa]/20">
                    <div className="text-xs text-slate-400 mb-1">Health Status</div>
                    <div className="font-syne font-bold text-[#00d4aa]">{result.recommendation?.status}</div>
                  </div>

                  {/* AI Summary */}
                  {result.aiAdvice?.summary && (
                    <div className="px-4 py-3 rounded-xl bg-[#111827] border border-[rgba(99,179,237,0.08)]">
                      <div className="text-xs text-slate-400 mb-1">AI Summary</div>
                      <div className="text-sm text-slate-300 leading-relaxed">{result.aiAdvice.summary}</div>
                    </div>
                  )}

                  {/* Meal Plan */}
                  {result.aiAdvice && (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: '🍳 Breakfast', value: result.aiAdvice.breakfast },
                        { label: '🥗 Lunch', value: result.aiAdvice.lunch },
                        { label: '🍽️ Dinner', value: result.aiAdvice.dinner },
                        { label: '🏃 Exercise', value: result.aiAdvice.exercise },
                      ].map((item, i) => (
                        <div key={i} className="bg-[#090e19]/90 rounded-xl p-3 border border-[rgba(99,179,237,0.08)]">
                          <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                          <div className="text-xs text-slate-300 leading-relaxed">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Alerts */}
                  {result.recommendation?.alerts?.length > 0 && (
                    <div className="space-y-1">
                      {result.recommendation.alerts.map((a, i) => (
                        <div key={i} className="px-3 py-2 rounded-xl text-xs bg-yellow-500/5 border border-yellow-500/20 text-yellow-300">{a}</div>
                      ))}
                    </div>
                  )}

                  {/* Warning */}
                  {result.aiAdvice?.warning && (
                    <div className="px-3 py-2 rounded-xl text-xs bg-red-500/5 border border-red-500/20 text-red-300">
                      ⚠️ {result.aiAdvice.warning}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
      <Toast {...toast} onClose={() => setToast(p => ({ ...p, show: false }))} />
    </div>
  );
}
