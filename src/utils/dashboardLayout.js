import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getLocalUserBackup, saveLocalUserBackup } from './userStorage';

export const WIDGET_METADATA = {
  sleep_last_night: { name: 'Sleep Last Night', defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 3 },
  tasks_due_today: { name: 'Tasks Due Today', defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 3 },
  monthly_spending: { name: "This Month's Spending", defaultW: 3, defaultH: 2, minW: 1, minH: 1, maxW: 6, maxH: 3 },
  coding_this_week: { name: 'Coding This Week', defaultW: 2, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 3 },
  days_since_gym: { name: 'Days Since Gym', defaultW: 3, defaultH: 2, minW: 1, minH: 1, maxW: 4, maxH: 3 },
  current_streaks: { name: 'Current Streaks', defaultW: 2, defaultH: 3, minW: 1, minH: 1, maxW: 6, maxH: 5 },
  top_priorities: { name: 'Top 3 Priorities', defaultW: 3, defaultH: 3, minW: 1, minH: 1, maxW: 6, maxH: 5 },
  classes_today: { name: 'Classes Today', defaultW: 2, defaultH: 3, minW: 1, minH: 1, maxW: 6, maxH: 5 },
  upcoming_events: { name: 'Upcoming Events', defaultW: 3, defaultH: 3, minW: 1, minH: 1, maxW: 6, maxH: 5 },
  todays_mood: { name: "Today's Mood", defaultW: 2, defaultH: 3, minW: 1, minH: 1, maxW: 6, maxH: 4 },
  quick_notes: { name: 'Quick Notes', defaultW: 4, defaultH: 3, minW: 1, minH: 1, maxW: 12, maxH: 8 },
  focus_goal: { name: 'Focus Goal', defaultW: 4, defaultH: 3, minW: 1, minH: 1, maxW: 12, maxH: 5 },
  quote_of_the_day: { name: 'Quote of the Day', defaultW: 4, defaultH: 3, minW: 1, minH: 1, maxW: 12, maxH: 6 }
};

export const DEFAULT_LAYOUT = [
  { i: 'sleep_last_night', x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1, maxW: 4, maxH: 3 },
  { i: 'tasks_due_today', x: 2, y: 0, w: 2, h: 2, minW: 1, minH: 1, maxW: 4, maxH: 3 },
  { i: 'monthly_spending', x: 4, y: 0, w: 3, h: 2, minW: 1, minH: 1, maxW: 6, maxH: 3 },
  { i: 'coding_this_week', x: 7, y: 0, w: 2, h: 2, minW: 1, minH: 1, maxW: 4, maxH: 3 },
  { i: 'days_since_gym', x: 9, y: 0, w: 3, h: 2, minW: 1, minH: 1, maxW: 4, maxH: 3 },

  { i: 'current_streaks', x: 0, y: 2, w: 2, h: 3, minW: 1, minH: 1, maxW: 6, maxH: 5 },
  { i: 'top_priorities', x: 2, y: 2, w: 3, h: 3, minW: 1, minH: 1, maxW: 6, maxH: 5 },
  { i: 'classes_today', x: 5, y: 2, w: 2, h: 3, minW: 1, minH: 1, maxW: 6, maxH: 5 },
  { i: 'upcoming_events', x: 7, y: 2, w: 3, h: 3, minW: 1, minH: 1, maxW: 6, maxH: 5 },
  { i: 'todays_mood', x: 10, y: 2, w: 2, h: 3, minW: 1, minH: 1, maxW: 6, maxH: 4 },

  { i: 'quick_notes', x: 0, y: 5, w: 4, h: 3, minW: 1, minH: 1, maxW: 12, maxH: 8 },
  { i: 'focus_goal', x: 4, y: 5, w: 4, h: 3, minW: 1, minH: 1, maxW: 12, maxH: 5 },
  { i: 'quote_of_the_day', x: 8, y: 5, w: 4, h: 3, minW: 1, minH: 1, maxW: 12, maxH: 6 }
];

export const DEFAULT_PRESET = {
  id: 'preset_default',
  name: 'Default',
  isDefault: true,
  layout: DEFAULT_LAYOUT,
  removedWidgets: []
};

export const ensureDefaultPreset = (presets) => {
  const userPresets = (Array.isArray(presets) ? presets : []).filter(
    p => p.id !== 'preset_default' && p.name?.toLowerCase() !== 'default'
  );
  return [DEFAULT_PRESET, ...userPresets.slice(0, 10)];
};

export const areLayoutsIdentical = (layoutA = [], removedA = [], layoutB = [], removedB = []) => {
  const setRemA = new Set(removedA || []);
  const setRemB = new Set(removedB || []);
  if (setRemA.size !== setRemB.size) return false;
  for (let id of setRemA) {
    if (!setRemB.has(id)) return false;
  }

  const itemsA = Array.isArray(layoutA) ? layoutA : [];
  const itemsB = Array.isArray(layoutB) ? layoutB : [];
  if (itemsA.length !== itemsB.length) return false;

  const mapA = new Map(itemsA.map(item => [item.i, item]));
  const mapB = new Map(itemsB.map(item => [item.i, item]));

  if (mapA.size !== mapB.size) return false;

  for (let [id, itemA] of mapA) {
    const itemB = mapB.get(id);
    if (!itemB) return false;
    if (
      Number(itemA.x) !== Number(itemB.x) ||
      Number(itemA.y) !== Number(itemB.y) ||
      Number(itemA.w) !== Number(itemB.w) ||
      Number(itemA.h) !== Number(itemB.h)
    ) {
      return false;
    }
  }

  return true;
};

export const getCachedDashboardLayout = (uid) => {
  const cached = getLocalUserBackup('dashboard_layout', uid, null);
  if (cached && Array.isArray(cached.layout)) {
    return cached;
  }
  return { layout: DEFAULT_LAYOUT, removedWidgets: [] };
};

export const saveCachedDashboardLayout = (uid, layout, removedWidgets) => {
  saveLocalUserBackup('dashboard_layout', uid, { layout, removedWidgets });
};

export const fetchRemoteDashboardLayout = async (uid, isGoogleUser = false) => {
  if (!isGoogleUser || !uid || uid === 'guest' || uid === 'guest_user') return null;
  try {
    const docRef = doc(db, 'users', uid, 'dashboard', 'layout');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.error('Failed to fetch remote dashboard layout:', err);
  }
  return null;
};

export const sanitizeForFirestore = (obj) => {
  if (obj === undefined) return null;
  return JSON.parse(JSON.stringify(obj));
};

export const syncRemoteDashboardLayout = async (uid, layout, removedWidgets, isGoogleUser = false) => {
  if (!isGoogleUser || !uid || uid === 'guest' || uid === 'guest_user') return;
  try {
    const cleanLayout = sanitizeForFirestore(layout || []);
    const cleanRemovedWidgets = sanitizeForFirestore(removedWidgets || []);
    const docRef = doc(db, 'users', uid, 'dashboard', 'layout');
    await setDoc(docRef, {
      layout: cleanLayout,
      removedWidgets: cleanRemovedWidgets,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to sync remote dashboard layout to Firestore:', err);
  }
};

export const getCachedDashboardPresets = (uid) => {
  const cached = getLocalUserBackup('dashboard_presets', uid, []);
  return ensureDefaultPreset(cached);
};

export const getCachedActivePresetId = (uid) => {
  return getLocalUserBackup('active_preset_id', uid, 'preset_default');
};

export const saveCachedDashboardPresets = (uid, presets, activePresetId) => {
  const ensured = ensureDefaultPreset(presets);
  saveLocalUserBackup('dashboard_presets', uid, ensured);
  if (activePresetId !== undefined) {
    saveLocalUserBackup('active_preset_id', uid, activePresetId || 'preset_default');
  }
};

export const fetchRemoteDashboardPresets = async (uid, isGoogleUser = false) => {
  if (!isGoogleUser || !uid || uid === 'guest' || uid === 'guest_user') return null;
  try {
    const docRef = doc(db, 'users', uid, 'dashboard', 'presets');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        presets: ensureDefaultPreset(data.presets),
        activePresetId: data.activePresetId || 'preset_default'
      };
    }
  } catch (err) {
    console.error('Failed to fetch remote dashboard presets:', err);
  }
  return null;
};

export const syncRemoteDashboardPresets = async (uid, presets, activePresetId, isGoogleUser = false) => {
  if (!isGoogleUser || !uid || uid === 'guest' || uid === 'guest_user') return;
  try {
    const ensured = ensureDefaultPreset(presets);
    const cleanPresets = sanitizeForFirestore(ensured);
    const cleanActivePresetId = activePresetId || 'preset_default';
    const docRef = doc(db, 'users', uid, 'dashboard', 'presets');
    await setDoc(docRef, {
      presets: cleanPresets,
      activePresetId: cleanActivePresetId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to sync remote dashboard presets to Firestore:', err);
  }
};

