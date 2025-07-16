const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
const PomodoroSession = require('../models/PomodoroSession'); // Imported from model
const { updateStreak } = require('../utils/gamification'); // Reusable streak logic

// POST /api/pomodoro/start (Start a session)
router.post('/start', auth, async (req, res) => {
    const { duration } = req.body;

    // Input validation
    if (!duration || duration <= 0) {
        return res.status(400).json({ error: 'Duration must be a positive number' });
    }

    try {
        const newSession = new PomodoroSession({
            userId: req.user.id,
            duration: duration // Mongoose handles startTime default
        });

        const session = await newSession.save();
        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/pomodoro/complete/:id (Complete a session)
router.put('/complete/:id', auth, async (req, res) => {
    const { notes } = req.body;

    try {
        const session = await PomodoroSession.findById(req.params.id);
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        if (session.userId.toString() !== req.user.id) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        // Update session
        session.endTime = Date.now();
        session.completed = true;
        session.notes = notes || session.notes;
        await session.save();

        // Update user's study hours
        const user = await User.findById(req.user.id);
        user.studyHours += session.duration / 60; // Convert minutes to hours
        await user.save();

        // Update streak via utility function
        await updateStreak(user);

        res.json(session);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/pomodoro (Get user's sessions)
router.get('/', auth, async (req, res) => {
    try {
        const sessions = await PomodoroSession.find({ userId: req.user.id })
            .sort({ startTime: -1 });
        res.json(sessions);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/pomodoro/stats (Get study stats)
router.get('/stats', auth, async (req, res) => {
    try {
        const totalSessions = await PomodoroSession.countDocuments({ 
            userId: req.user.id,
            completed: true 
        });

        const totalStudyMinutes = await PomodoroSession.aggregate([
            { $match: { userId: req.user.id, completed: true } },
            { $group: { _id: null, total: { $sum: "$duration" } } }
        ]);

        const weeklyStudyMinutes = await PomodoroSession.aggregate([
            { 
                $match: { 
                    userId: req.user.id, 
                    completed: true,
                    startTime: { $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
                }
            },
            { $group: { _id: null, total: { $sum: "$duration" } } }
        ]);

        res.json({
            totalSessions,
            totalStudyHours: (totalStudyMinutes[0]?.total || 0) / 60,
            weeklyStudyHours: (weeklyStudyMinutes[0]?.total || 0) / 60
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;