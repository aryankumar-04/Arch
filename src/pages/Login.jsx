import { useAuthStore, useSettingsStore } from '../store';
import { Navigate } from 'react-router-dom';
import LoadingScreen from '../components/common/LoadingScreen';
import { LinkedInIcon } from '../components/common/Icons';

const Login = () => {
  const { user, loginWithGoogle, loading } = useAuthStore();
  const { linkedinUrl, creatorName } = useSettingsStore();

  const linkedinLink = linkedinUrl || 'https://www.linkedin.com/in/aryankumargupta04';
  const author = creatorName || 'Aryan Kumar Gupta';

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  // Guest Demo Mode bypass
  const handleGuestLogin = () => {
    useAuthStore.setState({
      user: {
        uid: 'guest_user',
        email: 'guest@archos.app',
        displayName: 'Guest Commander'
      },
      loading: false
    });
  };

  const featureTags = [
    { title: '⚡ Command Center', color: 'var(--yellow)', delay: '0s' },
    { title: '🎬 IMDb Movies Tracker', color: '#DBEAFE', delay: '0.2s' },
    { title: '👔 Wardrobe Studio', color: '#EDE9FE', delay: '0.4s' },
    { title: '🎯 Milestone Goals', color: '#D1FAE5', delay: '0.6s' },
    { title: '💻 Coding Hub', color: '#FEF3C7', delay: '0.8s' },
    { title: '📓 Sleep & Daily Journal', color: '#FEE2E2', delay: '1s' }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        backgroundImage: `
          radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.08) 0%, transparent 40%),
          radial-gradient(circle at 85% 80%, rgba(250, 204, 21, 0.12) 0%, transparent 45%),
          radial-gradient(var(--border) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 100% 100%, 24px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Floating Animated Background Shapes */}
      <div className="floating-shape shape-1">✦</div>
      <div className="floating-shape shape-2">🎬</div>
      <div className="floating-shape shape-3">🏋️</div>
      <div className="floating-shape shape-4">🎯</div>
      <div className="floating-shape shape-5">💻</div>

      {/* Decorative Floating Feature Tags Row */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '720px',
          marginBottom: '32px',
          zIndex: 2
        }}
      >
        {featureTags.map((tag, idx) => (
          <span
            key={idx}
            className="badge floating-tag"
            style={{
              fontSize: '0.82rem',
              padding: '8px 16px',
              background: tag.color,
              color: 'var(--text)',
              border: '2.5px solid var(--border)',
              boxShadow: '4px 4px 0px var(--border)',
              animationDelay: tag.delay
            }}
          >
            {tag.title}
          </span>
        ))}
      </div>

      {/* Main Animated Login Box */}
      <div
        className="card login-card-animated"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: '48px 36px',
          textAlign: 'center',
          background: 'var(--bg2)',
          border: '3px solid var(--border)',
          boxShadow: '10px 10px 0px var(--border)',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Animated Brand Logo Icon */}
        <div className="logo-badge-animated">
          A
        </div>

        <h1 style={{ color: 'var(--text)', fontWeight: 900, fontSize: '2.4rem', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          ARCH
        </h1>

        <p className="text-muted" style={{ fontWeight: 800, marginBottom: '32px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Personal Life Command Center
        </p>

        {/* Continue with Google Primary Button */}
        <button
          className="btn btn-primary btn-animated-pulse"
          onClick={loginWithGoogle}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '1rem',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.73 17.57V20.34H19.29C21.37 18.42 22.56 15.6 22.56 12.25Z" fill="#fff"/>
            <path d="M12 23C14.97 23 17.46 22.02 19.29 20.34L15.73 17.57C14.74 18.24 13.48 18.64 12 18.64C9.13 18.64 6.7 16.7 5.84 14.09H2.17V16.94C3.98 20.53 7.68 23 12 23Z" fill="#fff"/>
            <path d="M5.84 14.09C5.62 13.43 5.5 12.73 5.5 12C5.5 11.27 5.62 10.57 5.84 9.91V7.06H2.17C1.43 8.55 1 10.22 1 12C1 13.78 1.43 15.45 2.17 16.94L5.84 14.09Z" fill="#fff"/>
            <path d="M12 5.36C13.62 5.36 15.07 5.92 16.22 7.02L19.37 3.87C17.46 2.08 14.97 1 12 1C7.68 1 3.98 3.47 2.17 7.06L5.84 9.91C6.7 7.3 9.13 5.36 12 5.36Z" fill="#fff"/>
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        {/* Guest Demo Secondary Button */}
        <button
          className="btn btn-yellow btn-animated-hover"
          onClick={handleGuestLogin}
          style={{ width: '100%', padding: '14px', fontSize: '0.9rem' }}
        >
          ⚡ EXPLORE AS GUEST DEMO
        </button>

        <div style={{ marginTop: '24px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text2)', textTransform: 'uppercase' }}>
          🔒 Encrypted & Stored Locally on Your Device
        </div>
      </div>

      {/* Creative "Created By" LinkedIn Badge Bar */}
      <div
        className="login-created-by-bar"
        style={{
          marginTop: '32px',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--bg2)',
          padding: '8px 16px 8px 14px',
          border: '2.5px solid var(--border)',
          boxShadow: '4px 4px 0px var(--border)',
          fontSize: '0.8rem',
          fontWeight: 800
        }}
      >
        <span style={{ color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          ⚡ CREATED BY
        </span>
        <a
          href={linkedinLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#0A66C2',
            color: '#FFFFFF',
            padding: '4px 10px',
            textDecoration: 'none',
            fontWeight: 900,
            fontSize: '0.78rem',
            border: '1.5px solid var(--border)',
            boxShadow: '2px 2px 0px var(--border)',
            transition: 'all 0.15s ease'
          }}
          className="login-linkedin-btn"
        >
          <LinkedInIcon size={14} />
          <span>{author}</span>
          <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.25)', padding: '1px 4px' }}>LINKEDIN ↗</span>
        </a>
      </div>

      {/* Embedded Animation Keyframes */}
      <style>{`
        .login-card-animated {
          animation: cardAppear 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .login-linkedin-btn:hover {
          transform: translate(-2px, -2px) !important;
          box-shadow: 4px 4px 0px var(--border) !important;
          background: #004182 !important;
          color: #FFFFFF !important;
        }

        .logo-badge-animated {
          width: 76px;
          height: 76px;
          background: var(--accent);
          color: #FFFFFF;
          border: 3px solid var(--border);
          box-shadow: 5px 5px 0px var(--border);
          margin: 0 auto 20px;
          display: grid;
          place-items: center;
          font-size: 2.3rem;
          font-weight: 900;
          animation: logoFloat 3s ease-in-out infinite alternate;
        }

        .floating-tag {
          animation: pillFloat 3.5s ease-in-out infinite alternate;
          transition: transform 0.2s ease;
        }
        .floating-tag:hover {
          transform: translateY(-4px) scale(1.05) !important;
          box-shadow: 6px 6px 0px var(--border) !important;
        }

        .btn-animated-pulse:hover {
          transform: translate(-3px, -3px);
          box-shadow: 7px 7px 0px var(--border);
        }

        .floating-shape {
          position: absolute;
          font-size: 2rem;
          opacity: 0.25;
          pointer-events: none;
          user-select: none;
          z-index: 1;
        }
        .shape-1 { top: 10%; left: 8%; animation: spinFloat 8s linear infinite; font-size: 3rem; color: var(--accent); }
        .shape-2 { top: 75%; left: 6%; animation: bobbing 4s ease-in-out infinite alternate; font-size: 2.8rem; }
        .shape-3 { top: 15%; right: 8%; animation: bobbing 5s ease-in-out infinite alternate-reverse; font-size: 2.8rem; }
        .shape-4 { top: 70%; right: 7%; animation: spinFloat 10s linear infinite reverse; font-size: 3rem; }
        .shape-5 { bottom: 8%; left: 45%; animation: bobbing 3.5s ease-in-out infinite alternate; font-size: 2.2rem; }

        @keyframes cardAppear {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes logoFloat {
          0% { transform: translateY(0px) rotate(0deg); boxShadow: 5px 5px 0px var(--border); }
          100% { transform: translateY(-8px) rotate(-3deg); boxShadow: 9px 9px 0px var(--border); }
        }

        @keyframes pillFloat {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-6px); }
        }

        @keyframes bobbing {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(-16px) rotate(8deg); }
        }

        @keyframes spinFloat {
          0% { transform: rotate(0deg) translateY(0px); }
          50% { transform: rotate(180deg) translateY(-10px); }
          100% { transform: rotate(360deg) translateY(0px); }
        }
      `}</style>
    </div>
  );
};

export default Login;