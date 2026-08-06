import { jsPDF } from 'jspdf';
import { useAuthStore } from '../store/useAuthStore';
import { useTaskStore } from '../store/useTaskStore';
import { useJournalStore } from '../store/useJournalStore';
import { useCalendarStore } from '../store/useCalendarStore';
import { useCollegeStore } from '../store/useCollegeStore';
import { useGymStore } from '../store/useGymStore';
import { useExpenseStore } from '../store/useExpenseStore';
import { useMovieStore } from '../store/useMovieStore';
import { useWardrobeStore } from '../store/useWardrobeStore';
import { useGoalStore } from '../store/useGoalStore';
import { useCodingStore } from '../store/useCodingStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useTagStore } from '../store/useTagStore';

// Helper to strip database / bookkeeping metadata from exported data
const sanitizeItem = (item) => {
  if (!item || typeof item !== 'object') return item;
  const clean = { ...item };
  delete clean.uid;
  delete clean.userId;
  delete clean._id;
  delete clean.firestoreRef;
  delete clean.authToken;
  delete clean.sessionData;
  delete clean.securityRules;
  delete clean.__v;
  return clean;
};

const sanitizeArray = (arr) => (Array.isArray(arr) ? arr.map(sanitizeItem) : []);

export const collectAllUserData = () => {
  const user = useAuthStore.getState().user;
  const username = useSettingsStore.getState().username || 'User';

  const tags = sanitizeArray(useTagStore.getState().tags || []);
  const tagMap = new Map(tags.map(t => [t.id, t]));

  const tasksRaw = sanitizeArray(useTaskStore.getState().tasks);
  const tasks = tasksRaw.map(t => ({
    ...t,
    tags: Array.isArray(t.tagIds) ? t.tagIds.map(id => tagMap.get(id)).filter(Boolean) : []
  }));

  const dailyJournal = sanitizeArray(useJournalStore.getState().entries);
  const calendarEvents = sanitizeArray(useCalendarStore.getState().events);
  const gymWorkouts = sanitizeArray(useGymStore.getState().workouts);
  const expenses = sanitizeArray(useExpenseStore.getState().expenses);
  const recurringExpenses = sanitizeArray(useExpenseStore.getState().recurringExpenses);
  const savingsGoals = sanitizeArray(useExpenseStore.getState().savingsGoals);
  const monthlyBudgetCap = useExpenseStore.getState().monthlyBudgetCap || 0;

  const codingProblems = sanitizeArray(useCodingStore.getState().problems);
  const codingHandles = useCodingStore.getState().handles || {};

  const collegeSubjects = sanitizeArray(useCollegeStore.getState().subjects);
  const collegeAssignments = sanitizeArray(useCollegeStore.getState().assignments);
  const collegeExams = sanitizeArray(useCollegeStore.getState().exams);
  const collegeProjects = sanitizeArray(useCollegeStore.getState().projects);
  const collegeFaculty = sanitizeArray(useCollegeStore.getState().faculty);

  const movies = sanitizeArray(useMovieStore.getState().movies);
  const wardrobeItems = sanitizeArray(useWardrobeStore.getState().items);
  const wardrobeOutfits = sanitizeArray(useWardrobeStore.getState().outfits);

  const goalsRaw = sanitizeArray(useGoalStore.getState().goals);
  const goals = goalsRaw.map(g => ({
    ...g,
    tags: Array.isArray(g.tagIds) ? g.tagIds.map(id => tagMap.get(id)).filter(Boolean) : []
  }));
  const goalCategories = useGoalStore.getState().categories || [];

  const themePreset = useSettingsStore.getState().themePreset || 'paper';
  const accentColor = useSettingsStore.getState().accentColor || '#2563EB';

  const exportDate = new Date().toISOString().split('T')[0];

  return {
    meta: {
      appName: 'ArchOS Life Dashboard',
      exportedAt: new Date().toISOString(),
      exportDate,
      user: { username, uid: user ? user.uid : 'guest' }
    },
    tags,
    dailyJournal,
    tasks,
    calendarEvents,
    expenses: { items: expenses, recurringExpenses, savingsGoals, monthlyBudgetCap },
    gymWorkouts,
    codingHub: { problems: codingProblems, handles: codingHandles },
    collegeHub: {
      subjects: collegeSubjects,
      assignments: collegeAssignments,
      exams: collegeExams,
      projects: collegeProjects,
      faculty: collegeFaculty
    },
    movies,
    wardrobe: { items: wardrobeItems, outfits: wardrobeOutfits },
    goals: { items: goals, categories: goalCategories },
    settings: { username, themePreset, accentColor }
  };
};

export const exportToJSON = () => {
  const data = collectAllUserData();
  const dateStr = data.meta.exportDate;
  const fileName = `ArchOS-Export-${dateStr}.json`;

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// CSV Export: Single multi-section CSV with leading 'Section' column for complete data parity across all modules.
export const exportToCSV = () => {
  const data = collectAllUserData();
  const dateStr = data.meta.exportDate;
  const fileName = `ArchOS-Export-${dateStr}.csv`;

  let rows = [];
  rows.push(['Section', 'Title / Date', 'Category / Details', 'Status / Amount', 'Notes / Tags']);

  // 1. Tasks
  (data.tasks || []).forEach(t => {
    const tagLabels = (t.tags || []).map(tg => tg.label).join(', ');
    const notesStr = tagLabels ? `Tags: [${tagLabels}]` : '';
    rows.push(['Tasks', t.title || '', t.priority || 'Normal', t.status || 'Pending', notesStr]);
  });

  // 2. Journal
  (data.dailyJournal || []).forEach(j => {
    let moodText = j.mood || 'Neutral';
    if (moodText === 'ecstatic') moodText = 'Ecstatic';
    if (moodText === 'happy') moodText = 'Happy';
    if (moodText === 'neutral') moodText = 'Neutral';
    if (moodText === 'sad') moodText = 'Sad';
    rows.push(['Journal', j.date || '', moodText, '', j.content || '']);
  });

  // 3. Calendar Events
  (data.calendarEvents || []).forEach(c => {
    rows.push(['Calendar Event', c.title || '', c.date || '', c.time || '', c.notes || '']);
  });

  // 4. Expenses
  (data.expenses?.items || []).forEach(e => {
    const expTitle = e.title || e.itemName || e.description || 'Expense';
    rows.push(['Expenses', expTitle, e.category || '', `Rs. ${e.amount || 0}`, e.date || '']);
  });

  // 4b. Recurring Expenses
  (data.expenses?.recurringExpenses || []).forEach(r => {
    rows.push(['Recurring Expenses', r.name || '', r.category || '', `Rs. ${r.amount || 0} (${r.frequency})`, `Renew: ${r.renewDate}`]);
  });

  // 4c. Savings Goals
  (data.expenses?.savingsGoals || []).forEach(g => {
    rows.push(['Savings Goals', g.name || '', `Target: Rs. ${g.targetAmount || 0}`, `Saved: Rs. ${g.savedAmount || 0}`, '']);
  });

  // 5. Gym Workouts
  (data.gymWorkouts || []).forEach(g => {
    const workoutName = g.title || g.workoutType || g.muscleGroup || g.name || 'Workout Session';
    rows.push(['Gym Workouts', workoutName, g.muscleGroup || '', `${g.duration || 0} mins`, g.date || '']);
  });

  // 6. Coding Hub
  (data.codingHub?.problems || []).forEach(p => {
    rows.push(['Coding Hub', p.title || '', p.platform || '', p.difficulty || '', p.notes || '']);
  });

  // 7. College Hub Sub-sections
  (data.collegeHub?.subjects || []).forEach(s => {
    rows.push(['College Subject', s.name || s.title || '', s.code || '', `Credits: ${s.credits || 0}`, s.professor || '']);
  });
  (data.collegeHub?.assignments || []).forEach(a => {
    rows.push(['College Assignment', a.title || '', a.subject || '', a.status || '', `Due: ${a.dueDate || ''}`]);
  });
  (data.collegeHub?.exams || []).forEach(ex => {
    rows.push(['College Exam', ex.title || ex.subject || '', ex.date || '', ex.time || '', ex.location || '']);
  });
  (data.collegeHub?.projects || []).forEach(pr => {
    rows.push(['College Project', pr.title || '', pr.subject || '', pr.status || '', pr.description || '']);
  });
  (data.collegeHub?.faculty || []).forEach(f => {
    rows.push(['College Faculty', f.name || '', f.department || '', f.email || '', f.office || '']);
  });

  // 8. Movies / Media
  (data.movies || []).forEach(m => {
    rows.push(['Movies', m.title || '', m.genre || '', m.status || '', `Rating: ${m.rating || 'N/A'}`]);
  });

  // 9. Wardrobe Items & Outfits
  (data.wardrobe?.items || []).forEach(w => {
    rows.push(['Wardrobe Item', w.name || '', w.category || '', w.color || '', w.brand || '']);
  });
  (data.wardrobe?.outfits || []).forEach(o => {
    rows.push(['Wardrobe Outfit', o.name || '', o.season || '', o.occasion || '', '']);
  });

  // 10. Goals
  (data.goals?.items || []).forEach(gl => {
    const tagLabels = (gl.tags || []).map(tg => tg.label).join(', ');
    const notesStr = tagLabels ? `Tags: [${tagLabels}]` : '';
    rows.push(['Goals', gl.title || '', gl.category || '', gl.status || '', notesStr]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);

  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDF Export: Structured text-rendered PDF report.
export const exportToPDF = () => {
  const data = collectAllUserData();
  const dateStr = data.meta.exportDate;
  const fileName = `ArchOS-Export-${dateStr}.pdf`;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let y = margin;

  const addHeader = (title) => {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(37, 99, 235);
    doc.text(title, margin, y);
    y += 18;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y - 6, pageWidth - margin, y - 6);
  };

  const addRow = (text, isSub = false) => {
    if (y > pageHeight - 40) {
      doc.addPage();
      y = margin;
    }
    doc.setFont('Helvetica', isSub ? 'italic' : 'normal');
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    const splitText = doc.splitTextToSize(text, pageWidth - margin * 2);
    doc.text(splitText, margin + (isSub ? 12 : 0), y);
    y += splitText.length * 14;
  };

  // Document Title Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text('ArchOS Life Dashboard — User Data Export', margin, y);
  y += 24;

  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Exported on: ${new Date().toLocaleString()} | User: ${data.meta.user.username}`, margin, y);
  y += 24;

  // 1. Tasks
  addHeader('Tasks');
  if (!data.tasks || data.tasks.length === 0) addRow('No tasks logged.');
  else {
    data.tasks.forEach(t => {
      const tagLabels = (t.tags || []).map(tg => tg.label).join(', ');
      const tagStr = tagLabels ? ` | Tags: ${tagLabels}` : '';
      addRow(`• [${t.status === 'completed' ? 'DONE' : 'TODO'}] ${t.title}${tagStr}`);
    });
  }
  y += 12;

  // 2. Journal
  addHeader('Daily Journal');
  if (!data.dailyJournal || data.dailyJournal.length === 0) addRow('No journal entries logged.');
  else {
    data.dailyJournal.forEach(j => {
      let moodText = j.mood || 'Neutral';
      if (moodText === 'ecstatic') moodText = 'Ecstatic';
      if (moodText === 'happy') moodText = 'Happy';
      if (moodText === 'neutral') moodText = 'Neutral';
      if (moodText === 'sad') moodText = 'Sad';
      addRow(`• Date: ${j.date || 'N/A'} | Mood: ${moodText}`);
      if (j.content) addRow(`  Content: ${j.content}`, true);
    });
  }
  y += 12;

  // 3. Calendar Events
  addHeader('Calendar Events');
  if (!data.calendarEvents || data.calendarEvents.length === 0) addRow('No calendar events.');
  else {
    data.calendarEvents.forEach(c => {
      addRow(`• ${c.date || ''} ${c.time ? `(${c.time})` : ''}: ${c.title || ''}`);
    });
  }
  y += 12;

  // 4. Expenses
  addHeader('Expenses & Budget Tracker');
  addRow(`Monthly Budget Cap: Rs. ${data.expenses?.monthlyBudgetCap || 0}`);
  if (!data.expenses?.items || data.expenses.items.length === 0) addRow('No expenses logged.');
  else {
    data.expenses.items.forEach(e => {
      const expTitle = e.title || e.itemName || e.description || 'Expense';
      addRow(`• ${expTitle} — Rs. ${e.amount || 0} (${e.category || 'General'}) on ${e.date || ''}`);
    });
  }
  if (data.expenses?.recurringExpenses?.length > 0) {
    addRow('Fixed / Recurring Expenses:');
    data.expenses.recurringExpenses.forEach(r => {
      addRow(`  • ${r.name} — Rs. ${r.amount} (${r.frequency}) | Renew: ${r.renewDate}`, true);
    });
  }
  if (data.expenses?.savingsGoals?.length > 0) {
    addRow('Savings Goals:');
    data.expenses.savingsGoals.forEach(g => {
      addRow(`  • ${g.name} — Rs. ${g.savedAmount || 0} / Rs. ${g.targetAmount || 0}`, true);
    });
  }
  y += 12;

  // 5. Gym Workouts
  addHeader('Gym Workouts');
  if (!data.gymWorkouts || data.gymWorkouts.length === 0) addRow('No workouts logged.');
  else {
    data.gymWorkouts.forEach(g => {
      const workoutName = g.title || g.workoutType || g.muscleGroup || g.name || 'Workout Session';
      addRow(`• ${g.date || 'N/A'}: ${workoutName} (${g.muscleGroup || ''}) — ${g.duration || 0} mins`);
    });
  }
  y += 12;

  // 6. Coding Hub
  addHeader('Coding Hub Logs');
  if (!data.codingHub?.problems || data.codingHub.problems.length === 0) addRow('No coding logs.');
  else {
    data.codingHub.problems.forEach(p => {
      addRow(`• ${p.platform || 'Platform'}: ${p.title || ''} [${p.difficulty || 'Normal'}]`);
    });
  }
  y += 12;

  // 7. Goals
  addHeader('Goals');
  if (!data.goals?.items || data.goals.items.length === 0) addRow('No goals logged.');
  else {
    data.goals.items.forEach(g => {
      const tagLabels = (g.tags || []).map(tg => tg.label).join(', ');
      const tagStr = tagLabels ? ` | Tags: ${tagLabels}` : '';
      addRow(`• [${g.category || 'Goal'}] ${g.title} (${g.status || 'in_progress'})${tagStr}`);
    });
  }

  doc.save(fileName);
};
