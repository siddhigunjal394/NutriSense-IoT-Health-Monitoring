import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getLatestHealth } from '../services/api';
import Sidebar from '../components/Sidebar';

export default function DietPlan() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLatestHealth(user.id)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const ai = data?.aiAdvice;
  const rec = data?.recommendation;

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-syne text-2xl font-bold mb-1">AI Diet Plan</h1>
          <p className="text-slate-400 text-sm mb-6">Personalized nutrition powered by Groq AI (Llama 3)</p>

          {loading ? (
            <div className="text-center py-20 text-slate-500">
              <div className="text-3xl mb-2 animate-pulse">🥗</div>
              <div>Loading your diet plan...</div>
            </div>
          ) : !ai ? (
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-12 text-center">
              <div className="text-5xl mb-4">🥗</div>
              <div className="font-syne text-xl font-semibold mb-2">No Diet Plan Yet</div>
              <div className="text-slate-400 text-sm mb-6">Submit your vitals or complete a heart scan to get your personalized AI diet plan</div>
              <a href="/vitals" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-syne font-semibold text-[#080c14] text-sm"
                style={{ background: 'linear-gradient(135deg, #00d4aa, #00b890)' }}>
                Go to Vitals →
              </a>
            </div>
          ) : (
            <div className="space-y-5">
              {/* AI Summary */}
              <div className="bg-[#131d2e] border border-[#00d4aa]/20 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00d4aa]/10 flex items-center justify-center text-lg flex-shrink-0">🤖</div>
                  <div>
                    <div className="font-syne font-semibold mb-1">AI Health Summary</div>
                    <div className="text-sm text-slate-300 leading-relaxed">{ai.summary}</div>
                  </div>
                </div>
              </div>

              {/* Meal Plan */}
              <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
                <h3 className="font-syne font-semibold mb-4">🍽️ Today's Meal Plan</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: '🍳', type: 'Breakfast', value: ai.breakfast },
                    { icon: '🥗', type: 'Lunch', value: ai.lunch },
                    { icon: '🍽️', type: 'Dinner', value: ai.dinner },
                    { icon: '🍎', type: 'Snacks', value: ai.snacks },
                    { icon: '💧', type: 'Hydration', value: ai.hydration },
                    { icon: '🏃', type: 'Exercise', value: ai.exercise },
                  ].map((meal, i) => (
                    <div key={i} className="bg-[#090e19]/90 rounded-xl p-4 border border-[rgba(99,179,237,0.08)]">
                      <div className="flex items-center gap-2 mb-2">
                        <span>{meal.icon}</span>
                        <div className="text-xs text-slate-500 uppercase tracking-widest">{meal.type}</div>
                      </div>
                      <div className="text-sm text-slate-300 leading-relaxed">{meal.value || '--'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foods to Avoid + Tips */}
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-5">
                  <h3 className="font-syne font-semibold mb-3">🚫 Foods to Avoid</h3>
                  <div className="flex flex-wrap gap-2">
                    {rec?.foodsToAvoid?.map((food, i) => (
                      <span key={i} className="px-3 py-1 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                        🚫 {food}
                      </span>
                    )) || <span className="text-slate-500 text-sm">No restrictions</span>}
                  </div>
                </div>

                <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-5">
                  <h3 className="font-syne font-semibold mb-3">💡 AI Tips</h3>
                  <div className="text-sm text-slate-300 leading-relaxed">{ai.tips || '--'}</div>
                </div>
              </div>

              {/* Warning */}
              {ai.warning && (
                <div className="bg-[#131d2e] border border-yellow-500/20 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="text-sm text-yellow-300 leading-relaxed">{ai.warning}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
