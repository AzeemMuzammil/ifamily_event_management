import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Agenda from './pages/Agenda';
import PlayerManagement from './pages/admin/PlayerManagement';
import HouseManagement from './pages/admin/HouseManagement';
import EventManagement from './pages/admin/EventManagement';

// Import sample data utility for browser console access
import './utils/sampleData';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'agenda':
        return <Agenda />;
      case 'admin-players':
        return <PlayerManagement />;
      case 'admin-houses':
        return <HouseManagement />;
      case 'admin-events':
        return <EventManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="min-vh-100">
          <Header />
          <Navigation currentView={currentView} onViewChange={setCurrentView} />
          <main className="pb-4">
            <ErrorBoundary>
              {renderView()}
            </ErrorBoundary>
          </main>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;