import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useTaskStore, useExpenseStore, useGymStore,
  useJournalStore, useCollegeStore, useCalendarStore,
  useGoalStore, useCodingStore, useSettingsStore, useAuthStore
} from '../store';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';
import { PlusIcon } from '../components/common/Icons';

const QUOTES = [
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const uid = user ? user.uid : 'guest';

  // Stores
  const { tasks, fetchTasks } = useTaskStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  const { workouts, fetchWorkouts } = useGymStore();
  const { entries, fetchEntries, updateEntry, addEntry } = useJournalStore();
  const { subjects, fetchCollegeData } = useCollegeStore();
  const { events, fetchEvents } = useCalendarStore();
  const { goals, fetchGoals } = useGoalStore();
  const { problems, fetchCodingData } = useCodingStore();
  const { username, initSettings } = useSettingsStore();

  // Live Clock State
  const [now, setNow] = useState(new Date());

  // Quick Notes State
  const [quickNote, setQuickNote] = useState('');

  useEffect(() => {
    setQuickNote(getLocalUserBackup('quick_note', uid, ''));
  }, [uid]);

  // Quote of the day state
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    initSettings();
    fetchTasks();
    fetchExpenses();
    fetchWorkouts();
    fetchEntries();
    fetchCollegeData();
    fetchEvents();
    fetchGoals();
    fetchCodingData();

    // Live clock timer
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [initSettings, fetchTasks, fetchExpenses, fetchWorkouts, fetchEntries, fetchCollegeData, fetchEvents, fetchGoals, fetchCodingData]);

  const handleQuickNoteChange = (text) => {
    setQuickNote(text);
    saveLocalUserBackup('quick_note', uid, text);
  };

  // Determine Greeting with Custom Username
  const hour = now.getHours();
  const timeSalutation = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const nameDisplay = username ? `, ${username}` : '';
  const greetingEmoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '👋';
  const greeting = `${timeSalutation}${nameDisplay} ${greetingEmoji}`;

  // Format live date/time string e.g. "Sat, 25 Jul, 2026 - 08:52:34 pm"
  const formattedDateTime = now.toLocaleDateString(undefined, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) + ' - ' + now.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).toLowerCase();

  // 1. Sleep Last Night (Night Sleep + Evening Nap)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === todayStr);

  let sleepHours = '—';
  if (todayEntry) {
    let nightHours = 0;
    if (typeof todayEntry.sleepCycle?.duration === 'number') {
      nightHours = todayEntry.sleepCycle.duration;
    } else if (todayEntry.sleepHours) {
      nightHours = parseFloat(todayEntry.sleepHours) || 0;
    }

    let napHours = 0;
    if (typeof todayEntry.eveningNap?.duration === 'number') {
      napHours = todayEntry.eveningNap.duration;
    } else if (todayEntry.napHours) {
      napHours = parseFloat(todayEntry.napHours) || 0;
    }

    const total = nightHours + napHours;
    sleepHours = total > 0 ? total.toFixed(1) : (todayEntry.sleepHours || '0.0');
  }

  // 2. Tasks Due Today
  const tasksDueToday = tasks.filter(t => t.status !== 'completed');

  // 3. This Month's Spending
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlySpending = expenses
    .filter(e => {
      const d = new Date(e.date || e.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // 4. Coding This Week
  const codingThisWeek = problems.length;

  // 5. Days Since Gym
  let daysSinceGym = '—';
  if (workouts.length > 0) {
    const lastWorkout = new Date(workouts[0].date || workouts[0].createdAt);
    const diffTime = Math.abs(now - lastWorkout);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    daysSinceGym = diffDays === 0 ? '0' : String(diffDays);
  }

  // Current Streaks
  const journalStreak = entries.length;
  const gymStreak = workouts.length;
  const taskStreak = tasks.filter(t => {
    if (t.status !== 'completed') return false;
    if (!t.completedAt) return false;
    try {
      const completedDateStr = new Date(t.completedAt).toISOString().split('T')[0];
      return completedDateStr === todayStr;
    } catch (e) {
      return false;
    }
  }).length;

  // Today's Mood handler
  const handleMoodSelect = async (moodEmoji) => {
    let entry = entries.find(e => e.date === todayStr);
    if (entry) {
      await updateEntry(entry.id, { mood: moodEmoji });
    } else {
      const newEntry = await addEntry(todayStr);
      if (newEntry) await updateEntry(newEntry.id, { mood: moodEmoji });
    }
  };

  // Top active goal
  const focusGoal = goals.find(g => g.status === 'in_progress') || goals[0];

  const currentQuote = QUOTES[quoteIndex % QUOTES.length];

  return (
    <div>
      {/* Header Greeting & Clock */}
      <div className="mb-24">
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, textTransform: 'none', marginBottom: '4px' }}>
          {greeting}
        </h1>
        <p className="text-muted" style={{ fontWeight: 700, fontSize: '0.9rem' }}>
          {formattedDateTime}
        </p>
      </div>

      {/* ROW 1: 5 Stat Cards */}
      <div className="dash-grid mb-24" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {/* 1. Sleep Last Night */}
        <div className="card card-hover" style={{ padding: '16px' }} title="Combined Night Sleep + Evening Nap">
          <div className="card-title" style={{ fontSize: '0.75rem' }}>😴 SLEEP LAST NIGHT</div>
          <div className="card-value" style={{ fontSize: '1.8rem', borderBottom: 'var(--bw) solid var(--border)', paddingBottom: '4px' }}>
            {sleepHours !== '—' ? `${sleepHours} HRS` : '— HRS'}
          </div>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text2)', marginTop: '4px', textTransform: 'uppercase' }}>
            NIGHT + NAP
          </div>
        </div>

        {/* 2. Tasks Due Today */}
        <div className="card card-hover" style={{ padding: '16px' }}>
          <div className="card-title" style={{ fontSize: '0.75rem' }}>📋 TASKS DUE TODAY</div>
          <div className="card-value" style={{ fontSize: '1.8rem' }}>
            {tasksDueToday.length}
          </div>
        </div>

        {/* 3. This Month's Spending */}
        <div className="card card-hover" style={{ padding: '16px' }}>
          <div className="card-title" style={{ fontSize: '0.75rem' }}>💰 THIS MONTH'S SPENDING</div>
          <div className="card-value" style={{ fontSize: '1.8rem' }}>
            ₹{monthlySpending}
          </div>
        </div>

        {/* 4. Coding This Week */}
        <div className="card card-hover" style={{ padding: '16px' }}>
          <div className="card-title" style={{ fontSize: '0.75rem' }}>💻 CODING THIS WEEK</div>
          <div className="card-value" style={{ fontSize: '1.8rem' }}>
            {codingThisWeek}
          </div>
        </div>

        {/* 5. Days Since Gym */}
        <div className="card card-hover" style={{ padding: '16px' }}>
          <div className="card-title" style={{ fontSize: '0.75rem' }}>🏋️ DAYS SINCE GYM</div>
          <div className="card-value" style={{ fontSize: '1.8rem' }}>
            {daysSinceGym}
          </div>
        </div>
      </div>

      {/* ROW 2: 5 Content Cards */}
      <div className="dash-grid mb-24" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {/* 1. CURRENT STREAKS */}
        <div className="card card-hover" style={{ padding: '16px' }}>
          <div className="card-title">🔥 CURRENT STREAKS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => navigate('/journal')}
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', background: 'var(--bg2)', textTransform: 'uppercase' }}
            >
              📖 {journalStreak} JOURNAL
            </button>
            <button
              onClick={() => navigate('/gym')}
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', background: 'var(--bg2)', textTransform: 'uppercase' }}
            >
              💪 {gymStreak} GYM
            </button>
            <button
              onClick={() => navigate('/tasks')}
              className="btn btn-ghost"
              style={{ justifyContent: 'flex-start', background: 'var(--bg2)', textTransform: 'uppercase' }}
            >
              ✅ {taskStreak} TASKS
            </button>
          </div>
        </div>

        {/* 2. TOP 3 PRIORITIES */}
        <div className="card card-hover" style={{ padding: '16px', minWidth: 0, overflow: 'hidden' }}>
          <div className="card-title">🎯 TOP 3 PRIORITIES</div>
          {tasksDueToday.length === 0 ? (
            <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              No tasks due today 🎉
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 0 }}>
              {tasksDueToday.slice(0, 3).map(task => (
                <div
                  key={task.id}
                  title={task.title}
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%'
                  }}
                >
                  • {task.title}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. CLASSES TODAY */}
        <div className="card card-hover" style={{ padding: '16px' }}>
          <div className="card-title">🏫 CLASSES TODAY</div>
          {subjects.length === 0 ? (
            <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              No classes today
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {subjects.slice(0, 3).map(sub => (
                <div key={sub.id} style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                  • {sub.name} ({sub.attended || 0}/{sub.total || 0})
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. UPCOMING EVENTS */}
        <div className="card card-hover" style={{ padding: '16px' }}>
          <div className="card-title">📅 UPCOMING EVENTS</div>
          {events.length === 0 ? (
            <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              No upcoming events
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {events.slice(0, 3).map(ev => (
                <div key={ev.id} style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                  • {ev.title} ({ev.date})
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. TODAY'S MOOD */}
        <div className="card card-hover" style={{ padding: '16px' }}>
          <div className="card-title">😄 TODAY'S MOOD</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['😫', '😕', '😐', '🙂', '😄'].map(m => (
              <button
                key={m}
                type="button"
                className={`mood-btn ${todayEntry && todayEntry.mood === m ? 'selected' : ''}`}
                onClick={() => handleMoodSelect(m)}
                style={{ padding: '8px', fontSize: '1.4rem' }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3: 3 Grid Cards */}
      <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {/* 1. QUICK NOTES */}
        <div className="card card-hover" style={{ padding: '16px' }}>
          <div className="card-title">📝 QUICK NOTES</div>
          <textarea
            className="form-textarea"
            placeholder="Jot something down..."
            value={quickNote}
            onChange={(e) => handleQuickNoteChange(e.target.value)}
            style={{ minHeight: '90px', fontSize: '0.85rem' }}
          />
        </div>

        {/* 2. FOCUS GOAL */}
        <div className="card card-hover" style={{ padding: '16px' }}>
          <div className="card-title">🎯 FOCUS GOAL</div>
          {focusGoal ? (
            <div>
              <div style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                {focusGoal.title}
              </div>
              <div className="flex flex-between align-center mb-4" style={{ fontSize: '0.75rem', fontWeight: 900 }}>
                <span>PROGRESS</span>
                <span>{focusGoal.progress || 0}%</span>
              </div>
              <div style={{ width: '100%', height: '10px', background: 'var(--bg4)', border: 'var(--bw) solid var(--border)' }}>
                <div style={{ width: `${focusGoal.progress || 0}%`, height: '100%', background: 'var(--yellow)' }} />
              </div>
            </div>
          ) : (
            <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              No active goals yet
            </p>
          )}
        </div>

        {/* 3. QUOTE OF THE DAY */}
        <div className="card card-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column' }}>
          <div className="flex flex-between align-center mb-8" style={{ borderBottom: 'var(--bw) solid var(--border)', paddingBottom: '8px' }}>
            <div className="card-title" style={{ marginBottom: 0, border: 'none', padding: 0 }}>💬 QUOTE OF THE DAY</div>
            <button
              onClick={() => setQuoteIndex(prev => prev + 1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}
              title="Next quote"
            >
              🔄 NEXT
            </button>
          </div>
          <blockquote style={{ fontSize: '0.85rem', fontStyle: 'italic', fontWeight: 600, color: 'var(--text2)', flex: 1 }}>
            "{currentQuote.text}" — <strong style={{ color: 'var(--text)' }}>{currentQuote.author}</strong>
          </blockquote>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fab-btn" onClick={() => navigate('/tasks')} title="Add Task">
        <PlusIcon size={24} />
      </button>
    </div>
  );
};

export default Dashboard;