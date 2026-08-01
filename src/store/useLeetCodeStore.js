import { create } from 'zustand';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';

export const useLeetCodeStore = create((set) => ({
  problems: [],
  loading: false,

  fetchProblems: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      if (!user) {
        set({ loading: false });
        return;
      }

      const colRef = collection(db, 'users', user.uid, 'leetcode');
      const querySnapshot = await getDocs(colRef);
      
      const problemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      
      set({ problems: problemsData, loading: false });
    } catch (error) {
      console.error("Error fetching LeetCode problems:", error);
      set({ loading: false });
    }
  },

  addProblem: async (problemData) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;

      const newProblem = {
        title: problemData.title || 'Untitled Problem',
        difficulty: problemData.difficulty || 'Medium',
        notes: problemData.notes || '',
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'leetcode'), newProblem);
      
      set((state) => ({ 
        problems: [{ id: docRef.id, ...newProblem }, ...state.problems]
      }));
    } catch (error) {
      console.error("Error adding problem:", error);
    }
  },

  deleteProblem: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      if (!user) return;

      await deleteDoc(doc(db, 'users', user.uid, 'leetcode', id));
      set((state) => ({
        problems: state.problems.filter(p => p.id !== id)
      }));
    } catch (error) {
      console.error("Error deleting problem:", error);
    }
  }
}));