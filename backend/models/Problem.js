const mongoose = require('mongoose');

const TestCaseSchema = new mongoose.Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false }
});

const ProblemSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    language: { type: String, enum: ['java', 'javascript', 'typescript'], default: 'java' },
    starterCode: { type: String, default: 'public class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}' },
    testCases: { type: [TestCaseSchema], default: [] },
    totalMarks: { type: Number, default: 10 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Problem', ProblemSchema);
