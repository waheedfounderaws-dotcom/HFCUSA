require('dotenv').config(); 
const mongoose = require('mongoose'); 
mongoose.connect(process.env.MONGODB_URI).then(async () => { 
  const trades = await mongoose.connection.collection('trades').aggregate([
    { $sort: { closeTime: -1 } },
    { $limit: 1 }, 
    { $lookup: { from: 'users', localField: 'userId', foreignField: 'userId', as: 'userInfo' } }
  ]).toArray(); 
  console.log(JSON.stringify(trades, null, 2)); 
  process.exit(0); 
});
