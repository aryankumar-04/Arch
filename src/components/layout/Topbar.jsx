import React, { memo } from 'react';
import { useAuthStore, useSettingsStore } from '../../store';
import { MenuIcon } from '../common/Icons';
import TopbarSearch from '../search/TopbarSearch';

const Topbar = memo(({ onMenuToggle }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const username = useSettingsStore((state) => state.username);

  const displayName = username || (user ? user.email.split('@')[0] : 'Commander');

  return (
    <header className="topbar">
      <button className="menu-toggle" onClick={onMenuToggle} title="Toggle Sidebar">
        <MenuIcon size={20} />
      </button>

      <TopbarSearch />

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
