import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <header style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
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
      
      <LoginModal 
        isOpen={showLogin} 
        onClose={() => setShowLogin(false)} 
      />
    </header>
  );
};

export default Header;