const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0
  },
  unclaimedRebate: {
    type: Number,
    default: 0
  },
  claimedRebate: {
    type: Number,
    default: 0
  },
  rebateRate: {
    type: Number,
    default: 10
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: String
  },
  nickname: { type: String, default: "Rashida parv" },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String },
  fullName: { type: String },
  email: { type: String },
  age: { type: Number },
  avatar: { type: String, default: "" },
  simSpeed: { type: Number, default: 300 },
  theme: { type: String, default: "dark" },
  role: { type: String, enum: ['user', 'admin', 'king_admin'], default: 'user' },
  permissions: { type: [String], default: [] },
  withdrawalAddress: { type: String, default: "" },
  walletChangeAccess: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
