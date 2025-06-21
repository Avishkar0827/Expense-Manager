"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Trash2, IndianRupee } from "lucide-react"
import { useNavigate } from "react-router-dom"
import splitwiseService from "../services/splitwiseService"

const SplitWise = () => {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [friends, setFriends] = useState([])
  const [newFriend, setNewFriend] = useState("")
  const [friendError, setFriendError] = useState("")
  const [balances, setBalances] = useState({
    youOwe: 0,
    youAreOwed: 0,
    netBalance: 0,
    friends: {}
  })
  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    paidBy: "",
    splitBetween: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userId, setUserId] = useState("")

  // Get current user ID from localStorage
  const getCurrentUserId = () => {
    const userData = localStorage.getItem('user')
    if (!userData) {
      throw new Error('User not authenticated')
    }
    return JSON.parse(userData)._id
  }

  // Helper function to get friend name by ID
  const getFriendName = (friendId) => {
    const currentUserId = getCurrentUserId()
    if (friendId === currentUserId) return 'You'
    
    const friend = friends.find(f => f.id === friendId || f._id === friendId)
    return friend ? friend.name : 'Unknown'
  }

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const currentUserId = getCurrentUserId()
        setUserId(currentUserId)
        
        const [friendsRes, expensesRes, balancesRes] = await Promise.all([
          splitwiseService.getFriends(),
          splitwiseService.getExpenses(),
          splitwiseService.getBalances()
        ])

        // Format friends data with consistent ID structure
        const formattedFriends = [
          { id: currentUserId, _id: currentUserId, name: 'You' },
          ...friendsRes.map(friend => ({
            id: friend._id || friend.id,
            _id: friend._id || friend.id,
            name: friend.name
          }))
        ]
        
        setFriends(formattedFriends)
        
        // Format expenses data to ensure consistent ID structure
        const formattedExpenses = expensesRes.map(expense => ({
          ...expense,
          paidBy: expense.paidBy._id || expense.paidBy.id || expense.paidBy,
          splitBetween: expense.splitBetween.map(split => ({
            user: split.user._id || split.user.id || split.user,
            amount: split.amount
          }))
        }))
        
        setExpenses(formattedExpenses)

        // Set initial expense form values
        setExpenseForm(prev => ({
          ...prev,
          paidBy: currentUserId,
          splitBetween: [currentUserId]
        }))

        const formattedBalances = splitwiseService.formatBalances(balancesRes)
        setBalances(formattedBalances)
        setError(null)
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err.message || 'Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const addFriend = async () => {
    if (!newFriend.trim()) {
      setFriendError('Please enter an email')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newFriend)) {
      setFriendError('Please enter a valid email')
      return
    }

    try {
      setLoading(true)
      setFriendError("")
      const addedFriend = await splitwiseService.addFriend(newFriend)
      
      setFriends(prev => [
        ...prev,
        { id: addedFriend._id || addedFriend.id, _id: addedFriend._id || addedFriend.id, name: addedFriend.name }
      ])
      
      setNewFriend("")
      setError(null)
    } catch (err) {
      console.error("Error adding friend:", err)
      setFriendError(err.message || 'Failed to add friend')
    } finally {
      setLoading(false)
    }
  }

  const removeFriend = async (friendId) => {
    const currentUserId = getCurrentUserId()
    if (friendId === currentUserId) return
    
    try {
      setLoading(true)
      await splitwiseService.removeFriend(friendId)
      setFriends(prev => prev.filter(friend => friend.id !== friendId))
      
      setExpenseForm(prev => ({
        ...prev,
        splitBetween: prev.splitBetween.filter(id => id !== friendId),
        paidBy: prev.paidBy === friendId ? currentUserId : prev.paidBy
      }))
      
      const balancesRes = await splitwiseService.getBalances()
      setBalances(splitwiseService.formatBalances(balancesRes))
      setError(null)
    } catch (err) {
      console.error("Error removing friend:", err)
      setError(err.message || 'Failed to remove friend')
    } finally {
      setLoading(false)
    }
  }

  const handleSplitChange = (friendId, checked) => {
    const currentUserId = getCurrentUserId()
    
    if (checked) {
      setExpenseForm({
        ...expenseForm,
        splitBetween: [...expenseForm.splitBetween, friendId]
      })
    } else {
      if (friendId === currentUserId) return
      setExpenseForm({
        ...expenseForm,
        splitBetween: expenseForm.splitBetween.filter(id => id !== friendId)
      })
    }
  }

  const addExpense = async (e) => {
    e.preventDefault()
    const currentUserId = getCurrentUserId()
    
    if (!expenseForm.description || !expenseForm.amount || expenseForm.splitBetween.length === 0) {
      setError('Please fill all required fields')
      return
    }

    try {
      setLoading(true)
      const expenseData = {
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        paidBy: expenseForm.paidBy,
        splitBetween: expenseForm.splitBetween.map(userId => ({
          user: userId,
          amount: parseFloat(expenseForm.amount) / expenseForm.splitBetween.length
        }))
      }

      const newExpense = await splitwiseService.createExpense(expenseData)
      
      setExpenses(prev => [{
        ...newExpense,
        paidBy: newExpense.paidBy._id || newExpense.paidBy.id || newExpense.paidBy,
        splitBetween: newExpense.splitBetween.map(split => ({
          user: split.user._id || split.user.id || split.user,
          amount: split.amount
        }))
      }, ...prev])
      
      setExpenseForm({
        description: "",
        amount: "",
        paidBy: currentUserId,
        splitBetween: [currentUserId]
      })
      
      const balancesRes = await splitwiseService.getBalances()
      setBalances(splitwiseService.formatBalances(balancesRes))
      setError(null)
    } catch (err) {
      console.error("Error adding expense:", err)
      setError(err.message || 'Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  const deleteExpense = async (expenseId) => {
    try {
      setLoading(true)
      await splitwiseService.deleteExpense(expenseId)
      setExpenses(prev => prev.filter(expense => expense._id !== expenseId))
      
      const balancesRes = await splitwiseService.getBalances()
      setBalances(splitwiseService.formatBalances(balancesRes))
      setError(null)
    } catch (err) {
      console.error("Error deleting expense:", err)
      setError(err.message || 'Failed to delete expense')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const currentUserId = getCurrentUserId()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mr-6"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SplitWise</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Split expenses with friends and track balances
                {userId && (
                  <span className="ml-4 text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                    User ID: {userId}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">You Owe</p>
                <p className="text-3xl font-bold text-red-600">
                  ₹{balances.youOwe.toFixed(2)}
                </p>
              </div>
              <IndianRupee className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">You Are Owed</p>
                <p className="text-3xl font-bold text-green-600">₹{balances.youAreOwed.toFixed(2)}</p>
              </div>
              <IndianRupee className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Balance</p>
                <p className={`text-3xl font-bold ${balances.netBalance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  ₹{Math.abs(balances.netBalance).toFixed(2)}
                </p>
              </div>
              <IndianRupee className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Friends</h3>
            <div className="flex space-x-2 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newFriend}
                  onChange={(e) => {
                    setNewFriend(e.target.value)
                    setFriendError("")
                  }}
                  placeholder="Add friend's email"
                  className={`w-full px-3 py-2 border ${friendError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white`}
                />
                {friendError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{friendError}</p>
                )}
              </div>
              <button
                onClick={addFriend}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">{friend.name}</span>
                    <p className={`text-sm ${(balances.friends[friend.id] || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {(balances.friends[friend.id] || 0) >= 0 ? "Owed" : "Owes"} ₹{Math.abs(balances.friends[friend.id] || 0).toFixed(2)}
                    </p>
                  </div>
                  {friend.id !== currentUserId && (
                    <button
                      onClick={() => removeFriend(friend.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Expense</h3>
            <form onSubmit={addExpense} className="space-y-4">
              <input
                type="text"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="Expense description"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                placeholder="Amount in ₹"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <select
                value={expenseForm.paidBy}
                onChange={(e) => setExpenseForm({ ...expenseForm, paidBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
                disabled={loading}
              >
                {friends.map((friend) => (
                  <option key={friend.id} value={friend.id}>
                    {friend.name} paid
                  </option>
                ))}
              </select>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Split between:</h4>
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <label key={friend.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={expenseForm.splitBetween.includes(friend.id)}
                        onChange={(e) => handleSplitChange(friend.id, e.target.checked)}
                        disabled={friend.id === currentUserId || loading}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{friend.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Expense'}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Expenses</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {expenses.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No expenses yet</p>
              ) : (
                expenses.map((expense) => (
                  <div key={expense._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">{expense.description}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Paid by {getFriendName(expense.paidBy)} on {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-white">₹{expense.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ₹{(expense.amount / expense.splitBetween.length).toFixed(2)} each
                        </p>
                        <button
                          onClick={() => deleteExpense(expense._id)}
                          disabled={loading}
                          className="mt-1 text-red-600 hover:text-red-700 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SplitWise