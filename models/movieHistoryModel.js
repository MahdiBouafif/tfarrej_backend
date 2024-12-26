const mongoose = require("mongoose");

const movieHistorySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  movieId: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
});

const MovieHistory = mongoose.model("MovieHistory", movieHistorySchema);

module.exports = MovieHistory;
