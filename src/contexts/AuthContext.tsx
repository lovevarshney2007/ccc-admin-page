import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getApiKey, clearApiKey, setApiKey } from '@/services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (key: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!getApiKey());
  }, []);

  const login = (key: string) => {
    setApiKey(key);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearApiKey();
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
