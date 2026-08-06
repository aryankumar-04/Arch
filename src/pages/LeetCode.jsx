import { useEffect, useState } from 'react';
import { useCodingStore } from '../store';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { TrashIcon, PlusIcon } from '../components/common/Icons';
import { groupItemsBy8Weeks } from '../utils/weekBuckets';

const LeetCode = () => {
  const { problems, loading, fetchCodingData, addProblem, deleteProblem } = useCodingStore();
  
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [notes, setNotes] = useState('');
  const [link, setLink] = useState('');

  const difficulties = ['Easy', 'Medium', 'Hard'];

  useEffect(() => {
    fetchCodingData();
  }, [fetchCodingData]);

  const handleAddProblem = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    await addProblem({
      title: title.trim(),
      difficulty,
      notes: link ? `${notes}\nLink: ${link}` : notes,
      platform: 'LeetCode'
    });
    
    setTitle('');
    setNotes('');
    setLink('');
    setDifficulty('Easy');
  };

  const codingFreqData = groupItemsBy8Weeks(problems, p => p.createdAt || p.date);
  const maxCodingVal = Math.max(1, ...codingFreqData.map(d => d.value));

  return (
    <div>
      <div className="page-header">
        <h1>👨‍💻 LeetCode Tracker</h1>
      </div>

      {/* LeetCode Activity Chart */}
      <Card className="mb-24" style={{ background: 'var(--bg2)' }}>
        <h3 className="card-title flex flex-center gap-8">
          <span>📊</span> PROBLEMS SOLVED FREQUENCY
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
            <span>{maxCodingVal}</span>
            <span>{Math.round(maxCodingVal / 2)}</span>
            <span>0</span>
          </div>
          <div style={{
            height: '160px',
            border: 'var(--bw) solid var(--border)',
            background: '#FFF',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justify: 'space-around',
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
            {codingFreqData.map((d, i) => {
              const heightPct = maxCodingVal > 0 && d.value > 0 ? Math.min(100, Math.max(6, (d.value / maxCodingVal) * 100)) : 0;
              return (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justify: 'flex-end',
                  flex: 1,
                  maxWidth: '36px',
                  zIndex: 2
                }}>
                  {d.value > 0 && (
                    <div style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--text)', marginBottom: '2px' }}>
                      {d.value}
                    </div>
                  )}
                  <div 
                    title={`${d.label}: ${d.value} solved`}
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: d.value > 0 ? 'var(--orange)' : 'transparent',
                      border: d.value > 0 ? 'var(--bw) solid var(--border)' : 'none',
                      borderBottom: 'none',
                      transition: 'height 0.3s ease'
                    }} 
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '8px', paddingLeft: '12px', paddingRight: '12px' }}>
            {codingFreqData.map((d, i) => (
              <span key={i} style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text2)', textAlign: 'center', flex: 1 }}>
                {d.label}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <Card className="mb-24">
        <form onSubmit={handleAddProblem} className="flex" style={{ flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>Log a LeetCode Problem</div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Problem Title / Number</label>
              <input type="text" className="form-input" placeholder="e.g. 1. Two Sum" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Problem URL (Optional)</label>
              <input type="url" className="form-input" placeholder="https://leetcode.com/problems/..." value={link} onChange={e => setLink(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label>Difficulty</label>
            <div className="flex gap-8">
              {difficulties.map(d => (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={difficulty === d ? (d === 'Easy' ? 'yellow' : d === 'Medium' ? 'primary' : 'danger') : 'ghost'}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </Button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Notes / Approach</label>
            <textarea 
              className="form-textarea"
              placeholder="e.g. Used HashMap for O(N) time complexity." 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
            />
          </div>

          <Button type="submit" variant="primary" style={{ alignSelf: 'flex-start' }} icon={<PlusIcon />}>
            Save Problem Log
          </Button>
        </form>
      </Card>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '16px' }}>Solved Problems</h2>
      
      <div className="dash-grid">
        {loading ? (
          <div className="empty-state">Loading problem logs...</div>
        ) : problems.length === 0 ? (
          <div className="empty-state">No LeetCode problems logged yet. Time to solve some algorithms!</div>
        ) : (
          problems.map(prob => (
            <Card key={prob.id} style={{ position: 'relative', background: 'var(--bg2)' }}>
              <button 
                className="btn-icon"
                onClick={() => deleteProblem(prob.id)}
                style={{ position: 'absolute', top: '12px', right: '12px' }}
                title="Delete Log"
              >
                <TrashIcon size={14} />
              </button>

              <span className={`badge badge-${prob.difficulty === 'Easy' ? 'green' : prob.difficulty === 'Medium' ? 'yellow' : 'red'}`} style={{ marginBottom: '8px' }}>
                {prob.difficulty}
              </span>

              <h3 style={{ margin: '0 0 12px 0', paddingRight: '40px', fontWeight: 900, fontSize: '1.2rem' }}>
                {prob.title}
              </h3>

              {prob.notes && (
                <div className="card" style={{ padding: '12px', background: 'var(--bg)', fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                  {prob.notes}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default LeetCode;