const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/study_sphere', {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            // Removed deprecated options: useNewUrlParser, useUnifiedTopology
            maxIdleTimeMS: 30000, // 30 seconds
            waitQueueTimeoutMS: 30000 // 30 seconds
        });
        
        // Add connection event handlers
        mongoose.connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });
        
        mongoose.connection.on('error', error => {
            console.error('MongoDB connection error:', error);
            process.exit(1);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnectFailed', () => {
            console.error('MongoDB reconnection failed');
            process.exit(1);
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = { connectDB };