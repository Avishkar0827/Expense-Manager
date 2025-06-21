const express = require('express');
const router = express.Router();
const mongoose = require('mongoose'); // Add this import
const { protect } = require('../middleware/authMiddleware');
const Expense = require('../models/Expense');
const Friend = require('../models/Friend');
const User = require('../models/User');

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Get current user data
router.get('/current-user', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users for adding friends
router.get('/users/search', protect, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Search query required' });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user.id } // Exclude current user
    }).select('username email');

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all balances
router.get('/balances', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user.id },
        { 'splitBetween.user': req.user.id }
      ]
    }).populate('paidBy splitBetween.user');

    const friends = await Friend.find({ 
      $or: [
        { userId: req.user.id },
        { friendId: req.user.id }
      ]
    }).populate('userId friendId');

    const balances = {
      youOwe: 0,
      youAreOwed: 0,
      friends: {}
    };

    expenses.forEach(expense => {
      if (expense.paidBy._id.toString() === req.user.id) {
        expense.splitBetween.forEach(({ user, amount }) => {
          if (user._id.toString() !== req.user.id) {
            balances.youAreOwed += amount;
            balances.friends[user._id] = (balances.friends[user._id] || 0) + amount;
          }
        });
      } else {
        const userSplit = expense.splitBetween.find(s => s.user._id.toString() === req.user.id);
        if (userSplit) {
          balances.youOwe += userSplit.amount;
          balances.friends[expense.paidBy._id] = (balances.friends[expense.paidBy._id] || 0) - userSplit.amount;
        }
      }
    });

    const formattedFriends = friends.map(friend => {
      const friendId = friend.userId._id.toString() === req.user.id ? 
        friend.friendId._id : friend.userId._id;
      const friendName = friend.userId._id.toString() === req.user.id ? 
        friend.friendId.username : friend.userId.username;
      
      return {
        id: friendId,
        name: friendName,
        balance: balances.friends[friendId] || 0
      };
    });

    res.json({
      youOwe: balances.youOwe,
      youAreOwed: balances.youAreOwed,
      netBalance: balances.youAreOwed - balances.youOwe,
      friends: formattedFriends
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all expenses
router.get('/expenses', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user.id },
        { 'splitBetween.user': req.user.id }
      ]
    })
    .populate('paidBy', 'username')
    .populate('splitBetween.user', 'username')
    .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new expense
router.post('/expenses', protect, async (req, res) => {
  const { description, amount, paidBy, splitBetween } = req.body;

  try {
    if (!description || !amount || !splitBetween || splitBetween.length === 0) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate paidBy if provided
    if (paidBy && !isValidObjectId(paidBy)) {
      return res.status(400).json({ message: 'Invalid paidBy user ID format' });
    }

    // Validate splitBetween user IDs
    const invalidUserIds = splitBetween.filter(item => item.user && !isValidObjectId(item.user));
    if (invalidUserIds.length > 0) {
      return res.status(400).json({ message: 'Invalid user ID format in splitBetween' });
    }

    // Convert paidBy null to current user
    const paidById = paidBy || req.user.id;
    
    // Convert splitBetween null values to current user
    const formattedSplit = splitBetween.map(item => ({
      user: item.user || req.user.id,
      amount: item.amount
    }));

    const newExpense = new Expense({
      description,
      amount,
      paidBy: paidById,
      splitBetween: formattedSplit
    });

    await newExpense.save();
    
    const populatedExpense = await Expense.populate(newExpense, [
      { path: 'paidBy', select: 'username' },
      { path: 'splitBetween.user', select: 'username' }
    ]);

    res.status(201).json(populatedExpense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete expense
router.delete('/expenses/:id', protect, async (req, res) => {
  try {
    // Validate expense ID
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid expense ID format' });
    }

    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      $or: [
        { paidBy: req.user.id },
        { 'splitBetween.user': req.user.id }
      ]
    });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found or unauthorized' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all friends
router.get('/friends', protect, async (req, res) => {
  try {
    const friends = await Friend.find({ 
      $or: [
        { userId: req.user.id },
        { friendId: req.user.id }
      ]
    })
    .populate('userId', 'username')
    .populate('friendId', 'username');

    const formattedFriends = friends.map(friend => {
      const isUser = friend.userId._id.toString() === req.user.id;
      return {
        id: isUser ? friend.friendId._id : friend.userId._id,
        name: isUser ? friend.friendId.username : friend.userId.username
      };
    });

    res.json(formattedFriends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add friend
router.post('/friends', protect, async (req, res) => {
  const { email } = req.body; // Change from friendId to email

  try {
    // Validate email format
    if (!email || !/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email address required' });
    }

    // Find user by email
    const friend = await User.findOne({ email: email.toLowerCase() });
    if (!friend) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    if (friend._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot add yourself as friend' });
    }

    const existingFriendship = await Friend.findOne({
      $or: [
        { userId: req.user.id, friendId: friend._id },
        { userId: friend._id, friendId: req.user.id }
      ]
    });

    if (existingFriendship) {
      return res.status(400).json({ message: 'Friendship already exists' });
    }

    const newFriend = new Friend({
      userId: req.user.id,
      friendId: friend._id
    });

    await newFriend.save();

    const populatedFriend = await Friend.populate(newFriend, [
      { path: 'userId', select: 'username' },
      { path: 'friendId', select: 'username' }
    ]);

    res.status(201).json({
      id: friend._id,
      name: friend.username
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Remove friend
router.delete('/friends/:id', protect, async (req, res) => {
  try {
    // Validate friend ID
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid friend ID format' });
    }

    const deletedFriend = await Friend.findOneAndDelete({
      $or: [
        { userId: req.user.id, friendId: req.params.id },
        { userId: req.params.id, friendId: req.user.id }
      ]
    });

    if (!deletedFriend) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    res.json({ message: 'Friend removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;