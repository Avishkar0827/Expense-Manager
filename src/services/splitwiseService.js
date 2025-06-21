import axiosInstance from './axiosConfig';

const splitwiseService = {
  /**
   * Get current user's data including ID
   * @returns {Promise<Object>} User data
   */
  
getCurrentUser: async () => {
  try {
    const response = await axiosInstance.get('/splitwise/current-user');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching user data';
  }
},
  /**
   * Get all balances for the current user
   * @returns {Promise<Object>} Balance data
   */
  getBalances: async () => {
    try {
      const response = await axiosInstance.get('/splitwise/balances');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error fetching balances';
    }
  },

  /**
   * Get all expenses for the current user
   * @returns {Promise<Array>} Array of expenses
   */
  getExpenses: async () => {
    try {
      const response = await axiosInstance.get('/splitwise/expenses');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error fetching expenses';
    }
  },

  /**
   * Create a new expense
   * @param {Object} expenseData - Expense data to create
   * @returns {Promise<Object>} Created expense
   */
  createExpense: async (expenseData) => {
    try {
      const response = await axiosInstance.post('/splitwise/expenses', expenseData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error creating expense';
    }
  },

  /**
   * Delete an expense
   * @param {string} expenseId - ID of expense to delete
   * @returns {Promise<Object>} Delete confirmation
   */
  deleteExpense: async (expenseId) => {
    try {
      const response = await axiosInstance.delete(`/splitwise/expenses/${expenseId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error deleting expense';
    }
  },

  /**
   * Get all friends for the current user
   * @returns {Promise<Array>} Array of friends
   */
  getFriends: async () => {
    try {
      const response = await axiosInstance.get('/splitwise/friends');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error fetching friends';
    }
  },

  /**
   * Add a new friend
   * @param {string} friendId - ID of user to add as friend
   * @returns {Promise<Object>} Added friend data
   */
addFriend: async (email) => {
  try {
    const response = await axiosInstance.post('/splitwise/friends', { email });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error adding friend';
  }
},

  /**
   * Remove a friend
   * @param {string} friendId - ID of friend to remove
   * @returns {Promise<Object>} Delete confirmation
   */
  removeFriend: async (friendId) => {
    try {
      const response = await axiosInstance.delete(`/splitwise/friends/${friendId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Error removing friend';
    }
  },

  
  /**
   * Utility function to format balances for the frontend
   * @param {Object} balancesData - Raw balances data from API
   * @returns {Object} Formatted balances
   */
  formatBalances: (balancesData) => {
    const formatted = {
      youOwe: balancesData.youOwe || 0,
      youAreOwed: balancesData.youAreOwed || 0,
      netBalance: balancesData.netBalance || 0,
      friends: {}
    };

    // Format friends' balances
    if (balancesData.friends && Array.isArray(balancesData.friends)) {
      balancesData.friends.forEach(friend => {
        formatted.friends[friend.id] = friend.balance || 0;
      });
    }

    return formatted;
  },

  /**
   * Utility function to format friends list
   * @param {Array} friendsData - Raw friends data from API
   * @param {string} currentUserId - ID of current user
   * @returns {Array} Formatted friends list including current user
   */
  formatFriendsList: (friendsData, currentUserId) => {
    const formatted = [
      { id: currentUserId, name: 'You' }
    ];

    if (friendsData && Array.isArray(friendsData)) {
      friendsData.forEach(friend => {
        formatted.push({
          id: friend.id,
          name: friend.name || friend.username || `Friend ${friend.id}`
        });
      });
    }

    return formatted;
  }
};

export default splitwiseService;