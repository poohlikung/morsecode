const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Fail fast if critical secrets are missing instead of signing tokens with `undefined`
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set.');
    process.exit(1);
}

// Run database migrations before starting server
try {
  console.log('Running database migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('Migrations completed successfully');
} catch (error) {
  console.log('Migration failed or already applied:', error.message);
}

// Create Express app first
const app = express();

// Trust Railway/Vercel's reverse proxy so req.ip and rate limiting see the real client IP
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Restrict cross-origin requests to known client origins
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser requests (curl, server-to-server, health checks) with no Origin header
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    }
}));

app.use(express.json({ limit: '100kb' }));

// General rate limit across the API to blunt scraping/DoS attempts
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', apiLimiter);

// Tighter limit on auth endpoints; complements the per-username lockout in routes/auth.js
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/auth', authLimiter);

// Setup database
let pool = null;
let prisma;

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgresql')) {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
} else {
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    const adapter = new PrismaBetterSqlite3({ url: 'file:./dev.db' });
    prisma = new PrismaClient({ adapter });
    console.log('📝 SQLite Mode: Initialized database locally at dev.db');
}

// Make prisma available in routes
app.use((req, res, next) => {
    req.prisma = prisma;
    next();
});

// Health check - simple route first
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Morse Code API is running!' });
});

// Auth routes
const authRoutes = require('./routes/auth.js');
app.use('/api/auth', authRoutes);

// Settings routes
const settingsRoutes = require('./routes/settings.js');
app.use('/api/settings', settingsRoutes);

// Lookup table routes
const modesRoutes = require('./routes/modes.js');
app.use('/api/modes', modesRoutes);

const symbolsRoutes = require('./routes/symbols.js');
app.use('/api/symbols', symbolsRoutes);

const difficultiesRoutes = require('./routes/difficulties.js');
app.use('/api/difficulties', difficultiesRoutes);

// Content routes
const contentsRoutes = require('./routes/contents.js');
app.use('/api/contents', contentsRoutes);

// Game data routes
const playSessionsRoutes = require('./routes/play-sessions.js');
app.use('/api/play-sessions', playSessionsRoutes);

// Statistics routes
const userModeStatusRoutes = require('./routes/user-mode-status.js');
app.use('/api/user-mode-status', userModeStatusRoutes);

// Leaderboard routes
const leaderboardRoutes = require('./routes/leaderboard.js');
app.use('/api/leaderboard', leaderboardRoutes);

// Admin routes
const adminRoutes = require('./routes/admin.js');
app.use('/api/admin', adminRoutes);

// Central error handler - never leak stack traces to clients
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'Origin not allowed' });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server synchronously
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Explicitly prevent server from closing
server.on('close', () => {
    console.log('Server closing...');
});

// Handle errors
server.on('error', (err) => {
    console.error('Server error:', err);
});

// Test database connection asynchronously after server starts
if (pool) {
    pool.query('SELECT NOW()').then(result => {
        console.log('✅ Database connected:', result.rows[0].now);
    }).catch(err => {
        console.error('❌ Database connection error:', err.message);
    });
} else {
    console.log('✅ Local SQLite database connection initialized successfully.');
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    server.close();
    await prisma.$disconnect();
    if (pool) await pool.end();
    process.exit(0);
});
