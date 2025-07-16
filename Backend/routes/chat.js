const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const auth = require('../middleware/auth');

// Get chat messages for a specific room
router.get('/messages/:roomId', auth, async (req, res) => {
    try {
        const messages = await ChatMessage.find({ roomId: req.params.roomId })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('sender', 'name email')
            .exec();
        res.json(messages.reverse());
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ message: 'Error fetching chat messages' });
    }
});

// Send a new message
router.post('/messages', auth, async (req, res) => {
    try {
        const message = new ChatMessage({
            sender: req.user.id,
            content: req.body.content || req.body.text,
            roomId: req.body.roomId || 'global'
        });
        await message.save();
        
        const populatedMessage = await ChatMessage.findById(message._id)
            .populate('sender', 'name email')
            .exec();
            
        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Error sending message' });
    }
});

// Get all available chat rooms
router.get('/rooms', auth, async (req, res) => {
    try {
        // Return only the two required chat rooms
        res.json([
            {
                roomId: 'math',
                name: 'Maths',
                color: '#4CAF50',
                icon: '📐'
            },
            {
                roomId: 'design',
                name: 'Design Project',
                color: '#9C27B0',
                icon: '🎨'
            }
        ]);
    } catch (error) {
        console.error('Error fetching chat rooms:', error);
        res.status(500).json({ message: 'Error fetching chat rooms' });
    }
});

// Initialize chat rooms with test messages
router.get('/init-rooms', auth, async (req, res) => {
    try {
        // Create test messages for math room
        const mathMessages = [
            {
                sender: req.user.id,
                content: "Can someone explain the quadratic formula?",
                roomId: "math",
                createdAt: new Date(Date.now() - 3600000 * 5) // 5 hours ago
            },
            {
                sender: req.user.id,
                content: "It's x = (-b ± √(b² - 4ac)) / 2a where ax² + bx + c = 0",
                roomId: "math",
                createdAt: new Date(Date.now() - 3600000 * 4) // 4 hours ago
            },
            {
                sender: req.user.id,
                content: "Thanks! That makes sense now.",
                roomId: "math",
                createdAt: new Date(Date.now() - 3600000 * 3) // 3 hours ago
            }
        ];
        
        // Create test messages for design room
        const designMessages = [
            {
                sender: req.user.id,
                content: "Has anyone started on the wireframes yet?",
                roomId: "design",
                createdAt: new Date(Date.now() - 3600000 * 6) // 6 hours ago
            },
            {
                sender: req.user.id,
                content: "I've completed the homepage design. Will share it soon.",
                roomId: "design",
                createdAt: new Date(Date.now() - 3600000 * 5) // 5 hours ago
            },
            {
                sender: req.user.id,
                content: "Looking forward to seeing it! I'm working on the user profile page.",
                roomId: "design",
                createdAt: new Date(Date.now() - 3600000 * 4) // 4 hours ago
            }
        ];
        
        // Save all test messages
        await ChatMessage.insertMany([...mathMessages, ...designMessages]);
        
        res.status(200).json({ message: 'Chat rooms initialized with test messages' });
    } catch (error) {
        console.error('Error initializing chat rooms:', error);
        res.status(500).json({ message: 'Error initializing chat rooms' });
    }
});

module.exports = router;