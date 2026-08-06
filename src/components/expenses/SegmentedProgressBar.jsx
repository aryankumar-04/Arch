import React from 'react';

const SegmentedProgressBar = ({ loggedAmount = 0, fixedAmount = 0, savingsAmount = 0, capValue = 0 }) => {
  const totalCombined = loggedAmount + fixedAmount + savingsAmount;
  const overallPercent = capValue > 0 ? Math.round((totalCombined / capValue) * 100) : 0;
  const isOverBudget = capValue > 0 && overallPercent > 100;

  // Calculate width percentage for each segment relative to capValue
  const loggedPct = capValue > 0 ? Math.min(100, Math.max(0, (loggedAmount / capValue) * 100)) : 0;
  const fixedPct = capValue > 0 ? Math.min(100 - loggedPct, Math.max(0, (fixedAmount / capValue) * 100)) : 0;
  const savingsPct = capValue > 0 ? Math.min(100 - loggedPct - fixedPct, Math.max(0, (savingsAmount / capValue) * 100)) : 0;

  return (
    <div style={{ marginTop: '8px' }}>
      {/* Segmented Bar Track */}
      <div style={{
        width: '100%',
        height: '18px',
        background: 'var(--bg4, #E2E8F0)',
        border: 'var(--bw) solid var(--border)',
        borderRadius: '4px',
        overflow: 'hidden',
        padding: '1px',
        display: 'flex'
      }}>
        {loggedPct > 0 && (
          <div
            title={`Logged Expenses: ₹${loggedAmount.toLocaleString()}`}
            style={{
              width: `${loggedPct}%`,
              height: '100%',
              background: 'var(--green, #10B981)',
              transition: 'width 0.4s ease'
            }}
          />
        )}
        {fixedPct > 0 && (
          <div
            title={`Monthly Fixed Cost: ₹${fixedAmount.toLocaleString()}`}
            style={{
              width: `${fixedPct}%`,
              height: '100%',
              background: 'var(--accent, #2563EB)',
              transition: 'width 0.4s ease'
            }}
          />
        )}
        {savingsPct > 0 && (
          <div
            title={`Savings Added This Month: ₹${savingsAmount.toLocaleString()}`}
            style={{
              width: `${savingsPct}%`,
              height: '100%',
              background: 'var(--purple, #8B5CF6)',
              transition: 'width 0.4s ease'
            }}
          />
        )}
      </div>

      {/* Legend & Breakdown Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '8px',
        fontSize: '0.75rem',
        fontWeight: 800
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green, #10B981)', display: 'inline-block' }} />
            <span>Logged: ₹{Math.round(loggedAmount).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent, #2563EB)', display: 'inline-block' }} />
            <span>Fixed: ₹{Math.round(fixedAmount).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--purple, #8B5CF6)', display: 'inline-block' }} />
            <span>Savings: ₹{Math.round(savingsAmount).toLocaleString()}</span>
          </div>
        </div>

        <div style={{
          fontSize: '0.85rem',
          fontWeight: 800,
          color: isOverBudget ? 'var(--red, #EF4444)' : 'var(--text2)'
        }}>
          <span>{overallPercent}% Spent of ₹{capValue.toLocaleString()} Limit</span>
          {isOverBudget && (
            <span style={{ marginLeft: '8px', color: 'var(--red, #EF4444)', fontWeight: 900 }}>
              ⚠️ OVER BUDGET!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SegmentedProgressBar;
