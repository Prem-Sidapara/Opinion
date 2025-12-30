const mongoose = require('mongoose');
const Topic = require('./models/Topic');
const dotenv = require('dotenv');

dotenv.config();

const readTopics = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const topics = await Topic.find({});
        console.log('--- TOPICS IN DB ---');
        console.log(`Count: ${topics.length}`);
        topics.forEach(t => console.log(`- ${t.name} (${t._id})`));
        console.log('--------------------');

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

readTopics();
