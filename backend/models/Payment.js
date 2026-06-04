const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  plan: { type: String, enum: ['bronze', 'silver', 'gold'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created' },
  invoiceNumber: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
