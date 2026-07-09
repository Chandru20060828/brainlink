const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { isPaymentTimeAllowed, generateInvoiceNumber } = require('../utils/helpers');

const PLANS = {
  bronze: { amount: 10000, name: 'Bronze Plan' }, // ₹100 in paise
  silver: { amount: 30000, name: 'Silver Plan' }, // ₹300
  gold: { amount: 100000, name: 'Gold Plan' }      // ₹1000
};

let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder'
  });
} catch (e) {
  console.log('Razorpay not initialized - check credentials');
}

// Create order
router.post('/create-order', auth, async (req, res) => {
  try {
    if (!isPaymentTimeAllowed()) {
      return res.status(403).json({ message: 'Payments are only allowed between 10:00 AM and 11:00 AM IST.' });
    }
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ message: 'Invalid plan' });

    // Demo mode if no Razorpay keys
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder') {
      const demoOrderId = 'order_demo_' + Date.now();
      const payment = await Payment.create({
        user: req.user._id,
        razorpayOrderId: demoOrderId,
        plan,
        amount: PLANS[plan].amount,
        invoiceNumber: generateInvoiceNumber(),
        status: 'created'
      });
      return res.json({ orderId: demoOrderId, amount: PLANS[plan].amount, currency: 'INR', plan, demo: true, paymentId: payment._id });
    }

    const order = await razorpay.orders.create({
      amount: PLANS[plan].amount,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`
    });

    const payment = await Payment.create({
      user: req.user._id,
      razorpayOrderId: order.id,
      plan,
      amount: order.amount,
      invoiceNumber: generateInvoiceNumber(),
      status: 'created'
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, plan, paymentId: payment._id, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify payment
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId, demo } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (!demo) {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(body).digest('hex');
      if (expected !== razorpaySignature) return res.status(400).json({ message: 'Payment verification failed' });
    }

    payment.razorpayPaymentId = razorpayPaymentId || 'demo_pay_' + Date.now();
    payment.status = 'paid';
    await payment.save();

    // Update user subscription
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await User.findByIdAndUpdate(req.user._id, {
      'subscription.plan': payment.plan,
      'subscription.expiresAt': expiresAt
    });

    res.json({ message: 'Payment successful! Subscription activated.', plan: payment.plan });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get payment history
router.get('/history', auth, async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(payments);
});

module.exports = router;
