"use client"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, TrendingUp, TrendingDown, IndianRupee, Users } from "lucide-react"
import TransactionForm from "../components/transactionForm"
import TransactionList from "../components/TransactionList"
import CategoryManager from "../components/CategoryManager"
import ExpenseChart from "../components/ExpenseChart"
import { useAuth } from "../context/AuthContext"
import { 
  addTransaction, 
  deleteTransaction, 
  addCategory, 
  updateTransaction,
  deleteCategory,
  
} from "../services/dashboardService"

const Dashboard = () => {
  const navigate = useNavigate()
  const { 
    isAuthenticated, 
    loading: authLoading, 
    dashboardData,
    setDashboardData,
    loadDashboardData
  } = useAuth();
  
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [filter, setFilter] = useState({
    category: "",
    dateFrom: "",
    dateTo: "",
  })
  const [transactionLoading, setTransactionLoading] = useState(false)

  // Navigate to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login")
    }
  }, [authLoading, isAuthenticated, navigate])

  // Load dashboard data on authentication - only once
  useEffect(() => {
    if (isAuthenticated && !dashboardData) {
      loadDashboardData()
    }
  }, [isAuthenticated, dashboardData, loadDashboardData])

  // Memoized all transactions with proper type field
  const allTransactions = useMemo(() => {
    if (!dashboardData) return []
    
    return [
      ...(dashboardData.incomes?.map(t => ({ ...t, type: 'income' })) || []),
      ...(dashboardData.expenses?.map(t => ({ ...t, type: 'expense' })) || [])
    ]
  }, [dashboardData])

  // Memoized filtered transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(transaction => {
      // Category filter (only for expenses)
      if (filter.category && transaction.type === 'expense' && transaction.category !== filter.category) {
        return false
      }
      
      // Date range filter
      if (filter.dateFrom && new Date(transaction.date) < new Date(filter.dateFrom)) {
        return false
      }
      
      if (filter.dateTo && new Date(transaction.date) > new Date(filter.dateTo)) {
        return false
      }
      
      return true
    })
  }, [allTransactions, filter])

  // Optimized transaction handlers with proper loading management
  const handleAddTransaction = useCallback(async (transaction) => {
    if (transactionLoading) return // Prevent multiple concurrent requests
    
    try {
      setTransactionLoading(true)
      const response = await addTransaction({
        type: transaction.type,
        amount: parseFloat(transaction.amount),
        ...(transaction.type === 'expense' && { category: transaction.category }),
        description: transaction.description,
        date: new Date(transaction.date || Date.now()).toISOString()
      })
      
      // Update dashboard data
      setDashboardData(response.data)
      setShowTransactionForm(false)
      
    } catch (error) {
      console.error('Failed to add transaction:', error)
    } finally {
      setTransactionLoading(false)
    }
  }, [transactionLoading, setDashboardData])

  const handleDeleteTransaction = useCallback(async (id) => {
    if (transactionLoading) return
    
    try {
      setTransactionLoading(true)
      await deleteTransaction(id)
      
      // Reload dashboard data
      await loadDashboardData()
      
    } catch (error) {
      console.error('Failed to delete transaction:', error)
    } finally {
      setTransactionLoading(false)
    }
  }, [transactionLoading, loadDashboardData])

  const handleEditTransaction = useCallback(async (id, updatedTransaction) => {
    if (transactionLoading) return
    
    try {
      setTransactionLoading(true)
      
      await updateTransaction(id, {
        type: updatedTransaction.type,
        amount: parseFloat(updatedTransaction.amount),
        ...(updatedTransaction.type === 'expense' && { category: updatedTransaction.category }),
        description: updatedTransaction.description,
        date: new Date(updatedTransaction.date || Date.now()).toISOString()
      })
      
      // Reload dashboard data
      await loadDashboardData()
      
    } catch (error) {
      console.error('Failed to edit transaction:', error)
    } finally {
      setTransactionLoading(false)
    }
  }, [transactionLoading, loadDashboardData])

  const handleAddCategory = useCallback(async (category) => {
    if (transactionLoading) return
    
    try {
      setTransactionLoading(true)
      await addCategory(category)
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to add category:', error)
    } finally {
      setTransactionLoading(false)
    }
  }, [transactionLoading, loadDashboardData])

  const handleDeleteCategory = useCallback(async (category) => {
    if (transactionLoading) return
    
    try {
      setTransactionLoading(true)
      await deleteCategory(category)
      await loadDashboardData()
    } catch (error) {
      console.error('Failed to delete category:', error)
    } finally {
      setTransactionLoading(false)
    }
  }, [transactionLoading, loadDashboardData])

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount)
  }, [])

  // Memoized calculations
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const income = dashboardData?.incomes?.reduce((sum, t) => sum + t.amount, 0) || 0
    const expense = dashboardData?.expenses?.reduce((sum, t) => sum + t.amount, 0) || 0
    return {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense
    }
  }, [dashboardData])

  // Loading state
  if (authLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Loading Dashboard...
        </div>
      </div>
    )
  }

  const LoadingOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700 dark:text-gray-300">Processing...</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {transactionLoading && <LoadingOverlay />}
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's your financial overview.</p>
            </div>
            <button
              onClick={() => navigate("/splitwise")}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              disabled={transactionLoading}
            >
              <Users className="h-4 w-4" />
              <span>SplitWise</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</p>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance</p>
                <p className={`text-3xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(balance)}
                </p>
              </div>
              <IndianRupee className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms and Categories */}
          <div className="lg:col-span-1 space-y-6">
            <button
              onClick={() => setShowTransactionForm(!showTransactionForm)}
              className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              disabled={transactionLoading}
            >
              <Plus className="h-5 w-5" />
              <span>Add Transaction</span>
            </button>

            {showTransactionForm && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <TransactionForm 
                  categories={dashboardData.categories} 
                  onAddTransaction={handleAddTransaction}
                  loading={transactionLoading}
                />
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <CategoryManager 
                categories={dashboardData.categories} 
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                loading={transactionLoading}
              />
            </div>
          </div>

          {/* Right Column - Transactions and Filters */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={filter.category}
                  onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={transactionLoading}
                >
                  <option value="">All Categories</option>
                  {dashboardData.categories?.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={filter.dateFrom}
                  onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={transactionLoading}
                  placeholder="From Date"
                />
                <input
                  type="date"
                  value={filter.dateTo}
                  onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={transactionLoading}
                  placeholder="To Date"
                />
              </div>
              
              {/* Clear Filters Button */}
              <button
                onClick={() => setFilter({ category: "", dateFrom: "", dateTo: "" })}
                className="mt-4 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                disabled={transactionLoading}
              >
                Clear Filters
              </button>
            </div>

            {/* Transaction List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <TransactionList
                transactions={filteredTransactions}
                onDeleteTransaction={handleDeleteTransaction}
                onEditTransaction={handleEditTransaction}
                categories={dashboardData.categories}
                formatCurrency={formatCurrency}
                loading={transactionLoading}
              />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="mt-8">
          <ExpenseChart 
            transactions={filteredTransactions} 
            formatCurrency={formatCurrency} 
          />
        </div>
      </div>
    </div>
  )
}

export default Dashboard