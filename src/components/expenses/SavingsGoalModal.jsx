import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

const SavingsGoalModal = ({ isOpen, onClose, initialData = null, onSave }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setTargetAmount(initialData.targetAmount ? String(initialData.targetAmount) : '');
      setIconUrl(initialData.iconUrl || '');
    } else {
      setName('');
      setTargetAmount('');
      setIconUrl('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        targetAmount: Number(targetAmount),
        iconUrl: iconUrl.trim()
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "✏️ EDIT SAVINGS GOAL" : "🎯 NEW SAVINGS GOAL"}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>GOAL NAME</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. New Laptop, Goa Trip, Emergency Fund..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>TARGET AMOUNT (₹)</label>
          <input
            type="number"
            className="form-input"
            placeholder="e.g. 80000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>ICON URL (OPTIONAL)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Paste custom image/icon URL or leave blank for auto-icon"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
          />
        </div>

        <div className="flex flex-between mt-24">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            CANCEL
          </button>
          <Button type="submit" variant="primary" loading={isSubmitting} loadingText="SAVING...">
            SAVE GOAL
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SavingsGoalModal;
