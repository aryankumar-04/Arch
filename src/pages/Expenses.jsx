import { useEffect, useState } from 'react';
import { useExpenseStore } from '../store';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import StatCard from '../components/common/StatCard';
import { TrashIcon, PlusIcon } from '../components/common/Icons';

const Expenses = () => {
  const { expenses, loading, fetchExpenses, addExpense, deleteExpense } = useExpenseStore();
  const [newExp, setNewExp] = useState({ title: '', amount: '', category: 'Food' });
  const categories = ['Food', 'Transport', 'College', 'Entertainment', 'Other'];

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (newExp.title && newExp.amount) {
      addExpense(newExp);
      setNewExp({ title: '', amount: '', category: 'Food' });
    }
  };
  
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>💰 Expenses</h1>
      </div>
      
      <div className="mb-24">
        <StatCard value={`₹${totalSpent}`} label="Total Amount Spent" bg="#ecfdf5" color="var(--green)" />
      </div>
      
      <Card className="mb-24">
        <form onSubmit={handleAdd} className="form-row flex-wrap">
          <input 
            className="form-input" 
            type="text" 
            placeholder="What did you buy? (e.g. Coffee)" 
            value={newExp.title} 
            onChange={e => setNewExp({...newExp, title: e.target.value})} 
            required 
          />
          <input 
            className="form-input" 
            type="number" 
            placeholder="Amount (₹)" 
            value={newExp.amount} 
            onChange={e => setNewExp({...newExp, amount: e.target.value})} 
            style={{ maxWidth: '160px' }} 
            required 
          />
          <select 
            className="form-select" 
            value={newExp.category} 
            onChange={e => setNewExp({...newExp, category: e.target.value})} 
            style={{ maxWidth: '160px' }}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Button type="submit" variant="primary" icon={<PlusIcon />}>
            Log Expense
          </Button>
        </form>
      </Card>
      
      <div className="flex" style={{ flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div className="empty-state">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">No expenses logged yet.</div>
        ) : (
          expenses.map(e => (
            <Card key={e.id} className="flex flex-between flex-center">
              <div>
                <h3 style={{ margin: 0, fontWeight: 900 }}>{e.title}</h3>
                <div className="text-muted" style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>
                  {e.category}
                </div>
              </div>
              <div className="flex flex-center gap-16">
                <div style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--red)' }}>
                  -₹{e.amount}
                </div>
                <button className="btn-icon" onClick={() => deleteExpense(e.id)}>
                  <TrashIcon size={14} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Expenses;