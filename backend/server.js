const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { closeQueue } = require('./queue/emailQueue');

const app = express();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be configured with at least 32 characters');
  process.exit(1);
}

// Trust the single Nginx reverse proxy used in production.
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cookieParser());

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

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/email', require('./routes/email'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/drafts', require('./routes/drafts'));
app.use('/api/auth', require('./routes/auth'));

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
  if (err instanceof require('multer').MulterError || err.message === 'Unsupported attachment type') {
    return res.status(400).json({
      success: false,
      message: err.message === 'Unsupported attachment type'
        ? err.message
        : 'Attachment upload limits were exceeded'
    });
  }
  console.error('Unhandled request error:', err.message);
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
    await closeQueue();
    await mongoose.connection.close(false);
    process.exit(0);
  });
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
