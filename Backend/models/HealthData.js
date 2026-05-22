const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
  description: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fats: Number,
  fiber: Number,
  healthScore: Number,        // 1-10 AI rated
  suggestion: String,         // AI tip for this meal
  healthierSwap: String,      // AI suggested healthier alternative
  loggedAt: {
    type: Date,
    default: Date.now
  }
});

const healthDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  heartRate: {
    type: Number,
    required: true
  },
  bloodPressureSystolic: {
    type: Number
  },
  bloodPressureDiastolic: {
    type: Number
  },
  glucoseLevel: {
    type: Number
  },
  oxygenLevel: {
    type: Number
  },
  stressScore: {
    type: Number       // 0-100, added for HRV feature
  },
  hrv: {
    type: Number       // ms, added for HRV feature
  },
  meals: [mealSchema], // ← meal logs embedded here
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("HealthData", healthDataSchema);
