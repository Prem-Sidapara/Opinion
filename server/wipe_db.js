require('dotenv').config();
const mongoose = require('mongoose');
const Opinion = require('./models/Opinion');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB...');
        try {
            await Opinion.deleteMany({});
            await User.deleteMany({});
            console.log('Database wiped (Opinions & Users) for fresh start.');
        } catch (error) {
            console.error('Wipe failed:', error);
        }
        process.exit();
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
