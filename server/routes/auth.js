const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Send OTP
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;

    if (!email || !email.endsWith('@gmail.com')) {
        return res.status(400).json({ message: 'Only @gmail.com addresses are allowed.' });
    }

    try {
        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Find or Create User (Stub)
        let user = await User.findOne({ email });

        if (!user) {
            // Create user without password
            user = new User({
                email,
                username: email.split('@')[0],
                password: null, // Explicitly null
                isSetupComplete: false,
            });
        }

        user.otp = hashedOtp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        // Send Email
        const sent = await sendEmail(email, 'Your Login Code', `Your login code is: ${otp}\nValid for 10 minutes.`);

        if (sent) {
            res.json({ message: 'OTP sent successfully' });
        } else {
            res.status(500).json({ message: 'Failed to send email' });
        }

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        if (!user.otp || !user.otpExpires || Date.now() > user.otpExpires) {
            return res.status(400).json({ message: 'OTP expired or invalid' });
        }

        const isMatch = await bcrypt.compare(otp, user.otp);
        if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });

        // Clear OTP
        user.otp = null;
        user.otpExpires = null;
        await user.save();

        // Login successful
        const token = jwt.sign({ userId: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            userId: user._id,
            username: user.username,
            email: user.email,
            isNewUser: !user.isSetupComplete
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
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
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
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
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        // If user has no password (OTP only account)
        if (!user.password) {
            return res.status(400).json({ message: 'Please use OTP Login for this account.' });
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

// Update Username (Complete Setup)
router.put('/update-username', verifyToken, async (req, res) => {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Username is required' });

    try {
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ message: 'Username already taken' });

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.username = username;
        user.isSetupComplete = true;
        await user.save();

        res.json({ message: 'Username updated', username });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

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
