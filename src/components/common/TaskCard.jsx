import React, { memo } from 'react';
import { TrashIcon, CheckIcon } from './Icons';
import TagChip from '../tags/TagChip';
import TagPickerPopover from '../tags/TagPickerPopover';

const TaskCard = memo(({ task, title, status, onDelete, onToggleComplete, allTags = [], onToggleTag }) => {
  const taskTitle = task ? task.title : title;
  const taskStatus = task ? task.status : status;
  const isCompleted = taskStatus === 'completed';
  const tagIds = (task && Array.isArray(task.tagIds)) ? task.tagIds : [];

  const assignedTags = allTags.filter(t => tagIds.includes(t.id));

  return (
    <div className={`task-list-item ${isCompleted ? 'completed' : ''}`} style={{ overflow: 'visible', position: 'relative' }}>
      <div className="task-info" style={{ minWidth: 0, flex: 1, overflow: 'visible' }}>
        <h4 
          title={taskTitle}
          style={{
            textDecoration: isCompleted ? 'line-through' : 'none',
            color: isCompleted ? 'var(--text3)' : 'var(--text)',
            opacity: isCompleted ? 0.6 : 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%'
          }}
        >
          {taskTitle}
        </h4>
        
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '6px', opacity: isCompleted ? 0.6 : 1, overflow: 'visible' }}>
          {taskStatus && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text2)', fontWeight: 600, marginRight: '4px' }}>
              Status: {taskStatus}
            </span>
          )}

          {assignedTags.map(tag => (
            <TagChip
              key={tag.id}
              tag={tag}
              onRemove={onToggleTag && task ? () => onToggleTag(task.id, tag.id) : null}
            />
          ))}

          {onToggleTag && task && (
            <TagPickerPopover
              assignedTagIds={tagIds}
              onToggleTag={(tagId) => onToggleTag(task.id, tagId)}
              module="tasks"
            />
          )}
        </div>
      </div>
      
      <div className="flex align-center gap-8" style={{ flexShrink: 0 }}>
        {onToggleComplete && (
          <button
            className="btn-icon"
            onClick={onToggleComplete}
            title={isCompleted ? "Mark as Todo" : "Mark as Completed"}
            style={{
              background: isCompleted ? 'var(--green, #10B981)' : 'var(--bg2, #FFFFFF)',
              color: isCompleted ? '#FFFFFF' : 'var(--green, #10B981)'
            }}
          >
            <CheckIcon size={14} />
          </button>
        )}
        {onDelete && (
          <button className="btn-icon" onClick={onDelete} title="Delete Task">
            <TrashIcon size={14} />
          </button>
        )}
      </div>
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
