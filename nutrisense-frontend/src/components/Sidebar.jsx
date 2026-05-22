import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  // OVERVIEW
  { icon: '📊', label: 'Dashboard',     path: '/',            section: 'overview'   },
  { icon: '💓', label: 'Heart Scan',    path: '/scan',        section: 'overview'   },
  { icon: '🩺', label: 'Log Vitals',    path: '/vitals',      section: 'overview'   },
  { icon: '⚖️', label: 'BMI Tracker', path: '/bmi',      section: 'overview'  },

  // NUTRITION
  { icon: '🥗', label: 'Diet Plan',     path: '/diet',        section: 'nutrition'  },
  { icon: '🍽️', label: 'Meal Logger',  path: '/meal',        section: 'nutrition'  },
  { icon: '📸', label: 'Photo Scanner', path: '/photo-scanner', section: 'nutrition' },
  { icon: '🧠', label: 'RAG Diet AI', path: '/rag-diet',  section: 'nutrition' },
  { icon: '📐', label: 'Portion Size', path: '/portion', section: 'nutrition' },
  
  // HEALTH
  { icon: '📈', label: 'History',       path: '/history',     section: 'health'     },
  { icon: '🤖', label: 'AI Doctor',     path: '/ai-doctor',   section: 'health'     },
  { icon: '👤', label: 'Profile',       path: '/profile',     section: 'health'     },
  { icon: '🩺', label: 'Risk Analysis', path: '/health-risk', section: 'health' },
  // REWARDS
  { icon: '🏆', label: 'Rewards',       path: '/rewards',     section: 'rewards'    },
];

const sections = [
  { key: 'overview',  label: 'Overview'  },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'health',    label: 'Health'    },
  { key: 'rewards',   label: 'Rewards'   },
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const location  = useLocation();

  return (
    <div className="w-56 min-h-screen bg-[#131d2e] border-r border-[rgba(99,179,237,0.12)] flex flex-col py-6 px-3 sticky top-0">
      {/* Logo */}
      <div className="px-3 mb-6">
        <div className="font-syne text-lg font-bold">
          Nutri<span className="text-[#00d4aa]">Sense</span>
        </div>
        <div className="text-xs text-slate-500 mt-0.5">Health Dashboard</div>
      </div>

      {/* Nav */}
      <div className="space-y-1">
        {sections.map((section) => (
          <div key={section.key}>
            <div className="px-3 text-xs text-slate-600 uppercase tracking-widest mb-2 mt-4 font-medium">
              {section.label}
            </div>
            {navItems
              .filter(item => item.section === section.key)
              .map(item => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    location.pathname === item.path
                      ? 'bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-[#00d4aa]'
                      : 'text-slate-400 hover:bg-[#111827] hover:text-white border border-transparent'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

