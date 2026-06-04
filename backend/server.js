require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');
const { startCronJobs } = require('./cron');

const app = express();

const nodemailer = require('nodemailer');

// 🔥 SMTP TEST (temporary for debugging)
async function testSMTP() {
  try {
    console.log("🔄 Testing SMTP connection...");

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      connectionTimeout: 10000,
    });

    await transporter.verify();

    console.log("✅ SMTP CONNECTION SUCCESS");
  } catch (err) {
    console.log("❌ SMTP CONNECTION FAILED:", err.message);
  }
}


// CORS — supports multiple origins via comma-separated CLIENT_URL env var
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/payment',   require('./routes/payment'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/posts',     require('./routes/posts'));
app.use('/api/users',     require('./routes/users'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

// Connect DB and start server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/brainlink')
  .then(() => {
    console.log('✅ MongoDB connected');
    startCronJobs();
    testSMTP(); 
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB error:', err));

// Debug health check — shows DB status and user count (remove in production)
app.get('/api/debug', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const User = require('./models/User');
    const count = await User.countDocuments();
    res.json({
      status: 'ok',
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      registeredUsers: count,
      time: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});
