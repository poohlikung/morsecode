const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        let { email, username, password } = req.body;

        // Validate input
        if (!email || !username || !password) {
            return res.status(400).json({ error: 'Email, username, and password are required' });
        }

        email = String(email).trim().toLowerCase();
        username = String(username).trim();

        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: 'Please provide a valid email address' });
        }

        if (!USERNAME_REGEX.test(username)) {
            return res.status(400).json({ error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores' });
        }

        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Check if user already exists
        const existingUser = await req.prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user with default settings
        const user = await req.prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                settings: {
                    create: {} // Creates with default values
                }
            },
            include: {
                settings: true
            }
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                totalPlay: user.totalPlay,
                rank: user.rank,
                avgWpm: user.avgWpm,
                avgAccuracy: user.avgAccuracy,
                createdAt: user.createdAt,
                settings: user.settings
            },
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const loginAttempts = new Map();

// Helper to check lockout status
const getLockoutTimeLeft = (username) => {
    const key = username.toLowerCase().trim();
    const record = loginAttempts.get(key);
    if (!record) return 0;
    
    const now = Date.now();
    if (record.lockUntil && record.lockUntil > now) {
        return Math.ceil((record.lockUntil - now) / 1000); // seconds left
    }
    
    // If lock expired, clean it up
    if (record.lockUntil && record.lockUntil <= now) {
        loginAttempts.delete(key);
    }
    return 0;
};

// Helper to record a failed attempt
const recordFailedAttempt = (username) => {
    const key = username.toLowerCase().trim();
    const record = loginAttempts.get(key) || { attempts: 0, lockUntil: null };
    record.attempts += 1;
    if (record.attempts >= 5) {
        record.lockUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
    }
    loginAttempts.set(key, record);
    return record;
};

// Helper to reset attempts upon successful login
const resetFailedAttempts = (username) => {
    const key = username.toLowerCase().trim();
    loginAttempts.delete(key);
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check lockout first
        const timeLeft = getLockoutTimeLeft(username);
        if (timeLeft > 0) {
            const minutesLeft = Math.ceil(timeLeft / 60);
            return res.status(429).json({ 
                error: `Too many failed attempts. Please wait ${minutesLeft} minute(s) before trying again.` 
            });
        }

        // Find user by username or email (reusing the 'username' variable from req.body)
        const user = await req.prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email: username } // User might have entered their email
                ]
            },
            include: { settings: true }
        });

        if (!user) {
            recordFailedAttempt(username);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            const record = recordFailedAttempt(username);
            if (record.attempts >= 5) {
                return res.status(429).json({ 
                    error: 'Too many failed attempts. Your account has been locked for 5 minutes.' 
                });
            }
            const attemptsLeft = 5 - record.attempts;
            return res.status(401).json({ 
                error: `Invalid username or password. You have ${attemptsLeft} attempts left.` 
            });
        }

        // Reset attempts on successful login
        resetFailedAttempts(username);

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                totalPlay: user.totalPlay,
                rank: user.rank,
                avgWpm: user.avgWpm,
                avgAccuracy: user.avgAccuracy,
                createdAt: user.createdAt,
                settings: user.settings
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await req.prisma.user.findUnique({
            where: { id: req.user.id },
            include: { settings: true }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            username: user.username,
            totalPlay: user.totalPlay,
            rank: user.rank,
            avgWpm: user.avgWpm,
            avgAccuracy: user.avgAccuracy,
            role: user.role,
            settings: user.settings,
            createdAt: user.createdAt
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
