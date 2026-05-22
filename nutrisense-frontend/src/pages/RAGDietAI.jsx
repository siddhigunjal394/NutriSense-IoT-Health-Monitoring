import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Toast from '../components/Toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const QUICK_PROMPTS = [
  'What should I eat today based on my health data?',
  'Give me a full day meal plan for weight loss',
  'What foods should I avoid given my risk scores?',
  'High protein diet plan for muscle gain',
  'Best foods to lower my heart rate naturally',
  'Anti-inflammatory diet recommendations for me',
];

export default function RAGDietAI() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '👋 Hi! I am your personalized NutriSense AI. I have access to your meal history, heart scan data, BMI, and risk scores. Ask me anything about your diet and health!' }
  ]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast]     = useState({ show: false, message: '', type: 'success' });
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/rag-diet/chat`, { userId: user?.id, message: msg });
      setMessages(p => [...p, { role: 'assistant', content: res.data.reply, sources: res.data.sources }]);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: '❌ Sorry, I could not process that. Please try again.' }]);
    } finally { setLoading(false); }
  };

  const clearChat = () => setMessages([{ role: 'assistant', content: '👋 Chat cleared! Ask me anything about your diet and health.' }]);

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 flex flex-col p-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-syne text-2xl font-bold mb-1">🤖 RAG Diet AI</h1>
              <p className="text-slate-400 text-sm">Personalized advice using your real health data</p>
            </div>
            <button onClick={clearChat} className="px-3 py-2 rounded-xl text-xs text-slate-400 border border-[rgba(99,179,237,0.12)] hover:border-red-400/30 hover:text-red-400 transition-all">
              Clear chat
            </button>
          </div>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-2 mb-4">
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} onClick={() => send(p)} disabled={loading}
                className="px-3 py-1.5 rounded-full text-xs text-slate-400 border border-[rgba(99,179,237,0.12)] hover:border-[#00d4aa]/30 hover:text-[#00d4aa] transition-all disabled:opacity-40">
                {p}
              </button>
            ))}
          </div>

          {/* Chat window */}
          <div className="flex-1 bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-4 overflow-y-auto mb-4 space-y-4" style={{ minHeight: 0, maxHeight: '55vh' }}>
            <AnimatePresence>
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${m.role === 'user' ? 'bg-[#00d4aa]/20' : 'bg-[#0ea5e9]/20'}`}>
                    {m.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-slate-200' : 'bg-[#111827] border border-[rgba(99,179,237,0.08)] text-slate-300'}`}>
                    {m.content}
                    {m.sources?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[rgba(99,179,237,0.08)]">
                        <div className="text-xs text-slate-500 mb-1">Sources used:</div>
                        <div className="flex flex-wrap gap-1">
                          {m.sources.map((s, j) => (
                            <span key={j} className="px-2 py-0.5 rounded-full text-xs bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/20">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#0ea5e9]/20 flex items-center justify-center text-sm">🤖</div>
                <div className="bg-[#111827] border border-[rgba(99,179,237,0.08)] rounded-2xl px-4 py-3 flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-3">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about your diet, nutrition goals, meal plans..."
              disabled={loading}
              className="flex-1 bg-[#131d2e] border border-[rgba(99,179,237,0.12)] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00d4aa]/50 disabled:opacity-50"
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-xl font-syne font-bold text-sm text-[#080c14] disabled:opacity-40 transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#00d4aa,#00b890)' }}>
              Send
            </button>
          </div>
        </motion.div>
      </div>
      <Toast {...toast} onClose={() => setToast(p => ({ ...p, show: false }))} />
    </div>
  );
}

