import React, { useEffect, useRef, useCallback, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '../../store/useSearchStore';
import { 
  SearchIcon, 
  CloseIcon, 
  TasksIcon, 
  GoalsIcon, 
  JournalIcon, 
  MoviesIcon, 
  ExpensesIcon, 
  LeetCodeIcon, 
  WardrobeIcon, 
  GymIcon, 
  CollegeIcon, 
  CalendarIcon 
} from '../common/Icons';

const MODULE_ICONS = {
  Tasks: <TasksIcon size={18} />,
  Goals: <GoalsIcon size={18} />,
  Journal: <JournalIcon size={18} />,
  Movies: <MoviesIcon size={18} />,
  'TV Shows': <MoviesIcon size={18} />,
  Expenses: <ExpensesIcon size={18} />,
  'Coding Logs': <LeetCodeIcon size={18} />,
  Wardrobe: <WardrobeIcon size={18} />,
  Gym: <GymIcon size={18} />,
  College: <CollegeIcon size={18} />,
  Calendar: <CalendarIcon size={18} />
};

const MODULE_BADGE_CLASSES = {
  Tasks: 'badge-blue',
  Goals: 'badge-yellow',
  Journal: 'badge-purple',
  Movies: 'badge-red',
  'TV Shows': 'badge-red',
  Expenses: 'badge-green',
  'Coding Logs': 'badge-blue',
  Wardrobe: 'badge-purple',
  Gym: 'badge-green',
  College: 'badge-yellow',
  Calendar: 'badge-blue'
};

const HighlightedText = ({ text, query }) => {
  if (!query || !query.trim() || !text) return <span>{text}</span>;

  const words = query.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return <span>{text}</span>;

  const escapedWords = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="search-highlight">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const GlobalSearchModal = () => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const [, startTransition] = useTransition();

  const { 
    isOpen, 
    query, 
    results, 
    selectedIndex, 
    openSearch, 
    closeSearch, 
    setQuery, 
    setSelectedIndex 
  } = useSearchStore();

  // Handle Debounced Search Input
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      startTransition(() => {
        setQuery(value);
      });
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);


  // Global Keyboard Shortcuts (Ctrl + K, Esc)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, openSearch, closeSearch]);

  // Focus input automatically when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelectResult = useCallback((item) => {
    if (!item) return;
    closeSearch();
    navigate(item.route);
  }, [closeSearch, navigate]);

  // Modal Keyboard Navigation (ArrowUp, ArrowDown, Enter)
  const handleModalKeyDown = (e) => {
    if (!results || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((selectedIndex + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((selectedIndex - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedItem = results[selectedIndex] || results[0];
      if (selectedItem) {
        handleSelectResult(selectedItem);
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="modal-overlay search-modal-overlay" 
      onClick={closeSearch}
      role="dialog"
      aria-modal="true"
      aria-label="Global Search Modal"
    >
      <div 
        className="modal search-modal" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleModalKeyDown}
      >
        <div className="search-modal-header">
          <SearchIcon size={20} className="search-input-icon" />
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Type a command or search (e.g., tasks, goals, movies)..."
            defaultValue={query}
            onChange={handleInputChange}
            aria-autocomplete="list"
            autoFocus
          />
          <kbd className="search-modal-kbd">ESC</kbd>
          <button 
            className="modal-close search-modal-close" 
            onClick={closeSearch}
            title="Close Search"
            aria-label="Close search"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="search-modal-results" role="listbox">
          {results && results.length > 0 ? (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              const badgeClass = MODULE_BADGE_CLASSES[item.module] || 'badge-blue';
              const moduleIcon = MODULE_ICONS[item.module] || <SearchIcon size={18} />;

              return (
                <div
                  key={item.id}
                  className={`search-result-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="search-result-icon">
                    {moduleIcon}
                  </div>
                  <div className="search-result-content">
                    <div className="search-result-title-row">
                      <span className="search-result-title">
                        <HighlightedText text={item.title} query={query} />
                      </span>
                      <span className={`badge ${badgeClass} search-result-badge`}>
                        {item.module}
                      </span>
                    </div>
                    <div className="search-result-subtitle">
                      <HighlightedText text={item.subtitle} query={query} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="search-no-results">
              <p className="search-no-results-title">No matching records found</p>
              <p className="search-no-results-sub">Try searching for tasks, goals, journal entries, movies, or expenses.</p>
            </div>
          )}
        </div>

        <div className="search-modal-footer">
          <div className="search-footer-hint">
            <kbd>↑</kbd> <kbd>↓</kbd> to navigate
          </div>
          <div className="search-footer-hint">
            <kbd>↵</kbd> to select
          </div>
          <div className="search-footer-hint">
            <kbd>ESC</kbd> to close
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GlobalSearchModal;
