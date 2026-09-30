const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/email', require('./routes/email'));

let reconnectTimer;

const connectDB = async () => {
  try {
    const dbSource = process.env.DB_SOURCE || 'local';
    let mongoURI = process.env.MONGODB_URI; // Fallback

    if (dbSource === 'cloud') {
      mongoURI = process.env.MONGODB_URI_CLOUD;
      console.log('🌐 Connecting to Cloud MongoDB Atlas...');
    } else {
      mongoURI = process.env.MONGODB_URI_LOCAL || 'mongodb://localhost:27017/mern_smtp';
      console.log('🏠 Connecting to Local MongoDB...');
    }

    if (!mongoURI) {
      throw new Error(`MongoDB URI not found for source: ${dbSource}`);
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`MongoDB connected successfully (${dbSource})`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Retrying connection in 5 seconds...');
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined;
      connectDB();
    }, 5000);
  }
};

connectDB();

mongoose.connection.on('disconnected', () => {
  console.error('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error.message);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
// Block all other routes
app.use('*', (req, res) => {
  res.status(403).json({
    success: false,
    message: 'Access Denied'
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully`);
  clearTimeout(reconnectTimer);
  server.close(async () => {
    await mongoose.connection.close(false);
    process.exit(0);
  });
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
