const express = require('express');
const router = express.Router();
const Opinion = require('../models/Opinion');
const Comment = require('../models/Comment');
const Topic = require('../models/Topic');
const jwt = require('jsonwebtoken');

// Middleware to verify token
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

// Helper: Get user's vote status
const getUserVote = (opinion, userId) => {
    if (opinion.likedBy.includes(userId)) return 'helpful';
    if (opinion.dislikedBy.includes(userId)) return 'notHelpful';
    return null;
};

// GET Options (Public Feed)
router.get('/', async (req, res) => {
    const { topic, sort } = req.query;
    const filter = topic ? { topic } : {};
    let sortOption = { views: -1 };

    if (sort === 'latest') {
        sortOption = { createdAt: -1 };
    }

    /* 
       Ideally we want to show 'User Vote' status.
       Since we moved to proper auth, we can trust the token header if present.
    */
    let userId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            userId = decoded.userId;
        } catch (e) { }
    }

    try {
        const opinions = await Opinion.find(filter)
            .sort(sortOption)
            .limit(50)
            .populate('userId', 'username')
            .populate('commentsCount');

        const opinionsWithVote = opinions.map(op => {
            const opObj = op.toObject();
            if (userId) {
                opObj.userVote = getUserVote(op, userId);
            }
            delete opObj.likedBy;
            delete opObj.dislikedBy;
            return opObj;
        });

        res.json(opinionsWithVote);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET Current User's Opinions
router.get('/mine', verifyToken, async (req, res) => {
    try {
        const opinions = await Opinion.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .populate('userId', 'username')
            .populate('commentsCount');
        res.json(opinions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST Opinion
router.post('/', verifyToken, async (req, res) => {
    const { content, topic, isAnonymous } = req.body;
    const userId = req.user.userId;
    // We still capture IP for auditing, but limit is primarily UserID based now.
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Check Limit by UserID
    const countById = await Opinion.countDocuments({ userId, createdAt: { $gte: startOfDay } });
    if (countById >= 4) {
        return res.status(429).json({ message: 'Daily limit reached (4 opinions/day)' });
    }

    const opinion = new Opinion({
        content,
        topic: topic.trim().toLowerCase(),
        userId,
        ip: userIp,
        isAnonymous: !!isAnonymous
    });

    try {
        // Auto-create Topic if it doesn't exist
        const normalizedTopic = topic.trim().toLowerCase();
        const existingTopic = await Topic.findOne({ name: normalizedTopic });
        if (!existingTopic) {
            await new Topic({ name: normalizedTopic, description: 'User generated' }).save();
        }

        const newOpinion = await opinion.save();
        await newOpinion.populate('userId', 'username');
        res.status(201).json(newOpinion);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH View
router.patch('/:id/view', async (req, res) => {
    try {
        await Opinion.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.status(200).send();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH Toggle Anonymity (Owner Only)
router.patch('/:id/toggle-anonymity', verifyToken, async (req, res) => {
    try {
        const opinion = await Opinion.findById(req.params.id);
        if (!opinion) return res.status(404).json({ message: 'Opinion not found' });

        if (opinion.userId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        opinion.isAnonymous = !opinion.isAnonymous;
        await opinion.save();

        // Populate and return
        await opinion.populate('userId', 'username');
        await opinion.populate('commentsCount');

        // Re-construct with user vote
        const opObj = opinion.toObject();
        opObj.userVote = getUserVote(opinion, req.user.userId);
        delete opObj.likedBy;
        delete opObj.dislikedBy;

        res.json(opObj);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH Vote
router.patch('/:id/vote', verifyToken, async (req, res) => {
    const { type } = req.body;
    const userId = req.user.userId;

    if (!['helpful', 'notHelpful'].includes(type)) return res.status(400).json({ message: 'Invalid vote type' });

    try {
        const opinion = await Opinion.findById(req.params.id);
        if (!opinion) return res.status(404).json({ message: 'Opinion not found' });

        let update = {};
        const isHelpful = opinion.likedBy.includes(userId);
        const isNotHelpful = opinion.dislikedBy.includes(userId);

        if (type === 'helpful') {
            if (isHelpful) {
                update = { $inc: { helpful: -1 }, $pull: { likedBy: userId } };
            } else if (isNotHelpful) {
                update = { $inc: { helpful: 1, notHelpful: -1 }, $pull: { dislikedBy: userId }, $addToSet: { likedBy: userId } };
            } else {
                update = { $inc: { helpful: 1 }, $addToSet: { likedBy: userId } };
            }
        } else if (type === 'notHelpful') {
            if (isNotHelpful) {
                update = { $inc: { notHelpful: -1 }, $pull: { dislikedBy: userId } };
            } else if (isHelpful) {
                update = { $inc: { notHelpful: 1, helpful: -1 }, $pull: { likedBy: userId }, $addToSet: { dislikedBy: userId } };
            } else {
                update = { $inc: { notHelpful: 1 }, $addToSet: { dislikedBy: userId } };
            }
        }

        const updatedOpinion = await Opinion.findByIdAndUpdate(req.params.id, update, { new: true });

        const opObj = updatedOpinion.toObject();
        opObj.userVote = getUserVote(updatedOpinion, userId);
        delete opObj.likedBy;
        delete opObj.dislikedBy;

        res.json(opObj);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE Opinion
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const opinion = await Opinion.findById(req.params.id).populate('userId', 'username');
        if (!opinion) return res.status(404).json({ message: 'Opinion not found' });

        // Fetch the user requesting the delete to verify admin status
        const requestor = await (require('../models/User')).findById(req.user.userId);
        const isAdmin = requestor && requestor.username === 'prem';

        // Check Permissions: Owner OR Admin (@prem)
        // Handle case where opinion.userId is null (if user was deleted)
        const isOwner = opinion.userId && opinion.userId._id.toString() === req.user.userId;

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'You are not authorized to delete this opinion' });
        }

        await Opinion.findByIdAndDelete(req.params.id);
        res.json({ message: 'Opinion deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET Comments for an Opinion
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ opinionId: req.params.id })
            .sort({ createdAt: 1 })
            .populate('userId', 'username');
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST Comment
router.post('/:id/comments', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content) return res.status(400).json({ message: 'Content required' });

        const comment = new Comment({
            content,
            opinionId: req.params.id,
            userId: req.user.userId
        });

        const savedComment = await comment.save();
        await savedComment.populate('userId', 'username');

        res.status(201).json(savedComment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE Comment (Admin/Owner)
router.delete('/:id/comments/:commentId', verifyToken, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        const isOwner = comment.userId.toString() === req.user.userId;
        const isAdmin = req.user.username === 'prem';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await Comment.findByIdAndDelete(req.params.commentId);
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
