import React from 'react';

export const getContrastTextColor = (hexColor) => {
  if (!hexColor) return '#FFFFFF';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.65 ? '#0F172A' : '#FFFFFF';
};

const TagChip = ({ tag, onRemove, onClick, style = {} }) => {
  if (!tag) return null;

  const textColor = getContrastTextColor(tag.color);

  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        fontSize: '0.72rem',
        fontWeight: 800,
        borderRadius: '12px',
        background: tag.color || '#3B82F6',
        color: textColor,
        border: 'none',
        boxShadow: 'none',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        lineHeight: 1.4,
        ...style
      }}
    >
      <span>{tag.label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: textColor,
            cursor: 'pointer',
            padding: 0,
            marginLeft: '4px',
            fontSize: '0.85rem',
            fontWeight: 900,
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            opacity: 0.85
          }}
          title={`Remove ${tag.label}`}
        >
          ×
        </button>
      )}
    </span>
  );
};

export default TagChip;
