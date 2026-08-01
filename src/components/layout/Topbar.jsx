import React, { memo } from 'react';
import { useAuthStore, useSettingsStore, useSearchStore } from '../../store';
import { SearchIcon, MenuIcon } from '../common/Icons';

const Topbar = memo(({ onMenuToggle }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const username = useSettingsStore((state) => state.username);
  const openSearch = useSearchStore((state) => state.openSearch);

  const displayName = username || (user ? user.email.split('@')[0] : 'Commander');

  return (
    <header className="topbar">
      <button className="menu-toggle" onClick={onMenuToggle} title="Toggle Sidebar">
        <MenuIcon size={20} />
      </button>

      <div 
        className="topbar-search" 
        onClick={openSearch}
        role="button"
        tabIndex={0}
        aria-label="Open search palette (Ctrl + K)"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openSearch();
          }
        }}
      >
        <SearchIcon size={16} />
        <input 
          type="text" 
          placeholder="Search everything..." 
          readOnly 
          tabIndex={-1}
        />
        <kbd>Ctrl+K</kbd>
      </div>

      <div className="topbar-actions">
        <span className="user-badge">👤 {displayName}</span>
        {user && (
          <button className="btn btn-danger btn-sm" onClick={logout}>
            LOGOUT
          </button>
        )}
      </div>
    </header>
  );
});

Topbar.displayName = 'Topbar';

export default Topbar;
