const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        trim: true
    },
    tags: {
        type: [String],
        default: []
    },
    type: {
        type: String,
        required: true,
        enum: ['notes', 'papers'],
        default: 'notes'
    },
    semester: {
        type: Number,
        required: true,
        min: 1,
        max: 8
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Changed from true to false to make it optional
    },
    downloads: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
resourceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create text index for search functionality
resourceSchema.index({
    title: 'text',
    description: 'text',
    subject: 'text',
    tags: 'text'
});

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
