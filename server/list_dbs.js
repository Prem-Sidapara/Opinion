const mongoose = require('mongoose');
require('dotenv').config();

const listDbs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const list = await admin.listDatabases();
        console.log('Available Databases:');
        list.databases.forEach(db => {
            console.log(`- ${db.name} \t(Size: ${db.sizeOnDisk} bytes)`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

listDbs();
