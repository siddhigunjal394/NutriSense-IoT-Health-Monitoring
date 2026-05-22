const mongoose = require('mongoose');

const GamificationSchema = new mongoose.Schema({
  userId:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  xp:                  { type: Number, default: 0 },
  level:               { type: Number, default: 1 },
  streak:              { type: Number, default: 0 },
  longestStreak:       { type: Number, default: 0 },
  mealsLogged:         { type: Number, default: 0 },
  scansCompleted:      { type: Number, default: 0 },
  photoScans:          { type: Number, default: 0 },
  badgesEarned:        [{ type: String }],
  challengesCompleted: [{ type: String }],
  lastLogDate:         { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Gamification', GamificationSchema);
