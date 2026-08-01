import React, { memo } from 'react';

const StatCard = memo(({ icon, value, label, bg = '#fff', color = 'var(--text)' }) => {
  return (
    <div className="stat-card" style={{ background: bg }}>
      {icon && <div className="icon">{icon}</div>}
      <div className="value" style={{ color }}>{value}</div>
      <div className="label">{label}</div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
