const mongoose = require("mongoose");

const dietSuggestionSchema = new mongoose.Schema({
  heartRateRange: String,
  suggestionText: String
});

module.exports = mongoose.model("DietSuggestion", dietSuggestionSchema);