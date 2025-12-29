const mongoose = require('mongoose');
require('dotenv').config();
const Opinion = require('./models/Opinion');
const User = require('./models/User');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const opinions = await Opinion.find().limit(5).populate('userId', 'username');
        console.log('--- Opinions Check ---');
        opinions.forEach(op => {
            console.log(`ID: ${op._id}`);
            console.log(`Content: ${op.content}`);
            console.log(`UserId Raw: ${op.userId}`); // If populate worked, this is an object. If not, it's ID or null.
            console.log(`Username: ${op.userId?.username}`);
            console.log('----------------');
        });

        const users = await User.find();
        console.log('--- Users Check ---');
        users.forEach(u => {
            console.log(`ID: ${u._id}, Username: ${u.username}, Email: ${u.email}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
