const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Get user's gamification stats
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      studyHours: user.studyHours || 0,
      streaks: user.streaks || 0,
      badges: user.badges || [],
      lastStudyDate: user.lastStudyDate,
      level: user.level || 1,
      pomodoroSessions: user.pomodoroSessions || 0
    });
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

// PUT /api/gamification/study-hours (Update study hours)
router.put('/study-hours', auth, async (req, res) => {
    const { hours } = req.body;

    // Input validation
    if (typeof hours !== 'number' || hours <= 0) {
        return res.status(400).json({ error: 'Invalid hours value' });
    }

    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update study hours
        user.studyHours += hours;

        // Award hour-based badges
        const badges = ['100-hours', '500-hours', '1000-hours'];
        badges.forEach(badge => {
            const requiredHours = parseInt(badge.split('-')[0], 10);
            if (user.studyHours >= requiredHours && !user.badges.includes(badge)) {
                user.badges.push(badge);
            }
        });

        await user.save();

        res.json({
            studyHours: user.studyHours,
            streaks: user.streaks,
            badges: user.badges,
            lastStudyDate: user.lastStudyDate,
            level: user.level,
            pomodoroSessions: user.pomodoroSessions
        });
    } catch (err) {
        console.error('Error updating study hours:', err.message);
        res.status(500).json({ error: 'Error updating study hours' });
    }
});

// PUT /api/gamification/streak (Update streak)
router.put('/streak', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const today = new Date();
        const lastStudyDate = user.lastStudyDate ? new Date(user.lastStudyDate) : null;
        
        // Check if the last study date was yesterday
        if (lastStudyDate) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastStudyDate.toDateString() === yesterday.toDateString()) {
                user.streaks = (user.streaks || 0) + 1;
            } else if (lastStudyDate.toDateString() !== today.toDateString()) {
                user.streaks = 1; // Reset streak if more than one day has passed
            }
        } else {
            user.streaks = 1; // First time studying
        }

        user.lastStudyDate = today;
        await user.save();

        // Award streak-based badges
        const streakBadges = ['7-day-streak', '30-day-streak', '100-day-streak'];
        streakBadges.forEach(badge => {
            const requiredDays = parseInt(badge.split('-')[0], 10);
            if (user.streaks >= requiredDays && !user.badges.includes(badge)) {
                user.badges.push(badge);
            }
        });

        res.json({
            studyHours: user.studyHours,
            streaks: user.streaks,
            badges: user.badges,
            lastStudyDate: user.lastStudyDate,
            level: user.level,
            pomodoroSessions: user.pomodoroSessions
        });
    } catch (err) {
        console.error('Error updating streak:', err.message);
        res.status(500).json({ error: 'Error updating streak' });
    }
});

// GET /api/gamification (Get user's data)
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('-password')
            .populate('badges'); // Optional: If badges are stored as references
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            studyHours: user.studyHours,
            streaks: user.streaks,
            badges: user.badges,
            lastStudyDate: user.lastStudyDate,
            level: user.level,
            pomodoroSessions: user.pomodoroSessions || 0
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/gamification/reset (Reset user's progress)
router.post('/reset', auth, async (req, res) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Reset all gamification data
        user.studyHours = 0;
        user.streaks = 0;
        user.badges = [];
        user.lastStudyDate = null;
        user.level = 1;
        user.pomodoroSessions = 0;

        await user.save();

        res.json({ message: 'Progress reset successfully' });
    } catch (error) {
        console.error('Error resetting progress:', error);
        res.status(500).json({ message: 'Error resetting progress' });
    }
});

module.exports = router;