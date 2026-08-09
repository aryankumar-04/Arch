import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { WidthProvider, ReactGridLayout } from 'react-grid-layout/legacy';
import {
  useTaskStore, useExpenseStore, useGymStore,
  useJournalStore, useCollegeStore, useCalendarStore,
  useGoalStore, useCodingStore, useSettingsStore, useAuthStore
} from '../store';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';
import Modal from '../components/common/Modal';
import DuplicateErrorBanner from '../components/common/DuplicateErrorBanner';
import { PlusIcon, EditIcon, TrashIcon } from '../components/common/Icons';
import {
  DEFAULT_LAYOUT,
  DEFAULT_PRESET,
  WIDGET_METADATA,
  areLayoutsIdentical,
  getCachedDashboardLayout,
  saveCachedDashboardLayout,
  fetchRemoteDashboardLayout,
  syncRemoteDashboardLayout,
  getCachedDashboardPresets,
  getCachedActivePresetId,
  saveCachedDashboardPresets,
  fetchRemoteDashboardPresets,
  syncRemoteDashboardPresets
} from '../utils/dashboardLayout';

const GridWithWidth = WidthProvider(ReactGridLayout);

// Static (non-hook) version of enrichLayout for use in useState lazy initializers
const enrichLayoutStatic = (layoutItems) => {
  return layoutItems.map(item => {
    const meta = WIDGET_METADATA[item.i] || {};
    return {
      ...item,
      minW: meta.minW || item.minW || 1,
      minH: meta.minH || item.minH || 1,
      maxW: meta.maxW || item.maxW || 12,
      maxH: meta.maxH || item.maxH || 8
    };
  });
};

const QUOTES = [
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const uid = user ? user.uid : 'guest';
  const isGoogleUser = Boolean(user && user.providerData?.some(p => p.providerId === 'google.com'));

  // Stores
  const { tasks, fetchTasks } = useTaskStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  const { workouts, fetchWorkouts } = useGymStore();
  const { entries, fetchEntries, updateEntry, addEntry } = useJournalStore();
  const { subjects, fetchCollegeData } = useCollegeStore();
  const { events, fetchEvents } = useCalendarStore();
  const { goals, fetchGoals } = useGoalStore();
  const { problems, fetchCodingData } = useCodingStore();
  const { username, initSettings } = useSettingsStore();

  // Live Clock State
  const [now, setNow] = useState(new Date());

  // Quick Notes State
  const [quickNote, setQuickNote] = useState('');

  // Edit Mode & Grid Layout States
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState(() => {
    // Lazy initializer: read cached layout immediately to avoid a flash of empty state
    const cached = getCachedDashboardLayout(uid);
    return enrichLayoutStatic(cached.layout);
  });
  const [removedWidgets, setRemovedWidgets] = useState(() => {
    const cached = getCachedDashboardLayout(uid);
    return cached.removedWidgets || [];
  });
  const [historyStack, setHistoryStack] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Presets States
  const [presets, setPresets] = useState([]);
  const [activePresetId, setActivePresetId] = useState(() => getCachedActivePresetId(uid));
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [presetModalMode, setPresetModalMode] = useState('save'); // 'save' | 'rename'
  const [targetPresetId, setTargetPresetId] = useState(null);
  const [presetInputName, setPresetInputName] = useState('');
  const [presetInputError, setPresetInputError] = useState('');
  const [duplicateError, setDuplicateError] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [presetToDelete, setPresetToDelete] = useState(null);

  const activePreset = presets.find(p => p.id === activePresetId) || presets.find(p => p.id === 'preset_default') || DEFAULT_PRESET;

  // Ref to prevent race conditions during editing
  const isEditingRef = useRef(false);
  isEditingRef.current = isEditMode;

  // Hydration guard: prevents handleLayoutChange from overwriting localStorage
  // with empty/default layout before the cached layout has been loaded
  const isHydratedRef = useRef(false);

  // Ref for Add Dropdown click outside listener
  const dropdownRef = useRef(null);

  // Ref for Presets Dropdown click outside listener
  const presetsDropdownRef = useRef(null);

  // Broadcast edit mode status & listen for navigation lock events
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('arch-dashboard-edit-mode', { detail: { isEditing: isEditMode } }));

    if (isEditMode) {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'You have unsaved dashboard layout changes!';
        return 'You have unsaved dashboard layout changes!';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);

      const handleNavBlocked = () => {
        setDuplicateError({
          title: '⚠️ EDIT MODE ACTIVE',
          message: 'Finish editing your dashboard first (Click "✓ Done" or "✕ Exit" to unlock navigation).'
        });
      };
      window.addEventListener('arch-nav-blocked', handleNavBlocked);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('arch-nav-blocked', handleNavBlocked);
        window.dispatchEvent(new CustomEvent('arch-dashboard-edit-mode', { detail: { isEditing: false } }));
      };
    }
  }, [isEditMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAddOpen(false);
      }
      if (presetsDropdownRef.current && !presetsDropdownRef.current.contains(event.target)) {
        setIsPresetsOpen(false);
      }
    };
    if (isAddOpen || isPresetsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddOpen, isPresetsOpen]);

  // Hydrate Presets (LocalStorage -> Firestore if Google user)
  useEffect(() => {
    const cachedPresets = getCachedDashboardPresets(uid);
    setPresets(cachedPresets);
    const cachedActiveId = getCachedActivePresetId(uid);
    setActivePresetId(cachedActiveId);

    if (isGoogleUser) {
      let isSubscribed = true;
      fetchRemoteDashboardPresets(uid, true).then(remote => {
        if (isSubscribed && remote) {
          if (remote.presets) {
            setPresets(remote.presets);
          }
          if (remote.activePresetId) {
            setActivePresetId(remote.activePresetId);
          }
          saveCachedDashboardPresets(uid, remote.presets || cachedPresets, remote.activePresetId || cachedActiveId);
        }
      });
      return () => { isSubscribed = false; };
    }
  }, [uid, isGoogleUser]);

  useEffect(() => {
    setQuickNote(getLocalUserBackup('quick_note', uid, ''));
  }, [uid]);

  // Quote of the day state
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Helper to ensure minW/minH/maxW/maxH metadata remains on layout items
  const enrichLayout = useCallback((layoutItems) => {
    return layoutItems.map(item => {
      const meta = WIDGET_METADATA[item.i] || {};
      return {
        ...item,
        minW: meta.minW || item.minW || 1,
        minH: meta.minH || item.minH || 1,
        maxW: meta.maxW || item.maxW || 12,
        maxH: meta.maxH || item.maxH || 8
      };
    });
  }, []);

  // Hydrate layout (LocalStorage cache -> Remote Firestore)
  useEffect(() => {
    const cached = getCachedDashboardLayout(uid);
    const enriched = enrichLayout(cached.layout);
    setLayout(enriched);
    setRemovedWidgets(cached.removedWidgets || []);

    // Mark hydration complete so handleLayoutChange can start persisting
    isHydratedRef.current = true;

    // Background fetch from Firestore
    let isSubscribed = true;
    fetchRemoteDashboardLayout(uid, isGoogleUser).then(remote => {
      if (isSubscribed && remote && Array.isArray(remote.layout) && !isEditingRef.current) {
        const remoteEnriched = enrichLayout(remote.layout);
        setLayout(remoteEnriched);
        setRemovedWidgets(remote.removedWidgets || []);
        saveCachedDashboardLayout(uid, remoteEnriched, remote.removedWidgets || []);
      }
    });

    return () => { isSubscribed = false; };
  }, [uid, isGoogleUser, enrichLayout]);

  useEffect(() => {
    initSettings();
    fetchTasks();
    fetchExpenses();
    fetchWorkouts();
    fetchEntries();
    fetchCollegeData();
    fetchEvents();
    fetchGoals();
    fetchCodingData();

    // Live clock timer
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [initSettings, fetchTasks, fetchExpenses, fetchWorkouts, fetchEntries, fetchCollegeData, fetchEvents, fetchGoals, fetchCodingData]);

  const handleQuickNoteChange = (text) => {
    setQuickNote(text);
    saveLocalUserBackup('quick_note', uid, text);
  };

  // Push state to Undo/Redo history stack
  const pushHistory = useCallback((newLayout, newRemoved) => {
    const enriched = enrichLayout(newLayout);
    setHistoryStack(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, { layout: enriched, removedWidgets: newRemoved }];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex, enrichLayout]);

  // Pre-edit layout snapshot for Exit/Discard
  const preEditSnapshotRef = useRef(null);

  // Edit Mode Handlers
  const handleEnterEditMode = () => {
    preEditSnapshotRef.current = {
      layout: [...layout],
      removedWidgets: [...removedWidgets],
      activePresetId
    };
    setIsEditMode(true);
    setHistoryStack([{ layout, removedWidgets }]);
    setHistoryIndex(0);
  };

  const handleCreateNewPreset = () => {
    const userPresets = presets.filter(p => p.id !== 'preset_default' && !p.isDefault);
    if (userPresets.length >= 10) {
      setDuplicateError({
        title: '⚠️ PRESET LIMIT REACHED (10/10)',
        message: 'You have reached the maximum limit of 10 custom presets. Please delete an existing preset before creating a new one.'
      });
      setIsPresetsOpen(false);
      return;
    }
    setDuplicateError(null);
    preEditSnapshotRef.current = {
      layout: [...layout],
      removedWidgets: [...removedWidgets],
      activePresetId
    };
    const defaultEnriched = enrichLayout(DEFAULT_LAYOUT);
    setLayout(defaultEnriched);
    setRemovedWidgets([]);
    setIsCreatingPreset(true);
    setIsPresetsOpen(false);
    setIsEditMode(true);
    setHistoryStack([{ layout: defaultEnriched, removedWidgets: [] }]);
    setHistoryIndex(0);
  };

  const handleCancelEditMode = () => {
    if (preEditSnapshotRef.current) {
      const { layout: prevLayout, removedWidgets: prevRemoved, activePresetId: prevActiveId } = preEditSnapshotRef.current;
      setLayout(prevLayout);
      setRemovedWidgets(prevRemoved);
      setActivePresetId(prevActiveId);
      saveCachedDashboardLayout(uid, prevLayout, prevRemoved);
      syncRemoteDashboardLayout(uid, prevLayout, prevRemoved, isGoogleUser);
    }
    setIsCreatingPreset(false);
    setIsEditMode(false);
    setIsAddOpen(false);
    setIsPresetsOpen(false);
  };

  const handleExitEditMode = () => {
    if (isCreatingPreset) {
      handleOpenSaveModal();
      return;
    }

    // Check if edited layout matches another preset (excluding current active preset)
    const conflictingPreset = presets.find(
      p => p.id !== activePresetId && areLayoutsIdentical(layout, removedWidgets, p.layout, p.removedWidgets)
    );

    if (conflictingPreset) {
      setDuplicateError({
        title: '⚠️ DUPLICATE LAYOUT DETECTED',
        message: `This layout configuration is identical to your "${conflictingPreset.name}" preset. Each preset must have a unique widget layout!`
      });
      return;
    }

    setDuplicateError(null);
    setIsEditMode(false);
    setIsAddOpen(false);
    setIsPresetsOpen(false);

    saveCachedDashboardLayout(uid, layout, removedWidgets);
    syncRemoteDashboardLayout(uid, layout, removedWidgets, isGoogleUser);

    if (activePresetId && activePresetId !== 'preset_default') {
      const updatedPresets = presets.map(p =>
        p.id === activePresetId ? { ...p, layout: [...layout], removedWidgets: [...removedWidgets] } : p
      );
      setPresets(updatedPresets);
      saveCachedDashboardPresets(uid, updatedPresets, activePresetId);
      syncRemoteDashboardPresets(uid, updatedPresets, activePresetId, isGoogleUser);
    }
  };

  const handleOpenSaveModal = () => {
    const userPresets = presets.filter(p => p.id !== 'preset_default' && !p.isDefault);
    if (userPresets.length >= 10) {
      setDuplicateError({
        title: '⚠️ PRESET LIMIT REACHED (10/10)',
        message: 'You have reached the maximum limit of 10 custom presets. Please delete an existing preset before creating a new one.'
      });
      return;
    }

    // Check duplicate layout before opening modal
    const conflictingPreset = presets.find(
      p => areLayoutsIdentical(layout, removedWidgets, p.layout, p.removedWidgets)
    );

    if (conflictingPreset) {
      setDuplicateError({
        title: '⚠️ DUPLICATE LAYOUT DETECTED',
        message: `This layout is identical to your "${conflictingPreset.name}" preset. Please customize widget positions or visibility to make it unique!`
      });
      return;
    }

    setPresetModalMode('save');
    setTargetPresetId(null);
    setPresetInputName('');
    setPresetInputError('');
    setDuplicateError(null);
    setPresetModalOpen(true);
    setIsPresetsOpen(false);
  };

  const handleOpenRenameModal = (preset, e) => {
    e.stopPropagation();
    if (preset.id === 'preset_default' || preset.isDefault) return;
    setPresetModalMode('rename');
    setTargetPresetId(preset.id);
    setPresetInputName(preset.name);
    setPresetInputError('');
    setDuplicateError(null);
    setPresetModalOpen(true);
    setIsPresetsOpen(false);
  };

  const handleSaveOrRenamePresetSubmit = (e) => {
    e.preventDefault();
    const trimmed = presetInputName.trim();
    if (!trimmed) {
      setPresetInputError('Preset name is required.');
      return;
    }

    if (trimmed.length > 10) {
      setPresetInputError('Preset name cannot exceed 10 characters.');
      return;
    }

    const isDuplicate = presets.some(p =>
      p.name.toLowerCase() === trimmed.toLowerCase() && p.id !== targetPresetId
    );

    if (isDuplicate) {
      setPresetInputError('A preset with this name already exists. Please choose a unique name.');
      return;
    }

    if (presetModalMode === 'save') {
      const userPresets = presets.filter(p => p.id !== 'preset_default' && !p.isDefault);
      if (userPresets.length >= 10) {
        setPresetInputError('Preset limit reached (10/10). Please delete an existing preset first.');
        setDuplicateError({
          title: '⚠️ PRESET LIMIT REACHED (10/10)',
          message: 'You have reached the maximum limit of 10 custom presets. Please delete an existing preset before creating a new one.'
        });
        return;
      }

      const conflictingPreset = presets.find(
        p => p.id !== targetPresetId && areLayoutsIdentical(layout, removedWidgets, p.layout, p.removedWidgets)
      );

      if (conflictingPreset) {
        setPresetInputError(`Layout is identical to "${conflictingPreset.name}" preset.`);
        setDuplicateError({
          title: '⚠️ DUPLICATE LAYOUT DETECTED',
          message: `This layout is identical to your "${conflictingPreset.name}" preset. Each preset must have a unique widget layout!`
        });
        return;
      }

      const newPreset = {
        id: 'preset_' + Date.now(),
        name: trimmed,
        layout: [...layout],
        removedWidgets: [...removedWidgets],
        createdAt: new Date().toISOString()
      };

      const updatedPresets = [...presets, newPreset];
      setPresets(updatedPresets);
      setActivePresetId(newPreset.id);
      saveCachedDashboardPresets(uid, updatedPresets, newPreset.id);
      syncRemoteDashboardPresets(uid, updatedPresets, newPreset.id, isGoogleUser);
      saveCachedDashboardLayout(uid, layout, removedWidgets);
      syncRemoteDashboardLayout(uid, layout, removedWidgets, isGoogleUser);
      setDuplicateError(null);
      setIsCreatingPreset(false);
      setIsEditMode(false);
      setIsAddOpen(false);
      setIsPresetsOpen(false);
    } else if (presetModalMode === 'rename' && targetPresetId) {
      const updatedPresets = presets.map(p =>
        p.id === targetPresetId ? { ...p, name: trimmed } : p
      );
      setPresets(updatedPresets);
      saveCachedDashboardPresets(uid, updatedPresets, activePresetId);
      syncRemoteDashboardPresets(uid, updatedPresets, activePresetId, isGoogleUser);
      setDuplicateError(null);
    }

    setPresetModalOpen(false);
  };

  const handleApplyPreset = (preset) => {
    const enriched = enrichLayout(preset.layout || []);
    setLayout(enriched);
    setRemovedWidgets(preset.removedWidgets || []);
    setIsPresetsOpen(false);
    setActivePresetId(preset.id);
    saveCachedDashboardLayout(uid, enriched, preset.removedWidgets || []);
    syncRemoteDashboardLayout(uid, enriched, preset.removedWidgets || [], isGoogleUser);
    saveCachedDashboardPresets(uid, presets, preset.id);
    syncRemoteDashboardPresets(uid, presets, preset.id, isGoogleUser);
    pushHistory(enriched, preset.removedWidgets || []);
  };

  const handleOpenDeleteConfirm = (preset, e) => {
    e.stopPropagation();
    if (preset.id === 'preset_default' || preset.isDefault) return;
    setPresetToDelete(preset);
    setDeleteConfirmOpen(true);
    setIsPresetsOpen(false);
  };

  const handleConfirmDeletePreset = () => {
    if (!presetToDelete || presetToDelete.id === 'preset_default' || presetToDelete.isDefault) return;

    let newActiveId = activePresetId;
    if (presetToDelete.id === activePresetId) {
      newActiveId = 'preset_default';
      const defaultEnriched = enrichLayout(DEFAULT_LAYOUT);
      setLayout(defaultEnriched);
      setRemovedWidgets([]);
      saveCachedDashboardLayout(uid, defaultEnriched, []);
      syncRemoteDashboardLayout(uid, defaultEnriched, [], isGoogleUser);
    }

    const updatedPresets = presets.filter(p => p.id !== presetToDelete.id);
    setPresets(updatedPresets);
    setActivePresetId(newActiveId);
    saveCachedDashboardPresets(uid, updatedPresets, newActiveId);
    syncRemoteDashboardPresets(uid, updatedPresets, newActiveId, isGoogleUser);
    setDeleteConfirmOpen(false);
    setPresetToDelete(null);
  };

  const handleResetDefault = () => {
    const defaultEnriched = enrichLayout(DEFAULT_LAYOUT);
    setLayout(defaultEnriched);
    setRemovedWidgets([]);
    setIsAddOpen(false);
    setActivePresetId('preset_default');
    saveCachedDashboardLayout(uid, defaultEnriched, []);
    syncRemoteDashboardLayout(uid, defaultEnriched, []);
    saveCachedDashboardPresets(uid, presets, 'preset_default');
    syncRemoteDashboardPresets(uid, presets, 'preset_default', isGoogleUser);
    pushHistory(defaultEnriched, []);
  };

  const handleLayoutChange = (newLayout) => {
    const enriched = enrichLayout(newLayout);
    setLayout(enriched);
    // Guard: don't persist until the initial hydration from localStorage is complete.
    // The grid fires onLayoutChange on first render with potentially stale/default layout
    // before the useEffect has a chance to load the real cached layout.
    if (isHydratedRef.current) {
      saveCachedDashboardLayout(uid, enriched, removedWidgets);
    }
  };

  const handleDragOrResizeStop = (newLayout) => {
    const enriched = enrichLayout(newLayout);
    setLayout(enriched);
    saveCachedDashboardLayout(uid, enriched, removedWidgets);
    pushHistory(enriched, removedWidgets);
  };

  const handleRemoveWidget = (widgetId) => {
    const newLayout = layout.filter(item => item.i !== widgetId);
    const newRemoved = [...removedWidgets, widgetId];
    setLayout(newLayout);
    setRemovedWidgets(newRemoved);
    saveCachedDashboardLayout(uid, newLayout, newRemoved);
    pushHistory(newLayout, newRemoved);
  };

  const handleAddWidget = (widgetId) => {
    const meta = WIDGET_METADATA[widgetId] || { defaultW: 3, defaultH: 3, minW: 2, minH: 2, maxW: 6, maxH: 5 };
    let maxY = 0;
    layout.forEach(item => {
      if (item.y + item.h > maxY) maxY = item.y + item.h;
    });

    const newItem = {
      i: widgetId,
      x: 0,
      y: maxY,
      w: meta.defaultW,
      h: meta.defaultH,
      minW: meta.minW,
      minH: meta.minH,
      maxW: meta.maxW,
      maxH: meta.maxH
    };

    const newLayout = [...layout, newItem];
    const newRemoved = removedWidgets.filter(id => id !== widgetId);

    setLayout(newLayout);
    setRemovedWidgets(newRemoved);
    setIsAddOpen(false);
    saveCachedDashboardLayout(uid, newLayout, newRemoved);
    pushHistory(newLayout, newRemoved);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const targetState = historyStack[prevIdx];
      setHistoryIndex(prevIdx);
      setLayout(targetState.layout);
      setRemovedWidgets(targetState.removedWidgets);
      saveCachedDashboardLayout(uid, targetState.layout, targetState.removedWidgets);
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIdx = historyIndex + 1;
      const targetState = historyStack[nextIdx];
      setHistoryIndex(nextIdx);
      setLayout(targetState.layout);
      setRemovedWidgets(targetState.removedWidgets);
      saveCachedDashboardLayout(uid, targetState.layout, targetState.removedWidgets);
    }
  };

  // Greeting Calculation
  const hour = now.getHours();
  const timeSalutation = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const nameDisplay = username ? `, ${username}` : '';
  const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '👋';
  const greeting = `${timeSalutation}${nameDisplay} ${greetingEmoji}`;

  const formattedDateTime = now.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ' - ' + now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).toLowerCase();

  // Widget Data Computations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === todayStr);

  let sleepHours = '—';
  if (todayEntry) {
    let nightHours = 0;
    if (typeof todayEntry.sleepCycle?.duration === 'number') {
      nightHours = todayEntry.sleepCycle.duration;
    } else if (todayEntry.sleepHours) {
      nightHours = parseFloat(todayEntry.sleepHours) || 0;
    }

    let napHours = 0;
    if (typeof todayEntry.eveningNap?.duration === 'number') {
      napHours = todayEntry.eveningNap.duration;
    } else if (todayEntry.napHours) {
      napHours = parseFloat(todayEntry.napHours) || 0;
    }

    const total = nightHours + napHours;
    sleepHours = total > 0 ? total.toFixed(1) : (todayEntry.sleepHours || '0.0');
  }

  const tasksDueToday = tasks.filter(t => t.status !== 'completed');

  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlySpending = expenses
    .filter(e => {
      const d = new Date(e.date || e.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const codingThisWeek = problems.length;

  let daysSinceGym = '—';
  if (workouts.length > 0) {
    const lastWorkout = new Date(workouts[0].date || workouts[0].createdAt);
    const diffTime = Math.abs(now - lastWorkout);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    daysSinceGym = diffDays === 0 ? '0' : String(diffDays);
  }

  const journalStreak = entries.length;
  const gymStreak = workouts.length;
  const taskStreak = tasks.filter(t => {
    if (t.status !== 'completed') return false;
    if (!t.completedAt) return false;
    try {
      const completedDateStr = new Date(t.completedAt).toISOString().split('T')[0];
      return completedDateStr === todayStr;
    } catch (e) {
      return false;
    }
  }).length;

  const handleMoodSelect = async (moodEmoji) => {
    let entry = entries.find(e => e.date === todayStr);
    if (entry) {
      await updateEntry(entry.id, { mood: moodEmoji });
    } else {
      const newEntry = await addEntry(todayStr);
      if (newEntry) await updateEntry(newEntry.id, { mood: moodEmoji });
    }
  };

  const focusGoal = goals.find(g => g.status === 'in_progress') || goals[0];
  const currentQuote = QUOTES[quoteIndex % QUOTES.length];

  // Render individual widget component by ID
  const renderWidgetContent = (id) => {
    switch (id) {
      case 'sleep_last_night':
        return (
          <div className="card card-hover" style={{ padding: '16px' }} title="Combined Night Sleep + Evening Nap">
            <div className="card-title" style={{ fontSize: '0.75rem' }}>😴 SLEEP LAST NIGHT</div>
            <div className="card-value" style={{ fontSize: '1.8rem', borderBottom: 'var(--bw) solid var(--border)', paddingBottom: '4px' }}>
              {sleepHours !== '—' ? `${sleepHours} HRS` : '— HRS'}
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text2)', marginTop: '4px', textTransform: 'uppercase' }}>
              NIGHT + NAP
            </div>
          </div>
        );
      case 'tasks_due_today':
        return (
          <div className="card card-hover" style={{ padding: '16px' }}>
            <div className="card-title" style={{ fontSize: '0.75rem' }}>📋 TASKS DUE TODAY</div>
            <div className="card-value" style={{ fontSize: '1.8rem' }}>
              {tasksDueToday.length}
            </div>
          </div>
        );
      case 'monthly_spending':
        return (
          <div className="card card-hover" style={{ padding: '16px' }}>
            <div className="card-title" style={{ fontSize: '0.75rem' }}>💰 THIS MONTH'S SPENDING</div>
            <div className="card-value" style={{ fontSize: '1.8rem' }}>
              ₹{monthlySpending}
            </div>
          </div>
        );
      case 'coding_this_week':
        return (
          <div className="card card-hover" style={{ padding: '16px' }}>
            <div className="card-title" style={{ fontSize: '0.75rem' }}>💻 CODING THIS WEEK</div>
            <div className="card-value" style={{ fontSize: '1.8rem' }}>
              {codingThisWeek}
            </div>
          </div>
        );
      case 'days_since_gym':
        return (
          <div className="card card-hover" style={{ padding: '16px' }}>
            <div className="card-title" style={{ fontSize: '0.75rem' }}>🏋️ DAYS SINCE GYM</div>
            <div className="card-value" style={{ fontSize: '1.8rem' }}>
              {daysSinceGym}
            </div>
          </div>
        );
      case 'current_streaks':
        return (
          <div className="card card-hover" style={{ padding: '16px' }}>
            <div className="card-title">🔥 CURRENT STREAKS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => navigate('/journal')}
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', background: 'var(--bg2)', textTransform: 'uppercase' }}
              >
                📖 {journalStreak} JOURNAL
              </button>
              <button
                onClick={() => navigate('/gym')}
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', background: 'var(--bg2)', textTransform: 'uppercase' }}
              >
                💪 {gymStreak} GYM
              </button>
              <button
                onClick={() => navigate('/tasks')}
                className="btn btn-ghost"
                style={{ justifyContent: 'flex-start', background: 'var(--bg2)', textTransform: 'uppercase' }}
              >
                ✅ {taskStreak} TASKS
              </button>
            </div>
          </div>
        );
      case 'top_priorities':
        return (
          <div className="card card-hover" style={{ padding: '16px', minWidth: 0, overflow: 'hidden' }}>
            <div className="card-title">🎯 TOP 3 PRIORITIES</div>
            {tasksDueToday.length === 0 ? (
              <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                No tasks due today 🎉
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
                {tasksDueToday.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    title={task.title}
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '100%'
                    }}
                  >
                    • {task.title}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'classes_today':
        return (
          <div className="card card-hover" style={{ padding: '16px' }}>
            <div className="card-title">🏫 CLASSES TODAY</div>
            {subjects.length === 0 ? (
              <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                No classes today
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {subjects.slice(0, 3).map(sub => (
                  <div key={sub.id} style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                    • {sub.name} ({sub.attended || 0}/{sub.total || 0})
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'upcoming_events':
        return (
          <div className="card card-hover" style={{ padding: '16px' }}>
            <div className="card-title">📅 UPCOMING EVENTS</div>
            {events.length === 0 ? (
              <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                No upcoming events
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {events.slice(0, 3).map(ev => (
                  <div key={ev.id} style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                    • {ev.title} ({ev.date})
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'todays_mood':
        return (
          <div className="card card-hover" style={{ padding: '16px' }}>
            <div className="card-title">😄 TODAY'S MOOD</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['😫', '😕', '😐', '🙂', '😄'].map(m => (
                <button
                  key={m}
                  type="button"
                  className={`mood-btn ${todayEntry && todayEntry.mood === m ? 'selected' : ''}`}
                  onClick={() => handleMoodSelect(m)}
                  style={{ padding: '8px', fontSize: '1.4rem' }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        );
      case 'quick_notes':
        return (
          <div className="card card-hover" style={{ padding: '16px' }}>
            <div className="card-title">📝 QUICK NOTES</div>
            <textarea
              className="form-textarea"
              placeholder="Jot something down..."
              value={quickNote}
              onChange={(e) => handleQuickNoteChange(e.target.value)}
              style={{ height: 'calc(100% - 32px)', minHeight: '80px', fontSize: '0.85rem', resize: 'none' }}
            />
          </div>
        );
      case 'focus_goal':
        return (
          <div className="card card-hover" style={{ padding: '16px' }}>
            <div className="card-title">🎯 FOCUS GOAL</div>
            {focusGoal ? (
              <div>
                <div style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {focusGoal.title}
                </div>
                <div className="flex flex-between align-center mb-4" style={{ fontSize: '0.75rem', fontWeight: 900 }}>
                  <span>PROGRESS</span>
                  <span>{focusGoal.progress || 0}%</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'var(--bg4)', border: 'var(--bw) solid var(--border)' }}>
                  <div style={{ width: `${focusGoal.progress || 0}%`, height: '100%', background: 'var(--yellow)' }} />
                </div>
              </div>
            ) : (
              <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                No active goals yet
              </p>
            )}
          </div>
        );
      case 'quote_of_the_day':
        return (
          <div className="card card-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div className="flex flex-between align-center mb-8" style={{ borderBottom: 'var(--bw) solid var(--border)', paddingBottom: '8px' }}>
              <div className="card-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>💬 QUOTE OF THE DAY</div>
              <button
                onClick={() => setQuoteIndex(prev => prev + 1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}
                title="Next quote"
              >
                🔄 NEXT
              </button>
            </div>
            <blockquote style={{ fontSize: '0.85rem', fontStyle: 'italic', fontWeight: 600, color: 'var(--text2)', flex: 1 }}>
              "{currentQuote.text}" — <strong style={{ color: 'var(--text)' }}>{currentQuote.author}</strong>
            </blockquote>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Header Greeting, Clock & Edit Toolbar */}
      <div className="flex flex-between align-center mb-24" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, textTransform: 'none', marginBottom: '4px' }}>
            {greeting}
          </h1>
          <p className="text-muted" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            {formattedDateTime}
          </p>
        </div>

        {/* Header Action Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
          {!isEditMode ? (
            <>
              {/* Presets ▾ Dropdown Button (ONLY visible outside Edit Mode) */}
              <div ref={presetsDropdownRef} style={{ position: 'relative' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setIsPresetsOpen(!isPresetsOpen)}
                  style={{
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    background: 'var(--bg2)',
                    border: 'var(--bw) solid var(--border)'
                  }}
                >
                  📂 {activePreset ? activePreset.name.toUpperCase() : 'DEFAULT'} ▾
                </button>

                {isPresetsOpen && (
                  <div className="presets-dropdown">
                    {presets.filter(p => p.id !== 'preset_default' && !p.isDefault).length < 10 ? (
                      <button
                        className="preset-save-btn"
                        onClick={handleCreateNewPreset}
                      >
                        + Create New Preset
                      </button>
                    ) : (
                      <div className="preset-limit-badge">
                        Preset limit reached (10/10) — delete one to create a new preset
                      </div>
                    )}

                    <div className="preset-divider" />

                    {presets.length === 0 ? (
                      <div style={{ padding: '8px 12px', fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600 }}>
                        No presets saved
                      </div>
                    ) : (
                      presets.map(preset => {
                        const isDefault = preset.id === 'preset_default' || preset.isDefault;
                        const isActive = preset.id === activePresetId;
                        return (
                          <div
                            key={preset.id}
                            className={`preset-item-row ${isActive ? 'active' : ''}`}
                            onClick={() => handleApplyPreset(preset)}
                          >
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                              {isActive ? `✓ ${preset.name}` : preset.name}
                            </span>
                            {!isDefault && (
                              <div className="preset-item-actions">
                                <button
                                  className="preset-icon-btn rename"
                                  onClick={(e) => handleOpenRenameModal(preset, e)}
                                  title="Rename Preset"
                                >
                                  <EditIcon size={14} />
                                </button>
                                <button
                                  className="preset-icon-btn delete"
                                  onClick={(e) => handleOpenDeleteConfirm(preset, e)}
                                  title="Delete Preset"
                                >
                                  <TrashIcon size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary"
                onClick={handleEnterEditMode}
                style={{
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  background: 'var(--accent)',
                  color: '#FFFFFF',
                  border: 'var(--bw) solid var(--border)'
                }}
              >
                ✏️ EDIT
              </button>
            </>
          ) : (
            <>
              {/* Add ▾ Dropdown Button */}
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setIsAddOpen(!isAddOpen)}
                  disabled={removedWidgets.length === 0}
                  style={{
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    background: 'var(--bg2)',
                    border: 'var(--bw) solid var(--border)',
                    opacity: removedWidgets.length === 0 ? 0.5 : 1,
                    cursor: removedWidgets.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  ➕ Add ▾
                </button>

                {isAddOpen && removedWidgets.length > 0 && (
                  <div className="add-widget-dropdown">
                    {removedWidgets.map(id => (
                      <button
                        key={id}
                        className="add-widget-item"
                        onClick={() => handleAddWidget(id)}
                      >
                        + {WIDGET_METADATA[id]?.name || id}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            {/* Default Layout Reset Button */}
            <button
              className="btn btn-ghost"
              onClick={handleResetDefault}
              title="Restore default layout"
              style={{
                fontWeight: 800,
                fontSize: '0.85rem',
                background: 'var(--bg2)',
                border: 'var(--bw) solid var(--border)'
              }}
            >
              🔄 Default
            </button>

            {/* Undo Button */}
            <button
              className="btn btn-ghost"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo"
              style={{
                fontWeight: 800,
                fontSize: '0.95rem',
                padding: '8px 12px',
                background: 'var(--bg2)',
                border: 'var(--bw) solid var(--border)',
                opacity: historyIndex <= 0 ? 0.5 : 1,
                cursor: historyIndex <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              ↩️
            </button>

            {/* Redo Button */}
            <button
              className="btn btn-ghost"
              onClick={handleRedo}
              disabled={historyIndex >= historyStack.length - 1}
              title="Redo"
              style={{
                fontWeight: 800,
                fontSize: '0.95rem',
                padding: '8px 12px',
                background: 'var(--bg2)',
                border: 'var(--bw) solid var(--border)',
                opacity: historyIndex >= historyStack.length - 1 ? 0.5 : 1,
                cursor: historyIndex >= historyStack.length - 1 ? 'not-allowed' : 'pointer'
              }}
            >
              ↪️
            </button>

            {/* Exit / Discard Button */}
            <button
              className="btn btn-ghost"
              onClick={handleCancelEditMode}
              title="Exit Edit Mode without saving"
              style={{
                fontWeight: 800,
                fontSize: '0.85rem',
                background: 'var(--bg2)',
                border: 'var(--bw) solid var(--border)'
              }}
            >
              ✕ Exit
            </button>

            {/* Done Button */}
            <button
              className="btn btn-primary"
              onClick={handleExitEditMode}
              style={{
                fontWeight: 900,
                fontSize: '0.85rem',
                background: 'var(--accent)',
                color: '#FFFFFF',
                border: 'var(--bw) solid var(--border)'
              }}
            >
              ✓ Done
            </button>
          </>
        )}
        </div>
      </div>

      {/* Duplicate Error Banner (Website UI Theme) */}
      {duplicateError && (
        <DuplicateErrorBanner
          title={duplicateError.title}
          message={duplicateError.message}
          onClose={() => setDuplicateError(null)}
        />
      )}

      {/* Main Grid Layout Container */}
      <GridWithWidth
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={75}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        isBounded={true}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragOrResizeStop}
        onResizeStop={handleDragOrResizeStop}
        resizeHandles={['se', 's', 'e']}
      >
        {layout.map(item => (
          <div
            key={item.i}
            className={`dashboard-widget-container ${isEditMode ? 'edit-mode-item' : ''}`}
          >
            {isEditMode && (
              <button
                className="widget-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveWidget(item.i);
                }}
                title="Remove Widget"
              >
                ×
              </button>
            )}
            {renderWidgetContent(item.i)}
          </div>
        ))}
      </GridWithWidth>

      {/* Floating Action Button (Hidden in Edit Mode) */}
      {!isEditMode && (
        <button className="fab-btn" onClick={() => navigate('/tasks')} title="Add Task">
          <PlusIcon size={24} />
        </button>
      )}

      {/* Save / Rename Preset Modal */}
      <Modal
        isOpen={presetModalOpen}
        onClose={() => {
          setPresetModalOpen(false);
          setIsCreatingPreset(false);
          setDuplicateError(null);
        }}
        title={presetModalMode === 'save' ? 'Save Current Layout as Preset' : 'Rename Preset'}
      >
        <form onSubmit={handleSaveOrRenamePresetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {duplicateError && (
            <DuplicateErrorBanner
              title={duplicateError.title}
              message={duplicateError.message}
              onClose={() => setDuplicateError(null)}
            />
          )}
          <div>
            <div className="flex flex-between align-center mb-4">
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, marginBottom: 0 }}>
                PRESET NAME
              </label>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: presetInputName.length >= 10 ? '#ef4444' : 'var(--text2)' }}>
                {presetInputName.length}/10
              </span>
            </div>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Work Mode"
              maxLength={10}
              value={presetInputName}
              onChange={(e) => {
                setPresetInputName(e.target.value);
                setPresetInputError('');
              }}
              autoFocus
            />
            {presetInputError && (
              <p style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, marginTop: '6px' }}>
                ⚠️ {presetInputError}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setPresetModalOpen(false);
                setIsCreatingPreset(false);
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: 'var(--accent)', color: '#FFFFFF', fontWeight: 900 }}
            >
              {presetModalMode === 'save' ? 'Save Preset' : 'Update Name'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Preset"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
            Are you sure you want to delete the preset <strong>"{presetToDelete?.name}"</strong>?
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text2)', fontWeight: 600 }}>
            This will remove the saved preset, but will not alter your current live layout.
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmDeletePreset}
              style={{ background: '#ef4444', color: '#fff', fontWeight: 900, borderColor: '#ef4444' }}
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;