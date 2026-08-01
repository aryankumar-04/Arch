import { useState, useEffect } from 'react';
import { useGoalStore } from '../store';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import { PlusIcon, TrashIcon } from '../components/common/Icons';

const Goals = () => {
  const {
    goals, categories, fetchGoals, addGoal, addCategory, toggleGoalStatus, toggleMilestone, deleteGoal
  } = useGoalStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: 'Short Term',
    targetDate: '',
    milestonesText: ''
  });

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleOpenModal = () => {
    setGoalForm({
      title: '',
      description: '',
      category: categories[0] || 'Short Term',
      targetDate: '',
      milestonesText: ''
    });
    setIsModalOpen(true);
  };

  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (newCatInput.trim()) {
      addCategory(newCatInput);
      setNewCatInput('');
      setIsCatModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goalForm.title.trim()) return;

    const milestones = goalForm.milestonesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, idx) => ({ id: `m_${idx}_${Date.now()}`, title: line, completed: false }));

    await addGoal({
      ...goalForm,
      milestones
    });

    setIsModalOpen(false);
  };

  // Metrics
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const inProgressGoals = goals.filter(g => g.status === 'in_progress').length;

  const getCategoryEmoji = (cat) => {
    if (cat.includes('Short')) return '🏃';
    if (cat.includes('Long')) return '🏔️';
    if (cat.includes('Career') || cat.includes('Work')) return '💼';
    if (cat.includes('Health') || cat.includes('Gym')) return '💪';
    if (cat.includes('Finance') || cat.includes('Money')) return '💰';
    return '🎯';
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1>🎯 GOALS</h1>
        <div className="flex gap-12">
          <button className="btn btn-ghost" onClick={() => setIsCatModalOpen(true)}>
            <PlusIcon size={16} /> CUSTOM CATEGORY
          </button>
          <button className="btn btn-primary" onClick={handleOpenModal}>
            <PlusIcon size={16} /> ADD GOAL
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-3 mb-24">
        <StatCard
          value={totalGoals}
          label="TOTAL GOALS"
          bg="#FFFFFF"
          color="var(--text)"
        />
        <StatCard
          value={completedGoals}
          label="COMPLETED"
          bg="#FFFFFF"
          color="#10B981"
        />
        <StatCard
          value={inProgressGoals}
          label="IN PROGRESS"
          bg="#FFFFFF"
          color="#D97706"
        />
      </div>

      {/* Dynamic Category Sections */}
      {categories.map(cat => {
        const catGoals = goals.filter(g => g.category === cat);
        return (
          <div key={cat} className="mb-32">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.2rem' }}>{getCategoryEmoji(cat)}</span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase' }}>
                {cat}
              </h2>
            </div>

            {catGoals.length === 0 ? (
              <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.9rem', fontStyle: 'italic', paddingLeft: '8px' }}>
                No goals in this category
              </p>
            ) : (
              <div className="dash-grid">
                {catGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    toggleGoalStatus={toggleGoalStatus}
                    toggleMilestone={toggleMilestone}
                    deleteGoal={deleteGoal}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Floating Add Button */}
      <button className="fab-btn" onClick={handleOpenModal} title="Add Goal">
        <PlusIcon size={24} />
      </button>

      {/* Add Custom Category Modal */}
      <Modal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} title="📂 CREATE CUSTOM CATEGORY">
        <form onSubmit={handleAddCategorySubmit}>
          <div className="form-group">
            <label>CATEGORY NAME</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Health & Fitness, Side Projects, Financial Freedom..."
              value={newCatInput}
              onChange={(e) => setNewCatInput(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-between mt-24">
            <button type="button" className="btn btn-ghost" onClick={() => setIsCatModalOpen(false)}>
              CANCEL
            </button>
            <button type="submit" className="btn btn-primary">
              SAVE CATEGORY
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Goal Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="🎯 ADD NEW GOAL">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>GOAL TITLE</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Master React & Node.js, Run 10km Marathon..."
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>CATEGORY</label>
              <select
                className="form-select"
                value={goalForm.category}
                onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>TARGET DATE</label>
              <input
                type="date"
                className="form-input"
                value={goalForm.targetDate}
                onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>DESCRIPTION (OPTIONAL)</label>
            <textarea
              className="form-textarea"
              placeholder="Why this goal matters..."
              value={goalForm.description}
              onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>SUB-MILESTONES (1 PER LINE)</label>
            <textarea
              className="form-textarea"
              placeholder="Step 1: Read documentation&#10;Step 2: Build project demo&#10;Step 3: Deploy to production"
              value={goalForm.milestonesText}
              onChange={(e) => setGoalForm({ ...goalForm, milestonesText: e.target.value })}
            />
          </div>

          <div className="flex flex-between mt-24">
            <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              CANCEL
            </button>
            <button type="submit" className="btn btn-primary">
              SAVE GOAL
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// Sub-component for individual Goal Card
const GoalCard = ({ goal, toggleGoalStatus, toggleMilestone, deleteGoal }) => {
  const isCompleted = goal.status === 'completed';
  const progressPercent = goal.progress || 0;

  return (
    <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column', padding: '20px' }}>
      {/* Title & Status Badge */}
      <div className="flex flex-between align-start mb-12">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.2 }}>
          {goal.title}
        </h3>
        <span className={`badge ${isCompleted ? 'badge-green' : 'badge-yellow'}`} style={{ flexShrink: 0, marginLeft: '8px' }}>
          {isCompleted ? '✓ DONE' : 'IN PROGRESS'}
        </span>
      </div>

      {/* Target Date */}
      {goal.targetDate && (
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text2)', marginBottom: '12px' }}>
          📅 Target: {new Date(goal.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}

      {/* Goal Description */}
      {goal.description && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '14px' }}>
          {goal.description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mb-16">
        <div className="flex flex-between align-center mb-4" style={{ fontSize: '0.75rem', fontWeight: 900 }}>
          <span>PROGRESS</span>
          <span>{progressPercent}%</span>
        </div>
        <div style={{ width: '100%', height: '12px', background: 'var(--bg4)', border: 'var(--bw) solid var(--border)' }}>
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: isCompleted ? 'var(--green)' : 'var(--yellow)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Milestones Checklist */}
      {goal.milestones && goal.milestones.length > 0 && (
        <div className="mb-16" style={{ background: 'var(--bg)', padding: '10px 12px', border: 'var(--bw) solid var(--border)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>
            MILESTONES ({goal.milestones.filter(m => m.completed).length}/{goal.milestones.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {goal.milestones.map(m => (
              <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={m.completed}
                  onChange={() => toggleMilestone(goal.id, m.id)}
                  style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                />
                <span style={{ textDecoration: m.completed ? 'line-through' : 'none', opacity: m.completed ? 0.6 : 1 }}>
                  {m.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex flex-between align-center mt-auto" style={{ borderTop: 'var(--bw) solid var(--border)', paddingTop: '12px' }}>
        <button
          className={`btn btn-sm ${isCompleted ? 'btn-ghost' : 'btn-yellow'}`}
          onClick={() => toggleGoalStatus(goal.id)}
        >
          {isCompleted ? 'REOPEN' : 'MARK COMPLETED'}
        </button>
        <button
          className="btn-icon"
          style={{ color: 'var(--red)' }}
          onClick={() => deleteGoal(goal.id)}
          title="Delete goal"
        >
          <TrashIcon size={16} />
        </button>
      </div>
    </div>
  );
};

export default Goals;
