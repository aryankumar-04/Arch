import React, { useEffect } from 'react';
import { CloseIcon } from './Icons';

/**
 * Neubrutalist Duplicate Error / Warning Banner
 * Used across Movies, Wardrobe, and Goals sections when duplicate entries are detected.
 */
const DuplicateErrorBanner = ({ title, message, onClose, autoDismissMs = 4000 }) => {
  useEffect(() => {
    if (!autoDismissMs || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onClose]);

  if (!title && !message) return null;

  return (
    <div
      className="duplicate-error-banner"
      style={{
        background: '#FFFFFF',
        border: '2.5px solid var(--border, #0F0F0F)',
        boxShadow: '4px 4px 0px var(--border, #0F0F0F)',
        padding: '12px 14px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        position: 'relative',
        animation: 'bannerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
      role="alert"
    >
      {/* Warning Badge / Icon */}
      <div
        style={{
          background: 'var(--yellow, #FACC15)',
          color: '#000000',
          border: '2px solid var(--border, #0F0F0F)',
          boxShadow: '2px 2px 0px var(--border, #0F0F0F)',
          width: '32px',
          height: '32px',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 900,
          fontSize: '1rem',
          flexShrink: 0
        }}
      >
        ⚠️
      </div>

      {/* Title & Description */}
      <div style={{ flex: 1, paddingRight: '8px' }}>
        <h4
          style={{
            margin: 0,
            fontSize: '0.88rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text, #0F0F0F)',
            letterSpacing: '0.02em',
            lineHeight: 1.2
          }}
        >
          {title || '⚠️ DUPLICATE ENTRY DETECTED'}
        </h4>
        {message && (
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text2, #4A4A4A)',
              lineHeight: 1.35
            }}
          >
            {message}
          </p>
        )}
      </div>

      {/* Manual Dismiss Button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss error banner"
          style={{
            background: 'var(--bg4, #E9E8E3)',
            color: 'var(--text, #0F0F0F)',
            border: '2px solid var(--border, #0F0F0F)',
            boxShadow: '2px 2px 0px var(--border, #0F0F0F)',
            cursor: 'pointer',
            padding: '4px',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
            transition: 'transform 0.1s ease, background 0.1s ease'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'translate(1px, 1px)';
            e.currentTarget.style.boxShadow = '1px 1px 0px var(--border, #0F0F0F)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '2px 2px 0px var(--border, #0F0F0F)';
          }}
        >
          <CloseIcon size={14} />
        </button>
      )}

      {/* CSS Animation Keyframe */}
      <style>{`
        @keyframes bannerSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default DuplicateErrorBanner;
