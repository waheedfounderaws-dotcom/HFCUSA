require('dotenv').config();
const mongoose = require('mongoose');
const DailyStat = require('./models/DailyStat');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const currentDayStr = new Date().toDateString();
    await DailyStat.findOneAndUpdate(
        { dateStr: currentDayStr },
        { 
            todayTradesCount: 0,
            todayBuyCount: 0,
            todaySellCount: 0,
            todayClientLoss: 0,
            todayClientProfit: 0
        }
    );
    console.log("Reset successful");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
