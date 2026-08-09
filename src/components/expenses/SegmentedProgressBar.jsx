import React from 'react';

const SegmentedProgressBar = ({ loggedAmount = 0, fixedAmount = 0, savingsAmount = 0, capValue = 0 }) => {
  const safeLogged = Math.max(0, Number(loggedAmount) || 0);
  const safeFixed = Math.max(0, Number(fixedAmount) || 0);
  const safeSavings = Math.max(0, Number(savingsAmount) || 0);

  // Total Spent = Logged + Fixed (Paid) ONLY (Savings is allocated, not spent)
  const actualSpent = safeLogged + safeFixed;
  const totalCombined = actualSpent + safeSavings;
  const overallPercent = capValue > 0 ? Math.round((actualSpent / capValue) * 100) : 0;
  const isOverBudget = capValue > 0 && actualSpent > capValue;

  // Calculate proportional width percentage for each segment relative to capValue
  let loggedPct = 0;
  let fixedPct = 0;
  let savingsPct = 0;

  if (capValue > 0 && totalCombined > 0) {
    if (totalCombined > capValue) {
      // Scale proportionally to fill 100% of the bar track when total spending exceeds cap limit
      loggedPct = (safeLogged / totalCombined) * 100;
      fixedPct = (safeFixed / totalCombined) * 100;
      savingsPct = (safeSavings / totalCombined) * 100;
    } else {
      loggedPct = (safeLogged / capValue) * 100;
      fixedPct = (safeFixed / capValue) * 100;
      savingsPct = (safeSavings / capValue) * 100;
    }
  }

  // Exact color definitions matching requirement
  const COLOR_LOGGED = 'var(--budget-logged, #4F8CC9)';
  const COLOR_FIXED = 'var(--budget-fixed, #D69A4A)';
  const COLOR_SAVINGS = 'var(--budget-savings, #58A77B)';

  return (
    <div style={{ marginTop: '8px' }}>
      {/* Segmented Bar Track */}
      <div style={{
        width: '100%',
        height: '18px',
        background: 'var(--bg4, #27272A)',
        border: 'var(--bw) solid var(--border)',
        borderRadius: '6px',
        overflow: 'hidden',
        padding: '0',
        display: 'flex'
      }}>
        {loggedPct > 0 && (
          <div
            title={`Logged Expenses: ₹${safeLogged.toLocaleString()}`}
            style={{
              width: `${loggedPct}%`,
              height: '100%',
              background: COLOR_LOGGED,
              transition: 'width 0.4s ease'
            }}
          />
        )}
        {fixedPct > 0 && (
          <div
            title={`Monthly Fixed Cost: ₹${safeFixed.toLocaleString()}`}
            style={{
              width: `${fixedPct}%`,
              height: '100%',
              background: COLOR_FIXED,
              transition: 'width 0.4s ease'
            }}
          />
        )}
        {savingsPct > 0 && (
          <div
            title={`Savings Added This Month: ₹${safeSavings.toLocaleString()}`}
            style={{
              width: `${savingsPct}%`,
              height: '100%',
              background: COLOR_SAVINGS,
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
        marginTop: '10px',
        fontSize: '0.78rem',
        fontWeight: 800
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLOR_LOGGED, display: 'inline-block' }} />
            <span style={{ color: 'var(--text)' }}>Logged: ₹{Math.round(safeLogged).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLOR_FIXED, display: 'inline-block' }} />
            <span style={{ color: 'var(--text)' }}>Fixed: ₹{Math.round(safeFixed).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLOR_SAVINGS, display: 'inline-block' }} />
            <span style={{ color: 'var(--text)' }}>Savings: ₹{Math.round(safeSavings).toLocaleString()}</span>
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
