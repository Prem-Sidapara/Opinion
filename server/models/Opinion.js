const mongoose = require('mongoose');

const OpinionSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        maxlength: 500,
    },
    topic: {
        type: String,
        required: true,
        enum: ['lifestyle', 'tech', 'career', 'relationships', 'politics'],
    },
    views: {
        type: Number,
        default: 0,
    },
    helpful: {
        type: Number,
        default: 0,
    },
    notHelpful: {
        type: Number,
        default: 0,
    },
    likedBy: {
        type: [String], // UserIDs
        default: [],
    },
    dislikedBy: {
        type: [String], // UserIDs
        default: [],
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    ip: {
        type: String, // Keeping for audit
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Opinion', OpinionSchema);
