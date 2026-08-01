import { create } from 'zustand';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

export const useMovieStore = create((set, get) => ({
  movies: [],
  loading: false,

  fetchMovies: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      // 1. Hydrate from user-scoped local cache
      const cached = getLocalUserBackup('movies', uid, []);
      set({ movies: cached });

      if (!user) {
        set({ loading: false });
        return;
      }

      // 2. Fetch primary from Firestore (user-scoped subcollection)
      const colRef = collection(db, 'users', uid, 'movies');
      const querySnapshot = await getDocs(colRef);
      const moviesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      set({ movies: moviesData, loading: false });
      saveLocalUserBackup('movies', uid, moviesData);
    } catch (error) {
      console.error("Error fetching movies from Firestore:", error);
      set({ loading: false });
    }
  },

  addMovie: async (movieData) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newMovie = {
        title: movieData.title || 'Untitled Movie',
        year: movieData.year || '',
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

      let savedMovie = { id: `local_${Date.now()}`, ...newMovie };

      if (user) {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'movies'), newMovie);
          savedMovie = { id: docRef.id, ...newMovie };
        } catch (fbErr) {
          console.warn('Firestore addMovie failed, saving locally:', fbErr);
        }
      }

      const updated = [savedMovie, ...get().movies];
      set({ movies: updated });
      saveLocalUserBackup('movies', uid, updated);
      return savedMovie;
    } catch (error) {
      console.error("Error adding movie:", error);
    }
  },

  updateMovie: async (id, updatedFields) => {
    try {
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
    } catch (error) {
      console.error("Error updating movie:", error);
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
