const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SwipeMasterCard = require('../models/SwipeMasterCard');
const SwipeMasterScore = require('../models/SwipeMasterScore');

// @route   GET /api/swipemaster/cards
// @desc    Get cards for the game
// @access  Public
router.get('/cards', async (req, res) => {
  try {
    const { category, difficulty, limit = 10 } = req.query;
    
    // Build query object
    const query = {};
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    
    // Get random cards
    const cards = await SwipeMasterCard.aggregate([
      { $match: query },
      { $sample: { size: parseInt(limit) } }
    ]);
    
    res.json(cards);
  } catch (error) {
    console.error('Error fetching swipemaster cards:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/swipemaster/cards
// @desc    Create a new card
// @access  Private
router.post('/cards', auth, async (req, res) => {
  try {
    const { statement, isCorrect, category, difficulty } = req.body;
    
    const newCard = new SwipeMasterCard({
      statement,
      isCorrect,
      category,
      difficulty,
      createdBy: req.user.id
    });
    
    const card = await newCard.save();
    res.json(card);
  } catch (error) {
    console.error('Error creating swipemaster card:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/swipemaster/scores
// @desc    Get user's score
// @access  Private
router.get('/scores', auth, async (req, res) => {
  try {
    let score = await SwipeMasterScore.findOne({ userId: req.user.id });
    
    if (!score) {
      // Create new score record if none exists
      score = new SwipeMasterScore({
        userId: req.user.id
      });
      await score.save();
    }
    
    res.json(score);
  } catch (error) {
    console.error('Error fetching swipemaster score:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/swipemaster/scores
// @desc    Update user's score
// @access  Private
router.put('/scores', auth, async (req, res) => {
  try {
    const { score } = req.body;
    
    let scoreRecord = await SwipeMasterScore.findOne({ userId: req.user.id });
    
    if (!scoreRecord) {
      // Create new score record if none exists
      scoreRecord = new SwipeMasterScore({
        userId: req.user.id,
        highScore: score,
        gamesPlayed: 1,
        lastPlayed: Date.now()
      });
    } else {
      // Update existing score record
      scoreRecord.gamesPlayed += 1;
      scoreRecord.lastPlayed = Date.now();
      
      // Update high score if current score is higher
      if (score > scoreRecord.highScore) {
        scoreRecord.highScore = score;
      }
    }
    
    await scoreRecord.save();
    res.json(scoreRecord);
  } catch (error) {
    console.error('Error updating swipemaster score:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/swipemaster/leaderboard
// @desc    Get leaderboard
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const leaderboard = await SwipeMasterScore.find()
      .sort({ highScore: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name');
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching swipemaster leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;