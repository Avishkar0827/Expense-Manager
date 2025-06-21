"use client"
import { Trash2, Edit } from "lucide-react"
import React, { useState } from 'react';

const TransactionList = ({ transactions, onDeleteTransaction, onEditTransaction, categories, formatCurrency }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleEditClick = (transaction) => {
    setEditingId(transaction._id);
    // Convert stored UTC date to local date string for the input
    const date = new Date(transaction.date);
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                      .toISOString()
                      .split('T')[0];
    
    setEditForm({
      amount: transaction.amount.toString(),
      category: transaction.category || '',
      description: transaction.description || '',
      date: localDate,
      type: transaction.type // Keep the original type
    });
  };

  const handleEditSubmit = (id) => {
    // Convert local date back to UTC for storage
    const dateObj = new Date(editForm.date);
    const utcDate = new Date(Date.UTC(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate()
    )).toISOString();

    const updateData = {
      amount: editForm.amount,
      description: editForm.description,
      date: utcDate,
      type: editForm.type // Use the original type
    };

    // Only include category for expense transactions
    if (editForm.type === 'expense') {
      updateData.category = editForm.category;
    }

    onEditTransaction(id, updateData);
    setEditingId(null);
  };

  const formatDate = (dateString) => {
    // Display date in local timezone but consistent with input
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {transactions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions found</p>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction._id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              {editingId === transaction._id ? (
                <div className="space-y-3">
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                    className="w-full px-2 py-1 border rounded dark:bg-gray-600 dark:text-white dark:border-gray-500"
                    placeholder="Amount"
                  />
                  
                  {editForm.type === 'expense' && (
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                      className="w-full px-2 py-1 border rounded dark:bg-gray-600 dark:text-white dark:border-gray-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                  
                  <input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    className="w-full px-2 py-1 border rounded dark:bg-gray-600 dark:text-white dark:border-gray-500"
                    placeholder="Description"
                  />
                  
                  <input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                    className="w-full px-2 py-1 border rounded dark:bg-gray-600 dark:text-white dark:border-gray-500"
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <button 
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleEditSubmit(transaction._id)}
                      className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type?.toLowerCase() === "income"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {transaction.type}
                      </span>
                      {transaction.category && transaction.type === 'expense' && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {transaction.category}
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{transaction.description}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-lg font-bold ${
                        transaction.type?.toLowerCase() === "income" 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.type?.toLowerCase() === "income" ? "+" : "-"}₹{formatCurrency ? formatCurrency(transaction.amount) : transaction.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleEditClick(transaction)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      title="Edit transaction"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteTransaction(transaction._id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="Delete transaction"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TransactionList