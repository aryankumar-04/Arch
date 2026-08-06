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
          tagIds: [],
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

  addTask: async (title, priority = 'medium', tagIds = []) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newTask = {
        title: title ? title.trim() : 'Untitled Task',
        status: 'todo',
        priority: priority,
        tagIds: Array.isArray(tagIds) ? tagIds : [],
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

      // 3. Reconcile state
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

  updateTaskTags: async (taskId, newTagIds) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask = { ...task, tagIds: newTagIds };
      const updated = get().tasks.map(t => t.id === taskId ? updatedTask : t);

      set({ tasks: updated });
      saveLocalUserBackup('tasks', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !taskId.startsWith('local_')) {
        try {
          await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
            tagIds: newTagIds
          });
        } catch (fbErr) {
          console.error("Firestore updateTaskTags error:", fbErr);
        }
      }
    } catch (error) {
      console.error("Error updating task tags:", error);
    }
  },

  addTagToTask: async (taskId, tagId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    const currentTagIds = Array.isArray(task.tagIds) ? task.tagIds : [];
    if (currentTagIds.includes(tagId)) return;
    const newTagIds = [...currentTagIds, tagId];
    await get().updateTaskTags(taskId, newTagIds);
  },

  removeTagFromTask: async (taskId, tagId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    const currentTagIds = Array.isArray(task.tagIds) ? task.tagIds : [];
    const newTagIds = currentTagIds.filter(id => id !== tagId);
    await get().updateTaskTags(taskId, newTagIds);
  },

  removeTagFromAllTasks: async (tagId) => {
    const user = useAuthStore.getState().user;
    const uid = user ? user.uid : 'guest';

    const updatedTasks = get().tasks.map(t => {
      const currentIds = Array.isArray(t.tagIds) ? t.tagIds : [];
      if (currentIds.includes(tagId)) {
        const nextIds = currentIds.filter(id => id !== tagId);
        if (user && uid !== 'guest' && uid !== 'guest_user' && !t.id.startsWith('local_')) {
          updateDoc(doc(db, 'users', uid, 'tasks', t.id), { tagIds: nextIds }).catch(console.error);
        }
        return { ...t, tagIds: nextIds };
      }
      return t;
    });

    set({ tasks: updatedTasks });
    saveLocalUserBackup('tasks', uid, updatedTasks);
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