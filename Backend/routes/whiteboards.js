const express = require('express');
const router = express.Router();
const Whiteboard = require('../models/Whiteboard');
const auth = require('../middleware/auth');

// Get all whiteboards for the current user
router.get('/', auth, async (req, res) => {
  try {
    const whiteboards = await Whiteboard.find({ user: req.user.id })
      .sort({ lastModified: -1 });
    res.json(whiteboards);
  } catch (error) {
    console.error('Error fetching whiteboards:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single whiteboard by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const whiteboard = await Whiteboard.findOne({ 
      _id: req.params.id,
      user: req.user.id 
    });
    
    if (!whiteboard) {
      return res.status(404).json({ message: 'Whiteboard not found' });
    }
    
    res.json(whiteboard);
  } catch (error) {
    console.error('Error fetching whiteboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new whiteboard
router.post('/', auth, async (req, res) => {
  try {
    const { name, content } = req.body;
    
    const newWhiteboard = new Whiteboard({
      name,
      content,
      user: req.user.id,
      lastModified: new Date()
    });
    
    const whiteboard = await newWhiteboard.save();
    res.json(whiteboard);
  } catch (error) {
    console.error('Error creating whiteboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a whiteboard
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, content } = req.body;
    
    // Find whiteboard and check if user owns it
    let whiteboard = await Whiteboard.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!whiteboard) {
      return res.status(404).json({ message: 'Whiteboard not found' });
    }
    
    // Update whiteboard
    whiteboard.name = name || whiteboard.name;
    whiteboard.content = content || whiteboard.content;
    whiteboard.lastModified = new Date();
    
    await whiteboard.save();
    res.json(whiteboard);
  } catch (error) {
    console.error('Error updating whiteboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a whiteboard
router.delete('/:id', auth, async (req, res) => {
  try {
    const whiteboard = await Whiteboard.findOne({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!whiteboard) {
      return res.status(404).json({ message: 'Whiteboard not found' });
    }
    
    await whiteboard.remove();
    res.json({ message: 'Whiteboard deleted' });
  } catch (error) {
    console.error('Error deleting whiteboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 