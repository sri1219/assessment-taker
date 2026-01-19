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
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/java_assessment_platform';

mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
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

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/execute', executeRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
