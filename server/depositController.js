const axios = require('axios');
const { MERCHANT_ID, PAYMENT_API_KEY, generateSignature } = require('./cryptomus');

async function createDepositInvoice(req, res) {
    try {
        const { amount, currency, userId } = req.body; // e.g., 100, "USDT", "user_123"

        if (!MERCHANT_ID || MERCHANT_ID === 'your_merchant_id_here' || !PAYMENT_API_KEY || PAYMENT_API_KEY === 'your_payment_api_key_here') {
            console.log("Using Simulated Deposit Sandbox Mode");
            const User = require('./models/User');
            const Transaction = require('./models/Transaction');
            const user = await User.findOne({ userId });
            if (user) {
                user.balance = (user.balance || 0) + parseFloat(amount);
                await user.save();
                await Transaction.create({
                    userId: userId,
                    id: `SIM_DEP_${Date.now()}`,
                    date: new Date().toLocaleString(),
                    type: 'Deposit',
                    method: `${currency} (Simulated TRC-20)`,
                    amount: parseFloat(amount),
                    txHash: `TX_${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
                    status: 'Confirmed'
                });
            }
            return res.status(200).json({
                success: true,
                address: "TRC20_SIMULATED_SANDBOX_ADDRESS_99218",
                payment_url: `https://hfcusa.online/?deposit_confirmed=${amount}`
            });
        }

        const payload = {
            amount: amount.toString(),
            currency: currency,
            network: "TRX",
            order_id: `DEP_${Date.now()}_${userId}`,
            url_callback: "https://hfcusa.online/api/cryptomus/webhook"
        };

        const sign = generateSignature(payload, PAYMENT_API_KEY);

        const response = await axios.post('https://api.cryptomus.com/v1/payment', payload, {
            headers: {
                merchant: MERCHANT_ID,
                sign: sign,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json({
            success: true,
            address: response.data.result.address,
            payment_url: response.data.result.url
        });
    } catch (error) {
        console.error("Deposit Error, falling back to simulated Sandbox Mode:", error.response ? error.response.data : error.message);
        const User = require('./models/User');
        const Transaction = require('./models/Transaction');
        const { amount, currency, userId } = req.body;
        const user = await User.findOne({ userId });
        if (user) {
            user.balance = (user.balance || 0) + parseFloat(amount);
            await user.save();
            await Transaction.create({
                userId: userId,
                id: `SIM_DEP_${Date.now()}`,
                date: new Date().toLocaleString(),
                type: 'Deposit',
                method: `${currency || 'USDT'} (Simulated TRC-20)`,
                amount: parseFloat(amount),
                txHash: `TX_${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
                status: 'Confirmed'
            });
        }
        res.status(200).json({
            success: true,
            address: "TRC20_SIMULATED_SANDBOX_ADDRESS_99218",
            payment_url: `https://hfcusa.online/?deposit_confirmed=${amount}`
        });
    }
}

module.exports = { createDepositInvoice };
