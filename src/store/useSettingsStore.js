import { create } from 'zustand';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

const PRESET_THEMES = {
  paper: {
    name: '📄 Paper Neo-Brutalist (Default)',
    accent: '#2563EB',
    yellow: '#FACC15',
    bg: '#F4F4F0',
    bg2: '#FFFFFF',
    bg4: '#E9E8E3',
    text: '#0F0F0F',
    text2: '#4A4A4A',
    border: '#0F0F0F'
  },
  dark: {
    name: '🌑 Cyber Dark',
    accent: '#3B82F6',
    yellow: '#FACC15',
    bg: '#121214',
    bg2: '#1E1E22',
    bg4: '#27272A',
    text: '#F4F4F5',
    text2: '#A1A1AA',
    border: '#000000'
  },
  cobalt: {
    name: '🔵 Cobalt Blue',
    accent: '#1D4ED8',
    yellow: '#FACC15',
    bg: '#EFF6FF',
    bg2: '#FFFFFF',
    bg4: '#DBEAFE',
    text: '#0F172A',
    text2: '#334155',
    border: '#0F172A'
  },
  amber: {
    name: '🟡 Cyber Amber',
    accent: '#D97706',
    yellow: '#FACC15',
    bg: '#FEFCE8',
    bg2: '#FFFFFF',
    bg4: '#FEF08A',
    text: '#1C1917',
    text2: '#44403C',
    border: '#1C1917'
  },
  violet: {
    name: '🟣 Electric Violet',
    accent: '#7C3AED',
    yellow: '#FACC15',
    bg: '#F5F3FF',
    bg2: '#FFFFFF',
    bg4: '#DDD6FE',
    text: '#1E1B4B',
    text2: '#4338CA',
    border: '#1E1B4B'
  },
  emerald: {
    name: '🟢 Emerald Mint',
    accent: '#059669',
    yellow: '#FACC15',
    bg: '#ECFDF5',
    bg2: '#FFFFFF',
    bg4: '#A7F3D0',
    text: '#064E3B',
    text2: '#047857',
    border: '#064E3B'
  },
  crimson: {
    name: '🔴 Crimson Red',
    accent: '#DC2626',
    yellow: '#FACC15',
    bg: '#FEF2F2',
    bg2: '#FFFFFF',
    bg4: '#FECACA',
    text: '#450A0A',
    text2: '#7F1D1D',
    border: '#450A0A'
  }
};

const defaultState = {
  username: 'Aryan',
  creatorName: 'Aryan Kumar Gupta',
  linkedinUrl: 'https://www.linkedin.com/in/aryankumargupta04',
  themePreset: 'paper',
  accentColor: '#2563EB',
  customTheme: PRESET_THEMES.paper
};

export const useSettingsStore = create((set, get) => ({
  ...defaultState,

  initSettings: async () => {
    const user = useAuthStore.getState().user;
    const uid = user ? user.uid : 'guest';

    // 1. Instantly hydrate from local cache
    const saved = getLocalUserBackup('settings', uid, null);
    if (saved) {
      set(saved);
      get().applyThemeToDOM(saved.customTheme || PRESET_THEMES[saved.themePreset] || PRESET_THEMES.paper);
    } else {
      set(defaultState);
      get().applyThemeToDOM(PRESET_THEMES.paper);
    }

    // 2. Fetch from Firestore if user is logged in
    if (user && uid !== 'guest' && uid !== 'guest_user') {
      try {
        const settingsRef = doc(db, 'users', uid, 'settings', 'preferences');
        const docSnap = await getDoc(settingsRef);

        if (docSnap.exists()) {
          const firestoreSettings = docSnap.data();
          set(firestoreSettings);
          get().applyThemeToDOM(firestoreSettings.customTheme || PRESET_THEMES[firestoreSettings.themePreset] || PRESET_THEMES.paper);
          saveLocalUserBackup('settings', uid, firestoreSettings);
        }
      } catch (err) {
        console.error('Failed to fetch settings from Firestore:', err);
      }
    }
  },

  setUsername: (username) => {
    set({ username });
    get().saveSettings();
  },

  setLinkedinUrl: (linkedinUrl) => {
    set({ linkedinUrl });
    get().saveSettings();
  },

  setThemePreset: (presetKey) => {
    const theme = PRESET_THEMES[presetKey] || PRESET_THEMES.paper;
    set({ themePreset: presetKey, accentColor: theme.accent, customTheme: theme });
    get().applyThemeToDOM(theme);
    get().saveSettings();
  },

  setCustomAccentColor: (colorHex) => {
    const currentTheme = get().customTheme || PRESET_THEMES.paper;
    const updatedTheme = {
      ...currentTheme,
      accent: colorHex
    };
    set({ accentColor: colorHex, customTheme: updatedTheme, themePreset: 'custom' });
    get().applyThemeToDOM(updatedTheme);
    get().saveSettings();
  },

  applyThemeToDOM: (theme) => {
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty('--accent', theme.accent || '#2563EB');
    root.style.setProperty('--accent2', theme.accent || '#1D4ED8');
    root.style.setProperty('--yellow', theme.yellow || '#FACC15');
    root.style.setProperty('--bg', theme.bg || '#F4F4F0');
    root.style.setProperty('--bg2', theme.bg2 || '#FFFFFF');
    root.style.setProperty('--bg4', theme.bg4 || '#E9E8E3');
    root.style.setProperty('--text', theme.text || '#0F0F0F');
    root.style.setProperty('--text2', theme.text2 || '#4A4A4A');
    root.style.setProperty('--border', theme.border || '#0F0F0F');
  },

  saveSettings: async () => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const state = get();
      const payload = {
        username: state.username,
        creatorName: state.creatorName,
        linkedinUrl: state.linkedinUrl,
        themePreset: state.themePreset,
        accentColor: state.accentColor,
        customTheme: state.customTheme
      };

      // Always save to local storage
      saveLocalUserBackup('settings', uid, payload);

      // Sync to Firestore if logged in
      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const settingsRef = doc(db, 'users', uid, 'settings', 'preferences');
          await setDoc(settingsRef, payload, { merge: true });
        } catch (fbErr) {
          console.error('Failed to sync settings to Firestore:', fbErr);
        }
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  },

  resetStore: () => {
    set(defaultState);
    get().applyThemeToDOM(PRESET_THEMES.paper);
  }
}));
