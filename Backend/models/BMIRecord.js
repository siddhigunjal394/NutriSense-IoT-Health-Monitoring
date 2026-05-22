const mongoose = require('mongoose');
const BMIRecordSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weight:        Number,
  height:        Number,
  age:           Number,
  gender:        String,
  activityLevel: String,
  result:        Object,
}, { timestamps: true });
module.exports = mongoose.model('BMIRecord', BMIRecordSchema);