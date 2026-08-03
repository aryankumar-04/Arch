import { useEffect, useState } from 'react';
import { useTaskStore } from '../store';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import TaskCard from '../components/common/TaskCard';
import Skeleton from '../components/common/Skeleton';
import { PlusIcon } from '../components/common/Icons';

const Tasks = () => {
  const { tasks, loading, fetchTasks, addTask, toggleTaskStatus, deleteTask } = useTaskStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await addTask(newTaskTitle);
      setNewTaskTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const aCompleted = a.status === 'completed';
    const bCompleted = b.status === 'completed';
    if (aCompleted !== bCompleted) {
      return aCompleted ? 1 : -1;
    }
    return 0;
  });

  return (
    <div>
      <div className="page-header">
        <h1>✅ Quick Tasks</h1>
      </div>
      
      <Card className="mb-24">
        <form onSubmit={handleAddTask} className="flex gap-12">
          <input 
            type="text" 
            className="form-input flex-1" 
            placeholder="What needs to be done?" 
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
          />
          <Button type="submit" variant="primary" icon={<PlusIcon />} loading={isSubmitting} loadingText="Adding...">
            Add Task
          </Button>
        </form>
      </Card>

      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '20px' }}>
            <Skeleton type="text" count={4} height="40px" />
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No tasks found. Add one above!</p>
          </div>
        ) : (
          sortedTasks.map(task => (
            <TaskCard 
              key={task.id}
              title={task.title}
              status={task.status}
              onToggleComplete={() => toggleTaskStatus(task.id)}
              onDelete={() => deleteTask(task.id)}
            />
          ))
        )}
      </Card>
    </div>
  );
};

export default Tasks;