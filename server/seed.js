require('dotenv').config();
const mongoose = require('mongoose');
const Topic = require('./models/Topic');

const topics = [
    { name: 'lifestyle', description: 'Wellness, fashion, food, and daily life.' },
    { name: 'tech', description: 'Gadgets, software, AI, and future tech.' },
    { name: 'career', description: 'Jobs, growth, workplace dynamics.' },
    { name: 'relationships', description: 'Dating, friends, family, and social life.' },
    { name: 'politics', description: 'Governance, policy, and society.' }
];

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB...');
        try {
            await Topic.deleteMany({}); // Clear existing
            await Topic.insertMany(topics);
            console.log('Topics seeded successfully!');
        } catch (error) {
            console.error('Seeding failed:', error);
        }
        process.exit();
    })
    .catch(err => {
        console.error('Connection error:', err);
        process.exit(1);
    });
