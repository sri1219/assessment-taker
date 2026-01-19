const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
// Fallback to local DB if no env var
// MongoDB Connection
const DB_URI = process.env.MONGODB_URI || 'mongodb+srv://srikanthkomma123_db_user:ePDCy4P6HiYA6SK4@assessment-taker-cluste.ncsjiar.mongodb.net/?appName=assessment-taker-cluster';

mongoose.connect(DB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Basic Route
app.get('/', (req, res) => {
    res.send('Java Assessment Platform API is running');
});

// Import Routes
// const authRoutes = require('./routes/auth');
const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessments');
const problemRoutes = require('./routes/problems');
const executeRoutes = require('./routes/execute');

const userRoutes = require('./routes/users');
const submissionRoutes = require('./routes/submissions');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/problems', problemRoutes); // Ensure this relies on Problem model
app.use('/api/submissions', submissionRoutes);
app.use('/api/execute', executeRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
