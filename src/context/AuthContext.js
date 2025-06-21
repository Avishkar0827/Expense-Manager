import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe } from '../services/authService';
import { fetchDashboardData } from '../services/dashboardService';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    incomes: [],
    expenses: [],
    categories: [],
    balance: 0
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialAuthLoading, setInitialAuthLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const clearAuthState = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setDashboardData({
      incomes: [],
      expenses: [],
      categories: [],
      balance: 0
    });
    setError(null);
  }, []);

  const loadDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setDashboardLoading(true);
      setError(null);
      const { data } = await fetchDashboardData();
      setDashboardData({
        incomes: data.incomes || [],
        expenses: data.expenses || [],
        categories: data.categories || [],
        balance: data.balance || 0
      });
      return data; // Return data for potential chaining
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
      // If unauthorized, trigger logout
      if (error.response?.status === 401) {
        clearAuthState();
        navigate('/login');
      }
      throw error; // Re-throw for components to handle if needed
    } finally {
      if (!silent) setDashboardLoading(false);
    }
  }, [clearAuthState, navigate]);

  const logout = useCallback(() => {
    clearAuthState();
    navigate('/login');
  }, [clearAuthState, navigate]);

  const login = useCallback(async (token, userData) => {
    try {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData)); // Store user data
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
      await loadDashboardData();
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      setError(error.response?.data?.message || error.message || 'Login failed');
      clearAuthState();
      throw error; // Re-throw for login component to handle
    }
  }, [loadDashboardData, navigate, clearAuthState]);

  const checkAuth = useCallback(async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        clearAuthState();
        return;
      }

      const userData = await getMe();
      // Store user data in localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      await loadDashboardData(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      setError(error.response?.data?.message || error.message || 'Authentication check failed');
      if (error.response?.status === 401) {
        clearAuthState();
      }
    } finally {
      setInitialAuthLoading(false);
    }
  }, [clearAuthState, loadDashboardData]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Auto-logout on 401 errors from other API calls
  useEffect(() => {
    const handleUnauthorized = (e) => {
      if (e.detail?.status === 401) {
        logout();
      }
    };

    window.addEventListener('unauthorized', handleUnauthorized);
    return () => window.removeEventListener('unauthorized', handleUnauthorized);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      dashboardData,
      setDashboardData,
      isAuthenticated, 
      initialAuthLoading,
      dashboardLoading,
      error,
      login, 
      logout,
      loadDashboardData,
      checkAuth
    }}>
      {children}
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