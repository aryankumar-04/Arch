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

  fetchGoals: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      // 1. Hydrate user-scoped offline cache
      const cachedGoals = getLocalUserBackup('goals', uid, []);
      const cachedCategories = getLocalUserBackup('goal_categories', uid, DEFAULT_CATEGORIES);
      set({ goals: cachedGoals, categories: cachedCategories });

      if (!user) {
        set({ loading: false });
        return;
      }

      // 2. Fetch primary truth from Firestore (user-scoped subcollection)
      const colRef = collection(db, 'users', uid, 'goals');
      const querySnapshot = await getDocs(colRef);
      const goalsData = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      set({ goals: goalsData, loading: false });
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

  addGoal: async (goalData) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const milestones = (goalData.milestones || []).map((m, idx) =>
        typeof m === 'string' ? { id: `m_${idx}_${Date.now()}`, title: m, completed: false } : m
      );

      const category = goalData.category || 'Short Term';
      if (!get().categories.includes(category)) {
        get().addCategory(category);
      }

      const newGoal = {
        title: goalData.title || 'Untitled Goal',
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
      return savedGoal;
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  },

  updateGoal: async (id, updatedFields) => {
    try {
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
    } catch (error) {
      console.error('Error updating goal:', error);
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
