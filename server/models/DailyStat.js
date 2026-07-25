const mongoose = require('mongoose');

const dailyStatSchema = new mongoose.Schema({
  dateStr: { type: String, required: true, unique: true }, // e.g. "Mon Jul 21 2026"
  todayTradesCount: { type: Number, default: 0 },
  todayBuyCount: { type: Number, default: 0 },
  todaySellCount: { type: Number, default: 0 },
  todayClientProfit: { type: Number, default: 0 },
  todayClientLoss: { type: Number, default: 0 }
});

module.exports = mongoose.model('DailyStat', dailyStatSchema);
