import { create } from 'zustand';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      // 1. Instantly hydrate from user-scoped offline cache
      const cached = getLocalUserBackup('tasks', uid, []);
      set({ tasks: cached });

      if (!user || uid === 'guest' || uid === 'guest_user') {
        set({ loading: false });
        return;
      }

      // 2. Fetch primary truth from Firestore (user-scoped subcollection)
      const colRef = collection(db, 'users', uid, 'tasks');
      const querySnapshot = await getDocs(colRef);

      const tasksData = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      set({ tasks: tasksData, loading: false });
      saveLocalUserBackup('tasks', uid, tasksData);
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

      let savedTask = { id: `local_${Date.now()}`, ...newTask };

      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'tasks'), newTask);
          savedTask = { id: docRef.id, ...newTask };
        } catch (fbErr) {
          console.error("Firestore write failed:", fbErr);
        }
      }

      const updated = [savedTask, ...get().tasks];
      set({ tasks: updated });
      saveLocalUserBackup('tasks', uid, updated);
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

      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      const updated = get().tasks.map(t =>
        t.id === id ? { ...t, status: newStatus } : t
      );

      set({ tasks: updated });
      saveLocalUserBackup('tasks', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        try {
          await updateDoc(doc(db, 'users', uid, 'tasks', id), { status: newStatus });
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