import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Auth from '../utils/auth';

// Define the shape of the authentication context
interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
}

// Create the context with an initial default value
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
});

// Define the AuthProvider's props
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
      // Check if user is already logged in
      if (!Auth.loggedIn()) {
        setIsAuthenticated(false);
      }else{
        setIsAuthenticated(true);
      }
    }, []);

  
  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for accessing the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
