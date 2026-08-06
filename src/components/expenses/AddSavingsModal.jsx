import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

const AddSavingsModal = ({ isOpen, onClose, goal = null, onConfirmAdd }) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !goal) return;

    setIsSubmitting(true);
    try {
      await onConfirmAdd(goal.id, Number(amount));
      setAmount('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!goal) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`💰 ADD TO SAVINGS: ${goal.name.toUpperCase()}`}
    >
      <form onSubmit={handleSubmit}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text2)', fontWeight: 700, marginBottom: '16px' }}>
          Current Saved: <strong>₹{Number(goal.savedAmount || 0).toLocaleString()}</strong> / ₹{Number(goal.targetAmount || 0).toLocaleString()}
        </p>

        <div className="form-group">
          <label>AMOUNT TO ADD THIS MONTH (₹)</label>
          <input
            type="number"
            className="form-input"
            placeholder="e.g. 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="flex flex-between mt-24">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            CANCEL
          </button>
          <Button type="submit" variant="primary" loading={isSubmitting} loadingText="ADDING...">
            ADD TO SAVINGS
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddSavingsModal;
