const express = require('express');
const Dashboard = require('../models/Dashboard');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let dashboard = await Dashboard.findOne({ user: req.user._id });

    if (!dashboard) {
      // Create default dashboard with predefined categories
      dashboard = await Dashboard.create({
        user: req.user._id,
        categories: ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills']
      });
    }

    res.json(dashboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Add a category
// @route   POST /api/dashboard/categories
// @access  Private
router.post('/categories', protect, async (req, res) => {
  try {
    const { category } = req.body;

    if (!category) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const dashboard = await Dashboard.findOneAndUpdate(
      { user: req.user._id },
      { $addToSet: { categories: category } }, // $addToSet prevents duplicates
      { new: true }
    );

    res.json(dashboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Delete a category
// @route   DELETE /api/dashboard/categories/:category
// @access  Private
router.delete('/categories/:category', protect, async (req, res) => {
  try {
    const { category } = req.params;

    const dashboard = await Dashboard.findOneAndUpdate(
      { user: req.user._id },
    {
  $pull: { 
    categories: category,
    expenses: { category }
  }
},
      { new: true }
    );

    // Recalculate balance
    if (dashboard) {
      const incomeTotal = dashboard.incomes.reduce((sum, t) => sum + t.amount, 0);
      const expenseTotal = dashboard.expenses.reduce((sum, t) => sum + t.amount, 0);
      dashboard.balance = incomeTotal - expenseTotal;
      await dashboard.save();
    }

    res.json(dashboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Add a transaction
// @route   POST /api/dashboard/transactions
// @access  Private
router.post('/transactions', protect, async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ message: 'Type and amount are required' });
    }

    if (type === 'expense' && !category) {
      return res.status(400).json({ message: 'Category is required for expenses' });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const dashboard = await Dashboard.findOne({ user: req.user._id });
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    if (type === 'expense' && !dashboard.categories.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const transaction = {
      type: type, // FIXED: Added type field
      amount: amountNum,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      ...(type === 'expense' && { category })
    };

    const updateField = type === 'income' ? 'incomes' : 'expenses';
    const balanceUpdate = type === 'income' ? amountNum : -amountNum;

    const updatedDashboard = await Dashboard.findOneAndUpdate(
      { user: req.user._id },
      {
        $push: { [updateField]: transaction },
        $inc: { balance: balanceUpdate }
      },
      { new: true }
    );

    res.json(updatedDashboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Delete a transaction
// @route   DELETE /api/dashboard/transactions/:type/:id
// @access  Private
router.delete('/transactions/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const dashboard = await Dashboard.findOne({ user: req.user._id });
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    // Search both incomes and expenses
    let transaction, transactionField;
    
    transaction = dashboard.incomes.find(t => t._id.toString() === id);
    if (transaction) {
      transactionField = 'incomes';
    } else {
      transaction = dashboard.expenses.find(t => t._id.toString() === id);
      if (transaction) {
        transactionField = 'expenses';
      } else {
        return res.status(404).json({ message: 'Transaction not found' });
      }
    }

    const updatedDashboard = await Dashboard.findOneAndUpdate(
      { user: req.user._id },
      {
        $pull: { [transactionField]: { _id: id } },
        $inc: { 
          balance: transactionField === 'incomes' 
            ? -transaction.amount 
            : transaction.amount 
        }
      },
      { new: true }
    );

    res.json(updatedDashboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Get filtered transactions
// @route   GET /api/dashboard/transactions/filter
// @access  Private
router.get('/transactions/filter', protect, async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    
    const dashboard = await Dashboard.findOne({ user: req.user._id });
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    // FIXED: Properly add type field when combining arrays
    let transactions = [
      ...dashboard.incomes.map(t => ({ ...t.toObject(), type: 'income' })),
      ...dashboard.expenses.map(t => ({ ...t.toObject(), type: 'expense' }))
    ];

    if (category) {
      transactions = transactions.filter(t => 
        // Include if it matches category OR if it's income and we're showing all
        (t.category === category) || 
        (t.type === 'income' && category === 'Income') // Add this line
      );
    }

    if (startDate) {
      const start = new Date(startDate);
      transactions = transactions.filter(t => new Date(t.date) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      transactions = transactions.filter(t => new Date(t.date) <= end);
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @desc    Update a transaction
// @route   PUT /api/dashboard/transactions/:id
// @access  Private
router.put('/transactions/:id', protect, async (req, res) => {
  try {
    const { type, amount, category, description, date } = req.body;
    const { id } = req.params;

    const dashboard = await Dashboard.findOne({ user: req.user._id });
    if (!dashboard) {
      return res.status(404).json({ message: 'Dashboard not found' });
    }

    // Search both incomes and expenses
    let transaction, transactionField;
    
    transaction = dashboard.incomes.find(t => t._id.toString() === id);
    if (transaction) {
      transactionField = 'incomes';
    } else {
      transaction = dashboard.expenses.find(t => t._id.toString() === id);
      if (transaction) {
        transactionField = 'expenses';
      } else {
        return res.status(404).json({ message: 'Transaction not found' });
      }
    }

    const oldAmount = transaction.amount;
    const newAmount = parseFloat(amount);
    const amountDiff = newAmount - oldAmount;

    // Update the transaction
    const transactionIndex = dashboard[transactionField].findIndex(t => t._id.toString() === id);
    dashboard[transactionField][transactionIndex] = {
      ...transaction,
      type: transactionField === 'incomes' ? 'income' : 'expense', // FIXED: Added type field
      amount: newAmount,
      description: description || transaction.description,
      date: date ? new Date(date) : transaction.date,
      ...(type === 'expense' && { category: category || transaction.category })
    };

    // Update balance
    dashboard.balance += transactionField === 'incomes' ? amountDiff : -amountDiff;
    
    await dashboard.save();
    res.json(dashboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;