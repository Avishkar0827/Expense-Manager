import axiosInstance from './axiosConfig';

export const register = async (userData) => {
  try {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    // The error is already formatted by the axios interceptor
    throw new Error(error.message || 'Registration failed');
  }
};

export const login = async (credentials) => {
  try {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Login failed');
  }
};

export const getMe = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await axiosInstance.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch user data');
  }
};