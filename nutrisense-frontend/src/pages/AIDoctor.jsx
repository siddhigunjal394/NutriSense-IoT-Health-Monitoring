import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getLatestHealth } from '../services/api';
import Sidebar from '../components/Sidebar';

const API = 'https://nutrisense-iot-health-monitoring-5.onrender.com/api/meals';

const quickQuestions = [
  'What do my vitals say about my health?',
  'What foods should I eat based on my data?',
  'Is my heart rate normal?',
  'How can I reduce my stress score?',
  'What is a good diet for my glucose level?',
  'How much water should I drink daily?',
];

// ── Markdown-style bold formatter ──
function formatText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function AIDoctor() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [vitals, setVitals] = useState(null);
  const [vitalAnalysis, setVitalAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const firstName = user?.name?.split(' ')[0] || 'there';

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Load vitals + auto-analyze on mount
  useEffect(() => {
    const init = async () => {
      try {
        const res = await getLatestHealth(user.id);
        const data = res.data?.healthData;
        const vitalsPayload = {
          heartRate: data?.heartRate,
          bloodPressureSystolic: data?.bloodPressureSystolic,
          bloodPressureDiastolic: data?.bloodPressureDiastolic,
          glucoseLevel: data?.glucoseLevel,
          bmi: user?.bmi,
          stressScore: data?.stressScore,
          hrv: data?.hrv,
        };
        setVitals(vitalsPayload);

        // Auto analyze vitals
        const analysisRes = await fetch(`${API}/analyze-vitals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vitals: vitalsPayload, userName: firstName }),
        });
        const analysisData = await analysisRes.json();
        if (analysisData.analysis) {
          setVitalAnalysis(analysisData.analysis);
        }
      } catch (e) {
        console.log('No vitals yet');
      } finally {
        setAnalysisLoading(false);
        // Welcome message after vitals load
        setMessages([{
          role: 'ai',
          text: `👋 Hello ${firstName}! I'm your AI health assistant. I've loaded your latest vitals and I'm ready to give you **personalized** health and diet advice. What would you like to know?`,
          time: new Date()
        }]);
      }
    };
    init();
  }, []);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', text: msg, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          vitals,
          userName: firstName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [...prev, {
        role: 'ai',
        text: data.reply,
        time: new Date()
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
        time: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const overallColor = {
    'Good': '#00d4aa',
    'Fair': '#f59e0b',
    'Needs Attention': '#ef4444',
  };

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 p-6 flex flex-col overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col min-h-0"
        >
          <h1 className="font-syne text-2xl font-bold mb-1">AI Doctor</h1>
          <p className="text-slate-400 text-sm mb-4">
            Personalized health advice based on your real vitals • Powered by Groq Llama 3
          </p>

          <div className="flex gap-5 flex-1 min-h-0">

            {/* ── LEFT: Chat ── */}
            <div className="flex-1 bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg flex flex-col min-h-0">

              {/* Chat header */}
              <div className="px-5 py-4 border-b border-[rgba(99,179,237,0.08)] flex items-center gap-3 flex-shrink-0">
                <div className="w-9 h-9 rounded-xl bg-[#00d4aa]/10 flex items-center justify-center text-lg">🤖</div>
                <div>
                  <div className="font-syne font-semibold text-sm">NutriSense AI Doctor</div>
                  <div className="text-xs text-[#00d4aa] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] inline-block" />
                    Online • Groq Llama 3 • Vitals {vitals?.heartRate ? 'Loaded ✓' : 'Not found'}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'ai' && (
                      <div className="w-7 h-7 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center text-sm mr-2 mt-1 flex-shrink-0">
                        🤖
                      </div>
                    )}
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'ai'
                        ? msg.isError
                          ? 'bg-red-500/10 border border-red-500/20 text-red-300 rounded-tl-sm'
                          : 'bg-[#111827] border border-[rgba(99,179,237,0.08)] text-slate-300 rounded-tl-sm'
                        : 'text-white rounded-tr-sm'
                    }`}
                    style={msg.role === 'user' ? {
                      background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(14,165,233,0.15))',
                      border: '1px solid rgba(0,212,170,0.2)'
                    } : {}}>
                      {msg.role === 'ai' ? formatText(msg.text) : msg.text}
                      <div className="text-xs text-slate-600 mt-1.5">
                        {msg.time?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start items-end gap-2"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#00d4aa]/10 flex items-center justify-center text-sm flex-shrink-0">
                      🤖
                    </div>
                    <div className="bg-[#111827] border border-[rgba(99,179,237,0.08)] px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center">
                      {[0, 1, 2].map(i => (
                        <div key={i}
                          className="w-2 h-2 rounded-full bg-[#00d4aa] animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                      <span className="text-xs text-slate-500 ml-1">AI is thinking...</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-[rgba(99,179,237,0.08)] flex-shrink-0">
                <div className="flex gap-3">
                  <input
                    className="flex-1 bg-[#111827] border border-[rgba(99,179,237,0.12)] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-[#00d4aa] transition-colors"
                    placeholder="Ask about your vitals, diet, or health..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    disabled={loading}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    className="px-5 py-2.5 rounded-xl font-syne font-semibold text-[#080c14] text-sm transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ background: 'linear-gradient(135deg, #00d4aa, #00b890)' }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="w-60 flex flex-col gap-4 overflow-y-auto">

              {/* Vitals Summary Card */}
              <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-4 flex-shrink-0">
                <div className="font-syne font-semibold text-sm mb-3">📊 Your Vitals</div>
                {vitals?.heartRate ? (
                  <div className="space-y-2">
                    {[
                      { label: 'Heart Rate', value: vitals.heartRate + ' bpm', color: '#00d4aa' },
                      { label: 'BP', value: vitals.bloodPressureSystolic ? `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}` : '--', color: '#0ea5e9' },
                      { label: 'Glucose', value: vitals.glucoseLevel ? vitals.glucoseLevel + ' mg/dL' : '--', color: '#f59e0b' },
                      { label: 'BMI', value: vitals.bmi || '--', color: '#a78bfa' },
                      ...(vitals.stressScore ? [{ label: 'Stress', value: vitals.stressScore + '/100', color: '#ef4444' }] : []),
                      ...(vitals.hrv ? [{ label: 'HRV', value: vitals.hrv + ' ms', color: '#34d399' }] : []),
                    ].map((v, i) => (
                      <div key={i} className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-[#111827]">
                        <span className="text-xs text-slate-500">{v.label}</span>
                        <span className="text-xs font-semibold" style={{ color: v.color }}>{v.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-3">
                    No vitals yet.<br />
                    <span className="text-[#00d4aa]">Complete a scan first.</span>
                  </div>
                )}
              </div>

              {/* AI Vitals Analysis Card */}
              <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-4 flex-shrink-0">
                <div className="font-syne font-semibold text-sm mb-3">🧠 AI Analysis</div>
                {analysisLoading ? (
                  <div className="flex flex-col items-center py-4 gap-2">
                    <div className="w-5 h-5 border-2 border-[#00d4aa]/30 border-t-[#00d4aa] rounded-full animate-spin" />
                    <span className="text-xs text-slate-500">Analyzing vitals...</span>
                  </div>
                ) : vitalAnalysis ? (
                  <div className="space-y-3">
                    {/* Overall badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: (overallColor[vitalAnalysis.overall] || '#00d4aa') + '15',
                          color: overallColor[vitalAnalysis.overall] || '#00d4aa',
                          border: `1px solid ${(overallColor[vitalAnalysis.overall] || '#00d4aa')}30`
                        }}>
                        {vitalAnalysis.overall}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{vitalAnalysis.summary}</p>
                    <div className="space-y-1.5">
                      {vitalAnalysis.points?.map((point, i) => (
                        <div key={i} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
                          <span className="text-[#00d4aa] mt-0.5 flex-shrink-0">•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                    {vitalAnalysis.alert && (
                      <div className="px-3 py-2 rounded-lg bg-red-500/8 border border-red-500/20 text-xs text-red-300">
                        ⚠️ {vitalAnalysis.alert}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-3">
                    Log your vitals to get an AI analysis.
                  </div>
                )}
              </div>

              {/* Quick Questions */}
              <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-4 flex-shrink-0">
                <div className="font-syne font-semibold text-sm mb-3">💡 Quick Ask</div>
                <div className="space-y-1.5">
                  {quickQuestions.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)} disabled={loading}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-400 bg-[#111827] border border-[rgba(99,179,237,0.06)] hover:border-[#00d4aa]/30 hover:text-slate-300 transition-all leading-relaxed disabled:opacity-50">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

