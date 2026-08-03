import { create } from 'zustand';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  unsubscribe: null,

  fetchTasks: async () => {
    const user = useAuthStore.getState().user;
    const uid = user ? user.uid : 'guest';

    // 1. Instantly hydrate from user-scoped offline cache
    const cached = getLocalUserBackup('tasks', uid, []);
    set({ tasks: cached, loading: cached.length === 0 });

    if (!user || uid === 'guest' || uid === 'guest_user') {
      set({ loading: false });
      return;
    }

    if (get().unsubscribe) {
      get().unsubscribe();
    }

    try {
      const colRef = collection(db, 'users', uid, 'tasks');
      const unsub = onSnapshot(colRef, (snapshot) => {
        const tasksData = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        set({ tasks: tasksData, loading: false });
        saveLocalUserBackup('tasks', uid, tasksData);
      }, (error) => {
        console.error("Firestore onSnapshot tasks error:", error);
        set({ loading: false });
      });

      set({ unsubscribe: unsub });
    } catch (error) {
      console.error("Firestore fetchTasks error:", error);
      set({ loading: false });
    }
  },

  addTask: async (title, priority = 'medium') => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newTask = {
        title: title ? title.trim() : 'Untitled Task',
        status: 'todo',
        priority: priority,
        createdAt: new Date().toISOString()
      };

      // Unauthenticated / Guest fallback
      if (!user || uid === 'guest' || uid === 'guest_user') {
        const localId = `local_${Date.now()}`;
        const savedTask = { id: localId, ...newTask };
        const current = get().tasks.filter(t => t.id !== localId);
        const updated = [savedTask, ...current];
        set({ tasks: updated });
        saveLocalUserBackup('tasks', uid, updated);
        return savedTask;
      }

      // 1. Immediate optimistic UI addition with temp ID
      const tempId = `local_${Date.now()}`;
      const tempTask = { id: tempId, ...newTask };
      const currentTasks = get().tasks.filter(t => t.id !== tempId);
      set({ tasks: [tempTask, ...currentTasks] });

      // 2. Perform Firestore write
      let savedTask = tempTask;
      try {
        const docRef = await addDoc(collection(db, 'users', uid, 'tasks'), newTask);
        savedTask = { id: docRef.id, ...newTask };
      } catch (fbErr) {
        console.error("Firestore write failed:", fbErr);
      }

      // 3. Reconcile state: filter out tempId AND savedTask.id, then insert single clean instance
      const latestTasks = get().tasks.filter(t => t.id !== tempId && t.id !== savedTask.id);
      const reconciled = [savedTask, ...latestTasks].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      set({ tasks: reconciled });
      saveLocalUserBackup('tasks', uid, reconciled);
      return savedTask;
    } catch (error) {
      console.error("Error adding task:", error);
    }
  },

  toggleTaskStatus: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const task = get().tasks.find(t => t.id === id);
      if (!task) return;

      const isCompleting = task.status !== 'completed';
      const newStatus = isCompleting ? 'completed' : 'todo';
      const newCompletedAt = isCompleting ? new Date().toISOString() : null;

      const updatedTask = {
        ...task,
        status: newStatus,
        completedAt: newCompletedAt
      };

      const updated = get().tasks.map(t =>
        t.id === id ? updatedTask : t
      );

      set({ tasks: updated });
      saveLocalUserBackup('tasks', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        try {
          await updateDoc(doc(db, 'users', uid, 'tasks', id), {
            status: newStatus,
            completedAt: newCompletedAt
          });
        } catch (fbErr) {
          console.error("Firestore update failed:", fbErr);
        }
      }
    } catch (error) {
      console.error("Error toggling task status:", error);
    }
  },

  deleteTask: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().tasks.filter(task => task.id !== id);
      set({ tasks: updated });
      saveLocalUserBackup('tasks', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        try {
          await deleteDoc(doc(db, 'users', uid, 'tasks', id));
        } catch (fbErr) {
          console.error("Firestore delete failed:", fbErr);
        }
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  },

  resetStore: () => {
    set({ tasks: [], loading: false });
  }
}));