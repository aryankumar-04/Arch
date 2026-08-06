import { create } from 'zustand';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';
import { useTaskStore } from './useTaskStore';
import { useGoalStore } from './useGoalStore';

export const PRESET_TAGS = [
  { id: 'preset_urgent', label: 'Urgent', color: '#EF4444', type: 'preset', module: 'all' },
  { id: 'preset_important', label: 'Important', color: '#F59E0B', type: 'preset', module: 'all' },
  { id: 'preset_low_priority', label: 'Low Priority', color: '#FACC15', type: 'preset', module: 'all' }
];

export const useTagStore = create((set, get) => ({
  tags: [...PRESET_TAGS],
  loading: false,

  fetchTags: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const cachedCustomTags = getLocalUserBackup('tags', uid, []);
      const mergedLocal = [...PRESET_TAGS];

      cachedCustomTags.forEach(ct => {
        if (!mergedLocal.some(t => t.id === ct.id)) {
          mergedLocal.push({
            ...ct,
            module: ct.module || 'tasks'
          });
        }
      });

      set({ tags: mergedLocal });

      if (!user || uid === 'guest' || uid === 'guest_user') {
        set({ loading: false });
        return;
      }

      const colRef = collection(db, 'users', uid, 'tags');
      const querySnapshot = await getDocs(colRef);
      const customTagsData = querySnapshot.docs.map(d => ({
        id: d.id,
        module: 'tasks',
        ...d.data(),
        type: 'custom'
      }));

      const finalTags = [...PRESET_TAGS];
      customTagsData.forEach(ct => {
        if (!finalTags.some(t => t.id === ct.id)) {
          finalTags.push(ct);
        }
      });

      set({ tags: finalTags, loading: false });
      saveLocalUserBackup('tags', uid, customTagsData);
    } catch (error) {
      console.error("Firestore fetchTags error:", error);
      set({ loading: false });
    }
  },

  addCustomTag: async (label, color, module = 'tasks') => {
    // 18-Character Label Cap
    const cleanLabel = (label || '').trim().slice(0, 18);
    if (!cleanLabel) return null;

    const targetModule = module === 'goals' ? 'goals' : 'tasks';
    const user = useAuthStore.getState().user;
    const uid = user ? user.uid : 'guest';

    // Check if tag with same label already exists in this module or presets
    const existing = get().tags.find(t =>
      t.label.toLowerCase() === cleanLabel.toLowerCase() &&
      (t.type === 'preset' || t.module === 'all' || t.module === targetModule)
    );
    if (existing) {
      return existing;
    }

    const newTagData = {
      label: cleanLabel,
      color: color || '#3B82F6',
      type: 'custom',
      module: targetModule,
      createdAt: new Date().toISOString()
    };

    let savedTag = { id: `tag_${Date.now()}`, ...newTagData };

    if (user && uid !== 'guest' && uid !== 'guest_user') {
      try {
        const docRef = await addDoc(collection(db, 'users', uid, 'tags'), newTagData);
        savedTag = { id: docRef.id, ...newTagData };
      } catch (fbErr) {
        console.warn("Firestore addCustomTag failed, saving locally:", fbErr);
      }
    }

    const currentTags = get().tags;
    const updatedTags = [...currentTags, savedTag];
    set({ tags: updatedTags });

    const customOnly = updatedTags.filter(t => t.type === 'custom');
    saveLocalUserBackup('tags', uid, customOnly);

    return savedTag;
  },

  deleteCustomTag: async (tagId) => {
    const tag = get().tags.find(t => t.id === tagId);
    if (!tag || tag.type === 'preset') return;

    const user = useAuthStore.getState().user;
    const uid = user ? user.uid : 'guest';

    // 1. Remove tag from store state
    const updatedTags = get().tags.filter(t => t.id !== tagId);
    set({ tags: updatedTags });

    const customOnly = updatedTags.filter(t => t.type === 'custom');
    saveLocalUserBackup('tags', uid, customOnly);

    // 2. Remove tag doc from Firestore if user logged in
    if (user && uid !== 'guest' && uid !== 'guest_user' && !tagId.startsWith('tag_')) {
      try {
        await deleteDoc(doc(db, 'users', uid, 'tags', tagId));
      } catch (fbErr) {
        console.error("Firestore deleteCustomTag error:", fbErr);
      }
    }

    // 3. Batch cleanup: remove tagId from all tasks and goals
    try {
      useTaskStore.getState().removeTagFromAllTasks(tagId);
      useGoalStore.getState().removeTagFromAllGoals(tagId);
    } catch (cleanErr) {
      console.error("Error running tag cleanup across tasks & goals:", cleanErr);
    }
  }
}));
