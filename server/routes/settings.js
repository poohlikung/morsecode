const express = require('express');
const { authenticateToken } = require('./auth.js');

const router = express.Router();

const VALID_THEMES = [
    'dark',
    'theme-light',
    'theme-cyberpunk',
    'theme-ocean',
    'theme-forest',
    'theme-sunset',
    'theme-amber',
    'theme-contrast'
];

// All routes require authentication
router.use(authenticateToken);

// GET /api/settings - Get settings for current user
router.get('/', async (req, res) => {
    try {
        const settings = await req.prisma.settings.findUnique({
            where: { userId: req.user.id }
        });

        if (!settings) {
            // Create default settings if not exists
            const newSettings = await req.prisma.settings.create({
                data: { userId: req.user.id }
            });
            return res.json(newSettings);
        }

        res.json(settings);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/settings - Update settings for current user
router.put('/', async (req, res) => {
    try {
        const { theme, soundVolume, showHints } = req.body;

        if (theme !== undefined && !VALID_THEMES.includes(theme)) {
            return res.status(400).json({ error: 'Invalid theme value' });
        }

        if (soundVolume !== undefined && (typeof soundVolume !== 'number' || soundVolume < 0 || soundVolume > 100)) {
            return res.status(400).json({ error: 'soundVolume must be a number between 0 and 100' });
        }

        if (showHints !== undefined && typeof showHints !== 'boolean') {
            return res.status(400).json({ error: 'showHints must be a boolean' });
        }

        const updateData = {};
        if (theme !== undefined) updateData.theme = theme;
        if (soundVolume !== undefined) updateData.soundVolume = soundVolume;
        if (showHints !== undefined) updateData.showHints = showHints;

        const settings = await req.prisma.settings.upsert({
            where: { userId: req.user.id },
            update: updateData,
            create: {
                userId: req.user.id,
                ...updateData
            }
        });

        res.json(settings);
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
