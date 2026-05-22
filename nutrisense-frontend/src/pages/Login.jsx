import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill all fields'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await loginUser({ email, password });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #00d4aa, transparent)' }}
      />
      <div className="absolute bottom-[-150px] right-[-150px] w-[500px] h-[500px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #0ea5e9, transparent)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)' }}>
            🌿
          </div>
          <span className="font-syne text-2xl font-bold tracking-tight">
            Nutri<span className="text-[#00d4aa]">Sense</span>
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-8">
          <h1 className="font-syne text-3xl font-bold mb-1 tracking-tight">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-7">Sign in to your health dashboard</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm mb-5"
            >
              ❌ {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#111827] border border-[rgba(99,179,237,0.12)] rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-all focus:border-[#00d4aa] focus:ring-2 focus:ring-[#00d4aa]/10 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#111827] border border-[rgba(99,179,237,0.12)] rounded-xl px-4 py-3 text-white placeholder-slate-600 outline-none transition-all focus:border-[#00d4aa] focus:ring-2 focus:ring-[#00d4aa]/10 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-syne font-semibold text-[#080c14] transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: 'linear-gradient(135deg, #00d4aa, #00b890)' }}
            >
              {loading ? '⏳ Signing in...' : '🚀 Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[rgba(99,179,237,0.1)]" />
            <span className="text-slate-600 text-xs">or</span>
            <div className="flex-1 h-px bg-[rgba(99,179,237,0.1)]" />
          </div>

          <p className="text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#00d4aa] font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>

        {/* Bottom tag */}
        <p className="text-center text-xs text-slate-600 mt-6">
          🔒 Secured with JWT • NutriSense v1.0 • SVCET Rajuri
        </p>
      </motion.div>
    </div>
  );
}
