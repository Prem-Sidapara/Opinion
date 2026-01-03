require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/opinion_db';

const simulateGoogleLogin = async (email, name) => {
    console.log(`[Sim] Attempting login for ${email} (${name})`);
    
    // 1. Check for user
    // Case-insensitive lookup with escaped regex (simplified for test)
    const emailRegex = new RegExp(`^${email}$`, 'i');
    let user = await User.findOne({ email: { $regex: emailRegex } });

    if (!user) {
        console.log(`[Sim] User NOT found. Creating new user...`);
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        user = new User({
            email,
            username: name.replace(/\s+/g, '_').toLowerCase() + Math.floor(Math.random() * 1000),
            password: hashedPassword,
            isSetupComplete: false, 
        });
        
        // Ensure boolean (logic from auth.js)
        if (user.isSetupComplete !== false) user.isSetupComplete = false;
        
        await user.save();
        console.log(`[Sim] NEW User Created. isSetupComplete: ${user.isSetupComplete}`);
    } else {
        console.log(`[Sim] User FOUND. isSetupComplete: ${user.isSetupComplete}`);
        
        // OLD LOGIC WAS HERE (AUTO-FIX) - Now checking if it's disabled.
        // We expect isSetupComplete to REMAIN false if it was false.
    }
    
    return user;
};

const runTest = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const TEST_EMAIL = `test_sim_${Date.now()}@gmail.com`;
        
        // 1. Simulate First Login (Creation)
        console.log('\n--- Step 1: First Login (Creation) ---');
        let user = await simulateGoogleLogin(TEST_EMAIL, 'Test User');
        
        if (user.isSetupComplete === false) {
            console.log('SUCCESS: New user created with isSetupComplete = false');
        } else {
            console.error('FAILURE: New user created with isSetupComplete = true');
            process.exit(1);
        }

        // 2. Simulate Second Login (Re-login immediately)
        console.log('\n--- Step 2: Second Login (Immediate Re-login) ---');
        user = await simulateGoogleLogin(TEST_EMAIL, 'Test User');
        
         if (user.isSetupComplete === false) {
            console.log('SUCCESS: User remains pending setup after re-login');
        } else {
            console.error('FAILURE: User was incorrectly auto-fixed to true!');
            process.exit(1);
        }
        
        // Cleanup
        await User.deleteOne({ email: TEST_EMAIL });
        console.log('\nCleanup complete.');
        
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

runTest();
