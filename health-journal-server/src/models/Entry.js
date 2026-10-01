const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    severity: { type: Number, min: 1, max: 5, default: 1 },
  },
  { _id: false }
);

const entrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Stored as UTC midnight of the entry's day
    date: { type: Date, required: true },
    mood: { type: Number, min: 1, max: 5 },
    symptoms: { type: [symptomSchema], default: [] },
    sleepHours: { type: Number, min: 0, max: 24 },
    waterGlasses: { type: Number, min: 0, max: 50 },
    exercise: {
      type: { type: String, trim: true, maxlength: 50 },
      minutes: { type: Number, min: 0, max: 600 },
    },
    notes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// One entry per user per day
entrySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Entry', entrySchema);
