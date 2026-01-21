const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
    code: { type: String, required: true },
    passedTestCases: { type: Number, default: 0 },
    totalTestCases: { type: Number, default: 0 },
    isCompiled: { type: Boolean, default: false },
    compileOutput: { type: String, default: '' },
    manualScore: { type: Number, default: 0 }
});

const SubmissionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
    status: { type: String, enum: ['IN_PROGRESS', 'SUBMITTED'], default: 'IN_PROGRESS' },
    answers: [AnswerSchema], // Collected answers
    totalManualScore: { type: Number, default: 0 },
    totalMaxScore: { type: Number, default: 0 },
    finalScore: { type: Number, default: 0 }, // Percent
    violationCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date }
});

module.exports = mongoose.model('Submission', SubmissionSchema);
