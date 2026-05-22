import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';

const API = 'http://localhost:5000/api/meals';

const DAILY_GOAL = { calories: 2000, protein: 60, carbs: 250, fats: 65 };

const EXAMPLES = [
  '2 parathas with butter and masala chai',
  'Dal rice with salad and curd',
  'Idli sambhar with coconut chutney',
  'Chicken curry with 2 rotis and raita',
  'Poha with peanuts and a banana',
  'Paneer butter masala with 3 rotis',
];

// Health score color
const scoreColor = (s) =>
  s >= 8 ? '#00d4aa' : s >= 6 ? '#f59e0b' : s >= 4 ? '#f97316' : '#ef4444';

const scoreLabel = (s) =>
  s >= 8 ? 'Very Healthy' : s >= 6 ? 'Moderate' : s >= 4 ? 'Fair' : 'Unhealthy';

export default function MealLogger() {
  const { user } = useAuth();
  const [meal, setMeal] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [history, setHistory] = useState([]);
  const [dailyTotals, setDailyTotals] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('log'); // 'log' | 'history'
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const recognitionRef = useRef(null);

  const showToast = (message, type = 'success') =>
    setToast({ show: true, message, type });

  // Load meal history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch(`${API}/history/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setHistory(data.meals || []);
        setDailyTotals(data.dailyTotals);
      }
    } catch (e) {
      console.log('No meal history yet');
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── VOICE ──
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Voice not supported. Use Chrome!', 'error'); return; }

    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onstart = () => { setListening(true); setVoiceText(''); };

    recognition.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        e.results[i].isFinal ? (final += t) : (interim += t);
      }
      setVoiceText(interim || final);
      if (final) setMeal(prev => prev ? prev + ' ' + final : final);
    };

    recognition.onerror = (e) => {
      setListening(false);
      showToast(e.error === 'not-allowed' ? 'Mic access denied!' : 'Voice error: ' + e.error, 'error');
    };

    recognition.onend = () => { setListening(false); setVoiceText(''); };
    recognition.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  // ── ANALYZE with real Groq AI ──
  const analyzeMeal = async () => {
    if (!meal.trim()) { showToast('Please describe your meal first!', 'error'); return; }

    setLoading(true);
    setResult(null);
    setSaved(false);

    try {
      const res = await fetch(`${API}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealDescription: meal,
          userId: user.id
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Analysis failed');

      setResult({ ...data.result, meal });
      showToast('✅ Meal analyzed successfully!');
    } catch (err) {
      showToast(err.message || 'Could not analyze meal. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── SAVE meal to DB ──
  const saveMeal = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          mealData: {
            description: result.meal,
            calories: result.calories,
            protein: result.protein,
            carbs: result.carbs,
            fats: result.fats,
            fiber: result.fiber,
            healthScore: result.healthScore,
            suggestion: result.suggestion,
            healthierSwap: result.healthierSwap,
          }
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSaved(true);
      showToast('💾 Meal saved to your health record!');
      loadHistory(); // refresh history
    } catch (err) {
      showToast(err.message || 'Could not save meal.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    setMeal('');
    setResult(null);
    setSaved(false);
    setVoiceText('');
  };

  // Daily progress bar width
  const pct = (val, goal) => Math.min(100, Math.round((val / goal) * 100));

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>

          <h1 className="font-syne text-2xl font-bold mb-1">Meal Logger</h1>
          <p className="text-slate-400 text-sm mb-4">
            AI-powered calorie & nutrition analysis • Powered by Groq Llama 3 🤖
          </p>

          {/* ── Daily Summary Bar ── */}
          {dailyTotals && dailyTotals.count > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-4 mb-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-syne font-semibold text-sm">
                  📅 Today's Intake
                </span>
                <span className="text-xs text-slate-500">
                  {dailyTotals.count} meal{dailyTotals.count > 1 ? 's' : ''} logged
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: 'Calories', val: dailyTotals.calories, goal: DAILY_GOAL.calories, unit: 'kcal', color: '#f59e0b' },
                  { label: 'Protein', val: dailyTotals.protein, goal: DAILY_GOAL.protein, unit: 'g', color: '#0ea5e9' },
                  { label: 'Carbs', val: dailyTotals.carbs, goal: DAILY_GOAL.carbs, unit: 'g', color: '#00d4aa' },
                  { label: 'Fats', val: dailyTotals.fats, goal: DAILY_GOAL.fats, unit: 'g', color: '#a78bfa' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{item.label}</span>
                      <span style={{ color: item.color }}>{item.val}{item.unit}</span>
                    </div>
                    <div className="h-1.5 bg-[#111827] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct(item.val, item.goal)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                      />
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {pct(item.val, item.goal)}% of goal
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Tabs ── */}
          <div className="flex gap-2 mb-5">
            {['log', 'history'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-syne font-semibold transition-all ${
                  activeTab === tab
                    ? 'text-[#080c14]'
                    : 'text-slate-400 bg-[#131d2e] border border-[rgba(99,179,237,0.12)] hover:text-slate-300'
                }`}
                style={activeTab === tab ? { background: 'linear-gradient(135deg, #00d4aa, #00b890)' } : {}}>
                {tab === 'log' ? '🍽️ Log Meal' : `📋 History (${history.length})`}
              </button>
            ))}
          </div>

          {/* ── LOG TAB ── */}
          {activeTab === 'log' && (
            <div className="grid grid-cols-2 gap-6">

              {/* LEFT: Input */}
              <div className="space-y-4">
                <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-syne font-semibold">🍽️ Describe Your Meal</h3>
                    {meal && (
                      <button onClick={clearAll}
                        className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                        Clear ✕
                      </button>
                    )}
                  </div>

                  {/* Textarea + mic */}
                  <div className="relative">
                    <textarea
                      className="w-full bg-[#111827] border border-[rgba(99,179,237,0.12)] rounded-xl p-4 pr-14 text-sm text-white placeholder-slate-600 outline-none resize-none focus:border-[#00d4aa] transition-colors"
                      rows={5}
                      placeholder={`Type or press 🎤 to speak...\ne.g. 2 parathas with butter and a glass of chai`}
                      value={meal}
                      onChange={e => setMeal(e.target.value)}
                    />
                    <button
                      onClick={listening ? stopVoice : startVoice}
                      className={`absolute right-3 top-3 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        listening
                          ? 'bg-red-500 animate-pulse shadow-lg shadow-red-500/30'
                          : 'bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/30 hover:bg-[#00d4aa]/20'
                      }`}
                    >
                      🎤
                    </button>
                  </div>

                  {/* Listening indicator */}
                  <AnimatePresence>
                    {listening && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-3 px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-xl"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[0,1,2,3,4].map(i => (
                              <div key={i}
                                className="w-1 bg-red-400 rounded-full animate-bounce"
                                style={{ height: `${[12,18,10,16,14][i]}px`, animationDelay: `${i*0.1}s` }}
                              />
                            ))}
                          </div>
                          <span className="text-red-400 text-xs font-semibold">Listening...</span>
                          <button onClick={stopVoice}
                            className="ml-auto text-xs text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                            Stop
                          </button>
                        </div>
                        {voiceText && (
                          <p className="text-xs text-slate-400 italic mt-1">"{voiceText}"</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Analyze button */}
                  <button
                    onClick={analyzeMeal}
                    disabled={loading || !meal.trim()}
                    className="w-full mt-4 py-3 rounded-xl font-syne font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        AI is analyzing your meal...
                      </>
                    ) : '🤖 Analyze with AI'}
                  </button>

                  <div className="mt-3 flex gap-2 px-3 py-2 bg-[#090e19]/90 rounded-xl border border-[rgba(99,179,237,0.06)]">
                    <span className="text-sm">💡</span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Real AI analysis — accurate for Indian meals like dal, roti, paratha, idli, and more.
                    </p>
                  </div>
                </div>

                {/* Quick examples */}
                <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-5">
                  <h3 className="font-syne font-semibold text-sm mb-3">⚡ Quick Examples</h3>
                  <div className="space-y-2">
                    {EXAMPLES.map((ex, i) => (
                      <button key={i} onClick={() => setMeal(ex)}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs text-slate-400 bg-[#111827] border border-[rgba(99,179,237,0.06)] hover:border-[#00d4aa]/30 hover:text-slate-300 transition-all flex items-center gap-2">
                        <span className="text-[#00d4aa]">→</span>
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: Analysis Result */}
              <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
                <h3 className="font-syne font-semibold mb-5">📊 AI Meal Analysis</h3>

                {/* Empty state */}
                {!result && !loading && (
                  <div className="text-center py-16 text-slate-500">
                    <div className="text-5xl mb-4">🍱</div>
                    <div className="font-syne font-medium mb-2">No meal analyzed yet</div>
                    <div className="text-sm leading-relaxed">
                      Describe your meal and press<br />"Analyze with AI" for accurate results
                    </div>
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4 animate-bounce">🤖</div>
                    <div className="font-syne font-medium mb-2">Groq AI is analyzing...</div>
                    <div className="text-sm text-slate-400">Calculating calories & macros for your meal</div>
                    <div className="flex justify-center gap-1.5 mt-4">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full bg-[#00d4aa] animate-bounce"
                          style={{ animationDelay: `${i*0.2}s` }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Result */}
                {result && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Meal text + type */}
                    <div className="px-3 py-2.5 rounded-xl bg-[#111827] border border-[rgba(99,179,237,0.08)] text-xs text-slate-400 leading-relaxed flex items-start justify-between gap-2">
                      <span>📝 <span className="text-slate-300">{result.meal}</span></span>
                      {result.mealType && (
                        <span className="text-[#00d4aa] bg-[#00d4aa]/10 px-2 py-0.5 rounded-full text-xs flex-shrink-0">
                          {result.mealType}
                        </span>
                      )}
                    </div>

                    {/* Calories — hero */}
                    <div className="text-center py-4 bg-[#111827] rounded-2xl border border-[rgba(99,179,237,0.08)]">
                      <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Total Calories</div>
                      <div className="font-syne text-5xl font-bold text-[#f59e0b]">{result.calories}</div>
                      <div className="text-slate-400 text-sm">kcal</div>
                      {result.portionNote && (
                        <div className="text-xs text-slate-500 mt-1 px-4">{result.portionNote}</div>
                      )}
                    </div>

                    {/* Macros grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: '💪', label: 'Protein', value: result.protein + 'g', color: '#0ea5e9', bg: 'rgba(14,165,233,0.08)' },
                        { icon: '🌾', label: 'Carbs', value: result.carbs + 'g', color: '#00d4aa', bg: 'rgba(0,212,170,0.08)' },
                        { icon: '🧈', label: 'Fats', value: result.fats + 'g', color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
                        { icon: '🥦', label: 'Fiber', value: result.fiber + 'g', color: '#34d399', bg: 'rgba(52,211,153,0.08)' },
                        { icon: '🍬', label: 'Sugar', value: (result.sugar || '—') + (result.sugar ? 'g' : ''), color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
                        { icon: '🧂', label: 'Sodium', value: (result.sodium || '—') + (result.sodium ? 'mg' : ''), color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
                      ].map((m, i) => (
                        <div key={i} className="rounded-xl p-3 text-center border border-[rgba(99,179,237,0.08)]"
                          style={{ background: m.bg }}>
                          <div className="text-base mb-0.5">{m.icon}</div>
                          <div className="font-syne font-bold text-base" style={{ color: m.color }}>{m.value}</div>
                          <div className="text-xs text-slate-500">{m.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Health score */}
                    {result.healthScore && (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111827] border border-[rgba(99,179,237,0.08)]">
                        <div className="text-2xl font-syne font-bold" style={{ color: scoreColor(result.healthScore) }}>
                          {result.healthScore}/10
                        </div>
                        <div>
                          <div className="text-xs font-semibold" style={{ color: scoreColor(result.healthScore) }}>
                            {scoreLabel(result.healthScore)}
                          </div>
                          {result.scoreReason && (
                            <div className="text-xs text-slate-500 mt-0.5">{result.scoreReason}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* AI Suggestion */}
                    {result.suggestion && (
                      <div className="px-4 py-3 rounded-xl bg-[#0ea5e9]/5 border border-[#0ea5e9]/20">
                        <div className="text-xs text-[#0ea5e9] font-semibold mb-1">💡 AI Nutritionist Tip</div>
                        <div className="text-xs text-slate-300 leading-relaxed">{result.suggestion}</div>
                      </div>
                    )}

                    {/* Healthier swap */}
                    {result.healthierSwap && (
                      <div className="px-4 py-3 rounded-xl bg-[#00d4aa]/5 border border-[#00d4aa]/20">
                        <div className="text-xs text-[#00d4aa] font-semibold mb-1">🔄 Healthier Swap</div>
                        <div className="text-xs text-slate-300 leading-relaxed">{result.healthierSwap}</div>
                      </div>
                    )}

                    {/* Save + New buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={saveMeal}
                        disabled={saving || saved}
                        className="flex-1 py-2.5 rounded-xl text-sm font-syne font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{
                          background: saved ? 'rgba(0,212,170,0.1)' : 'linear-gradient(135deg, #00d4aa, #00b890)',
                          color: saved ? '#00d4aa' : '#080c14',
                          border: saved ? '1px solid rgba(0,212,170,0.3)' : 'none'
                        }}
                      >
                        {saving ? (
                          <><div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Saving...</>
                        ) : saved ? '✅ Saved to record' : '💾 Save Meal'}
                      </button>
                      <button onClick={clearAll}
                        className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 border border-[rgba(99,179,237,0.12)] hover:border-slate-500 transition-all">
                        + Log Another
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
              <h3 className="font-syne font-semibold mb-5">📋 Meal History (Last 7 Days)</h3>

              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-[#00d4aa]/30 border-t-[#00d4aa] rounded-full animate-spin" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-4xl mb-3">🍽️</div>
                  <div className="font-syne font-medium mb-1">No meals logged yet</div>
                  <div className="text-sm">Analyze and save your first meal to see history here.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 px-4 py-3 bg-[#090e19]/90 rounded-xl border border-[rgba(99,179,237,0.06)] hover:border-[rgba(99,179,237,0.15)] transition-all"
                    >
                      <div className="text-2xl">🍱</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-300 truncate">{m.description}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(m.loggedAt).toLocaleDateString('en-IN', {
                            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-syne font-bold text-[#f59e0b]">{m.calories} kcal</div>
                        <div className="text-xs text-slate-500">
                          P:{m.protein}g C:{m.carbs}g F:{m.fats}g
                        </div>
                      </div>
                      {m.healthScore && (
                        <div className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                          style={{
                            color: scoreColor(m.healthScore),
                            background: scoreColor(m.healthScore) + '15'
                          }}>
                          {m.healthScore}/10
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

        </motion.div>
      </div>
      <Toast {...toast} onClose={() => setToast(p => ({ ...p, show: false }))} />
    </div>
  );
}

