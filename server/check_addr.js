const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const User = require('./models/User');
    const users = await User.find({ withdrawalAddress: { $ne: '' }, withdrawalAddress: { $exists: true } });
    console.log('Users:', users.map(u => ({ id: u.userId, addr: u.withdrawalAddress })));
    process.exit(0);
});
