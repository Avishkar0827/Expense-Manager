const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  friendId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add compound index to ensure unique friendships
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

const Friend = mongoose.model('Friend', friendSchema);

module.exports = Friend;