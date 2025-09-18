require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const questRoutes = require('./routes/quests');
const userRoutes = require('./routes/users');
const progressRoutes = require('./routes/progress');
// Public routes (no authentication required)
const usersPublicRoutes = require('./routes/users-public');
const progressPublicRoutes = require('./routes/progress-public');

const app = express();
const PORT = process.env.PORT || 3001;

// General rate limiting for all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Allow more general requests
  trustProxy: false,
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit auth attempts
  trustProxy: false,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  }
});

// More lenient rate limiting for user profile updates
const profileLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Allow 20 profile updates per 5 minutes
  trustProxy: false,
  message: {
    error: 'Too many profile updates, please wait a moment.',
    retryAfter: '5 minutes'
  }
});

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3002', 
    'https://shardeum-quest-kygh.vercel.app',
    'https://shardeum-quest-kygh.vercel.app/',
    /https:\/\/.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(generalLimiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shardeumquest', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

console.log('🗄️  Using MongoDB for persistent storage');

// Public routes (no authentication required)
app.use('/api/public/users', usersPublicRoutes);
app.use('/api/public/progress', progressPublicRoutes);

// All routes are now public (no authentication required)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/quests', questRoutes);
app.use('/api/users', userRoutes);
app.use('/api/progress', progressRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});