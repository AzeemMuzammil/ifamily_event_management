import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const publicViews = [
    { id: 'dashboard', name: '🏠 Dashboard', icon: '🏠' },
    { id: 'agenda', name: '📅 Events', icon: '📅' }
  ];

  const adminViews = [
    { id: 'admin-players', name: '👥 Players', icon: '👥' },
    { id: 'admin-houses', name: '🏘️ Houses', icon: '🏘️' },
    { id: 'admin-events', name: '⚙️ Manage Events', icon: '⚙️' }
  ];

  const views = isAuthenticated ? [...publicViews, ...adminViews] : publicViews;

  return (
    <nav style={{
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: 'none',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div className="container-fluid mobile-spacing-md">
        <div className="d-flex justify-content-between align-items-center" style={{ minHeight: '60px' }}>
          {/* Desktop Navigation */}
          <div className="d-flex flex-grow-1">
            <ul className="nav nav-pills d-none d-md-flex mobile-gap-sm" style={{ flexWrap: 'wrap' }}>
              {views.map((view) => (
                <li key={view.id} className="nav-item">
                  <button
                    onClick={() => onViewChange(view.id)}
                    className={`nav-link ${currentView === view.id ? 'active' : ''}`}
                    style={{
                      borderRadius: '12px',
                      fontWeight: '500',
                      padding: '0.625rem 1.25rem',
                      transition: 'all 0.3s ease',
                      border: 'none',
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                      ...(currentView === view.id ? {
                        background: 'linear-gradient(45deg, #FF6B6B, #E55555)',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                        transform: 'translateY(-1px)'
                      } : {
                        background: 'transparent',
                        color: '#636E72'
                      })
                    }}
                    onMouseEnter={(e) => {
                      if (currentView !== view.id) {
                        e.currentTarget.style.background = 'linear-gradient(45deg, #FFE0E0, #B8F2EE)';
                        e.currentTarget.style.color = '#E55555';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentView !== view.id) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#636E72';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {view.name}
                  </button>
                </li>
              ))}
            </ul>

            {/* Mobile Menu Button */}
            <div className="d-md-none d-flex align-items-center w-100">
              <div className="d-flex align-items-center justify-content-between w-100">
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#2D3436'
                }}>
                  {views.find(v => v.id === currentView)?.name || 'Menu'}
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="btn"
                  style={{
                    background: 'linear-gradient(45deg, #FF6B6B, #E55555)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    padding: '0.625rem 1rem',
                    minHeight: '44px',
                    minWidth: '44px'
                  }}
                  type="button"
                >
                  <span style={{ fontSize: '1.2rem' }}>
                    {isMobileMenuOpen ? '✕' : '☰'}
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Admin Badge - Desktop Only */}
          {isAuthenticated && (
            <div className="d-none d-md-flex align-items-center ms-3">
              <span className="badge" style={{
                background: 'linear-gradient(45deg, #4ECDC4, #45B7B8)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                fontWeight: '500',
                fontSize: '0.75rem'
              }}>
                🔒 Admin
              </span>
            </div>
          )}
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="d-md-none" style={{
            background: 'linear-gradient(135deg, rgba(255, 224, 224, 0.95), rgba(184, 242, 238, 0.95))',
            borderRadius: '16px',
            margin: '0.5rem 0 1rem 0',
            padding: '1rem',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
          }}>
            <div className="d-flex flex-column mobile-gap-sm">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => {
                    onViewChange(view.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className="mobile-nav-item"
                  style={{
                    borderRadius: '12px',
                    fontWeight: '500',
                    padding: '1rem',
                    transition: 'all 0.3s ease',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                    fontSize: '1rem',
                    minHeight: '56px',
                    display: 'flex',
                    alignItems: 'center',
                    ...(currentView === view.id ? {
                      background: 'linear-gradient(45deg, #FF6B6B, #E55555)',
                      color: 'white',
                      boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
                    } : {
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#2D3436'
                    })
                  }}
                >
                  {view.name}
                </button>
              ))}
              
              {/* Admin Badge in Mobile Menu */}
              {isAuthenticated && (
                <div className="mt-2 text-center">
                  <span className="badge" style={{
                    background: 'linear-gradient(45deg, #4ECDC4, #45B7B8)',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontWeight: '500'
                  }}>
                    🔒 Admin Mode Active
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;