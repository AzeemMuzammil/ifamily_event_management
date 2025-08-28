import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <header className="bg-white shadow-sm border-bottom">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center py-3">
          <div className="d-flex align-items-center">
            <h1 className="h3 mb-0 header-title">iFamily Games</h1>
            <span className="ms-3 small text-muted d-none d-sm-inline">
              Sports Activity Management
            </span>
          </div>
          
          <div className="d-flex align-items-center">
            {isAuthenticated ? (
              <div className="d-flex align-items-center">
                <span className="small text-muted me-3">
                  Welcome, Admin
                </span>
                <button
                  onClick={logout}
                  className="btn btn-link btn-sm text-muted"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="admin-link"
              >
                Admin
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