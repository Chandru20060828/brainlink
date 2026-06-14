require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { startCronJobs } = require('./cron');

const app = express();

// CORS — supports multiple origins via comma-separated CLIENT_URL env var
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  })
);

// ENV DEBUG LOGS
console.log('========== ENV DEBUG ==========');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NOT SET');
console.log('CLIENT_URL:', process.env.CLIENT_URL || 'NOT SET');

console.log(
  'BREVO_SMTP_USER:',
  process.env.BREVO_SMTP_USER ? 'SET' : 'MISSING'
);

console.log(
  'BREVO_SMTP_KEY:',
  process.env.BREVO_SMTP_KEY ? 'SET' : 'MISSING'
);

console.log(
  'BREVO_FROM_EMAIL:',
  process.env.BREVO_FROM_EMAIL ? 'SET' : 'MISSING'
);

console.log(
  'BREVO_FROM_NAME:',
  process.env.BREVO_FROM_NAME ? 'SET' : 'MISSING'
);

console.log(
  'JWT_SECRET:',
  process.env.JWT_SECRET ? 'SET' : 'MISSING'
);

console.log(
  'MONGO_URI:',
  process.env.MONGO_URI ? 'SET' : 'MISSING'
);

console.log('===============================');

// Connect DB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(
  process.env.MONGO_URI || 'mongodb://localhost:27017/brainlink'
)
.then(() => {
  console.log('✅ MongoDB connected');

  startCronJobs();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB error:', err);
});

// Debug health check — shows DB status and user count
app.get('/api/debug', async (req, res) => {
  try {
    const User = require('./models/User');

    const count = await User.countDocuments();

    res.json({
      status: 'ok',
      db:
        mongoose.connection.readyState === 1
          ? 'connected'
          : 'disconnected',
      registeredUsers: count,
      time: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message
    });
  }
});