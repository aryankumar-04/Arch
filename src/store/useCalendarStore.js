import { create } from 'zustand';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

export const useCalendarStore = create((set, get) => ({
  events: [],
  loading: false,

  fetchEvents: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const cached = getLocalUserBackup('calendar', uid, []);
      set({ events: cached });

      if (!user || uid === 'guest' || uid === 'guest_user') {
        set({ loading: false });
        return;
      }

      const colRef = collection(db, 'users', uid, 'calendar_events');
      const querySnapshot = await getDocs(colRef);

      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));

      set({ events: eventsData, loading: false });
      saveLocalUserBackup('calendar', uid, eventsData);
    } catch (error) {
      console.error("Firestore fetchEvents error:", error);
      set({ loading: false });
    }
  },

  addEvent: async (eventData) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newEvent = {
        title: eventData.title || 'Untitled Event',
        date: eventData.date || new Date().toISOString().split('T')[0],
        time: eventData.time || '12:00',
        type: eventData.type || 'Event',
        notes: eventData.notes || '',
        createdAt: new Date().toISOString()
      };

      let savedEvent = { id: `local_${Date.now()}`, ...newEvent };

      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'calendar_events'), newEvent);
          savedEvent = { id: docRef.id, ...newEvent };
        } catch (fbErr) {
          console.error("Firestore write failed:", fbErr);
        }
      }

      const updated = [...get().events, savedEvent].sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
      set({ events: updated });
      saveLocalUserBackup('calendar', uid, updated);
      return savedEvent;
    } catch (error) {
      console.error("Error adding calendar event:", error);
    }
  },

  updateEvent: async (id, updatedFields) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().events.map(e =>
        e.id === id ? { ...e, ...updatedFields } : e
      );
      set({ events: updated });
      saveLocalUserBackup('calendar', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        try {
          await updateDoc(doc(db, 'users', uid, 'calendar_events', id), updatedFields);
        } catch (fbErr) {
          console.error("Firestore update failed:", fbErr);
        }
      }
    } catch (error) {
      console.error("Error updating calendar event:", error);
    }
  },

  deleteEvent: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().events.filter(e => e.id !== id);
      set({ events: updated });
      saveLocalUserBackup('calendar', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        try {
          await deleteDoc(doc(db, 'users', uid, 'calendar_events', id));
        } catch (fbErr) {
          console.error("Firestore delete failed:", fbErr);
        }
      }
    } catch (error) {
      console.error("Error deleting calendar event:", error);
    }
  },

  resetStore: () => {
    set({ events: [], loading: false });
  }
}));
