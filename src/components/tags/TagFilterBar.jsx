import { useEffect } from 'react';
import { useTagStore } from '../../store/useTagStore';
import TagChip from './TagChip';

const TagFilterBar = ({ selectedTagIds = [], onToggleFilterTag, onClearFilters, module = 'tasks' }) => {
  const { tags, fetchTags } = useTagStore();

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  if (!tags || tags.length === 0) return null;

  // Filter tags to presets + custom tags for current module
  const moduleTags = tags.filter(t => t.type === 'preset' || t.module === 'all' || t.module === module);
  if (moduleTags.length === 0) return null;

  const isFiltered = selectedTagIds.length > 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '10px 14px',
        background: 'var(--bg2, #FFFFFF)',
        border: 'var(--bw) solid var(--border)',
        borderRadius: '6px',
        marginBottom: '16px'
      }}
    >
      <span style={{ fontSize: '0.78rem', fontWeight: 900, color: 'var(--text, #0F172A)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
        🏷️ FILTER BY TAG:
      </span>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {moduleTags.map(tag => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <div
              key={tag.id}
              style={{
                opacity: isSelected ? 1 : 0.65,
                transform: isSelected ? 'scale(1.05)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <TagChip
                tag={tag}
                onClick={() => onToggleFilterTag(tag.id)}
                style={{
                  outline: isSelected ? '2px solid var(--text)' : 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          );
        })}
      </div>

      {isFiltered && (
        <button
          type="button"
          onClick={onClearFilters}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--red, #EF4444)',
            fontSize: '0.75rem',
            fontWeight: 800,
            cursor: 'pointer',
            marginLeft: 'auto',
            textDecoration: 'underline'
          }}
        >
          Clear filters ({selectedTagIds.length})
        </button>
      )}
    </div>
  );
};

export default TagFilterBar;
