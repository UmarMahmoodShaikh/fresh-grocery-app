const paypal = require('@paypal/checkout-server-sdk');
require('dotenv').config();

/**
 * PayPal HTTP client configuration
 * Creates either sandbox or live environment based on PAYPAL_MODE
 */
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || 'sandbox';

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not found. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in .env file');
  }

  if (mode === 'live') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
  
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

/**
 * Returns PayPal HTTP client instance
 */
function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

module.exports = { client };
