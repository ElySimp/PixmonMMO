import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL, TOKEN_KEY } from '../utils/config';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in (token exists)
    const token = localStorage.getItem(TOKEN_KEY); // gunakan TOKEN_KEY
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);
    // No reminder service initialization

  const fetchUser = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
        localStorage.setItem('userId', data.data.id);
      } else {
        // Token invalid, remove it
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.data.user);
        localStorage.setItem(TOKEN_KEY, data.data.token); // gunakan TOKEN_KEY
        localStorage.setItem('userId', data.data.user.id);
          // User logged in successfully
        
        navigate('/main');
        return { success: true };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Server error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, message: 'Registration successful! Please login.' };
      } else {
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Server error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY); // gunakan TOKEN_KEY
    navigate('/');
  };

  const value = {
    user,
    login,
    logout,
    register,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <ToastContainer />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};