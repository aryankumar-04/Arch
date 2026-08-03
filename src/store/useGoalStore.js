import { create } from 'zustand';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

const DEFAULT_CATEGORIES = ['Short Term', 'Long Term', 'Career', 'Health', 'Personal', 'Finance'];

export const useGoalStore = create((set, get) => ({
  goals: [],
  categories: DEFAULT_CATEGORIES,
  loading: false,
  lastFetched: null,

  fetchGoals: async (force = false) => {
    const now = Date.now();
    const { goals, lastFetched } = get();

    if (!force && goals.length > 0 && lastFetched && (now - lastFetched < 5 * 60 * 1000)) {
      return;
    }

    set({ loading: goals.length === 0 });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      // 1. Hydrate user-scoped offline cache
      const cachedGoals = getLocalUserBackup('goals', uid, []);
      const cachedCategories = getLocalUserBackup('goal_categories', uid, DEFAULT_CATEGORIES);
      if (goals.length === 0) {
        set({ goals: cachedGoals, categories: cachedCategories });
      }

      if (!user) {
        set({ loading: false, lastFetched: now });
        return;
      }

      // 2. Fetch primary truth from Firestore (user-scoped subcollection)
      const colRef = collection(db, 'users', uid, 'goals');
      const querySnapshot = await getDocs(colRef);
      const goalsData = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      set({ goals: goalsData, loading: false, lastFetched: now });
      saveLocalUserBackup('goals', uid, goalsData);
    } catch (error) {
      console.error('Error fetching goals from Firestore:', error);
      set({ loading: false });
    }
  },

  addCategory: (newCatName) => {
    if (!newCatName || !newCatName.trim()) return;
    const cleanCat = newCatName.trim();
    if (get().categories.includes(cleanCat)) return;

    const user = useAuthStore.getState().user;
    const uid = user ? user.uid : 'guest';

    const updatedCategories = [...get().categories, cleanCat];
    set({ categories: updatedCategories });
    saveLocalUserBackup('goal_categories', uid, updatedCategories);
  },

  deleteCategory: (categoryName) => {
    if (!categoryName) return;
    const cleanCat = categoryName.trim();

    // Check if category still has goals
    const goalsInCat = get().goals.filter(g =>
      (g.category || '').trim().toLowerCase() === cleanCat.toLowerCase()
    );

    if (goalsInCat.length > 0) {
      return {
        error: 'has_goals',
        title: '⚠️ CANNOT DELETE CATEGORY',
        message: `Move or delete all goals in '${cleanCat.toUpperCase()}' before removing this category.`
      };
    }

    const user = useAuthStore.getState().user;
    const uid = user ? user.uid : 'guest';

    const updatedCategories = get().categories.filter(c =>
      c.trim().toLowerCase() !== cleanCat.toLowerCase()
    );

    set({ categories: updatedCategories });
    saveLocalUserBackup('goal_categories', uid, updatedCategories);

    return { success: true };
  },

  addGoal: async (goalData) => {
    try {
      const cleanTitle = (goalData.title || '').trim();
      const category = (goalData.category || 'Short Term').trim();

      // Duplicate Check key: goal title (case-insensitive, trimmed) WITHIN the same category
      const existing = get().goals.find(g =>
        (g.title || '').trim().toLowerCase() === cleanTitle.toLowerCase() &&
        (g.category || '').trim().toLowerCase() === category.toLowerCase()
      );

      if (existing) {
        return {
          error: 'duplicate',
          title: '⚠️ GOAL ALREADY EXISTS IN THIS CATEGORY',
          message: `"${cleanTitle}" is already added under ${category}.`
        };
      }

      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const milestones = (goalData.milestones || []).map((m, idx) =>
        typeof m === 'string' ? { id: `m_${idx}_${Date.now()}`, title: m, completed: false } : m
      );

      if (!get().categories.includes(category)) {
        get().addCategory(category);
      }

      const newGoal = {
        title: cleanTitle || 'Untitled Goal',
        description: goalData.description || '',
        category: category,
        targetDate: goalData.targetDate || '',
        status: goalData.status || 'in_progress',
        progress: Number(goalData.progress || 0),
        milestones: milestones,
        createdAt: new Date().toISOString()
      };

      let savedGoal = { id: `local_${Date.now()}`, ...newGoal };

      if (user) {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'goals'), newGoal);
          savedGoal = { id: docRef.id, ...newGoal };
        } catch (fbErr) {
          console.warn('Firestore addGoal failed, storing locally:', fbErr);
        }
      }

      const updated = [savedGoal, ...get().goals];
      set({ goals: updated });
      saveLocalUserBackup('goals', uid, updated);
      return { success: true, goal: savedGoal };
    } catch (error) {
      console.error('Error adding goal:', error);
      return { error: 'system', message: error.message };
    }
  },

  updateGoal: async (id, updatedFields) => {
    try {
      const existingGoal = get().goals.find(g => g.id === id);
      if (!existingGoal) return { error: 'not_found' };

      const newTitle = updatedFields.title !== undefined ? (updatedFields.title || '').trim() : (existingGoal.title || '').trim();
      const newCat = updatedFields.category !== undefined ? (updatedFields.category || '').trim() : (existingGoal.category || '').trim();

      // Duplicate Check: if title or category changed/updated, check against OTHER goals in target category
      if (updatedFields.title !== undefined || updatedFields.category !== undefined) {
        const duplicate = get().goals.find(g =>
          g.id !== id &&
          (g.title || '').trim().toLowerCase() === newTitle.toLowerCase() &&
          (g.category || '').trim().toLowerCase() === newCat.toLowerCase()
        );

        if (duplicate) {
          return {
            error: 'duplicate',
            title: '⚠️ GOAL ALREADY EXISTS IN THIS CATEGORY',
            message: `"${newTitle}" is already added under ${newCat}.`
          };
        }
      }

      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().goals.map(g =>
        g.id === id ? { ...g, ...updatedFields } : g
      );
      set({ goals: updated });
      saveLocalUserBackup('goals', uid, updated);

      if (user && !id.startsWith('local_')) {
        const goalRef = doc(db, 'users', uid, 'goals', id);
        await updateDoc(goalRef, updatedFields);
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating goal:', error);
      return { error: 'system', message: error.message };
    }
  },

  toggleGoalStatus: async (id) => {
    const goal = get().goals.find(g => g.id === id);
    if (!goal) return;

    const newStatus = goal.status === 'completed' ? 'in_progress' : 'completed';
    const newProgress = newStatus === 'completed' ? 100 : (goal.progress === 100 ? 0 : goal.progress);
    await get().updateGoal(id, { status: newStatus, progress: newProgress });
  },

  toggleMilestone: async (goalId, milestoneId) => {
    const goal = get().goals.find(g => g.id === goalId);
    if (!goal || !goal.milestones) return;

    const updatedMilestones = goal.milestones.map(m =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const totalCount = updatedMilestones.length;
    const newProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : goal.progress;
    const newStatus = newProgress === 100 ? 'completed' : 'in_progress';

    await get().updateGoal(goalId, {
      milestones: updatedMilestones,
      progress: newProgress,
      status: newStatus
    });
  },

  deleteGoal: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().goals.filter(g => g.id !== id);
      set({ goals: updated });
      saveLocalUserBackup('goals', uid, updated);

      if (user && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'users', uid, 'goals', id));
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  },

  resetStore: () => {
    set({ goals: [], categories: DEFAULT_CATEGORIES, loading: false });
  }
}));
