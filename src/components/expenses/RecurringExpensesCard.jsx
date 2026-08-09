import { useState, useRef, useEffect } from 'react';
import Card from '../common/Card';
import { PlusIcon } from '../common/Icons';
import { calculateNextDueAndStatus, getMonthlyEquivalent, getExpenseIconSymbol } from '../../utils/expenseUtils';

const ActionMenu = ({ item, isPaid, onTogglePaid, onEdit, onDelete }) => {
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
            onClick={() => { setIsOpen(false); onTogglePaid(item.id); }}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '6px 12px',
              fontSize: '0.78rem',
              fontWeight: 800,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isPaid ? 'var(--orange, #D97706)' : 'var(--green, #10B981)'
            }}
          >
            {isPaid ? '↩️ Mark Unpaid' : '✓ Mark Paid'}
          </button>
          <button
            type="button"
            onClick={() => { setIsOpen(false); onEdit(item); }}
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
            ✏️ Edit
          </button>
          <button
            type="button"
            onClick={() => { setIsOpen(false); onDelete(item); }}
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

const RecurringExpensesCard = ({ recurringExpenses = [], onAddClick, onEditClick, onDeleteClick, onTogglePaidClick }) => {
  const totalMonthlyCost = recurringExpenses.reduce(
    (sum, item) => sum + getMonthlyEquivalent(item.amount, item.frequency),
    0
  );

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
          <span>📅</span> MONTHLY FIXED EXPENSES
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}
        >
          <PlusIcon size={12} /> ADD EXPENSE
        </button>
      </div>

      {/* Table Container with Fixed Max-Height & Scrollbar */}
      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', maxHeight: '280px' }}>
        {recurringExpenses.length === 0 ? (
          <div className="empty-state" style={{ padding: '28px 16px', fontSize: '0.85rem' }}>
            No recurring expenses added yet. Click "+ ADD EXPENSE" to get started!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg4, #F8FAFC)', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '10px 14px', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text2)' }}>NAME</th>
                <th style={{ padding: '10px 14px', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text2)' }}>AMOUNT</th>
                <th style={{ padding: '10px 14px', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text2)' }}>FREQUENCY</th>
                <th style={{ padding: '10px 14px', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text2)' }}>NEXT DUE</th>
                <th style={{ padding: '10px 14px', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.7rem', color: 'var(--text2)' }}>STATUS</th>
                <th style={{ padding: '10px 14px', width: '32px' }} />
              </tr>
            </thead>
            <tbody>
              {recurringExpenses.map(item => {
                const dueInfo = calculateNextDueAndStatus(item);
                const iconMeta = getExpenseIconSymbol(item.name, item.category, item.iconUrl);

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--bg4)' }}>
                    {/* Name + Icon */}
                    <td style={{ padding: '10px 14px', fontWeight: 800 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {iconMeta.type === 'img' ? (
                          <img src={iconMeta.url} alt={item.name} style={{ width: '22px', height: '22px', borderRadius: '4px', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1rem' }}>{iconMeta.symbol}</span>
                        )}
                        <div>
                          <div>{item.name}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text3)', fontWeight: 600 }}>
                            {item.category || 'General'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '10px 14px', fontWeight: 900, color: 'var(--text)' }}>
                      ₹{Number(item.amount || 0).toLocaleString()}
                    </td>

                    {/* Frequency */}
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text2)' }}>
                      {item.frequency || 'Monthly'}
                    </td>

                    {/* Next Due */}
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--text)' }}>
                      {dueInfo.displayDate}
                    </td>

                    {/* Status Badge (Clickable to toggle paid/unpaid) */}
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        type="button"
                        onClick={() => onTogglePaidClick(item.id)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.68rem',
                          fontWeight: 900,
                          background: dueInfo.badgeBg,
                          color: dueInfo.badgeColor,
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-block'
                        }}
                        title={dueInfo.isPaid ? "Click to mark unpaid" : "Click to mark paid"}
                      >
                        {dueInfo.status}
                      </button>
                    </td>

                    {/* Actions Menu */}
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <ActionMenu
                        item={item}
                        isPaid={dueInfo.isPaid}
                        onTogglePaid={onTogglePaidClick}
                        onEdit={onEditClick}
                        onDelete={onDeleteClick}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
        <span style={{ textTransform: 'uppercase', color: 'var(--text2)' }}>TOTAL MONTHLY FIXED COST</span>
        <span style={{ fontSize: '1.1rem', color: 'var(--accent, #2563EB)' }}>₹{Math.round(totalMonthlyCost).toLocaleString()}</span>
      </div>
    </Card>
  );
};

export default RecurringExpensesCard;
