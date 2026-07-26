const mongoose = require('mongoose');

const activeClientTradeSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  userName: { type: String },
  trades: { type: Array, default: [] },
  updated: { type: Number, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ActiveClientTrade', activeClientTradeSchema);
