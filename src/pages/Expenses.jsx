import { useEffect, useState } from 'react';
import { useExpenseStore, useAuthStore } from '../store';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Skeleton from '../components/common/Skeleton';
import Modal from '../components/common/Modal';
import { TrashIcon, PlusIcon, InfoIcon } from '../components/common/Icons';
import { getLocalUserBackup, saveLocalUserBackup } from '../utils/userStorage';
import { getMonthlyEquivalent, getExpenseIconSymbol, calculateNextDueAndStatus } from '../utils/expenseUtils';

import SegmentedProgressBar from '../components/expenses/SegmentedProgressBar';
import RecurringExpensesCard from '../components/expenses/RecurringExpensesCard';
import RecurringExpenseModal from '../components/expenses/RecurringExpenseModal';
import SavingsGoalsCard from '../components/expenses/SavingsGoalsCard';
import SavingsGoalModal from '../components/expenses/SavingsGoalModal';
import AddSavingsModal from '../components/expenses/AddSavingsModal';

const CATEGORIES = ['Food', 'Transport', 'College', 'Entertainment', 'Home', 'Health', 'Cloud Storage', 'Music', 'Utilities', 'Other'];

const Expenses = () => {
  const {
    expenses,
    recurringExpenses,
    savingsGoals,
    monthlyBudgetCap,
    setMonthlyBudgetCap,
    loading,
    fetchExpenses,
    addExpense,
    deleteExpense,
    addRecurringExpense,
    updateRecurringExpense,
    toggleRecurringPaid,
    deleteRecurringExpense,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    addToSavingsGoal
  } = useExpenseStore();

  const [newExp, setNewExp] = useState({ title: '', amount: '', category: 'Food' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txLimit, setTxLimit] = useState(10);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [capInput, setCapInput] = useState(monthlyBudgetCap || '');
  const [hintSeen, setHintSeen] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Modals state
  const [isRecModalOpen, setIsRecModalOpen] = useState(false);
  const [editingRecItem, setEditingRecItem] = useState(null);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalItem, setEditingGoalItem] = useState(null);

  const [isAddSavingsModalOpen, setIsAddSavingsModalOpen] = useState(false);
  const [targetSavingsGoal, setTargetSavingsGoal] = useState(null);

  // Delete Confirmation Modals state
  const [confirmDeleteRec, setConfirmDeleteRec] = useState(null);
  const [confirmDeleteGoal, setConfirmDeleteGoal] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // First-time onboarding hint logic
  useEffect(() => {
    const user = useAuthStore.getState().user;
    const uid = user ? user.uid : 'guest';

    const hasSeen = getLocalUserBackup('budget_cap_auto_hint_seen', uid, false);

    if (hasSeen) {
      setHintSeen(true);
      return;
    }

    setHintSeen(false);
    setShowTooltip(true);
    setIsPulsing(true);

    const autoVanishTimer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setShowTooltip(false);
        setIsPulsing(false);
        setIsFadingOut(false);
        setHintSeen(true);
        saveLocalUserBackup('budget_cap_auto_hint_seen', uid, true);
      }, 400);
    }, 3500);

    return () => clearTimeout(autoVanishTimer);
  }, []);

  const markHintSeenPermanently = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShowTooltip(false);
      setIsPulsing(false);
      setIsFadingOut(false);
      setHintSeen(true);
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';
      saveLocalUserBackup('budget_cap_auto_hint_seen', uid, true);
    }, 200);
  };

  useEffect(() => {
    setCapInput(monthlyBudgetCap ? String(monthlyBudgetCap) : '');
  }, [monthlyBudgetCap]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const num = Number(capInput);
      if (!isNaN(num) && capInput !== '' && num !== monthlyBudgetCap) {
        setMonthlyBudgetCap(num);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [capInput, monthlyBudgetCap, setMonthlyBudgetCap]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (newExp.title && newExp.amount) {
      setIsSubmitting(true);
      try {
        await addExpense(newExp);
        setNewExp({ title: '', amount: '', category: 'Food' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCapBlur = () => {
    const num = Number(capInput);
    if (!isNaN(num)) {
      setMonthlyBudgetCap(num);
    }
  };

  // Month-scoped spending calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // 1. Logged Expenses for current month
  const monthlyLoggedSpent = expenses.reduce((sum, e) => {
    if (!e) return sum;
    let d = null;
    if (e.createdAt) {
      d = typeof e.createdAt.toDate === 'function' ? e.createdAt.toDate() : new Date(e.createdAt);
    } else if (e.date) {
      d = new Date(e.date);
    }
    if (d && !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
      return sum + Number(e.amount || 0);
    }
    return sum;
  }, 0);

  // 2. Paid Fixed Monthly Expenses total (Only counted when marked PAID for current month)
  const monthlyFixedPaid = recurringExpenses.reduce((sum, item) => {
    if (!item) return sum;
    const dueInfo = calculateNextDueAndStatus(item);
    if (dueInfo.isPaid) {
      return sum + getMonthlyEquivalent(item.amount, item.frequency);
    }
    return sum;
  }, 0);

  // 3. Money added to Savings Goals in current month
  const monthlySavingsAdded = savingsGoals.reduce((sum, goal) => {
    const contribs = Array.isArray(goal.contributions) ? goal.contributions : [];
    const monthContribs = contribs.reduce((cSum, c) => {
      if (!c || !c.date) return cSum;
      const cd = new Date(c.date);
      if (!isNaN(cd.getTime()) && cd.getFullYear() === currentYear && cd.getMonth() === currentMonth) {
        return cSum + Number(c.amount || 0);
      }
      return cSum;
    }, 0);
    return sum + monthContribs;
  }, 0);

  // Combined Total Spent = Logged Expenses + Paid Fixed Costs + Savings Added
  const totalMonthSpent = Math.round(monthlyLoggedSpent + monthlyFixedPaid + monthlySavingsAdded);

  const capValue = Number(capInput !== '' ? capInput : monthlyBudgetCap) || 0;

  // Handlers for Recurring Expenses
  const handleOpenAddRec = () => {
    setEditingRecItem(null);
    setIsRecModalOpen(true);
  };
  const handleOpenEditRec = (item) => {
    setEditingRecItem(item);
    setIsRecModalOpen(true);
  };
  const handleSaveRec = async (data) => {
    if (editingRecItem) {
      return await updateRecurringExpense(editingRecItem.id, data);
    } else {
      return await addRecurringExpense(data);
    }
  };

  const handleConfirmDeleteRec = async () => {
    if (!confirmDeleteRec) return;
    await deleteRecurringExpense(confirmDeleteRec.id);
    setConfirmDeleteRec(null);
  };

  // Handlers for Savings Goals
  const handleOpenAddGoal = () => {
    setEditingGoalItem(null);
    setIsGoalModalOpen(true);
  };
  const handleOpenEditGoal = (goal) => {
    setEditingGoalItem(goal);
    setIsGoalModalOpen(true);
  };
  const handleSaveGoal = async (data) => {
    if (editingGoalItem) {
      await updateSavingsGoal(editingGoalItem.id, data);
    } else {
      await addSavingsGoal(data);
    }
  };
  const handleOpenAddSavings = (goal) => {
    setTargetSavingsGoal(goal);
    setIsAddSavingsModalOpen(true);
  };

  const handleConfirmDeleteGoal = async () => {
    if (!confirmDeleteGoal) return;
    await deleteSavingsGoal(confirmDeleteGoal.id);
    setConfirmDeleteGoal(null);
  };

  // Filtered recent expenses
  const filteredExpenses = selectedCategory === 'All Categories'
    ? expenses
    : expenses.filter(e => e.category === selectedCategory);

  return (
    <div>
      <div className="page-header">
        <h1>💰 EXPENSES & BUDGET TRACKER</h1>
      </div>

      {/* 1. Top Row: Total Spent Summary Card & Segmented Budget Cap */}
      <div className="mb-24" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'stretch' }}>
        <Card
          hover={false}
          style={{
            background: '#ECFDF5',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '20px 24px',
            justifyContent: 'flex-start'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#D1FAE5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 7H3C2.44772 7 2 7.44772 2 8V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 7.44772 21.5523 7 21 7Z" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 14C16.5523 14 17 13.5523 17 13C17 12.4477 16.5523 12 16 12C15.4477 12 15 12.4477 15 13C15 13.5523 15.4477 14 16 14Z" fill="#059669"/>
              <path d="M4 7V6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V7" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 900, textTransform: 'uppercase', color: '#1F2937', letterSpacing: '0.02em' }}>
              TOTAL AMOUNT SPENT
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10B981', lineHeight: 1.15, marginTop: '2px', marginBottom: '2px' }}>
              ₹{totalMonthSpent.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4B5563' }}>
              This Month
            </div>
          </div>
        </Card>

        <Card hover={false} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 24px' }}>
          <div className="flex flex-between flex-center mb-12 flex-wrap gap-8">
            <div className="flex flex-center gap-8" style={{ borderBottom: 'var(--bw) solid var(--border)', paddingBottom: '4px' }}>
              <span style={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.9rem' }}>
                🎯 MONTHLY BUDGET CAP
              </span>
              {!hintSeen && (
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <button
                    type="button"
                    className={`info-icon-btn ${isPulsing ? 'info-icon-pulse' : ''} ${isFadingOut ? 'popover-fade-out' : ''}`}
                    onClick={markHintSeenPermanently}
                    onMouseEnter={markHintSeenPermanently}
                    aria-label="Monthly budget cap info"
                  >
                    <InfoIcon size={12} />
                  </button>
                  {showTooltip && (
                    <div className={`info-tooltip-popover ${isFadingOut ? 'popover-fade-out' : ''}`}>
                      Set a monthly spending limit here. The bar tracks Logged Expenses, Paid Fixed Costs, and Savings added this month.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-center gap-8" style={{ fontWeight: 900, fontSize: '0.85rem' }}>
              <span>CAP: ₹</span>
              <input
                type="number"
                value={capInput}
                onChange={(e) => setCapInput(e.target.value)}
                onBlur={handleCapBlur}
                style={{
                  width: '110px',
                  padding: '4px 8px',
                  border: 'var(--bw) solid var(--border)',
                  boxShadow: '2px 2px 0px var(--border)',
                  fontWeight: 900,
                  background: 'var(--bg2)',
                  color: 'var(--text)',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <SegmentedProgressBar
            loggedAmount={monthlyLoggedSpent}
            fixedAmount={monthlyFixedPaid}
            savingsAmount={monthlySavingsAdded}
            capValue={capValue}
          />
        </Card>
      </div>

      {/* 2. Quick Log Expense Form */}
      <Card className="mb-24">
        <form onSubmit={handleAdd} className="form-row flex-wrap">
          <input
            className="form-input"
            type="text"
            placeholder="What did you buy? (e.g. Coffee)"
            value={newExp.title}
            onChange={e => setNewExp({ ...newExp, title: e.target.value })}
            required
          />
          <input
            className="form-input"
            type="number"
            placeholder="Amount (₹)"
            value={newExp.amount}
            onChange={e => setNewExp({ ...newExp, amount: e.target.value })}
            style={{ maxWidth: '160px' }}
            required
          />
          <select
            className="form-select"
            value={newExp.category}
            onChange={e => setNewExp({ ...newExp, category: e.target.value })}
            style={{ maxWidth: '160px' }}
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Button type="submit" variant="primary" icon={<PlusIcon />} loading={isSubmitting} loadingText="Logging...">
            LOG EXPENSE
          </Button>
        </form>
      </Card>

      {/* 3. Side-by-Side Cards: Recurring Expenses & Savings Goals */}
      <div className="grid-2 mb-24" style={{ alignItems: 'stretch' }}>
        <RecurringExpensesCard
          recurringExpenses={recurringExpenses}
          onAddClick={handleOpenAddRec}
          onEditClick={handleOpenEditRec}
          onDeleteClick={(item) => setConfirmDeleteRec(item)}
          onTogglePaidClick={toggleRecurringPaid}
        />

        <SavingsGoalsCard
          savingsGoals={savingsGoals}
          onAddGoalClick={handleOpenAddGoal}
          onAddToSavingsClick={handleOpenAddSavings}
          onEditGoalClick={handleOpenEditGoal}
          onDeleteGoalClick={(goal) => setConfirmDeleteGoal(goal)}
        />
      </div>

      {/* 4. Recent Expenses Section */}
      <Card hover={false} style={{ padding: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px',
          borderBottom: 'var(--bw) solid var(--border)',
          paddingBottom: '12px'
        }}>
          <div style={{ fontWeight: 900, fontSize: '1rem', textTransform: 'uppercase' }}>
            📜 RECENT EXPENSES
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              className="form-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '160px', padding: '4px 8px', fontSize: '0.8rem' }}
            >
              <option value="All Categories">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton type="text" count={4} height="50px" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            No recent expenses logged.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredExpenses.slice(0, txLimit).map(e => {
              const iconMeta = getExpenseIconSymbol(e.title, e.category);
              let formattedDate = 'Recent';
              if (e.createdAt || e.date) {
                const d = e.createdAt ? new Date(e.createdAt) : new Date(e.date);
                if (!isNaN(d.getTime())) {
                  formattedDate = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
                    ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                }
              }

              return (
                <div
                  key={e.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'var(--bg2)',
                    border: 'var(--bw) solid var(--border)',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--bg4)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem'
                    }}>
                      {iconMeta.symbol}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontWeight: 900, fontSize: '0.95rem' }}>{e.title}</h3>
                      <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '2px' }}>
                        {e.category} • <span style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-center gap-16">
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--red)' }}>
                      -₹{Number(e.amount || 0).toLocaleString()}
                    </div>
                    <button className="btn-icon" onClick={() => deleteExpense(e.id)} title="Delete expense">
                      <TrashIcon size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredExpenses.length > txLimit && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setTxLimit(prev => prev + 20)}
                  style={{ fontSize: '0.8rem', fontWeight: 900 }}
                >
                  VIEW ALL EXPENSES ({filteredExpenses.length - txLimit} REMAINING) →
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Modals */}
      <RecurringExpenseModal
        isOpen={isRecModalOpen}
        onClose={() => setIsRecModalOpen(false)}
        initialData={editingRecItem}
        onSave={handleSaveRec}
      />

      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        initialData={editingGoalItem}
        onSave={handleSaveGoal}
      />

      <AddSavingsModal
        isOpen={isAddSavingsModalOpen}
        onClose={() => setIsAddSavingsModalOpen(false)}
        goal={targetSavingsGoal}
        onConfirmAdd={addToSavingsGoal}
      />

      {/* Delete Confirmation Modal for Fixed Expense */}
      <Modal
        isOpen={Boolean(confirmDeleteRec)}
        onClose={() => setConfirmDeleteRec(null)}
        title="🗑️ DELETE FIXED EXPENSE"
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '24px', color: 'var(--text)', lineHeight: 1.4 }}>
            Are you sure you want to delete <strong>"{confirmDeleteRec?.name}"</strong>? This action cannot be undone.
          </p>
          <div className="flex flex-between gap-12">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmDeleteRec(null)}>
              CANCEL
            </button>
            <button
              type="button"
              className="btn"
              style={{ background: 'var(--red, #DC2626)', color: '#FFFFFF', border: 'var(--bw) solid var(--border)', boxShadow: '3px 3px 0px var(--border)' }}
              onClick={handleConfirmDeleteRec}
            >
              YES, DELETE EXPENSE
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal for Savings Goal */}
      <Modal
        isOpen={Boolean(confirmDeleteGoal)}
        onClose={() => setConfirmDeleteGoal(null)}
        title="🗑️ DELETE SAVINGS GOAL"
      >
        <div style={{ padding: '8px 0' }}>
          <p style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: '24px', color: 'var(--text)', lineHeight: 1.4 }}>
            Are you sure you want to delete <strong>"{confirmDeleteGoal?.name}"</strong>? This action cannot be undone.
          </p>
          <div className="flex flex-between gap-12">
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmDeleteGoal(null)}>
              CANCEL
            </button>
            <button
              type="button"
              className="btn"
              style={{ background: 'var(--red, #DC2626)', color: '#FFFFFF', border: 'var(--bw) solid var(--border)', boxShadow: '3px 3px 0px var(--border)' }}
              onClick={handleConfirmDeleteGoal}
            >
              YES, DELETE GOAL
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Expenses;