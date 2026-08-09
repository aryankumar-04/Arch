import { useState, useRef, useEffect } from 'react';
import { useTagStore } from '../../store/useTagStore';
import TagChip from './TagChip';
import { TrashIcon, PlusIcon } from '../common/Icons';

const TagPickerPopover = ({ assignedTagIds = [], onToggleTag, module = 'tasks' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');
  const [confirmDeleteTagId, setConfirmDeleteTagId] = useState(null);

  const { tags, fetchTags, addCustomTag, deleteCustomTag } = useTagStore();
  const popoverRef = useRef(null);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsCreating(false);
        setConfirmDeleteTagId(null);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(prev => !prev);
  };

  const handleTagChipClick = (e, tagId) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleTag) {
      onToggleTag(tagId);
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanLabel = newLabel.trim().slice(0, 18);
    if (!cleanLabel) return;

    const created = await addCustomTag(cleanLabel, newColor, module);
    if (created && onToggleTag) {
      onToggleTag(created.id);
    }

    setNewLabel('');
    setIsCreating(false);
  };

  const handleDeleteTag = async (e, tagId) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirmDeleteTagId === tagId) {
      await deleteCustomTag(tagId);
      setConfirmDeleteTagId(null);
    } else {
      setConfirmDeleteTagId(tagId);
    }
  };

  // Filter tags to presets + custom tags for current module
  const moduleTags = tags.filter(t => t.type === 'preset' || t.module === 'all' || t.module === module);
  const presets = moduleTags.filter(t => t.type === 'preset');
  const customTags = moduleTags.filter(t => t.type === 'custom');

  return (
    <div style={{ position: 'relative', display: 'inline-block', overflow: 'visible' }} ref={popoverRef}>
      <button
        type="button"
        onClick={handleToggleClick}
        style={{
          padding: '3px 10px',
          fontSize: '0.72rem',
          fontWeight: 800,
          borderRadius: '12px',
          background: 'var(--bg4, #F1F5F9)',
          border: 'none',
          boxShadow: 'none',
          color: 'var(--text, #0F172A)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'background 0.15s ease'
        }}
        title="Manage tags"
      >
        <PlusIcon size={10} /> Tag
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 9999,
            width: '240px',
            background: 'var(--bg2)',
            border: 'var(--bw) solid var(--border)',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3), 4px 4px 0px var(--border)',
            padding: '12px',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text)', borderBottom: '1px solid var(--bg4)', paddingBottom: '6px' }}>
            Select Tags ({module.toUpperCase()})
          </div>

          {/* Preset Tags */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Presets</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {presets.map(tag => {
                const isSelected = assignedTagIds.includes(tag.id);
                return (
                  <div key={tag.id} style={{ opacity: isSelected ? 1 : 0.65 }}>
                    <TagChip
                      tag={tag}
                      onClick={(e) => handleTagChipClick(e, tag.id)}
                      style={{
                        outline: isSelected ? '2px solid var(--border)' : 'none',
                        transform: isSelected ? 'scale(1.05)' : 'none'
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Tags for this module */}
          {customTags.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text3)', textTransform: 'uppercase' }}>Custom Tags</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                {customTags.map(tag => {
                  const isSelected = assignedTagIds.includes(tag.id);
                  const isConfirmingDelete = confirmDeleteTagId === tag.id;

                  return (
                    <div
                      key={tag.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        background: isSelected ? 'var(--bg2)' : 'transparent'
                      }}
                    >
                      <TagChip
                        tag={tag}
                        onClick={(e) => handleTagChipClick(e, tag.id)}
                        style={{ outline: isSelected ? '2px solid var(--border)' : 'none' }}
                      />

                      <button
                        type="button"
                        onClick={(e) => handleDeleteTag(e, tag.id)}
                        style={{
                          background: isConfirmingDelete ? 'var(--red)' : 'none',
                          color: isConfirmingDelete ? '#FFF' : 'var(--text3)',
                          border: isConfirmingDelete ? '1px solid var(--border)' : 'none',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                        title={isConfirmingDelete ? "Click again to confirm delete" : "Delete custom tag"}
                      >
                        {isConfirmingDelete ? 'Confirm?' : <TrashIcon size={12} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Create Custom Tag Toggle Form */}
          {!isCreating ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={(e) => { e.stopPropagation(); setIsCreating(true); }}
              style={{ justifyContent: 'center', marginTop: '4px', fontSize: '0.75rem' }}
            >
              <PlusIcon size={12} /> Create Custom Tag
            </button>
          ) : (
            <form onSubmit={handleCreateTag} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--bg4)', paddingTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900 }}>New Custom Tag</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text3)' }}>
                  {newLabel.length}/18
                </div>
              </div>
              <input
                type="text"
                className="form-input"
                placeholder="Max 18 characters..."
                maxLength={18}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value.slice(0, 18))}
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                autoFocus
                required
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800 }}>Color:</label>
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  style={{ width: '32px', height: '28px', border: '1px solid var(--border)', cursor: 'pointer', padding: 0 }}
                />
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm flex-1"
                  onClick={(e) => { e.stopPropagation(); setIsCreating(false); }}
                  style={{ fontSize: '0.7rem' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm flex-1" style={{ fontSize: '0.7rem' }}>
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default TagPickerPopover;
