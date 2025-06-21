import axiosInstance from './axiosConfig';

export const fetchDashboardData = async () => {
  const response = await axiosInstance.get('/dashboard');
  return response;
};

export const addTransaction = async (transactionData) => {
  const response = await axiosInstance.post('/dashboard/transactions', transactionData);
  return response;
};

export const updateTransaction = async (id, transactionData) => {
  const response = await axiosInstance.put(`/dashboard/transactions/${id}`, transactionData);
  return response;
};
export const deleteTransaction = async (id) => {  // Remove type parameter
  try {
    const response = await axiosInstance.delete(`/dashboard/transactions/${id}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete transaction');
  }
};

export const addCategory = async (category) => {
  const response = await axiosInstance.post('/dashboard/categories', { category });
  return response;
};

export const deleteCategory = async (category) => {
  try {
    const response = await axiosInstance.delete(`/dashboard/categories/${category}`);
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete category');
  }
};
export const filterTransactions = async (filters) => {
  const params = {};
  if (filters.category) params.category = filters.category;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  
  const response = await axiosInstance.get('/dashboard/transactions/filter', { params });
  return response;
};