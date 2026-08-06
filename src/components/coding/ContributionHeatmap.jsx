import React, { useState, useMemo } from 'react';
import Card from '../common/Card';
import { useAuthStore } from '../../store';

const LEVEL_COLORS = [
  'var(--bg)',
  'color-mix(in srgb, var(--accent) 25%, var(--bg2))',
  'color-mix(in srgb, var(--accent) 50%, var(--bg2))',
  'color-mix(in srgb, var(--accent) 75%, var(--bg2))',
  'var(--accent)'
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export const ContributionHeatmap = ({ problems = [] }) => {
  const user = useAuthStore(state => state.user);
  const currentRealYear = useMemo(() => new Date().getFullYear(), []);
  const [selectedYear, setSelectedYear] = useState(currentRealYear);

  // Determine user account creation year (joinYear)
  const minYear = useMemo(() => {
    let year = currentRealYear;

    // 1. Firebase Auth metadata creationTime
    if (user && user.metadata && user.metadata.creationTime) {
      const creationDate = new Date(user.metadata.creationTime);
      if (!isNaN(creationDate.getFullYear())) {
        year = Math.min(year, creationDate.getFullYear());
      }
    }

    // 2. Earliest problem log entry date
    if (Array.isArray(problems) && problems.length > 0) {
      problems.forEach(p => {
        let d = null;
        if (p.createdAt) {
          if (typeof p.createdAt.toDate === 'function') d = p.createdAt.toDate();
          else d = new Date(p.createdAt);
        } else if (p.date) {
          d = new Date(p.date);
        }
        if (d && !isNaN(d.getFullYear())) {
          year = Math.min(year, d.getFullYear());
        }
      });
    }

    return year;
  }, [user, problems, currentRealYear]);

  const maxYear = currentRealYear;
  const isBackDisabled = selectedYear <= minYear;
  const isForwardDisabled = selectedYear >= maxYear;

  // Group problems by YYYY-MM-DD
  const countsByDate = useMemo(() => {
    const map = {};
    problems.forEach(p => {
      if (!p) return;
      let dateStr = null;
      if (p.createdAt) {
        if (typeof p.createdAt.toDate === 'function') {
          dateStr = p.createdAt.toDate().toISOString().split('T')[0];
        } else if (typeof p.createdAt === 'string') {
          dateStr = p.createdAt.split('T')[0];
        } else if (typeof p.createdAt === 'number') {
          dateStr = new Date(p.createdAt).toISOString().split('T')[0];
        }
      } else if (p.date) {
        dateStr = String(p.date).split('T')[0];
      }

      if (dateStr) {
        map[dateStr] = (map[dateStr] || 0) + 1;
      }
    });
    return map;
  }, [problems]);

  // Generate calendar grid for selectedYear
  const { weeks, monthHeaders, totalLogsInYear } = useMemo(() => {
    const jan1 = new Date(selectedYear, 0, 1);
    const dec31 = new Date(selectedYear, 11, 31);

    // Start on the Sunday on or before Jan 1
    const startDate = new Date(jan1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End on the Saturday on or after Dec 31
    const endDate = new Date(dec31);
    if (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }

    const weeksArr = [];
    const headers = [];
    let currentWeek = [];
    let yearLogSum = 0;
    let lastMonth = -1;

    const curr = new Date(startDate);
    let weekIdx = 0;

    while (curr <= endDate) {
      const year = curr.getFullYear();
      const month = curr.getMonth();
      const dateNum = curr.getDate();
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(dateNum).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const isCurrentYear = year === selectedYear;
      const count = isCurrentYear ? (countsByDate[dateStr] || 0) : 0;
      if (isCurrentYear) {
        yearLogSum += count;
      }

      if (isCurrentYear && month !== lastMonth && curr.getDay() === 0) {
        headers.push({ monthIndex: month, weekIndex: weekIdx, label: MONTH_NAMES[month] });
        lastMonth = month;
      }

      currentWeek.push({
        dateStr,
        count,
        isCurrentYear,
        dayOfWeek: curr.getDay()
      });

      if (curr.getDay() === 6) {
        weeksArr.push(currentWeek);
        currentWeek = [];
        weekIdx++;
      }

      curr.setDate(curr.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeksArr.push(currentWeek);
    }

    return { weeks: weeksArr, monthHeaders: headers, totalLogsInYear: yearLogSum };
  }, [selectedYear, countsByDate]);

  const getLevel = (count) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count === 3) return 3;
    return 4;
  };

  const totalWeeksCount = Math.max(1, weeks.length);

  return (
    <Card hover={false} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 24px' }}>
      <div>
        {/* Header with Title and Year Selector */}
        <div className="flex flex-between flex-center mb-16 flex-wrap gap-8">
          <div>
            <div style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.9rem', borderBottom: 'var(--bw) solid var(--border)', paddingBottom: '4px' }}>
              📅 CONTRIBUTION HEATMAP
            </div>
            <div className="text-muted" style={{ fontSize: '0.78rem', fontWeight: 700, marginTop: '4px' }}>
              {totalLogsInYear} {totalLogsInYear === 1 ? 'contribution' : 'contributions'} in {selectedYear}
            </div>
          </div>

          {/* Year Navigation with account creation boundary check */}
          <div className="flex flex-center gap-4" style={{ border: 'var(--bw) solid var(--border)', boxShadow: '2px 2px 0px var(--border)', background: 'var(--bg2)', padding: '2px 8px' }}>
            <button
              type="button"
              disabled={isBackDisabled}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
                cursor: isBackDisabled ? 'not-allowed' : 'pointer',
                opacity: isBackDisabled ? 0.3 : 1,
                fontSize: '0.75rem',
                fontWeight: 900,
                color: 'var(--text)',
                padding: '2px 4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.2s ease'
              }}
              onClick={() => !isBackDisabled && setSelectedYear(prev => prev - 1)}
              title={isBackDisabled ? `Cannot view prior to account creation (${minYear})` : "Previous Year"}
            >
              ◀
            </button>
            <span style={{ fontWeight: 900, fontSize: '0.85rem', padding: '0 6px' }}>{selectedYear}</span>
            <button
              type="button"
              disabled={isForwardDisabled}
              style={{
                background: 'none',
                border: 'none',
                outline: 'none',
                boxShadow: 'none',
                cursor: isForwardDisabled ? 'not-allowed' : 'pointer',
                opacity: isForwardDisabled ? 0.3 : 1,
                fontSize: '0.75rem',
                fontWeight: 900,
                color: 'var(--text)',
                padding: '2px 4px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'opacity 0.2s ease'
              }}
              onClick={() => !isForwardDisabled && setSelectedYear(prev => prev + 1)}
              title={isForwardDisabled ? "Cannot view future years" : "Next Year"}
            >
              ▶
            </button>
          </div>
        </div>

        {/* Heatmap Grid Wrapper */}
        <div style={{ width: '100%', overflow: 'hidden' }}>
          {/* Month Header Row */}
          <div style={{ display: 'flex', marginLeft: '24px', marginBottom: '4px', position: 'relative', height: '16px', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text2)' }}>
            {monthHeaders.map((m, idx) => (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${(m.weekIndex / totalWeeksCount) * 100}%`,
                  whiteSpace: 'nowrap'
                }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Grid Container */}
          <div style={{ display: 'flex', gap: '4px', width: '100%', alignItems: 'flex-start' }}>
            {/* Day Labels Column */}
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gap: '2px', marginRight: '4px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text2)', height: '100%', width: '20px' }}>
              {DAY_LABELS.map((d, i) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Weeks Columns auto-calculated to fit width */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${totalWeeksCount}, 1fr)`, gap: '2px', width: 'calc(100% - 24px)' }}>
              {weeks.map((week, wIdx) => (
                <div key={wIdx} style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gap: '2px' }}>
                  {week.map((day) => {
                    const level = day.isCurrentYear ? getLevel(day.count) : 0;
                    return (
                      <div
                        key={day.dateStr}
                        title={day.isCurrentYear ? `${day.count} ${day.count === 1 ? 'log' : 'logs'} on ${day.dateStr}` : ''}
                        style={{
                          width: '100%',
                          aspectRatio: '1/1',
                          borderRadius: '2px',
                          background: LEVEL_COLORS[level],
                          border: '1px solid var(--border)',
                          opacity: day.isCurrentYear ? 1 : 0.25,
                          cursor: day.isCurrentYear ? 'pointer' : 'default',
                          transition: 'background 0.2s ease'
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-end flex-center gap-6 mt-16" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text2)' }}>
        <span>Less</span>
        {LEVEL_COLORS.map((col, idx) => (
          <div
            key={idx}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '2px',
              background: col,
              border: '1px solid var(--border)'
            }}
          />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
};

export default ContributionHeatmap;
