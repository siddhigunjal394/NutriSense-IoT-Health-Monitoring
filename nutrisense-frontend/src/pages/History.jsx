import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getHealthHistory } from '../services/api';
import Sidebar from '../components/Sidebar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHealthHistory(user.id)
      .then(res => setHistory(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chartData = history.slice(0, 7).reverse().map((h, i) => ({
    day: new Date(h.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    heartRate: h.heartRate,
    glucose: h.glucoseLevel || 0,
    systolic: h.bloodPressureSystolic || 0,
  }));

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-syne text-2xl font-bold mb-1">Health History</h1>
          <p className="text-slate-400 text-sm mb-6">Your vitals tracked over time</p>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6 mb-5">
              <h3 className="font-syne font-semibold mb-4">📈 Heart Rate Trend (Last 7 Days)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,179,237,0.06)" />
                  <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: '#131d2e', border: '1px solid rgba(99,179,237,0.2)', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line type="monotone" dataKey="heartRate" stroke="#00d4aa" strokeWidth={2} dot={{ fill: '#00d4aa', r: 4 }} name="Heart Rate" />
                  <Line type="monotone" dataKey="glucose" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} name="Glucose" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Table */}
          <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
            <h3 className="font-syne font-semibold mb-4">📋 All Records</h3>
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <div className="text-3xl mb-2">📋</div>
                <div className="text-sm">No records yet. Log your vitals to see history.</div>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Date & Time', 'Heart Rate', 'Blood Pressure', 'Glucose', 'SpO2', 'Status'].map(h => (
                      <th key={h} className="pb-3 text-left text-xs text-slate-500 uppercase tracking-wider font-medium border-b border-[rgba(99,179,237,0.08)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => {
                    const isHigh = h.heartRate > 100;
                    return (
                      <tr key={i} className="border-b border-[rgba(99,179,237,0.05)] hover:bg-[#111827] transition-colors">
                        <td className="py-3 text-slate-400 text-xs">
                          {new Date(h.timestamp).toLocaleDateString('en-IN')}{' '}
                          {new Date(h.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${isHigh ? 'bg-red-500/10 text-red-400' : 'bg-[#00d4aa]/10 text-[#00d4aa]'}`}>
                            {h.heartRate} bpm
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{h.bloodPressureSystolic || '--'}/{h.bloodPressureDiastolic || '--'}</td>
                        <td className="py-3 text-slate-400">{h.glucoseLevel || '--'}</td>
                        <td className="py-3 text-slate-400">{h.oxygenLevel || '--'}</td>
                        <td className="py-3">
                          <span className={`text-xs font-medium ${isHigh ? 'text-red-400' : 'text-[#00d4aa]'}`}>
                            {isHigh ? '⚠️ High' : '✅ Normal'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

