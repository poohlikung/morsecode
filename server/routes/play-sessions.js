const express = require('express');
const { authenticateToken } = require('./auth.js');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/play-sessions - Get all play sessions for current user
router.get('/', async (req, res) => {
    try {
        const { modeId, difficultyId, symbolId, limit } = req.query;

        const where = { userId: req.user.id };
        if (modeId) where.modeId = parseInt(modeId);
        if (difficultyId) where.difficultyId = parseInt(difficultyId);
        if (symbolId) where.symbolId = parseInt(symbolId);

        const sessions = await req.prisma.playSession.findMany({
            where,
            include: {
                mode: true,
                difficulty: true,
                symbol: true
            },
            orderBy: { createdAt: 'desc' },
            take: limit ? parseInt(limit) : undefined
        });

        res.json(sessions);
    } catch (error) {
        console.error('Get play sessions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/play-sessions/weakness/global - Aggregates historical mistakes
router.get('/weakness/global', async (req, res) => {
    try {
        // Query SessionDetails where user made a mistake, across all of their sessions
        const mistakes = await req.prisma.sessionDetail.findMany({
            where: {
                session: {
                    userId: req.user.id
                },
                isCorrect: false
            },
            select: {
                question: true,
                correctAnswer: true
            }
        });

        if (mistakes.length === 0) {
            return res.json([]);
        }

        // Aggregate counts by character
        const charCounts = {};
        mistakes.forEach(m => {
            const char = m.correctAnswer || m.question;
            if (char) {
                charCounts[char] = (charCounts[char] || 0) + 1;
            }
        });

        // Convert to array and sort descending
        const sortedWeaknesses = Object.entries(charCounts)
            .map(([character, errorCount]) => ({ character, errorCount }))
            .sort((a, b) => b.errorCount - a.errorCount);

        // Return top 5 weaknesses
        res.json(sortedWeaknesses.slice(0, 5));
    } catch (error) {
        console.error('Global weakness error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/play-sessions/:id - Get a specific play session with details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const session = await req.prisma.playSession.findFirst({
            where: { id: parseInt(id), userId: req.user.id },
            include: {
                mode: true,
                difficulty: true,
                symbol: true,
                details: {
                    include: { symbol: true },
                    orderBy: { orderIndex: 'asc' }
                }
            }
        });

        if (!session) {
            return res.status(404).json({ error: 'Play session not found' });
        }

        res.json(session);
    } catch (error) {
        console.error('Get play session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/play-sessions - Save a new play session with details
router.post('/', async (req, res) => {
    try {
        const { modeId, difficultyId, symbolId, wpm, accuracy, mistakeCount, timeTaken, details } = req.body;

        // Validate input
        if (!modeId || !difficultyId || !symbolId || wpm === undefined || accuracy === undefined) {
            return res.status(400).json({ error: 'modeId, difficultyId, symbolId, wpm, and accuracy are required' });
        }

        // Create play session with details in a transaction
        const result = await req.prisma.$transaction(async (prisma) => {
            // 1. Create the play session
            const session = await prisma.playSession.create({
                data: {
                    userId: req.user.id,
                    modeId: parseInt(modeId),
                    difficultyId: parseInt(difficultyId),
                    symbolId: parseInt(symbolId),
                    wpm: parseFloat(wpm),
                    accuracy: parseFloat(accuracy),
                    mistakeCount: parseInt(mistakeCount) || 0,
                    timeTaken: parseInt(timeTaken) || 0,
                    // Create session details if provided
                    details: details && details.length > 0 ? {
                        create: details.map((detail, index) => ({
                            symbolId: parseInt(detail.symbolId),
                            question: detail.question,
                            userAnswer: detail.userAnswer,
                            correctAnswer: detail.correctAnswer,
                            isCorrect: detail.isCorrect,
                            responseTime: parseInt(detail.responseTime) || 0,
                            orderIndex: detail.orderIndex || index + 1
                        }))
                    } : undefined
                },
                include: {
                    mode: true,
                    difficulty: true,
                    symbol: true,
                    details: true
                }
            });

            // 2. Update or create UserModeStatus
            const existingStatus = await prisma.userModeStatus.findUnique({
                where: {
                    userId_modeId_difficultyId_symbolId: {
                        userId: req.user.id,
                        modeId: parseInt(modeId),
                        difficultyId: parseInt(difficultyId),
                        symbolId: parseInt(symbolId)
                    }
                }
            });

            if (existingStatus) {
                // Update existing stats
                await prisma.userModeStatus.update({
                    where: { id: existingStatus.id },
                    data: {
                        highWpm: Math.max(existingStatus.highWpm, parseFloat(wpm)),
                        highAccuracy: Math.max(existingStatus.highAccuracy, parseFloat(accuracy)),
                        totalScore: existingStatus.totalScore + parseFloat(accuracy),
                        mistakeCount: existingStatus.mistakeCount + (parseInt(mistakeCount) || 0),
                        time: existingStatus.time + (parseInt(timeTaken) || 0),
                        realTime: existingStatus.realTime + (parseInt(timeTaken) || 0)
                    }
                });
            } else {
                // Create new stats
                await prisma.userModeStatus.create({
                    data: {
                        userId: req.user.id,
                        modeId: parseInt(modeId),
                        difficultyId: parseInt(difficultyId),
                        symbolId: parseInt(symbolId),
                        highWpm: parseFloat(wpm),
                        highAccuracy: parseFloat(accuracy),
                        totalScore: parseFloat(accuracy),
                        mistakeCount: parseInt(mistakeCount) || 0,
                        time: parseInt(timeTaken) || 0,
                        realTime: parseInt(timeTaken) || 0
                    }
                });
            }

            // 3. Update User aggregate stats
            const allSessions = await prisma.playSession.findMany({
                where: { userId: req.user.id }
            });

            const totalPlay = allSessions.length;
            const avgWpm = allSessions.reduce((sum, s) => sum + s.wpm, 0) / totalPlay;
            const avgAccuracy = allSessions.reduce((sum, s) => sum + s.accuracy, 0) / totalPlay;

            await prisma.user.update({
                where: { id: req.user.id },
                data: {
                    totalPlay,
                    avgWpm: Math.round(avgWpm * 100) / 100,
                    avgAccuracy: Math.round(avgAccuracy * 100) / 100
                }
            });

            return session;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Save play session error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            requestBody: { modeId, difficultyId, symbolId, wpm, accuracy, mistakeCount, timeTaken, details: details?.length || 0 },
            userId: req.user?.id
        });
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/play-sessions/:id - Delete a specific play session
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const session = await req.prisma.playSession.findFirst({
            where: { id: parseInt(id), userId: req.user.id }
        });

        if (!session) {
            return res.status(404).json({ error: 'Play session not found' });
        }

        await req.prisma.playSession.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Play session deleted successfully' });
    } catch (error) {
        console.error('Delete play session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
