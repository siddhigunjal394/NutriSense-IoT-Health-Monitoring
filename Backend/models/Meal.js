const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:     { type: String, required: true },
  calories: { type: Number, default: 0 },
  protein:  { type: Number, default: 0 },
  carbs:    { type: Number, default: 0 },
  fat:      { type: Number, default: 0 },
  fiber:    { type: Number, default: 0 },
  sodium:   { type: Number, default: 0 },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'], default: 'snack' },
  source:   { type: String, default: 'manual' }, // 'manual' | 'photo_scan' | 'portion_scan'
  date:     { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Meal', MealSchema);