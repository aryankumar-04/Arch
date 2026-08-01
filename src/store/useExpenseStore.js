import { create } from 'zustand';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

export const useExpenseStore = create((set, get) => ({
  expenses: [],
  loading: false,

  fetchExpenses: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const cached = getLocalUserBackup('expenses', uid, []);
      set({ expenses: cached });

      if (!user || uid === 'guest' || uid === 'guest_user') {
        set({ loading: false });
        return;
      }

      const colRef = collection(db, 'users', uid, 'expenses');
      const querySnapshot = await getDocs(colRef);
      const expensesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      set({ expenses: expensesData, loading: false });
      saveLocalUserBackup('expenses', uid, expensesData);
    } catch (error) {
      console.error("Firestore fetchExpenses error:", error);
      set({ loading: false });
    }
  },

  addExpense: async (expenseData) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newExpense = {
        title: expenseData.title || expenseData.description || 'Expense',
        amount: Number(expenseData.amount || 0),
        category: expenseData.category || 'General',
        type: expenseData.type || 'expense',
        date: expenseData.date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };

      let savedExpense = { id: `local_${Date.now()}`, ...newExpense };

      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'expenses'), newExpense);
          savedExpense = { id: docRef.id, ...newExpense };
        } catch (fbErr) {
          console.error("Firestore write failed:", fbErr);
        }
      }

      const updated = [savedExpense, ...get().expenses];
      set({ expenses: updated });
      saveLocalUserBackup('expenses', uid, updated);
      return savedExpense;
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  },

  updateExpense: async (id, updatedFields) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().expenses.map(e =>
        e.id === id ? { ...e, ...updatedFields } : e
      );
      set({ expenses: updated });
      saveLocalUserBackup('expenses', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        try {
          await updateDoc(doc(db, 'users', uid, 'expenses', id), updatedFields);
        } catch (fbErr) {
          console.error("Firestore update failed:", fbErr);
        }
      }
    } catch (error) {
      console.error("Error updating expense:", error);
    }
  },

  deleteExpense: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().expenses.filter(e => e.id !== id);
      set({ expenses: updated });
      saveLocalUserBackup('expenses', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        try {
          await deleteDoc(doc(db, 'users', uid, 'expenses', id));
        } catch (fbErr) {
          console.error("Firestore delete failed:", fbErr);
        }
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  },

  resetStore: () => {
    set({ expenses: [], loading: false });
  }
}));