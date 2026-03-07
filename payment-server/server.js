const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const paypal = require('@paypal/checkout-server-sdk');
const paypalClient = require('./paypal-config').client;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Payment server is running',
    paypalMode: process.env.PAYPAL_MODE || 'sandbox'
  });
});

/**
 * Create PayPal Order
 * This endpoint creates a PayPal order and returns the order ID
 */
app.post('/api/paypal/create-order', async (req, res) => {
  try {
    const { amount, currency = 'USD', description = 'Grocery Order' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create order request
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        description: description,
        amount: {
          currency_code: currency,
          value: amount.toFixed(2)
        }
      }],
      application_context: {
        brand_name: 'Fresh Grocery Store',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: 'https://your-app.com/success',
        cancel_url: 'https://your-app.com/cancel'
      }
    });

    // Call PayPal to create the order
    const order = await paypalClient().execute(request);
    
    console.log('PayPal order created:', order.result.id);

    // Return order ID and approval URL
    res.json({
      id: order.result.id,
      status: order.result.status,
      links: order.result.links
    });

  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ 
      error: 'Failed to create PayPal order',
      details: error.message 
    });
  }
});

/**
 * Capture PayPal Order
 * This endpoint captures the payment after user approval
 */
app.post('/api/paypal/capture-order', async (req, res) => {
  try {
    const { orderID } = req.body;

    if (!orderID) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Create capture request
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    // Call PayPal to capture the order
    const capture = await paypalClient().execute(request);
    
    console.log('PayPal payment captured:', capture.result.id);

    // Return capture details
    res.json({
      id: capture.result.id,
      status: capture.result.status,
      payer: capture.result.payer,
      purchase_units: capture.result.purchase_units
    });

  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).json({ 
      error: 'Failed to capture PayPal order',
      details: error.message 
    });
  }
});

/**
 * Get Order Details
 * This endpoint retrieves order details from PayPal
 */
app.get('/api/paypal/order/:orderID', async (req, res) => {
  try {
    const { orderID } = req.params;

    const request = new paypal.orders.OrdersGetRequest(orderID);
    const order = await paypalClient().execute(request);

    res.json({
      id: order.result.id,
      status: order.result.status,
      payer: order.result.payer,
      purchase_units: order.result.purchase_units
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      error: 'Failed to fetch order details',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Payment server running on http://localhost:${PORT}`);
  console.log(`📊 PayPal mode: ${process.env.PAYPAL_MODE || 'sandbox'}`);
  console.log(`💡 Health check: http://localhost:${PORT}/health`);
});
