const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0.01
  },
  paidBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  splitBetween: [{ 
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    }
  }],
  date: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
expenseSchema.index({ paidBy: 1 });
expenseSchema.index({ 'splitBetween.user': 1 });

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;