import { create } from 'zustand';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

export const useJournalStore = create((set, get) => ({
  entries: [],
  loading: false,

  fetchEntries: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const cached = getLocalUserBackup('journal', uid, []);
      set({ entries: cached });

      if (!user || uid === 'guest' || uid === 'guest_user') {
        set({ loading: false });
        return;
      }

      const colRef = collection(db, 'users', uid, 'journal');
      const querySnapshot = await getDocs(colRef);
      const entriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => b.date.localeCompare(a.date));

      set({ entries: entriesData, loading: false });
      saveLocalUserBackup('journal', uid, entriesData);
    } catch (error) {
      console.error("Firestore fetchEntries error:", error);
      set({ loading: false });
    }
  },

  addEntry: async (date) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newEntry = {
        date,
        mood: '🙂',
        sleepTime: '23:00',
        wakeTime: '07:00',
        sleepHours: '8.0',
        sleepQuality: 'Restful',
        waterGlasses: 4,
        energyLevel: 3,
        productivityLevel: 3,
        habits: {
          meditation: false,
          workout: false,
          reading: false,
          healthyEating: false
        },
        gratitude: '',
        event: '',
        notes: '',
        createdAt: new Date().toISOString()
      };

      let savedEntry = { id: `local_${Date.now()}`, ...newEntry };

      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'journal'), newEntry);
          savedEntry = { id: docRef.id, ...newEntry };
        } catch (fbErr) {
          console.error("Firestore write failed:", fbErr);
        }
      }

      const updated = [savedEntry, ...get().entries].sort((a, b) => b.date.localeCompare(a.date));
      set({ entries: updated });
      saveLocalUserBackup('journal', uid, updated);
      return savedEntry;
    } catch (error) {
      console.error("Error adding journal entry:", error);
    }
  },

  updateEntry: async (id, updatedFields) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().entries.map(entry =>
        entry.id === id ? { ...entry, ...updatedFields } : entry
      );
      set({ entries: updated });
      saveLocalUserBackup('journal', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        try {
          await updateDoc(doc(db, 'users', uid, 'journal', id), updatedFields);
        } catch (fbErr) {
          console.error("Firestore update failed:", fbErr);
        }
      }
    } catch (error) {
      console.error("Error updating journal entry:", error);
    }
  },

  deleteEntry: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().entries.filter(entry => entry.id !== id);
      set({ entries: updated });
      saveLocalUserBackup('journal', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        try {
          await deleteDoc(doc(db, 'users', uid, 'journal', id));
        } catch (fbErr) {
          console.error("Firestore delete failed:", fbErr);
        }
      }
    } catch (error) {
      console.error("Error deleting journal entry:", error);
    }
  },

  resetStore: () => {
    set({ entries: [], loading: false });
  }
}));