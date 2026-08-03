import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchStore } from '../../store/useSearchStore';
import { 
  SearchIcon, 
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

const TopbarSearch = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
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

  const [inputVal, setInputVal] = useState(query || '');

  // Keep inputVal synchronized with store query
  useEffect(() => {
    setInputVal(query || '');
  }, [query]);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputVal(value);
    if (!isOpen) {
      openSearch();
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      startTransition(() => {
        setQuery(value);
      });
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSelectResult = useCallback((item) => {
    if (!item) return;
    closeSearch();
    inputRef.current?.blur();
    navigate(item.route);
  }, [closeSearch, navigate]);

  // Handle Focus
  const handleFocus = () => {
    openSearch();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeSearch();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeSearch]);

  // Global Keyboard Shortcuts (Ctrl + K to focus input, ESC to close)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        openSearch();
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeSearch();
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, openSearch, closeSearch]);

  // Keyboard navigation within search input
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      if (!isOpen) {
        openSearch();
        return;
      }
      if (results && results.length > 0) {
        e.preventDefault();
        setSelectedIndex((selectedIndex + 1) % results.length);
      }
    } else if (e.key === 'ArrowUp') {
      if (results && results.length > 0) {
        e.preventDefault();
        setSelectedIndex((selectedIndex - 1 + results.length) % results.length);
      }
    } else if (e.key === 'Enter') {
      if (results && results.length > 0) {
        e.preventDefault();
        const selectedItem = results[selectedIndex] || results[0];
        if (selectedItem) {
          handleSelectResult(selectedItem);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="topbar-search-container" ref={containerRef}>
      <div className="topbar-search">
        <SearchIcon size={16} />
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Search everything..." 
          value={inputVal}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
      </div>

      {isOpen && (
        <div className="search-dropdown-menu" role="listbox">
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
      )}
    </div>
  );
};

export default TopbarSearch;
