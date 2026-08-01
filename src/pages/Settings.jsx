import { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import { useSettingsStore, useTaskStore } from '../store';
import { LinkedInIcon } from '../components/common/Icons';

const Settings = () => {
  const {
    username, creatorName, linkedinUrl, themePreset, accentColor,
    setUsername, setThemePreset, setCustomAccentColor, initSettings
  } = useSettingsStore();

  const [storageKB, setStorageKB] = useState('0.0 KB');
  const [nameInput, setNameInput] = useState(username || 'Aryan');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    initSettings();
    calculateStorageUsage();
  }, [initSettings]);

  const calculateStorageUsage = () => {
    try {
      let totalBytes = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalBytes += (localStorage[key].length + key.length) * 2; // UTF-16
        }
      }
      const kb = (totalBytes / 1024).toFixed(1);
      setStorageKB(`${kb} KB`);
    } catch (err) {
      console.warn('Could not calculate storage usage:', err);
      setStorageKB('Unknown');
    }
  };

  const handleSaveUsername = (e) => {
    e.preventDefault();
    setUsername(nameInput);
  };

  // 1. Export All Data (JSON)
  const handleExportJSON = () => {
    try {
      const allData = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('archos_')) {
          allData[key] = localStorage.getItem(key);
        }
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `arch_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // 2. Import Data (JSON)
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        for (let key in importedData) {
          if (importedData.hasOwnProperty(key)) {
            const val = typeof importedData[key] === 'string' ? importedData[key] : JSON.stringify(importedData[key]);
            localStorage.setItem(key, val);
          }
        }
        setImportStatus('✓ Data imported successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1200);
      } catch (err) {
        console.error('Import parse error:', err);
        setImportStatus('❌ Error importing file. Invalid JSON format.');
      }
    };
    reader.readAsText(file);
  };

  // 3. Export Tasks (CSV)
  const handleExportTasksCSV = () => {
    try {
      const tasks = useTaskStore.getState().tasks || [];
      let csvContent = "data:text/csv;charset=utf-8,Title,Status,Priority,Created\n";
      tasks.forEach(t => {
        csvContent += `"${(t.title || '').replace(/"/g, '""')}","${t.status || ''}","${t.priority || ''}","${t.createdAt || ''}"\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `arch_tasks_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export tasks failed:', err);
      alert('No tasks data to export.');
    }
  };

  // 4. Reset All Data
  const handleResetData = () => {
    if (resetConfirmInput !== 'RESET') return;
    for (let key in localStorage) {
      if (key.startsWith('archos_')) {
        localStorage.removeItem(key);
      }
    }
    window.location.reload();
  };

  const presetOptions = [
    { key: 'paper', label: '📄 Paper Soft', color: '#2563EB' },
    { key: 'dark', label: '🌑 Cyber Dark', color: '#18181B' },
    { key: 'cobalt', label: '🔵 Cobalt Blue', color: '#1D4ED8' },
    { key: 'amber', label: '🟡 Cyber Amber', color: '#D97706' },
    { key: 'violet', label: '🟣 Electric Violet', color: '#7C3AED' },
    { key: 'emerald', label: '🟢 Emerald Mint', color: '#059669' },
    { key: 'crimson', label: '🔴 Crimson Red', color: '#DC2626' }
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1>⚙️ SETTINGS</h1>
      </div>

      <div className="grid-2 mb-24">
        {/* DATA MANAGEMENT CARD matching screenshot */}
        <Card>
          <h3 className="card-title">💾 DATA MANAGEMENT</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handleExportJSON}>
              💾 EXPORT ALL DATA (JSON)
            </button>

            <label className="btn btn-ghost" style={{ cursor: 'pointer', margin: 0, textAlign: 'center' }}>
              📥 IMPORT DATA (JSON)
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                style={{ display: 'none' }}
              />
            </label>
            {importStatus && (
              <div style={{ fontSize: '0.8rem', fontWeight: 800, textAlign: 'center' }}>{importStatus}</div>
            )}

            <button className="btn btn-ghost" onClick={handleExportTasksCSV}>
              📊 EXPORT TASKS (CSV)
            </button>

            <button className="btn btn-danger" onClick={() => { setResetConfirmInput(''); setIsResetModalOpen(true); }}>
              🗑️ RESET ALL DATA
            </button>
          </div>
        </Card>

        {/* ABOUT ARCHOS CARD matching screenshot */}
        <Card>
          <h3 className="card-title">ℹ️ ABOUT ARCHOS</h3>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text2)', marginBottom: '16px' }}>
            <strong>ArchOS</strong> is your personal life dashboard.<br />
            All data is stored locally in your browser using LocalStorage & Firestore.<br />
            Private, customizable, and high-performance.
          </p>

          <div style={{ fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>
            Keyboard Shortcuts:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
            <div className="flex align-center gap-12">
              <kbd style={{ background: 'var(--bg4)', border: '1px solid var(--border)', padding: '2px 8px', fontWeight: 900 }}>Ctrl+K</kbd>
              <span>Global Search</span>
            </div>
            <div className="flex align-center gap-12">
              <kbd style={{ background: 'var(--bg4)', border: '1px solid var(--border)', padding: '2px 8px', fontWeight: 900 }}>Ctrl+N</kbd>
              <span>Quick Add Task</span>
            </div>
            <div className="flex align-center gap-12">
              <kbd style={{ background: 'var(--bg4)', border: '1px solid var(--border)', padding: '2px 8px', fontWeight: 900 }}>Esc</kbd>
              <span>Close Modal / Search</span>
            </div>
          </div>
        </Card>
      </div>

      {/* CREATED BY - CREATOR PROFILE SECTION */}
      <div className="mb-24">
        <Card style={{ background: 'linear-gradient(135deg, var(--bg2) 0%, var(--bg4) 100%)', border: '3px solid var(--border)', boxShadow: '6px 6px 0px var(--border)' }}>
          <div className="flex flex-between align-center flex-wrap gap-16 mb-16">
            <div>
              <span className="badge" style={{ background: '#0A66C2', color: '#FFF', fontSize: '0.75rem', fontWeight: 900, marginBottom: '8px', display: 'inline-block' }}>
                VERIFIED CREATOR CREDENTIALS
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, textTransform: 'uppercase' }}>
                🚀 CREATED BY {creatorName || 'ARYAN KUMAR GUPTA'}
              </h2>
            </div>

            <a
              href={linkedinUrl || 'https://www.linkedin.com/in/aryankumargupta04'}
              target="_blank"
              rel="noopener noreferrer"
              className="btn flex align-center gap-8"
              style={{
                background: '#0A66C2',
                color: '#FFF',
                padding: '12px 22px',
                fontSize: '0.95rem',
                fontWeight: 900,
                border: '2px solid var(--border)',
                boxShadow: '4px 4px 0px var(--border)',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <LinkedInIcon size={20} />
              <span>CONNECT ON LINKEDIN</span>
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>↗</span>
            </a>
          </div>

          <div className="flex flex-between align-center flex-wrap gap-16" style={{ background: 'var(--bg2)', padding: '20px', border: '2px solid var(--border)', boxShadow: '3px 3px 0px var(--border)' }}>
            <div className="flex align-center gap-16">
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  background: 'var(--yellow)',
                  color: 'var(--border)',
                  border: '2.5px solid var(--border)',
                  boxShadow: '3px 3px 0px var(--border)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 900,
                  fontSize: '1.5rem'
                }}
              >
                AG
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.15rem', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                  {creatorName || 'Aryan Kumar Gupta'}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text2)', marginTop: '2px' }}>
                  Software Engineer
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg4)', padding: '8px 14px', border: '1.5px solid var(--border)', fontWeight: 800, fontSize: '0.82rem' }}>
              <span style={{ color: 'var(--text2)' }}>LinkedIn Profile:</span>
              <a
                href={linkedinUrl || 'https://www.linkedin.com/in/aryankumargupta04'}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0A66C2', textDecoration: 'none', fontWeight: 900 }}
              >
                in/aryankumargupta04 ↗
              </a>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid-2 mb-24">
        {/* STORAGE USAGE CARD matching screenshot */}
        <Card>
          <h3 className="card-title">📊 STORAGE USAGE</h3>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '8px' }}>
            Total Used: <span style={{ color: 'var(--accent)' }}>{storageKB}</span>
          </div>
          <p className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            Browser LocalStorage Limit: ~5 MB
          </p>
        </Card>

        {/* DYNAMIC THEME & PROFILE CARD */}
        <Card>
          <h3 className="card-title">🎨 THEME & PROFILE PREFERENCES</h3>

          {/* Custom Username Input */}
          <form onSubmit={handleSaveUsername} className="mb-20">
            <label className="form-group" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>CUSTOM USERNAME</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter display name..."
                required
              />
              <button type="submit" className="btn btn-yellow">
                SAVE NAME
              </button>
            </div>
          </form>

          {/* Preset Theme Selection */}
          <div className="mb-20">
            <label className="form-group" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>SELECT THEME PRESET</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {presetOptions.map(preset => (
                <button
                  key={preset.key}
                  type="button"
                  className={`btn btn-sm ${themePreset === preset.key ? 'btn-yellow' : 'btn-ghost'}`}
                  onClick={() => setThemePreset(preset.key)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Color Picker */}
          <div>
            <label className="form-group" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase' }}>CUSTOM ACCENT COLOR PICKER</span>
            </label>
            <div className="flex align-center gap-16">
              <input
                type="color"
                value={accentColor || '#2563EB'}
                onChange={(e) => setCustomAccentColor(e.target.value)}
                style={{
                  width: '48px',
                  height: '48px',
                  border: 'var(--bw) solid var(--border)',
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0px var(--border)'
                }}
              />
              <span style={{ fontWeight: 900, fontSize: '0.9rem' }}>
                Active Color: <code style={{ background: 'var(--bg4)', padding: '2px 6px' }}>{accentColor}</code>
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="⚠️ RESET ALL LOCAL DATA">
        <div>
          <p style={{ fontWeight: 800, color: 'var(--red)', marginBottom: '16px' }}>
            WARNING: This will permanently delete all your local tasks, journal entries, workouts, movies, wardrobe items, and goals. This action CANNOT be undone!
          </p>
          <div className="form-group">
            <label>TYPE "RESET" TO CONFIRM</label>
            <input
              type="text"
              className="form-input"
              value={resetConfirmInput}
              onChange={(e) => setResetConfirmInput(e.target.value)}
              placeholder="Type RESET"
            />
          </div>
          <div className="flex flex-between mt-24">
            <button className="btn btn-ghost" onClick={() => setIsResetModalOpen(false)}>
              CANCEL
            </button>
            <button
              className="btn btn-danger"
              disabled={resetConfirmInput !== 'RESET'}
              onClick={handleResetData}
            >
              PERMANENTLY RESET ALL DATA
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
