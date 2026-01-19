const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const seed = async () => {
    // Connect
    const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/java_assessment_platform';
    await mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    // Clear Users
    await User.deleteMany({});

    // Create Admin
    const adminPass = await bcrypt.hash('admin123', 10);
    const admin = new User({
        name: 'System Admin',
        email: 'admin@example.com',
        password: adminPass,
        role: 'admin'
    });
    await admin.save();
    console.log('Admin created: admin@example.com / admin123');

    // Create Trainee
    const userPass = await bcrypt.hash('user123', 10);
    const trainee = new User({
        name: 'John Trainee',
        email: 'user@example.com',
        password: userPass,
        role: 'trainee'
    });
    await trainee.save();
    console.log('Trainee created: user@example.com / user123');

    process.exit();
};

seed();
