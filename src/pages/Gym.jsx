import { useEffect, useState } from 'react';
import { useGymStore } from '../store';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { TrashIcon, PlusIcon } from '../components/common/Icons';

const getLocalYMD = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const Gym = () => {
  const { workouts, loading, fetchWorkouts, addWorkout, deleteWorkout } = useGymStore();
  
  const [date, setDate] = useState(getLocalYMD());
  const [split, setSplit] = useState('Push');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');

  const splits = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'Rest'];

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  const handleAddWorkout = async (e) => {
    e.preventDefault();
    if (!split) return;
    
    await addWorkout({
      date,
      split,
      duration: duration || '45',
      notes
    });
    
    // Reset form
    setDate(getLocalYMD());
    setNotes('');
    setDuration('');
  };

  const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
  const gymFreqData = weeks.map((w, idx) => ({
    label: w,
    value: workouts.length > 0 ? (idx === 7 ? workouts.length : Math.floor((workouts.length * (idx + 1)) / 8)) : 0
  }));
  const maxGymVal = Math.max(1, workouts.length);

  return (
    <div>
      <div className="page-header">
        <h1>🏋️ Gym Tracker</h1>
      </div>

      {/* Gym Frequency Chart Card */}
      <Card className="mb-24" style={{ background: 'var(--bg2)' }}>
        <h3 className="card-title flex flex-center gap-8">
          <span>🏋️</span> GYM FREQUENCY
        </h3>
        <div style={{ position: 'relative', width: '100%', padding: '16px 12px 8px 36px' }}>
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
            <span>{maxGymVal}</span>
            <span>{Math.round(maxGymVal / 2)}</span>
            <span>0</span>
          </div>
          <div style={{
            height: '160px',
            border: 'var(--bw) solid var(--border)',
            background: '#FFF',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            padding: '0 12px'
          }}>
            {[0, 50].map(pct => (
              <div key={pct} style={{
                position: 'absolute',
                top: `${pct}%`,
                left: 0,
                right: 0,
                borderTop: '1px dashed var(--bg4)',
                pointerEvents: 'none'
              }} />
            ))}
            {gymFreqData.map((d, i) => {
              const heightPct = maxGymVal > 0 ? Math.min(100, Math.max(4, (d.value / maxGymVal) * 100)) : 4;
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
                    title={`${d.label}: ${d.value} workouts`}
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: d.value > 0 ? 'var(--accent)' : 'var(--bg4)',
                      border: 'var(--bw) solid var(--border)',
                      borderBottom: 'none'
                    }} 
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '8px', paddingLeft: '12px', paddingRight: '12px' }}>
            {gymFreqData.map((d, i) => (
              <span key={i} style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text2)', textAlign: 'center', flex: 1 }}>
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <Card className="mb-24">
        <form onSubmit={handleAddWorkout} className="flex" style={{ flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>Log a Workout</div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Date</label>
              <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Duration (mins)</label>
              <input type="number" className="form-input" placeholder="e.g. 60" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Workout Split</label>
            <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
              {splits.map(s => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={split === s ? 'dark' : 'ghost'}
                  onClick={() => setSplit(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Routine / Notes</label>
            <textarea 
              className="form-textarea"
              placeholder="e.g. Bench Press 3x10 (60kg)&#10;Incline Dumbbell Press 3x12 (20kg)" 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
            />
          </div>

          <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start' }} icon={<PlusIcon />}>
            Save Workout
          </Button>
        </form>
      </Card>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '16px' }}>Workout History</h2>
      
      <div className="dash-grid">
        {loading ? (
          <div className="empty-state">Loading workouts...</div>
        ) : workouts.length === 0 ? (
          <div className="empty-state">No workouts logged yet. Time to hit the iron!</div>
        ) : (
          workouts.map(workout => (
            <Card key={workout.id} style={{ position: 'relative', background: 'var(--bg2)' }}>
              <button 
                className="btn-icon"
                onClick={() => deleteWorkout(workout.id)}
                style={{ position: 'absolute', top: '12px', right: '12px' }}
                title="Delete Workout"
              >
                <TrashIcon size={14} />
              </button>

              <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 800, marginBottom: '4px' }}>
                {workout.date}
              </div>

              <h3 style={{ margin: '0 0 12px 0', paddingRight: '40px', fontWeight: 900, fontSize: '1.4rem', color: 'var(--accent)' }}>
                {workout.split}
              </h3>
              
              <div style={{ fontWeight: 800, marginBottom: '12px' }}>
                ⏱️ {workout.duration} minutes
              </div>

              {workout.notes && (
                <div className="card" style={{ padding: '12px', background: 'var(--bg)', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                  {workout.notes}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Gym;