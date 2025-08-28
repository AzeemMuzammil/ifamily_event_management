import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
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

  if (!isOpen) return null;

  return (
    <div className="modal d-block" style={{
      backgroundColor: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(5px)'
    }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content" style={{
          border: 'none',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}>
          <div className="modal-header" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            padding: '2rem'
          }}>
            <div className="d-flex align-items-center">
              <span style={{ fontSize: '2rem', marginRight: '1rem' }}>🔐</span>
              <div>
                <h5 className="modal-title fw-bold mb-0">Admin Access</h5>
                <small style={{ opacity: '0.8' }}>Secure login to manage events</small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
              style={{
                fontSize: '1.2rem',
                opacity: '0.8'
              }}
            ></button>
          </div>
          
          <div className="modal-body" style={{ padding: '2rem' }}>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="form-label fw-medium" style={{
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem'
                }}>
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
                  style={{
                    padding: '1rem',
                    fontSize: '1rem',
                    borderRadius: '12px',
                    border: '2px solid var(--border-color)',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="password" className="form-label fw-medium" style={{
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem'
                }}>
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
                  style={{
                    padding: '1rem',
                    fontSize: '1rem',
                    borderRadius: '12px',
                    border: '2px solid var(--border-color)',
                    transition: 'all 0.3s ease'
                  }}
                />
              </div>

              {error && (
                <div className="alert alert-danger glow-effect" role="alert" style={{
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #E17055, #D63447)',
                  color: 'white',
                  fontWeight: '500'
                }}>
                  <strong>⚠️ Error:</strong> {error}
                </div>
              )}

              <div className="d-flex justify-content-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn"
                  disabled={isLoading}
                  style={{
                    background: 'rgba(0,0,0,0.1)',
                    border: '2px solid rgba(0,0,0,0.1)',
                    color: 'var(--text-secondary)',
                    borderRadius: '12px',
                    padding: '0.75rem 2rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                  style={{
                    borderRadius: '12px',
                    padding: '0.75rem 2rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
                  }}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;