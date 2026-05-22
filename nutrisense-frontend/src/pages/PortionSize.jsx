import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const REFERENCE_OBJECTS = [
  { id: 'credit_card', label: 'Credit Card',  size: '85.6 × 54mm',  icon: '💳' },
  { id: 'coin_10',     label: '10 Rs Coin',   size: '27mm dia',     icon: '🪙' },
  { id: 'hand',        label: 'My Hand',      size: 'auto-detect',  icon: '✋' },
  { id: 'spoon',       label: 'Tablespoon',   size: '~18ml',        icon: '🥄' },
];

export default function PortionSize() {
  const { user } = useAuth();
  const [image, setImage]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [refObj, setRefObj]     = useState('credit_card');
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [logged, setLogged]     = useState(false);
  const [toast, setToast]       = useState({ show: false, message: '', type: 'success' });
  const fileRef = useRef();

  const showToast = (msg, type = 'success') => setToast({ show: true, message: msg, type });

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setLogged(false);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('referenceObject', refObj);
      formData.append('userId', user?.id);
      const res = await axios.post(`${API}/api/portion/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      showToast(`✅ Portion analyzed: ${res.data.estimatedGrams}g`);
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || 'Could not estimate portion. Try a clearer photo.'), 'error');
    } finally { setLoading(false); }
  };

  const logMeal = async () => {
    if (!result) return;
    try {
      await axios.post(`${API}/api/food/log-meal`, {
        userId: user?.id,
        foodName: result.foodName,
        calories: result.calories,
        protein:  result.protein,
        carbs:    result.carbs,
        fat:      result.fat,
        fiber:    result.fiber || 2,
        mealType: 'snack',
        source:   'portion_scan',
      });
      setLogged(true);
      showToast('✅ Meal logged!');
    } catch { showToast('❌ Failed to log', 'error'); }
  };

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-syne text-2xl font-bold mb-1">📐 Portion Size Estimator</h1>
          <p className="text-slate-400 text-sm mb-6">
            Place a reference object next to your food → AI estimates exact grams + calories
          </p>

          <div className="grid grid-cols-2 gap-6">
            {/* LEFT */}
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6 space-y-5">
              <div>
                <h3 className="font-syne font-semibold mb-3">1. Choose reference object</h3>
                <div className="grid grid-cols-2 gap-2">
                  {REFERENCE_OBJECTS.map(r => (
                    <button key={r.id} onClick={() => setRefObj(r.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all border ${refObj === r.id ? 'border-[#00d4aa]/40 bg-[#00d4aa]/10 text-[#00d4aa]' : 'border-[rgba(99,179,237,0.12)] text-slate-400 hover:border-[#00d4aa]/20'}`}>
                      <span className="text-lg">{r.icon}</span>
                      <div className="text-left">
                        <div className="text-xs font-semibold">{r.label}</div>
                        <div className="text-xs text-slate-500">{r.size}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-syne font-semibold mb-3">2. Upload photo</h3>
                {!preview ? (
                  <div onClick={() => fileRef.current.click()}
                    onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                    onDragOver={e => e.preventDefault()}
                    className="border-2 border-dashed border-[rgba(99,179,237,0.2)] rounded-2xl p-8 text-center cursor-pointer hover:border-[#00d4aa] hover:bg-[#00d4aa]/5 transition-all">
                    <div className="text-4xl mb-3">📐</div>
                    <div className="text-sm text-slate-400">Place <span className="text-[#00d4aa]">{REFERENCE_OBJECTS.find(r => r.id === refObj)?.label}</span> next to food, then upload</div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={e => handleFile(e.target.files[0])} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden" style={{ height: 200 }}>
                      <img src={preview} alt="food" className="w-full h-full object-cover" />
                      {loading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                          <div className="w-8 h-8 border-2 border-[#00d4aa] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-[#00d4aa]">Estimating portion...</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={analyze} disabled={loading}
                        className="flex-1 py-2.5 rounded-xl font-syne font-bold text-sm text-[#080c14] disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg,#00d4aa,#00b890)' }}>
                        {loading ? 'Analyzing...' : '📐 Estimate Portion'}
                      </button>
                      <button onClick={() => { setImage(null); setPreview(null); setResult(null); }}
                        className="px-3 py-2.5 rounded-xl text-slate-400 border border-[rgba(99,179,237,0.12)] hover:text-red-400 hover:border-red-400/30 transition-all text-sm">✕</button>
                    </div>
                  </div>
                )}
              </div>

              {/* How it works */}
              <div className="p-3 bg-[#111827] border border-[rgba(99,179,237,0.08)] rounded-xl">
                <div className="text-xs font-syne text-slate-500 uppercase tracking-wider mb-2">How it works</div>
                {[
                  '📸 AI detects food and reference object in photo',
                  '📏 Estimates food area relative to reference size',
                  '⚖️ Calculates weight in grams using food density',
                  '🔢 Returns accurate calories and macros',
                ].map((t, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400 mb-1">
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
              <h3 className="font-syne font-semibold mb-4">📊 Portion Analysis</h3>

              {!result && !loading && (
                <div className="text-center py-16 text-slate-500">
                  <div className="text-4xl mb-3">📐</div>
                  <div className="text-sm">Upload a photo with a reference<br />object to estimate portion size</div>
                </div>
              )}

              <AnimatePresence>
                {result && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {/* Food + portion */}
                    <div className="flex items-center gap-3 p-3 bg-[#00d4aa]/5 border border-[#00d4aa]/20 rounded-xl">
                      <span className="text-3xl">{result.emoji || '🍽️'}</span>
                      <div>
                        <div className="font-syne font-bold text-[#00d4aa]">{result.foodName}</div>
                        <div className="text-xs text-slate-400">
                          ~{result.estimatedGrams}g • {result.portionDescription}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Confidence: {result.confidence} • Ref: {REFERENCE_OBJECTS.find(r => r.id === refObj)?.label}
                        </div>
                      </div>
                    </div>

                    {/* Portion visual */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Estimated Weight', value: `${result.estimatedGrams}g`,  color: '#00d4aa', icon: '⚖️' },
                        { label: 'Calories',          value: `${result.calories} kcal`,    color: '#ef4444', icon: '🔥' },
                        { label: 'Protein',           value: `${result.protein}g`,         color: '#0ea5e9', icon: '💪' },
                        { label: 'Carbs',             value: `${result.carbs}g`,           color: '#f59e0b', icon: '🌾' },
                        { label: 'Fat',               value: `${result.fat}g`,             color: '#8b5cf6', icon: '🫒' },
                        { label: 'Fiber',             value: `${result.fiber || 2}g`,      color: '#10b981', icon: '🥦' },
                      ].map((s, i) => (
                        <div key={i} className="bg-[#090e19]/90 rounded-xl p-3 border border-[rgba(99,179,237,0.06)] flex items-center gap-2">
                          <span className="text-lg">{s.icon}</span>
                          <div>
                            <div className="text-xs text-slate-500">{s.label}</div>
                            <div className="font-syne font-bold text-sm" style={{ color: s.color }}>{s.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Portion comparison */}
                    {result.portionComparison && (
                      <div className="p-3 bg-[#111827] border border-[rgba(99,179,237,0.08)] rounded-xl text-xs text-slate-300">
                        📏 {result.portionComparison}
                      </div>
                    )}

                    {result.aiNote && (
                      <div className="p-3 bg-[#0ea5e9]/5 border border-[#0ea5e9]/20 rounded-xl text-xs text-slate-300 leading-relaxed">
                        🤖 {result.aiNote}
                      </div>
                    )}

                    <button onClick={logMeal} disabled={logged}
                      className="w-full py-3 rounded-xl font-syne font-bold text-sm transition-all"
                      style={logged
                        ? { background: 'rgba(0,212,170,0.1)', color: '#00d4aa', border: '1px solid rgba(0,212,170,0.3)' }
                        : { background: 'linear-gradient(135deg,#00d4aa,#00b890)', color: '#080c14' }}>
                      {logged ? '✅ Logged to Meal Logger' : '➕ Log This Meal'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
      <Toast {...toast} onClose={() => setToast(p => ({ ...p, show: false }))} />
    </div>
  );
}

