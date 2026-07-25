const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Deposit', 'Withdrawal'],
    required: true
  },
  method: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  txHash: {
    type: String,
    default: 'N/A'
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Pending', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
