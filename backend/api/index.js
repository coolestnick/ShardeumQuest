require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const authRoutes = require('../src/routes/auth');
const questRoutes = require('../src/routes/quests');
const userRoutes = require('../src/routes/users');
const progressRoutes = require('../src/routes/progress');
// Public routes (no authentication required)
const usersPublicRoutes = require('../src/routes/users-public');
const progressPublicRoutes = require('../src/routes/progress-public');

const app = express();

// Vercel-specific configuration
const isProduction = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// Enhanced rate limiting for Vercel
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 5000 : 1000, // Much higher limits for production
  trustProxy: true, // Important for Vercel
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for read-only public endpoints
    return req.method === 'GET' && req.path.startsWith('/api/public/');
  },
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: '15 minutes'
  }
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit auth attempts
  trustProxy: true, // Important for Vercel
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  }
});

// More lenient rate limiting for user profile updates
const profileLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Allow 20 profile updates per 5 minutes
  trustProxy: true, // Important for Vercel
  message: {
    error: 'Too many profile updates, please wait a moment.',
    retryAfter: '5 minutes'
  }
});

// Enhanced CORS configuration for Vercel
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3002', 
    'https://shardeum-quest-kygh.vercel.app',
    'https://shardeum-quest-kygh.vercel.app/',
    /https:\/\/.*\.vercel\.app$/,
    /https:\/\/shardeum-quest.*\.vercel\.app$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// Request timeout for Vercel (10s serverless limit)
app.use((req, res, next) => {
  req.setTimeout(8000, () => {
    res.status(408).json({ error: 'Request timeout' });
  });
  next();
});

// Enhanced MongoDB connection for Vercel serverless
let cachedConnection = null;

async function connectToDatabase(retries = 3) {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('♻️  Reusing cached MongoDB connection');
    return cachedConnection;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tip-dapp';
      console.log(`🔌 Attempting MongoDB connection (attempt ${attempt}/${retries})...`);
      console.log('📍 MongoDB URI present:', !!process.env.MONGODB_URI);
      console.log('🌐 Connection string preview:', mongoUri.substring(0, 50) + '...');

      const connection = await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Increased pool size for better concurrency
        minPoolSize: 2,  // Maintain minimum connections
        serverSelectionTimeoutMS: 8000, // Increased timeout for Vercel
        socketTimeoutMS: 20000, // Increased socket timeout
        connectTimeoutMS: 10000, // Connection timeout
        bufferCommands: false,
        retryWrites: true,
        retryReads: true
        // Removed bufferMaxEntries and family options that cause issues on Vercel
      });

      cachedConnection = connection;
      console.log('✅ MongoDB connected successfully (Vercel)');
      console.log('📊 Database:', mongoose.connection.name);
      console.log('🏠 Host:', mongoose.connection.host);
      return connection;
    } catch (error) {
      console.error(`❌ MongoDB connection failed (attempt ${attempt}/${retries}):`, {
        message: error.message,
        name: error.name,
        code: error.code,
        mongoUri: !!process.env.MONGODB_URI ? 'SET' : 'NOT_SET'
      });

      // If this is the last attempt, throw the error
      if (attempt === retries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Database connection middleware - only for routes that need DB
const requireDatabase = async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(503).json({ error: 'Database temporarily unavailable' });
  }
};

// Public routes (with database middleware)
app.use('/api/public/users', requireDatabase, usersPublicRoutes);
app.use('/api/public/progress', requireDatabase, progressPublicRoutes);

// Authenticated routes (with database middleware)
app.use('/api/auth', authLimiter, requireDatabase, authRoutes);
app.use('/api/users', profileLimiter, requireDatabase, userRoutes);
app.use('/api/progress', requireDatabase, progressRoutes);

// Quests route - doesn't always need database (static data)
app.use('/api/quests', questRoutes);

// Simple test endpoint without database
app.get('/api/test', (req, res) => {
  res.json({
    status: 'OK',
    message: 'API is working',
    timestamp: new Date().toISOString(),
    platform: 'vercel',
    environment: process.env.NODE_ENV || 'development',
    mongoUriSet: !!process.env.MONGODB_URI,
    jwtSecretSet: !!process.env.JWT_SECRET
  });
});

// Enhanced health check endpoint for Vercel
app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      platform: 'vercel',
      database: dbStatus,
      region: process.env.VERCEL_REGION || 'unknown',
      mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT_SET'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message,
      platform: 'vercel',
      mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT_SET'
    });
  }
});

// Database connection test endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    console.log('Testing database connection...');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
    
    await connectToDatabase();
    
    // Try a simple database operation
    const User = require('../src/models/User');
    const userCount = await User.countDocuments();
    
    res.json({
      status: 'DB_CONNECTION_SUCCESS',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        readyState: mongoose.connection.readyState,
        name: mongoose.connection.name || 'unknown',
        host: mongoose.connection.host || 'unknown'
      },
      userCount: userCount,
      mongoUri: 'SET'
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({
      status: 'DB_CONNECTION_FAILED',
      timestamp: new Date().toISOString(),
      error: error.message,
      errorName: error.name,
      errorCode: error.code || 'NO_CODE',
      mongoUri: 'SET'
    });
  }
});

// Enhanced error handling for Vercel
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Vercel Error:`, err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.message });
  }
  
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(503).json({ error: 'Database temporarily unavailable' });
  }
  
  if (err.code === 'ECONNABORTED') {
    return res.status(408).json({ error: 'Request timeout' });
  }
  
  // Don't expose detailed errors in production
  res.status(500).json({ 
    error: isProduction ? 'Internal server error' : err.message,
    platform: 'vercel'
  });
});

// Handle 404s
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    platform: 'vercel'
  });
});

// Export as serverless function
module.exports = app;