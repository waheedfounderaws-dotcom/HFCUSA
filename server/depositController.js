const axios = require('axios');
const { MERCHANT_ID, PAYMENT_API_KEY, generateSignature } = require('./cryptomus');

async function createDepositInvoice(req, res) {
    try {
        const { amount, currency, userId } = req.body; // e.g., 100, "USDT", "user_123"

        const payload = {
            amount: amount.toString(),
            currency: currency, // e.g., "USDT"
            network: "TRX", // TRC20 network (sasta aur tez)
            order_id: `DEP_${Date.now()}_${userId}`, // Aapke system ka unique ID
            url_callback: "https://yourdomain.com/api/cryptomus/webhook" // Cryptomus yahan update bhejega
        };

        const sign = generateSignature(payload, PAYMENT_API_KEY);

        const response = await axios.post('https://api.cryptomus.com/v1/payment', payload, {
            headers: {
                merchant: MERCHANT_ID,
                sign: sign,
                'Content-Type': 'application/json'
            }
        });

        // User ko payment address ya URL wapis bhej dein
        res.status(200).json({
            success: true,
            address: response.data.result.address, // User ko yeh address dikhana hai
            payment_url: response.data.result.url
        });
    } catch (error) {
        console.error("Deposit Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ success: false, message: "Payment generation failed" });
    }
}

module.exports = { createDepositInvoice };
