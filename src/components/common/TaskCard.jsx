import React, { memo } from 'react';
import { TrashIcon } from './Icons';

const TaskCard = memo(({ title, status, onDelete }) => {
  return (
    <div className="task-list-item">
      <div className="task-info">
        <h4>{title}</h4>
        {status && <p>Status: {status}</p>}
      </div>
      {onDelete && (
        <button className="btn-icon" onClick={onDelete} title="Delete Task">
          <TrashIcon size={14} />
        </button>
      )}
    </div>
  );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
