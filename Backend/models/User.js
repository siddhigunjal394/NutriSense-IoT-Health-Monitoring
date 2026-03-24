const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  height: {
    type: Number  // in cm
  },
  weight: {
    type: Number  // in kg
  },
  bmi: {
    type: Number  // auto calculated
  },
  medicalCondition: {
    type: String,
    enum: ["none", "diabetes", "hypertension", "obesity"],
    default: "none"
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
