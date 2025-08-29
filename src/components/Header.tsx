import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormProps {
  onClose: () => void;
}

const LoginForm = ({ onClose }: LoginFormProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const success = login(username, password);
    
    if (success) {
      setUsername('');
      setPassword('');
      onClose();
    } else {
      setError('Invalid username or password');
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label htmlFor="username" className="form-label" style={{
          color: 'var(--text-primary)',
          fontWeight: '600',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 'var(--font-size-sm)'
        }}>
          👤 Username
        </label>
        <input
          type="text"
          id="username"
          className="form-control"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your magical username"
          required
          style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-base)',
            padding: 'var(--space-4)',
            fontFamily: 'Fredoka, sans-serif',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--primary-color)';
            e.target.style.boxShadow = '0 0 0 3px rgba(139, 95, 255, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
      
      <div className="mb-4">
        <label htmlFor="password" className="form-label" style={{
          color: 'var(--text-primary)',
          fontWeight: '600',
          fontFamily: 'Fredoka, sans-serif',
          fontSize: 'var(--font-size-sm)'
        }}>
          🔒 Secret Key
        </label>
        <input
          type="password"
          id="password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your secret admin key"
          required
          style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-base)',
            padding: 'var(--space-4)',
            fontFamily: 'Fredoka, sans-serif',
            transition: 'all 0.3s ease'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--primary-color)';
            e.target.style.boxShadow = '0 0 0 3px rgba(139, 95, 255, 0.2)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '2px solid var(--danger-color)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-4)',
          color: 'var(--danger-light)',
          fontFamily: 'Fredoka, sans-serif',
          textAlign: 'center'
        }} role="alert">
          <span style={{ fontSize: '1.2rem', marginRight: 'var(--space-2)' }}>😱</span>
          <strong>Oops!</strong> {error}
        </div>
      )}

      <div className="d-flex justify-content-end mobile-gap-md">
        <button
          type="button"
          onClick={onClose}
          className="btn family-element"
          disabled={isLoading}
          style={{
            background: 'var(--bg-surface)',
            border: '2px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: 'var(--radius-lg)',
            fontFamily: 'Fredoka, sans-serif',
            fontWeight: '500',
            padding: 'var(--space-3) var(--space-5)',
            minHeight: '48px',
            transition: 'all 0.3s ease'
          }}
        >
          🙅 Cancel
        </button>
        <button
          type="submit"
          className="btn family-element"
          disabled={isLoading}
          style={{
            background: isLoading 
              ? 'var(--text-muted)'
              : 'linear-gradient(135deg, var(--primary-color), var(--accent-purple))',
            border: '2px solid rgba(139, 95, 255, 0.3)',
            color: 'white',
            borderRadius: 'var(--radius-lg)',
            fontFamily: 'Fredoka, sans-serif',
            fontWeight: '600',
            padding: 'var(--space-3) var(--space-5)',
            minHeight: '48px',
            boxShadow: isLoading ? 'none' : '0 4px 15px rgba(139, 95, 255, 0.3)',
            transition: 'all 0.3s ease',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? (
            <>
              <span style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: 'var(--space-2)'
              }} />
              Entering Portal...
            </>
          ) : (
            <>✨ Enter Portal</>
          )}
        </button>
      </div>
    </form>
  );
};

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <header style={{
      background: 'linear-gradient(135deg, var(--bg-primary), var(--bg-secondary))',
      borderBottom: '2px solid var(--border-accent)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      position: 'relative' as const,
      overflow: 'hidden'
    }}>      
      {/* Animated background stars */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 20% 30%, rgba(139, 95, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
        animation: 'twinkle 4s infinite',
        pointerEvents: 'none'
      }} />
      <div className="container-fluid mobile-spacing-md">
        <div className="d-flex justify-content-between align-items-center" style={{ 
          minHeight: '90px',
          gap: '1rem',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Logo and Title */}
          <div className="d-flex align-items-center flex-grow-1 min-width-0">
            <div className="d-flex align-items-center" style={{
              background: 'linear-gradient(135deg, var(--primary-color), var(--accent-purple))',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-3)',
              marginRight: 'var(--space-4)',
              boxShadow: '0 4px 15px rgba(139, 95, 255, 0.4)',
              animation: 'glow-pulse 3s infinite'
            }}>
              <span style={{ 
                fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
              }}>🌟</span>
            </div>
            <div className="min-width-0">
              <h1 className="mb-1 fw-bold" style={{
                fontSize: 'clamp(1.5rem, 6vw, 2.25rem)',
                lineHeight: '1.2',
                fontFamily: 'Fredoka, sans-serif',
                background: 'linear-gradient(135deg, var(--accent-yellow), var(--primary-light), var(--accent-pink))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 30px rgba(139, 95, 255, 0.5)'
              }}>
                iFamily Games ✨
              </h1>
              <div className="mobile-hide" style={{
                color: 'var(--text-secondary)',
                fontWeight: '500',
                fontSize: 'clamp(0.75rem, 2.5vw, 0.9rem)',
                fontFamily: 'Fredoka, sans-serif',
                opacity: '0.9'
              }}>
                🎮 Magical Family Adventures & Sports
              </div>
            </div>
          </div>
          
          {/* Auth Section */}
          <div className="d-flex align-items-center flex-shrink-0">
            {isAuthenticated ? (
              <div className="d-flex align-items-center mobile-gap-md">
                <div className="mobile-hide text-center">
                  <div className="d-flex align-items-center mobile-gap-sm" style={{
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-xl)',
                    padding: 'var(--space-3) var(--space-4)',
                    border: '1px solid var(--border-accent)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
                  }}>
                    <span style={{ fontSize: '1.5rem' }}>👨‍💼</span>
                    <div>
                      <div style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: 'var(--font-size-xs)',
                        fontFamily: 'Fredoka, sans-serif'
                      }}>Welcome!</div>
                      <div style={{ 
                        color: 'var(--primary-color)', 
                        fontWeight: '600',
                        fontSize: 'var(--font-size-sm)',
                        fontFamily: 'Fredoka, sans-serif'
                      }}>Admin</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="btn family-element mobile-full-width"
                  style={{
                    background: 'linear-gradient(135deg, var(--danger-color), #DC2626)',
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    color: 'white',
                    borderRadius: 'var(--radius-xl)',
                    fontFamily: 'Fredoka, sans-serif',
                    fontWeight: '600',
                    padding: 'var(--space-3) var(--space-5)',
                    minHeight: '48px',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                    boxShadow: '0 4px 15px rgba(248, 113, 113, 0.3)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span className="mobile-hide">🚪 Sign Out</span>
                  <span className="mobile-show">🚪</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="btn family-element"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-color), var(--accent-purple))',
                  border: '1px solid rgba(139, 95, 255, 0.3)',
                  color: 'white',
                  borderRadius: 'var(--radius-xl)',
                  fontWeight: '600',
                  fontFamily: 'Fredoka, sans-serif',
                  padding: 'var(--space-4) var(--space-6)',
                  boxShadow: '0 4px 20px rgba(139, 95, 255, 0.4)',
                  transition: 'all 0.3s ease',
                  minHeight: '48px',
                  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
                }}
              >
                <span className="mobile-hide">🔐 Admin Portal</span>
                <span className="mobile-show">🔐</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Magical Login Portal */}
      {showLogin && (
        <div style={{
          background: 'linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary))',
          borderTop: '2px solid var(--border-accent)',
          padding: 'var(--space-6)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Magic sparkles background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(139, 95, 255, 0.1) 0%, transparent 40%), radial-gradient(circle at 70% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 40%)',
            animation: 'twinkle 3s infinite',
            pointerEvents: 'none'
          }} />
          <div className="container-fluid mobile-spacing-md">
            <div className="row justify-content-center">
              <div className="col-12 col-md-6 col-lg-4">
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '2px solid var(--border-accent)',
                  borderRadius: 'var(--radius-2xl)',
                  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.3)',
                  overflow: 'hidden',
                  position: 'relative',
                  zIndex: 1
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, var(--primary-color), var(--accent-purple))',
                    padding: 'var(--space-5)',
                    textAlign: 'center',
                    position: 'relative'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>🔐</div>
                    <h5 className="mb-2 text-white fw-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                      Admin Portal
                    </h5>
                    <small style={{ color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'Fredoka, sans-serif' }}>
                      Secure access to manage family events ✨
                    </small>
                    {/* Animated border */}
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
                      animation: 'shimmer 2s ease-in-out infinite'
                    }} />
                  </div>
                  <div style={{ padding: 'var(--space-6)' }}>
                    <LoginForm onClose={() => setShowLogin(false)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;