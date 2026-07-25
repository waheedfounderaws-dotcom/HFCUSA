const axios = require('axios');
const { MERCHANT_ID, PAYOUT_API_KEY, generateSignature } = require('./cryptomus');
const User = require('./models/User');
const Transaction = require('./models/Transaction');

async function processWithdrawal(req, res) {
    try {
        const { amount, to_address, currency, userId } = req.body; 
        
        // 1. Verify user has enough balance
        const user = await User.findOne({ userId });
        if (!user || user.balance < amount) {
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }

        const orderId = `WD_${Date.now()}`;
        const payload = {
            amount: amount.toString(),
            currency: currency,
            network: "TRX",
            order_id: orderId,
            address: to_address,
            is_subtract: false 
        };

        const sign = generateSignature(payload, PAYOUT_API_KEY);

        const response = await axios.post('https://api.cryptomus.com/v1/payout', payload, {
            headers: {
                merchant: MERCHANT_ID,
                sign: sign,
                'Content-Type': 'application/json'
            }
        });

        // If cryptomus accepts the payout request
        if (response.data && response.data.state === 0) {
            // Deduct balance
            await User.findOneAndUpdate(
                { userId: userId },
                { $inc: { balance: -amount } }
            );
            
            // Record Transaction
            await Transaction.create({
                userId: userId,
                id: orderId,
                date: new Date().toLocaleString(),
                type: 'Withdrawal',
                method: 'Cryptomus USDT',
                amount: -amount,
                txHash: response.data.result?.txid || 'Pending',
                status: 'Confirmed'
            });

            return res.status(200).json({ success: true, message: "Withdrawal processed successfully", data: response.data });
        } else {
            return res.status(400).json({ success: false, message: "Cryptomus rejected payout", data: response.data });
        }
    } catch (error) {
        console.error("Payout Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "Withdrawal failed" });
    }
}

module.exports = { processWithdrawal };
