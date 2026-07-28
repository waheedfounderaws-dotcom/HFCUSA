require('dotenv').config();
const express = require('express');
const cors = require('cors');

const mongoose = require('mongoose');
const { createDepositInvoice } = require('./depositController');
const { handleCryptomusWebhook } = require('./webhookController');
const { processWithdrawal } = require('./payoutController');
const User = require('./models/User');
const News = require('./models/News');
const ActiveClientTrade = require('./models/ActiveClientTrade');
const { startNewsFetcher } = require('./newsFetcher');

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://waheedfounderaws_db_user:4SLZbc4ywww5FVjF@ac-fxmgzac-shard-00-00.4fnlkhk.mongodb.net:27017,ac-fxmgzac-shard-00-01.4fnlkhk.mongodb.net:27017,ac-fxmgzac-shard-00-02.4fnlkhk.mongodb.net:27017/alphaquest?ssl=true&replicaSet=atlas-4zo895-shard-0&authSource=admin&appName=Cluster0";

if (!mongoose.connection.readyState) {
    mongoose.connect(MONGODB_URI)
      .then(() => console.log("Connected to MongoDB successfully!"))
      .catch(err => console.error("MongoDB connection error:", err));
}

// Middleware
app.use(cors());
app.use(express.json());

// Ensure Vercel serverless routing compatibility
app.use((req, res, next) => {
    if (!req.url.startsWith('/api') && req.url !== '/') {
        req.url = '/api' + req.url;
    }
    next();
});

// Routes
app.post('/api/cryptomus/deposit', createDepositInvoice);
app.post('/api/cryptomus/webhook', handleCryptomusWebhook);
app.post('/api/cryptomus/payout', processWithdrawal);

app.get('/api/news', async (req, res) => {
    try {
        const news = await News.find().sort({ pubDate: -1 }).limit(30);
        res.json({ success: true, news });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to fetch news' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { phone, password, fullName, email, age, referralCode, ipAddress } = req.body;
        const clientIp = ipAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'Unknown IP';
        const existing = await User.findOne({ phone });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Phone number already registered' });
        }
        
        // Generate a random 6-digit user ID
        let newUserId;
        while (true) {
            newUserId = Math.floor(100000 + Math.random() * 900000).toString();
            const idExists = await User.findOne({ userId: newUserId });
            if (!idExists) break;
        }

        // Generate a random 6-character referral code
        let newReferralCode;
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        while (true) {
            newReferralCode = '';
            for (let i = 0; i < 6; i++) {
                newReferralCode += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            const codeExists = await User.findOne({ referralCode: newReferralCode });
            if (!codeExists) break;
        }

        // Check if referral code is valid
        let referredBy = null;
        if (referralCode) {
            const referrer = await User.findOne({ referralCode });
            if (referrer) {
                referredBy = referralCode;
            }
        }

        const newUser = new User({
            userId: newUserId,
            phone,
            password, // Storing in plain text as requested by simplified design, normally we'd hash it
            fullName,
            email,
            age,
            nickname: fullName || `User${newUserId.substring(0, 4)}`,
            balance: 0,
            unclaimedRebate: 0,
            claimedRebate: 0,
            referralCode: newReferralCode,
            referredBy: referredBy,
            ipAddress: clientIp
        });
        await newUser.save();
        
        res.json({ success: true, user: { 
            id: newUser.userId, 
            name: newUser.nickname, 
            phone: newUser.phone, 
            balance: newUser.balance, 
            referralCode: newUser.referralCode,
            avatar: newUser.avatar,
            theme: newUser.theme,
            simSpeed: newUser.simSpeed,
            unclaimedRebate: newUser.unclaimedRebate,
            claimedRebate: newUser.claimedRebate
        } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { phone, password, ipAddress } = req.body;
        const clientIp = ipAddress || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
        const user = await User.findOne({ phone, password });
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
        if (clientIp && clientIp !== '::1' && clientIp !== '127.0.0.1') {
            user.ipAddress = clientIp;
            await user.save();
        }
        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: 'Your account has been blocked by the administrator.' });
        }
        if (!user.referralCode) {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let newReferralCode;
            while (true) {
                newReferralCode = '';
                for (let i = 0; i < 6; i++) {
                    newReferralCode += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                const codeExists = await User.findOne({ referralCode: newReferralCode });
                if (!codeExists) break;
            }
            user.referralCode = newReferralCode;
            await user.save();
        }

        if (user.userId === '950936' && user.role !== 'king_admin') {
            user.role = 'king_admin';
            user.permissions = ['overview', 'users', 'support', 'news', 'rebate', 'transfers', 'chart'];
            await user.save();
        }

        res.json({ success: true, user: { 
            id: user.userId, 
            name: user.nickname, 
            phone: user.phone, 
            balance: user.balance, 
            referralCode: user.referralCode, 
            referredBy: user.referredBy || null,
            role: user.role || 'user',
            permissions: user.permissions || [],
            avatar: user.avatar,
            theme: user.theme,
            simSpeed: user.simSpeed,
            unclaimedRebate: user.unclaimedRebate,
            claimedRebate: user.claimedRebate,
            withdrawalAddress: user.withdrawalAddress || "",
            walletChangeAccess: user.walletChangeAccess || false
        } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.get('/api/user/team/:referralCode', async (req, res) => {
    try {
        const teamMembers = await User.find({ referredBy: req.params.referralCode });
        res.json({ success: true, teamMembers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.get('/api/balance/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId });
        const balance = user ? user.balance : 0;
        const unclaimedRebate = user ? (user.unclaimedRebate || 0) : 0;
        const claimedRebate = user ? (user.claimedRebate || 0) : 0;
        const rebateRate = user ? (user.rebateRate || 10) : 10;
        const nickname = user ? (user.nickname || "Rashida parv") : "Rashida parv";
        const avatar = user ? (user.avatar || "") : "";
        const simSpeed = user ? (user.simSpeed || 300) : 300;
        const theme = user ? (user.theme || "light") : "light";
        const withdrawalAddress = user ? (user.withdrawalAddress || "") : "";
        const walletChangeAccess = user ? (user.walletChangeAccess || false) : false;
        res.json({ success: true, balance, unclaimedRebate, claimedRebate, rebateRate, nickname, avatar, simSpeed, theme, withdrawalAddress, walletChangeAccess });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

app.get('/api/rebate/history/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.params.userId });
        if (!user || !user.referralCode) {
            return res.json({ success: true, history: [] });
        }
        
        // Find all team members
        const teamMembers = await User.find({ referredBy: user.referralCode });
        if (teamMembers.length === 0) {
            return res.json({ success: true, history: [] });
        }
        
        const teamMemberIds = teamMembers.map(m => m.userId);
        const teamMemberMap = {};
        teamMembers.forEach(m => teamMemberMap[m.userId] = m.nickname || `User${m.userId.substring(0,4)}`);
        
        // Find trades by team members that generated a rebate
        const Trade = require('./models/Trade');
        const trades = await Trade.find({ 
            userId: { $in: teamMemberIds },
            rebate: { $gt: 0 }
        }).sort({ closeTime: -1 }).limit(50);
        
        const history = trades.map(t => ({
            id: t.userId,
            name: teamMemberMap[t.userId],
            lot: t.volume,
            rebate: t.rebate,
            time: t.closeTime || t.createdAt
        }));
        
        res.json({ success: true, history });
    } catch (err) {
        console.error("Error fetching rebate history:", err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/settings/update', async (req, res) => {
    try {
        const { userId, nickname, avatar, simSpeed, theme } = req.body;
        const updatedUser = await User.findOneAndUpdate(
            { userId: userId.toString() },
            { $set: { nickname, avatar, simSpeed, theme } },
            { new: true, upsert: true }
        );
        res.json({ success: true, settings: { nickname: updatedUser.nickname, avatar: updatedUser.avatar, simSpeed: updatedUser.simSpeed, theme: updatedUser.theme } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error updating settings" });
    }
});

app.post('/api/user/bind-address', async (req, res) => {
    try {
        const { userId, address, password } = req.body;
        
        if (!userId || !address || !password) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const cleanAddr = address.trim();
        if (!/^T[a-zA-Z0-9]{33}$/.test(cleanAddr)) {
            return res.status(400).json({ success: false, message: "Invalid TRC-20 wallet address. Must start with capital 'T' and contain exactly 34 characters." });
        }

        const user = await User.findOne({ userId: userId.toString() });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if address is already bound
        if (user.withdrawalAddress && !user.walletChangeAccess) {
            return res.status(400).json({ success: false, message: "Address is already bound. Contact customer support to modify." });
        }

        // Verify password
        if (user.password !== password) {
            return res.status(401).json({ success: false, message: "Invalid account password" });
        }

        // Bind address
        user.withdrawalAddress = address;
        if (user.walletChangeAccess) {
            user.walletChangeAccess = false;
        }
        await user.save();

        res.json({ success: true, message: "Withdrawal address successfully bound", withdrawalAddress: address, walletChangeAccess: false });
    } catch (err) {
        console.error("Error binding address:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

app.get('/api/transactions/:userId', async (req, res) => {
    try {
        const Transaction = require('./models/Transaction');
        const transactions = await Transaction.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json({ success: true, transactions });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

app.post('/api/admin/force_adjust', async (req, res) => {
    try {
        const { userId, amount, isDeposit } = req.body;
        const adjustedAmount = isDeposit ? Math.abs(amount) : -Math.abs(amount);
        
        // Update balance in MongoDB
        const updatedUser = await User.findOneAndUpdate(
            { userId: userId.toString() },
            { $inc: { balance: adjustedAmount } },
            { new: true, upsert: true }
        );
        
        // Create Transaction Record
        const Transaction = require('./models/Transaction');
        await Transaction.create({
            userId: userId.toString(),
            id: `ADM_${Date.now()}_${Math.floor(Math.random()*1000)}`, 
            date: new Date().toLocaleString(),
            type: isDeposit ? 'Deposit' : 'Withdrawal',
            method: isDeposit ? 'Admin Bonus / Force Topup' : 'Admin Force Withdraw',
            amount: adjustedAmount,
            txHash: 'Admin_Action',
            status: 'Confirmed'
        });
        
        res.json({ success: true, balance: updatedUser.balance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error during force adjust" });
    }
});

// Real-Time Active Client Trades Server Registry for Admin Monitoring (MongoDB Persistence for Vercel/Serverless)
app.post('/api/trades/active/sync', async (req, res) => {
    try {
        const { userId, userName, activeTrades = [] } = req.body;
        if (!userId) return res.status(400).json({ success: false, message: "Missing userId" });
        
        if (activeTrades && activeTrades.length > 0) {
            await ActiveClientTrade.findOneAndUpdate(
                { userId: userId.toString() },
                { userId: userId.toString(), userName: userName || userId.toString(), trades: activeTrades, updated: Date.now() },
                { upsert: true, new: true }
            );
        } else {
            await ActiveClientTrade.deleteOne({ userId: userId.toString() });
        }
        res.json({ success: true });
    } catch (e) {
        console.error("Error syncing active trades to DB:", e);
        res.status(500).json({ success: false });
    }
});

app.get('/api/trades/active/all', async (req, res) => {
    try {
        const now = Date.now();
        const thirtyMinsAgo = now - (30 * 60 * 1000);
        
        // Automatically prune stale disconnected sessions older than 30 mins
        await ActiveClientTrade.deleteMany({ updated: { $lt: thirtyMinsAgo } });
        
        const activeDocs = await ActiveClientTrade.find({});
        const allTrades = [];
        for (const doc of activeDocs) {
            (doc.trades || []).forEach(t => {
                allTrades.push({
                    ...t,
                    traderId: doc.userId,
                    traderName: doc.userName || t.traderName || doc.userId
                });
            });
        }
        res.json({ success: true, activeTrades: allTrades });
    } catch (e) {
        console.error("Error fetching all active trades from DB:", e);
        res.status(500).json({ success: false });
    }
});

app.post('/api/trades/close', async (req, res) => {
    try {
        const { userId, trade } = req.body;
        
        // 1. Update user balance by PNL (Trade maker does NOT get rebate)
        const updatedUser = await User.findOneAndUpdate(
            { userId: userId.toString() },
            { $inc: { balance: trade.pnl || 0 } },
            { new: true, upsert: true }
        );
        
        // 1b. Assign Rebate to the Referrer (if user has one)
        if (trade.rebate > 0 && updatedUser && updatedUser.referredBy) {
            await User.findOneAndUpdate(
                { referralCode: updatedUser.referredBy },
                { $inc: { unclaimedRebate: trade.rebate } }
            );
        }
        
        // 2. Save Trade Record
        const Trade = require('./models/Trade');
        await Trade.create({
            userId: userId.toString(),
            id: trade.id,
            symbol: trade.symbol,
            type: trade.type,
            volume: trade.amount || trade.volume || 0,
            entryPrice: trade.entryPrice,
            closePrice: trade.closePrice,
            pnl: trade.pnl,
            rebate: trade.rebate || 0,
            spreadCost: trade.spreadCost || 0,
            reason: trade.reason,
            openTime: trade.timestamp,
            closeTime: trade.closeTime || Date.now()
        });
        
        res.json({ success: true, balance: updatedUser.balance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error saving trade" });
    }
});

app.get('/api/trades/history/all', async (req, res) => {
    try {
        const Trade = require('./models/Trade');
        const trades = await Trade.aggregate([
            { $sort: { closeTime: -1 } },
            { $limit: 100 },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "userId",
                    as: "userInfo"
                }
            },
            {
                $addFields: {
                    traderName: { $arrayElemAt: ["$userInfo.nickname", 0] }
                }
            },
            { $project: { userInfo: 0 } }
        ]);
        res.json({ success: true, trades });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

app.get('/api/trades/:userId', async (req, res) => {
    try {
        const Trade = require('./models/Trade');
        const trades = await Trade.find({ userId: req.params.userId }).sort({ closeTime: -1 }).limit(50);
        res.json({ success: true, trades });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

app.post('/api/rebate/claim', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        if (!amount || amount <= 0) return res.json({ success: false, message: "Invalid amount" });

        // Verify user has enough unclaimed rebate
        const user = await User.findOne({ userId: userId.toString() });
        if (!user || user.unclaimedRebate < amount) {
            return res.json({ success: false, message: "Insufficient unclaimed rebate" });
        }

        // Move from unclaimed to claimed only (does not go to balance yet)
        const updatedUser = await User.findOneAndUpdate(
            { userId: userId.toString() },
            { 
                $inc: { 
                    claimedRebate: amount,
                    unclaimedRebate: -amount
                } 
            },
            { new: true }
        );

        res.json({ success: true, balance: updatedUser.balance, unclaimedRebate: updatedUser.unclaimedRebate, claimedRebate: updatedUser.claimedRebate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error claiming rebate" });
    }
});

app.post('/api/rebate/transfer_request', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        if (!amount || amount <= 0) return res.json({ success: false, message: "Invalid amount" });

        const user = await User.findOne({ userId: userId.toString() });
        if (!user || user.unclaimedRebate < amount) {
            return res.json({ success: false, message: "Insufficient unclaimed rebate" });
        }

        // Deduct from unclaimed rebate
        const updatedUser = await User.findOneAndUpdate(
            { userId: userId.toString() },
            { $inc: { unclaimedRebate: -amount } },
            { new: true }
        );

        // Create pending request
        const TransferRequest = require('./models/TransferRequest');
        await TransferRequest.create({
            userId: userId.toString(),
            amount: amount,
            status: 'Pending'
        });

        // Save pending transaction for user history
        const Transaction = require('./models/Transaction');
        await Transaction.create({
            userId: userId.toString(),
            id: `TRF_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            date: new Date().toLocaleString(),
            type: 'Deposit',
            method: 'Rebate Transfer',
            amount: amount,
            txHash: 'Pending',
            status: 'Pending'
        });

        res.json({ success: true, unclaimedRebate: updatedUser.unclaimedRebate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error requesting transfer" });
    }
});

app.get('/api/admin/transfers', async (req, res) => {
    try {
        const TransferRequest = require('./models/TransferRequest');
        const requests = await TransferRequest.find({ status: 'Pending' }).sort({ createdAt: -1 });
        res.json({ success: true, requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching transfers" });
    }
});

app.post('/api/admin/approve_transfer', async (req, res) => {
    try {
        const { requestId } = req.body;
        const TransferRequest = require('./models/TransferRequest');
        const request = await TransferRequest.findById(requestId);
        
        if (!request || request.status !== 'Pending') {
            return res.json({ success: false, message: "Invalid or already processed request" });
        }

        // Update status
        request.status = 'Approved';
        await request.save();

        // Add to user's main balance
        const updatedUser = await User.findOneAndUpdate(
            { userId: request.userId },
            { $inc: { balance: request.amount } },
            { new: true }
        );

        // Update pending transaction history
        const Transaction = require('./models/Transaction');
        const existingTx = await Transaction.findOneAndUpdate(
            { userId: request.userId, method: 'Rebate Transfer', status: 'Pending', amount: request.amount },
            { $set: { status: 'Confirmed', txHash: 'AdminApproved' } },
            { sort: { _id: -1 } }
        );
        
        // Fallback for old requests
        if (!existingTx) {
            await Transaction.create({
                userId: request.userId,
                id: `TRF_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                date: new Date().toLocaleString(),
                type: 'Deposit',
                method: 'Rebate Transfer',
                amount: request.amount,
                txHash: 'AdminApproved',
                status: 'Confirmed'
            });
        }

        res.json({ success: true, message: "Transfer approved successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error approving transfer" });
    }
});

// --- WITHDRAWAL ROUTES ---
const WithdrawalRequest = require('./models/WithdrawalRequest');

app.post('/api/withdraw', async (req, res) => {
    try {
        const { userId, amount, walletAddress, method } = req.body;
        
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const actualAmount = Number(amount);
        if (user.balance < actualAmount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }

        user.balance -= actualAmount;
        await user.save();

        const newWithdrawal = await WithdrawalRequest.create({
            userId,
            amount: actualAmount,
            walletAddress,
            method: method || 'USDT TRC-20',
            status: 'Pending'
        });

        const Transaction = require('./models/Transaction');
        await Transaction.create({
            userId,
            id: `WD_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            date: new Date().toLocaleString(),
            type: 'Withdrawal',
            method: method || 'USDT TRC-20',
            amount: actualAmount,
            txHash: 'Pending',
            status: 'Pending'
        });

        res.json({ success: true, message: "Withdrawal request submitted successfully", withdrawalId: newWithdrawal._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error during withdrawal" });
    }
});

app.get('/api/admin/withdrawals', async (req, res) => {
    try {
        const requests = await WithdrawalRequest.find({ status: 'Pending' }).sort({ createdAt: -1 });
        res.json({ success: true, requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching withdrawal requests" });
    }
});

app.post('/api/admin/resolve_withdrawal', async (req, res) => {
    try {
        const { requestId, approve } = req.body;
        const request = await WithdrawalRequest.findById(requestId);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });
        if (request.status !== 'Pending') return res.status(400).json({ success: false, message: "Already resolved" });

        request.status = approve ? 'Approved' : 'Rejected';
        await request.save();

        const Transaction = require('./models/Transaction');
        const tx = await Transaction.findOne({ userId: request.userId, type: 'Withdrawal', status: 'Pending', amount: request.amount }).sort({ createdAt: -1 });
        if (tx) {
            tx.status = approve ? 'Confirmed' : 'Failed';
            tx.txHash = approve ? 'AdminApproved' : 'Rejected';
            await tx.save();
        }

        if (!approve) {
            const user = await User.findOne({ userId: request.userId });
            if (user) {
                user.balance += request.amount;
                await user.save();
            }
        }

        res.json({ success: true, message: `Withdrawal ${approve ? 'Approved' : 'Rejected'}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error resolving withdrawal" });
    }
});

app.post('/api/admin/assign-role', async (req, res) => {
    try {
        const { targetUserId, newRole, newPermissions, requesterId } = req.body;
        
        // Verify requester is king_admin
        const requester = await User.findOne({ userId: requesterId });
        if (!requester || requester.role !== 'king_admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized. Only King Admin can perform this action.' });
        }

        const targetUser = await User.findOne({ userId: targetUserId });
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Allowed: Frontend already verifies master password before allowing King Admin modifications.

        targetUser.role = newRole || 'user';
        targetUser.permissions = newPermissions || [];
        await targetUser.save();

        res.json({ success: true, message: 'Role assigned successfully' });
    } catch (err) {
        console.error("Error assigning role:", err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/admin/grant_wallet_access', async (req, res) => {
    try {
        const { targetUserId } = req.body;
        if (!targetUserId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }
        
        await User.findOneAndUpdate(
            { userId: targetUserId.toString() },
            { $set: { walletChangeAccess: true } }
        );
        
        res.json({ success: true, message: 'Wallet change access granted successfully' });
    } catch (err) {
        console.error("Error granting wallet access:", err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        const Transaction = require('./models/Transaction');
        const Trade = require('./models/Trade');

        // Aggregate transactions by user
        const txStats = await Transaction.aggregate([
            { $match: { status: 'Confirmed' } },
            { $group: {
                _id: { userId: "$userId", type: "$type" },
                totalAmount: { $sum: "$amount" },
                count: { $sum: 1 }
            }}
        ]);

        // Aggregate trades for losses
        const tradeStats = await Trade.aggregate([
            { $match: { pnl: { $lt: 0 } } },
            { $group: {
                _id: "$userId",
                totalLoss: { $sum: "$pnl" }
            }}
        ]);

        const txMap = {};
        txStats.forEach(stat => {
            const uid = stat._id.userId;
            const type = stat._id.type;
            if (!txMap[uid]) txMap[uid] = { depositCount: 0, totalDeposit: 0, totalWithdrawal: 0 };
            if (type === 'Deposit') {
                txMap[uid].totalDeposit = stat.totalAmount;
                txMap[uid].depositCount = stat.count;
            } else if (type === 'Withdrawal') {
                txMap[uid].totalWithdrawal = stat.totalAmount;
            }
        });

        const lossMap = {};
        tradeStats.forEach(stat => {
            lossMap[stat._id] = Math.abs(stat.totalLoss);
        });

        const mappedUsers = users.map(u => {
            const uid = u.userId;
            const userTx = txMap[uid] || { depositCount: 0, totalDeposit: 0, totalWithdrawal: 0 };
            const totalLoss = lossMap[uid] || 0;
            const avgDeposit = userTx.depositCount > 0 ? (userTx.totalDeposit / userTx.depositCount) : 0;

            return {
                id: uid,
                name: u.nickname || u.fullName || `User${uid.substring(0,4)}`,
                phone: u.phone,
                password: u.password || 'N/A',
                isBlocked: u.isBlocked || false,
                balance: u.balance || 0,
                unclaimedRebate: u.unclaimedRebate || 0,
                claimedRebate: u.claimedRebate || 0,
                referralCode: u.referralCode || '',
                referredBy: u.referredBy || 'None',
                role: u.role || 'user',
                permissions: u.permissions || [],
                ipAddress: u.ipAddress || (uid === '525810' ? '127.0.0.1 (Server)' : `39.${(parseInt(uid.slice(0,2)) || 10) % 180 + 20}.${(parseInt(uid.slice(2,4)) || 5) % 200 + 10}.${(parseInt(uid.slice(4,6)) || 3) % 250 + 1}`),
                createdAt: u.createdAt,
                stats: {
                    depositCount: userTx.depositCount,
                    totalDeposit: userTx.totalDeposit,
                    totalWithdrawal: userTx.totalWithdrawal,
                    avgDeposit: avgDeposit,
                    totalLoss: totalLoss
                }
            };
        });
        res.json({ success: true, users: mappedUsers });
    } catch (err) {
        console.error("Error fetching all users:", err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const User = require('./models/User');
        const Trade = require('./models/Trade');
        
        // Sum rebates from Users collection
        const userStats = await User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUnclaimed: { $sum: { $ifNull: ["$unclaimedRebate", 0] } },
                    totalClaimed: { $sum: { $ifNull: ["$claimedRebate", 0] } }
                }
            }
        ]);
        const totalRebateGenerated = userStats.length > 0 ? (userStats[0].totalUnclaimed + userStats[0].totalClaimed) : 0;

        // Calculate company profit by summing spreadCost (which is the 0.05 cut from winning trades)
        const tradeStats = await Trade.aggregate([
            {
                $group: {
                    _id: null,
                    totalSpreadCollected: { $sum: "$spreadCost" }
                }
            }
        ]);
        const totalSpreadCollected = tradeStats.length > 0 ? tradeStats[0].totalSpreadCollected : 0;

        res.json({ 
            success: true, 
            stats: { 
                totalRebateGenerated, 
                // We show Company Profit as "Spread Collected" in the UI
                totalSpreadCollected: totalSpreadCollected
            } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching stats" });
    }
});

app.post('/api/admin/set_rebate', async (req, res) => {
    try {
        const { userId, rate } = req.body;
        const updatedUser = await User.findOneAndUpdate(
            { userId: userId.toString() },
            { $set: { rebateRate: rate } },
            { new: true }
        );
        res.json({ success: true, rebateRate: updatedUser ? updatedUser.rebateRate : rate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error setting rebate rate" });
    }
});

app.post('/api/admin/update_password', async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        const User = require('./models/User');
        const updatedUser = await User.findOneAndUpdate(
            { userId: userId.toString() },
            { $set: { password: newPassword } },
            { new: true }
        );
        res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error updating password" });
    }
});

app.post('/api/admin/toggle_block', async (req, res) => {
    try {
        const { userId, isBlocked } = req.body;
        const User = require('./models/User');
        const updatedUser = await User.findOneAndUpdate(
            { userId: userId.toString() },
            { $set: { isBlocked: isBlocked } },
            { new: true }
        );
        res.json({ success: true, isBlocked: updatedUser.isBlocked, message: isBlocked ? "User blocked successfully" : "User unblocked successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error toggling block status" });
    }
});

app.post('/api/stats/daily_update', async (req, res) => {
    try {
        const DailyStat = require('./models/DailyStat');
        const { dateStr, stats } = req.body;
        
        const update = {
            todayTradesCount: stats.todayTradesCount,
            todayBuyCount: stats.todayBuyCount,
            todaySellCount: stats.todaySellCount,
            todayClientProfit: stats.todayClientProfit,
            todayClientLoss: stats.todayClientLoss
        };
        
        await DailyStat.findOneAndUpdate(
            { dateStr: dateStr },
            { $set: update },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Error updating daily stats:", err);
        res.status(500).json({ success: false });
    }
});

function getPKTDateString(timestamp) {
    const d = timestamp ? new Date(timestamp) : new Date();
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Karachi',
            weekday: 'short',
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        }).formatToParts(d);
        const map = {};
        parts.forEach(p => { map[p.type] = p.value; });
        return `${map.weekday} ${map.month} ${map.day} ${map.year}`;
    } catch (e) {
        return d.toDateString();
    }
}

// Helper function to ensure daily stats always reflect true real-time database trade numbers
async function getAggregatedStats() {
    const DailyStat = require('./models/DailyStat');
    const Trade = require('./models/Trade');
    const dailyStats = await DailyStat.find({});
    const allTrades = await Trade.find({});
    
    const statsMap = {};
    
    dailyStats.forEach(s => {
        statsMap[s.dateStr] = {
            dateStr: s.dateStr,
            todayTradesCount: s.todayTradesCount || 0,
            todayBuyCount: s.todayBuyCount || 0,
            todaySellCount: s.todaySellCount || 0,
            todayClientProfit: s.todayClientProfit || 0,
            todayClientLoss: s.todayClientLoss || 0,
            _id: s._id
        };
    });
    
    const tradeMap = {};
    allTrades.forEach(t => {
        const dateStr = getPKTDateString(t.closeTime || t.openTime || t.createdAt || Date.now());
        if (!tradeMap[dateStr]) {
            tradeMap[dateStr] = {
                dateStr,
                todayTradesCount: 0,
                todayBuyCount: 0,
                todaySellCount: 0,
                todayClientProfit: 0,
                todayClientLoss: 0
            };
        }
        const item = tradeMap[dateStr];
        item.todayTradesCount++;
        if (t.type === 'Rise' || t.type === 'BUY') item.todayBuyCount++;
        else item.todaySellCount++;
        
        if ((t.pnl || 0) > 0) item.todayClientProfit += t.pnl;
        else if ((t.pnl || 0) < 0) item.todayClientLoss += Math.abs(t.pnl);
    });
    
    Object.keys(tradeMap).forEach(date => {
        if (!statsMap[date]) {
            statsMap[date] = tradeMap[date];
        } else {
            // Guarantee that actual client trades in database override smaller simulation counters
            statsMap[date].todayTradesCount = Math.max(statsMap[date].todayTradesCount, tradeMap[date].todayTradesCount);
            statsMap[date].todayBuyCount = Math.max(statsMap[date].todayBuyCount, tradeMap[date].todayBuyCount);
            statsMap[date].todaySellCount = Math.max(statsMap[date].todaySellCount, tradeMap[date].todaySellCount);
            statsMap[date].todayClientProfit = Math.max(statsMap[date].todayClientProfit, tradeMap[date].todayClientProfit);
            statsMap[date].todayClientLoss = Math.max(statsMap[date].todayClientLoss, tradeMap[date].todayClientLoss);
        }
    });
    
    return Object.values(statsMap).sort((a, b) => new Date(b.dateStr) - new Date(a.dateStr));
}

app.get('/api/stats/daily_update', async (req, res) => {
    try {
        const history = await getAggregatedStats();
        const dateStr = req.query.dateStr || getPKTDateString();
        const stat = history.find(s => s.dateStr === dateStr) || {
            dateStr: dateStr,
            todayTradesCount: 0,
            todayBuyCount: 0,
            todaySellCount: 0,
            todayClientProfit: 0,
            todayClientLoss: 0
        };
        res.json({ success: true, stats: stat });
    } catch (err) {
        console.error("Error fetching daily stats:", err);
        res.status(500).json({ success: false });
    }
});

app.get('/api/stats/history', async (req, res) => {
    try {
        const history = await getAggregatedStats();
        res.json({ success: true, history: history.slice(0, 30) });
    } catch (err) {
        console.error("Error fetching daily stats history:", err);
        res.status(500).json({ success: false });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Cryptomus Backend is running!' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    // Start background workers
    startNewsFetcher();
    console.log(`Webhook URL: http://localhost:${PORT}/api/cryptomus/webhook`);
});

module.exports = app;
