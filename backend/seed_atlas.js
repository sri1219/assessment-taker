const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Problem = require('./models/Problem');
const Assessment = require('./models/Assessment');

// Atlas Connection
const DB_URI = 'mongodb+srv://srikanthkomma123_db_user:ePDCy4P6HiYA6SK4@assessment-taker-cluste.ncsjiar.mongodb.net/?appName=assessment-taker-cluster';

const seedDB = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to Atlas');

        // Clean
        await User.deleteMany({});
        await Problem.deleteMany({});
        await Assessment.deleteMany({});

        // Create Users
        const adminPass = await bcrypt.hash('admin', 10);
        const userPass = await bcrypt.hash('user', 10);

        await User.create([
            { name: 'System Admin', email: 'admin@example.com', password: adminPass, role: 'admin' },
            { name: 'John Trainee', email: 'user@example.com', password: userPass, role: 'trainee' }
        ]);

        // Create Problem
        const problem1 = await Problem.create({
            title: 'Sum of Two Numbers',
            description: 'Write a program that takes two integers as input and prints their sum.',
            starterCode: 'import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        int a = scanner.nextInt();\n        int b = scanner.nextInt();\n        System.out.println(a + b);\n    }\n}',
            testCases: [{ input: '2 3', expectedOutput: '5' }, { input: '10 20', expectedOutput: '30' }]
        });

        // Create Assessment
        await Assessment.create({
            title: 'Java Basics Assessment',
            description: 'A predefined assessment to test your basic Java skills.',
            problems: [problem1._id],
            isActive: true
        });

        console.log('Seed Complete!');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

seedDB();
