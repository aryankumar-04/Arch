import { useEffect, useState } from 'react';
import { useCodingStore } from '../store';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import { TrashIcon, PlusIcon, SearchIcon } from '../components/common/Icons';
import { useDebounce } from '../utils/useDebounce';

const Coding = () => {
  const { problems, loading, fetchCodingData, addProblem, deleteProblem } = useCodingStore();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [newProb, setNewProb] = useState({
    title: '',
    platform: 'LeetCode',
    difficulty: 'Easy',
    notes: ''
  });

  useEffect(() => {
    fetchCodingData();
  }, [fetchCodingData]);

  const handleAddProblem = (e) => {
    e.preventDefault();
    if (newProb.title.trim()) {
      addProblem(newProb);
      setNewProb({ title: '', platform: 'LeetCode', difficulty: 'Easy', notes: '' });
    }
  };

  const totalCount = problems.length;
  const easyCount = problems.filter(p => p.difficulty === 'Easy').length;
  const mediumCount = problems.filter(p => p.difficulty === 'Medium').length;
  const hardCount = problems.filter(p => p.difficulty === 'Hard').length;

  const filteredProblems = problems.filter(p => {
    const matchesPlatform = platformFilter === 'ALL' ? true : p.platform === platformFilter;
    const query = debouncedSearchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      p.title.toLowerCase().includes(query) ||
      (p.notes && p.notes.toLowerCase().includes(query)) ||
      (p.platform && p.platform.toLowerCase().includes(query));

    return matchesPlatform && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1>💻 CODING LOGS</h1>
      </div>

      {/* Metrics Row */}
      <div className="grid-4 mb-24">
        <StatCard value={totalCount} label="TOTAL LOGS" bg="#FFFFFF" color="var(--text)" />
        <StatCard value={easyCount} label="EASY SOLVED" bg="#ecfdf5" color="var(--green)" />
        <StatCard value={mediumCount} label="MEDIUM SOLVED" bg="#fffbeb" color="var(--orange)" />
        <StatCard value={hardCount} label="HARD SOLVED" bg="#fef2f2" color="var(--red)" />
      </div>

      {/* Log Problem / GitHub Push Form */}
      <Card className="mb-24">
        <h3 className="card-title">➕ LOG CODING PROBLEM OR GITHUB PROJECT PUSH</h3>
        <form onSubmit={handleAddProblem} className="form-row flex-wrap">
          <input
            className="form-input"
            type="text"
            placeholder="Title (e.g. Two Sum, Implemented Auth Feature)"
            value={newProb.title}
            onChange={e => setNewProb({ ...newProb, title: e.target.value })}
            required
            style={{ flex: 2, minWidth: '220px' }}
          />
          <select
            className="form-select"
            style={{ maxWidth: '160px' }}
            value={newProb.platform}
            onChange={e => setNewProb({ ...newProb, platform: e.target.value })}
          >
            <option value="LeetCode">LeetCode</option>
            <option value="GitHub Push">GitHub Push</option>
            <option value="HackerRank">HackerRank</option>
            <option value="Codeforces">Codeforces</option>
            <option value="Project / Custom">Project / Custom</option>
          </select>
          <select
            className="form-select"
            style={{ maxWidth: '120px' }}
            value={newProb.difficulty}
            onChange={e => setNewProb({ ...newProb, difficulty: e.target.value })}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <input
            className="form-input"
            type="text"
            placeholder="Notes / Repo Link / Approach (Optional)"
            value={newProb.notes}
            onChange={e => setNewProb({ ...newProb, notes: e.target.value })}
            style={{ flex: 2, minWidth: '200px' }}
          />
          <Button type="submit" variant="primary" icon={<PlusIcon />}>
            LOG
          </Button>
        </form>
      </Card>

      {/* Filter and Search Row */}
      <div className="flex flex-between gap-16 mb-24" style={{ flexWrap: 'wrap' }}>
        <div className="topbar-search" style={{ maxWidth: '300px' }}>
          <SearchIcon size={16} />
          <input
            type="text"
            placeholder="Search coding logs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'inline-flex', border: 'var(--bw) solid var(--border)', boxShadow: '3px 3px 0px var(--border)' }}>
          {['ALL', 'LeetCode', 'GitHub Push', 'HackerRank', 'Codeforces'].map((plat, idx, arr) => (
            <button
              key={plat}
              className={`btn ${platformFilter === plat ? 'btn-primary' : 'btn-ghost'}`}
              style={{
                borderRadius: 0,
                boxShadow: 'none',
                border: 'none',
                borderRight: idx < arr.length - 1 ? 'var(--bw) solid var(--border)' : 'none'
              }}
              onClick={() => setPlatformFilter(plat)}
            >
              {plat}
            </button>
          ))}
        </div>
      </div>

      {/* Logged Activities List */}
      <div className="flex" style={{ flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div className="empty-state">Loading coding logs...</div>
        ) : filteredProblems.length === 0 ? (
          <div className="empty-state">No coding logs found. Time to grind!</div>
        ) : (
          filteredProblems.map(p => {
            const diffColor = p.difficulty === 'Easy' ? 'var(--green)' : p.difficulty === 'Medium' ? 'var(--orange)' : 'var(--red)';
            return (
              <Card key={p.id} className="card-hover flex flex-between flex-center" style={{ borderLeft: `6px solid ${diffColor}` }}>
                <div>
                  <div className="flex align-center gap-8 mb-4">
                    <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.05rem', textTransform: 'uppercase' }}>{p.title}</h3>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{p.platform || 'LeetCode'}</span>
                    <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>{p.difficulty}</span>
                  </div>
                  {p.notes && <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{p.notes}</div>}
                </div>
                <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => deleteProblem(p.id)} title="Delete Log">
                  <TrashIcon size={16} />
                </button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Coding;
