const crypto = require('crypto');
const axios = require('axios');

const MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID;
const PAYMENT_API_KEY = process.env.CRYPTOMUS_PAYMENT_API_KEY;
const PAYOUT_API_KEY = process.env.CRYPTOMUS_PAYOUT_API_KEY;

// API Signature Banane Ka Function
function generateSignature(payload, apiKey) {
    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    return crypto.createHash('md5').update(base64Payload + apiKey).digest('hex');
}

module.exports = { MERCHANT_ID, PAYMENT_API_KEY, PAYOUT_API_KEY, generateSignature };
