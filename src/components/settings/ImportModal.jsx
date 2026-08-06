import React, { useState, useMemo } from 'react';
import Modal from '../common/Modal';
import { saveLocalUserBackup, getLocalUserBackup } from '../../utils/userStorage';
import { useAuthStore, syncAllStoresForUser } from '../../store/useAuthStore';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { PRESET_TAGS } from '../../store/useTagStore';

export const ImportModal = ({ isOpen, onClose, rawData, onImportSuccess }) => {
  const [importMode, setImportMode] = useState('merge'); // 'merge' | 'replace'
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Validate & parse JSON payload
  const parsedData = useMemo(() => {
    if (!rawData) return null;
    try {
      const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      return data;
    } catch (err) {
      return null;
    }
  }, [rawData]);

  const summary = useMemo(() => {
    if (!parsedData) return null;

    const tasksCount = Array.isArray(parsedData.tasks) ? parsedData.tasks.length : 0;
    const journalCount = Array.isArray(parsedData.dailyJournal) ? parsedData.dailyJournal.length : 0;
    const expensesCount = Array.isArray(parsedData.expenses?.items) ? parsedData.expenses.items.length : 0;
    const recurringCount = Array.isArray(parsedData.expenses?.recurringExpenses) ? parsedData.expenses.recurringExpenses.length : 0;
    const savingsGoalsCount = Array.isArray(parsedData.expenses?.savingsGoals) ? parsedData.expenses.savingsGoals.length : 0;
    const gymCount = Array.isArray(parsedData.gymWorkouts) ? parsedData.gymWorkouts.length : 0;
    const codingCount = Array.isArray(parsedData.codingHub?.problems) ? parsedData.codingHub.problems.length : 0;
    const moviesCount = Array.isArray(parsedData.movies) ? parsedData.movies.length : 0;
    const wardrobeCount = Array.isArray(parsedData.wardrobe?.items) ? parsedData.wardrobe.items.length : 0;
    const goalsCount = Array.isArray(parsedData.goals?.items) ? parsedData.goals.items.length : 0;

    const totalCount = tasksCount + journalCount + expensesCount + recurringCount + savingsGoalsCount + gymCount + codingCount + moviesCount + wardrobeCount + goalsCount;

    return {
      tasksCount,
      journalCount,
      expensesCount,
      recurringCount,
      savingsGoalsCount,
      gymCount,
      codingCount,
      moviesCount,
      wardrobeCount,
      goalsCount,
      totalCount,
      exportedAt: parsedData.meta?.exportedAt ? new Date(parsedData.meta.exportedAt).toLocaleDateString() : 'Unknown date'
    };
  }, [parsedData]);

  const handleConfirmImport = async () => {
    if (!parsedData || !summary || summary.totalCount === 0) {
      setErrorMsg('No valid ArchOS data found in this JSON file.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const user = useAuthStore.getState().user;
      const uid = user ? user.uid : 'guest';

      const helperSave = (moduleName, newItems, existingItems = []) => {
        let finalData = [];
        if (importMode === 'merge') {
          const existingIds = new Set(existingItems.map(i => i.id || `${i.title || i.name}_${i.date || i.createdAt}`));
          const uniqueNew = newItems.filter(i => !existingIds.has(i.id || `${i.title || i.name}_${i.date || i.createdAt}`));
          finalData = [...uniqueNew, ...existingItems];
        } else {
          finalData = newItems;
        }
        saveLocalUserBackup(moduleName, uid, finalData);
        return finalData;
      };

      // 1. Tags Handling & Recreation
      let importedTags = Array.isArray(parsedData.tags) ? parsedData.tags : [];

      const extractEmbeddedTags = (items) => {
        if (!Array.isArray(items)) return;
        items.forEach(item => {
          if (Array.isArray(item.tags)) {
            item.tags.forEach(tg => {
              if (tg && tg.id && !importedTags.some(t => t.id === tg.id)) {
                importedTags.push(tg);
              }
            });
          }
        });
      };
      extractEmbeddedTags(parsedData.tasks);
      extractEmbeddedTags(parsedData.goals?.items);

      const customImportedTags = importedTags.filter(t => t && t.type === 'custom' && !PRESET_TAGS.some(p => p.id === t.id));
      if (customImportedTags.length > 0) {
        const existingTags = getLocalUserBackup('tags', uid, []);
        helperSave('tags', customImportedTags, existingTags);
      }

      // 2. Sync LocalStorage backups per module
      if (Array.isArray(parsedData.tasks)) {
        helperSave('tasks', parsedData.tasks);
      }
      if (Array.isArray(parsedData.dailyJournal)) {
        helperSave('journal', parsedData.dailyJournal);
      }
      if (Array.isArray(parsedData.calendarEvents)) {
        helperSave('calendar', parsedData.calendarEvents);
      }
      if (Array.isArray(parsedData.gymWorkouts)) {
        helperSave('gym', parsedData.gymWorkouts);
      }
      if (Array.isArray(parsedData.expenses?.items)) {
        helperSave('expenses', parsedData.expenses.items);
      }
      if (Array.isArray(parsedData.expenses?.recurringExpenses)) {
        helperSave('recurring_expenses', parsedData.expenses.recurringExpenses);
      }
      if (Array.isArray(parsedData.expenses?.savingsGoals)) {
        helperSave('savings_goals', parsedData.expenses.savingsGoals);
      }
      if (parsedData.expenses?.monthlyBudgetCap !== undefined) {
        saveLocalUserBackup('monthlyBudgetCap', uid, parsedData.expenses.monthlyBudgetCap);
      }
      if (Array.isArray(parsedData.codingHub?.problems)) {
        helperSave('coding_problems', parsedData.codingHub.problems);
      }
      if (parsedData.codingHub?.handles) {
        saveLocalUserBackup('coding_handles', uid, parsedData.codingHub.handles);
      }
      if (Array.isArray(parsedData.movies)) {
        helperSave('movies', parsedData.movies);
      }
      if (Array.isArray(parsedData.wardrobe?.items)) {
        helperSave('wardrobe_items', parsedData.wardrobe.items);
      }
      if (Array.isArray(parsedData.wardrobe?.outfits)) {
        helperSave('wardrobe_outfits', parsedData.wardrobe.outfits);
      }
      if (Array.isArray(parsedData.goals?.items)) {
        helperSave('goals', parsedData.goals.items);
      }

      // 3. If Firestore user is active, batch sync to Firestore
      if (user) {
        try {
          const syncSubcollection = async (subcolName, items) => {
            if (!Array.isArray(items) || items.length === 0) return;
            const batch = writeBatch(db);
            items.forEach(item => {
              const docId = item.id || `imp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
              const docRef = doc(db, 'users', uid, subcolName, docId);
              batch.set(docRef, item, { merge: importMode === 'merge' });
            });
            await batch.commit();
          };

          if (customImportedTags.length > 0) {
            await syncSubcollection('tags', customImportedTags);
          }

          await syncSubcollection('tasks', parsedData.tasks);
          await syncSubcollection('journal', parsedData.dailyJournal);
          await syncSubcollection('calendar', parsedData.calendarEvents);
          await syncSubcollection('workouts', parsedData.gymWorkouts);
          await syncSubcollection('expenses', parsedData.expenses?.items);
          await syncSubcollection('recurring_expenses', parsedData.expenses?.recurringExpenses);
          await syncSubcollection('savings_goals', parsedData.expenses?.savingsGoals);
          await syncSubcollection('coding_problems', parsedData.codingHub?.problems);
          await syncSubcollection('movies', parsedData.movies);
          await syncSubcollection('wardrobe_items', parsedData.wardrobe?.items);
          await syncSubcollection('goals', parsedData.goals?.items);
        } catch (fsErr) {
          console.warn('Firestore sync during import warning:', fsErr);
        }
      }

      // 4. Rehydrate all Zustand stores in memory immediately
      syncAllStoresForUser(user);

      setIsProcessing(false);
      onImportSuccess(summary);
      onClose();
    } catch (err) {
      console.error('Import failure error:', err);
      setErrorMsg('Failed to restore data. Please verify the JSON file format.');
      setIsProcessing(false);
    }
  };

  if (!parsedData && rawData) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="⚠️ INVALID DATA FILE">
        <p style={{ color: 'var(--red)', fontWeight: 700, marginBottom: '20px' }}>
          Could not parse JSON data. Please select a valid ArchOS backup export file.
        </p>
        <div className="flex justify-end">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📥 IMPORT ARCHOS BACKUP">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorMsg && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--red-light, #FEE2E2)',
            color: 'var(--red, #EF4444)',
            border: 'var(--bw) solid var(--border)',
            borderRadius: '6px',
            fontWeight: 800,
            fontSize: '0.85rem'
          }}>
            {errorMsg}
          </div>
        )}

        {summary && (
          <div style={{
            background: 'var(--bg2)',
            border: 'var(--bw) solid var(--border)',
            padding: '16px',
            borderRadius: '6px'
          }}>
            <div style={{ fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px', fontSize: '0.9rem' }}>
              📦 BACKUP CONTENT PREVIEW
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '12px' }}>
              Exported on: <strong>{summary.exportedAt}</strong>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '8px',
              fontSize: '0.8rem',
              fontWeight: 800
            }}>
              <div>✅ Tasks: {summary.tasksCount}</div>
              <div>📖 Journal: {summary.journalCount}</div>
              <div>💰 Expenses: {summary.expensesCount}</div>
              <div>📅 Fixed Expenses: {summary.recurringCount}</div>
              <div>🎯 Savings Goals: {summary.savingsGoalsCount}</div>
              <div>💪 Workouts: {summary.gymCount}</div>
              <div>💻 Coding: {summary.codingCount}</div>
              <div>🎬 Movies: {summary.moviesCount}</div>
              <div>👗 Wardrobe: {summary.wardrobeCount}</div>
              <div>🎯 Goals: {summary.goalsCount}</div>
            </div>
          </div>
        )}

        {/* Import Mode Radio Options */}
        <div style={{ borderTop: 'var(--bw) solid var(--border)', paddingTop: '16px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            SELECT IMPORT METHOD:
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800 }}>
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={importMode === 'merge'}
                onChange={() => setImportMode('merge')}
              />
              🔀 Merge with existing data (keeps non-duplicate current items)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 800 }}>
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => setImportMode('replace')}
              />
              ⚠️ Overwrite / Replace current data with imported backup
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-between mt-16">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isProcessing}>
            CANCEL
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirmImport}
            disabled={isProcessing}
          >
            {isProcessing ? 'IMPORTING...' : 'RESTORE BACKUP DATA'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportModal;
