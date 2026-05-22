import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PhotoScanner() {
  const { user } = useAuth();
  const [image, setImage]         = useState(null);
  const [preview, setPreview]     = useState(null);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [logged, setLogged]       = useState(false);
  const [toast, setToast]         = useState({ show: false, message: '', type: 'success' });
  const fileRef = useRef();

  const showToast = (msg, type = 'success') => setToast({ show: true, message: msg, type });

  const handleFile = (file) => {
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setLogged(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('userId', user?.id);
      const res = await axios.post(`${API}/api/food/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      showToast(`✅ Detected: ${res.data.foodName}`);
    } catch (err) {
      showToast('❌ ' + (err.response?.data?.error || 'Could not analyze image. Try a clearer photo.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const logMeal = async () => {
    if (!result) return;
    try {
      await axios.post(`${API}/api/food/log-meal`, {
        userId: user?.id,
        foodName: result.foodName,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        fiber: result.fiber,
        mealType: 'snack',
      });
      setLogged(true);
      showToast('✅ Meal logged successfully!');
    } catch {
      showToast('❌ Failed to log meal', 'error');
    }
  };

  const reset = () => { setImage(null); setPreview(null); setResult(null); setLogged(false); };

  const macros = result ? [
    { label: 'Calories', value: result.calories, unit: 'kcal', color: '#00d4aa', width: Math.min(100, (result.calories / 800) * 100) },
    { label: 'Protein',  value: result.protein,  unit: 'g',    color: '#0ea5e9', width: Math.min(100, (result.protein / 50) * 100) },
    { label: 'Carbs',    value: result.carbs,    unit: 'g',    color: '#f59e0b', width: Math.min(100, (result.carbs / 100) * 100) },
    { label: 'Fat',      value: result.fat,      unit: 'g',    color: '#ef4444', width: Math.min(100, (result.fat / 65) * 100) },
    { label: 'Fiber',    value: result.fiber,    unit: 'g',    color: '#8b5cf6', width: Math.min(100, (result.fiber / 30) * 100) },
  ] : [];

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-syne text-2xl font-bold mb-1">📸 Food Photo Scanner</h1>
          <p className="text-slate-400 text-sm mb-6">Take a photo of your meal → instant nutrition breakdown</p>

          <div className="grid grid-cols-2 gap-6">
            {/* LEFT: Upload */}
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
              <h3 className="font-syne font-semibold mb-4">Upload Food Photo</h3>

              {!preview ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current.click()}
                  className="border-2 border-dashed border-[rgba(99,179,237,0.2)] rounded-2xl p-10 text-center cursor-pointer hover:border-[#00d4aa] hover:bg-[#00d4aa]/5 transition-all"
                >
                  <div className="text-5xl mb-4">🍽️</div>
                  <div className="font-syne font-bold text-lg mb-2">Drop food photo here</div>
                  <div className="text-sm text-slate-400 mb-4">or click to browse</div>
                  <div className="text-xs text-slate-500">JPG, PNG, WEBP supported</div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => handleFile(e.target.files[0])} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden" style={{ height: 240 }}>
                    <img src={preview} alt="food" className="w-full h-full object-cover" />
                    {loading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3">
                        <div className="w-10 h-10 border-3 border-[#00d4aa] border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-[#00d4aa] font-syne">Analyzing with AI...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={analyze} disabled={loading}
                      className="flex-1 py-3 rounded-xl font-syne font-bold text-sm text-[#080c14] disabled:opacity-50 transition-all"
                      style={{ background: 'linear-gradient(135deg,#00d4aa,#00b890)' }}>
                      {loading ? 'Analyzing...' : '🔍 Analyze Food'}
                    </button>
                    <button onClick={reset}
                      className="px-4 py-3 rounded-xl text-sm text-slate-400 border border-[rgba(99,179,237,0.12)] hover:border-red-400/30 hover:text-red-400 transition-all">
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Tips */}
              <div className="mt-5 space-y-2">
                <div className="text-xs font-syne text-slate-500 uppercase tracking-wider mb-2">Tips for best results</div>
                {['Good lighting on the food', 'Single dish per photo', 'Top-down or slight angle', 'Avoid blurry images'].map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00d4aa]" />{t}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: Results */}
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
              <h3 className="font-syne font-semibold mb-4">📊 Nutrition Breakdown</h3>

              {!result && !loading && (
                <div className="text-center py-16 text-slate-500">
                  <div className="text-4xl mb-3">🥗</div>
                  <div className="text-sm">Upload a food photo to see<br />instant nutrition facts</div>
                </div>
              )}

              {loading && (
                <div className="text-center py-16 text-slate-400">
                  <div className="text-4xl mb-3 animate-bounce">🤖</div>
                  <div className="text-sm">AI is identifying your food...</div>
                </div>
              )}

              <AnimatePresence>
                {result && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {/* Food name */}
                    <div className="flex items-center gap-3 mb-5 p-3 bg-[#00d4aa]/5 border border-[#00d4aa]/20 rounded-xl">
                      <div className="text-2xl">{result.emoji || '🍽️'}</div>
                      <div>
                        <div className="font-syne font-bold text-[#00d4aa]">{result.foodName}</div>
                        <div className="text-xs text-slate-400">{result.portionSize || '1 serving'} • Confidence: {result.confidence || 'High'}</div>
                      </div>
                    </div>

                    {/* Macros */}
                    <div className="space-y-3 mb-5">
                      {macros.map((m, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">{m.label}</span>
                            <span className="font-syne font-bold" style={{ color: m.color }}>{m.value} {m.unit}</span>
                          </div>
                          <div className="h-1.5 bg-[#111827] rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${m.width}%` }}
                              transition={{ delay: i * 0.1, duration: 0.6 }}
                              className="h-full rounded-full" style={{ background: m.color }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI suggestion */}
                    {result.aiSuggestion && (
                      <div className="p-3 bg-[#111827] border border-[rgba(99,179,237,0.08)] rounded-xl text-xs text-slate-300 leading-relaxed mb-4">
                        🤖 {result.aiSuggestion}
                      </div>
                    )}

                    {/* Allergens */}
                    {result.allergens?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {result.allergens.map((a, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            ⚠️ {a}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Log button */}
                    <button onClick={logMeal} disabled={logged}
                      className="w-full py-3 rounded-xl font-syne font-bold text-sm transition-all disabled:opacity-60"
                      style={{ background: logged ? 'rgba(0,212,170,0.1)' : 'linear-gradient(135deg,#00d4aa,#00b890)', color: logged ? '#00d4aa' : '#080c14', border: logged ? '1px solid rgba(0,212,170,0.3)' : 'none' }}>
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

