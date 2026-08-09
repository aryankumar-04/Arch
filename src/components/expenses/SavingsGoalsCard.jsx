import { useState, useRef, useEffect } from 'react';
import Card from '../common/Card';
import { PlusIcon } from '../common/Icons';
import { getExpenseIconSymbol } from '../../utils/expenseUtils';

const GoalActionMenu = ({ goal, onAddToSavings, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1.1rem',
          fontWeight: 900,
          color: 'var(--text2)',
          padding: '2px 6px',
          lineHeight: 1
        }}
        title="Actions"
      >
        ⋮
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            zIndex: 100,
            background: 'var(--bg2)',
            border: 'var(--bw) solid var(--border)',
            boxShadow: '3px 3px 0px var(--border)',
            borderRadius: '4px',
            padding: '4px 0',
            minWidth: '130px'
          }}
        >
          <button
            type="button"
            onClick={() => { setIsOpen(false); onAddToSavings(goal); }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 800,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--purple, #8B5CF6)'
            }}
          >
            💰 Add to Savings
          </button>
          <button
            type="button"
            onClick={() => { setIsOpen(false); onEdit(goal); }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 800,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text)'
            }}
          >
            ✏️ Edit Goal
          </button>
          <button
            type="button"
            onClick={() => { setIsOpen(false); onDelete(goal.id); }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 800,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--red, #EF4444)'
            }}
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );
};

const SavingsGoalsCard = ({ savingsGoals = [], onAddGoalClick, onAddToSavingsClick, onEditGoalClick, onDeleteGoalClick }) => {
  const totalSavedAcrossGoals = savingsGoals.reduce((sum, g) => sum + Number(g.savedAmount || 0), 0);

  return (
    <Card style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Card Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: 'var(--bw) solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎯</span> SAVINGS GOALS
        </div>
        <button
          type="button"
          onClick={onAddGoalClick}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}
        >
          <PlusIcon size={12} /> NEW GOAL
        </button>
      </div>

      {/* Goals List Content with Fixed Max-Height & Scrollbar */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', maxHeight: '280px' }}>
        {savingsGoals.length === 0 ? (
          <div className="empty-state" style={{ padding: '28px 16px', fontSize: '0.85rem' }}>
            No savings goals yet — add one to get started!
          </div>
        ) : (
          savingsGoals.map(goal => {
            const saved = Number(goal.savedAmount || 0);
            const target = Number(goal.targetAmount || 1);
            const rawPct = target > 0 ? Math.round((saved / target) * 100) : 0;
            const fillPct = Math.min(100, Math.max(0, rawPct));
            const iconMeta = getExpenseIconSymbol(goal.name, 'Goal', goal.iconUrl);

            return (
              <div
                key={goal.id}
                style={{
                  background: 'var(--bg2, #FFFFFF)',
                  border: 'var(--bw) solid var(--border)',
                  padding: '14px 16px',
                  borderRadius: '6px',
                  boxShadow: '2px 2px 0px var(--border)'
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '6px',
                      background: 'var(--bg4, #F1F5F9)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      {iconMeta.type === 'img' ? (
                        <img src={iconMeta.url} alt={goal.name} style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} />
                      ) : (
                        iconMeta.symbol
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>{goal.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 700 }}>
                        Target: ₹{target.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 900, fontSize: '0.88rem', color: rawPct >= 100 ? 'var(--budget-savings, #58A77B)' : 'var(--purple, #8B5CF6)' }}>
                      {rawPct}%
                    </span>
                    <GoalActionMenu
                      goal={goal}
                      onAddToSavings={onAddToSavingsClick}
                      onEdit={onEditGoalClick}
                      onDelete={onDeleteGoalClick}
                    />
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: '10px',
                  background: 'var(--bg4, #E2E8F0)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    width: `${fillPct}%`,
                    height: '100%',
                    background: rawPct >= 100 ? 'var(--budget-savings, #58A77B)' : 'var(--purple, #8B5CF6)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>

                {/* Amount Ratio Footer */}
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text2)' }}>
                  ₹{saved.toLocaleString()} / ₹{target.toLocaleString()}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Total Row */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--bg4, #F1F5F9)',
        borderTop: 'var(--bw) solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontWeight: 900,
        fontSize: '0.82rem',
        marginTop: 'auto'
      }}>
        <span style={{ textTransform: 'uppercase', color: 'var(--text2)' }}>TOTAL SAVED ACROSS GOALS</span>
        <span style={{ fontSize: '1.1rem', color: 'var(--purple, #8B5CF6)' }}>₹{totalSavedAcrossGoals.toLocaleString()}</span>
      </div>
    </Card>
  );
};

export default SavingsGoalsCard;
