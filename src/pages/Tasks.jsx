import { useEffect, useState } from 'react';
import { useTaskStore } from '../store';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import TaskCard from '../components/common/TaskCard';
import { PlusIcon } from '../components/common/Icons';

const Tasks = () => {
  const { tasks, loading, fetchTasks, addTask, deleteTask } = useTaskStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    addTask(newTaskTitle);
    setNewTaskTitle('');
  };

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
          <Button type="submit" variant="primary" icon={<PlusIcon />}>
            Add Task
          </Button>
        </form>
      </Card>

      <Card style={{ padding: 0 }}>
        {loading ? (
          <div className="empty-state">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No tasks found. Add one above!</p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard 
              key={task.id}
              title={task.title}
              status={task.status}
              onDelete={() => deleteTask(task.id)}
            />
          ))
        )}
      </Card>
    </div>
  );
};

export default Tasks;