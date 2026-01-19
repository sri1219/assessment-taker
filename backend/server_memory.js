const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// --- IN-MEMORY DATA STORE ---
const USERS = [
    { _id: 'admin-id', name: 'System Admin', email: 'admin@example.com', password: 'admin', role: 'admin' },
    { _id: 'user-id', name: 'John Trainee', email: 'user@example.com', password: 'user', role: 'trainee' }
];
const problems_seed = [
    {
        _id: 'problem-1',
        title: 'Sum of Two Numbers',
        description: 'Write a program that takes two integers as input and prints their sum.',
        starterCode: 'import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        int a = scanner.nextInt();\n        int b = scanner.nextInt();\n        System.out.println(a + b);\n    }\n}',
        testCases: [{ input: '2 3', expectedOutput: '5' }, { input: '10 20', expectedOutput: '30' }]
    }
];
const PROBLEMS = [...problems_seed];
const assessments_seed = [
    {
        _id: 'assessment-1',
        title: 'Java Basics Assessment',
        description: 'A predefined assessment to test your basic Java skills.',
        problems: [problems_seed[0]]
    }
];
const ASSESSMENTS = [...assessments_seed];
const SUBMISSIONS = [];

// --- AUTH ROUTES ---
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = USERS.find(u => u.email === email && u.password === password);
    if (!user) return res.status(400).json({ error: 'Invalid credentials (Mock: use admin@example.com / admin)' });
    res.json({ token: 'mock-jwt-token', user });
});

app.post('/api/auth/register', (req, res) => {
    const { name, email, password, role } = req.body;
    const newUser = { _id: uuidv4(), name, email, password, role };
    USERS.push(newUser);
    res.json({ message: 'User created', user: newUser });
});

// --- PROBLEM ROUTES ---
app.get('/api/problems', (req, res) => res.json(PROBLEMS));
app.post('/api/problems', (req, res) => {
    const problem = { _id: uuidv4(), ...req.body };
    PROBLEMS.push(problem);
    res.json(problem);
});

// --- ASSESSMENT ROUTES ---
app.get('/api/assessments', (req, res) => res.json(ASSESSMENTS));
app.post('/api/assessments', (req, res) => {
    // resolve problem IDs
    const resolvedProblems = req.body.problems.map(pid => PROBLEMS.find(p => p._id === pid)).filter(Boolean);
    const assessment = { _id: uuidv4(), ...req.body, problems: resolvedProblems };
    ASSESSMENTS.push(assessment);
    res.json(assessment);
});
app.get('/api/assessments/:id', (req, res) => {
    const assessment = ASSESSMENTS.find(a => a._id === req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Not Found' });
    res.json(assessment);
});
app.post('/api/assessments/:id/start', (req, res) => {
    const { userId } = req.body;
    let sub = SUBMISSIONS.find(s => s.user === userId && s.assessment === req.params.id);
    if (!sub) {
        sub = { _id: uuidv4(), user: userId, assessment: req.params.id, status: 'IN_PROGRESS' };
        SUBMISSIONS.push(sub);
    }
    if (sub.status === 'SUBMITTED') return res.status(403).json({ error: 'Assessment already submitted' });
    res.json(sub);
});
app.post('/api/assessments/:id/submit', (req, res) => {
    const { userId, answers, violationCount } = req.body;
    const sub = SUBMISSIONS.find(s => s.user === userId && s.assessment === req.params.id);
    if (!sub) return res.status(404).json({ error: 'No active submission' });

    sub.answers = answers;
    sub.violationCount = violationCount;
    sub.status = 'SUBMITTED';
    sub.finalScore = Math.floor(Math.random() * 100); // Mock score

    res.json(sub);
});

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// --- USER MANAGEMENT ROUTES ---
app.get('/api/users', (req, res) => {
    // Attach submission status to users
    const usersWithStatus = USERS.map(u => {
        const sub = SUBMISSIONS.find(s => s.user === u._id);
        return {
            ...u,
            status: sub ? sub.status : 'NOT_STARTED',
            score: sub ? sub.finalScore : null,
            submissionId: sub ? sub._id : null
        };
    });
    res.json(usersWithStatus);
});

// --- SUBMISSION ROUTES ---
app.get('/api/submissions', (req, res) => res.json(SUBMISSIONS));
// Reset specific submission
app.post('/api/submissions/:submissionId/delete', (req, res) => {
    const idx = SUBMISSIONS.findIndex(s => s._id === req.params.submissionId);
    if (idx !== -1) {
        SUBMISSIONS.splice(idx, 1);
        res.json({ message: 'Submission Reset' });
    } else {
        res.status(404).json({ error: 'No submission found' });
    }
});

// --- REAL EXECUTION ---
app.post('/api/execute/run', (req, res) => {
    const { code, input } = req.body;
    const fileName = `Solution_${uuidv4()}.java`;
    const filePath = path.join(__dirname, 'temp', fileName);

    if (!fs.existsSync(path.join(__dirname, 'temp'))) {
        fs.mkdirSync(path.join(__dirname, 'temp'));
    }

    // Wrap code in Solution class if not already? 
    // Assumption: User provides full class or we wrap. The starter code implies full class.
    // However, the filename must match class name "Solution". 
    // Java is strict. We must rename class to matched filename OR keep it simple.
    // Hack: We'll force the class name to be 'Solution' and run it as such in a isolated folder?
    // Easier: Write to 'Solution.java', compile, then rename/cleanup.
    // BUT concurrent users will conflict on 'Solution.java'.
    // Better: Use `Solution` class but in a unique temp folder per request.

    const runId = uuidv4();
    const tempDir = path.join(__dirname, 'temp', runId);
    fs.mkdirSync(tempDir, { recursive: true });

    const javaFile = path.join(tempDir, 'Solution.java');

    fs.writeFileSync(javaFile, code);

    // Compile and Run
    const compileCmd = `javac "${javaFile}"`;

    exec(compileCmd, (error, stdout, stderr) => {
        if (error) {
            // cleanup
            fs.rmSync(tempDir, { recursive: true, force: true });
            return res.json({ error: 'Compilation Error:\n' + stderr });
        }

        // Run
        // Note: input needed via stdin
        const runCmd = `java -cp "${tempDir}" Solution`;

        const child = exec(runCmd, { timeout: 5000 }, (err, sout, serr) => {
            fs.rmSync(tempDir, { recursive: true, force: true });
            if (err) {
                return res.json({ error: 'Runtime Error:\n' + serr });
            }
            res.json({ output: sout.trim() });
        });

        if (input) {
            child.stdin.write(input);
            child.stdin.end();
        }
    });
});

app.listen(PORT, () => {
    console.log(`MOCK Server (with Real Execution) running on http://localhost:${PORT}`);
    console.log(`Mock Admin: admin@example.com / admin`);
});
