const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  browser: String,
  os: String,
  device: String,
  ip: String,
  timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  language: { type: String, default: 'en' },
  subscription: {
    plan: { type: String, enum: ['free', 'bronze', 'silver', 'gold'], default: 'free' },
    expiresAt: { type: Date },
    questionsPostedToday: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  },
  points: { type: Number, default: 0 },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  loginHistory: [loginHistorySchema],
  socialPostsToday: { type: Number, default: 0 },
  socialPostsLastReset: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
