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
    isAnonymous: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for Comment Count
OpinionSchema.virtual('commentsCount', {
    ref: 'Comment',
    localField: '_id',
    foreignField: 'opinionId',
    count: true
});

module.exports = mongoose.model('Opinion', OpinionSchema);
