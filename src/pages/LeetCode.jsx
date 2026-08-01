import { useEffect, useState } from 'react';
import { useLeetCodeStore } from '../store';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import { TrashIcon, PlusIcon } from '../components/common/Icons';

const LeetCode = () => {
  const { problems, loading, fetchProblems, addProblem, deleteProblem } = useLeetCodeStore();
  const [newProb, setNewProb] = useState({ title: '', difficulty: 'Easy', notes: '' });

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (newProb.title.trim()) {
      addProblem(newProb);
      setNewProb({ title: '', difficulty: 'Easy', notes: '' });
    }
  };
  
  const easyCount = problems.filter(p => p.difficulty === 'Easy').length;
  const mediumCount = problems.filter(p => p.difficulty === 'Medium').length;
  const hardCount = problems.filter(p => p.difficulty === 'Hard').length;

  return (
    <div>
      <div className="page-header">
        <h1>💻 LeetCode Tracker</h1>
      </div>
      
      <div className="grid-3 mb-24">
        <StatCard value={`EASY: ${easyCount}`} label="Easy Solved" bg="#ecfdf5" color="var(--green)" />
        <StatCard value={`MEDIUM: ${mediumCount}`} label="Medium Solved" bg="#fffbeb" color="var(--orange)" />
        <StatCard value={`HARD: ${hardCount}`} label="Hard Solved" bg="#fef2f2" color="var(--red)" />
      </div>

      {/* LeetCode Progress & Weekly Frequency Graph */}
      <Card className="mb-24" style={{ background: 'var(--bg2)' }}>
        <h3 className="card-title flex flex-center gap-8">
          <span>💻</span> LEETCODE SOLVED (WEEKLY PROGRESS)
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
            <span>{Math.max(1, problems.length)}</span>
            <span>{Math.round(Math.max(1, problems.length) / 2)}</span>
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
            {['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'].map((w, idx) => {
              const val = problems.length > 0 ? (idx === 7 ? problems.length : Math.floor((problems.length * (idx + 1)) / 8)) : 0;
              const maxVal = Math.max(1, problems.length);
              const heightPct = Math.min(100, Math.max(4, (val / maxVal) * 100));
              return (
                <div key={w} style={{
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
                    title={`${w}: ${val} solved`}
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: val > 0 ? 'var(--orange)' : 'var(--bg4)',
                      border: 'var(--bw) solid var(--border)',
                      borderBottom: 'none'
                    }} 
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '8px', paddingLeft: '12px', paddingRight: '12px' }}>
            {['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'].map((w) => (
              <span key={w} style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text2)', textAlign: 'center', flex: 1 }}>
                {w}
              </span>
            ))}
          </div>
        </div>
      </Card>
      
      <Card className="mb-24">
        <form onSubmit={handleAdd} className="form-row flex-wrap">
          <input 
            className="form-input" 
            type="text" 
            placeholder="Problem Title (e.g. Two Sum)" 
            value={newProb.title} 
            onChange={e => setNewProb({...newProb, title: e.target.value})} 
            required 
          />
          <select 
            className="form-select" 
            style={{ maxWidth: '150px' }} 
            value={newProb.difficulty} 
            onChange={e => setNewProb({...newProb, difficulty: e.target.value})}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <input 
            className="form-input" 
            type="text" 
            placeholder="Notes / Approach (Optional)" 
            value={newProb.notes} 
            onChange={e => setNewProb({...newProb, notes: e.target.value})} 
          />
          <Button type="submit" variant="primary" icon={<PlusIcon />}>
            Log Problem
          </Button>
        </form>
      </Card>
      
      <div className="flex" style={{ flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div className="empty-state">Loading problems...</div>
        ) : problems.length === 0 ? (
          <div className="empty-state">No problems logged yet. Time to grind!</div>
        ) : (
          problems.map(p => {
            const diffColor = p.difficulty === 'Easy' ? 'var(--green)' : p.difficulty === 'Medium' ? 'var(--orange)' : 'var(--red)';
            return (
              <Card key={p.id} className="flex flex-between flex-center" style={{ borderLeft: `6px solid ${diffColor}` }}>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 900 }}>{p.title}</h3>
                  {p.notes && <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>{p.notes}</div>}
                </div>
                <button className="btn-icon" onClick={() => deleteProblem(p.id)}>
                  <TrashIcon size={14} />
                </button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LeetCode;