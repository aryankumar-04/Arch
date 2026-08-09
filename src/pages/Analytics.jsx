import { useEffect } from 'react';
import { 
  useTaskStore, 
  useGymStore, 
  useJournalStore, 
  useExpenseStore, 
  useCodingStore,
  useMovieStore,
  useWardrobeStore,
  useGoalStore
} from '../store';
import Card from '../components/common/Card';
import { groupItemsBy8Weeks, groupExpensesBy8Weeks, getPast8WeeksBuckets } from '../utils/weekBuckets';

// Custom Neo-Brutalist Bar Chart Component with Custom Tooltip Support
const NeoBarChart = ({ data, labelKey = 'label', valueKey = 'value', height = 200, maxValOverride }) => {
  const values = data.map(d => Number(d[valueKey]) || 0);
  const highestVal = Math.max(...values, 0);

  let maxVal = maxValOverride;
  if (!maxVal || maxVal <= 0) {
    if (highestVal === 0) {
      maxVal = 8;
    } else {
      // Add ~15% headroom and round up to next multiple of 4 for clean, evenly spaced integer ticks
      const headroomVal = Math.ceil(highestVal * 1.15);
      maxVal = Math.max(4, Math.ceil(headroomVal / 4) * 4);
    }
  }

  const step = maxVal / 4;
  const yTicks = [
    maxVal,
    Math.round((maxVal - step) * 10) / 10,
    Math.round((maxVal - step * 2) * 10) / 10,
    Math.round((maxVal - step * 3) * 10) / 10,
    0
  ];

  return (
    <div style={{ position: 'relative', width: '100%', padding: '16px 12px 8px 36px' }}>
      {/* Y Axis labels */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 16,
        bottom: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontSize: '0.7rem',
        fontWeight: 800,
        color: 'var(--text2)',
        textAlign: 'right',
        width: '24px'
      }}>
        {yTicks.map((t, idx) => (
          <span key={idx}>{t}</span>
        ))}
      </div>

      {/* Chart Canvas Box */}
      <div style={{
        height: `${height}px`,
        border: 'var(--bw) solid var(--border)',
        background: 'var(--bg)',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        padding: '0 12px'
      }}>
        {/* Horizontal Grid lines */}
        {[0, 25, 50, 75].map(pct => (
          <div key={pct} style={{
            position: 'absolute',
            top: `${pct}%`,
            left: 0,
            right: 0,
            borderTop: '1px dashed var(--bg4)',
            pointerEvents: 'none'
          }} />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const val = Number(d[valueKey]) || 0;
          const heightPct = maxVal > 0 && val > 0 ? Math.min(100, (val / maxVal) * 100) : 0;
          const tooltipText = d.tooltip || `${d[labelKey]}: ${val}`;

          return (
            <div key={i} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: '100%',
              justifyContent: 'flex-end',
              flex: 1,
              maxWidth: '36px',
              zIndex: 2
            }}>
              {val > 0 && (
                <div style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--text)', marginBottom: '2px' }}>
                  {val}
                </div>
              )}
              <div 
                title={tooltipText}
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  background: val > 0 ? 'var(--accent)' : 'transparent',
                  border: val > 0 ? 'var(--bw) solid var(--border)' : 'none',
                  borderBottom: 'none',
                  transition: 'height 0.3s ease'
                }} 
              />
            </div>
          );
        })}
      </div>

      {/* X Axis Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: '8px',
        paddingLeft: '12px',
        paddingRight: '12px'
      }}>
        {data.map((d, i) => (
          <span key={i} style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            color: 'var(--text2)',
            textAlign: 'center',
            flex: 1
          }}>
            {d[labelKey]}
          </span>
        ))}
      </div>
    </div>
  );
};

// Custom Neo-Brutalist Line Chart Component
const NeoLineChart = ({ data, height = 200, lineColor = '#EF4444' }) => {
  const values = data.map(d => Number(d.value) || 0);
  const maxVal = Math.max(...values, 100);

  const width = 600;
  const paddingX = 20;
  const paddingY = 20;
  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  const points = data.map((d, idx) => {
    const x = paddingX + (idx / Math.max(1, data.length - 1)) * chartW;
    const y = height - paddingY - ((Number(d.value) || 0) / maxVal) * chartH;
    return { x, y, value: d.value, label: d.label };
  });

  const polylineStr = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div style={{ position: 'relative', width: '100%', padding: '16px 12px 8px 36px' }}>
      {/* Y Axis Ticks */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 16,
        bottom: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        fontSize: '0.7rem',
        fontWeight: 800,
        color: 'var(--text2)',
        textAlign: 'right',
        width: '24px'
      }}>
        <span>{maxVal}</span>
        <span>{Math.round(maxVal / 2)}</span>
        <span>0</span>
      </div>

      {/* Chart Box */}
      <div style={{
        height: `${height}px`,
        border: 'var(--bw) solid var(--border)',
        background: 'var(--bg)',
        position: 'relative'
      }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <line x1="0" y1={paddingY} x2={width} y2={paddingY} stroke="var(--bg4)" strokeDasharray="4 4" />
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="var(--bg4)" strokeDasharray="4 4" />
          <line x1="0" y1={height - paddingY} x2={width} y2={height - paddingY} stroke="var(--border)" strokeWidth="1" />

          <polyline
            fill="none"
            stroke={lineColor}
            strokeWidth="3"
            points={polylineStr}
          />

          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill={lineColor}
              stroke="var(--border)"
              strokeWidth="1.5"
            >
              <title>{`${p.label}: ₹${p.value}`}</title>
            </circle>
          ))}
        </svg>
      </div>

      {/* X Axis Labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        marginTop: '8px'
      }}>
        {data.map((d, i) => (
          <span key={i} style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            color: 'var(--text2)',
            textAlign: 'center',
            flex: 1
          }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const Analytics = () => {
  const { tasks, fetchTasks } = useTaskStore();
  const { workouts, fetchWorkouts } = useGymStore();
  const { entries, fetchEntries } = useJournalStore();
  const { expenses, fetchExpenses } = useExpenseStore();
  const { problems, fetchCodingData } = useCodingStore();
  const { movies, fetchMovies } = useMovieStore();
  const { items, outfits, fetchWardrobe } = useWardrobeStore();
  const { goals, fetchGoals } = useGoalStore();

  useEffect(() => {
    fetchTasks();
    fetchWorkouts();
    fetchEntries();
    fetchExpenses();
    fetchCodingData();
    fetchMovies();
    fetchWardrobe();
    fetchGoals();
  }, [fetchTasks, fetchWorkouts, fetchEntries, fetchExpenses, fetchCodingData, fetchMovies, fetchWardrobe, fetchGoals]);

  // General Counts
  const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed' || t.completed);
  const completedTasksCount = completedTasks.length;
  const watchedMoviesCount = movies.filter(m => m.status === 'watched').length;
  const completedGoalsCount = goals.filter(g => g.status === 'completed').length;

  // Productivity Score logic
  const rawScore = (completedTasksCount * 8) + (workouts.length * 12) + (problems.length * 10) + (entries.length * 5) + (completedGoalsCount * 15);
  const productivityScore = Math.min(100, Math.max(10, rawScore));
  const journalStreak = entries.length;

  // =========================================================================
  // LIFE BALANCE INDEX FORMULAS & CALCULATIONS
  // =========================================================================
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  /* 
   * 1. FITNESS & GYM CONSISTENCY
   * Formula: (Gym Workouts Logged in Past 30 Days / Monthly Target of 16 workouts) * 100
   * Target: 16 workouts per month (~4 workouts/week). Capped at 100%. Fallback: 0%.
   */
  const workoutsLast30Days = workouts.filter(w => {
    const d = w.date ? new Date(w.date) : (w.createdAt ? new Date(w.createdAt) : null);
    return d && !isNaN(d.getTime()) && d >= thirtyDaysAgo;
  }).length;

  const fitnessGymPct = workouts.length === 0 ? 0 : Math.min(100, Math.round((workoutsLast30Days / 16) * 100));

  /* 
   * 2. CODING & DSA ACTIVITY
   * Formula: (Unique Days with Logged Coding Activity in Past 30 Days / Target of 15 Active Days) * 100
   * Target: 15 active coding days per month (~3-4 days/week). Capped at 100%. Fallback: 0%.
   */
  const codingDaysSet = new Set();
  problems.forEach(p => {
    const d = p.date ? new Date(p.date) : (p.createdAt ? new Date(p.createdAt) : null);
    if (d && !isNaN(d.getTime()) && d >= thirtyDaysAgo) {
      codingDaysSet.add(d.toISOString().substring(0, 10));
    }
  });
  const codingActiveDays = codingDaysSet.size;
  const codingDsaPct = problems.length === 0 ? 0 : Math.min(100, Math.round((codingActiveDays / 15) * 100));

  /* 
   * 3. JOURNAL & SLEEP BALANCE
   * Formula: 50% Journal Consistency Score + 50% Healthy Sleep Range Score
   * - Journal Consistency: (Logged Journal Days in Past 30 Days / 30) * 100
   * - Sleep Health Score: Average total sleep hours per logged day in past 30 days.
   *   Ideal range: 7-9 hours = 100%. Penalizes deviation linearly.
   * Fallback: 0% if no journal entries exist.
   */
  const journalEntriesLast30Days = entries.filter(e => {
    const d = e.date ? new Date(e.date) : (e.createdAt ? new Date(e.createdAt) : null);
    return d && !isNaN(d.getTime()) && d >= thirtyDaysAgo;
  });

  const journalConsistencyScore = Math.min(100, (journalEntriesLast30Days.length / 30) * 100);

  let totalSleepHoursLogged = 0;
  journalEntriesLast30Days.forEach(e => {
    const night = typeof e.sleepCycle?.duration === 'number' ? e.sleepCycle.duration : (parseFloat(e.sleepHours) || 0);
    const nap = typeof e.eveningNap?.duration === 'number' ? e.eveningNap.duration : (parseFloat(e.napHours) || 0);
    totalSleepHoursLogged += (night + nap);
  });

  const avgSleepHours = journalEntriesLast30Days.length > 0 ? (totalSleepHoursLogged / journalEntriesLast30Days.length) : 0;

  let sleepHealthScore = 0;
  if (avgSleepHours >= 7 && avgSleepHours <= 9) {
    sleepHealthScore = 100;
  } else if (avgSleepHours > 0) {
    sleepHealthScore = Math.max(0, Math.round(100 - Math.abs(avgSleepHours - 8) * 25));
  }

  const journalSleepPct = entries.length === 0
    ? 0
    : Math.min(100, Math.round((0.5 * journalConsistencyScore) + (0.5 * sleepHealthScore)));

  /* 
   * 4. GOALS COMPLETED
   * Formula: (Completed Goals Count / Total Goals Count) * 100
   * Fallback: 0% if total goals count is 0.
   */
  const goalsCompletedPct = goals.length === 0
    ? 0
    : Math.min(100, Math.round((completedGoalsCount / goals.length) * 100));

  // Threshold Color Resolver
  const getScoreColor = (pct) => {
    if (pct >= 70) return 'var(--green, #10B981)';
    if (pct >= 40) return 'var(--accent, #2563EB)';
    if (pct >= 20) return 'var(--yellow, #F59E0B)';
    return 'var(--red, #EF4444)';
  };

  // =========================================================================
  // FIX: SLEEP HOURS LOGGED CHART DATA AGGREGATION
  // Merges Night Sleep and Nap entries for the SAME calendar date into ONE bar
  // =========================================================================
  const sleepMap = new Map();

  entries.forEach(entry => {
    if (!entry) return;
    let dateKey = '';
    if (entry.date) {
      dateKey = String(entry.date).substring(0, 10);
    } else if (entry.createdAt) {
      dateKey = new Date(entry.createdAt).toISOString().substring(0, 10);
    }
    if (!dateKey) return;

    let night = 0;
    if (typeof entry.sleepCycle?.duration === 'number') {
      night = entry.sleepCycle.duration;
    } else if (entry.sleepHours) {
      night = parseFloat(entry.sleepHours) || 0;
    }

    let nap = 0;
    if (typeof entry.eveningNap?.duration === 'number') {
      nap = entry.eveningNap.duration;
    } else if (entry.napHours) {
      nap = parseFloat(entry.napHours) || 0;
    }

    if (!sleepMap.has(dateKey)) {
      sleepMap.set(dateKey, { dateKey, night: 0, nap: 0 });
    }

    const record = sleepMap.get(dateKey);
    record.night += night;
    record.nap += nap;
  });

  const sortedSleepDays = Array.from(sleepMap.values())
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
    .slice(-8);

  const sleepData = sortedSleepDays.length > 0
    ? sortedSleepDays.map(item => {
        const total = Number((item.night + item.nap).toFixed(1));
        const monthDayLabel = item.dateKey.length >= 10 ? item.dateKey.substring(5) : item.dateKey;
        
        let tooltipText = `Total: ${total}h`;
        if (item.night > 0 && item.nap > 0) {
          tooltipText = `Total: ${total}h (Night: ${item.night}h, Nap: ${item.nap}h)`;
        } else if (item.nap > 0 && item.night === 0) {
          tooltipText = `Total: ${item.nap}h (Nap: ${item.nap}h)`;
        } else if (item.night > 0) {
          tooltipText = `Total: ${item.night}h (Night: ${item.night}h)`;
        }

        return {
          label: monthDayLabel,
          value: total,
          tooltip: tooltipText
        };
      })
    : getPast8WeeksBuckets().map(b => ({ label: b.label, value: 0, tooltip: `${b.label}: 0h` }));

  // Real-data week bucketing for all other charts
  const gymFrequencyData = groupItemsBy8Weeks(workouts, w => w.date || w.createdAt);
  const tasksCompletedData = groupItemsBy8Weeks(completedTasks, t => t.completedAt || t.date || t.createdAt);
  const codingSolvedData = groupItemsBy8Weeks(problems, p => p.createdAt || p.date);
  const moneySpentData = groupExpensesBy8Weeks(expenses);

  const totalExpenseAmount = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div style={{ position: 'relative', paddingBottom: '60px' }}>
      {/* Header */}
      <div className="page-header">
        <h1 className="flex flex-center gap-12">
          <span>📊</span> ANALYTICS & LIFE INSIGHTS
        </h1>
      </div>

      {/* PART 1: LIFE BALANCE INDEX SUMMARY BANNER */}
      <Card className="mb-24" style={{ background: 'var(--bg2)', position: 'relative', borderLeft: '6px solid var(--accent, #2563EB)' }}>
        <div style={{
          fontSize: '0.88rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: 'var(--bw) solid var(--border)',
          paddingBottom: '8px'
        }}>
          <span>🎯</span> LIFE BALANCE INDEX SUMMARY
        </div>

        <div className="grid-4" style={{ gap: '16px' }}>
          <div style={{
            background: 'var(--bg4)',
            border: 'var(--bw) solid var(--border)',
            padding: '14px 16px',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '4px' }}>
              💪 FITNESS & GYM
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: getScoreColor(fitnessGymPct) }}>
              {fitnessGymPct}%
            </div>
          </div>

          <div style={{
            background: 'var(--bg4)',
            border: 'var(--bw) solid var(--border)',
            padding: '14px 16px',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '4px' }}>
              💻 CODING & DSA
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: getScoreColor(codingDsaPct) }}>
              {codingDsaPct}%
            </div>
          </div>

          <div style={{
            background: 'var(--bg4)',
            border: 'var(--bw) solid var(--border)',
            padding: '14px 16px',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '4px' }}>
              📖 JOURNAL & SLEEP
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: getScoreColor(journalSleepPct) }}>
              {journalSleepPct}%
            </div>
          </div>

          <div style={{
            background: 'var(--bg4)',
            border: 'var(--bw) solid var(--border)',
            padding: '14px 16px',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '4px' }}>
              🎯 GOALS COMPLETED
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: getScoreColor(goalsCompletedPct) }}>
              {goalsCompletedPct}%
            </div>
          </div>
        </div>
      </Card>

      {/* Top Stat Cards */}
      <div className="grid-4 mb-24">
        <Card className="stat-card" style={{ background: 'var(--bg2)' }}>
          <div className="card-title">PRODUCTIVITY SCORE</div>
          <div className="card-value" style={{ color: 'var(--green)' }}>
            {productivityScore} <span style={{ fontSize: '1rem', color: 'var(--text3)' }}>/100</span>
          </div>
        </Card>

        <Card className="stat-card" style={{ background: 'var(--bg2)' }}>
          <div className="card-title">JOURNAL STREAK</div>
          <div className="card-value flex flex-center" style={{ justifyContent: 'center', gap: '4px' }}>
            {journalStreak} <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>DAYS</span>
          </div>
        </Card>

        <Card className="stat-card" style={{ background: 'var(--bg2)' }}>
          <div className="card-title">TASKS COMPLETED</div>
          <div className="card-value" style={{ color: 'var(--accent)' }}>{completedTasksCount}</div>
        </Card>

        <Card className="stat-card" style={{ background: 'var(--bg2)' }}>
          <div className="card-title">MOVIES WATCHED</div>
          <div className="card-value" style={{ color: 'var(--purple)' }}>{watchedMoviesCount}</div>
        </Card>
      </div>

      {/* Graphical Charts Section */}
      <div className="grid-2 mb-24">
        {/* PART 2: SLEEP HOURS LOGGED CHART (MERGED DAILY BARS) */}
        <Card style={{ background: 'var(--bg2)' }}>
          <h3 className="card-title flex flex-center gap-8">
            <span>😴</span> SLEEP HOURS LOGGED
          </h3>
          <NeoBarChart data={sleepData} height={180} />
        </Card>

        {/* Gym Frequency */}
        <Card style={{ background: 'var(--bg2)' }}>
          <h3 className="card-title flex flex-center gap-8">
            <span>🏋️</span> GYM WORKOUT FREQUENCY
          </h3>
          <NeoBarChart data={gymFrequencyData} height={180} maxValOverride={Math.max(1, ...gymFrequencyData.map(d => d.value))} />
        </Card>

        {/* Money Spent */}
        <Card style={{ background: 'var(--bg2)' }}>
          <h3 className="card-title flex flex-center gap-8">
            <span>💰</span> SPENDING TREND
          </h3>
          <NeoLineChart data={moneySpentData} height={180} lineColor="#EF4444" />
        </Card>

        {/* Tasks Completed */}
        <Card style={{ background: 'var(--bg2)' }}>
          <h3 className="card-title flex flex-center gap-8">
            <span>✅</span> TASKS COMPLETED
          </h3>
          <NeoBarChart data={tasksCompletedData} height={180} maxValOverride={Math.max(1, ...tasksCompletedData.map(d => d.value))} />
        </Card>

        {/* Coding Activity */}
        <Card style={{ background: 'var(--bg2)' }}>
          <h3 className="card-title flex flex-center gap-8">
            <span>💻</span> CODING LOGS
          </h3>
          <NeoBarChart data={codingSolvedData} height={180} maxValOverride={Math.max(1, ...codingSolvedData.map(d => d.value))} />
        </Card>

        {/* Complete Overview Table */}
        <Card style={{ background: 'var(--bg2)' }}>
          <h3 className="card-title flex flex-center gap-8">
            <span>📊</span> MODULES OVERVIEW
          </h3>

          <div style={{ marginTop: '16px' }}>
            {[
              { label: 'Total Tasks', value: `${completedTasksCount} / ${tasks.length}` },
              { label: 'Gym Workouts', value: `${workouts.length} Logged` },
              { label: 'Journal Entries', value: `${entries.length} Entries` },
              { label: 'Total Expenses', value: `₹${totalExpenseAmount}` },
              { label: 'Coding Logs', value: `${problems.length} Logged` },
              { label: 'Movies Watched', value: `${watchedMoviesCount} / ${movies.length}` },
              { label: 'Wardrobe Items / Outfits', value: `${items.length} Items | ${outfits.length} Outfits` },
              { label: 'Goals Completed', value: `${completedGoalsCount} / ${goals.length}` }
            ].map((row, i) => (
              <div 
                key={i} 
                className="flex flex-between flex-center"
                style={{
                  padding: '10px 0',
                  borderBottom: 'var(--bw) solid var(--border)',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}
              >
                <span>{row.label}</span>
                <span style={{ fontWeight: 900, color: 'var(--text)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
