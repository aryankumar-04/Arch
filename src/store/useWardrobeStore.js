import { create } from 'zustand';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

export const useWardrobeStore = create((set, get) => ({
  items: [],
  outfits: [],
  loading: false,
  lastFetched: null,

  fetchWardrobe: async (force = false) => {
    const now = Date.now();
    const { items, lastFetched } = get();

    if (!force && items.length > 0 && lastFetched && (now - lastFetched < 5 * 60 * 1000)) {
      return;
    }

    set({ loading: items.length === 0 });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      // 1. Hydrate user-scoped offline cache
      const cachedItems = getLocalUserBackup('wardrobe_items', uid, []);
      const cachedOutfits = getLocalUserBackup('wardrobe_outfits', uid, []);
      if (items.length === 0) {
        set({ items: cachedItems, outfits: cachedOutfits });
      }

      if (!user) {
        set({ loading: false, lastFetched: now });
        return;
      }

      // 2. Fetch primary truth from Firestore (user-scoped subcollections)
      const itemsColRef = collection(db, 'users', uid, 'wardrobe_items');
      const itemsSnapshot = await getDocs(itemsColRef);
      const itemsData = itemsSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      const outfitsColRef = collection(db, 'users', uid, 'wardrobe_outfits');
      const outfitsSnapshot = await getDocs(outfitsColRef);
      const outfitsData = outfitsSnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      set({ items: itemsData, outfits: outfitsData, loading: false, lastFetched: now });
      saveLocalUserBackup('wardrobe_items', uid, itemsData);
      saveLocalUserBackup('wardrobe_outfits', uid, outfitsData);
    } catch (error) {
      console.error('Error fetching wardrobe from Firestore:', error);
      set({ loading: false });
    }
  },

  addItem: async (itemData) => {
    try {
      const cleanName = (itemData.name || '').trim();
      const cleanType = (itemData.type || 'Tops').trim();

      // Duplicate Check key: item name (case-insensitive, trimmed) + type/category
      const existing = get().items.find(i =>
        (i.name || '').trim().toLowerCase() === cleanName.toLowerCase() &&
        (i.type || '').trim().toLowerCase() === cleanType.toLowerCase()
      );

      if (existing) {
        return {
          error: 'duplicate',
          title: '⚠️ ITEM ALREADY EXISTS',
          message: `"${cleanName}" (${cleanType}) is already in your wardrobe.`
        };
      }

      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newItem = {
        name: cleanName || 'Unnamed Item',
        type: cleanType,
        season: itemData.season || 'All Seasons',
        color: itemData.color || '#2563EB',
        imageUrl: itemData.imageUrl || '',
        isFavorite: Boolean(itemData.isFavorite),
        wearCount: Number(itemData.wearCount || 0),
        notes: itemData.notes || '',
        createdAt: new Date().toISOString()
      };

      let savedItem = { id: `local_${Date.now()}`, ...newItem };

      if (user) {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'wardrobe_items'), newItem);
          savedItem = { id: docRef.id, ...newItem };
        } catch (fbErr) {
          console.warn('Firestore addItem failed, storing locally:', fbErr);
        }
      }

      const updated = [savedItem, ...get().items];
      set({ items: updated });
      saveLocalUserBackup('wardrobe_items', uid, updated);
      return { success: true, item: savedItem };
    } catch (error) {
      console.error('Error adding wardrobe item:', error);
      return { error: 'system', message: error.message };
    }
  },

  updateItem: async (id, updatedFields) => {
    try {
      const existingItem = get().items.find(i => i.id === id);
      if (!existingItem) return { error: 'not_found' };

      const newName = updatedFields.name !== undefined ? (updatedFields.name || '').trim() : (existingItem.name || '').trim();
      const newType = updatedFields.type !== undefined ? (updatedFields.type || '').trim() : (existingItem.type || '').trim();

      // Duplicate Check: if name or type changed/updated, check against OTHER items
      if (updatedFields.name !== undefined || updatedFields.type !== undefined) {
        const duplicate = get().items.find(i =>
          i.id !== id &&
          (i.name || '').trim().toLowerCase() === newName.toLowerCase() &&
          (i.type || '').trim().toLowerCase() === newType.toLowerCase()
        );

        if (duplicate) {
          return {
            error: 'duplicate',
            title: '⚠️ ITEM ALREADY EXISTS',
            message: `"${newName}" (${newType}) is already in your wardrobe.`
          };
        }
      }

      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().items.map(item =>
        item.id === id ? { ...item, ...updatedFields } : item
      );
      set({ items: updated });
      saveLocalUserBackup('wardrobe_items', uid, updated);

      if (user && !id.startsWith('local_')) {
        const itemRef = doc(db, 'users', uid, 'wardrobe_items', id);
        await updateDoc(itemRef, updatedFields);
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating wardrobe item:', error);
      return { error: 'system', message: error.message };
    }
  },

  incrementWear: async (id) => {
    const item = get().items.find(i => i.id === id);
    if (!item) return;
    const newWearCount = (item.wearCount || 0) + 1;
    await get().updateItem(id, { wearCount: newWearCount });
  },

  toggleFavorite: async (id) => {
    const item = get().items.find(i => i.id === id);
    if (!item) return;
    await get().updateItem(id, { isFavorite: !item.isFavorite });
  },

  deleteItem: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().items.filter(item => item.id !== id);
      set({ items: updated });
      saveLocalUserBackup('wardrobe_items', uid, updated);

      if (user && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'users', uid, 'wardrobe_items', id));
      }
    } catch (error) {
      console.error('Error deleting wardrobe item:', error);
    }
  },

  addOutfit: async (outfitData) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newOutfit = {
        name: outfitData.name || 'Unnamed Outfit',
        occasion: outfitData.occasion || 'Casual',
        season: outfitData.season || 'All Seasons',
        topId: outfitData.topId || '',
        bottomId: outfitData.bottomId || '',
        shoesId: outfitData.shoesId || '',
        outerwearId: outfitData.outerwearId || '',
        accessoryId: outfitData.accessoryId || '',
        wearCount: Number(outfitData.wearCount || 0),
        notes: outfitData.notes || '',
        createdAt: new Date().toISOString()
      };

      let savedOutfit = { id: `local_outfit_${Date.now()}`, ...newOutfit };

      if (user) {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'wardrobe_outfits'), newOutfit);
          savedOutfit = { id: docRef.id, ...newOutfit };
        } catch (fbErr) {
          console.warn('Firestore addOutfit failed, storing locally:', fbErr);
        }
      }

      const updated = [savedOutfit, ...get().outfits];
      set({ outfits: updated });
      saveLocalUserBackup('wardrobe_outfits', uid, updated);
      return savedOutfit;
    } catch (error) {
      console.error('Error adding outfit:', error);
    }
  },

  wearOutfit: async (outfitId) => {
    const user = useAuthStore.getState().user;
    const uid = user ? user.uid : 'guest';

    const outfit = get().outfits.find(o => o.id === outfitId);
    if (!outfit) return;

    const updatedOutfits = get().outfits.map(o =>
      o.id === outfitId ? { ...o, wearCount: (o.wearCount || 0) + 1 } : o
    );
    set({ outfits: updatedOutfits });
    saveLocalUserBackup('wardrobe_outfits', uid, updatedOutfits);

    if (user && !outfitId.startsWith('local_')) {
      try {
        const outfitRef = doc(db, 'users', uid, 'wardrobe_outfits', outfitId);
        await updateDoc(outfitRef, { wearCount: (outfit.wearCount || 0) + 1 });
      } catch (err) {
        console.error('Error updating outfit wear count:', err);
      }
    }

    const itemIds = [outfit.topId, outfit.bottomId, outfit.shoesId, outfit.outerwearId, outfit.accessoryId].filter(Boolean);
    for (const itemId of itemIds) {
      await get().incrementWear(itemId);
    }
  },

  deleteOutfit: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().outfits.filter(o => o.id !== id);
      set({ outfits: updated });
      saveLocalUserBackup('wardrobe_outfits', uid, updated);

      if (user && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'users', uid, 'wardrobe_outfits', id));
      }
    } catch (error) {
      console.error('Error deleting outfit:', error);
    }
  },

  resetStore: () => {
    set({ items: [], outfits: [], loading: false });
  }
}));
