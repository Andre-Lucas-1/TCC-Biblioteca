const mongoose = require('mongoose');

const userGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['minutes', 'books'], required: true },
  period: { type: String, enum: ['day', 'week', 'month', 'year'], required: true },
  target: { type: Number, required: true, min: 1 },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('UserGoal', userGoalSchema);
