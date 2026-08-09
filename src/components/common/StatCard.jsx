import React, { memo } from 'react';

const StatCard = memo(({ icon, value, label, bg = 'var(--bg2)', color = 'var(--text)' }) => {
  const cardBg = (!bg || bg === '#fff' || bg === '#FFF' || bg === '#FFFFFF') ? 'var(--bg2)' : bg;
  return (
    <div className="stat-card" style={{ background: cardBg }}>
      {icon && <div className="icon">{icon}</div>}
      <div className="value" style={{ color }}>{value}</div>
      <div className="label">{label}</div>
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;
