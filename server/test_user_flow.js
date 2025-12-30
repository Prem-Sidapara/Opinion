const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const testEmail = 'test_flow_user@gmail.com';

        // 1. CLEANUP
        await User.deleteMany({ email: testEmail });
        console.log('Cleaned up previous test users.');

        // 2. SIMULATE GOOGLE LOGIN (NEW USER)
        console.log('--- Step 1: Simulate Google Login (First Time) ---');
        let user = new User({
            email: testEmail,
            username: 'temp_user_123',
            password: 'hashed_random_password',
            isSetupComplete: false, // EXPLICITLY FALSE
        });
        await user.save();
        console.log(`User Created. ID: ${user._id}`);
        console.log(`isSetupComplete (Expect False): ${user.isSetupComplete}`);

        if (user.isSetupComplete === true) {
            console.error('CRITICAL FAIL: isSetupComplete is TRUE but should be FALSE!');
        }

        // 3. COMPLETE SETUP (Set Username)
        console.log('--- Step 2: Complete Setup ---');
        user.username = 'final_username_123';
        user.isSetupComplete = true;
        await user.save();
        console.log(`User Updated. isSetupComplete: ${user.isSetupComplete}`);

        // 4. DELETE USER
        console.log('--- Step 3: Delete User ---');
        await User.findByIdAndDelete(user._id);
        const checkUser = await User.findById(user._id);
        console.log(`User exists after delete? ${!!checkUser}`);

        // 5. SIMULATE GOOGLE LOGIN AGAIN (Re-create)
        console.log('--- Step 4: Simulate Google Login (After Delete) ---');
        let reCreatedUser = await User.findOne({ email: testEmail });

        if (!reCreatedUser) {
            console.log('User not found (Correct). Creating new...');
            reCreatedUser = new User({
                email: testEmail,
                username: 'temp_user_456',
                password: 'hashed_random_password_2',
                isSetupComplete: false, // EXPLICITLY FALSE AGAIN
            });
            await reCreatedUser.save();
            console.log(`Re-created User. ID: ${reCreatedUser._id}`);
            console.log(`isSetupComplete (Expect False): ${reCreatedUser.isSetupComplete}`);
            if (reCreatedUser.isSetupComplete === true) {
                console.error('CRITICAL FAIL: Re-created user default override failed!');
            }
        } else {
            console.error('CRITICAL FAIL: User was found but should have been deleted!');
        }

        console.log('Test Complete.');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

runTest();
