import { create } from 'zustand';
import { useTaskStore } from './useTaskStore';
import { useGoalStore } from './useGoalStore';
import { useJournalStore } from './useJournalStore';
import { useMovieStore } from './useMovieStore';
import { useExpenseStore } from './useExpenseStore';
import { useCodingStore } from './useCodingStore';
import { useWardrobeStore } from './useWardrobeStore';
import { useGymStore } from './useGymStore';
import { useCollegeStore } from './useCollegeStore';
import { useCalendarStore } from './useCalendarStore';

export const useSearchStore = create((set, get) => ({
  isOpen: false,
  query: '',
  results: [],
  selectedIndex: 0,
  isSearching: false,

  openSearch: () => {
    set({ isOpen: true, selectedIndex: 0 });
    get().performSearch(get().query);
  },

  closeSearch: () => set({ isOpen: false, selectedIndex: 0 }),

  toggleSearch: () => {
    const nextState = !get().isOpen;
    if (nextState) {
      get().openSearch();
    } else {
      get().closeSearch();
    }
  },

  setSelectedIndex: (index) => set({ selectedIndex: index }),

  setQuery: (query) => {
    set({ query, selectedIndex: 0 });
    get().performSearch(query);
  },

  getIndexedItems: () => {
    const items = [];

    // 1. Tasks
    try {
      const tasks = useTaskStore.getState().tasks || [];
      tasks.forEach((t) => {
        items.push({
          id: `task_${t.id}`,
          rawId: t.id,
          title: t.title || 'Untitled Task',
          subtitle: `Priority: ${t.priority || 'medium'} • Status: ${t.status || 'todo'}`,
          module: 'Tasks',
          moduleKey: 'tasks',
          route: '/tasks',
          keywords: ['task', t.priority, t.status, t.title].filter(Boolean).join(' ')
        });
      });
    } catch (e) {
      console.warn('Search index tasks error:', e);
    }

    // 2. Goals
    try {
      const goals = useGoalStore.getState().goals || [];
      goals.forEach((g) => {
        items.push({
          id: `goal_${g.id}`,
          rawId: g.id,
          title: g.title || 'Untitled Goal',
          subtitle: `${g.category || 'Goal'} • Progress: ${g.progress || 0}% • ${g.status || 'in_progress'}`,
          module: 'Goals',
          moduleKey: 'goals',
          route: '/goals',
          keywords: ['goal', g.category, g.status, g.description, g.title].filter(Boolean).join(' ')
        });
      });
    } catch (e) {
      console.warn('Search index goals error:', e);
    }

    // 3. Journal
    try {
      const entries = useJournalStore.getState().entries || [];
      entries.forEach((je) => {
        const snippet = je.gratitude || je.event || je.notes || je.content || '';
        items.push({
          id: `journal_${je.id}`,
          rawId: je.id,
          title: je.date ? `Journal (${je.date})` : (je.title || 'Journal Entry'),
          subtitle: `Mood: ${je.mood || '🙂'} — ${snippet.slice(0, 60)}${snippet.length > 60 ? '...' : ''}`,
          module: 'Journal',
          moduleKey: 'journal',
          route: '/journal',
          keywords: ['journal', je.date, je.mood, je.gratitude, je.event, je.notes, je.content].filter(Boolean).join(' ')
        });
      });
    } catch (e) {
      console.warn('Search index journal error:', e);
    }

    // 4. Movies & TV Shows
    try {
      const movies = useMovieStore.getState().movies || [];
      movies.forEach((m) => {
        items.push({
          id: `movie_${m.id}`,
          rawId: m.id,
          title: m.title || 'Untitled Movie',
          subtitle: `${m.year || ''} • ${m.genre || 'Film'} • Rating: ${m.imdbRating || m.userRating || 'N/A'}`,
          module: m.type === 'tv' ? 'TV Shows' : 'Movies',
          moduleKey: 'movies',
          route: '/movies',
          keywords: ['movie', 'tv', 'show', m.genre, m.director, m.plot, m.title].filter(Boolean).join(' ')
        });
      });
    } catch (e) {
      console.warn('Search index movies error:', e);
    }

    // 5. Expenses
    try {
      const expenses = useExpenseStore.getState().expenses || [];
      expenses.forEach((ex) => {
        const amountDisplay = typeof ex.amount === 'number' ? `$${ex.amount.toFixed(2)}` : ex.amount;
        items.push({
          id: `expense_${ex.id}`,
          rawId: ex.id,
          title: ex.title || ex.description || 'Expense',
          subtitle: `${amountDisplay} • ${ex.category || 'General'} • ${ex.date || ''}`,
          module: 'Expenses',
          moduleKey: 'expenses',
          route: '/expenses',
          keywords: ['expense', 'budget', 'cost', ex.category, ex.title, ex.description].filter(Boolean).join(' ')
        });
      });
    } catch (e) {
      console.warn('Search index expenses error:', e);
    }

    // 6. Coding Logs / LeetCode
    try {
      const problems = useCodingStore.getState().problems || [];
      problems.forEach((p) => {
        items.push({
          id: `coding_${p.id}`,
          rawId: p.id,
          title: p.title || 'Coding Problem',
          subtitle: `${p.platform || 'LeetCode'} • ${p.difficulty || 'Medium'} • ${p.notes || ''}`,
          module: 'Coding Logs',
          moduleKey: 'coding',
          route: '/coding',
          keywords: ['coding', 'leetcode', p.platform, p.difficulty, p.notes, p.title].filter(Boolean).join(' ')
        });
      });
    } catch (e) {
      console.warn('Search index coding error:', e);
    }

    // 7. Wardrobe
    try {
      const wardrobe = useWardrobeStore.getState().items || [];
      wardrobe.forEach((w) => {
        items.push({
          id: `wardrobe_${w.id}`,
          rawId: w.id,
          title: w.name || w.title || 'Wardrobe Item',
          subtitle: `${w.category || 'Outfit'} • ${w.color || ''} • ${w.brand || ''}`,
          module: 'Wardrobe',
          moduleKey: 'wardrobe',
          route: '/wardrobe',
          keywords: ['wardrobe', 'clothes', w.category, w.color, w.brand, w.name].filter(Boolean).join(' ')
        });
      });
    } catch (e) {
      console.warn('Search index wardrobe error:', e);
    }

    // 8. Gym
    try {
      const workouts = useGymStore.getState().workouts || [];
      workouts.forEach((gym) => {
        items.push({
          id: `gym_${gym.id}`,
          rawId: gym.id,
          title: gym.name || gym.title || 'Workout',
          subtitle: `${gym.muscleGroup || 'Fitness'} • ${gym.notes || ''}`,
          module: 'Gym',
          moduleKey: 'gym',
          route: '/gym',
          keywords: ['gym', 'workout', 'fitness', gym.muscleGroup, gym.notes, gym.name].filter(Boolean).join(' ')
        });
      });
    } catch (e) {
      console.warn('Search index gym error:', e);
    }

    // 9. College
    try {
      const collegeData = useCollegeStore.getState().assignments || useCollegeStore.getState().courses || [];
      collegeData.forEach((c) => {
        items.push({
          id: `college_${c.id}`,
          rawId: c.id,
          title: c.title || c.name || 'College Item',
          subtitle: `${c.courseCode || c.subject || 'College'} • ${c.dueDate || c.notes || ''}`,
          module: 'College',
          moduleKey: 'college',
          route: '/college',
          keywords: ['college', 'course', 'study', c.courseCode, c.subject, c.title, c.name].filter(Boolean).join(' ')
        });
      });
    } catch (e) {
      console.warn('Search index college error:', e);
    }

    // 10. Calendar Events
    try {
      const events = useCalendarStore.getState().events || [];
      events.forEach((ev) => {
        items.push({
          id: `calendar_${ev.id}`,
          rawId: ev.id,
          title: ev.title || 'Calendar Event',
          subtitle: `${ev.date || ''} • ${ev.description || ''}`,
          module: 'Calendar',
          moduleKey: 'calendar',
          route: '/calendar',
          keywords: ['calendar', 'event', 'meeting', ev.date, ev.description, ev.title].filter(Boolean).join(' ')
        });
      });
    } catch (e) {
      console.warn('Search index calendar error:', e);
    }

    return items;
  },

  performSearch: (queryStr) => {
    const rawQuery = (queryStr || '').trim().toLowerCase();
    const allItems = get().getIndexedItems();

    if (!rawQuery) {
      set({ results: allItems.slice(0, 8), selectedIndex: 0 });
      return;
    }

    const queryTokens = rawQuery.split(/\s+/).filter(Boolean);

    // Optimized native filter & scoring
    const matched = allItems.map((item) => {
      const titleLower = item.title.toLowerCase();
      const subtitleLower = item.subtitle.toLowerCase();
      const moduleLower = item.module.toLowerCase();
      const keywordsLower = item.keywords.toLowerCase();

      let score = 0;

      // Exact title match gets highest score
      if (titleLower === rawQuery) {
        score += 100;
      } else if (titleLower.startsWith(rawQuery)) {
        score += 60;
      } else if (titleLower.includes(rawQuery)) {
        score += 40;
      }

      // Check tokens
      let allTokensMatched = true;
      queryTokens.forEach((token) => {
        if (
          titleLower.includes(token) ||
          subtitleLower.includes(token) ||
          moduleLower.includes(token) ||
          keywordsLower.includes(token)
        ) {
          score += 10;
        } else {
          allTokensMatched = false;
        }
      });

      return { item, score, matched: allTokensMatched || score > 0 };
    });

    const filtered = matched
      .filter((m) => m.matched && m.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((m) => m.item);

    set({ results: filtered, selectedIndex: 0 });
  }
}));
