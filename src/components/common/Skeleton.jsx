import React, { memo } from 'react';

const Skeleton = memo(({ type = 'text', width, height, count = 1, style, className = '' }) => {
  const renderItem = (index) => {
    let typeClass = 'skeleton-text';
    if (type === 'card') typeClass = 'skeleton-card';
    if (type === 'avatar') typeClass = 'skeleton-avatar';
    if (type === 'button') typeClass = 'skeleton-button';
    if (type === 'grid') typeClass = 'skeleton-grid';

    return (
      <div
        key={index}
        className={`skeleton-pulse ${typeClass} ${className}`}
        style={{
          width: width ? width : undefined,
          height: height ? height : undefined,
          ...style
        }}
      />
    );
  };

  if (count === 1) return renderItem(0);

  return (
    <div className="skeleton-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {Array.from({ length: count }).map((_, i) => renderItem(i))}
    </div>
  );
});

Skeleton.displayName = 'Skeleton';

export default Skeleton;
