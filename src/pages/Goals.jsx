import { useState, useEffect, useRef } from 'react';
import { useGoalStore, useTagStore } from '../store';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Skeleton from '../components/common/Skeleton';
import DuplicateErrorBanner from '../components/common/DuplicateErrorBanner';
import TagFilterBar from '../components/tags/TagFilterBar';
import TagChip from '../components/tags/TagChip';
import TagPickerPopover from '../components/tags/TagPickerPopover';
import { PlusIcon, TrashIcon, EditIcon } from '../components/common/Icons';

const Goals = () => {
  const {
    goals, categories, loading, fetchGoals, addGoal, updateGoal, addCategory, deleteCategory, toggleGoalStatus, toggleMilestone, deleteGoal, addTagToGoal, removeTagFromGoal
  } = useGoalStore();

  const { tags, fetchTags } = useTagStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [duplicateError, setDuplicateError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const modalBodyRef = useRef(null);

  useEffect(() => {
    fetchGoals();
    fetchTags();
  }, [fetchGoals, fetchTags]);

  useEffect(() => {
    if (duplicateError && modalBodyRef.current) {
      modalBodyRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [duplicateError]);

  // Category deletion state
  const [categoryError, setCategoryError] = useState(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);

  const [goalForm, setGoalForm] = useState({
    title: '',
    description: '',
    category: 'Short Term',
    targetDate: '',
    milestonesText: ''
  });

  const handleOpenModal = () => {
    setEditingGoalId(null);
    setDuplicateError(null);
    setGoalForm({
      title: '',
      description: '',
      category: categories[0] || 'Short Term',
      targetDate: '',
      milestonesText: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditGoalModal = (goal) => {
    setEditingGoalId(goal.id);
    setDuplicateError(null);
    setGoalForm({
      title: goal.title || '',
      description: goal.description || '',
      category: goal.category || (categories[0] || 'Short Term'),
      targetDate: goal.targetDate || '',
      milestonesText: goal.milestones ? goal.milestones.map(m => m.title).join('\n') : ''
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

  const handleDeleteCategoryClick = (catName) => {
    setCategoryError(null);
    const catGoals = goals.filter(g => (g.category || '').trim().toLowerCase() === catName.trim().toLowerCase());
    if (catGoals.length > 0) {
      const res = deleteCategory(catName);
      if (res && res.error) {
        setCategoryError({
          title: res.title || '⚠️ CANNOT DELETE CATEGORY',
          message: res.message
        });
      }
      return;
    }
    setConfirmDeleteCat(catName);
  };

  const handleConfirmDeleteCategory = () => {
    if (!confirmDeleteCat) return;
    deleteCategory(confirmDeleteCat);
    setConfirmDeleteCat(null);
    setCategoryError(null);
  };

  const handleToggleFilterTag = (tagId) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleClearFilters = () => {
    setSelectedTagIds([]);
  };

  const handleToggleGoalTag = async (goalId, tagId) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const currentTagIds = Array.isArray(goal.tagIds) ? goal.tagIds : [];
    if (currentTagIds.includes(tagId)) {
      await removeTagFromGoal(goalId, tagId);
    } else {
      await addTagToGoal(goalId, tagId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goalForm.title.trim()) return;
    setDuplicateError(null);
    setIsSubmitting(true);

    try {
      const milestones = goalForm.milestonesText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((line, idx) => ({ id: `m_${idx}_${Date.now()}`, title: line, completed: false }));

      const goalData = {
        title: goalForm.title,
        description: goalForm.description,
        category: goalForm.category,
        targetDate: goalForm.targetDate,
        milestones
      };

      let res;
      if (editingGoalId) {
        res = await updateGoal(editingGoalId, goalData);
      } else {
        res = await addGoal(goalData);
      }

      if (res && res.error === 'duplicate') {
        setDuplicateError({
          title: res.title || '⚠️ GOAL ALREADY EXISTS IN THIS CATEGORY',
          message: res.message,
          _t: Date.now()
        });
        return;
      }

      setIsModalOpen(false);
      setEditingGoalId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter goals by selected tags (OR filter logic)
  const filteredGoals = selectedTagIds.length === 0
    ? goals
    : goals.filter(g => {
        const goalTagIds = Array.isArray(g.tagIds) ? g.tagIds : [];
        return goalTagIds.some(id => selectedTagIds.includes(id));
      });

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

      {/* Smart Tag Filter Bar (Goals Module) */}
      <TagFilterBar
        selectedTagIds={selectedTagIds}
        onToggleFilterTag={handleToggleFilterTag}
        onClearFilters={handleClearFilters}
        module="goals"
      />

      {/* Category Deletion Error Banner */}
      {categoryError && (
        <DuplicateErrorBanner
          title={categoryError.title}
          message={categoryError.message}
          onClose={() => setCategoryError(null)}
        />
      )}

      {/* Dynamic Category Sections */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Skeleton type="text" width="30%" height="24px" />
              <Skeleton type="card" height="80px" />
            </div>
          ))}
        </div>
      ) : (
        categories.map(cat => {
          const catGoals = filteredGoals.filter(g => g.category === cat);
          return (
            <div key={cat} className="mb-32">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{getCategoryEmoji(cat)}</span>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 900, textTransform: 'uppercase' }}>
                    {cat}
                  </h2>
                </div>
                <button
                  className="btn-icon"
                  style={{ color: 'var(--red)' }}
                  onClick={() => handleDeleteCategoryClick(cat)}
                  title={`Delete ${cat} category`}
                >
                  <TrashIcon size={16} />
                </button>
              </div>

              {catGoals.length === 0 ? (
                <p className="text-muted" style={{ fontWeight: 600, fontSize: '0.9rem', fontStyle: 'italic', paddingLeft: '8px' }}>
                  {selectedTagIds.length > 0 ? "No goals match tag filter in this category" : "No goals in this category"}
                </p>
              ) : (
                <div className="dash-grid">
                  {catGoals.map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      allTags={tags}
                      toggleGoalStatus={toggleGoalStatus}
                      toggleMilestone={toggleMilestone}
                      deleteGoal={deleteGoal}
                      onEdit={handleOpenEditGoalModal}
                      onToggleTag={handleToggleGoalTag}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}

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

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoalId(null);
          setDuplicateError(null);
        }}
        title={editingGoalId ? "✏️ EDIT GOAL" : "🎯 ADD NEW GOAL"}
        bodyRef={modalBodyRef}
      >
        <form onSubmit={handleSubmit}>
          {duplicateError && (
            <DuplicateErrorBanner
              title={duplicateError.title}
              message={duplicateError.message}
              onClose={() => setDuplicateError(null)}
            />
          )}
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
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              loadingText="SAVING..."
            >
              SAVE GOAL
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmDeleteCat)}
        onClose={() => setConfirmDeleteCat(null)}
        title="🗑️ DELETE CATEGORY"
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '24px', color: 'var(--text)', lineHeight: 1.4 }}>
            Are you sure you want to delete the category <strong>"{confirmDeleteCat?.toUpperCase()}"</strong>?
          </p>
          <div className="flex flex-between gap-12">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmDeleteCat(null)}>
              CANCEL
            </button>
            <button
              type="button"
              className="btn"
              style={{ background: 'var(--red, #DC2626)', color: '#FFFFFF', border: 'var(--bw) solid var(--border)', boxShadow: '3px 3px 0px var(--border)' }}
              onClick={handleConfirmDeleteCategory}
            >
              YES, DELETE CATEGORY
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Sub-component for individual Goal Card
const GoalCard = ({ goal, allTags = [], toggleGoalStatus, toggleMilestone, deleteGoal, onEdit, onToggleTag }) => {
  const isCompleted = goal.status === 'completed';
  const progressPercent = goal.progress || 0;
  const tagIds = Array.isArray(goal.tagIds) ? goal.tagIds : [];

  // Filter tags for goals module
  const moduleTags = allTags.filter(t => t.type === 'preset' || t.module === 'all' || t.module === 'goals');
  const assignedTags = moduleTags.filter(t => tagIds.includes(t.id));

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

      {/* Tags Chips Section */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {assignedTags.map(tag => (
          <TagChip
            key={tag.id}
            tag={tag}
            onRemove={onToggleTag ? () => onToggleTag(goal.id, tag.id) : null}
          />
        ))}
        {onToggleTag && (
          <TagPickerPopover
            assignedTagIds={tagIds}
            onToggleTag={(tagId) => onToggleTag(goal.id, tagId)}
            module="goals"
          />
        )}
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
        <div className="flex align-center gap-8">
          {onEdit && (
            <button
              className="btn-icon"
              onClick={() => onEdit(goal)}
              title="Edit goal"
            >
              <EditIcon size={16} />
            </button>
          )}
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
    </div>
  );
};

export default Goals;
