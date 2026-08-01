import React, { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  DashboardIcon, 
  JournalIcon, 
  TasksIcon, 
  CalendarIcon,
  GymIcon, 
  LeetCodeIcon, 
  CollegeIcon,
  MoviesIcon,
  WardrobeIcon,
  ExpensesIcon,
  GoalsIcon,
  AnalyticsIcon,
  SettingsIcon,
  CloseIcon
} from '../common/Icons';

const navItems = [
  { name: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { name: 'Daily Journal', path: '/journal', icon: <JournalIcon /> },
  { name: 'Tasks', path: '/tasks', icon: <TasksIcon /> },
  { name: 'Calendar', path: '/calendar', icon: <CalendarIcon /> },
  { name: 'Gym', path: '/gym', icon: <GymIcon /> },
  { name: 'Coding Hub', path: '/coding', icon: <LeetCodeIcon /> },
  { name: 'College', path: '/college', icon: <CollegeIcon /> },
  { name: 'Movies', path: '/movies', icon: <MoviesIcon /> },
  { name: 'Wardrobe', path: '/wardrobe', icon: <WardrobeIcon /> },
  { name: 'Expenses', path: '/expenses', icon: <ExpensesIcon /> },
  { name: 'Goals', path: '/goals', icon: <GoalsIcon /> },
  { name: 'Analytics', path: '/analytics', icon: <AnalyticsIcon /> },
  { name: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

const Sidebar = memo(({ isOpen, onClose }) => {
  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">A</div>
            <span className="logo-text">ARCH</span>
          </div>
          <button className="sidebar-close" onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              to={item.path} 
              key={item.name}
              onClick={onClose}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;
