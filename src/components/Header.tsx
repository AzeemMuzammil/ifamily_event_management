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
      <div className="mb-3">
        <label htmlFor="username" className="form-label">
          👤 Username
        </label>
        <input
          type="text"
          id="username"
          className="form-control"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
          required
        />
      </div>
      
      <div className="mb-3">
        <label htmlFor="password" className="form-label">
          🔒 Password
        </label>
        <input
          type="password"
          id="password"
          className="form-control"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
      </div>

      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      <div className="d-flex justify-content-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-outline-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Logging in...
            </>
          ) : (
            <>🚀 Login</>
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
      background: 'linear-gradient(135deg, var(--primary-color), var(--primary-600))',
      boxShadow: 'var(--shadow-lg)',
      backdropFilter: 'blur(10px)'
    }}>
      <div className="container-fluid mobile-spacing-md">
        <div className="d-flex justify-content-between align-items-center" style={{ 
          minHeight: '80px',
          gap: '1rem'
        }}>
          {/* Logo and Title */}
          <div className="d-flex align-items-center flex-grow-1 min-width-0">
            <span style={{ 
              fontSize: '2rem', 
              marginRight: '0.75rem',
              flexShrink: 0
            }}>🏆</span>
            <div className="min-width-0">
              <h1 className="mb-0 text-white fw-bold" style={{
                fontSize: 'clamp(1.25rem, 5vw, 1.75rem)',
                lineHeight: '1.2'
              }}>
                iFamily Games
              </h1>
              <div className="mobile-hide" style={{
                background: 'linear-gradient(45deg, #FFB84D, #FDCB6E)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '500',
                fontSize: '0.875rem',
                marginTop: '0.25rem'
              }}>
                🎯 Sports Activity Management
              </div>
            </div>
          </div>
          
          {/* Auth Section */}
          <div className="d-flex align-items-center flex-shrink-0">
            {isAuthenticated ? (
              <div className="d-flex align-items-center mobile-stack mobile-gap-md">
                <div className="mobile-hide text-center">
                  <span className="d-block small text-white-50 mb-1">Welcome!</span>
                  <span className="badge" style={{
                    background: 'linear-gradient(45deg, #FFB84D, #FDCB6E)',
                    color: '#2D3436',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '16px',
                    fontWeight: '600',
                    fontSize: '0.75rem'
                  }}>
                    👨‍💼 Admin
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="btn mobile-full-width"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: 'white',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                    padding: '0.625rem 1rem',
                    minHeight: '44px',
                    fontSize: '0.9rem'
                  }}
                >
                  <span className="mobile-hide">🚪 Logout</span>
                  <span className="mobile-show">🚪</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="btn btn-light"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: '600',
                  padding: '0.75rem 1.5rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s ease',
                  minHeight: '44px',
                  fontSize: 'clamp(0.85rem, 2.5vw, 0.9rem)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                }}
              >
                <span className="mobile-hide">🔐 Admin Access</span>
                <span className="mobile-show">🔐 Admin</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Inline Login Form */}
      {showLogin && (
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-50), var(--secondary-50))',
          borderTop: '1px solid var(--border-light)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div className="container-fluid mobile-spacing-md">
            <div className="row justify-content-center">
              <div className="col-12 col-md-6 col-lg-4">
                <div className="card">
                  <div className="card-header text-center">
                    <h5 className="mb-0">🔐 Admin Access</h5>
                    <small className="text-muted">Secure login to manage events</small>
                  </div>
                  <div className="card-body">
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