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
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'agenda', name: 'Events' }
  ];

  const adminViews = [
    { id: 'admin-players', name: 'Players' },
    { id: 'admin-houses', name: 'Houses' },
    { id: 'admin-events', name: 'Manage Events' }
  ];

  const views = isAuthenticated ? [...publicViews, ...adminViews] : publicViews;

  return (
    <nav className="bg-light border-bottom">
      <div className="container-fluid">
        <div className="d-flex justify-content-between py-2">
          <div className="d-flex">
            <ul className="nav nav-pills d-none d-sm-flex">
              {views.map((view) => (
                <li key={view.id} className="nav-item">
                  <button
                    onClick={() => onViewChange(view.id)}
                    className={`nav-link ${currentView === view.id ? 'active' : ''}`}
                  >
                    {view.name}
                  </button>
                </li>
              ))}
            </ul>

            <div className="d-sm-none d-flex align-items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="btn btn-outline-secondary btn-sm"
                type="button"
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="d-sm-none pb-3">
            <ul className="nav nav-pills flex-column">
              {views.map((view) => (
                <li key={view.id} className="nav-item">
                  <button
                    onClick={() => {
                      onViewChange(view.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`nav-link w-100 text-start ${currentView === view.id ? 'active' : ''}`}
                  >
                    {view.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;