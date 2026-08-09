import { useEffect, useState } from 'react';
import { useJournalStore } from '../store';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Skeleton from '../components/common/Skeleton';
import DuplicateErrorBanner from '../components/common/DuplicateErrorBanner';
import { PlusIcon, CalendarIcon } from '../components/common/Icons';

export const getTotalSleepHours = (entry) => {
  if (!entry) return 0;

  // 1. Night Sleep Duration
  let nightHours = 0;
  if (typeof entry.sleepCycle?.duration === 'number') {
    nightHours = entry.sleepCycle.duration;
  } else if (entry.sleepHours) {
    nightHours = parseFloat(entry.sleepHours) || 0;
  }

  // 2. Evening Nap Duration
  let napHours = 0;
  if (typeof entry.eveningNap?.duration === 'number') {
    napHours = entry.eveningNap.duration;
  } else if (entry.napHours) {
    napHours = parseFloat(entry.napHours) || 0;
  }

  return nightHours + napHours;
};

// Mood to color mapping for Heatmap
export const MOOD_COLORS = {
  '😄': '#FACC15', // Great / Ecstatic -> Cyber Amber
  '🙂': '#10B981', // Good -> Emerald Mint
  '😐': '#3B82F6', // Neutral -> Cobalt Blue
  '😕': '#F59E0B', // Meh -> Orange
  '😫': '#EF4444'  // Stressed / Terrible -> Crimson Red
};

export const getMoodColor = (moodEmoji) => {
  if (!moodEmoji) return '#FACC15';
  if (MOOD_COLORS[moodEmoji]) return MOOD_COLORS[moodEmoji];
  if (moodEmoji.includes('😄') || moodEmoji.includes('😊') || moodEmoji.includes('😃')) return '#FACC15';
  if (moodEmoji.includes('🙂') || moodEmoji.includes('👍')) return '#10B981';
  if (moodEmoji.includes('😐') || moodEmoji.includes('😶')) return '#3B82F6';
  if (moodEmoji.includes('😕') || moodEmoji.includes('🙁')) return '#F59E0B';
  if (moodEmoji.includes('😫') || moodEmoji.includes('😢') || moodEmoji.includes('😡')) return '#EF4444';
  return '#FACC15';
};

const getLast30Days = () => {
  const dates = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

const Journal = () => {
  const { entries, loading, fetchEntries, addEntry, updateEntry, deleteEntry } = useJournalStore();
  const [selectedId, setSelectedId] = useState(null);
  const [entryLimit, setEntryLimit] = useState(20);

  // Custom date picker modal
  const [isPastDateModalOpen, setIsPastDateModalOpen] = useState(false);
  const [customDateInput, setCustomDateInput] = useState(new Date().toISOString().split('T')[0]);

  // Validation error state for Sleep + Nap total duration exceeding 24 hours
  const [sleepErrorMsg, setSleepErrorMsg] = useState(null);

  // Local time picker inputs to allow editing while blocking save on validation errors
  const [sleepTimeInput, setSleepTimeInput] = useState('23:00');
  const [wakeTimeInput, setWakeTimeInput] = useState('07:00');
  const [napStartInput, setNapStartInput] = useState('');
  const [napEndInput, setNapEndInput] = useState('');

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Auto-select or create Today's entry when entries exist or when user is authenticated
  useEffect(() => {
    if (!loading) {
      const today = new Date().toISOString().split('T')[0];
      const existingToday = entries.find(e => e.date === today);

      if (existingToday) {
        if (!selectedId) setSelectedId(existingToday.id);
      } else if (entries.length > 0) {
        if (!selectedId) setSelectedId(entries[0].id);
      } else {
        handleCreateToday();
      }
    }
  }, [loading, entries, selectedId]);

  // Find active selected entry
  const activeEntry = entries.find(e => e.id === selectedId) || entries[0];

  // Sync local time inputs with active entry when active entry changes
  useEffect(() => {
    if (activeEntry) {
      setSleepTimeInput(activeEntry.sleepTime || '23:00');
      setWakeTimeInput(activeEntry.wakeTime || '07:00');
      setNapStartInput(activeEntry.napStartTime || activeEntry.eveningNap?.napStart || '');
      setNapEndInput(activeEntry.napEndTime || activeEntry.eveningNap?.napEnd || '');
    }
  }, [
    activeEntry?.id, 
    activeEntry?.sleepTime, 
    activeEntry?.wakeTime, 
    activeEntry?.napStartTime, 
    activeEntry?.napEndTime,
    activeEntry?.eveningNap?.napStart,
    activeEntry?.eveningNap?.napEnd
  ]);

  // Helper to calculate hours between two HH:MM time strings
  const calcTimeDiffHours = (startTimeVal, endTimeVal) => {
    if (!startTimeVal || !endTimeVal) return 0;
    const [sH, sM] = startTimeVal.split(':').map(Number);
    const [eH, eM] = endTimeVal.split(':').map(Number);
    if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 0;
    let start = sH * 60 + sM;
    let end = eH * 60 + eM;
    if (end <= start) end += 24 * 60;
    return (end - start) / 60;
  };

  // Real-time validation check on active entry
  useEffect(() => {
    if (!activeEntry) {
      setSleepErrorMsg(null);
      return;
    }
    const night = parseFloat(activeEntry.sleepHours || activeEntry.sleepCycle?.duration || 0) || 0;
    const nap = parseFloat(activeEntry.napHours || activeEntry.eveningNap?.duration || 0) || 0;
    const total = Number((night + nap).toFixed(1));

    if (total > 24.0) {
      setSleepErrorMsg(`Total sleep + nap duration (${total.toFixed(1)} hrs) exceeds the 24-hour limit in a single day.`);
    } else {
      setSleepErrorMsg(null);
    }
  }, [
    activeEntry?.id, 
    activeEntry?.sleepHours, 
    activeEntry?.napHours, 
    activeEntry?.sleepTime, 
    activeEntry?.wakeTime, 
    activeEntry?.napStartTime, 
    activeEntry?.napEndTime,
    activeEntry?.sleepCycle?.duration,
    activeEntry?.eveningNap?.duration
  ]);

  const last30Days = getLast30Days();

  const handleCellClick = async (dateStr) => {
    const existing = entries.find(e => e.date === dateStr);
    if (existing) {
      setSelectedId(existing.id);
    } else {
      const newEntry = await addEntry(dateStr);
      if (newEntry) setSelectedId(newEntry.id);
    }
  };

  const handleCreateToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    const existing = entries.find(e => e.date === today);

    if (existing) {
      setSelectedId(existing.id);
    } else {
      const newEntry = await addEntry(today);
      if (newEntry) setSelectedId(newEntry.id);
    }
  };

  const handleCreateCustomDate = async (e) => {
    e.preventDefault();
    if (!customDateInput) return;

    const existing = entries.find(e => e.date === customDateInput);
    if (existing) {
      setSelectedId(existing.id);
    } else {
      const newEntry = await addEntry(customDateInput);
      if (newEntry) setSelectedId(newEntry.id);
    }
    setIsPastDateModalOpen(false);
  };

  const handleChange = (field, value) => {
    if (!activeEntry) return;
    updateEntry(activeEntry.id, { [field]: value });
  };

  const handleHabitToggle = (habitKey) => {
    if (!activeEntry) return;
    const currentHabits = activeEntry.habits || {};
    const updatedHabits = {
      ...currentHabits,
      [habitKey]: !currentHabits[habitKey]
    };
    updateEntry(activeEntry.id, { habits: updatedHabits });
  };

  // Sleep duration calculator with 24h total validation (BLOCKS SAVE IF EXCEEDED)
  const handleSleepTimeChange = (sleepTimeVal, wakeTimeVal) => {
    if (!activeEntry) return;
    setSleepTimeInput(sleepTimeVal);
    setWakeTimeInput(wakeTimeVal);

    let nightHoursNum = 8.0;
    if (sleepTimeVal && wakeTimeVal) {
      nightHoursNum = calcTimeDiffHours(sleepTimeVal, wakeTimeVal);
    }

    const nightHoursStr = nightHoursNum.toFixed(1);
    const currentNapHours = (napStartInput && napEndInput) 
      ? calcTimeDiffHours(napStartInput, napEndInput) 
      : (parseFloat(activeEntry.napHours || activeEntry.eveningNap?.duration || 0) || 0);

    const totalCandidate = Number((nightHoursNum + currentNapHours).toFixed(1));

    if (totalCandidate > 24.0) {
      setSleepErrorMsg(`Total sleep + nap duration (${totalCandidate.toFixed(1)} hrs) exceeds the 24-hour limit in a single day.`);
      // DO NOT save or update store/analytics when invalid!
      return;
    }

    setSleepErrorMsg(null);

    const sleepCycle = {
      bedtime: sleepTimeVal,
      wakeTime: wakeTimeVal,
      duration: nightHoursNum,
      quality: activeEntry.sleepQuality || 'Restful'
    };

    updateEntry(activeEntry.id, {
      sleepTime: sleepTimeVal,
      wakeTime: wakeTimeVal,
      sleepHours: nightHoursStr,
      sleepCycle
    });
  };

  // Nap duration calculator with 24h total validation (BLOCKS SAVE IF EXCEEDED)
  const handleNapTimeChange = (napStartVal, napEndVal) => {
    if (!activeEntry) return;
    setNapStartInput(napStartVal);
    setNapEndInput(napEndVal);

    let napHoursNum = 0.0;
    if (napStartVal && napEndVal) {
      napHoursNum = calcTimeDiffHours(napStartVal, napEndVal);
    }

    const napHoursStr = napHoursNum.toFixed(1);
    const currentNightHours = (sleepTimeInput && wakeTimeInput)
      ? calcTimeDiffHours(sleepTimeInput, wakeTimeInput)
      : (parseFloat(activeEntry.sleepHours || activeEntry.sleepCycle?.duration || 0) || 0);

    const totalCandidate = Number((currentNightHours + napHoursNum).toFixed(1));

    if (totalCandidate > 24.0) {
      setSleepErrorMsg(`Total sleep + nap duration (${totalCandidate.toFixed(1)} hrs) exceeds the 24-hour limit in a single day.`);
      // DO NOT save or update store/analytics when invalid!
      return;
    }

    setSleepErrorMsg(null);

    const eveningNap = {
      napStart: napStartVal || '',
      napEnd: napEndVal || '',
      duration: napHoursNum,
      quality: activeEntry.napQuality || activeEntry.eveningNap?.quality || 'Restful'
    };

    updateEntry(activeEntry.id, {
      napStartTime: napStartVal,
      napEndTime: napEndVal,
      napHours: napHoursStr,
      eveningNap
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1>📓 Daily Journal</h1>
        <div className="flex gap-12">
          <Button variant="ghost" icon={<CalendarIcon />} onClick={() => setIsPastDateModalOpen(true)}>
            Past Date Entry
          </Button>
          <Button variant="primary" icon={<PlusIcon />} onClick={handleCreateToday}>
            Today's Entry
          </Button>
        </div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '280px 1fr', gap: '20px' }}>
        {/* Left Column (Heatmap + Entries List) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 30-Day Mood Heatmap Card */}
          <Card style={{ padding: '16px' }}>
            <div className="card-title mb-12">
              📅 30-DAY MOOD HEATMAP
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
              {last30Days.map(dateStr => {
                const entry = entries.find(e => e.date === dateStr);
                const isSelected = activeEntry && activeEntry.date === dateStr;

                if (!entry) {
                  return (
                    <div
                      key={dateStr}
                      onClick={() => handleCellClick(dateStr)}
                      title={`${dateStr} (No entry)`}
                      style={{
                        width: '100%',
                        aspectRatio: '1/1',
                        background: 'var(--bg)',
                        border: 'var(--bw) solid var(--border)',
                        boxShadow: isSelected ? '2px 2px 0 var(--border)' : 'none',
                        borderRadius: '2px',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        color: 'var(--text3)',
                        fontWeight: 900,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      •
                    </div>
                  );
                }

                const bgColor = getMoodColor(entry.mood);

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleCellClick(dateStr)}
                    title={`${dateStr}: ${entry.mood || 'Logged'}`}
                    style={{
                      width: '100%',
                      aspectRatio: '1/1',
                      background: bgColor,
                      border: 'var(--bw) solid var(--border)',
                      boxShadow: isSelected ? '3px 3px 0 var(--border)' : '1px 1px 0 var(--border)',
                      borderRadius: '2px',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      transform: isSelected ? 'translate(-1px, -1px)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {entry.mood || '🙂'}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Sidebar List */}
          <Card style={{ height: 'fit-content', maxHeight: 'calc(100vh - 360px)', overflowY: 'auto', padding: '16px' }}>
            <div className="card-title flex flex-between align-center">
              <span>ENTRIES ({entries.length})</span>
              <button
                onClick={() => setIsPastDateModalOpen(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 900, color: 'var(--accent)' }}
              >
                + PAST DATE
              </button>
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
                <Skeleton type="text" count={4} height="48px" />
              </div>
            ) : entries.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.8rem', padding: '16px 0' }}>No entries yet</p>
            ) : (
              <>
                {entries.slice(0, entryLimit).map(entry => (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedId(entry.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginBottom: '8px',
                      background: activeEntry && activeEntry.id === entry.id ? 'var(--yellow)' : 'var(--bg)',
                      border: 'var(--bw) solid var(--border)',
                      boxShadow: activeEntry && activeEntry.id === entry.id ? '3px 3px 0 var(--border)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div className="flex flex-between align-center">
                      <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{entry.date}</div>
                      {entry.date === new Date().toISOString().split('T')[0] && (
                        <span className="badge badge-green" style={{ fontSize: '0.6rem' }}>TODAY</span>
                      )}
                    </div>
                    <div className="text-muted truncate" style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
                      {entry.mood || '🙂'} 😴 {getTotalSleepHours(entry).toFixed(1)}h | 💧 {entry.waterGlasses || 0}g | {entry.event || 'No highlight'}
                    </div>
                  </div>
                ))}
                {entries.length > entryLimit && (
                  <button
                    className="btn btn-sm btn-ghost width-full mt-8"
                    onClick={() => setEntryLimit(prev => prev + 20)}
                    style={{ width: '100%', fontSize: '0.75rem' }}
                  >
                    + {entries.length - entryLimit} MORE ENTRIES
                  </button>
                )}
              </>
            )}
          </Card>
        </div>

        {/* Editor Area (ALWAYS OPEN ON VIEW!) */}
        <Card>
          {!activeEntry ? (
            <div className="empty-state">
              Creating Today's Journal Entry...
            </div>
          ) : (
            <div>
              <div className="flex-between mb-24">
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>{activeEntry.date}</h2>
                  <span className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    {activeEntry.date === new Date().toISOString().split('T')[0] ? '🌟 Today\'s Activity Log' : '📅 Past Date Activity Log'}
                  </span>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    deleteEntry(activeEntry.id);
                    setSelectedId(null);
                  }}
                >
                  Delete Entry
                </Button>
              </div>

              {/* Mood Selector */}
              <div className="form-group">
                <label>Mood</label>
                <div className="mood-selector">
                  {['😫', '😕', '😐', '🙂', '😄'].map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`mood-btn ${activeEntry.mood === m ? 'selected' : ''}`}
                      onClick={() => handleChange('mood', m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* TRACKER 1: Sleep Cycle Tracking */}
              <div className="mb-20" style={{ background: 'var(--bg)', padding: '16px', border: 'var(--bw) solid var(--border)' }}>
                <div className="card-title mb-12 flex align-center gap-8">
                  <span>😴</span> SLEEP CYCLE TRACKER
                </div>

                {sleepErrorMsg && (
                  <DuplicateErrorBanner
                    title="SLEEP DURATION EXCEEDED"
                    message={sleepErrorMsg}
                    onClose={() => setSleepErrorMsg(null)}
                    autoDismissMs={0}
                  />
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>BEDTIME</label>
                    <input
                      type="time"
                      className="form-input"
                      value={sleepTimeInput}
                      onChange={(e) => handleSleepTimeChange(e.target.value, wakeTimeInput)}
                    />
                  </div>

                  <div className="form-group">
                    <label>WAKE TIME</label>
                    <input
                      type="time"
                      className="form-input"
                      value={wakeTimeInput}
                      onChange={(e) => handleSleepTimeChange(sleepTimeInput, e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>SLEEP DURATION</label>
                    <input
                      type="text"
                      className="form-input"
                      value={`${calcTimeDiffHours(sleepTimeInput, wakeTimeInput).toFixed(1)} HRS`}
                      readOnly
                      style={{ fontWeight: 900, background: 'var(--bg2)', color: 'var(--text)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>SLEEP QUALITY</label>
                    <select
                      className="form-select"
                      value={activeEntry.sleepQuality || 'Restful'}
                      onChange={(e) => {
                        const newQuality = e.target.value;
                        const sleepCycle = {
                          bedtime: sleepTimeInput,
                          wakeTime: wakeTimeInput,
                          duration: calcTimeDiffHours(sleepTimeInput, wakeTimeInput),
                          quality: newQuality
                        };
                        updateEntry(activeEntry.id, {
                          sleepQuality: newQuality,
                          sleepCycle
                        });
                      }}
                    >
                      <option value="Restful">Restful</option>
                      <option value="Deep">Deep</option>
                      <option value="Interrupted">Interrupted</option>
                      <option value="Light">Light</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TRACKER 1.5: Evening Nap Tracker */}
              <div className="mb-20" style={{ background: 'var(--bg)', padding: '16px', border: 'var(--bw) solid var(--border)' }}>
                <div className="card-title mb-12 flex align-center gap-8">
                  <span>🌙</span> EVENING NAP TRACKER
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>NAP START TIME</label>
                    <input
                      type="time"
                      className="form-input"
                      value={napStartInput}
                      onChange={(e) => handleNapTimeChange(e.target.value, napEndInput)}
                    />
                  </div>

                  <div className="form-group">
                    <label>NAP END TIME</label>
                    <input
                      type="time"
                      className="form-input"
                      value={napEndInput}
                      onChange={(e) => handleNapTimeChange(napStartInput, e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>NAP DURATION</label>
                    <input
                      type="text"
                      className="form-input"
                      value={`${calcTimeDiffHours(napStartInput, napEndInput).toFixed(1)} HRS`}
                      readOnly
                      style={{ fontWeight: 900, background: 'var(--bg2)', color: 'var(--text)' }}
                    />
                  </div>

                  <div className="form-group">
                    <label>NAP QUALITY</label>
                    <select
                      className="form-select"
                      value={activeEntry.napQuality || activeEntry.eveningNap?.quality || 'Restful'}
                      onChange={(e) => {
                        const newQuality = e.target.value;
                        const eveningNap = {
                          napStart: activeEntry.napStartTime || activeEntry.eveningNap?.napStart || '',
                          napEnd: activeEntry.napEndTime || activeEntry.eveningNap?.napEnd || '',
                          duration: parseFloat(activeEntry.napHours || activeEntry.eveningNap?.duration || 0),
                          quality: newQuality
                        };
                        updateEntry(activeEntry.id, {
                          napQuality: newQuality,
                          eveningNap
                        });
                      }}
                    >
                      <option value="Restful">Restful</option>
                      <option value="Deep">Deep</option>
                      <option value="Interrupted">Interrupted</option>
                      <option value="Light">Light</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* TRACKER 2: Water Intake Tracker */}
              <div className="mb-20" style={{ background: 'var(--bg)', padding: '16px', border: 'var(--bw) solid var(--border)' }}>
                <div className="card-title mb-12 flex flex-between align-center">
                  <span>💧 WATER INTAKE TRACKER</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--accent)' }}>
                    {activeEntry.waterGlasses || 0} / 8 GLASSES
                  </span>
                </div>
                <div className="flex align-center gap-12" style={{ flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '6px', fontSize: '1.4rem' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <span
                        key={i}
                        onClick={() => handleChange('waterGlasses', i)}
                        style={{
                          cursor: 'pointer',
                          opacity: i <= (activeEntry.waterGlasses || 0) ? 1 : 0.25,
                          transition: 'transform 0.15s ease'
                        }}
                        title={`${i} glasses`}
                      >
                        🥛
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-8 ml-auto">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => handleChange('waterGlasses', Math.max(0, (activeEntry.waterGlasses || 0) - 1))}
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-yellow"
                      onClick={() => handleChange('waterGlasses', Math.min(12, (activeEntry.waterGlasses || 0) + 1))}
                    >
                      +1 GLASS 🥛
                    </button>
                  </div>
                </div>
              </div>

              {/* TRACKER 3: Energy & Productivity Levels */}
              <div className="mb-20" style={{ background: 'var(--bg)', padding: '16px', border: 'var(--bw) solid var(--border)' }}>
                <div className="card-title mb-12">⚡ ENERGY & PRODUCTIVITY</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>ENERGY LEVEL (1 - 5)</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(level => (
                        <button
                          key={level}
                          type="button"
                          className={`btn btn-sm ${activeEntry.energyLevel === level ? 'btn-primary' : 'btn-ghost'}`}
                          style={{ flex: 1 }}
                          onClick={() => handleChange('energyLevel', level)}
                        >
                          ⚡ {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>PRODUCTIVITY LEVEL (1 - 5)</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(level => (
                        <button
                          key={level}
                          type="button"
                          className={`btn btn-sm ${activeEntry.productivityLevel === level ? 'btn-yellow' : 'btn-ghost'}`}
                          style={{ flex: 1 }}
                          onClick={() => handleChange('productivityLevel', level)}
                        >
                          🚀 {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* TRACKER 4: Daily Habits Checklist */}
              <div className="mb-20" style={{ background: 'var(--bg)', padding: '16px', border: 'var(--bw) solid var(--border)' }}>
                <div className="card-title mb-12">🧘 DAILY HABITS CHECKLIST</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  {[
                    { key: 'meditation', label: '🧘 Meditated 10m' },
                    { key: 'workout', label: '🏋️ Exercise / Gym' },
                    { key: 'reading', label: '📖 Read 15+ Pages' },
                    { key: 'healthyEating', label: '🥗 Healthy Diet' }
                  ].map(h => {
                    const isChecked = activeEntry.habits && activeEntry.habits[h.key];
                    return (
                      <button
                        key={h.key}
                        type="button"
                        className={`btn ${isChecked ? 'btn-yellow' : 'btn-ghost'}`}
                        style={{ justifyContent: 'flex-start' }}
                        onClick={() => handleHabitToggle(h.key)}
                      >
                        {isChecked ? '✓ ' : '[ ] '} {h.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* TRACKER 5: Gratitude & Daily Highlight */}
              <div className="form-group">
                <label>Highlight of the Day</label>
                <input
                  type="text"
                  className="form-input"
                  value={activeEntry.event || ''}
                  onChange={(e) => handleChange('event', e.target.value)}
                  placeholder="What was the highlight of your day?"
                />
              </div>

              <div className="form-group">
                <label>🙏 3 Things I'm Grateful For</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '80px' }}
                  value={activeEntry.gratitude || ''}
                  onChange={(e) => handleChange('gratitude', e.target.value)}
                  placeholder="1. My health...&#10;2. A good meal...&#10;3. Progress on coding project..."
                />
              </div>

              <div className="form-group">
                <label>Notes & Reflection</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '160px' }}
                  value={activeEntry.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Thoughts, journal reflections, how you felt..."
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Past Date Entry Modal */}
      <Modal isOpen={isPastDateModalOpen} onClose={() => setIsPastDateModalOpen(false)} title="📅 LOG / EDIT ENTRY FOR PAST DATE">
        <form onSubmit={handleCreateCustomDate}>
          <div className="form-group">
            <label>SELECT DATE</label>
            <input
              type="date"
              className="form-input"
              value={customDateInput}
              onChange={(e) => setCustomDateInput(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-between mt-24">
            <button type="button" className="btn btn-ghost" onClick={() => setIsPastDateModalOpen(false)}>
              CANCEL
            </button>
            <button type="submit" className="btn btn-primary">
              OPEN / CREATE ENTRY
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Journal;