import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import AuthForm from './components/AuthForm';

// Pages
import DashboardOverview from './pages/DashboardOverview';
import LiveOperations from './pages/LiveOperations';
import ThreatIntelligence from './pages/ThreatIntelligence';
import NetworkTopology from './pages/NetworkTopology';
import AdminPanel from './pages/AdminPanel';
import Reports from './pages/Reports';
import Forensics from './pages/Forensics';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) return <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Loading...</div>;

  if (!token) return <Navigate to="/login" replace />;

  return children;
};

const AppRoutes = () => {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!token ? <AuthForm /> : <Navigate to="/dashboard" />} />

      {/* Protected Routes wrapped in MainLayout */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardOverview />} />
        <Route path="/live-ops" element={<LiveOperations />} />
        <Route path="/intelligence" element={<ThreatIntelligence />} />
        <Route path="/forensics" element={<Forensics />} />
        <Route path="/network" element={<NetworkTopology />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
