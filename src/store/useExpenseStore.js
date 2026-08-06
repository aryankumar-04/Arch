import { create } from 'zustand';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';
import { calculateNextDueAndStatus } from '../utils/expenseUtils';

export const useExpenseStore = create((set, get) => ({
  expenses: [],
  recurringExpenses: [],
  savingsGoals: [],
  monthlyBudgetCap: 0,
  loading: false,

  fetchExpenses: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      // 1. Hydrate user-scoped local offline cache
      const cachedExpenses = getLocalUserBackup('expenses', uid, []);
      const cachedRecurring = getLocalUserBackup('recurring_expenses', uid, []);
      const cachedGoals = getLocalUserBackup('savings_goals', uid, []);
      const cachedCap = getLocalUserBackup('monthlyBudgetCap', uid, 0);

      set({
        expenses: cachedExpenses,
        recurringExpenses: cachedRecurring,
        savingsGoals: cachedGoals,
        monthlyBudgetCap: Number(cachedCap || 0)
      });

      if (!user || uid === 'guest' || uid === 'guest_user') {
        set({ loading: false });
        return;
      }

      // 2. Fetch Firestore collections
      const fetchCol = async (colName, storageKey) => {
        try {
          const colRef = collection(db, 'users', uid, colName);
          const snap = await getDocs(colRef);
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          saveLocalUserBackup(storageKey, uid, data);
          return data;
        } catch (err) {
          console.error(`Firestore fetch error for ${colName}:`, err);
          return [];
        }
      };

      const [expensesData, recurringData, goalsData] = await Promise.all([
        fetchCol('expenses', 'expenses'),
        fetchCol('recurring_expenses', 'recurring_expenses'),
        fetchCol('savings_goals', 'savings_goals')
      ]);

      // Sort expenses by createdAt descending
      expensesData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      try {
        const budgetRef = doc(db, 'users', uid, 'settings', 'budget');
        const budgetSnap = await getDoc(budgetRef);
        if (budgetSnap.exists() && budgetSnap.data().monthlyBudgetCap !== undefined) {
          const fetchedCap = Number(budgetSnap.data().monthlyBudgetCap || 0);
          set({ monthlyBudgetCap: fetchedCap });
          saveLocalUserBackup('monthlyBudgetCap', uid, fetchedCap);
        }
      } catch (bErr) {
        console.error("Firestore fetch budget cap error:", bErr);
      }

      set({
        expenses: expensesData,
        recurringExpenses: recurringData,
        savingsGoals: goalsData,
        loading: false
      });
    } catch (error) {
      console.error("Firestore fetchExpenses error:", error);
      set({ loading: false });
    }
  },

  setMonthlyBudgetCap: async (capValue) => {
    const numCap = Math.max(0, Number(capValue) || 0);
    set({ monthlyBudgetCap: numCap });

    const user = useAuthStore.getState().user;
    const uid = user ? user.uid : 'guest';
    saveLocalUserBackup('monthlyBudgetCap', uid, numCap);

    if (user && uid !== 'guest' && uid !== 'guest_user') {
      try {
        const budgetRef = doc(db, 'users', uid, 'settings', 'budget');
        await setDoc(budgetRef, { monthlyBudgetCap: numCap }, { merge: true });
      } catch (fbErr) {
        console.error("Firestore update budget cap failed:", fbErr);
      }
    }
  },

  // --- LOGGED EXPENSES CRUD ---
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

      if (!user || uid === 'guest' || uid === 'guest_user') {
        const localId = `local_${Date.now()}`;
        const savedExpense = { id: localId, ...newExpense };
        const current = get().expenses.filter(e => e.id !== localId);
        const updated = [savedExpense, ...current];
        set({ expenses: updated });
        saveLocalUserBackup('expenses', uid, updated);
        return savedExpense;
      }

      const tempId = `local_${Date.now()}`;
      const tempExpense = { id: tempId, ...newExpense };
      const currentExpenses = get().expenses.filter(e => e.id !== tempId);
      set({ expenses: [tempExpense, ...currentExpenses] });

      let savedExpense = tempExpense;
      try {
        const docRef = await addDoc(collection(db, 'users', uid, 'expenses'), newExpense);
        savedExpense = { id: docRef.id, ...newExpense };
      } catch (fbErr) {
        console.error("Firestore write failed:", fbErr);
      }

      const latestExpenses = get().expenses.filter(e => e.id !== tempId && e.id !== savedExpense.id);
      const reconciled = [savedExpense, ...latestExpenses].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      set({ expenses: reconciled });
      saveLocalUserBackup('expenses', uid, reconciled);
      return savedExpense;
    } catch (error) {
      console.error("Error adding expense:", error);
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

  // --- RECURRING EXPENSES CRUD WITH DUPLICATE PREVENTION & TOGGLE PAID ---
  addRecurringExpense: async (data) => {
    try {
      const cleanName = (data.name || '').trim();
      if (!cleanName) return { error: 'empty', message: 'Please enter a name for the fixed expense.' };

      // Duplicate Check (case-insensitive name check)
      const existing = get().recurringExpenses.find(r => r.name.trim().toLowerCase() === cleanName.toLowerCase());
      if (existing) {
        return {
          error: 'duplicate',
          message: `A fixed expense named "${cleanName}" already exists. Please use a unique name.`
        };
      }

      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newItem = {
        name: cleanName,
        amount: Number(data.amount || 0),
        frequency: data.frequency || 'Monthly',
        renewDate: data.renewDate || new Date().toISOString().split('T')[0],
        category: data.category || 'General',
        iconUrl: data.iconUrl || '',
        lastPaidDate: data.lastPaidDate || null,
        createdAt: new Date().toISOString()
      };

      let saved = { id: `local_rec_${Date.now()}`, ...newItem };

      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'recurring_expenses'), newItem);
          saved = { id: docRef.id, ...newItem };
        } catch (fbErr) {
          console.warn("Firestore addRecurringExpense failed, saving locally:", fbErr);
        }
      }

      const updated = [...get().recurringExpenses, saved];
      set({ recurringExpenses: updated });
      saveLocalUserBackup('recurring_expenses', uid, updated);
      return { success: true, item: saved };
    } catch (error) {
      console.error("Error adding recurring expense:", error);
      return { error: 'unknown', message: 'An error occurred while saving.' };
    }
  },

  updateRecurringExpense: async (id, updatedFields) => {
    try {
      if (updatedFields.name) {
        const cleanName = updatedFields.name.trim();
        const existing = get().recurringExpenses.find(r => r.id !== id && r.name.trim().toLowerCase() === cleanName.toLowerCase());
        if (existing) {
          return {
            error: 'duplicate',
            message: `A fixed expense named "${cleanName}" already exists. Please use a unique name.`
          };
        }
      }

      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().recurringExpenses.map(r =>
        r.id === id ? { ...r, ...updatedFields } : r
      );
      set({ recurringExpenses: updated });
      saveLocalUserBackup('recurring_expenses', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await updateDoc(doc(db, 'users', uid, 'recurring_expenses', id), updatedFields);
      }
      return { success: true };
    } catch (error) {
      console.error("Error updating recurring expense:", error);
      return { error: 'unknown', message: 'An error occurred while updating.' };
    }
  },

  toggleRecurringPaid: async (id) => {
    const item = get().recurringExpenses.find(r => r.id === id);
    if (!item) return;

    const dueInfo = calculateNextDueAndStatus(item);
    if (dueInfo.isPaid) {
      // Unmark paid
      await get().updateRecurringExpense(id, { lastPaidDate: null });
    } else {
      // Mark paid
      const todayStr = new Date().toISOString().split('T')[0];
      await get().updateRecurringExpense(id, { lastPaidDate: todayStr });
    }
  },

  deleteRecurringExpense: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().recurringExpenses.filter(r => r.id !== id);
      set({ recurringExpenses: updated });
      saveLocalUserBackup('recurring_expenses', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'users', uid, 'recurring_expenses', id));
      }
    } catch (error) {
      console.error("Error deleting recurring expense:", error);
    }
  },

  // --- SAVINGS GOALS CRUD ---
  addSavingsGoal: async (data) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newItem = {
        name: data.name || 'Savings Goal',
        targetAmount: Number(data.targetAmount || 0),
        savedAmount: Number(data.savedAmount || 0),
        iconUrl: data.iconUrl || '',
        contributions: data.contributions || [],
        createdAt: new Date().toISOString()
      };

      let saved = { id: `local_goal_${Date.now()}`, ...newItem };

      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'savings_goals'), newItem);
          saved = { id: docRef.id, ...newItem };
        } catch (fbErr) {
          console.warn("Firestore addSavingsGoal failed, saving locally:", fbErr);
        }
      }

      const updated = [...get().savingsGoals, saved];
      set({ savingsGoals: updated });
      saveLocalUserBackup('savings_goals', uid, updated);
      return saved;
    } catch (error) {
      console.error("Error adding savings goal:", error);
    }
  },

  updateSavingsGoal: async (id, updatedFields) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().savingsGoals.map(g =>
        g.id === id ? { ...g, ...updatedFields } : g
      );
      set({ savingsGoals: updated });
      saveLocalUserBackup('savings_goals', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await updateDoc(doc(db, 'users', uid, 'savings_goals', id), updatedFields);
      }
    } catch (error) {
      console.error("Error updating savings goal:", error);
    }
  },

  addToSavingsGoal: async (id, addAmount) => {
    const numAdd = Number(addAmount || 0);
    if (numAdd <= 0) return;

    const goal = get().savingsGoals.find(g => g.id === id);
    if (!goal) return;

    const newSaved = Number(goal.savedAmount || 0) + numAdd;
    const todayStr = new Date().toISOString().split('T')[0];
    const newContribution = { id: `contrib_${Date.now()}`, amount: numAdd, date: todayStr };

    const currentContribs = Array.isArray(goal.contributions) ? goal.contributions : [];
    const updatedContribs = [...currentContribs, newContribution];

    await get().updateSavingsGoal(id, {
      savedAmount: newSaved,
      contributions: updatedContribs
    });
  },

  deleteSavingsGoal: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().savingsGoals.filter(g => g.id !== id);
      set({ savingsGoals: updated });
      saveLocalUserBackup('savings_goals', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'users', uid, 'savings_goals', id));
      }
    } catch (error) {
      console.error("Error deleting savings goal:", error);
    }
  },

  resetStore: () => {
    set({ expenses: [], recurringExpenses: [], savingsGoals: [], monthlyBudgetCap: 0, loading: false });
  }
}));