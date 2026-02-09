// Run this script to add the 'language' field to all existing problems in MongoDB
// Usage: node migrate_add_language.js

require('dotenv').config();
const mongoose = require('mongoose');
const Problem = require('./models/Problem');

async function migrate() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Update all problems that don't have a language field
        const result = await Problem.updateMany(
            { language: { $exists: false } },
            { $set: { language: 'java' } }
        );

        console.log(`✅ Migration complete!`);
        console.log(`Updated ${result.modifiedCount} problems with default language 'java'`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
