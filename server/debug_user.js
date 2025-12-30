const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'pprem1644@gmail.com'; // The user reported in previous error
        const user = await User.findOne({ email });

        if (user) {
            console.log('--- USER FOUND ---');
            console.log(`ID: ${user._id}`);
            console.log(`Email: ${user.email}`);
            console.log(`Username: ${user.username}`);
            console.log(`isSetupComplete: ${user.isSetupComplete}`);
        } else {
            console.log('--- USER NOT FOUND ---');
            console.log('The user strictly does not exist in the database.');
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUser();
