const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

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

// Middleware
app.use(cors());
app.use(express.json());

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
