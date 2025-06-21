const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    unique: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    index: true 
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for dashboard data
userSchema.virtual('dashboard', {
  ref: 'Dashboard',
  localField: '_id',
  foreignField: 'user',
  justOne: true
});

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

// Update last login on successful sign in
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  await this.save();
};

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword) {
    throw new Error('Password is required for comparison');
  }
  if (!this.password) {
    throw new Error('No stored password to compare with');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method for finding by email or username
userSchema.statics.findByCredentials = async function(emailOrUsername, password) {
  if (!emailOrUsername || !password) {
    throw new Error('Both email/username and password are required');
  }

  const user = await this.findOne({
    $or: [
      { email: emailOrUsername },
      { username: emailOrUsername }
    ]
  }).select('+password');

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }

  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;