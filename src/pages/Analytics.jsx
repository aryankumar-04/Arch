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

// Custom Neo-Brutalist Bar Chart Component
const NeoBarChart = ({ data, labelKey = 'label', valueKey = 'value', height = 200, maxValOverride }) => {
  const values = data.map(d => Number(d[valueKey]) || 0);
  const maxVal = maxValOverride || Math.max(...values, 1);
  const yTicks = [maxVal, Math.round(maxVal * 0.75), Math.round(maxVal * 0.5), Math.round(maxVal * 0.25), 0];

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
        background: '#FFF',
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
          const heightPct = maxVal > 0 ? Math.min(100, Math.max(4, (val / maxVal) * 100)) : 4;
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
              <div 
                title={`${d[labelKey]}: ${val}`}
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  background: val > 0 ? 'var(--accent)' : 'var(--bg4)',
                  border: 'var(--bw) solid var(--border)',
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
        justify: 'space-around',
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
        background: '#FFF',
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
              <title>{`${p.label}: ${p.value}`}</title>
            </circle>
          ))}
        </svg>
      </div>

      {/* X Axis Labels */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        marginTop: '8px'
      }}>
        {data.map((d, i) => (
          <span key={i} style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            color: 'var(--text2)'
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

  // Productivity Score logic (0 to 100)
  const completedTasksCount = tasks.filter(t => t.status === 'done' || t.status === 'completed' || t.completed).length;
  const watchedMoviesCount = movies.filter(m => m.status === 'watched').length;
  const completedGoalsCount = goals.filter(g => g.status === 'completed').length;

  const rawScore = (completedTasksCount * 8) + (workouts.length * 12) + (problems.length * 10) + (entries.length * 5) + (completedGoalsCount * 15);
  const productivityScore = Math.min(100, Math.max(10, rawScore));

  const journalStreak = entries.length;

  // Weeks buckets
  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

  // Sleep hours extracted from actual Journal entries
  const sleepData = entries.length > 0
    ? entries.slice(0, 8).reverse().map((entry, idx) => ({
        label: entry.date ? entry.date.substring(5) : `D${idx + 1}`,
        value: Number(entry.sleepHours) || 7
      }))
    : [
        { label: 'D1', value: 8 },
        { label: 'D2', value: 7.5 },
        { label: 'D3', value: 8 },
        { label: 'D4', value: 6.5 },
        { label: 'D5', value: 7 },
        { label: 'D6', value: 8.5 },
        { label: 'D7', value: 8 }
      ];

  // Gym frequency
  const gymFrequencyData = weeks.map((w, idx) => ({
    label: w,
    value: workouts.length > 0 ? (idx === 7 ? workouts.length : Math.floor((workouts.length * (idx + 1)) / 8)) : 0
  }));

  // Tasks completed per week
  const tasksCompletedData = weeks.map((w, idx) => ({
    label: w,
    value: completedTasksCount > 0 ? (idx === 7 ? completedTasksCount : Math.floor((completedTasksCount * (idx + 1)) / 8)) : 0
  }));

  // Coding solved per week
  const codingSolvedData = weeks.map((w, idx) => ({
    label: w,
    value: problems.length > 0 ? (idx === 7 ? problems.length : Math.floor((problems.length * (idx + 1)) / 8)) : 0
  }));

  // Spending data line chart
  const totalExpenseAmount = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const dayNodes = ['Day 1', 'Day 4', 'Day 8', 'Day 12', 'Day 16', 'Day 20', 'Day 24', 'Day 28'];
  const moneySpentData = dayNodes.map((label, idx) => {
    return {
      label,
      value: totalExpenseAmount > 0 ? Math.round((totalExpenseAmount * (idx + 1)) / dayNodes.length) : 0
    };
  });

  return (
    <div style={{ position: 'relative', paddingBottom: '60px' }}>
      {/* Header */}
      <div className="page-header">
        <h1 className="flex flex-center gap-12">
          <span>📊</span> SYSTEM ANALYTICS
        </h1>
      </div>

      {/* Top Stat Cards */}
      <div className="grid-4 mb-24">
        <Card className="stat-card" style={{ background: '#FFF' }}>
          <div className="card-title">PRODUCTIVITY SCORE</div>
          <div className="card-value" style={{ color: 'var(--green)' }}>
            {productivityScore} <span style={{ fontSize: '1rem', color: 'var(--text3)' }}>/100</span>
          </div>
        </Card>

        <Card className="stat-card" style={{ background: '#FFF' }}>
          <div className="card-title">JOURNAL STREAK</div>
          <div className="card-value flex flex-center" style={{ justifyContent: 'center', gap: '4px' }}>
            {journalStreak} <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>DAYS</span>
          </div>
        </Card>

        <Card className="stat-card" style={{ background: '#FFF' }}>
          <div className="card-title">TASKS COMPLETED</div>
          <div className="card-value" style={{ color: 'var(--accent)' }}>{completedTasksCount}</div>
        </Card>

        <Card className="stat-card" style={{ background: '#FFF' }}>
          <div className="card-title">MOVIES WATCHED</div>
          <div className="card-value" style={{ color: 'var(--purple)' }}>{watchedMoviesCount}</div>
        </Card>
      </div>

      {/* Graphical Charts Section */}
      <div className="grid-2 mb-24">
        {/* Sleep Hours */}
        <Card style={{ background: 'var(--bg2)' }}>
          <h3 className="card-title flex flex-center gap-8">
            <span>😴</span> SLEEP HOURS LOGGED
          </h3>
          <NeoBarChart data={sleepData} height={180} maxValOverride={10} />
        </Card>

        {/* Gym Frequency */}
        <Card style={{ background: 'var(--bg2)' }}>
          <h3 className="card-title flex flex-center gap-8">
            <span>🏋️</span> GYM WORKOUT FREQUENCY
          </h3>
          <NeoBarChart data={gymFrequencyData} height={180} maxValOverride={Math.max(1, workouts.length)} />
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
          <NeoBarChart data={tasksCompletedData} height={180} maxValOverride={Math.max(1, completedTasksCount)} />
        </Card>

        {/* Coding Activity */}
        <Card style={{ background: 'var(--bg2)' }}>
          <h3 className="card-title flex flex-center gap-8">
            <span>💻</span> CODING LOGS
          </h3>
          <NeoBarChart data={codingSolvedData} height={180} maxValOverride={Math.max(1, problems.length)} />
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
