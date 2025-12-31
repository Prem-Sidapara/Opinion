const mongoose = require('mongoose');
require('dotenv').config();
const Opinion = require('./models/Opinion');

const clearOpinions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const result = await Opinion.deleteMany({});
        console.log(`Deleted ${result.deletedCount} opinions.`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

clearOpinions();
