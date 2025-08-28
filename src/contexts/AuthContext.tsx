import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthState } from '../types';
import { authenticateAdmin } from '../utils/auth';

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user was previously authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    setAuthState({ isAuthenticated });
    setIsLoading(false);
  }, []);

  const login = (username: string, password: string): boolean => {
    const isValid = authenticateAdmin(username, password);
    if (isValid) {
      setAuthState({ isAuthenticated: true });
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setAuthState({ isAuthenticated: false });
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};