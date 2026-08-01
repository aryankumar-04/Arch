import { useState, useEffect } from 'react';

const MESSAGES = [
  "⚡ BOOTING ARCH COMMAND CENTER...",
  "🔒 SYNCING FIRESTORE & LOCAL STORAGE...",
  "🎬 LOADING MOVIES & MEDIA MODULES...",
  "👔 INITIALIZING WARDROBE STUDIO...",
  "🎯 PREPARING GOALS & DASHBOARD METRICS...",
  "🚀 LAUNCHING ARCH WORKSPACE..."
];

const LoadingScreen = () => {
  const [progress, setProgress] = useState(15);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 95;
        return prev + Math.floor(Math.random() * 15) + 10;
      });
    }, 250);

    const msgTimer = setInterval(() => {
      setMsgIdx(prev => (prev + 1) % MESSAGES.length);
    }, 600);

    return () => {
      clearInterval(progressTimer);
      clearInterval(msgTimer);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      {/* Neo-brutalist Container */}
      <div
        className="card"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '40px 32px',
          textAlign: 'center',
          background: 'var(--bg2)',
          border: '3px solid var(--border)',
          boxShadow: '8px 8px 0px var(--border)',
          position: 'relative'
        }}
      >
        {/* Animated Pulsing Logo */}
        <div
          style={{
            width: '80px',
            height: '80px',
            background: 'var(--accent)',
            color: '#FFFFFF',
            border: '3px solid var(--border)',
            boxShadow: '5px 5px 0px var(--border)',
            margin: '0 auto 24px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '2.5rem',
            fontWeight: 900,
            animation: 'pulse 1.5s infinite ease-in-out'
          }}
        >
          A
        </div>

        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
          ARCH
        </h2>
        <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text2)', textTransform: 'uppercase', marginBottom: '28px' }}>
          Personal Life Command Center
        </p>

        {/* Progress Bar Container */}
        <div style={{ marginBottom: '16px' }}>
          <div className="flex flex-between align-center mb-4" style={{ fontSize: '0.75rem', fontWeight: 900 }}>
            <span style={{ color: 'var(--text2)' }}>SYSTEM BOOT</span>
            <span style={{ color: 'var(--accent)' }}>{progress}%</span>
          </div>

          <div
            style={{
              width: '100%',
              height: '16px',
              background: 'var(--bg4)',
              border: '2px solid var(--border)',
              boxShadow: '3px 3px 0px var(--border)',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                background: 'var(--yellow)',
                borderRight: progress < 100 ? '2px solid var(--border)' : 'none',
                transition: 'width 0.25s ease'
              }}
            />
          </div>
        </div>

        {/* Ticker Message */}
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 900,
            color: 'var(--text)',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            padding: '4px 12px'
          }}
        >
          {MESSAGES[msgIdx]}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); boxShadow: 7px 7px 0px var(--border); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
