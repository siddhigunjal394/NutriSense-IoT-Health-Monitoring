import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { registerUser } from '../services/api';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    age: '', gender: '', height: '', weight: '',
    medicalCondition: 'none', goal: 'general_wellness'
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const nextStep = () => {
    if (step === 1) {
      if (!form.name || !form.email || !form.password) {
        setError('Please fill all fields'); return;
      }
    }
    if (step === 2) {
      if (!form.age || !form.gender || !form.height || !form.weight) {
        setError('Please fill all fields'); return;
      }
    }
    setError('');
    setStep(step + 1);
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
        age: +form.age,
        gender: form.gender,
        height: +form.height,
        weight: +form.weight,
        medicalCondition: form.medicalCondition
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#111827] border border-[rgba(99,179,237,0.12)] rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-all focus:border-[#00d4aa] focus:ring-2 focus:ring-[#00d4aa]/10 text-sm";
  const labelClass = "block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2";

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,212,170,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,170,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Glow Orbs */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }}
      />
      <div className="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #00d4aa, transparent)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)' }}>
            🌿
          </div>
          <span className="font-syne text-2xl font-bold tracking-tight">
            Nutri<span className="text-[#00d4aa]">Sense</span>
          </span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 mb-6">
          {[1, 2, 3].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                step > s ? 'bg-[#00d4aa] border-[#00d4aa] text-[#080c14]'
                : step === s ? 'border-[#00d4aa] text-[#00d4aa] bg-transparent'
                : 'border-slate-700 text-slate-600 bg-transparent'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-1 transition-all ${step > s ? 'bg-[#00d4aa]' : 'bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-8">

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-5"
            >
              ❌ {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1 */}
            {step === 1 && (
              <motion.div key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="font-syne text-2xl font-bold mb-1">Create account</h1>
                <p className="text-slate-400 text-sm mb-6">Step 1 of 3 — Basic information</p>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input className={inputClass} placeholder="Siddhi Gunjal"
                      value={form.name} onChange={e => update('name', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input type="email" className={inputClass} placeholder="you@example.com"
                      value={form.email} onChange={e => update('email', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Password</label>
                    <input type="password" className={inputClass} placeholder="Min. 8 characters"
                      value={form.password} onChange={e => update('password', e.target.value)} />
                  </div>
                </div>

                <button onClick={nextStep}
                  className="w-full py-3 rounded-xl font-syne font-semibold text-[#080c14] mt-6 transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #00d4aa, #00b890)' }}>
                  Continue →
                </button>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="font-syne text-2xl font-bold mb-1">Body stats</h1>
                <p className="text-slate-400 text-sm mb-6">Step 2 of 3 — Physical measurements</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Age</label>
                    <input type="number" className={inputClass} placeholder="21"
                      value={form.age} onChange={e => update('age', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Gender</label>
                    <select className={inputClass} value={form.gender}
                      onChange={e => update('gender', e.target.value)}
                      style={{ backgroundColor: '#111827' }}>
                      <option value="">Select</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Height (cm)</label>
                    <input type="number" className={inputClass} placeholder="162"
                      value={form.height} onChange={e => update('height', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Weight (kg)</label>
                    <input type="number" className={inputClass} placeholder="58"
                      value={form.weight} onChange={e => update('weight', e.target.value)} />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl font-syne font-semibold text-slate-400 bg-[#111827] border border-[rgba(99,179,237,0.12)] transition-all hover:border-slate-500">
                    ← Back
                  </button>
                  <button onClick={nextStep}
                    className="flex-1 py-3 rounded-xl font-syne font-semibold text-[#080c14] transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #00d4aa, #00b890)' }}>
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <motion.div key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="font-syne text-2xl font-bold mb-1">Health profile</h1>
                <p className="text-slate-400 text-sm mb-6">Step 3 of 3 — Conditions & goals</p>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Medical Condition</label>
                    <select className={inputClass} value={form.medicalCondition}
                      onChange={e => update('medicalCondition', e.target.value)}
                      style={{ backgroundColor: '#111827' }}>
                      <option value="none">None</option>
                      <option value="diabetes">Diabetes</option>
                      <option value="hypertension">Hypertension</option>
                      <option value="obesity">Obesity</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Health Goal</label>
                    <select className={inputClass} value={form.goal}
                      onChange={e => update('goal', e.target.value)}
                      style={{ backgroundColor: '#111827' }}>
                      <option value="general_wellness">General Wellness</option>
                      <option value="weight_loss">Weight Loss</option>
                      <option value="diabetes_control">Diabetes Control</option>
                      <option value="muscle_gain">Muscle Gain</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(2)}
                    className="flex-1 py-3 rounded-xl font-syne font-semibold text-slate-400 bg-[#111827] border border-[rgba(99,179,237,0.12)] transition-all hover:border-slate-500">
                    ← Back
                  </button>
                  <button onClick={handleSignup} disabled={loading}
                    className="flex-1 py-3 rounded-xl font-syne font-semibold text-[#080c14] transition-all hover:-translate-y-0.5 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #00d4aa, #00b890)' }}>
                    {loading ? '⏳ Creating...' : '🚀 Create Account'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-[#00d4aa] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          🔒 Secured with JWT • NutriSense v1.0 • SVCET Rajuri
        </p>
      </motion.div>
    </div>
  );
}
