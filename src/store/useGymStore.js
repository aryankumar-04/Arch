import { create } from 'zustand';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

export const useGymStore = create((set, get) => ({
  workouts: [],
  loading: false,

  fetchWorkouts: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const cached = getLocalUserBackup('gym', uid, []);
      set({ workouts: cached });

      if (!user || uid === 'guest' || uid === 'guest_user') {
        set({ loading: false });
        return;
      }

      const colRef = collection(db, 'users', uid, 'gym_workouts');
      const querySnapshot = await getDocs(colRef);
      const workoutsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => b.date.localeCompare(a.date));

      set({ workouts: workoutsData, loading: false });
      saveLocalUserBackup('gym', uid, workoutsData);
    } catch (error) {
      console.error("Firestore fetchWorkouts error:", error);
      set({ loading: false });
    }
  },

  addWorkout: async (workoutData) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newWorkout = {
        title: workoutData.title || workoutData.workoutType || 'Workout Session',
        date: workoutData.date || new Date().toISOString().split('T')[0],
        durationMinutes: Number(workoutData.durationMinutes || 45),
        muscleGroup: workoutData.muscleGroup || 'Full Body',
        exercises: workoutData.exercises || [],
        notes: workoutData.notes || '',
        createdAt: new Date().toISOString()
      };

      let savedWorkout = { id: `local_${Date.now()}`, ...newWorkout };

      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'gym_workouts'), newWorkout);
          savedWorkout = { id: docRef.id, ...newWorkout };
        } catch (fbErr) {
          console.error("Firestore write failed:", fbErr);
        }
      }

      const updated = [savedWorkout, ...get().workouts].sort((a, b) => b.date.localeCompare(a.date));
      set({ workouts: updated });
      saveLocalUserBackup('gym', uid, updated);
      return savedWorkout;
    } catch (error) {
      console.error("Error adding workout:", error);
    }
  },

  updateWorkout: async (id, updatedFields) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().workouts.map(w =>
        w.id === id ? { ...w, ...updatedFields } : w
      );
      set({ workouts: updated });
      saveLocalUserBackup('gym', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        try {
          await updateDoc(doc(db, 'users', uid, 'gym_workouts', id), updatedFields);
        } catch (fbErr) {
          console.error("Firestore update failed:", fbErr);
        }
      }
    } catch (error) {
      console.error("Error updating workout:", error);
    }
  },

  deleteWorkout: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().workouts.filter(w => w.id !== id);
      set({ workouts: updated });
      saveLocalUserBackup('gym', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        try {
          await deleteDoc(doc(db, 'users', uid, 'gym_workouts', id));
        } catch (fbErr) {
          console.error("Firestore delete failed:", fbErr);
        }
      }
    } catch (error) {
      console.error("Error deleting workout:", error);
    }
  },

  resetStore: () => {
    set({ workouts: [], loading: false });
  }
}));