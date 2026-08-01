import { create } from 'zustand';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './useAuthStore';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';

const DEFAULT_HANDLES = {
  github: '',
  leetcode: '',
  hackerrank: '',
  codeforces: ''
};

export const useCodingStore = create((set, get) => ({
  problems: [],
  handles: DEFAULT_HANDLES,
  profileStats: {
    github: null,
    githubRepos: [],
    leetcode: null,
    codeforces: null
  },
  loading: false,

  fetchCodingData: async () => {
    set({ loading: true });
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      // 1. Hydrate user-scoped offline cache
      const cachedProblems = getLocalUserBackup('coding_problems', uid, []);
      const cachedHandles = getLocalUserBackup('coding_handles', uid, DEFAULT_HANDLES);
      set({ problems: cachedProblems, handles: cachedHandles });

      if (!user) {
        set({ loading: false });
        get().refreshPlatformStats();
        return;
      }

      // 2. Fetch primary truth from Firestore (user-scoped subcollection)
      const colRef = collection(db, 'users', uid, 'coding_problems');
      const querySnapshot = await getDocs(colRef);
      const problemsData = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      set({ problems: problemsData, loading: false });
      saveLocalUserBackup('coding_problems', uid, problemsData);
    } catch (err) {
      console.error('Error fetching coding problems from Firestore:', err);
      set({ loading: false });
    }

    get().refreshPlatformStats();
  },

  updateHandles: (newHandles) => {
    const user = useAuthStore.getState().user;
    const uid = user ? user.uid : 'guest';

    const updated = { ...get().handles, ...newHandles };
    set({ handles: updated });
    saveLocalUserBackup('coding_handles', uid, updated);
    get().refreshPlatformStats();
  },

  refreshPlatformStats: async () => {
    const { github, leetcode, codeforces } = get().handles;
    const stats = { ...get().profileStats };

    if (github && github.trim()) {
      try {
        const res = await fetch(`https://api.github.com/users/${github.trim()}`);
        if (res.ok) {
          const data = await res.json();
          stats.github = {
            publicRepos: data.public_repos || 0,
            followers: data.followers || 0,
            following: data.following || 0,
            avatar: data.avatar_url,
            name: data.name || data.login,
            bio: data.bio || '',
            url: data.html_url
          };
        }

        const reposRes = await fetch(`https://api.github.com/users/${github.trim()}/repos?sort=updated&per_page=6`);
        if (reposRes.ok) {
          const reposData = await reposRes.json();
          if (Array.isArray(reposData)) {
            stats.githubRepos = reposData.map(r => ({
              name: r.name,
              description: r.description || 'No description provided.',
              stars: r.stargazers_count,
              language: r.language || 'Code',
              url: r.html_url
            }));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch GitHub stats:', err);
      }
    }

    if (leetcode && leetcode.trim()) {
      try {
        const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${leetcode.trim()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success') {
            stats.leetcode = {
              totalSolved: data.totalSolved || 0,
              easySolved: data.easySolved || 0,
              mediumSolved: data.mediumSolved || 0,
              hardSolved: data.hardSolved || 0,
              acceptanceRate: data.acceptanceRate || 0,
              ranking: data.ranking || 0
            };
          }
        }
      } catch (err) {
        console.warn('Failed to fetch LeetCode stats:', err);
      }
    }

    if (codeforces && codeforces.trim()) {
      try {
        const res = await fetch(`https://codeforces.com/api/user.info?handles=${codeforces.trim()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'OK' && data.result.length > 0) {
            const cfUser = data.result[0];
            stats.codeforces = {
              rating: cfUser.rating || 0,
              maxRating: cfUser.maxRating || 0,
              rank: cfUser.rank || 'Unrated',
              avatar: cfUser.titlePhoto
            };
          }
        }
      } catch (err) {
        console.warn('Failed to fetch Codeforces stats:', err);
      }
    }

    set({ profileStats: stats });
  },

  addProblem: async (problemData) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const newProblem = {
        title: problemData.title || 'Untitled Problem',
        platform: problemData.platform || 'LeetCode',
        difficulty: problemData.difficulty || 'Medium',
        notes: problemData.notes || '',
        createdAt: new Date().toISOString()
      };

      let saved = { id: `local_${Date.now()}`, ...newProblem };

      if (user) {
        try {
          const docRef = await addDoc(collection(db, 'users', uid, 'coding_problems'), newProblem);
          saved = { id: docRef.id, ...newProblem };
        } catch (fbErr) {
          console.warn('Firestore addProblem failed, storing locally:', fbErr);
        }
      }

      const updated = [saved, ...get().problems];
      set({ problems: updated });
      saveLocalUserBackup('coding_problems', uid, updated);
      return saved;
    } catch (err) {
      console.error('Error adding coding problem:', err);
    }
  },

  deleteProblem: async (id) => {
    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const updated = get().problems.filter(p => p.id !== id);
      set({ problems: updated });
      saveLocalUserBackup('coding_problems', uid, updated);

      if (user && !id.startsWith('local_')) {
        await deleteDoc(doc(db, 'users', uid, 'coding_problems', id));
      }
    } catch (err) {
      console.error('Error deleting coding problem:', err);
    }
  },

  resetStore: () => {
    set({
      problems: [],
      handles: DEFAULT_HANDLES,
      profileStats: { github: null, githubRepos: [], leetcode: null, codeforces: null },
      loading: false
    });
  }
}));

export const useLeetCodeStore = useCodingStore;
