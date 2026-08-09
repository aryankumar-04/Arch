import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';

// Layout & Shell
import Layout from './components/layout/Layout';
import LoadingScreen from './components/common/LoadingScreen';

// Pages (Static imports for instant tab switching with no transition animation)
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Journal from './pages/Journal';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import College from './pages/College';
import Gym from './pages/Gym';
import Coding from './pages/Coding';
import Movies from './pages/Movies';
import Wardrobe from './pages/Wardrobe';
import Expenses from './pages/Expenses';
import Goals from './pages/Goals';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const init = useAuthStore((state) => state.init);
  
  useEffect(() => {
    init();
  }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard Shell Routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/college" element={<College />} />
          <Route path="/gym" element={<Gym />} />
          <Route path="/coding" element={<Coding />} />
          <Route path="/leetcode" element={<Navigate to="/coding" replace />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback route redirecting to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;