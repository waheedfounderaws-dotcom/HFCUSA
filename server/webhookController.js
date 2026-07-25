const { PAYMENT_API_KEY, generateSignature } = require('./cryptomus');
const User = require('./models/User');

async function handleCryptomusWebhook(req, res) {
    try {
        const payload = req.body;
        const receivedSign = payload.sign;

        // Security Check: Sign ko verify karein
        const payloadWithoutSign = { ...payload };
        delete payloadWithoutSign.sign;

        const calculatedSign = generateSignature(payloadWithoutSign, PAYMENT_API_KEY);

        if (receivedSign !== calculatedSign) {
            return res.status(400).json({ error: "Invalid Signature. Hacker attempt detected!" });
        }

        // Agar payment aagayi hai toh user ka balance update karein
        if (payload.status === 'paid' || payload.status === 'paid_over') {
            const orderId = payload.order_id;
            const amountPaid = parseFloat(payload.amount);
            
            // Extracted User ID from order_id (Format: DEP_{timestamp}_{userId})
            const userId = orderId.split('_')[2];
            
            const updatedUser = await User.findOneAndUpdate(
                { userId: userId },
                { $inc: { balance: amountPaid } },
                { new: true, upsert: true }
            );
            
            // Create Transaction Record
            const Transaction = require('./models/Transaction');
            await Transaction.create({
                userId: userId,
                id: orderId, // use orderId as the transaction ID
                date: new Date().toLocaleString(),
                type: 'Deposit',
                method: 'Cryptomus USDT',
                amount: amountPaid,
                txHash: payload.txid || 'N/A',
                status: 'Confirmed'
            });
            
            console.log(`Successfully credited ${amountPaid} to user ${userId}. New Balance: ${updatedUser.balance}`);
        }

        res.status(200).send("OK");
    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).send("Internal Error");
    }
}

module.exports = { handleCryptomusWebhook };
