const express = require('express');
const router = express.Router();
const Topic = require('../models/Topic');
const Opinion = require('../models/Opinion');
const jwt = require('jsonwebtoken');

// Middleware
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).json({ message: 'No token provided' });
    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized' });
    }
};

// Check if user is Admin (@prem)
const isAdmin = (req, res, next) => {
    if (req.user && req.user.username === 'prem') {
        next();
    } else {
        res.status(403).json({ message: 'Admin access only' });
    }
};

// GET All Topics
router.get('/', async (req, res) => {
    try {
        const topics = await Topic.find().sort({ name: 1 });
        res.json(topics);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST Create Topic (Any Local User can add? Or just Admin? Request: "add a option to add tag category")
// Let's allow any logged in user for now, or restrict. 
// "I can only (@prem) can delete..." implies maybe others can add?
// I'll allow any authenticated user to create for engagement.
router.post('/', verifyToken, async (req, res) => {
    const { name, description } = req.body;
    try {
        // Normalize name: lowercase, trim
        const cleanName = name.trim().toLowerCase();

        const existing = await Topic.findOne({ name: cleanName });
        if (existing) return res.status(400).json({ message: 'Topic already exists' });

        const topic = new Topic({
            name: cleanName,
            description
        });
        const savedTopic = await topic.save();
        res.status(201).json(savedTopic);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE Topic (Admin @prem only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const topic = await Topic.findById(req.params.id);
        if (!topic) return res.status(404).json({ message: 'Topic not found' });

        // Delete the topic
        await Topic.findByIdAndDelete(req.params.id);

        // Optional: Delete opinions in this topic OR move them?
        // User said: "delete the tag categories and opinions under that"
        // So we delete opinions too.
        await Opinion.deleteMany({ topic: topic.name });

        res.json({ message: `Topic '${topic.name}' and related opinions deleted` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
