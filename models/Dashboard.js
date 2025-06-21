const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: function() { return this.type === 'expense'; }
  },
  description: {
    type: String,
    trim: true,
    maxlength: 100
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const dashboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  incomes: [transactionSchema],
  expenses: [transactionSchema],
  categories: {
    type: [String],
    default: ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills']
  },
  balance: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Add type to transactions for easier filtering
dashboardSchema.pre('save', function(next) {
  this.incomes.forEach(inc => inc.type = 'income');
  this.expenses.forEach(exp => exp.type = 'expense');
  next();
});

module.exports = mongoose.model('Dashboard', dashboardSchema);