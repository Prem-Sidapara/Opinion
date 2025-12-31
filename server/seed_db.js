const mongoose = require('mongoose');
require('dotenv').config();
const Opinion = require('./models/Opinion');
const Topic = require('./models/Topic');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Ensure Admin User
        let user = await User.findOne({ email: 'pprem1644@gmail.com' });
        if (!user) {
            console.log('Creating Admin User...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            user = new User({
                email: 'pprem1644@gmail.com',
                username: 'prem',
                password: hashedPassword,
                isSetupComplete: true
            });
            await user.save();
        }
        console.log(`Using User: ${user.username}`);

        // 2. Ensure Topics
        const topics = ['lifestyle', 'tech', 'career', 'relationships', 'politics', 'food', 'travel', 'music'];
        for (const t of topics) {
            const exists = await Topic.findOne({ name: t });
            if (!exists) {
                await new Topic({ name: t, description: 'Seeded topic' }).save();
            }
        }
        console.log('Topics ensured');

        // 3. Create Opinions
        const contents = [
            "Just realized that the best way to learn coding is to break things. And then cry. And then fix them.",
            "Remote work is not avoiding the office, it's avoiding the commute. Big difference.",
            "Pineapple on pizza is arguably the greatest culinary invention of the 20th century. Fight me.",
            "The concept of 'work-life balance' is a myth. It's all just life. Start treating it that way.",
            "AI won't replace you. A person using AI will replace you. Learn the tools.",
            "Why do we call it 'rush hour' when traffic moves the slowest?",
            "Traveling solo is the only way to truly find yourself. No distractions, just you and the world.",
            "Coffee should be considered a basic human right at this point.",
            "React hooks are great until you have a dependency array nightmare. Then they are pure evil.",
            "The 40-hour work week is outdated. Productivity > Hours clocked.",
            "Streaming services are slowly becoming cable TV again. We've come full circle.",
            "Reading a physical book will always beat reading on a Kindle. The smell of paper is unmatched.",
            "Gym culture has become more about filming sets than actually lifting weights.",
            "Tacos are the perfect food. change my mind.",
            "Music these days lacks soul. Bring back the 80s synths and 90s grunge.",
        ];

        // Clear existing opinions if any (though currently 0)
        // await Opinion.deleteMany({}); 

        for (const content of contents) {
            const randomTopic = topics[Math.floor(Math.random() * topics.length)];
            const isAnon = Math.random() > 0.7;

            await new Opinion({
                content,
                topic: randomTopic,
                userId: user._id,
                ip: '127.0.0.1', // Dummy IP
                isAnonymous: isAnon,
                views: Math.floor(Math.random() * 500),
                helpful: Math.floor(Math.random() * 50),
                notHelpful: Math.floor(Math.random() * 10)
            }).save();
        }

        console.log(`Seeded ${contents.length} opinions.`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

seed();
