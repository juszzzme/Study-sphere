const mongoose = require('mongoose');
const CalendarEvent = require('../models/CalendarEvent');
const ChatMessage = require('../models/ChatMessage');
const Message = require('../models/Message');
const PomodoroSession = require('../models/PomodoroSession');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/studysphere', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Sample users (we'll create these first and use their IDs for other data)
const sampleUsers = [
    {
        name: 'Zaheer Khan',
        username: 'zaheer',
        email: 'zaheer@example.com',
        password: 'password123'
    },
    {
        name: 'Ganesh Kumar',
        username: 'ganesh',
        email: 'ganesh@example.com',
        password: 'password123'
    },
    {
        name: 'Charan Reddy',
        username: 'charan',
        email: 'charan@example.com',
        password: 'password123'
    }
];

async function insertSampleData() {
    try {
        // First, create users and get their IDs
        const users = {};
        for (const userData of sampleUsers) {
            const user = new User(userData);
            await user.save();
            users[userData.username] = user._id;
        }
        console.log('Created users');

        // Sample calendar events
        const calendarEvents = [
            {
                title: 'Math Study Session',
                date: new Date(2024, 2, 15),
                notes: 'Group study for calculus exam',
                completed: false,
                reminder: true,
                color: '#4285F4',
                user: users['zaheer']
            },
            {
                title: 'Physics Lab',
                date: new Date(2024, 2, 16),
                notes: 'Complete lab report',
                completed: false,
                reminder: true,
                color: '#EA4335',
                user: users['ganesh']
            },
            {
                title: 'Group Project Meeting',
                date: new Date(2024, 2, 17),
                notes: 'Discuss project progress',
                completed: false,
                reminder: true,
                color: '#34A853',
                user: users['charan']
            }
        ];

        // Sample chat messages
        const chatMessages = [
            {
                sender: users['zaheer'],
                content: 'Hey everyone, when are we meeting for the group project?',
                roomId: 'global',
                createdAt: new Date(2024, 2, 15, 10, 0)
            },
            {
                sender: users['ganesh'],
                content: 'How about tomorrow at 2 PM?',
                roomId: 'global',
                createdAt: new Date(2024, 2, 15, 10, 5)
            },
            {
                sender: users['charan'],
                content: 'That works for me!',
                roomId: 'global',
                createdAt: new Date(2024, 2, 15, 10, 10)
            }
        ];

        // Sample messages
        const messages = [
            {
                roomId: 'general',
                userId: users['zaheer'],
                text: 'Hey, can you help me with the math homework?',
                timestamp: new Date(2024, 2, 15, 9, 0)
            },
            {
                roomId: 'general',
                userId: users['ganesh'],
                text: 'Sure, what problem are you stuck on?',
                timestamp: new Date(2024, 2, 15, 9, 5)
            },
            {
                roomId: 'general',
                userId: users['charan'],
                text: 'Do you have the notes from yesterday\'s class?',
                timestamp: new Date(2024, 2, 15, 9, 10)
            }
        ];

        // Sample pomodoro sessions
        const pomodoroSessions = [
            {
                userId: users['zaheer'],
                duration: 25,
                completed: true,
                startTime: new Date(2024, 2, 15, 9, 0),
                endTime: new Date(2024, 2, 15, 9, 30),
                notes: 'Math study session'
            },
            {
                userId: users['ganesh'],
                duration: 30,
                completed: true,
                startTime: new Date(2024, 2, 15, 10, 0),
                endTime: new Date(2024, 2, 15, 10, 40),
                notes: 'Physics preparation'
            },
            {
                userId: users['charan'],
                duration: 25,
                completed: true,
                startTime: new Date(2024, 2, 15, 11, 0),
                endTime: new Date(2024, 2, 15, 11, 30),
                notes: 'Chemistry revision'
            }
        ];

        // Insert all sample data
        await CalendarEvent.insertMany(calendarEvents);
        console.log('Inserted calendar events');

        await ChatMessage.insertMany(chatMessages);
        console.log('Inserted chat messages');

        await Message.insertMany(messages);
        console.log('Inserted direct messages');

        await PomodoroSession.insertMany(pomodoroSessions);
        console.log('Inserted pomodoro sessions');

        console.log('All sample data inserted successfully');
    } catch (error) {
        console.error('Error inserting sample data:', error);
    } finally {
        await mongoose.disconnect();
    }
}

insertSampleData(); 