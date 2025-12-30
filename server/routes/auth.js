const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('702970470822-i41gqbsksutqktni6iu6pcs2oll3lh52.apps.googleusercontent.com');

// Google Login
router.post('/google', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: '702970470822-i41gqbsksutqktni6iu6pcs2oll3lh52.apps.googleusercontent.com',
        });
        const { email, name, picture } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (!user) {
            // Create new verified user
            // Password is a random long string since they use Google to login
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            user = new User({
                email,
                username: name.replace(/\s+/g, '_').toLowerCase() + Math.floor(Math.random() * 1000),
                password: hashedPassword,
                // isverified is implied by existence in this system for now, or we can add it later
            });
            await user.save();
        }

        const jwtToken = jwt.sign({ userId: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token: jwtToken, userId: user._id, username: user.username, email: user.email });

    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(400).json({ message: 'Google authentication failed' });
    }
});

// Register
router.post('/register', async (req, res) => {
    const { email, password, username } = req.body;

    // Strict Gmail Check
    if (!email || !email.endsWith('@gmail.com')) {
        return res.status(400).json({ message: 'Only @gmail.com addresses are allowed.' });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    try {
        // Check existing
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // NEW USER
        user = new User({
            email,
            password: hashedPassword,
            username: username || email.split('@')[0],
        });
        await user.save();

        // Generate Token
        const token = jwt.sign({ userId: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, userId: user._id, username: user.username, email: user.email });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        // Check if user exists AND has a password
        if (!user || !user.password) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ userId: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, userId: user._id, username: user.username, email: user.email });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get Me
router.get('/me', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// ADMIN: Get All Users
router.get('/users', verifyToken, async (req, res) => {
    try {
        const admin = await User.findById(req.userId);
        if (admin.username !== 'prem') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const users = await User.find().select('-password -otp -otpExpires').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ADMIN: Delete User
router.delete('/users/:id', verifyToken, async (req, res) => {
    try {
        const admin = await User.findById(req.userId);
        if (admin.username !== 'prem') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        // Prevent self-deletion
        if (req.params.id === admin._id.toString()) {
            return res.status(400).json({ message: 'You cannot delete yourself.' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
