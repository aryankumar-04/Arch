import React, { memo } from 'react';

const Card = memo(({ title, value, children, className = '', hover = true, style, ...props }) => {
  return (
    <div 
      className={`card ${hover ? 'card-hover' : ''} ${className}`} 
      style={style}
      {...props}
    >
      {title && <div className="card-title">{title}</div>}
      {value !== undefined && <div className="card-value">{value}</div>}
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
