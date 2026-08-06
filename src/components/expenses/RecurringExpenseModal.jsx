import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import DuplicateErrorBanner from '../common/DuplicateErrorBanner';

const CATEGORIES = ['Food', 'Transport', 'College', 'Entertainment', 'Home', 'Health', 'Cloud Storage', 'Music', 'Utilities', 'Other'];
const FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];

const RecurringExpenseModal = ({ isOpen, onClose, initialData = null, onSave }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState('Monthly');
  const [renewDate, setRenewDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Home');
  const [iconUrl, setIconUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState(null);

  useEffect(() => {
    setDuplicateError(null);
    if (initialData) {
      setName(initialData.name || '');
      setAmount(initialData.amount ? String(initialData.amount) : '');
      setFrequency(initialData.frequency || 'Monthly');
      setRenewDate(initialData.renewDate || new Date().toISOString().split('T')[0]);
      setCategory(initialData.category || 'Home');
      setIconUrl(initialData.iconUrl || '');
    } else {
      setName('');
      setAmount('');
      setFrequency('Monthly');
      setRenewDate(new Date().toISOString().split('T')[0]);
      setCategory('Home');
      setIconUrl('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    setDuplicateError(null);
    setIsSubmitting(true);
    try {
      const res = await onSave({
        name: name.trim(),
        amount: Number(amount),
        frequency,
        renewDate,
        category,
        iconUrl: iconUrl.trim()
      });

      if (res && res.error === 'duplicate') {
        setDuplicateError({
          title: '⚠️ FIXED EXPENSE ALREADY EXISTS',
          message: res.message
        });
        return;
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setDuplicateError(null);
        onClose();
      }}
      title={initialData ? "✏️ EDIT FIXED EXPENSE" : "📅 ADD FIXED EXPENSE"}
    >
      <form onSubmit={handleSubmit}>
        {duplicateError && (
          <DuplicateErrorBanner
            title={duplicateError.title}
            message={duplicateError.message}
            onClose={() => setDuplicateError(null)}
          />
        )}

        <div className="form-group">
          <label>EXPENSE NAME</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Netflix, Spotify, House Rent, Wifi..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>AMOUNT (₹)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 649"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>FREQUENCY</label>
            <select
              className="form-select"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              {FREQUENCIES.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>RENEW / ANCHOR DATE</label>
            <input
              type="date"
              className="form-input"
              value={renewDate}
              onChange={(e) => setRenewDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>CATEGORY</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>ICON URL (OPTIONAL)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Paste custom image/logo URL or leave blank for auto-icon"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
          />
        </div>

        <div className="flex flex-between mt-24">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            CANCEL
          </button>
          <Button type="submit" variant="primary" loading={isSubmitting} loadingText="SAVING...">
            SAVE EXPENSE
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RecurringExpenseModal;
