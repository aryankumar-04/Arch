import React, { useState, useEffect, useRef } from 'react';

const DropdownMenu = ({
  trigger,
  items = [],
  align = 'left',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleItemClick = (onClick) => {
    setIsOpen(false);
    if (typeof onClick === 'function') {
      onClick();
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', width: '100%' }} className={className}>
      <div onClick={() => setIsOpen(prev => !prev)} style={{ cursor: 'pointer', width: '100%' }}>
        {trigger}
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align]: 0,
            minWidth: '180px',
            width: '100%',
            background: 'var(--bg2)',
            border: 'var(--bw) solid var(--border)',
            boxShadow: '4px 4px 0px var(--border)',
            borderRadius: '4px',
            zIndex: 1000,
            overflow: 'hidden',
            padding: '4px 0'
          }}
        >
          {items.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleItemClick(item.onClick)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                fontSize: '0.85rem',
                fontWeight: 800,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--yellow)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {item.icon && <span style={{ fontSize: '1rem' }}>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownMenu;
