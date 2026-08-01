import { create } from 'zustand';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

const getLocalYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useCollegeStore = create((set, get) => ({
  subjects: [],
  assignments: [],
  exams: [],
  projects: [],
  faculty: [],
  loading: false,

  fetchCollegeData: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      // 1. Hydrate user-scoped local cache first
      set({
        subjects: getLocalUserBackup('college_subjects', uid, []),
        assignments: getLocalUserBackup('college_assignments', uid, []),
        exams: getLocalUserBackup('college_exams', uid, []),
        projects: getLocalUserBackup('college_projects', uid, []),
        faculty: getLocalUserBackup('college_faculty', uid, [])
      });

      if (!user || uid === 'guest' || uid === 'guest_user') {
        set({ loading: false });
        return;
      }

      // 2. Fetch primary truth from Firestore
      const fetchCollection = async (colName, storageKey) => {
        const colRef = collection(db, 'users', uid, colName);
        const snap = await getDocs(colRef);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        saveLocalUserBackup(storageKey, uid, data);
        return data;
      };

      const [subData, assData, exmData, projData, facData] = await Promise.all([
        fetchCollection('college_subjects', 'college_subjects'),
        fetchCollection('college_assignments', 'college_assignments'),
        fetchCollection('college_exams', 'college_exams'),
        fetchCollection('college_projects', 'college_projects'),
        fetchCollection('college_faculty', 'college_faculty')
      ]);

      set({ 
        subjects: subData, 
        assignments: assData, 
        exams: exmData, 
        projects: projData, 
        faculty: facData, 
        loading: false 
      });
    } catch (error) {
      console.error("Error fetching college data from Firestore:", error);
      set({ loading: false });
    }
  },

  // --- SUBJECTS CRUD ---
  addSubject: async (subjectData) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newSubject = {
        ...subjectData,
        attended: Number(subjectData.attended || 0),
        total: Number(subjectData.total || 0),
        lastLog: null,
        createdAt: new Date().toISOString()
      };

      let saved = { id: `local_${Date.now()}`, ...newSubject };

      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'college_subjects'), newSubject);
          saved = { id: docRef.id, ...newSubject };
        } catch (fbErr) {
          console.warn('Firebase addSubject failed, storing locally:', fbErr);
        }
      }

      const updated = [...get().subjects, saved];
      set({ subjects: updated });
      saveLocalUserBackup('college_subjects', uid, updated);
      return saved;
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  },

  logAttendance: async (id, isPresent, count) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const subject = get().subjects.find(s => s.id === id);
      if (!subject) return;

      let newAttended = Number(subject.attended || 0);
      let newTotal = Number(subject.total || 0);
      const today = getLocalYMD();

      if (subject.lastLog && subject.lastLog.date === today) {
         if (subject.lastLog.isPresent) newAttended -= subject.lastLog.count;
         newTotal -= subject.lastLog.count;
      }

      if (isPresent) newAttended += count;
      newTotal += count;

      const updatedFields = {
        attended: Math.max(0, newAttended),
        total: Math.max(0, newTotal),
        lastLog: { date: today, isPresent, count }
      };

      const updated = get().subjects.map(s => s.id === id ? { ...s, ...updatedFields } : s);
      set({ subjects: updated });
      saveLocalUserBackup('college_subjects', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await updateDoc(doc(db, 'users', uid, 'college_subjects', id), updatedFields);
      }
    } catch (error) {
      console.error("Error logging attendance:", error);
    }
  },

  undoAttendance: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const subject = get().subjects.find(s => s.id === id);
      if (!subject || !subject.lastLog) return;

      let newAttended = Number(subject.attended || 0);
      let newTotal = Number(subject.total || 0);

      if (subject.lastLog.isPresent) newAttended -= subject.lastLog.count;
      newTotal -= subject.lastLog.count;

      const updatedFields = {
        attended: Math.max(0, newAttended),
        total: Math.max(0, newTotal),
        lastLog: null
      };

      const updated = get().subjects.map(s => s.id === id ? { ...s, ...updatedFields } : s);
      set({ subjects: updated });
      saveLocalUserBackup('college_subjects', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await updateDoc(doc(db, 'users', uid, 'college_subjects', id), updatedFields);
      }
    } catch (error) {
      console.error("Error undoing attendance:", error);
    }
  },

  deleteSubject: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().subjects.filter(s => s.id !== id);
      set({ subjects: updated });
      saveLocalUserBackup('college_subjects', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'users', uid, 'college_subjects', id));
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  },

  // --- ASSIGNMENTS CRUD ---
  addAssignment: async (data) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';
      
      const newItem = {
        ...data,
        completed: Boolean(data.completed),
        createdAt: new Date().toISOString()
      };
      
      let saved = { id: `local_${Date.now()}`, ...newItem };

      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'college_assignments'), newItem);
          saved = { id: docRef.id, ...newItem };
        } catch (fbErr) {
          console.warn('Firebase addAssignment failed, storing locally:', fbErr);
        }
      }

      const updated = [...get().assignments, saved];
      set({ assignments: updated });
      saveLocalUserBackup('college_assignments', uid, updated);
      return saved;
    } catch (error) {
      console.error("Error adding assignment:", error);
    }
  },

  toggleAssignment: async (id, currentStatus) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().assignments.map(a => a.id === id ? { ...a, completed: !currentStatus } : a);
      set({ assignments: updated });
      saveLocalUserBackup('college_assignments', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await updateDoc(doc(db, 'users', uid, 'college_assignments', id), { completed: !currentStatus });
      }
    } catch (error) {
      console.error("Error toggling assignment:", error);
    }
  },

  deleteAssignment: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().assignments.filter(a => a.id !== id);
      set({ assignments: updated });
      saveLocalUserBackup('college_assignments', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'users', uid, 'college_assignments', id));
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  },

  // --- EXAMS CRUD ---
  addExam: async (data) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';
      
      const newItem = {
        ...data,
        createdAt: new Date().toISOString()
      };
      
      let saved = { id: `local_${Date.now()}`, ...newItem };

      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'college_exams'), newItem);
          saved = { id: docRef.id, ...newItem };
        } catch (fbErr) {
          console.warn('Firebase addExam failed, storing locally:', fbErr);
        }
      }

      const updated = [...get().exams, saved];
      set({ exams: updated });
      saveLocalUserBackup('college_exams', uid, updated);
      return saved;
    } catch (error) {
      console.error("Error adding exam:", error);
    }
  },

  deleteExam: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().exams.filter(e => e.id !== id);
      set({ exams: updated });
      saveLocalUserBackup('college_exams', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'users', uid, 'college_exams', id));
      }
    } catch (error) {
      console.error("Error deleting exam:", error);
    }
  },

  // --- PROJECTS CRUD ---
  addProject: async (data) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';
      
      const newItem = {
        ...data,
        completed: Boolean(data.completed),
        createdAt: new Date().toISOString()
      };
      
      let saved = { id: `local_${Date.now()}`, ...newItem };

      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'college_projects'), newItem);
          saved = { id: docRef.id, ...newItem };
        } catch (fbErr) {
          console.warn('Firebase addProject failed, storing locally:', fbErr);
        }
      }

      const updated = [...get().projects, saved];
      set({ projects: updated });
      saveLocalUserBackup('college_projects', uid, updated);
      return saved;
    } catch (error) {
      console.error("Error adding project:", error);
    }
  },

  toggleProject: async (id, currentStatus) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().projects.map(p => p.id === id ? { ...p, completed: !currentStatus } : p);
      set({ projects: updated });
      saveLocalUserBackup('college_projects', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await updateDoc(doc(db, 'users', uid, 'college_projects', id), { completed: !currentStatus });
      }
    } catch (error) {
      console.error("Error toggling project:", error);
    }
  },

  deleteProject: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().projects.filter(p => p.id !== id);
      set({ projects: updated });
      saveLocalUserBackup('college_projects', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'users', uid, 'college_projects', id));
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  },

  // --- FACULTY CRUD ---
  addFaculty: async (data) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';
      
      const newItem = {
        ...data,
        createdAt: new Date().toISOString()
      };
      
      let saved = { id: `local_${Date.now()}`, ...newItem };

      if (user && uid !== 'guest' && uid !== 'guest_user') {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'college_faculty'), newItem);
          saved = { id: docRef.id, ...newItem };
        } catch (fbErr) {
          console.warn('Firebase addFaculty failed, storing locally:', fbErr);
        }
      }

      const updated = [...get().faculty, saved];
      set({ faculty: updated });
      saveLocalUserBackup('college_faculty', uid, updated);
      return saved;
    } catch (error) {
      console.error("Error adding faculty:", error);
    }
  },

  deleteFaculty: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().faculty.filter(f => f.id !== id);
      set({ faculty: updated });
      saveLocalUserBackup('college_faculty', uid, updated);

      if (user && uid !== 'guest' && uid !== 'guest_user' && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'users', uid, 'college_faculty', id));
      }
    } catch (error) {
      console.error("Error deleting faculty:", error);
    }
  },

  resetStore: () => {
    set({ subjects: [], assignments: [], exams: [], projects: [], faculty: [], loading: false });
  }
}));