import { useEffect, useState } from 'react';
import { useTaskStore, useTagStore } from '../store';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import TaskCard from '../components/common/TaskCard';
import Skeleton from '../components/common/Skeleton';
import TagFilterBar from '../components/tags/TagFilterBar';
import { PlusIcon } from '../components/common/Icons';

const Tasks = () => {
  const { tasks, loading, fetchTasks, addTask, toggleTaskStatus, deleteTask, addTagToTask, removeTagFromTask } = useTaskStore();
  const { tags, fetchTags } = useTagStore();

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState([]);

  useEffect(() => {
    fetchTasks();
    fetchTags();
  }, [fetchTasks, fetchTags]);

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

  const handleToggleFilterTag = (tagId) => {
    setSelectedTagIds(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleClearFilters = () => {
    setSelectedTagIds([]);
  };

  const handleToggleTaskTag = async (taskId, tagId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const currentTagIds = Array.isArray(task.tagIds) ? task.tagIds : [];
    if (currentTagIds.includes(tagId)) {
      await removeTagFromTask(taskId, tagId);
    } else {
      await addTagToTask(taskId, tagId);
    }
  };

  // Filter tasks by selected tags (OR filter logic)
  const filteredTasks = selectedTagIds.length === 0
    ? tasks
    : tasks.filter(t => {
        const taskTagIds = Array.isArray(t.tagIds) ? t.tagIds : [];
        return taskTagIds.some(id => selectedTagIds.includes(id));
      });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
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

      {/* Smart Tag Filter Bar (Tasks Module) */}
      <TagFilterBar
        selectedTagIds={selectedTagIds}
        onToggleFilterTag={handleToggleFilterTag}
        onClearFilters={handleClearFilters}
        module="tasks"
      />

      <Card style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '20px' }}>
            <Skeleton type="text" count={4} height="40px" />
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>{selectedTagIds.length > 0 ? "No tasks match the selected tag filter." : "No tasks found. Add one above!"}</p>
            {selectedTagIds.length > 0 && (
              <button className="btn btn-ghost btn-sm mt-8" onClick={handleClearFilters}>
                Clear Filter
              </button>
            )}
          </div>
        ) : (
          sortedTasks.map(task => (
            <TaskCard 
              key={task.id}
              task={task}
              allTags={tags}
              onToggleComplete={() => toggleTaskStatus(task.id)}
              onDelete={() => deleteTask(task.id)}
              onToggleTag={handleToggleTaskTag}
            />
          ))
        )}
      </Card>
    </div>
  );
};

export default Tasks;