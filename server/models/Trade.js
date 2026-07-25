const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  symbol: { type: String, required: true },
  type: { type: String, required: true }, // BUY or SELL
  volume: { type: Number, required: true },
  entryPrice: { type: Number, required: true },
  closePrice: { type: Number, required: true },
  pnl: { type: Number, required: true },
  rebate: { type: Number, default: 0 },
  spreadCost: { type: Number, default: 0 },
  reason: { type: String },
  openTime: { type: Number },
  closeTime: { type: Number }
}, { timestamps: true, id: false });

module.exports = mongoose.model('Trade', tradeSchema);
