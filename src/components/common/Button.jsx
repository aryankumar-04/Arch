import React, { memo } from 'react';

const Button = memo(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  className = '', 
  loading = false,
  loadingText,
  disabled = false,
  ...props 
}) => {
  const variantClass = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    yellow: 'btn-yellow',
    dark: 'btn-dark',
    icon: 'btn-icon'
  }[variant] || 'btn-primary';

  const sizeClass = size === 'sm' ? 'btn-sm' : '';

  return (
    <button 
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn-spinner" />
          {loadingText || children}
        </>
      ) : (
        <>
          {icon && <span className="btn-icon-wrapper">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
