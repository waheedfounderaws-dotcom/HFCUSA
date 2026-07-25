require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  const User = require('./models/User');
  await User.updateMany({}, { $set: { unclaimedRebate: 0, claimedRebate: 0 } });
  console.log('Reset users rebates.');
  
  const Trade = require('./models/Trade');
  await Trade.deleteMany({});
  console.log('Deleted all trades.');
  
  console.log('Reset complete!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
