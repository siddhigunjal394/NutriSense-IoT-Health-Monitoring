import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function Profile() {
  const { user } = useAuth();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const bmi = user?.bmi;
  const bmiCategory = !bmi ? '--' : bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
  const bmiColor = !bmi ? '#94a3b8' : bmi < 25 ? '#00d4aa' : bmi < 30 ? '#f59e0b' : '#ef4444';

  return (
    <div className="min-h-screen flex" style={{background: "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(0,212,170,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(14,165,233,0.07) 0%, transparent 60%), #070b13"}}>
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-syne text-2xl font-bold mb-1">My Profile</h1>
          <p className="text-slate-400 text-sm mb-6">Your health identity and personal stats</p>

          <div className="grid grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6 text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center font-syne text-2xl font-bold text-[#080c14]"
                style={{ background: 'linear-gradient(135deg, #00d4aa, #0ea5e9)' }}>
                {initials}
              </div>
              <div className="font-syne text-lg font-bold mb-1">{user?.name}</div>
              <div className="text-slate-400 text-sm mb-4">{user?.email}</div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-[#00d4aa]/10 text-[#00d4aa] border border-[#00d4aa]/20">
                ● Active Member
              </div>

              <div className="grid grid-cols-2 gap-2 mt-5">
                {[
                  { label: 'Age', value: user?.age || '--' },
                  { label: 'BMI', value: bmi || '--' },
                  { label: 'Height', value: (user?.height || '--') + ' cm' },
                  { label: 'Weight', value: (user?.weight || '--') + ' kg' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#090e19]/90 rounded-xl p-3 border border-[rgba(99,179,237,0.08)]">
                    <div className="font-syne font-bold text-[#00d4aa] text-lg">{stat.value}</div>
                    <div className="text-xs text-slate-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Summary */}
            <div className="col-span-2 space-y-4">
              <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
                <h3 className="font-syne font-semibold mb-4">📋 Health Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Gender', value: user?.gender || '--' },
                    { label: 'Medical Condition', value: user?.medicalCondition || 'none' },
                    { label: 'BMI Category', value: bmiCategory, color: bmiColor },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-[rgba(99,179,237,0.06)]">
                      <span className="text-slate-400 text-sm">{item.label}</span>
                      <span className="text-sm font-medium" style={{ color: item.color || '#f0f4f8' }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#0d1423]/80 backdrop-blur-md border border-[rgba(0,212,170,0.12)] rounded-2xl shadow-lg p-6">
                <h3 className="font-syne font-semibold mb-4">🎯 BMI Analysis</h3>
                <div className="relative h-3 bg-[#111827] rounded-full overflow-hidden mb-3">
                  <div className="absolute inset-y-0 left-0 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((bmi || 22) / 40) * 100)}%`,
                      background: `linear-gradient(90deg, #00d4aa, ${bmiColor})`
                    }} />
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Underweight &lt;18.5</span>
                  <span>Normal 18.5–24.9</span>
                  <span>Overweight 25–29.9</span>
                  <span>Obese 30+</span>
                </div>
                <div className="mt-3 px-3 py-2 rounded-xl bg-[#111827] border border-[rgba(99,179,237,0.08)] text-sm text-slate-300">
                  Your BMI of <span style={{ color: bmiColor }} className="font-bold">{bmi || '--'}</span> is in the <span style={{ color: bmiColor }} className="font-bold">{bmiCategory}</span> range.
                  {bmi < 25 ? ' Keep maintaining your healthy lifestyle!' : ' Consider consulting a nutritionist for guidance.'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


