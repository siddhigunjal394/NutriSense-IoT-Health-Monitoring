const mongoose = require("mongoose");

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
    type: Number   // upper value e.g. 120
  },
  bloodPressureDiastolic: {
    type: Number   // lower value e.g. 80
  },
  glucoseLevel: {
    type: Number   // mg/dL
  },
  oxygenLevel: {
    type: Number   // SpO2 %
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("HealthData", healthDataSchema);
