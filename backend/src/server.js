import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import sequelize from './models/index.js';
import { fileURLToPath } from 'url';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import path from 'path';
import fs from 'fs';

// Import routes
import authRoutes from './routes/authRoutes.js';
import planRoutes from './routes/planRoutes.js';
import depositRoutes from './routes/depositRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import withdrawalRoutes from './routes/withdrawalRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import invitationRoutes from './routes/invitationRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import invitationLinkRoutes from './routes/invitationLinkRoutes.js';
import { applySchemaPatches } from './utils/schemaPatches.js';

// Import models to sync
import './models/Associations.js';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env'), override: false });

const app = express();
const PORT = process.env.PORT || 5000;

// Define upload directories
const uploadsDir = path.join(__dirname, '..', 'uploads');
const profileUploadsDir = path.join(uploadsDir, 'profile');

// Create upload directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Uploads directory: ${uploadsDir}`);
}

if (!fs.existsSync(profileUploadsDir)) {
  fs.mkdirSync(profileUploadsDir, { recursive: true });
      console.log(`Uploads directory: ${uploadsDir}`);
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
  'http://localhost:3024',
  'http://localhost:5173',
  process.env.APP_URL,
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS blocked origin: ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, path) => {
    if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png') || path.endsWith('.gif') || path.endsWith('.webp')) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache images for 1 day
    }
  }
}));

// Add request logging in development
if (process.env.NODE_ENV === 'development') {
  import('morgan').then(morgan => {
    app.use(morgan.default('dev'));
  }).catch(() => {
    console.log('Morgan not available for logging');
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SaveWise API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uploadsPath: uploadsDir,
    profileUploadsPath: profileUploadsDir
  });
});

// Debug endpoint for uploads
app.get('/api/debug/uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const profileFiles = fs.readdirSync(profileUploadsDir);
    
    res.json({
      uploadsDirectory: uploadsDir,
      profileDirectory: profileUploadsDir,
      uploadsExists: fs.existsSync(uploadsDir),
      profileExists: fs.existsSync(profileUploadsDir),
      uploadsFiles: files,
      profileFiles: profileFiles,
      count: {
        uploads: files.length,
        profile: profileFiles.length
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      uploadsDir,
      profileUploadsDir,
      exists: {
        uploads: fs.existsSync(uploadsDir),
        profile: fs.existsSync(profileUploadsDir)
      }
    });
  }
});


// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/invitation', invitationLinkRoutes);
app.use('/api', contactRoutes);


// 404 handler
app.use('/api/*', (req, res) => {
  console.log('404 Not Found:', req.method, req.originalUrl);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Test static file serving
app.get('/api/test-image/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(profileUploadsDir, filename);
  
  if (fs.existsSync(imagePath)) {
    res.sendFile(imagePath);
  } else {
    res.status(404).json({
      success: false,
      message: 'Image not found',
      path: imagePath,
      exists: fs.existsSync(imagePath)
    });
  }
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    await applySchemaPatches(sequelize);
    
    // Sync models (use { alter: true } in development, { force: false } in production)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Syncing database models (development mode)...');
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synced');
    } else {
      console.log('🔧 Syncing database models (production mode)...');
      await sequelize.sync();
      console.log('✅ Database models synced');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API available at ${process.env.API_URL || `http://localhost:${PORT}`}/api`);
      console.log(`Health check: ${process.env.API_URL || `http://localhost:${PORT}`}/api/health`);
      console.log(`Uploads directory: ${uploadsDir}`);
      console.log(`Profile uploads: ${profileUploadsDir}`);
      console.log('CORS allowed origins: ' + allowedOrigins.join(', '));
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('  POST /api/plans/:id/invite-external');
      console.log('  GET /api/plans/:id');
      console.log('  GET  /api/plans/:id/pending-invitations');
      console.log('  GET  /api/invitation/:token');
       console.log('  POST /api/invitation/:token/accept');
    });
  } catch (error) {
    console.error('❌ Unable to connect to database:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

const printRoutes = (router, prefix = '') => {
  router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the router
      const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      console.log(`${methods} ${prefix}${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Sub-router
      const subPrefix = prefix + (middleware.regexp.source === '^\\/?(?=\\/|$)' ? '' : middleware.regexp.source.replace(/\\\//g, '/').replace(/^\/\^/, '').replace(/\$\//, ''));
      printRoutes(middleware.handle, subPrefix);
    }
  });
};

// After all app.use() calls
console.log('\n=== REGISTERED ROUTES ===');
printRoutes(app._router);
console.log('=========================\n');


// Start the server
startServer();

