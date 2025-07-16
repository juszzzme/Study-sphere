const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/study_sphere');
        console.log('MongoDB connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message); // Better error message
        process.exit(1); // Exit with failure
    }
};

module.exports = connectDB;