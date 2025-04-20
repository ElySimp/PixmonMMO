import { createContext, useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

// Dummy admin credentials
const ADMIN_CREDENTIALS = {
  username: 'ely',
  password: 'ely123',
  email: 'admin@pixmon.com' // Added email since our login form uses email
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const login = (email, password) => {
    // Check if credentials match the admin account
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      setUser({ username: ADMIN_CREDENTIALS.username, email: ADMIN_CREDENTIALS.email });
      navigate('/dashboard'); // We'll create this route later
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const register = (username, email, password) => {
    // For now, just check if it matches admin credentials to prevent duplicate
    if (email === ADMIN_CREDENTIALS.email || username === ADMIN_CREDENTIALS.username) {
      return { success: false, error: 'Username or email already exists' };
    }
    // In a real app, we would save this to a database
    console.log('Registration successful:', { username, email });
    navigate('/login');
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    navigate('/');
  };

  const value = {
    user,
    login,
    logout,
    register
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 