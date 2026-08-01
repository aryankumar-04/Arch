import { create } from 'zustand';
import { onAuthStateChanged, signOut, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

import { useTaskStore } from './useTaskStore';
import { useJournalStore } from './useJournalStore';
import { useCalendarStore } from './useCalendarStore';
import { useCollegeStore } from './useCollegeStore';
import { useGymStore } from './useGymStore';
import { useExpenseStore } from './useExpenseStore';
import { useMovieStore } from './useMovieStore';
import { useWardrobeStore } from './useWardrobeStore';
import { useGoalStore } from './useGoalStore';
import { useCodingStore } from './useCodingStore';
import { useSettingsStore } from './useSettingsStore';
import { useOnboardingStore } from './useOnboardingStore';

export const clearAllStoresOnLogout = () => {
  useTaskStore.getState().resetStore?.();
  useJournalStore.getState().resetStore?.();
  useCalendarStore.getState().resetStore?.();
  useCollegeStore.getState().resetStore?.();
  useGymStore.getState().resetStore?.();
  useExpenseStore.getState().resetStore?.();
  useMovieStore.getState().resetStore?.();
  useWardrobeStore.getState().resetStore?.();
  useGoalStore.getState().resetStore?.();
  useCodingStore.getState().resetStore?.();
  useSettingsStore.getState().resetStore?.();
};

export const syncAllStoresForUser = (user) => {
  // Always clear stale memory from any previous session first
  clearAllStoresOnLogout();

  if (user) {
    // Trigger immediate parallel fetch for active user
    useTaskStore.getState().fetchTasks?.();
    useJournalStore.getState().fetchEntries?.();
    useCalendarStore.getState().fetchEvents?.();
    useCollegeStore.getState().fetchCollegeData?.();
    useGymStore.getState().fetchWorkouts?.();
    useExpenseStore.getState().fetchExpenses?.();
    useMovieStore.getState().fetchMovies?.();
    useWardrobeStore.getState().fetchWardrobe?.();
    useGoalStore.getState().fetchGoals?.();
    useCodingStore.getState().fetchCodingData?.();
    useSettingsStore.getState().initSettings?.();
    useOnboardingStore.getState().checkOnboardingStatus?.(user);
  }
};

export const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init: () => {
    onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
      syncAllStoresForUser(user);
    });
  },

  loginWithGoogle: async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res && res.user) {
        set({ user: res.user, loading: false });
        syncAllStoresForUser(res.user);
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, loading: false });
      clearAllStoresOnLogout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }
}));