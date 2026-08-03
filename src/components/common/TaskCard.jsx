import React, { memo } from 'react';
import { TrashIcon, CheckIcon } from './Icons';

const TaskCard = memo(({ title, status, onDelete, onToggleComplete }) => {
  const isCompleted = status === 'completed';

  return (
    <div className={`task-list-item ${isCompleted ? 'completed' : ''}`}>
      <div className="task-info" style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <h4 
          title={title}
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
          {title}
        </h4>
        {status && (
          <p style={{ opacity: isCompleted ? 0.6 : 1 }}>
            Status: {status}
          </p>
        )}
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
