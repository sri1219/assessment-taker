const mongoose = require('mongoose');

const AssessmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: false },
    problems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
    duration: { type: Number, default: 60 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assessment', AssessmentSchema);
