import { create } from 'zustand';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

export const useMovieStore = create((set, get) => ({
  movies: [],
  loading: false,
  lastFetched: null,

  fetchMovies: async (force = false) => {
    const now = Date.now();
    const { movies, lastFetched } = get();

    // In-memory cache check (skip fetch if loaded within 5 mins unless forced)
    if (!force && movies.length > 0 && lastFetched && (now - lastFetched < 5 * 60 * 1000)) {
      return;
    }

    set({ loading: movies.length === 0 });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      // 1. Hydrate from user-scoped local cache
      const cached = getLocalUserBackup('movies', uid, []);
      if (movies.length === 0 && cached.length > 0) {
        set({ movies: cached });
      }

      if (!user) {
        set({ loading: false, lastFetched: now });
        return;
      }

      // 2. Fetch primary from Firestore (user-scoped subcollection)
      const colRef = collection(db, 'users', uid, 'movies');
      const querySnapshot = await getDocs(colRef);
      const moviesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      set({ movies: moviesData, loading: false, lastFetched: now });
      saveLocalUserBackup('movies', uid, moviesData);
    } catch (error) {
      console.error("Error fetching movies from Firestore:", error);
      set({ loading: false });
    }
  },

  addMovie: async (movieData) => {
    try {
      const cleanTitle = (movieData.title || '').trim();
      const cleanYear = String(movieData.year || '').trim();

      // Duplicate Check key: title (case-insensitive, trimmed) + year (trimmed)
      const existing = get().movies.find(m =>
        (m.title || '').trim().toLowerCase() === cleanTitle.toLowerCase() &&
        String(m.year || '').trim().toLowerCase() === cleanYear.toLowerCase()
      );

      if (existing) {
        return {
          error: 'duplicate',
          title: '⚠️ ALREADY IN YOUR LIST',
          message: `${cleanTitle.toUpperCase()}${cleanYear ? ` (${cleanYear})` : ''} is already added.`
        };
      }

      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newMovie = {
        title: cleanTitle || 'Untitled Movie',
        year: cleanYear,
        genre: movieData.genre || '',
        director: movieData.director || '',
        plot: movieData.plot || '',
        imdbRating: movieData.imdbRating || '7.5',
        userRating: Number(movieData.userRating || 0),
        status: movieData.status || 'watchlist',
        poster: movieData.poster || null,
        imdbID: movieData.imdbID || null,
        createdAt: new Date().toISOString()
      };

      const tempId = `local_${Date.now()}`;
      const savedMovie = { id: tempId, ...newMovie };

      // 1. Optimistic UI update
      const updated = [savedMovie, ...get().movies];
      set({ movies: updated });
      saveLocalUserBackup('movies', uid, updated);

      // 2. Background Firestore write
      if (user) {
        addDoc(collection(db, 'users', uid, 'movies'), newMovie).then((docRef) => {
          // Replace tempId with actual Firestore ID
          const currentMovies = get().movies;
          const mapped = currentMovies.map(m => m.id === tempId ? { ...m, id: docRef.id } : m);
          set({ movies: mapped });
          saveLocalUserBackup('movies', uid, mapped);
        }).catch((fbErr) => {
          console.warn('Firestore addMovie background sync failed:', fbErr);
        });
      }

      return { success: true, movie: savedMovie };
    } catch (error) {
      console.error("Error adding movie:", error);
      return { error: 'system', message: error.message };
    }
  },

  updateMovie: async (id, updatedFields) => {
    try {
      const existingMovie = get().movies.find(m => m.id === id);
      if (!existingMovie) return { error: 'not_found' };

      const newTitle = updatedFields.title !== undefined ? (updatedFields.title || '').trim() : (existingMovie.title || '').trim();
      const newYear = updatedFields.year !== undefined ? String(updatedFields.year || '').trim() : String(existingMovie.year || '').trim();

      // Duplicate Check: if title or year changed/updated, check against OTHER movies
      if (updatedFields.title !== undefined || updatedFields.year !== undefined) {
        const duplicate = get().movies.find(m =>
          m.id !== id &&
          (m.title || '').trim().toLowerCase() === newTitle.toLowerCase() &&
          String(m.year || '').trim().toLowerCase() === newYear.toLowerCase()
        );

        if (duplicate) {
          return {
            error: 'duplicate',
            title: '⚠️ ALREADY IN YOUR LIST',
            message: `${newTitle.toUpperCase()}${newYear ? ` (${newYear})` : ''} is already added.`
          };
        }
      }

      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().movies.map(movie =>
        movie.id === id ? { ...movie, ...updatedFields } : movie
      );
      set({ movies: updated });
      saveLocalUserBackup('movies', uid, updated);

      if (user && !id.startsWith('local_')) {
        const movieRef = doc(db, 'users', uid, 'movies', id);
        await updateDoc(movieRef, updatedFields);
      }
      return { success: true };
    } catch (error) {
      console.error("Error updating movie:", error);
      return { error: 'system', message: error.message };
    }
  },

  toggleStatus: async (id) => {
    const movie = get().movies.find(m => m.id === id);
    if (!movie) return;

    const newStatus = movie.status === 'watched' ? 'watchlist' : 'watched';
    await get().updateMovie(id, { status: newStatus });
  },

  setUserRating: async (id, rating) => {
    await get().updateMovie(id, { userRating: rating });
  },

  deleteMovie: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().movies.filter(movie => movie.id !== id);
      set({ movies: updated });
      saveLocalUserBackup('movies', uid, updated);

      if (user && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'users', uid, 'movies', id));
      }
    } catch (error) {
      console.error("Error deleting movie:", error);
    }
  },

  resetStore: () => {
    set({ movies: [], loading: false });
  }
}));
