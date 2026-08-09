import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import OnboardingModal from '../onboarding/OnboardingModal';
import { 
  useJournalStore, 
  useTaskStore, 
  useGymStore, 
  useMovieStore, 
  useWardrobeStore, 
  useExpenseStore, 
  useGoalStore 
} from '../../store';

const SIDEBAR_NAV_ORDER = [
  '/',           // 0: Dashboard
  '/journal',    // 1: Daily Journal
  '/tasks',      // 2: Tasks
  '/calendar',   // 3: Calendar
  '/gym',        // 4: Gym
  '/coding',     // 5: Coding Hub
  '/college',    // 6: College
  '/movies',     // 7: Movies
  '/wardrobe',   // 8: Wardrobe
  '/expenses',   // 9: Expenses
  '/goals',      // 10: Goals
  '/analytics',  // 11: Analytics
  '/settings'    // 12: Settings
];

const getRouteIndex = (pathname) => {
  const normalized = pathname === '/leetcode' ? '/coding' : pathname;
  const idx = SIDEBAR_NAV_ORDER.indexOf(normalized);
  return idx !== -1 ? idx : 0;
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const prevPathRef = useRef(location.pathname);
  const contentRef = useRef(null);
  // Ref for the animation wrapper — used to re-trigger CSS animation without unmounting children
  const transitionRef = useRef(null);

  // Quiet background pre-fetching of tab data after initial mount so all tabs are cached & instant
  useEffect(() => {
    const timer = setTimeout(() => {
      useJournalStore.getState().fetchEntries?.();
      useTaskStore.getState().fetchTasks?.();
      useGymStore.getState().fetchWorkouts?.();
      useMovieStore.getState().fetchMovies?.();
      useWardrobeStore.getState().fetchWardrobe?.();
      useExpenseStore.getState().fetchExpenses?.();
      useGoalStore.getState().fetchGoals?.();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (location.pathname !== prevPathRef.current) {
      const prevIdx = getRouteIndex(prevPathRef.current);
      const currentIdx = getRouteIndex(location.pathname);

      const direction = currentIdx > prevIdx ? 'slide-up' : 'slide-down';

      prevPathRef.current = location.pathname;

      // Re-trigger the CSS animation by removing and re-adding the class.
      // This avoids using key={...} which would unmount/remount child components
      // and destroy their state (the root cause of the dashboard layout persistence bug).
      if (transitionRef.current) {
        const el = transitionRef.current;
        el.classList.remove('slide-up', 'slide-down');
        // Force a reflow so the browser recognizes the class removal before re-adding
        void el.offsetWidth;
        el.classList.add(direction);
      }

      // Scroll content container & window back to top when opening a new tab
      if (contentRef.current) {
        contentRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <main ref={contentRef} className="page-content" style={{ overflowX: 'hidden', position: 'relative' }}>
          <div ref={transitionRef} className="page-transition-container slide-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <OnboardingModal />
    </div>
  );
};

export default Layout;

