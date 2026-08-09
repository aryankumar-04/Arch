import React, { memo } from 'react';
import { useAuthStore, useSettingsStore } from '../../store';
import { MenuIcon } from '../common/Icons';
import TopbarSearch from '../search/TopbarSearch';

const Topbar = memo(({ onMenuToggle }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const username = useSettingsStore((state) => state.username);
  const [isLocked, setIsLocked] = React.useState(false);

  React.useEffect(() => {
    const handleEditMode = (e) => {
      setIsLocked(Boolean(e.detail?.isEditing));
    };
    window.addEventListener('arch-dashboard-edit-mode', handleEditMode);
    return () => {
      window.removeEventListener('arch-dashboard-edit-mode', handleEditMode);
    };
  }, []);

  const handleLogoutClick = (e) => {
    if (isLocked) {
      e.preventDefault();
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('arch-nav-blocked'));
      return;
    }
    logout();
  };

  const displayName = username || (user ? user.email.split('@')[0] : 'Commander');

  return (
    <header className="topbar">
      <button className="menu-toggle" onClick={onMenuToggle} title="Toggle Sidebar">
        <MenuIcon size={20} />
      </button>

      <div
        className={isLocked ? 'nav-locked' : ''}
        onClick={(e) => {
          if (isLocked) {
            e.preventDefault();
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('arch-nav-blocked'));
          }
        }}
        style={{ flex: 1, maxWidth: '400px' }}
      >
        <TopbarSearch />
      </div>

      <div className="topbar-actions">
        <span className="user-badge">👤 {displayName}</span>
        {user && (
          <button
            className={`btn btn-danger btn-sm ${isLocked ? 'nav-locked' : ''}`}
            onClick={handleLogoutClick}
          >
            LOGOUT
          </button>
        )}
      </div>
    </header>
  );
});

Topbar.displayName = 'Topbar';

export default Topbar;
