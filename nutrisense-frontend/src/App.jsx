import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import HeartScan from './pages/HeartScan';
import Vitals from './pages/Vitals';
import DietPlan from './pages/DietPlan';
import MealLogger from './pages/MealLogger';
import AIDoctor from './pages/AIDoctor';
import Profile from './pages/Profile';
import History from './pages/History';
import PhotoScanner from './pages/PhotoScanner';
import Rewards      from './pages/Rewards';
import HealthRisk from './pages/HealthRisk';
import BMITracker from './pages/BMITracker';
import RAGDietAI  from './pages/RAGDietAI';
import PortionSize from './pages/PortionSize';



const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-primary text-xl font-syne">Loading...</div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/scan" element={<ProtectedRoute><HeartScan /></ProtectedRoute>} />
        <Route path="/vitals" element={<ProtectedRoute><Vitals /></ProtectedRoute>} />
        <Route path="/diet" element={<ProtectedRoute><DietPlan /></ProtectedRoute>} />
        <Route path="/meal" element={<ProtectedRoute><MealLogger /></ProtectedRoute>} />
        <Route path="/ai-doctor" element={<ProtectedRoute><AIDoctor /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/photo-scanner" element={<PhotoScanner />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/health-risk" element={<HealthRisk />} />
        <Route path="/bmi"      element={<BMITracker />} />
        <Route path="/rag-diet" element={<RAGDietAI />} />
        <Route path="/portion" element={<PortionSize />} />


      </Routes>
    </BrowserRouter>
  );
}

export default App;
