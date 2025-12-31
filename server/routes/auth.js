const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('702970470822-i41gqbsksutqktni6iu6pcs2oll3lh52.apps.googleusercontent.com');

const escapeRegex = (text) => {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};

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

// Google Login
router.post('/google', async (req, res) => {
    const { token } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: '702970470822-i41gqbsksutqktni6iu6pcs2oll3lh52.apps.googleusercontent.com',
        });
        const { email, name, picture } = ticket.getPayload();
        console.log(`[Google Login] Attempt for: '${email}'`);

        // Case-insensitive lookup with escaped regex
        const emailRegex = new RegExp(`^${escapeRegex(email)}$`, 'i');
        let user = await User.findOne({ email: { $regex: emailRegex } });

        if (!user) {
            console.log(`[Google Login] User NOT found for regex: ${emailRegex}. Creating new user...`);
            // Create new user (Pending Setup)
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            user = new User({
                email,
                username: name.replace(/\s+/g, '_').toLowerCase() + Math.floor(Math.random() * 1000),
                password: hashedPassword,
                isSetupComplete: false, // User needs to choose username
            });
            // Ensure boolean
            if (user.isSetupComplete !== false) user.isSetupComplete = false;
            await user.save();
            console.log(`[Google Login] New User Created: ${user.email} (isSetupComplete: ${user.isSetupComplete})`);
        } else {
            console.log(`[Google Login] User FOUND: '${user.email}' (Username: ${user.username}, Setup Complete: ${user.isSetupComplete})`);
        }

        const jwtToken = jwt.sign({ userId: user._id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

        console.log(`[Google Login] Returning isNewUser: ${!user.isSetupComplete}`);

        // Return isNewUser if setup is not complete
        res.json({
            token: jwtToken,
            userId: user._id,
            username: user.username,
            email: user.email,
            isNewUser: !user.isSetupComplete
        });

    } catch (err) {
        console.error('Google Auth Error:', err);
        res.status(400).json({ message: 'Google authentication failed' });
    }
});

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

// Register
router.post('/register', async (req, res) => {
    const { password, username } = req.body;
    const email = req.body.email?.toLowerCase();

    // Strict Gmail Check
    if (!email || !email.endsWith('@gmail.com')) {
        return res.status(400).json({ message: 'Only @gmail.com addresses are allowed.' });
    }

    if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    try {
        // Check existing (case-insensitive)
        let user = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') } });

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
            isSetupComplete: true, // Manual registration is always complete
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
        const user = await User.findOne({ email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') } });

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
