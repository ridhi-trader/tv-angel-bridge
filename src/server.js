const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const brokerRoutes = require('./routes/broker');
const webhookRoutes = require('./routes/webhook');
const tradeRoutes = require('./routes/trades');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rate limit on webhook
const webhookLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use('/webhook', webhookLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/broker', brokerRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api/trades', tradeRoutes);

// Serve frontend
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`TV Bridge running on port ${PORT}`));
